/**
 * seedCups.mjs
 * Carga la Clasificación Única de Procedimientos en Salud (CUPS) de la
 * Resolución 2706 de 2025 en la tabla CupsCodigo.
 *
 * Uso:
 *   node prisma/seedCups.mjs
 *   CUPS_PDF_PATH="C:/ruta/al/Resolucion-2706-de-2025-CUPS.pdf" node prisma/seedCups.mjs
 *
 * Lee el PDF (Anexo Técnico 2 "Lista Tabular"), lo parsea con parseCups.mjs
 * y reemplaza el contenido de la tabla CupsCodigo de forma idempotente.
 */
import fs from 'fs';
import { createRequire } from 'module';
import { randomUUID } from 'crypto';
import { PrismaClient } from '@prisma/client';
import { parseCupsText } from './parseCups.mjs';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

const prisma = new PrismaClient();

const DEFAULT_PDF =
  'C:/Users/Coordinador Soporte/Downloads/Resolucion-2706-de-2025-CUPS.pdf';

const NIVEL_ORDER = ['GRUPO', 'SUBGRUPO', 'CATEGORIA', 'SUBCATEGORIA'];

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/** Deduplica por código quedándose con la descripción más larga (la real). */
function dedupe(records) {
  const map = new Map();
  for (const r of records) {
    const prev = map.get(r.codigo);
    if (!prev || (r.descripcion?.length || 0) > (prev.descripcion?.length || 0)) {
      map.set(r.codigo, r);
    }
  }
  return [...map.values()];
}

async function main() {
  const pdfPath = process.env.CUPS_PDF_PATH || DEFAULT_PDF;
  if (!fs.existsSync(pdfPath)) {
    console.error(`❌ No se encontró el PDF en: ${pdfPath}`);
    console.error('   Define la ruta con la variable CUPS_PDF_PATH.');
    process.exit(1);
  }

  console.log(`📄 Leyendo PDF: ${pdfPath}`);
  const { text, numpages } = await pdfParse(fs.readFileSync(pdfPath));
  console.log(`   Páginas: ${numpages} · caracteres: ${text.length}`);

  console.log('🔎 Parseando lista tabular...');
  let records = parseCupsText(text);

  // Limpieza: deduplicar y descartar registros sin descripción (artefactos)
  const antes = records.length;
  records = dedupe(records).filter((r) => r.descripcion && r.descripcion.trim().length > 0);
  console.log(`   Registros: ${records.length} (descartados ${antes - records.length})`);

  const conteo = NIVEL_ORDER.map((n) => `${n}=${records.filter((r) => r.nivel === n).length}`);
  console.log('   ' + conteo.join(' · '));

  // Asignar ids y resolver parentId por código
  const idByCodigo = new Map();
  for (const r of records) {
    r.id = randomUUID();
    idByCodigo.set(r.codigo, r.id);
  }
  for (const r of records) {
    r.parentId = r.parentCodigo ? idByCodigo.get(r.parentCodigo) ?? null : null;
  }

  // Reemplazo idempotente del catálogo
  console.log('🗑️  Limpiando catálogo CUPS anterior...');
  await prisma.cupsCodigo.deleteMany({});

  console.log('💾 Insertando registros por nivel...');
  let total = 0;
  for (const nivel of NIVEL_ORDER) {
    const rows = records
      .filter((r) => r.nivel === nivel)
      .map((r) => ({
        id: r.id,
        codigo: r.codigo,
        codigoFormato: r.codigoFormato,
        nivel: r.nivel,
        descripcion: r.descripcion,
        seccion: r.seccion,
        capitulo: r.capitulo,
        grupo: r.grupo,
        subgrupo: r.subgrupo,
        categoria: r.categoria,
        subcategoria: r.subcategoria,
        parentId: r.parentId,
        incluye: r.incluye,
        excluye: r.excluye,
        nota: r.nota,
        esFacturable: r.esFacturable,
      }));

    for (const part of chunk(rows, 2000)) {
      const res = await prisma.cupsCodigo.createMany({ data: part, skipDuplicates: true });
      total += res.count;
    }
    console.log(`   ${nivel}: ${rows.length} insertados`);
  }

  const enBd = await prisma.cupsCodigo.count();
  console.log(`✅ Listo. Insertados ${total}. Total en BD: ${enBd}`);
}

main()
  .catch((e) => {
    console.error('❌ Error en seed CUPS:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
