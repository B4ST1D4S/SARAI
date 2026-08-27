import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ──────────────────────────────────────────────────────────────────────────
//  SEED DE PARAMETRIZACIÓN ODONTOLÓGICA
//  Catálogos base: estados clínicos, hallazgos, prioridades y riesgo clínico.
//  Idempotente (upsert por `codigo`). Reutilizable tras cada migración/reset.
// ──────────────────────────────────────────────────────────────────────────

const ESTADOS = [
  { codigo: 'SANO', nombre: 'Sano', color: '#22c55e', orden: 1 },
  { codigo: 'CARIES', nombre: 'Caries', color: '#ef4444', orden: 2 },
  { codigo: 'REQUIERE_TRATAMIENTO', nombre: 'Requiere tratamiento', color: '#f97316', orden: 3 },
  { codigo: 'OBSERVACION', nombre: 'En observación', color: '#eab308', orden: 4 },
  { codigo: 'PLANEADO', nombre: 'Planeado', color: '#eab308', orden: 5 },
  { codigo: 'AGENDADO', nombre: 'Agendado', color: '#3b82f6', orden: 6 },
  { codigo: 'EN_TRATAMIENTO', nombre: 'En tratamiento', color: '#06b6d4', orden: 7 },
  { codigo: 'TRATADO', nombre: 'Tratado / Obturado', color: '#3b82f6', orden: 8 },
  { codigo: 'FINALIZADO', nombre: 'Finalizado', color: '#22c55e', orden: 9 },
  { codigo: 'SUSPENDIDO', nombre: 'Suspendido', color: '#f97316', orden: 10 },
  { codigo: 'CANCELADO', nombre: 'Cancelado', color: '#6b7280', orden: 11 },
  { codigo: 'CONTROL', nombre: 'En control', color: '#14b8a6', orden: 12 },
  { codigo: 'AUSENTE', nombre: 'Ausente', color: '#1f2937', orden: 13 },
  { codigo: 'IMPLANTE', nombre: 'Implante', color: '#a855f7', orden: 14 },
  { codigo: 'PROTESIS', nombre: 'Prótesis / Corona', color: '#6b7280', orden: 15 },
];

const HALLAZGOS = [
  { codigo: 'CARIES', nombre: 'Caries dental', color: '#ef4444', categoria: 'PATOLOGIA', generaTratamiento: true, prioridadDefault: 'ALTA', icono: 'AlertTriangle' },
  { codigo: 'FRACTURA', nombre: 'Fractura', color: '#dc2626', categoria: 'PATOLOGIA', generaTratamiento: true, prioridadDefault: 'URGENTE', icono: 'Zap' },
  { codigo: 'AUSENTE', nombre: 'Diente ausente', color: '#1f2937', categoria: 'PATOLOGIA', generaTratamiento: false, prioridadDefault: 'MEDIA', icono: 'Minus' },
  { codigo: 'OBTURACION', nombre: 'Obturación existente', color: '#3b82f6', categoria: 'RESTAURACION', generaTratamiento: false, prioridadDefault: 'BAJA', icono: 'CheckCircle' },
  { codigo: 'CORONA', nombre: 'Corona', color: '#6b7280', categoria: 'PROTESIS', generaTratamiento: false, prioridadDefault: 'BAJA', icono: 'Crown' },
  { codigo: 'PROTESIS', nombre: 'Prótesis', color: '#6b7280', categoria: 'PROTESIS', generaTratamiento: false, prioridadDefault: 'BAJA', icono: 'Layers' },
  { codigo: 'ENDODONCIA', nombre: 'Endodoncia / Conducto', color: '#8b5cf6', categoria: 'ENDODONCIA', generaTratamiento: true, prioridadDefault: 'ALTA', icono: 'GitBranch' },
  { codigo: 'IMPLANTE', nombre: 'Implante', color: '#a855f7', categoria: 'PROTESIS', generaTratamiento: false, prioridadDefault: 'BAJA', icono: 'Anchor' },
  { codigo: 'SELLANTE', nombre: 'Sellante', color: '#10b981', categoria: 'RESTAURACION', generaTratamiento: true, prioridadDefault: 'BAJA', icono: 'Shield' },
  { codigo: 'MOVILIDAD', nombre: 'Movilidad dental', color: '#f59e0b', categoria: 'PERIODONCIA', generaTratamiento: true, prioridadDefault: 'MEDIA', icono: 'Move' },
  { codigo: 'GINGIVITIS', nombre: 'Gingivitis', color: '#fb7185', categoria: 'PERIODONCIA', generaTratamiento: true, prioridadDefault: 'MEDIA', icono: 'Activity' },
  { codigo: 'PERIODONTITIS', nombre: 'Periodontitis', color: '#e11d48', categoria: 'PERIODONCIA', generaTratamiento: true, prioridadDefault: 'ALTA', icono: 'Activity' },
  { codigo: 'CALCULO', nombre: 'Cálculo / Placa', color: '#d97706', categoria: 'PERIODONCIA', generaTratamiento: true, prioridadDefault: 'MEDIA', icono: 'Droplet' },
  { codigo: 'EXTRACCION', nombre: 'Indicación de extracción', color: '#991b1b', categoria: 'CIRUGIA', generaTratamiento: true, prioridadDefault: 'ALTA', icono: 'Trash2' },
  { codigo: 'RECONSTRUCCION', nombre: 'Reconstrucción', color: '#0ea5e9', categoria: 'RESTAURACION', generaTratamiento: true, prioridadDefault: 'MEDIA', icono: 'Wrench' },
  { codigo: 'SANO', nombre: 'Sano', color: '#22c55e', categoria: 'NORMAL', generaTratamiento: false, prioridadDefault: 'BAJA', icono: 'CheckCircle' },
  { codigo: 'BRUXISMO', nombre: 'Bruxismo', color: '#f59e0b', categoria: 'PATOLOGIA', generaTratamiento: true, prioridadDefault: 'MEDIA', icono: 'Activity' },
  { codigo: 'DESGASTE', nombre: 'Desgaste dental', color: '#d97706', categoria: 'PATOLOGIA', generaTratamiento: true, prioridadDefault: 'MEDIA', icono: 'TrendingDown' },
  { codigo: 'SENSIBILIDAD', nombre: 'Sensibilidad', color: '#fbbf24', categoria: 'PATOLOGIA', generaTratamiento: true, prioridadDefault: 'BAJA', icono: 'Zap' },
  { codigo: 'RESTAURACION_DEFECTUOSA', nombre: 'Restauración defectuosa', color: '#f97316', categoria: 'RESTAURACION', generaTratamiento: true, prioridadDefault: 'MEDIA', icono: 'AlertCircle' },
  { codigo: 'MALOCLUSION', nombre: 'Maloclusión', color: '#fb923c', categoria: 'ORTODONCIA', generaTratamiento: true, prioridadDefault: 'MEDIA', icono: 'GitCompare' },
  { codigo: 'DIASTEMA', nombre: 'Diastema', color: '#c026d3', categoria: 'ESTETICA', generaTratamiento: true, prioridadDefault: 'BAJA', icono: 'Maximize2' },
  { codigo: 'PIGMENTACION', nombre: 'Pigmentación', color: '#a16207', categoria: 'ESTETICA', generaTratamiento: true, prioridadDefault: 'BAJA', icono: 'Palette' },
  { codigo: 'SONRISA_GINGIVAL', nombre: 'Sonrisa gingival', color: '#ec4899', categoria: 'ESTETICA', generaTratamiento: true, prioridadDefault: 'BAJA', icono: 'Smile' },
  { codigo: 'ALTERACION_ESTETICA', nombre: 'Alteración estética', color: '#d946ef', categoria: 'ESTETICA', generaTratamiento: true, prioridadDefault: 'BAJA', icono: 'Sparkles' },
];

const PRIORIDADES = [
  { codigo: 'URGENTE', nombre: 'Urgente', color: '#dc2626', nivel: 4, orden: 1 },
  { codigo: 'ALTA', nombre: 'Alta', color: '#f97316', nivel: 3, orden: 2 },
  { codigo: 'MEDIA', nombre: 'Media', color: '#eab308', nivel: 2, orden: 3 },
  { codigo: 'BAJA', nombre: 'Baja', color: '#22c55e', nivel: 1, orden: 4 },
];

const RIESGOS = [
  { codigo: 'BAJO', nombre: 'Riesgo bajo', color: '#22c55e', orden: 1 },
  { codigo: 'MODERADO', nombre: 'Riesgo moderado', color: '#eab308', orden: 2 },
  { codigo: 'ALTO', nombre: 'Riesgo alto', color: '#ef4444', orden: 3 },
];

async function main() {
  console.log('🦷 Seed odontología: catálogos base...');

  for (const e of ESTADOS) {
    await prisma.odontoEstado.upsert({
      where: { codigo: e.codigo },
      update: { nombre: e.nombre, color: e.color, orden: e.orden },
      create: e,
    });
  }
  console.log(`  ✓ ${ESTADOS.length} estados clínicos`);

  for (const p of PRIORIDADES) {
    await prisma.odontoPrioridad.upsert({
      where: { codigo: p.codigo },
      update: { nombre: p.nombre, color: p.color, nivel: p.nivel, orden: p.orden },
      create: p,
    });
  }
  console.log(`  ✓ ${PRIORIDADES.length} prioridades`);

  for (const r of RIESGOS) {
    await prisma.odontoRiesgo.upsert({
      where: { codigo: r.codigo },
      update: { nombre: r.nombre, color: r.color, orden: r.orden },
      create: r,
    });
  }
  console.log(`  ✓ ${RIESGOS.length} niveles de riesgo`);

  for (const [i, h] of HALLAZGOS.entries()) {
    await prisma.odontoHallazgo.upsert({
      where: { codigo: h.codigo },
      update: {
        nombre: h.nombre,
        color: h.color,
        categoria: h.categoria,
        generaTratamiento: h.generaTratamiento,
        prioridadDefault: h.prioridadDefault,
        icono: h.icono,
        orden: i + 1,
      },
      create: { ...h, orden: i + 1 },
    });
  }
  console.log(`  ✓ ${HALLAZGOS.length} hallazgos`);

  console.log('🦷 Seed odontología completado.');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed odontología:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
