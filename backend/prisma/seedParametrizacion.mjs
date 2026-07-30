/**
 * seedParametrizacion.mjs
 * Carga datos iniciales de parametrización:
 *   - Especialidades médicas
 *   - Departamentos (unidades funcionales)
 *   - Tipos de Consulta básicos
 *
 * Uso: node prisma/seedParametrizacion.mjs
 * Es idempotente: no duplica si ya existen.
 */
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

// ─── 1. ESPECIALIDADES ────────────────────────────────────────────────────────
const ESPECIALIDADES = [
  { codigo: '01', nombre: 'Medicina General',            aplicaCirugia: false, aplicaAnestesia: false },
  { codigo: '02', nombre: 'Cirugía General',             aplicaCirugia: true,  aplicaAnestesia: true  },
  { codigo: '03', nombre: 'Cirugía Plástica y Estética', aplicaCirugia: true,  aplicaAnestesia: true  },
  { codigo: '04', nombre: 'Dermatología',                aplicaCirugia: false, aplicaAnestesia: false },
  { codigo: '05', nombre: 'Ginecología y Obstetricia',   aplicaCirugia: true,  aplicaAnestesia: true  },
  { codigo: '06', nombre: 'Ortopedia y Traumatología',   aplicaCirugia: true,  aplicaAnestesia: true  },
  { codigo: '07', nombre: 'Oftalmología',                aplicaCirugia: true,  aplicaAnestesia: true  },
  { codigo: '08', nombre: 'Otorrinolaringología',        aplicaCirugia: true,  aplicaAnestesia: true  },
  { codigo: '09', nombre: 'Urología',                    aplicaCirugia: true,  aplicaAnestesia: true  },
  { codigo: '10', nombre: 'Neurología',                  aplicaCirugia: false, aplicaAnestesia: false },
  { codigo: '11', nombre: 'Psiquiatría',                 aplicaCirugia: false, aplicaAnestesia: false },
  { codigo: '12', nombre: 'Pediatría',                   aplicaCirugia: false, aplicaAnestesia: false, aplicaPediatria: true },
  { codigo: '13', nombre: 'Medicina Interna',            aplicaCirugia: false, aplicaAnestesia: false },
  { codigo: '14', nombre: 'Cardiología',                 aplicaCirugia: false, aplicaAnestesia: false },
  { codigo: '15', nombre: 'Endocrinología',              aplicaCirugia: false, aplicaAnestesia: false },
  { codigo: '16', nombre: 'Nutrición y Dietética',       aplicaCirugia: false, aplicaAnestesia: false },
  { codigo: '17', nombre: 'Fisioterapia y Rehabilitación', aplicaCirugia: false, aplicaAnestesia: false },
  { codigo: '18', nombre: 'Anestesiología',              aplicaCirugia: false, aplicaAnestesia: true  },
  { codigo: '19', nombre: 'Radiología e Imágenes',       aplicaCirugia: false, aplicaAnestesia: false },
  { codigo: '20', nombre: 'Medicina Estética',           aplicaCirugia: false, aplicaAnestesia: false },
];

// ─── 2. DEPARTAMENTOS ─────────────────────────────────────────────────────────
const DEPARTAMENTOS = [
  { codigo: 'D01', nombre: 'Consulta Externa',         descripcion: 'Atención ambulatoria de pacientes' },
  { codigo: 'D02', nombre: 'Urgencias',                descripcion: 'Atención de urgencias y emergencias' },
  { codigo: 'D03', nombre: 'Cirugía',                  descripcion: 'Unidad quirúrgica' },
  { codigo: 'D04', nombre: 'Hospitalización',          descripcion: 'Camas de hospitalización' },
  { codigo: 'D05', nombre: 'Imágenes Diagnósticas',   descripcion: 'Radiología, ecografía y resonancia' },
  { codigo: 'D06', nombre: 'Laboratorio Clínico',     descripcion: 'Análisis clínicos y patología' },
  { codigo: 'D07', nombre: 'Rehabilitación',          descripcion: 'Fisioterapia y terapia ocupacional' },
  { codigo: 'D08', nombre: 'Estética y Procedimientos', descripcion: 'Procedimientos estéticos ambulatorios' },
  { codigo: 'D09', nombre: 'UCI / Cuidados Intensivos', descripcion: 'Unidad de cuidados intensivos' },
  { codigo: 'D10', nombre: 'Administración',           descripcion: 'Área administrativa y facturación' },
];

// ─── 3. TIPOS DE CONSULTA ─────────────────────────────────────────────────────
const TIPOS_CONSULTA = [
  { nombre: 'Consulta de Primera Vez',         clasificacion: 'CONSULTA',     duracionMinutos: 30, permiteAgendamiento: true, abreHistoriaClinica: true  },
  { nombre: 'Consulta de Control',             clasificacion: 'CONTROL',      duracionMinutos: 20, permiteAgendamiento: true, abreHistoriaClinica: true  },
  { nombre: 'Consulta de Urgencias',           clasificacion: 'CONSULTA',     duracionMinutos: 30, permiteAgendamiento: false, abreHistoriaClinica: true },
  { nombre: 'Procedimiento Menor Ambulatorio', clasificacion: 'PROCEDIMIENTO', duracionMinutos: 45, permiteAgendamiento: true, abreHistoriaClinica: true, requiereCaja: true },
  { nombre: 'Cirugía Ambulatoria',             clasificacion: 'CIRUGIA',       duracionMinutos: 120, permiteAgendamiento: true, abreHistoriaClinica: true, manejaAnestesia: true, requiereCaja: true },
  { nombre: 'Consulta Valoración Pre-quirúrgica', clasificacion: 'CONSULTA',  duracionMinutos: 30, permiteAgendamiento: true, abreHistoriaClinica: true },
  { nombre: 'Control Post-operatorio',         clasificacion: 'CONTROL',      duracionMinutos: 20, permiteAgendamiento: true, abreHistoriaClinica: true },
  { nombre: 'Teleconsulta / Telemedicina',     clasificacion: 'CONSULTA',     duracionMinutos: 20, permiteAgendamiento: true, abreHistoriaClinica: true },
  { nombre: 'Sesión de Rehabilitación',        clasificacion: 'PROCEDIMIENTO', duracionMinutos: 45, permiteAgendamiento: true, abreHistoriaClinica: false },
  { nombre: 'Toma de Imágenes Diagnósticas',   clasificacion: 'PROCEDIMIENTO', duracionMinutos: 30, permiteAgendamiento: true, abreHistoriaClinica: false, requiereCaja: true },
];

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  const now = new Date();
  let creadas = { esp: 0, dep: 0, tc: 0 };
  let omitidas = { esp: 0, dep: 0, tc: 0 };

  // ── Especialidades ──
  console.log('\n📋 Cargando especialidades...');
  for (const e of ESPECIALIDADES) {
    const existe = await prisma.especialidad.findFirst({
      where: { OR: [{ codigo: e.codigo }, { nombre: e.nombre }] },
    });
    if (existe) { omitidas.esp++; continue; }
    await prisma.especialidad.create({
      data: {
        codigo: e.codigo,
        nombre: e.nombre,
        aplicaCirugia:         e.aplicaCirugia        ?? false,
        aplicaAnestesia:       e.aplicaAnestesia       ?? false,
        aplicaPediatria:       e.aplicaPediatria       ?? false,
        aplicaInstrumentacion: false,
        aplicaMedicoFamiliar:  false,
        updatedAt: now,
      },
    });
    creadas.esp++;
  }
  console.log(`   ✅ Creadas: ${creadas.esp} | Omitidas (ya existían): ${omitidas.esp}`);

  // ── Departamentos ──
  console.log('\n🏢 Cargando departamentos...');
  for (const d of DEPARTAMENTOS) {
    const existe = await prisma.departamento.findFirst({
      where: { OR: [{ codigo: d.codigo }, { nombre: d.nombre }] },
    });
    if (existe) { omitidas.dep++; continue; }
    await prisma.departamento.create({
      data: { id: randomUUID(), codigo: d.codigo, nombre: d.nombre, descripcion: d.descripcion, updatedAt: now },
    });
    creadas.dep++;
  }
  console.log(`   ✅ Creadas: ${creadas.dep} | Omitidas (ya existían): ${omitidas.dep}`);

  // ── Tipos de Consulta ──
  console.log('\n📅 Cargando tipos de consulta...');
  for (const tc of TIPOS_CONSULTA) {
    const existe = await prisma.tipoConsulta.findFirst({
      where: { nombre: { equals: tc.nombre, mode: 'insensitive' }, estado: true },
    });
    if (existe) { omitidas.tc++; continue; }
    await prisma.tipoConsulta.create({
      data: {
        id: randomUUID(),
        nombre:              tc.nombre,
        clasificacion:       tc.clasificacion,
        duracionMinutos:     tc.duracionMinutos,
        permiteAgendamiento: tc.permiteAgendamiento ?? true,
        abreHistoriaClinica: tc.abreHistoriaClinica ?? true,
        requiereCaja:        tc.requiereCaja        ?? false,
        manejaAnestesia:     tc.manejaAnestesia     ?? false,
        controlaTiempoCita:  false,
        permiteCargosAdicionales: false,
        esProgramaPYP:       false,
        manejaProtocolos:    false,
        esPsicologia:        false,
        updatedAt: now,
      },
    });
    creadas.tc++;
  }
  console.log(`   ✅ Creadas: ${creadas.tc} | Omitidas (ya existían): ${omitidas.tc}`);

  console.log('\n🎉 Seed completado.');
  console.log(`   Especialidades: ${creadas.esp} nuevas`);
  console.log(`   Departamentos:  ${creadas.dep} nuevas`);
  console.log(`   Tipos Consulta: ${creadas.tc} nuevos`);
}

main()
  .catch((e) => { console.error('❌ Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
