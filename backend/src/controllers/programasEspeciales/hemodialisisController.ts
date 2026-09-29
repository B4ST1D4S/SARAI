import { Request, Response } from 'express';
import * as svc from '../../services/programasEspeciales/hemodialisisService.js';
import * as turSvc from '../../services/programasEspeciales/turnosSerologiaService.js';
import * as paramSvc from '../../services/programasEspeciales/parametrizacionService.js';

// ── Parametrización HD ────────────────────────────────────────

export async function getParametrizacion(req: Request, res: Response) {
  try { res.json(await paramSvc.getParametrizacionHD()); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
}

export async function putParametrizacion(req: Request, res: Response) {
  try { res.json(await paramSvc.saveParametrizacionHD(req.body)); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
}

// Sillones
export async function postSillon(req: Request, res: Response) {
  try { res.status(201).json(await paramSvc.crearSillon(req.body)); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
}
export async function patchSillon(req: Request, res: Response) {
  try { res.json(await paramSvc.actualizarSillon(req.params.id, req.body)); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
}
export async function deleteSillon(req: Request, res: Response) {
  try { res.json(await paramSvc.eliminarSillon(req.params.id)); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
}

// Esquemas
export async function postEsquema(req: Request, res: Response) {
  try { res.status(201).json(await paramSvc.crearEsquema(req.body)); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
}
export async function patchEsquema(req: Request, res: Response) {
  try { res.json(await paramSvc.actualizarEsquema(req.params.id, req.body)); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
}
export async function deleteEsquema(req: Request, res: Response) {
  try { res.json(await paramSvc.eliminarEsquema(req.params.id)); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
}

// Jornadas
export async function postJornada(req: Request, res: Response) {
  try { res.status(201).json(await paramSvc.crearJornada(req.body)); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
}
export async function patchJornada(req: Request, res: Response) {
  try { res.json(await paramSvc.actualizarJornada(req.params.id, req.body)); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
}
export async function deleteJornada(req: Request, res: Response) {
  try { res.json(await paramSvc.eliminarJornada(req.params.id)); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
}



export async function getInscripciones(req: Request, res: Response) {
  try {
    const { estado, search, skip, take } = req.query as any;
    const result = await svc.listarInscripcionesRenal({
      estado,
      search,
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
    });
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

export async function getInscripcion(req: Request, res: Response) {
  try {
    const item = await svc.obtenerInscripcion(req.params.id);
    if (!item) return res.status(404).json({ error: 'Inscripción no encontrada' });
    res.json(item);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

export async function postInscripcion(req: Request, res: Response) {
  try {
    const inscripcion = await svc.inscribirPaciente(req.body);
    res.status(201).json(inscripcion);
  } catch (e: any) {
    const status = e.message.includes('ya está inscrito') ? 409 : 500;
    res.status(status).json({ error: e.message });
  }
}

export async function patchInscripcion(req: Request, res: Response) {
  try {
    const updated = await svc.actualizarInscripcion(req.params.id, req.body);
    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

// ── Historia Clínica Renal ───────────────────────────────────

export async function getHistoriaRenal(req: Request, res: Response) {
  try {
    const h = await svc.obtenerHistoriaRenal(req.params.inscripcionId);
    if (!h) return res.status(404).json({ error: 'Historia renal no encontrada' });
    res.json(h);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

export async function patchHistoriaRenal(req: Request, res: Response) {
  try {
    const h = await svc.actualizarHistoriaRenal(req.params.inscripcionId, req.body);
    res.json(h);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

// ── Accesos Vasculares ───────────────────────────────────────

export async function getAccesos(req: Request, res: Response) {
  try {
    const accesos = await svc.listarAccesosVasculares(req.params.inscripcionId);
    res.json(accesos);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

export async function postAcceso(req: Request, res: Response) {
  try {
    const acceso = await svc.crearAccesoVascular(req.params.inscripcionId, req.body);
    res.status(201).json(acceso);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

export async function patchAcceso(req: Request, res: Response) {
  try {
    const updated = await svc.actualizarAccesoVascular(req.params.id, req.body);
    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

// ── Sesiones de Hemodiálisis ─────────────────────────────────

export async function getSesiones(req: Request, res: Response) {
  try {
    const { skip, take, desde, hasta } = req.query as any;
    const result = await svc.listarSesiones(req.params.inscripcionId, {
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
      desde: desde ? new Date(desde) : undefined,
      hasta: hasta ? new Date(hasta) : undefined,
    });
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

export async function getSesion(req: Request, res: Response) {
  try {
    const sesion = await svc.obtenerSesion(req.params.id);
    if (!sesion) return res.status(404).json({ error: 'Sesión no encontrada' });
    res.json(sesion);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

export async function postSesion(req: Request, res: Response) {
  try {
    const sesion = await svc.crearSesion(req.params.inscripcionId, req.body);
    res.status(201).json(sesion);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

export async function patchSesion(req: Request, res: Response) {
  try {
    const updated = await svc.actualizarSesion(req.params.id, req.body);
    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

// ── Laboratorios Renales ─────────────────────────────────────

export async function getLaboratorios(req: Request, res: Response) {
  try {
    const { skip, take, tipo } = req.query as any;
    const result = await svc.listarLaboratorios(req.params.inscripcionId, {
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
      tipo,
    });
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

export async function postLaboratorio(req: Request, res: Response) {
  try {
    const lab = await svc.crearLaboratorio(req.params.inscripcionId, req.body);
    res.status(201).json(lab);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

export async function patchLaboratorio(req: Request, res: Response) {
  try {
    const updated = await svc.actualizarLaboratorio(req.params.id, req.body);
    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

// ── Eventos Adversos ─────────────────────────────────────────

export async function getEventos(req: Request, res: Response) {
  try {
    const eventos = await svc.listarEventos(req.params.inscripcionId);
    res.json(eventos);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

export async function postEvento(req: Request, res: Response) {
  try {
    const evento = await svc.crearEvento(req.params.inscripcionId, req.body);
    res.status(201).json(evento);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

// ── Evoluciones Multidisciplinarias ─────────────────────────

export async function getEvoluciones(req: Request, res: Response) {
  try {
    const { disciplina } = req.query as any;
    const evo = await svc.listarEvoluciones(req.params.inscripcionId, disciplina);
    res.json(evo);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

export async function postEvolucion(req: Request, res: Response) {
  try {
    const evo = await svc.crearEvolucion(req.params.inscripcionId, req.body);
    res.status(201).json(evo);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

// ── Máquinas ─────────────────────────────────────────────────

export async function getMaquinas(req: Request, res: Response) {
  try {
    const { sedeId } = req.query as any;
    const maquinas = await svc.listarMaquinas(sedeId);
    res.json(maquinas);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

export async function postMaquina(req: Request, res: Response) {
  try {
    const m = await svc.crearMaquina(req.body);
    res.status(201).json(m);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

export async function patchMaquina(req: Request, res: Response) {
  try {
    const m = await svc.actualizarMaquina(req.params.id, req.body);
    res.json(m);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

// ── Dashboard ────────────────────────────────────────────────

export async function getDashboard(req: Request, res: Response) {
  try {
    const { sedeId } = req.query as any;
    const data = await svc.getDashboardRenal(sedeId);
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

// ── HD-02: Turnos ─────────────────────────────────────────────

export async function getTurnos(req: Request, res: Response) {
  try {
    const { esquema, jornada, activo } = req.query as any;
    const data = await turSvc.listarTurnos({
      esquema,
      jornada,
      activo: activo === 'false' ? false : true,
    });
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

export async function getTurnoByInscripcion(req: Request, res: Response) {
  try {
    const turno = await turSvc.obtenerTurnoPorInscripcion(req.params.inscripcionId);
    res.json(turno ?? null);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

export async function postTurno(req: Request, res: Response) {
  try {
    const turno = await turSvc.asignarTurno(req.body);
    res.status(201).json(turno);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

export async function deleteTurno(req: Request, res: Response) {
  try {
    await turSvc.inactivarTurno(req.params.inscripcionId);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

export async function getContadoresDia(req: Request, res: Response) {
  try {
    const data = await turSvc.contadoresDia();
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

// ── P3: Serología ─────────────────────────────────────────────

export async function getSerologia(req: Request, res: Response) {
  try {
    const data = await turSvc.listarSerologia(req.params.inscripcionId);
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

export async function postSerologia(req: Request, res: Response) {
  try {
    const { inscripcionId } = req.params;
    // Necesitamos el pacienteId — lo sacamos de la inscripción
    const prisma = (await import('../../lib/prisma.js')).default;
    const insc = await prisma.inscripcionPrograma.findUnique({
      where: { id: inscripcionId },
      select: { pacienteId: true },
    });
    if (!insc) return res.status(404).json({ error: 'Inscripción no encontrada' });
    const resultado = await turSvc.guardarResultadoSerologico(
      inscripcionId,
      insc.pacienteId,
      req.body
    );
    res.status(201).json(resultado);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

// ── Tamizajes ─────────────────────────────────────────────────

export async function getTamizajes(req: Request, res: Response) {
  try {
    const items = await svc.listarTamizajes(req.params.inscripcionId);
    res.json(items);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

export async function patchTamizaje(req: Request, res: Response) {
  try {
    const item = await svc.actualizarTamizaje(req.params.id, req.body);
    res.json(item);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}
