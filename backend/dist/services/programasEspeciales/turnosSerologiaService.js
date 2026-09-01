// ============================================================
// Servicio: Turnos HD + Serología – Fase 1
// Normativa: Res. 3241/2008 MINSALUD, KDIGO 2022
// ============================================================
import prisma from '../../lib/prisma.js';
// ── Días de la semana por esquema ──────────────────────────
// LMV: Lunes(1), Miércoles(3), Viernes(5)
// MJS: Martes(2), Jueves(4), Sábado(6)
const DIAS_ESQUEMA = {
    LMV: [1, 3, 5],
    MJS: [2, 4, 6],
};
function tieneJornadaHoy(esquema) {
    const hoy = new Date().getDay(); // 0=Dom, 1=Lun...
    return (DIAS_ESQUEMA[esquema] ?? []).includes(hoy);
}
// ── HD-02: Turnos de Hemodiálisis ────────────────────────────
export async function listarTurnos(params) {
    const { esquema, jornada, activo = true } = params;
    return prisma.turnoHD.findMany({
        where: {
            activo,
            ...(esquema ? { esquema } : {}),
            ...(jornada ? { jornada } : {}),
        },
        include: {
            inscripcion: {
                include: {
                    paciente: {
                        select: {
                            id: true,
                            nombreCompleto: true,
                            numeroDocumento: true,
                            tipoDocumento: true,
                            fechaNacimiento: true,
                            genero: true,
                        },
                    },
                    historiaRenal: {
                        select: { estadioERC: true, riesgoKDIGO: true, modalidadActual: true },
                    },
                },
            },
            maquina: { select: { id: true, codigo: true, marca: true, sillon: true } },
        },
        orderBy: [{ jornada: 'asc' }, { createdAt: 'asc' }],
    });
}
export async function obtenerTurnoPorInscripcion(inscripcionId) {
    return prisma.turnoHD.findUnique({
        where: { inscripcionId },
        include: {
            maquina: { select: { id: true, codigo: true, marca: true, sillon: true } },
        },
    });
}
export async function asignarTurno(data) {
    const { inscripcionId, ...resto } = data;
    // Upsert: si ya existe un turno, actualiza; si no, crea
    return prisma.turnoHD.upsert({
        where: { inscripcionId },
        create: {
            inscripcionId,
            ...resto,
            activo: true,
            fechaInicio: new Date(),
        },
        update: {
            ...resto,
            activo: true,
            fechaFin: null,
            updatedAt: new Date(),
        },
        include: {
            maquina: { select: { id: true, codigo: true, marca: true, sillon: true } },
        },
    });
}
export async function inactivarTurno(inscripcionId) {
    return prisma.turnoHD.update({
        where: { inscripcionId },
        data: { activo: false, fechaFin: new Date() },
    });
}
// ── P6: Contadores del día ────────────────────────────────────
export async function contadoresDia() {
    const hoy = new Date();
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0, 0);
    const fin = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59);
    const diaHoy = hoy.getDay();
    // Programados hoy: turnos activos cuyo esquema corresponde al día de hoy
    const todosLosTurnos = await prisma.turnoHD.findMany({
        where: { activo: true },
        select: { esquema: true },
    });
    const programadosHoy = todosLosTurnos.filter((t) => (DIAS_ESQUEMA[t.esquema] ?? []).includes(diaHoy)).length;
    // Sesiones de hoy
    const sesionesHoy = await prisma.sesionHemodialisis.findMany({
        where: { fechaSesion: { gte: inicio, lte: fin } },
        select: { estadoSesion: true },
    });
    const enSala = sesionesHoy.filter((s) => s.estadoSesion === 'EN_CURSO').length;
    const finalizados = sesionesHoy.filter((s) => s.estadoSesion === 'COMPLETADA').length;
    const suspendidos = sesionesHoy.filter((s) => s.estadoSesion === 'SUSPENDIDA').length;
    // Ausentes = programados - los que ya tienen sesión hoy (cualquier estado)
    const conSesionHoy = sesionesHoy.length;
    const ausentes = Math.max(0, programadosHoy - conSesionHoy);
    return { programadosHoy, enSala, finalizados, suspendidos, ausentes };
}
// ── P3: Serología ─────────────────────────────────────────────
// Marcadores estándar por norma colombiana para HD
export const MARCADORES_HD = [
    'HBsAg',
    'AntiHBc',
    'AntiHBs',
    'AntiHVC',
    'HIV',
    'VDRL',
    'HBeAg',
    'AntiHBe',
];
export async function listarSerologia(inscripcionId) {
    const registros = await prisma.resultadoSerologico.findMany({
        where: { inscripcionId },
        orderBy: [{ marcador: 'asc' }, { createdAt: 'desc' }],
    });
    // Asegurar que estén los 8 marcadores aunque no haya resultados
    const mapa = {};
    for (const m of MARCADORES_HD)
        mapa[m] = null;
    for (const r of registros)
        mapa[r.marcador] = r;
    return { registros, mapa, marcadores: MARCADORES_HD };
}
export async function guardarResultadoSerologico(inscripcionId, pacienteId, data) {
    const { marcador, ...resto } = data;
    const payload = {
        ...resto,
        fechaToma: resto.fechaToma ? new Date(resto.fechaToma) : null,
        fechaResultado: resto.fechaResultado ? new Date(resto.fechaResultado) : null,
    };
    // Buscar si ya existe registro para este marcador
    const existente = await prisma.resultadoSerologico.findFirst({
        where: { inscripcionId, marcador },
        orderBy: { createdAt: 'desc' },
    });
    if (existente) {
        return prisma.resultadoSerologico.update({
            where: { id: existente.id },
            data: payload,
        });
    }
    return prisma.resultadoSerologico.create({
        data: { inscripcionId, pacienteId, marcador, ...payload },
    });
}
export async function obtenerEstadoSerologico(inscripcionId) {
    const { mapa } = await listarSerologia(inscripcionId);
    // Determinar si el perfil está completo (todos tienen resultado no pendiente)
    const pendientes = Object.values(mapa).filter((r) => !r || r.resultado === 'PENDIENTE').length;
    const reactivos = Object.values(mapa).filter((r) => r?.resultado === 'REACTIVO');
    return {
        completo: pendientes === 0,
        pendientes,
        reactivos: reactivos.map((r) => r.marcador),
        hayRiesgo: reactivos.length > 0,
    };
}
