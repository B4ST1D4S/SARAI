import prisma from '../lib/prisma.js';
import * as fevRips from './fevRipsService.js';
import type { Ambiente } from './fevRipsService.js';

// ─── USUARIOS SISPRO ────────────────────────────────────────────────────────

export function getUsuariosSispro(ambiente?: Ambiente) {
  return prisma.usuarioSispro.findMany({
    where: ambiente ? { ambiente } : undefined,
    orderBy: { createdAt: 'desc' },
  });
}

export function createUsuarioSispro(data: {
  nombre: string;
  tipoIdentificacion?: string;
  numeroIdentificacion: string;
  clave: string;
  nit: string;
  tipoUsuario?: string | null;
  ambiente?: Ambiente;
}) {
  return prisma.usuarioSispro.create({
    data: {
      nombre: data.nombre,
      tipoIdentificacion: data.tipoIdentificacion ?? 'CC',
      numeroIdentificacion: data.numeroIdentificacion,
      clave: data.clave,
      nit: data.nit,
      tipoUsuario: data.tipoUsuario ?? null,
      ambiente: data.ambiente ?? 'STAGE',
    },
  });
}

export function updateUsuarioSispro(id: string, data: Partial<{
  nombre: string;
  tipoIdentificacion: string;
  numeroIdentificacion: string;
  clave: string;
  nit: string;
  tipoUsuario: string | null;
  ambiente: Ambiente;
  activo: boolean;
}>) {
  return prisma.usuarioSispro.update({ where: { id }, data });
}

export function deleteUsuarioSispro(id: string) {
  return prisma.usuarioSispro.delete({ where: { id } });
}

async function getUsuarioSisproParaAmbiente(ambiente: Ambiente, usuarioSisproId?: string) {
  if (usuarioSisproId) {
    const usuario = await prisma.usuarioSispro.findUnique({ where: { id: usuarioSisproId } });
    if (!usuario) throw new Error('Usuario SISPRO no encontrado');
    return usuario;
  }
  const usuario = await prisma.usuarioSispro.findFirst({
    where: { ambiente, activo: true },
    orderBy: { createdAt: 'asc' },
  });
  if (!usuario) throw new Error(`No hay ningún UsuarioSispro activo configurado para el ambiente ${ambiente}`);
  return usuario;
}

// ─── RIPS DE PRUEBA ─────────────────────────────────────────────────────────

export function getRipsPruebas() {
  return prisma.ripsPrueba.findMany({ orderBy: { createdAt: 'desc' } });
}

export function getRipsPruebaById(id: string) {
  return prisma.ripsPrueba.findUnique({ where: { id } });
}

export function createRipsPrueba(data: {
  nombre: string;
  modulo?: string;
  numDocumentoIdObligado: string;
  numFactura?: string | null;
  tipoNota?: string | null;
  numNota?: string | null;
  ripsJson: unknown;
  xmlFevFile?: string | null;
}) {
  return prisma.ripsPrueba.create({
    data: {
      nombre: data.nombre,
      modulo: data.modulo ?? 'FacturaElectronica',
      numDocumentoIdObligado: data.numDocumentoIdObligado,
      numFactura: data.numFactura ?? null,
      tipoNota: data.tipoNota ?? null,
      numNota: data.numNota ?? null,
      ripsJson: data.ripsJson as any,
      xmlFevFile: data.xmlFevFile ?? null,
    },
  });
}

export function deleteRipsPrueba(id: string) {
  return prisma.ripsPrueba.delete({ where: { id } });
}

// ─── ORQUESTACIÓN: login + envío contra el contenedor FEV-RIPS ─────────────

export async function loginAmbiente(ambiente: Ambiente, usuarioSisproId?: string) {
  const usuario = await getUsuarioSisproParaAmbiente(ambiente, usuarioSisproId);
  return fevRips.loginSispro(ambiente, usuario);
}

export async function enviarRipsPrueba(ambiente: Ambiente, ripsPruebaId: string, usuarioSisproId?: string) {
  const ripsPrueba = await prisma.ripsPrueba.findUnique({ where: { id: ripsPruebaId } });
  if (!ripsPrueba) throw new Error('RIPS de prueba no encontrado');
  if (!fevRips.moduloSoportado(ripsPrueba.modulo)) {
    throw new Error(`Módulo no soportado: ${ripsPrueba.modulo}`);
  }

  const usuario = await getUsuarioSisproParaAmbiente(ambiente, usuarioSisproId);
  const login = await fevRips.loginSispro(ambiente, usuario);

  if (!login.login || !login.token) {
    const resultado = { login };
    await prisma.ripsPrueba.update({ where: { id: ripsPruebaId }, data: { ultimoResultado: resultado as any } });
    return resultado;
  }

  const resultado = await fevRips.cargarPaquete(
    ambiente,
    login.token,
    ripsPrueba.modulo,
    ripsPrueba.ripsJson,
    ripsPrueba.xmlFevFile
  );

  await prisma.ripsPrueba.update({
    where: { id: ripsPruebaId },
    data: {
      ultimoResultado: resultado as any,
      cuv: resultado?.CodigoUnicoValidacion ?? ripsPrueba.cuv,
    },
  });

  return resultado;
}

export async function consultarCuv(ambiente: Ambiente, codigoUnicoValidacion: string) {
  return fevRips.consultarCuv(ambiente, codigoUnicoValidacion);
}

export async function recuperarCuv(ambiente: Ambiente, codigoUnicoValidacion: string, usuarioSisproId?: string) {
  const usuario = await getUsuarioSisproParaAmbiente(ambiente, usuarioSisproId);
  const login = await fevRips.loginSispro(ambiente, usuario);
  if (!login.login || !login.token) return { login };
  return fevRips.recuperarCuv(ambiente, login.token, codigoUnicoValidacion);
}
