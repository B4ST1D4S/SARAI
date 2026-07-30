import prisma from '../lib/prisma.js';

// Códigos válidos de "factura sin contrato" (Registro de Contratos SISPRO / FEV-RIPS).
export const FACTURA_SIN_CONTRATO_CODIGOS: Record<string, string> = {
  '01': 'Atención de urgencias',
  '02': 'Atención a cargo de ADRES/aseguradora SOAT/planes voluntarios',
  '03': 'Atención por fallos de tutela/órdenes judiciales',
  '04': 'Atención por portabilidad/asignación masiva de afiliados',
  '05': 'Atención en casos excepcionales por cotizaciones/autorizaciones sin contrato',
  '06': 'Gestión de recuperación de órganos para trasplante',
};

// Valida que exactamente uno de los dos mecanismos de vinculación FEV-RIPS
// esté correctamente diligenciado: CUCON (hash sha256 de 64 hex) o el código
// de factura sin contrato (01-06).
function validarCucon(data: { tieneCucon?: boolean; codigoCucon?: string | null; facturaSinContrato?: string | null }) {
  if (data.tieneCucon === undefined) return; // no se está tocando este bloque
  if (data.tieneCucon) {
    if (!data.codigoCucon || !/^[a-fA-F0-9]{64}$/.test(data.codigoCucon)) {
      throw new Error('El código CUCON debe ser una cadena hexadecimal de 64 caracteres');
    }
  } else {
    if (!data.facturaSinContrato || !FACTURA_SIN_CONTRATO_CODIGOS[data.facturaSinContrato]) {
      throw new Error('Debe indicar un código de factura sin contrato válido (01 a 06) cuando el contrato no tiene CUCON');
    }
  }
}

// ─── EMPRESAS ───────────────────────────────────────────────────────────────

export async function getEmpresas(soloActivas = false) {
  return prisma.empresaContratante.findMany({
    where: soloActivas ? { estado: true } : undefined,
    include: {
      _count: { select: { contratos: true } },
    },
    orderBy: { razonSocial: 'asc' },
  });
}

export async function getEmpresaById(id: string) {
  const empresa = await prisma.empresaContratante.findUnique({
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
  const existe = await prisma.empresaContratante.findUnique({ where: { nit: data.nit } });
  if (existe) throw new Error(`Ya existe una empresa con NIT ${data.nit}`);

  return prisma.empresaContratante.create({ data });
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
  const empresa = await prisma.empresaContratante.findUnique({ where: { id } });
  if (!empresa) throw new Error('Empresa no encontrada');
  return prisma.empresaContratante.update({ where: { id }, data });
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
  tieneCucon?: boolean;
  codigoCucon?: string;
  facturaSinContrato?: string;
  creadoPorId: string;
}) {
  const empresa = await prisma.empresaContratante.findUnique({ where: { id: data.empresaId } });
  if (!empresa) throw new Error('Empresa no encontrada');

  validarCucon({
    tieneCucon: data.tieneCucon ?? false,
    codigoCucon: data.codigoCucon,
    facturaSinContrato: data.facturaSinContrato,
  });

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
      tieneCucon: data.tieneCucon ?? false,
      codigoCucon: data.tieneCucon ? data.codigoCucon : null,
      facturaSinContrato: data.tieneCucon ? null : data.facturaSinContrato,
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
  tieneCucon: boolean;
  codigoCucon: string;
  facturaSinContrato: string;
}>) {
  const contrato = await prisma.contrato.findUnique({ where: { id } });
  if (!contrato) throw new Error('Contrato no encontrado');
  if (['VENCIDO', 'CANCELADO'].includes(contrato.estado)) {
    throw new Error('No se puede modificar un contrato vencido o cancelado');
  }

  if (data.tieneCucon !== undefined) {
    validarCucon({
      tieneCucon: data.tieneCucon,
      codigoCucon: data.codigoCucon ?? contrato.codigoCucon,
      facturaSinContrato: data.facturaSinContrato ?? contrato.facturaSinContrato,
    });
    // Solo uno de los dos mecanismos puede quedar diligenciado a la vez.
    if (data.tieneCucon) (data as any).facturaSinContrato = null;
    else (data as any).codigoCucon = null;
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

// ─── EXCEPCIONES (rangos por tipo de afiliado, copagos y cuotas moderadoras) ─

export async function getExcepciones(contratoId: string) {
  return prisma.contratoExcepcion.findMany({
    where: { contratoId, activo: true },
    include: { tarifa: { select: { id: true, codigoCUPS: true, descripcionCUPS: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createExcepcion(data: {
  contratoId: string;
  tarifaId?: string;
  tipoAfiliado?: string;
  edadMinima?: number;
  edadMaxima?: number;
  sexo?: string;
  aplicaCopago?: boolean;
  porcentajeCopago?: number;
  aplicaCuotaModeradora?: boolean;
  porcentajeCuotaModeradora?: number;
  numVecesMaximo?: number;
  excluyePorEdad?: boolean;
  excluyePorCotizar?: boolean;
  observaciones?: string;
}) {
  const contrato = await prisma.contrato.findUnique({ where: { id: data.contratoId } });
  if (!contrato) throw new Error('Contrato no encontrado');

  if (
    data.edadMinima != null &&
    data.edadMaxima != null &&
    data.edadMinima > data.edadMaxima
  ) {
    throw new Error('La edad mínima no puede ser mayor que la edad máxima');
  }

  return prisma.contratoExcepcion.create({
    data: {
      contratoId: data.contratoId,
      tarifaId: data.tarifaId ?? null,
      tipoAfiliado: data.tipoAfiliado ?? 'AMBOS',
      edadMinima: data.edadMinima,
      edadMaxima: data.edadMaxima,
      sexo: data.sexo ?? 'AMBOS',
      aplicaCopago: data.aplicaCopago ?? false,
      porcentajeCopago: data.porcentajeCopago ?? 0,
      aplicaCuotaModeradora: data.aplicaCuotaModeradora ?? false,
      porcentajeCuotaModeradora: data.porcentajeCuotaModeradora ?? 0,
      numVecesMaximo: data.numVecesMaximo,
      excluyePorEdad: data.excluyePorEdad ?? false,
      excluyePorCotizar: data.excluyePorCotizar ?? false,
      observaciones: data.observaciones,
    },
    include: { tarifa: { select: { id: true, codigoCUPS: true, descripcionCUPS: true } } },
  });
}

export async function deleteExcepcion(contratoId: string, excepcionId: string) {
  return prisma.contratoExcepcion.update({
    where: { id: excepcionId, contratoId },
    data: { activo: false },
  });
}

// ─── CLONAR CONTRATO ────────────────────────────────────────────────────────
// Copia tarifas, paquetes (con sus ítems) y excepciones de un contrato
// existente hacia uno nuevo, para usarlo como plantilla de partida.

export async function clonarContrato(
  contratoOrigenId: string,
  data: {
    descripcion: string;
    empresaId: string;
    fechaInicio: string;
    fechaFin: string;
    creadoPorId: string;
  }
) {
  const origen = await prisma.contrato.findUnique({
    where: { id: contratoOrigenId },
    include: {
      tarifas: { where: { activo: true } },
      paquetes: { where: { activo: true }, include: { items: true } },
      excepciones: { where: { activo: true } },
    },
  });
  if (!origen) throw new Error('Contrato de origen no encontrado');

  const empresa = await prisma.empresaContratante.findUnique({ where: { id: data.empresaId } });
  if (!empresa) throw new Error('Empresa no encontrada');

  return prisma.$transaction(async (tx) => {
    const nuevo = await tx.contrato.create({
      data: {
        descripcion: data.descripcion,
        empresaId: data.empresaId,
        tipo: origen.tipo,
        estado: 'BORRADOR',
        fechaInicio: new Date(data.fechaInicio),
        fechaFin: new Date(data.fechaFin),
        montoTotal: origen.montoTotal,
        montoMensual: origen.montoMensual,
        diasCredito: origen.diasCredito,
        porcentajeDescuento: origen.porcentajeDescuento,
        porcentajeCobertura: origen.porcentajeCobertura,
        observaciones: origen.observaciones,
        tieneCucon: false,
        codigoCucon: null,
        facturaSinContrato: null,
        creadoPorId: data.creadoPorId,
      },
    });

    // Mapa tarifaOrigenId -> tarifaNuevaId, para poder re-enlazar las excepciones
    // que apuntaban a una tarifa específica del contrato origen.
    const mapaTarifas = new Map<string, string>();
    for (const t of origen.tarifas) {
      const nueva = await tx.contratoTarifa.create({
        data: {
          contratoId: nuevo.id,
          codigoCUPS: t.codigoCUPS,
          descripcionCUPS: t.descripcionCUPS,
          precioBase: t.precioBase,
          precioNegociado: t.precioNegociado,
          porcentajeDescuento: t.porcentajeDescuento,
          porcentajeCobertura: t.porcentajeCobertura,
        },
      });
      mapaTarifas.set(t.id, nueva.id);
    }

    for (const p of origen.paquetes) {
      await tx.contratoPaquete.create({
        data: {
          contratoId: nuevo.id,
          nombre: p.nombre,
          descripcion: p.descripcion,
          precio: p.precio,
          items: {
            create: p.items.map((it) => ({
              codigoCUPS: it.codigoCUPS,
              descripcion: it.descripcion,
              cantidad: it.cantidad,
              precioUnit: it.precioUnit,
              esPrincipal: it.esPrincipal,
            })),
          },
        },
      });
    }

    for (const ex of origen.excepciones) {
      await tx.contratoExcepcion.create({
        data: {
          contratoId: nuevo.id,
          tarifaId: ex.tarifaId ? mapaTarifas.get(ex.tarifaId) ?? null : null,
          tipoAfiliado: ex.tipoAfiliado,
          edadMinima: ex.edadMinima,
          edadMaxima: ex.edadMaxima,
          sexo: ex.sexo,
          aplicaCopago: ex.aplicaCopago,
          porcentajeCopago: ex.porcentajeCopago,
          aplicaCuotaModeradora: ex.aplicaCuotaModeradora,
          porcentajeCuotaModeradora: ex.porcentajeCuotaModeradora,
          numVecesMaximo: ex.numVecesMaximo,
          excluyePorEdad: ex.excluyePorEdad,
          excluyePorCotizar: ex.excluyePorCotizar,
          observaciones: ex.observaciones,
        },
      });
    }

    return tx.contrato.findUnique({ where: { id: nuevo.id }, include: CONTRATO_INCLUDE });
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
    prisma.empresaContratante.count({ where: { estado: true } }),
  ]);

  return { totalContratos, activos, porVencer, empresas };
}
