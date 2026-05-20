/**
 * setup-disponibilidad.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Crea en la BD:
 *   1. Usuario médico demo (si no existe)
 *   2. Tipos de consulta básicos (si no existen)
 *   3. Disponibilidad semanal del médico Lun→Sáb 08:00–18:00
 *      con cada franja vinculada al nombre del tipo de consulta
 *
 * Ejecutar desde backend/:
 *   npm run setup-disp
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

// ─── Configuración ────────────────────────────────────────────────────────────

const MEDICO_EMAIL    = 'medico@estegia.com';
const MEDICO_PASS     = '123456';
const MEDICO_NOMBRE   = 'Carlos';
const MEDICO_APELLIDO = 'Rodríguez';
const MEDICO_ESPECIALIDAD = 'Cirugía Plástica y Estética';
const MEDICO_REG      = 'RM-COL-12345';
const MEDICO_DOC      = '1234567890';

// Tipos de consulta a crear en parametrización
const TIPOS_CONSULTA = [
  { id: 'TC-001', nombre: 'Consulta Inicial',        clasificacion: 'CONSULTA',      duracionMinutos: 30, permiteAgendamiento: true },
  { id: 'TC-002', nombre: 'Preoperatorio',            clasificacion: 'PREOPERATORIO', duracionMinutos: 45, permiteAgendamiento: true },
  { id: 'TC-003', nombre: 'Postoperatorio',           clasificacion: 'CONTROL',       duracionMinutos: 30, permiteAgendamiento: true },
  { id: 'TC-004', nombre: 'Control',                  clasificacion: 'CONTROL',       duracionMinutos: 20, permiteAgendamiento: true },
  { id: 'TC-005', nombre: 'Procedimiento Estético',   clasificacion: 'PROCEDIMIENTO', duracionMinutos: 90, permiteAgendamiento: true },
  { id: 'TC-006', nombre: 'Valoración Nutricional',   clasificacion: 'CONSULTA',      duracionMinutos: 40, permiteAgendamiento: true },
];

// Disponibilidad: días de la semana (1=Lun … 6=Sáb)
// Cada día tiene una franja AM y otra PM
const DISPONIBILIDAD = [
  { diaSemana: 1, horaInicio: '08:00', horaFin: '12:00', duracionSlot: 30, sede: 'Clínica Principal', consultorio: 'Consultorio 1' },
  { diaSemana: 1, horaInicio: '14:00', horaFin: '18:00', duracionSlot: 30, sede: 'Clínica Principal', consultorio: 'Consultorio 1' },
  { diaSemana: 2, horaInicio: '08:00', horaFin: '12:00', duracionSlot: 30, sede: 'Clínica Principal', consultorio: 'Consultorio 1' },
  { diaSemana: 2, horaInicio: '14:00', horaFin: '18:00', duracionSlot: 30, sede: 'Clínica Principal', consultorio: 'Consultorio 1' },
  { diaSemana: 3, horaInicio: '08:00', horaFin: '12:00', duracionSlot: 30, sede: 'Clínica Principal', consultorio: 'Consultorio 2' },
  { diaSemana: 3, horaInicio: '14:00', horaFin: '18:00', duracionSlot: 30, sede: 'Clínica Principal', consultorio: 'Consultorio 2' },
  { diaSemana: 4, horaInicio: '08:00', horaFin: '12:00', duracionSlot: 30, sede: 'Clínica Principal', consultorio: 'Consultorio 1' },
  { diaSemana: 4, horaInicio: '14:00', horaFin: '18:00', duracionSlot: 30, sede: 'Clínica Principal', consultorio: 'Consultorio 1' },
  { diaSemana: 5, horaInicio: '08:00', horaFin: '12:00', duracionSlot: 30, sede: 'Clínica Principal', consultorio: 'Consultorio 2' },
  { diaSemana: 5, horaInicio: '14:00', horaFin: '17:00', duracionSlot: 30, sede: 'Clínica Principal', consultorio: 'Consultorio 2' },
  { diaSemana: 6, horaInicio: '08:00', horaFin: '12:00', duracionSlot: 30, sede: 'Clínica Principal', consultorio: 'Consultorio 1' },
];

const DIA_NOMBRE: Record<number, string> = {
  0: 'Domingo', 1: 'Lunes', 2: 'Martes', 3: 'Miércoles',
  4: 'Jueves', 5: 'Viernes', 6: 'Sábado',
};

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🚀 Configurando disponibilidad del profesional...\n');

  // ── 1. Tipos de consulta ──────────────────────────────────────────────────
  console.log('📋 Creando/actualizando tipos de consulta...');
  for (const tc of TIPOS_CONSULTA) {
    await prisma.tipoConsulta.upsert({
      where: { id: tc.id },
      update: {
        nombre: tc.nombre,
        clasificacion: tc.clasificacion,
        duracionMinutos: tc.duracionMinutos,
        permiteAgendamiento: tc.permiteAgendamiento,
        updatedAt: new Date(),
      },
      create: {
        ...tc,
        estado: true,
        abreHistoriaClinica: true,
        updatedAt: new Date(),
      },
    });
    console.log(`   ✓ ${tc.nombre} (${tc.duracionMinutos} min)`);
  }

  // ── 2. Usuario médico ─────────────────────────────────────────────────────
  console.log('\n👤 Verificando usuario médico...');
  let medico = await prisma.user.findUnique({ where: { email: MEDICO_EMAIL } });

  if (!medico) {
    medico = await prisma.user.create({
      data: {
        email: MEDICO_EMAIL,
        password: await bcryptjs.hash(MEDICO_PASS, 10),
        nombre: MEDICO_NOMBRE,
        apellido: MEDICO_APELLIDO,
        rol: 'MEDICO',
        numeroDocumento: MEDICO_DOC,
        especialidad: MEDICO_ESPECIALIDAD,
        registroMedico: MEDICO_REG,
        telefono: '3101234567',
        activo: true,
      },
    });
    console.log(`   ✓ Médico creado: ${medico.nombre} ${medico.apellido} (${medico.email})`);
  } else {
    // Actualizar especialidad y registro médico si faltan
    medico = await prisma.user.update({
      where: { id: medico.id },
      data: {
        especialidad: medico.especialidad || MEDICO_ESPECIALIDAD,
        registroMedico: (medico as any).registroMedico || MEDICO_REG,
        activo: true,
      },
    });
    console.log(`   ✓ Médico ya existe: ${medico.nombre} ${medico.apellido} (${medico.email})`);
  }

  // ── 3. Limpiar disponibilidad anterior del médico ─────────────────────────
  console.log('\n🗓️  Configurando disponibilidad semanal...');
  const deleted = await prisma.disponibilidadMedico.updateMany({
    where: { medicoId: medico.id },
    data: { activo: false },
  });
  if (deleted.count > 0) {
    console.log(`   ℹ️  ${deleted.count} franjas anteriores desactivadas`);
  }

  // ── 4. Crear nueva disponibilidad ─────────────────────────────────────────
  for (const disp of DISPONIBILIDAD) {
    await prisma.disponibilidadMedico.create({
      data: {
        medicoId: medico.id,
        diaSemana: disp.diaSemana,
        horaInicio: disp.horaInicio,
        horaFin: disp.horaFin,
        duracionSlot: disp.duracionSlot,
        sede: disp.sede,
        consultorio: disp.consultorio,
        tipoAtencion: 'CONSULTA', // visible en ConfigAgenda
        activo: true,
        fechaDesde: null,
        fechaHasta: null,
      },
    });
    const slots = Math.floor(
      ((Number(disp.horaFin.split(':')[0]) * 60 + Number(disp.horaFin.split(':')[1])) -
       (Number(disp.horaInicio.split(':')[0]) * 60 + Number(disp.horaInicio.split(':')[1]))) /
      disp.duracionSlot
    );
    console.log(`   ✓ ${DIA_NOMBRE[disp.diaSemana]} ${disp.horaInicio}-${disp.horaFin} → ${slots} slots de ${disp.duracionSlot} min`);
  }

  // ── 5. Resumen final ──────────────────────────────────────────────────────
  const totalFranjas = await prisma.disponibilidadMedico.count({
    where: { medicoId: medico.id, activo: true },
  });

  console.log('\n✅ CONFIGURACIÓN COMPLETA');
  console.log('═══════════════════════════════════════════');
  console.log(`  Médico ID   : ${medico.id}`);
  console.log(`  Nombre      : Dr. ${medico.nombre} ${medico.apellido}`);
  console.log(`  Email       : ${medico.email}`);
  console.log(`  Contraseña  : ${MEDICO_PASS}`);
  console.log(`  Especialidad: ${medico.especialidad || MEDICO_ESPECIALIDAD}`);
  console.log(`  Franjas     : ${totalFranjas} activas (Lun–Sáb)`);
  console.log(`  Tipos TC    : ${TIPOS_CONSULTA.length} creados`);
  console.log('═══════════════════════════════════════════');
  console.log('\n🌐 Servicios necesarios:');
  console.log('  Backend  → cd backend  && npm run dev   (puerto 3001)');
  console.log('  Frontend → cd frontend && npm run dev   (puerto 5173)');
  console.log('\n🔑 Login: medico@estegia.com / 123456');
  console.log('');
}

main()
  .catch(e => { console.error('❌ Error:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
