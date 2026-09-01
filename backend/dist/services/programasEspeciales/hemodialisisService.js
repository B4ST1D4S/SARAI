// ============================================================
// Servicio: Hemodiálisis – Programas Especiales
// Normativa: Res. 3241/2008 MINSALUD, Circular 030/2006 SNS
// ============================================================
import prisma from '../../lib/prisma.js';
// ── Inscripción al programa ──────────────────────────────────
export async function listarInscripcionesRenal(params) {
    const { estado, search, skip = 0, take = 50 } = params;
    const programa = await prisma.programaEspecial.findUnique({
        where: { codigo: 'RENAL' },
    });
    if (!programa)
        throw new Error('Programa RENAL no configurado');
    const where = {
        programaId: programa.id,
        ...(estado ? { estado } : {}),
        ...(search
            ? {
                paciente: {
                    OR: [
                        { nombreCompleto: { contains: search, mode: 'insensitive' } },
                        { numeroDocumento: { contains: search } },
                    ],
                },
            }
            : {}),
    };
    const [total, inscripciones] = await Promise.all([
        prisma.inscripcionPrograma.count({ where }),
        prisma.inscripcionPrograma.findMany({
            where,
            skip,
            take,
            orderBy: { fechaIngreso: 'desc' },
            include: {
                paciente: {
                    select: {
                        id: true,
                        nombreCompleto: true,
                        numeroDocumento: true,
                        tipoDocumento: true,
                        fechaNacimiento: true,
                        genero: true,
                        telefonos: true,
                        email: true,
                    },
                },
                historiaRenal: {
                    select: {
                        estadioERC: true,
                        modalidadActual: true,
                        tfgBasal: true,
                        riesgoKDIGO: true,
                    },
                },
                accesosVasculares: {
                    where: { estado: 'ACTIVO' },
                    take: 1,
                },
            },
        }),
    ]);
    return { total, inscripciones };
}
export async function obtenerInscripcion(id) {
    const inscripcion = await prisma.inscripcionPrograma.findUnique({
        where: { id },
        include: {
            paciente: true,
            programa: true,
            historiaRenal: true,
            accesosVasculares: { orderBy: { createdAt: 'desc' } },
            sesionesHD: {
                orderBy: { fechaSesion: 'desc' },
                take: 10,
                include: { maquina: true, accesoVascular: true },
            },
            laboratorios: { orderBy: { fechaToma: 'desc' }, take: 5 },
            eventosAdversos: { orderBy: { fechaEvento: 'desc' }, take: 5 },
            evoluciones: { orderBy: { fechaEvolucion: 'desc' }, take: 10 },
            tamizajesPE: { orderBy: { fechaProgramada: 'asc' } },
        },
    });
    return inscripcion;
}
export async function inscribirPaciente(data) {
    const programa = await prisma.programaEspecial.findUnique({
        where: { codigo: 'RENAL' },
    });
    if (!programa)
        throw new Error('Programa RENAL no configurado');
    // Verificar que no está ya inscrito y activo
    const existe = await prisma.inscripcionPrograma.findFirst({
        where: { pacienteId: data.pacienteId, programaId: programa.id, estado: 'ACTIVO' },
    });
    if (existe)
        throw new Error('El paciente ya está inscrito activamente en el Programa Renal');
    const { historiaRenal, ...insc } = data;
    // Calcular riesgo KDIGO automáticamente
    const riesgoKDIGO = calcularRiesgoKDIGO(historiaRenal.estadioERC, historiaRenal.categoriaAlbuminuria);
    const inscripcion = await prisma.inscripcionPrograma.create({
        data: {
            ...insc,
            programaId: programa.id,
            codigoPrograma: 'RENAL',
            fechaIngreso: data.fechaIngreso ?? new Date(),
            historiaRenal: {
                create: {
                    pacienteId: data.pacienteId,
                    riesgoKDIGO,
                    ...historiaRenal,
                },
            },
        },
        include: { historiaRenal: true, paciente: true },
    });
    // Crear tamizajes por defecto para Hemodiálisis
    await crearTamizajesInicialesHD(inscripcion.id, data.pacienteId);
    return inscripcion;
}
export async function actualizarInscripcion(id, data) {
    return prisma.inscripcionPrograma.update({ where: { id }, data });
}
// ── Historia Clínica Renal ───────────────────────────────────
export async function obtenerHistoriaRenal(inscripcionId) {
    return prisma.historiaClinicaRenal.findUnique({ where: { inscripcionId } });
}
export async function actualizarHistoriaRenal(inscripcionId, data) {
    // Recalcular clasificación KDIGO si cambian estadio o albuminuria
    if (data.estadioERC || data.categoriaAlbuminuria) {
        const actual = await prisma.historiaClinicaRenal.findUnique({
            where: { inscripcionId },
        });
        const estadio = data.estadioERC ?? actual?.estadioERC;
        const albumin = data.categoriaAlbuminuria ?? actual?.categoriaAlbuminuria;
        data.riesgoKDIGO = calcularRiesgoKDIGO(estadio, albumin);
    }
    return prisma.historiaClinicaRenal.upsert({
        where: { inscripcionId },
        update: data,
        create: { inscripcionId, pacienteId: data.pacienteId, ...data },
    });
}
// ── Accesos Vasculares ───────────────────────────────────────
export async function listarAccesosVasculares(inscripcionId) {
    return prisma.accesoVascular.findMany({
        where: { inscripcionId },
        orderBy: { createdAt: 'desc' },
    });
}
export async function crearAccesoVascular(inscripcionId, data) {
    const inscripcion = await prisma.inscripcionPrograma.findUnique({
        where: { id: inscripcionId },
    });
    if (!inscripcion)
        throw new Error('Inscripción no encontrada');
    return prisma.accesoVascular.create({
        data: { ...data, inscripcionId, pacienteId: inscripcion.pacienteId },
    });
}
export async function actualizarAccesoVascular(id, data) {
    return prisma.accesoVascular.update({ where: { id }, data });
}
// ── Sesiones de Hemodiálisis ─────────────────────────────────
export async function listarSesiones(inscripcionId, params) {
    const { skip = 0, take = 30, desde, hasta } = params;
    const where = {
        inscripcionId,
        ...(desde || hasta
            ? { fechaSesion: { ...(desde ? { gte: desde } : {}), ...(hasta ? { lte: hasta } : {}) } }
            : {}),
    };
    const [total, sesiones] = await Promise.all([
        prisma.sesionHemodialisis.count({ where }),
        prisma.sesionHemodialisis.findMany({
            where,
            skip,
            take,
            orderBy: { fechaSesion: 'desc' },
            include: {
                maquina: { select: { codigo: true, marca: true, sillon: true } },
                accesoVascular: { select: { tipo: true, lateralidad: true, estado: true } },
            },
        }),
    ]);
    return { total, sesiones };
}
export async function obtenerSesion(id) {
    return prisma.sesionHemodialisis.findUnique({
        where: { id },
        include: {
            maquina: true,
            accesoVascular: true,
            inscripcion: { include: { paciente: true } },
        },
    });
}
// Campos válidos del modelo SesionHemodialisis (para sanear datos del frontend)
const CAMPOS_SESION = new Set([
    'fechaSesion', 'turno', 'nefrologoId', 'nefrologo', 'enfermeroId', 'enfermero',
    'maquinaId', 'codigoMaquina', 'accesoVascularId', 'sillon',
    'pesoPre', 'pesoSeco', 'gananciaPesoInter',
    'taSistolicaPre', 'taDiastolicaPre', 'frecCardiacaPre', 'temperaturaPre', 'saturacionO2Pre',
    'tiempoPrescrito', 'qbPrescrito', 'qdPrescrito', 'ufPrescrita',
    'concentracionDializado', 'temperaturaDializado', 'filtroTipo', 'filtroLote',
    'filtroReutilizado', 'filtroUsos',
    'tipoAnticoagulacion', 'heparinaInicial', 'heparinaMantenimiento', 'heparinaTotal',
    'tiempoReal', 'qbReal', 'ufReal', 'ktVSesion', 'urrSesion', 'volumeTratado',
    'pesoPost', 'taSistolicaPost', 'taDiastolicaPost', 'frecCardiacaPost',
    'temperaturaPost', 'saturacionO2Post',
    'toleranciaDialisis', 'estadoConciencia',
    'medicamentosSesion', 'signosVitalesIntra', 'incidencias',
    'estadoSesion', 'motivoCancelacion', 'observaciones',
]);
function sanearDatosSesion(data) {
    const clean = {};
    for (const key of Object.keys(data)) {
        if (!CAMPOS_SESION.has(key))
            continue; // descartar campos desconocidos (bunPre, bunPost, etc.)
        const val = data[key];
        // Convertir strings vacíos en FK opcionales a null
        if ((key === 'maquinaId' || key === 'accesoVascularId' || key === 'nefrologoId' || key === 'enfermeroId')
            && val === '') {
            clean[key] = null;
        }
        else {
            clean[key] = val;
        }
    }
    // Asegurar que fechaSesion sea un objeto Date
    if (clean.fechaSesion && typeof clean.fechaSesion === 'string') {
        clean.fechaSesion = new Date(clean.fechaSesion);
    }
    return clean;
}
export async function crearSesion(inscripcionId, data) {
    const inscripcion = await prisma.inscripcionPrograma.findUnique({
        where: { id: inscripcionId },
    });
    if (!inscripcion)
        throw new Error('Inscripción no encontrada');
    // Calcular número de sesión
    const count = await prisma.sesionHemodialisis.count({
        where: { inscripcionId },
    });
    // Calcular URR si hay BUN pre y post disponibles
    const saneado = sanearDatosSesion(data);
    let urrSesion = saneado.urrSesion;
    if (data.bunPre && data.bunPost && !urrSesion) {
        urrSesion = ((data.bunPre - data.bunPost) / data.bunPre) * 100;
    }
    return prisma.sesionHemodialisis.create({
        data: {
            ...saneado,
            inscripcionId,
            pacienteId: inscripcion.pacienteId,
            numeroSesion: count + 1,
            urrSesion,
            estadoSesion: saneado.estadoSesion ?? 'COMPLETADA',
        },
        include: { maquina: true, accesoVascular: true },
    });
}
export async function actualizarSesion(id, data) {
    const saneado = sanearDatosSesion(data);
    // Recalcular URR si vienen BUN
    if (data.bunPre && data.bunPost && !saneado.urrSesion) {
        saneado.urrSesion = ((data.bunPre - data.bunPost) / data.bunPre) * 100;
    }
    return prisma.sesionHemodialisis.update({ where: { id }, data: saneado });
}
// ── Laboratorios Renales ─────────────────────────────────────
export async function listarLaboratorios(inscripcionId, params) {
    const { skip = 0, take = 20, tipo } = params;
    const where = { inscripcionId, ...(tipo ? { tipo } : {}) };
    const [total, laboratorios] = await Promise.all([
        prisma.laboratorioRenal.count({ where }),
        prisma.laboratorioRenal.findMany({
            where,
            skip,
            take,
            orderBy: { fechaToma: 'desc' },
        }),
    ]);
    return { total, laboratorios };
}
export async function crearLaboratorio(inscripcionId, data) {
    const inscripcion = await prisma.inscripcionPrograma.findUnique({
        where: { id: inscripcionId },
    });
    if (!inscripcion)
        throw new Error('Inscripción no encontrada');
    // Calcular producto Ca×P automáticamente
    if (data.calcio && data.fosforo) {
        data.productoCaP = data.calcio * data.fosforo;
    }
    // Calcular TFG con CKD-EPI si hay creatinina
    if (data.creatinina && !data.tfgCalculada) {
        data.tfgCalculada = null; // el frontend debe enviarlo calculado
    }
    return prisma.laboratorioRenal.create({
        data: { ...data, inscripcionId, pacienteId: inscripcion.pacienteId },
    });
}
export async function actualizarLaboratorio(id, data) {
    if (data.calcio && data.fosforo) {
        data.productoCaP = data.calcio * data.fosforo;
    }
    return prisma.laboratorioRenal.update({ where: { id }, data });
}
// ── Eventos Adversos ─────────────────────────────────────────
export async function listarEventos(inscripcionId) {
    return prisma.eventoAdversoPE.findMany({
        where: { inscripcionId },
        orderBy: { fechaEvento: 'desc' },
    });
}
export async function crearEvento(inscripcionId, data) {
    const inscripcion = await prisma.inscripcionPrograma.findUnique({
        where: { id: inscripcionId },
    });
    if (!inscripcion)
        throw new Error('Inscripción no encontrada');
    return prisma.eventoAdversoPE.create({
        data: { ...data, inscripcionId, pacienteId: inscripcion.pacienteId },
    });
}
// ── Evoluciones Multidisciplinarias ─────────────────────────
export async function listarEvoluciones(inscripcionId, disciplina) {
    return prisma.evolucionMultidisciplinaria.findMany({
        where: { inscripcionId, ...(disciplina ? { disciplina } : {}) },
        orderBy: { fechaEvolucion: 'desc' },
    });
}
export async function crearEvolucion(inscripcionId, data) {
    const inscripcion = await prisma.inscripcionPrograma.findUnique({
        where: { id: inscripcionId },
    });
    if (!inscripcion)
        throw new Error('Inscripción no encontrada');
    return prisma.evolucionMultidisciplinaria.create({
        data: { ...data, inscripcionId, pacienteId: inscripcion.pacienteId },
    });
}
// ── Máquinas de Diálisis ─────────────────────────────────────
export async function listarMaquinas(sedeId) {
    return prisma.maquinaDialisis.findMany({
        where: { ...(sedeId ? { sedeId } : {}), estado: 'ACTIVO' },
        orderBy: { codigo: 'asc' },
    });
}
export async function crearMaquina(data) {
    return prisma.maquinaDialisis.create({ data });
}
export async function actualizarMaquina(id, data) {
    return prisma.maquinaDialisis.update({ where: { id }, data });
}
// ── Dashboard / KPIs ─────────────────────────────────────────
export async function getDashboardRenal(sedeId) {
    const programa = await prisma.programaEspecial.findUnique({
        where: { codigo: 'RENAL' },
    });
    if (!programa)
        return null;
    const [totalActivos, totalHD, totalDP, totalPredialisis, totalTraslado, totalFallecidos, sesionesHoy, eventosRecientes, laboratoriosRecientes,] = await Promise.all([
        prisma.inscripcionPrograma.count({
            where: { programaId: programa.id, estado: 'ACTIVO' },
        }),
        prisma.inscripcionPrograma.count({
            where: {
                programaId: programa.id,
                estado: 'ACTIVO',
                historiaRenal: { modalidadActual: 'HEMODIALISIS' },
            },
        }),
        prisma.inscripcionPrograma.count({
            where: {
                programaId: programa.id,
                estado: 'ACTIVO',
                historiaRenal: { modalidadActual: 'DIALISIS_PERITONEAL' },
            },
        }),
        prisma.inscripcionPrograma.count({
            where: {
                programaId: programa.id,
                estado: 'ACTIVO',
                historiaRenal: { modalidadActual: 'PREDIALISIS' },
            },
        }),
        prisma.inscripcionPrograma.count({
            where: { programaId: programa.id, estado: 'TRASLADADO' },
        }),
        prisma.inscripcionPrograma.count({
            where: { programaId: programa.id, estado: 'FALLECIDO' },
        }),
        prisma.sesionHemodialisis.count({
            where: {
                fechaSesion: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    lte: new Date(new Date().setHours(23, 59, 59, 999)),
                },
            },
        }),
        prisma.eventoAdversoPE.findMany({
            where: { inscripcion: { programaId: programa.id } },
            orderBy: { fechaEvento: 'desc' },
            take: 5,
            include: { inscripcion: { include: { paciente: { select: { nombreCompleto: true } } } } },
        }),
        prisma.laboratorioRenal.findMany({
            where: { inscripcion: { programaId: programa.id } },
            orderBy: { createdAt: 'desc' },
            take: 5,
        }),
    ]);
    // KPI de adecuación (Kt/V promedio últimas sesiones)
    const ktVPromedio = await prisma.sesionHemodialisis.aggregate({
        where: {
            inscripcion: { programaId: programa.id },
            estadoSesion: 'COMPLETADA',
            ktVSesion: { not: null },
            fechaSesion: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        _avg: { ktVSesion: true },
    });
    return {
        pacientes: {
            totalActivos,
            totalHD,
            totalDP,
            totalPredialisis,
            totalTraslado,
            totalFallecidos,
        },
        sesionesHoy,
        adecuacion: {
            ktVPromedio30d: ktVPromedio._avg.ktVSesion
                ? Math.round(ktVPromedio._avg.ktVSesion * 100) / 100
                : null,
            metaKtV: 1.2,
        },
        eventosRecientes,
        laboratoriosRecientes,
    };
}
// ── Tamizajes ─────────────────────────────────────────────────
export async function listarTamizajes(inscripcionId) {
    return prisma.tamizajePE.findMany({
        where: { inscripcionId },
        orderBy: { fechaProgramada: 'asc' },
    });
}
export async function actualizarTamizaje(id, data) {
    return prisma.tamizajePE.update({ where: { id }, data });
}
// ── Helpers privados ─────────────────────────────────────────
/**
 * Calcula el riesgo KDIGO según combinación estadio ERC (G) y albuminuria (A)
 * Basado en tabla KDIGO 2012/2022
 */
function calcularRiesgoKDIGO(estadio, albuminuria) {
    if (!estadio || !albuminuria)
        return 'DESCONOCIDO';
    const grid = {
        G1: { A1: 'BAJO', A2: 'MODERADO', A3: 'ALTO' },
        G2: { A1: 'BAJO', A2: 'MODERADO', A3: 'ALTO' },
        G3a: { A1: 'MODERADO', A2: 'ALTO', A3: 'MUY_ALTO' },
        G3b: { A1: 'ALTO', A2: 'MUY_ALTO', A3: 'MUY_ALTO' },
        G4: { A1: 'MUY_ALTO', A2: 'MUY_ALTO', A3: 'MUY_ALTO' },
        G5: { A1: 'MUY_ALTO', A2: 'MUY_ALTO', A3: 'MUY_ALTO' },
        G5D: { A1: 'MUY_ALTO', A2: 'MUY_ALTO', A3: 'MUY_ALTO' },
    };
    return grid[estadio]?.[albuminuria] ?? 'DESCONOCIDO';
}
/**
 * Crea tamizajes iniciales obligatorios para paciente en HD
 * Basado en Res. 3241/2008 y guías de la Cuenta de Alto Costo
 */
async function crearTamizajesInicialesHD(inscripcionId, pacienteId) {
    const tamizajes = [
        { tipo: 'HEPATITIS_B_HBsAg', descripcion: 'Antígeno de superficie Hepatitis B', periodicidad: 'SEMESTRAL' },
        { tipo: 'ANTI_HBs', descripcion: 'Anticuerpos anti HBs (estado vacunal)', periodicidad: 'SEMESTRAL' },
        { tipo: 'HEPATITIS_C_AntiHCV', descripcion: 'Anticuerpos anti VHC', periodicidad: 'SEMESTRAL' },
        { tipo: 'VIH_AntiHIV', descripcion: 'Anticuerpos anti VIH 1/2', periodicidad: 'ANUAL' },
        { tipo: 'VDRL_SIFILIS', descripcion: 'VDRL – Serología sífilis', periodicidad: 'ANUAL' },
        { tipo: 'VARICELA', descripcion: 'Serología varicela (inmunidad)', periodicidad: 'UNICO' },
        { tipo: 'INFLUENZA_VACUNA', descripcion: 'Vacunación influenza anual', periodicidad: 'ANUAL' },
        { tipo: 'HEPATITIS_B_VACUNA', descripcion: 'Vacunación hepatitis B (esquema)', periodicidad: 'UNICO' },
        { tipo: 'NEUMOCOCO_VACUNA', descripcion: 'Vacunación antineumocócica', periodicidad: 'UNICO' },
        { tipo: 'ECOCARDIOGRAMA', descripcion: 'Ecocardiograma Doppler', periodicidad: 'ANUAL' },
        { tipo: 'FONDO_RETINA', descripcion: 'Fondo de ojo – Retinopatía', periodicidad: 'ANUAL' },
    ];
    await prisma.tamizajePE.createMany({
        data: tamizajes.map((t) => ({
            inscripcionId,
            pacienteId,
            codigoPrograma: 'RENAL',
            estado: 'PENDIENTE',
            fechaProgramada: new Date(),
            ...t,
        })),
    });
}
