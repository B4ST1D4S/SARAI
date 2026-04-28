// Mock Data Service - Simula un backend real
// En producción, reemplazar con llamadas a API

export interface MockPaciente {
  id: string;
  nombre: string;
  documento: string;
  email: string;
  telefono: string;
  edad: number;
  alergias: string[];
}

export interface MockCita {
  id: string;
  pacienteId?: string;
  pacienteNombre: string;
  fecha: string;
  hora: string;
  duracion: number;
  procedimiento: string;
  estado: 'CONFIRMADA' | 'PENDIENTE' | 'ATENDIDA' | 'CANCELADA';
  notas: string;
}

export interface MockFactura {
  id: string;
  paciente: string;
  procedimiento: string;
  fecha: string;
  valor: number;
  estado: 'PENDIENTE' | 'PAGADA' | 'PARCIAL';
  cuotas: { numero: number; valor: number; estado: 'PAGADA' | 'PENDIENTE'; fecha?: string }[];
  notas: string;
}

export interface MockFollowUp {
  id: string;
  pacienteNombre: string;
  procedimiento: string;
  fechaCirugia: string;
  dia: number;
  estado: 'PENDIENTE' | 'COMPLETADO' | 'ALERTA';
  fotos: number;
  sintomas: string[];
  mensajeEnviado: boolean;
  proximaRevision: string;
}

export interface MockLead {
  id: string;
  nombre: string;
  procedimiento: string;
  etapa: 'COTIZO' | 'AGENDO' | 'OPERO' | 'SEGUIMIENTO';
  valor: number;
  fechaContacto: string;
  proximoContacto: string;
  notas: string;
}

// DATOS INICIALES
const pacientes: MockPaciente[] = [];
const citas: MockCita[] = [];
const facturas: MockFactura[] = [];
const followUps: MockFollowUp[] = [];
const leads: MockLead[] = [];
let initialized = false;

// ===== PACIENTES =====
export const pacientesService = {
  getAll: () => pacientes,
  getById: (id: string) => pacientes.find(p => p.id === id),
  create: (data: Omit<MockPaciente, 'id'>) => {
    const newPaciente = { id: Date.now().toString(), ...data };
    pacientes.push(newPaciente);
    return newPaciente;
  },
  update: (id: string, data: Partial<MockPaciente>) => {
    const idx = pacientes.findIndex(p => p.id === id);
    if (idx !== -1) pacientes[idx] = { ...pacientes[idx], ...data };
    return pacientes[idx];
  },
  delete: (id: string) => {
    const idx = pacientes.findIndex(p => p.id === id);
    if (idx !== -1) pacientes.splice(idx, 1);
  },
};

// ===== CITAS =====
export const citasService = {
  getAll: () => citas,
  getByFecha: (fecha: string) => citas.filter(c => c.fecha === fecha),
  create: (data: Omit<MockCita, 'id'>) => {
    const newCita = { id: Date.now().toString(), ...data };
    citas.push(newCita);
    return newCita;
  },
  update: (id: string, data: Partial<MockCita>) => {
    const idx = citas.findIndex(c => c.id === id);
    if (idx !== -1) citas[idx] = { ...citas[idx], ...data };
    return citas[idx];
  },
  delete: (id: string) => {
    const idx = citas.findIndex(c => c.id === id);
    if (idx !== -1) citas.splice(idx, 1);
  },
  changeStatus: (id: string, estado: MockCita['estado']) => {
    const cita = citas.find(c => c.id === id);
    if (cita) cita.estado = estado;
    return cita;
  },
};

// ===== FACTURAS =====
export const facturasService = {
  getAll: () => facturas,
  getById: (id: string) => facturas.find(f => f.id === id),
  create: (data: Omit<MockFactura, 'id'>) => {
    const newFactura = { id: `F${Date.now()}`, ...data };
    facturas.push(newFactura);
    return newFactura;
  },
  registrarPago: (id: string, numeroCuota: number) => {
    const factura = facturas.find(f => f.id === id);
    if (factura) {
      const cuota = factura.cuotas.find(c => c.numero === numeroCuota);
      if (cuota) {
        cuota.estado = 'PAGADA';
        cuota.fecha = new Date().toISOString().split('T')[0];
        // Actualizar estado factura
        const todosPagados = factura.cuotas.every(c => c.estado === 'PAGADA');
        factura.estado = todosPagados ? 'PAGADA' : 'PARCIAL';
      }
    }
    return factura;
  },
};

// ===== FOLLOW-UP =====
export const followUpService = {
  getAll: () => followUps,
  create: (data: Omit<MockFollowUp, 'id'>) => {
    const newFollowUp = { id: Date.now().toString(), ...data };
    followUps.push(newFollowUp);
    return newFollowUp;
  },
  addSintoma: (id: string, sintoma: string) => {
    const followUp = followUps.find(f => f.id === id);
    if (followUp && !followUp.sintomas.includes(sintoma)) {
      followUp.sintomas.push(sintoma);
    }
    return followUp;
  },
};

// ===== CRM LEADS =====
export const leadsService = {
  getAll: () => leads,
  create: (data: Omit<MockLead, 'id'>) => {
    const newLead = { id: Date.now().toString(), ...data };
    leads.push(newLead);
    return newLead;
  },
  moverEtapa: (id: string, nuevaEtapa: MockLead['etapa']) => {
    const lead = leads.find(l => l.id === id);
    if (lead) lead.etapa = nuevaEtapa;
    return lead;
  },
};

// ===== INICIALIZAR CON DATOS DE EJEMPLO =====
export const initializeMockData = () => {
  if (initialized) return; // Evitar inicializar múltiples veces
  
  initialized = true;

  // Crear pacientes
  for (let i = 1; i <= 5; i++) {
    pacientesService.create({
      nombre: `Paciente ${i}`,
      documento: `${1000000000 + i}`,
      email: `paciente${i}@example.com`,
      telefono: `30${1234567 + i}`,
      edad: 25 + i * 5,
      alergias: i % 2 === 0 ? ['Penicilina'] : [],
    });
  }

  // Crear citas
  const hoy = new Date().toISOString().split('T')[0];
  const pacientesIds = pacientes.map(p => p.id);
  
  citasService.create({
    pacienteId: pacientesIds[0],
    pacienteNombre: 'Paciente 1',
    fecha: hoy,
    hora: '09:00',
    duracion: 45,
    procedimiento: 'Liposucción',
    estado: 'CONFIRMADA',
    notas: 'Paciente lista',
  });

  // Crear facturas
  facturasService.create({
    paciente: 'Paciente 1',
    procedimiento: 'Liposucción',
    fecha: hoy,
    valor: 5000000,
    estado: 'PARCIAL',
    cuotas: [
      { numero: 1, valor: 2500000, estado: 'PAGADA', fecha: hoy },
      { numero: 2, valor: 2500000, estado: 'PENDIENTE' },
    ],
    notas: 'Separado en 2 cuotas',
  });

  // Crear leads
  leadsService.create({
    nombre: 'Ana Martínez',
    procedimiento: 'Liposucción + Abdominoplastia',
    etapa: 'COTIZO',
    valor: 5000000,
    fechaContacto: hoy,
    proximoContacto: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notas: 'Interesada',
  });
};
