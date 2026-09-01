import * as svc from '../../services/programasEspeciales/hemodialisisService.js';
import * as turSvc from '../../services/programasEspeciales/turnosSerologiaService.js';
// ── Inscripciones ────────────────────────────────────────────
export async function getInscripciones(req, res) {
    try {
        const { estado, search, skip, take } = req.query;
        const result = await svc.listarInscripcionesRenal({
            estado,
            search,
            skip: skip ? Number(skip) : undefined,
            take: take ? Number(take) : undefined,
        });
        res.json(result);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
}
export async function getInscripcion(req, res) {
    try {
        const item = await svc.obtenerInscripcion(req.params.id);
        if (!item)
            return res.status(404).json({ error: 'Inscripción no encontrada' });
        res.json(item);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
}
export async function postInscripcion(req, res) {
    try {
        const inscripcion = await svc.inscribirPaciente(req.body);
        res.status(201).json(inscripcion);
    }
    catch (e) {
        const status = e.message.includes('ya está inscrito') ? 409 : 500;
        res.status(status).json({ error: e.message });
    }
}
export async function patchInscripcion(req, res) {
    try {
        const updated = await svc.actualizarInscripcion(req.params.id, req.body);
        res.json(updated);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
}
// ── Historia Clínica Renal ───────────────────────────────────
export async function getHistoriaRenal(req, res) {
    try {
        const h = await svc.obtenerHistoriaRenal(req.params.inscripcionId);
        if (!h)
            return res.status(404).json({ error: 'Historia renal no encontrada' });
        res.json(h);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
}
export async function patchHistoriaRenal(req, res) {
    try {
        const h = await svc.actualizarHistoriaRenal(req.params.inscripcionId, req.body);
        res.json(h);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
}
// ── Accesos Vasculares ───────────────────────────────────────
export async function getAccesos(req, res) {
    try {
        const accesos = await svc.listarAccesosVasculares(req.params.inscripcionId);
        res.json(accesos);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
}
export async function postAcceso(req, res) {
    try {
        const acceso = await svc.crearAccesoVascular(req.params.inscripcionId, req.body);
        res.status(201).json(acceso);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
}
export async function patchAcceso(req, res) {
    try {
        const updated = await svc.actualizarAccesoVascular(req.params.id, req.body);
        res.json(updated);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
}
// ── Sesiones de Hemodiálisis ─────────────────────────────────
export async function getSesiones(req, res) {
    try {
        const { skip, take, desde, hasta } = req.query;
        const result = await svc.listarSesiones(req.params.inscripcionId, {
            skip: skip ? Number(skip) : undefined,
            take: take ? Number(take) : undefined,
            desde: desde ? new Date(desde) : undefined,
            hasta: hasta ? new Date(hasta) : undefined,
        });
        res.json(result);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
}
export async function getSesion(req, res) {
    try {
        const sesion = await svc.obtenerSesion(req.params.id);
        if (!sesion)
            return res.status(404).json({ error: 'Sesión no encontrada' });
        res.json(sesion);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
}
export async function postSesion(req, res) {
    try {
        const sesion = await svc.crearSesion(req.params.inscripcionId, req.body);
        res.status(201).json(sesion);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
}
export async function patchSesion(req, res) {
    try {
        const updated = await svc.actualizarSesion(req.params.id, req.body);
        res.json(updated);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
}
// ── Laboratorios Renales ─────────────────────────────────────
export async function getLaboratorios(req, res) {
    try {
        const { skip, take, tipo } = req.query;
        const result = await svc.listarLaboratorios(req.params.inscripcionId, {
            skip: skip ? Number(skip) : undefined,
            take: take ? Number(take) : undefined,
            tipo,
        });
        res.json(result);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
}
export async function postLaboratorio(req, res) {
    try {
        const lab = await svc.crearLaboratorio(req.params.inscripcionId, req.body);
        res.status(201).json(lab);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
}
export async function patchLaboratorio(req, res) {
    try {
        const updated = await svc.actualizarLaboratorio(req.params.id, req.body);
        res.json(updated);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
}
// ── Eventos Adversos ─────────────────────────────────────────
export async function getEventos(req, res) {
    try {
        const eventos = await svc.listarEventos(req.params.inscripcionId);
        res.json(eventos);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
}
export async function postEvento(req, res) {
    try {
        const evento = await svc.crearEvento(req.params.inscripcionId, req.body);
        res.status(201).json(evento);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
}
// ── Evoluciones Multidisciplinarias ─────────────────────────
export async function getEvoluciones(req, res) {
    try {
        const { disciplina } = req.query;
        const evo = await svc.listarEvoluciones(req.params.inscripcionId, disciplina);
        res.json(evo);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
}
export async function postEvolucion(req, res) {
    try {
        const evo = await svc.crearEvolucion(req.params.inscripcionId, req.body);
        res.status(201).json(evo);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
}
// ── Máquinas ─────────────────────────────────────────────────
export async function getMaquinas(req, res) {
    try {
        const { sedeId } = req.query;
        const maquinas = await svc.listarMaquinas(sedeId);
        res.json(maquinas);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
}
export async function postMaquina(req, res) {
    try {
        const m = await svc.crearMaquina(req.body);
        res.status(201).json(m);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
}
export async function patchMaquina(req, res) {
    try {
        const m = await svc.actualizarMaquina(req.params.id, req.body);
        res.json(m);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
}
// ── Dashboard ────────────────────────────────────────────────
export async function getDashboard(req, res) {
    try {
        const { sedeId } = req.query;
        const data = await svc.getDashboardRenal(sedeId);
        res.json(data);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
}
// ── HD-02: Turnos ─────────────────────────────────────────────
export async function getTurnos(req, res) {
    try {
        const { esquema, jornada, activo } = req.query;
        const data = await turSvc.listarTurnos({
            esquema,
            jornada,
            activo: activo === 'false' ? false : true,
        });
        res.json(data);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
}
export async function getTurnoByInscripcion(req, res) {
    try {
        const turno = await turSvc.obtenerTurnoPorInscripcion(req.params.inscripcionId);
        res.json(turno ?? null);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
}
export async function postTurno(req, res) {
    try {
        const turno = await turSvc.asignarTurno(req.body);
        res.status(201).json(turno);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
}
export async function deleteTurno(req, res) {
    try {
        await turSvc.inactivarTurno(req.params.inscripcionId);
        res.json({ ok: true });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
}
export async function getContadoresDia(req, res) {
    try {
        const data = await turSvc.contadoresDia();
        res.json(data);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
}
// ── P3: Serología ─────────────────────────────────────────────
export async function getSerologia(req, res) {
    try {
        const data = await turSvc.listarSerologia(req.params.inscripcionId);
        res.json(data);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
}
export async function postSerologia(req, res) {
    try {
        const { inscripcionId } = req.params;
        // Necesitamos el pacienteId — lo sacamos de la inscripción
        const prisma = (await import('../../lib/prisma.js')).default;
        const insc = await prisma.inscripcionPrograma.findUnique({
            where: { id: inscripcionId },
            select: { pacienteId: true },
        });
        if (!insc)
            return res.status(404).json({ error: 'Inscripción no encontrada' });
        const resultado = await turSvc.guardarResultadoSerologico(inscripcionId, insc.pacienteId, req.body);
        res.status(201).json(resultado);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
}
// ── Tamizajes ─────────────────────────────────────────────────
export async function getTamizajes(req, res) {
    try {
        const items = await svc.listarTamizajes(req.params.inscripcionId);
        res.json(items);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
}
export async function patchTamizaje(req, res) {
    try {
        const item = await svc.actualizarTamizaje(req.params.id, req.body);
        res.json(item);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
}
