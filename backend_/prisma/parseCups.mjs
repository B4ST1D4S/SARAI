/**
 * parseCups.mjs
 * Parser del Anexo Técnico 2 "Lista Tabular" de la Resolución 2706 de 2025 (CUPS).
 *
 * Convierte el texto plano extraído del PDF en una lista de registros jerárquicos
 * (GRUPO > SUBGRUPO > CATEGORÍA > SUBCATEGORÍA) listos para insertar en la tabla CupsCodigo.
 */

// Encabezado REAL de sección en la lista tabular: "Sección 00 PROCEDIMIENTOS ..."
// (en mayúsculas). Se distingue del manual ("Sección 00: Procedimientos ...").
const RE_SECCION = /^Secci[oó]n\s+(\d{2})\s+PROCEDIMIENTOS/;
const RE_CAPITULO = /^Cap[ií]tulo\s+(\d{2})\s+[A-ZÁÉÍÓÚÑ]/;

// Códigos (más específico primero)
const RE_SUBCAT = /^(\d{2})\.(\d)\.(\d)\.(\d{2})(?:\s+(.*))?$/; // 01.0.1.01
const RE_CAT = /^(\d{2})\.(\d)\.(\d)\.(?:\s+(.*))?$/;           // 01.0.1.
const RE_SUBG = /^(\d{2})\.(\d)\.(?:\s+(.*))?$/;                // 01.0.
const RE_GRUPO = /^(\d{2})\.(?:\s+(.*))?$/;                     // 01.

// Anotaciones por código
const RE_INCLUYE = /^Incluye:\s*(.*)$/i;
const RE_EXCLUYE = /^Excluye:\s*(.*)$/i;
const RE_SIMULT = /^Simult[aá]neo:\s*(.*)$/i;
const RE_NOTA = /^Nota:\s*(.*)$/i;

// Bloque de notas generales (no pertenece a un código)
const RE_NOTAS_GEN = /^Notas?\s+aclaratorias/i;

// Artefactos de página a ignorar
const RE_SKIP =
  /^(Resoluci[oó]n n[uú]mero|Continuaci[oó]n de la resoluci[oó]n|CUPS["”]|C[OÓ]DIGO\s+DESCRIPCI[OÓ]N|Hoja No\.|Anexo T[eé]cnico)\b/i;

function limpiar(s) {
  return s.replace(/\s+/g, ' ').trim();
}

// Encabezado/pie de página de la lista tabular que el extractor del PDF a veces
// fusiona dentro de las descripciones (p. ej. "... SENO FRONTAL CUPS”").
const RE_HEADER_DESC =
  /\s*(Clasificaci[oó]n [OÚoú]nica de Procedimientos en Salud\s*[-–]?\s*)?CUPS["”]/g;

function limpiarDesc(s) {
  return limpiar(s.replace(RE_HEADER_DESC, ' '));
}

export function parseCupsText(fullText) {
  const lines = fullText.split('\n').map((l) => l.replace(/\u00a0/g, ' '));

  let seccion = null;
  let capitulo = null;
  let current = null; // registro en construcción
  let descMode = false; // ¿seguimos extendiendo la descripción?
  let anno = null; // { field, parts }
  let skipUntilCode = false; // dentro de "Notas aclaratorias" generales

  const records = [];

  const flushAnno = () => {
    if (current && anno && anno.parts.length) {
      current[anno.field] = limpiar(anno.parts.join(' '));
    }
    anno = null;
  };
  const flush = () => {
    flushAnno();
    if (current) {
      current.descripcion = limpiarDesc(current.descripcion);
      records.push(current);
    }
    current = null;
    descMode = false;
  };

  // Empezar en la primera "Sección 00"
  let started = false;

  for (let raw of lines) {
    const line = limpiar(raw);
    if (!line) continue;

    const mSec = line.match(RE_SECCION);
    if (mSec) {
      started = true;
      flush();
      seccion = mSec[1];
      skipUntilCode = false;
      continue;
    }
    if (!started) continue;

    if (RE_SKIP.test(line)) continue;

    const mCap = line.match(RE_CAPITULO);
    if (mCap) {
      flush();
      capitulo = mCap[1];
      skipUntilCode = false;
      continue;
    }

    if (RE_NOTAS_GEN.test(line)) {
      flush();
      skipUntilCode = true;
      continue;
    }

    // ¿Es un código? (probar del más específico al más general)
    let m, nivel, partes;
    if ((m = line.match(RE_SUBCAT))) {
      nivel = 'SUBCATEGORIA';
      partes = { g: m[1], sg: m[2], cat: m[3], sub: m[4], desc: m[5] || '' };
    } else if ((m = line.match(RE_CAT))) {
      nivel = 'CATEGORIA';
      partes = { g: m[1], sg: m[2], cat: m[3], desc: m[4] || '' };
    } else if ((m = line.match(RE_SUBG))) {
      nivel = 'SUBGRUPO';
      partes = { g: m[1], sg: m[2], desc: m[3] || '' };
    } else if ((m = line.match(RE_GRUPO))) {
      nivel = 'GRUPO';
      partes = { g: m[1], desc: m[2] || '' };
    }

    if (nivel) {
      flush();
      skipUntilCode = false;
      const { g, sg, cat, sub, desc } = partes;
      let codigo, codigoFormato;
      if (nivel === 'GRUPO') {
        codigo = g;
        codigoFormato = `${g}.`;
      } else if (nivel === 'SUBGRUPO') {
        codigo = g + sg;
        codigoFormato = `${g}.${sg}.`;
      } else if (nivel === 'CATEGORIA') {
        codigo = g + sg + cat;
        codigoFormato = `${g}.${sg}.${cat}.`;
      } else {
        codigo = g + sg + cat + sub;
        codigoFormato = `${g}.${sg}.${cat}.${sub}`;
      }
      current = {
        codigo,
        codigoFormato,
        nivel,
        descripcion: desc,
        seccion,
        capitulo,
        grupo: g,
        subgrupo: sg ?? null,
        categoria: cat ?? null,
        subcategoria: sub ?? null,
        incluye: null,
        excluye: null,
        nota: null,
        esFacturable: nivel === 'SUBCATEGORIA',
      };
      descMode = true;
      anno = null;
      continue;
    }

    if (skipUntilCode || !current) continue;

    // Anotaciones
    let am;
    if ((am = line.match(RE_INCLUYE))) {
      flushAnno();
      descMode = false;
      anno = { field: 'incluye', parts: am[1] ? [am[1]] : [] };
      continue;
    }
    if ((am = line.match(RE_EXCLUYE))) {
      flushAnno();
      descMode = false;
      anno = { field: 'excluye', parts: am[1] ? [am[1]] : [] };
      continue;
    }
    if ((am = line.match(RE_SIMULT))) {
      flushAnno();
      descMode = false;
      anno = { field: 'nota', parts: am[1] ? [`Simultáneo: ${am[1]}`] : ['Simultáneo:'] };
      continue;
    }
    if ((am = line.match(RE_NOTA))) {
      flushAnno();
      descMode = false;
      anno = { field: 'nota', parts: am[1] ? [am[1]] : [] };
      continue;
    }

    // Línea de continuación (descripción o anotación multilínea)
    if (anno) {
      anno.parts.push(line);
    } else if (descMode) {
      current.descripcion += (current.descripcion ? ' ' : '') + line;
    }
  }

  flush();

  // Calcular parentId por prefijo de código
  const byCodigo = new Map(records.map((r) => [r.codigo, r]));
  for (const r of records) {
    let parentCodigo = null;
    if (r.nivel === 'SUBCATEGORIA') parentCodigo = r.codigo.slice(0, 4);
    else if (r.nivel === 'CATEGORIA') parentCodigo = r.codigo.slice(0, 3);
    else if (r.nivel === 'SUBGRUPO') parentCodigo = r.codigo.slice(0, 2);
    r.parentCodigo = parentCodigo && byCodigo.has(parentCodigo) ? parentCodigo : null;
  }

  return records;
}
