import prisma from '../lib/prisma.js';

// ─── EMPRESAS ───────────────────────────────────────────────────────────────

export async function getEmpresas(soloActivas = false) {
  return prisma.empresa.findMany({
    where: soloActivas ? { estado: true } : undefined,
    include: {
      _count: { select: { contratos: true } },
    },
    orderBy: { razonSocial: 'asc' },
  });
}

export async function getEmpresaById(id: string) {
  const empresa = await prisma.empresa.findUnique({
    where: { id },
    include: {
      contratos: {
        include: { empresa: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  if (!empresa) throw new Error('Empresa no encontrada');
  return empresa;
}

export async function createEmpresa(data: {
  razonSocial: string;
  nombreComercial?: string;
  nit: string;
  tipo?: string;
  contactoNombre?: string;
  contactoCargo?: string;
  contactoEmail?: string;
  contactoTelefono?: string;
  direccion?: string;
  ciudad?: string;
}) {
  const existe = await prisma.empresa.findUnique({ where: { nit: data.nit } });
  if (existe) throw new Error(`Ya existe una empresa con NIT ${data.nit}`);

  return prisma.empresa.create({ data });
}

export async function updateEmpresa(id: string, data: Partial<{
  razonSocial: string;
  nombreComercial: string;
  tipo: string;
  contactoNombre: string;
  contactoCargo: string;
  contactoEmail: string;
  contactoTelefono: string;
  direccion: string;
  ciudad: string;
  estado: boolean;
}>) {
  const empresa = await prisma.empresa.findUnique({ where: { id } });
  if (!empresa) throw new Error('Empresa no encontrada');
  return prisma.empresa.update({ where: { id }, data });
}

// ─── CONTRATOS ──────────────────────────────────────────────────────────────

const CONTRATO_INCLUDE = {
  empresa: true,
  creadoPor: { select: { id: true, nombre: true, apellido: true } },
  tarifas: { where: { activo: true }, orderBy: { codigoCUPS: 'asc' as const } },
  paquetes: {
    where: { activo: true },
    include: { items: { orderBy: { esPrincipal: 'desc' as const } } },
    orderBy: { nombre: 'asc' as const },
  },
  _count: { select: { beneficiarios: true } },
};

export async function getContratos(filtros?: {
  estado?: string;
  empresaId?: string;
  busqueda?: string;
}) {
  const where: any = {};
  if (filtros?.estado && filtros.estado !== 'TODOS') where.estado = filtros.estado;
  if (filtros?.empresaId) where.empresaId = filtros.empresaId;
  if (filtros?.busqueda) {
    const q = filtros.busqueda;
    where.OR = [
      { descripcion: { contains: q, mode: 'insensitive' } },
      { empresa: { razonSocial: { contains: q, mode: 'insensitive' } } },
      { empresa: { nit: { contains: q, mode: 'insensitive' } } },
    ];
  }

  return prisma.contrato.findMany({
    where,
    include: CONTRATO_INCLUDE,
    orderBy: { createdAt: 'desc' },
  });
}

export async function getContratoById(id: string) {
  const contrato = await prisma.contrato.findUnique({
    where: { id },
    include: {
      ...CONTRATO_INCLUDE,
      beneficiarios: {
        include: { paciente: { select: { id: true, nombreCompleto: true, numeroDocumento: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  if (!contrato) throw new Error('Contrato no encontrado');
  return contrato;
}

export async function createContrato(data: {
  descripcion: string;
  empresaId: string;
  tipo?: string;
  fechaInicio: string;
  fechaFin: string;
  montoTotal?: number;
  montoMensual?: number;
  diasCredito?: number;
  porcentajeDescuento?: number;
  porcentajeCobertura?: number;
  observaciones?: string;
  creadoPorId: string;
}) {
  const empresa = await prisma.empresa.findUnique({ where: { id: data.empresaId } });
  if (!empresa) throw new Error('Empresa no encontrada');

  return prisma.contrato.create({
    data: {
      descripcion: data.descripcion,
      empresaId: data.empresaId,
      tipo: data.tipo ?? 'CONVENIO',
      estado: 'BORRADOR',
      fechaInicio: new Date(data.fechaInicio),
      fechaFin: new Date(data.fechaFin),
      montoTotal: data.montoTotal,
      montoMensual: data.montoMensual,
      diasCredito: data.diasCredito ?? 30,
      porcentajeDescuento: data.porcentajeDescuento ?? 0,
      porcentajeCobertura: data.porcentajeCobertura ?? 100,
      observaciones: data.observaciones,
      creadoPorId: data.creadoPorId,
    },
    include: CONTRATO_INCLUDE,
  });
}

export async function updateContrato(id: string, data: Partial<{
  descripcion: string;
  tipo: string;
  fechaInicio: string;
  fechaFin: string;
  montoTotal: number;
  montoMensual: number;
  diasCredito: number;
  porcentajeDescuento: number;
  porcentajeCobertura: number;
  observaciones: string;
}>) {
  const contrato = await prisma.contrato.findUnique({ where: { id } });
  if (!contrato) throw new Error('Contrato no encontrado');
  if (['VENCIDO', 'CANCELADO'].includes(contrato.estado)) {
    throw new Error('No se puede modificar un contrato vencido o cancelado');
  }

  const updateData: any = { ...data };
  if (data.fechaInicio) updateData.fechaInicio = new Date(data.fechaInicio);
  if (data.fechaFin) updateData.fechaFin = new Date(data.fechaFin);

  return prisma.contrato.update({ where: { id }, data: updateData, include: CONTRATO_INCLUDE });
}

export async function cambiarEstadoContrato(id: string, estado: string, userId: string) {
  const contrato = await prisma.contrato.findUnique({ where: { id } });
  if (!contrato) throw new Error('Contrato no encontrado');

  const transicionesValidas: Record<string, string[]> = {
    BORRADOR: ['ACTIVO', 'CANCELADO'],
    ACTIVO: ['SUSPENDIDO', 'CANCELADO'],
    SUSPENDIDO: ['ACTIVO', 'CANCELADO'],
    VENCIDO: [],
    CANCELADO: [],
  };

  if (!transicionesValidas[contrato.estado]?.includes(estado)) {
    throw new Error(`No se puede pasar de ${contrato.estado} a ${estado}`);
  }

  return prisma.contrato.update({
    where: { id },
    data: { estado },
    include: CONTRATO_INCLUDE,
  });
}

// ─── TARIFAS ────────────────────────────────────────────────────────────────

export async function upsertTarifa(data: {
  contratoId: string;
  codigoCUPS: string;
  descripcionCUPS: string;
  precioBase: number;
  precioNegociado: number;
  porcentajeDescuento?: number;
  porcentajeCobertura?: number;
}) {
  const contrato = await prisma.contrato.findUnique({ where: { id: data.contratoId } });
  if (!contrato) throw new Error('Contrato no encontrado');

  return prisma.contratoTarifa.upsert({
    where: { contratoId_codigoCUPS: { contratoId: data.contratoId, codigoCUPS: data.codigoCUPS } },
    create: {
      contratoId: data.contratoId,
      codigoCUPS: data.codigoCUPS,
      descripcionCUPS: data.descripcionCUPS,
      precioBase: data.precioBase,
      precioNegociado: data.precioNegociado,
      porcentajeDescuento: data.porcentajeDescuento ?? 0,
      porcentajeCobertura: data.porcentajeCobertura ?? 100,
    },
    update: {
      descripcionCUPS: data.descripcionCUPS,
      precioBase: data.precioBase,
      precioNegociado: data.precioNegociado,
      porcentajeDescuento: data.porcentajeDescuento ?? 0,
      porcentajeCobertura: data.porcentajeCobertura ?? 100,
      activo: true,
    },
  });
}

export async function deleteTarifa(contratoId: string, tarifaId: string) {
  return prisma.contratoTarifa.update({
    where: { id: tarifaId, contratoId },
    data: { activo: false },
  });
}

// ─── PAQUETES ───────────────────────────────────────────────────────────────

export async function createPaquete(data: {
  contratoId: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  items: { codigoCUPS?: string; descripcion: string; cantidad: number; precioUnit: number; esPrincipal?: boolean }[];
}) {
  const contrato = await prisma.contrato.findUnique({ where: { id: data.contratoId } });
  if (!contrato) throw new Error('Contrato no encontrado');

  return prisma.contratoPaquete.create({
    data: {
      contratoId: data.contratoId,
      nombre: data.nombre,
      descripcion: data.descripcion,
      precio: data.precio,
      items: { create: data.items },
    },
    include: { items: true },
  });
}

export async function updatePaquete(id: string, data: {
  nombre?: string;
  descripcion?: string;
  precio?: number;
  activo?: boolean;
}) {
  return prisma.contratoPaquete.update({
    where: { id },
    data,
    include: { items: true },
  });
}

export async function deletePaquete(id: string) {
  return prisma.contratoPaquete.update({ where: { id }, data: { activo: false } });
}

// ─── BENEFICIARIOS ──────────────────────────────────────────────────────────

export async function getBeneficiarios(contratoId: string) {
  return prisma.contratoBeneficiario.findMany({
    where: { contratoId },
    include: {
      paciente: { select: { id: true, nombreCompleto: true, numeroDocumento: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function addBeneficiario(data: {
  contratoId: string;
  pacienteId?: string;
  nombre: string;
  documento: string;
  tipoDoc?: string;
  email?: string;
  telefono?: string;
  tipo?: string;
}) {
  const contrato = await prisma.contrato.findUnique({ where: { id: data.contratoId } });
  if (!contrato) throw new Error('Contrato no encontrado');

  return prisma.contratoBeneficiario.create({
    data: {
      contratoId: data.contratoId,
      pacienteId: data.pacienteId,
      nombre: data.nombre,
      documento: data.documento,
      tipoDoc: data.tipoDoc ?? 'CC',
      email: data.email,
      telefono: data.telefono,
      tipo: data.tipo ?? 'BENEFICIARIO',
      estado: 'ACTIVO',
    },
    include: {
      paciente: { select: { id: true, nombreCompleto: true, numeroDocumento: true } },
    },
  });
}

export async function updateBeneficiario(id: string, data: { estado?: string; email?: string; telefono?: string }) {
  return prisma.contratoBeneficiario.update({ where: { id }, data });
}

export async function removeBeneficiario(id: string) {
  return prisma.contratoBeneficiario.update({ where: { id }, data: { estado: 'INACTIVO' } });
}

// ─── STATS ──────────────────────────────────────────────────────────────────

export async function getStats() {
  const hoy = new Date();
  const en30Dias = new Date();
  en30Dias.setDate(en30Dias.getDate() + 30);

  const [totalContratos, activos, porVencer, empresas] = await Promise.all([
    prisma.contrato.count(),
    prisma.contrato.count({ where: { estado: 'ACTIVO' } }),
    prisma.contrato.count({
      where: { estado: 'ACTIVO', fechaFin: { gte: hoy, lte: en30Dias } },
    }),
    prisma.empresa.count({ where: { estado: true } }),
  ]);

  return { totalContratos, activos, porVencer, empresas };
}
