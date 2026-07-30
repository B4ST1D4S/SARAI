import { Request, Response } from 'express';
import * as svc from '../services/contratacionService.js';

// ─── STATS ──────────────────────────────────────────────────────────────────

export async function getStats(req: Request, res: Response): Promise<void> {
  try {
    const stats = await svc.getStats();
    res.json({ success: true, stats });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// ─── EMPRESAS ───────────────────────────────────────────────────────────────

export async function listEmpresas(req: Request, res: Response): Promise<void> {
  try {
    const soloActivas = req.query.activas === 'true';
    const empresas = await svc.getEmpresas(soloActivas);
    res.json({ success: true, empresas });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function getEmpresa(req: Request, res: Response): Promise<void> {
  try {
    const empresa = await svc.getEmpresaById(req.params.id);
    res.json({ success: true, empresa });
  } catch (error: any) {
    const status = error.message.includes('no encontrada') ? 404 : 500;
    res.status(status).json({ error: error.message });
  }
}

export async function createEmpresa(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) { res.status(401).json({ error: 'No autenticado' }); return; }
    const { razonSocial, nit } = req.body;
    if (!razonSocial || !nit) {
      res.status(400).json({ error: 'razonSocial y nit son obligatorios' });
      return;
    }
    const empresa = await svc.createEmpresa(req.body);
    res.status(201).json({ success: true, empresa });
  } catch (error: any) {
    const status = error.message.includes('Ya existe') ? 409 : 500;
    res.status(status).json({ error: error.message });
  }
}

export async function updateEmpresa(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) { res.status(401).json({ error: 'No autenticado' }); return; }
    const empresa = await svc.updateEmpresa(req.params.id, req.body);
    res.json({ success: true, empresa });
  } catch (error: any) {
    const status = error.message.includes('no encontrada') ? 404 : 500;
    res.status(status).json({ error: error.message });
  }
}

// ─── CONTRATOS ──────────────────────────────────────────────────────────────

export async function listContratos(req: Request, res: Response): Promise<void> {
  try {
    const { estado, empresaId, busqueda } = req.query as Record<string, string>;
    const contratos = await svc.getContratos({ estado, empresaId, busqueda });
    res.json({ success: true, contratos });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function getContrato(req: Request, res: Response): Promise<void> {
  try {
    const contrato = await svc.getContratoById(req.params.id);
    res.json({ success: true, contrato });
  } catch (error: any) {
    const status = error.message.includes('no encontrado') ? 404 : 500;
    res.status(status).json({ error: error.message });
  }
}

export async function createContrato(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) { res.status(401).json({ error: 'No autenticado' }); return; }
    const { descripcion, empresaId, fechaInicio, fechaFin } = req.body;
    if (!descripcion || !empresaId || !fechaInicio || !fechaFin) {
      res.status(400).json({ error: 'descripcion, empresaId, fechaInicio y fechaFin son obligatorios' });
      return;
    }
    const contrato = await svc.createContrato({ ...req.body, creadoPorId: req.user.userId });
    res.status(201).json({ success: true, contrato });
  } catch (error: any) {
    const status = error.message.includes('no encontrada') ? 404 : 500;
    res.status(status).json({ error: error.message });
  }
}

export async function updateContrato(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) { res.status(401).json({ error: 'No autenticado' }); return; }
    const contrato = await svc.updateContrato(req.params.id, req.body);
    res.json({ success: true, contrato });
  } catch (error: any) {
    const status = error.message.includes('no encontrado') ? 404 : 500;
    res.status(status).json({ error: error.message });
  }
}

export async function cambiarEstado(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) { res.status(401).json({ error: 'No autenticado' }); return; }
    const { estado } = req.body;
    if (!estado) { res.status(400).json({ error: 'estado es obligatorio' }); return; }
    const contrato = await svc.cambiarEstadoContrato(req.params.id, estado, req.user.userId);
    res.json({ success: true, contrato });
  } catch (error: any) {
    const status = error.message.includes('no encontrado') ? 404 : 400;
    res.status(status).json({ error: error.message });
  }
}

// ─── TARIFAS ────────────────────────────────────────────────────────────────

export async function upsertTarifa(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) { res.status(401).json({ error: 'No autenticado' }); return; }
    const { codigoCUPS, descripcionCUPS, precioBase, precioNegociado } = req.body;
    if (!codigoCUPS || !descripcionCUPS || precioBase == null || precioNegociado == null) {
      res.status(400).json({ error: 'codigoCUPS, descripcionCUPS, precioBase y precioNegociado son obligatorios' });
      return;
    }
    const tarifa = await svc.upsertTarifa({ contratoId: req.params.id, ...req.body });
    res.status(201).json({ success: true, tarifa });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function deleteTarifa(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) { res.status(401).json({ error: 'No autenticado' }); return; }
    await svc.deleteTarifa(req.params.id, req.params.tarifaId);
    res.json({ success: true, message: 'Tarifa eliminada' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// ─── EXCEPCIONES (rangos por tipo de afiliado, copagos/cuotas moderadoras) ──

export async function listExcepciones(req: Request, res: Response): Promise<void> {
  try {
    const excepciones = await svc.getExcepciones(req.params.id);
    res.json({ success: true, excepciones });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function createExcepcion(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) { res.status(401).json({ error: 'No autenticado' }); return; }
    const excepcion = await svc.createExcepcion({ contratoId: req.params.id, ...req.body });
    res.status(201).json({ success: true, excepcion });
  } catch (error: any) {
    const status = error.message.includes('no encontrado') ? 404 : 400;
    res.status(status).json({ error: error.message });
  }
}

export async function deleteExcepcion(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) { res.status(401).json({ error: 'No autenticado' }); return; }
    await svc.deleteExcepcion(req.params.id, req.params.excepcionId);
    res.json({ success: true, message: 'Excepción eliminada' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// ─── CLONAR CONTRATO ────────────────────────────────────────────────────────

export async function clonarContrato(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) { res.status(401).json({ error: 'No autenticado' }); return; }
    const { descripcion, empresaId, fechaInicio, fechaFin } = req.body;
    if (!descripcion || !empresaId || !fechaInicio || !fechaFin) {
      res.status(400).json({ error: 'descripcion, empresaId, fechaInicio y fechaFin son obligatorios' });
      return;
    }
    const contrato = await svc.clonarContrato(req.params.id, { ...req.body, creadoPorId: req.user.userId });
    res.status(201).json({ success: true, contrato });
  } catch (error: any) {
    const status = error.message.includes('no encontrad') ? 404 : 500;
    res.status(status).json({ error: error.message });
  }
}

// ─── PAQUETES ───────────────────────────────────────────────────────────────

export async function createPaquete(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) { res.status(401).json({ error: 'No autenticado' }); return; }
    const { nombre, precio, items } = req.body;
    if (!nombre || precio == null || !items?.length) {
      res.status(400).json({ error: 'nombre, precio e items son obligatorios' });
      return;
    }
    const paquete = await svc.createPaquete({ contratoId: req.params.id, ...req.body });
    res.status(201).json({ success: true, paquete });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function updatePaquete(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) { res.status(401).json({ error: 'No autenticado' }); return; }
    const paquete = await svc.updatePaquete(req.params.paqueteId, req.body);
    res.json({ success: true, paquete });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function deletePaquete(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) { res.status(401).json({ error: 'No autenticado' }); return; }
    await svc.deletePaquete(req.params.paqueteId);
    res.json({ success: true, message: 'Paquete desactivado' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// ─── BENEFICIARIOS ──────────────────────────────────────────────────────────

export async function listBeneficiarios(req: Request, res: Response): Promise<void> {
  try {
    const beneficiarios = await svc.getBeneficiarios(req.params.id);
    res.json({ success: true, beneficiarios });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function addBeneficiario(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) { res.status(401).json({ error: 'No autenticado' }); return; }
    const { nombre, documento } = req.body;
    if (!nombre || !documento) {
      res.status(400).json({ error: 'nombre y documento son obligatorios' });
      return;
    }
    const beneficiario = await svc.addBeneficiario({ contratoId: req.params.id, ...req.body });
    res.status(201).json({ success: true, beneficiario });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function updateBeneficiario(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) { res.status(401).json({ error: 'No autenticado' }); return; }
    const beneficiario = await svc.updateBeneficiario(req.params.benefId, req.body);
    res.json({ success: true, beneficiario });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function removeBeneficiario(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) { res.status(401).json({ error: 'No autenticado' }); return; }
    await svc.removeBeneficiario(req.params.benefId);
    res.json({ success: true, message: 'Beneficiario retirado del contrato' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
