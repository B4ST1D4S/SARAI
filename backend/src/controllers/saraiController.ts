import { Request, Response } from 'express';

// -----------------------------------------------------------------------------
// Extractor local con patrones (sin API, siempre disponible como fallback)
// -----------------------------------------------------------------------------
function extraerCamposLocalmente(texto: string): Record<string, string> {
  const campos: Record<string, string> = {};

  const paMatch = texto.match(/\b(\d{2,3}[\s\/\-]\d{2,3})\s*(?:mmhg|mm hg)?/i);
  if (paMatch) campos['presionArterial'] = paMatch[1].replace(/\s/g, '/');

  const fcMatch = texto.match(/\b(\d{2,3})\s*(?:lpm|latidos|pulsaciones|bpm)/i);
  if (fcMatch) campos['frecuenciaCardiaca'] = fcMatch[1];

  const frMatch = texto.match(/\b(\d{2})\s*(?:rpm|respiraciones)/i);
  if (frMatch) campos['frecuenciaRespiratoria'] = frMatch[1];

  const tempMatch = texto.match(/\b(3[5-9](?:[.,]\d)?|4[0-2](?:[.,]\d)?)\s*(?:grados?|°|celsius|°c)/i);
  if (tempMatch) campos['temperatura'] = tempMatch[1].replace(',', '.');

  const pesoMatch = texto.match(/(?:pesa|peso\s+de)\s+(\d{2,3}(?:[.,]\d)?)\s*(?:kg|kilos?)/i)
    || texto.match(/\b(\d{2,3}(?:[.,]\d)?)\s*(?:kg|kilos?)\b/i);
  if (pesoMatch) campos['peso'] = pesoMatch[1].replace(',', '.');

  const tallaMatch = texto.match(/(?:talla|mide|altura)[^\d]*(\d{3}|\d[.,]\d{2})\s*(?:cm|m)?/i)
    || texto.match(/\b(\d{3})\s*cm\b/i);
  if (tallaMatch) {
    const val = tallaMatch[1].replace(',', '.');
    campos['talla'] = parseFloat(val) < 3 ? String(Math.round(parseFloat(val) * 100)) : val;
  }

  const alergiaMatch = texto.match(/(?:alerg[ií]a|al[eé]rgico)[^.;]{0,80}/i);
  if (alergiaMatch) campos['alergias'] = alergiaMatch[0].trim();

  const medMatch = texto.match(/(?:toma|tomo|medicamento|medicaci[oó]n)[^.;]{0,120}/i);
  if (medMatch) campos['medicamentosActuales'] = medMatch[0].trim();

  const antQuirMatch = texto.match(/(?:cirug[ií]a|operaci[oó]n|intervencion)[^.;]{0,100}/i);
  if (antQuirMatch) campos['antecedentesQuirurgicos'] = antQuirMatch[0].trim();

  const dxMatch = texto.match(/(?:diagn[oó]stico|impresion)\s*[:es]?\s*([^.;\n]{5,100})/i);
  if (dxMatch) campos['diagnostico'] = dxMatch[1].trim();

  const procMatch = texto.match(/(?:procedimiento|se\s+(?:har[aá]|propone|recomienda))\s*([^.;\n]{5,80})/i);
  if (procMatch) campos['procedimientoPropuesto'] = procMatch[1].trim();

  if (Object.keys(campos).length <= 1) {
    campos['quejaPrincipal'] = texto;
  } else {
    const inicio = texto.split(/[.;]/)[0].trim();
    if (inicio.length > 10) campos['quejaPrincipal'] = inicio;
  }
  return campos;
}

// -----------------------------------------------------------------------------
// Gemini: texto ? campos estructurados
// -----------------------------------------------------------------------------
// Lista de modelos en orden de prioridad (fallback automático)
const MODELOS_TEXTO = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemma-3-27b-it',
  'gemma-3-12b-it',
];

async function llamarModeloTexto(apiKey: string, prompt: string): Promise<string | null> {
  for (const modelo of MODELOS_TEXTO) {
    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 1500 },
          }),
        }
      );
      if (resp.ok) {
        const data = await resp.json() as any;
        const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (text) {
          console.log(`[SARAI] Usando modelo: ${modelo}`);
          return text;
        }
      } else if (resp.status === 429 || resp.status === 404) {
        // Cuota agotada o modelo no disponible ? intentar siguiente
        continue;
      } else {
        console.error(`[SARAI] ${modelo} error:`, resp.status);
        continue;
      }
    } catch (err: any) {
      console.error(`[SARAI] ${modelo} catch:`, err?.message);
      continue;
    }
  }
  return null;
}

async function geminiTextoACampos(texto: string, contexto: string): Promise<Record<string, string> | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes('pon-tu') || apiKey.includes('aqui')) return null;

  const prompt = `Eres SARAI, asistente clínica de EstetIA (medicina estética colombiana, Res. 1995/1999 - Ley 2015/2020).
El profesional dictó: "${texto}"
Contexto: ${contexto || 'historia clínica de medicina estética'}

Extrae SOLO los campos mencionados explícitamente. Omite los no mencionados.
Usa lenguaje médico formal. No inventes datos.

CAMPOS DISPONIBLES:
- quejaPrincipal: motivo principal de consulta
- historiaEnfermedad: descripción cronológica del padecimiento actual
- antecedentesPersonales: antecedentes médicos personales
- antecedentesFamiliares: antecedentes familiares relevantes
- antecedentesQuirurgicos: cirugías o procedimientos previos
- antecedentesEsteticos: procedimientos estéticos previos
- medicamentosActuales: medicamentos que toma actualmente
- alergias: alergias conocidas (medicamentos, materiales, sustancias)
- habitosToxicos: tabaco, alcohol, sustancias psicoactivas
- revisionSistemas: revisión por sistemas (cardiovascular, respiratorio, etc.)
- examenFisico: hallazgos del examen físico general
- presionArterial: valor numérico ej "120/80"
- frecuenciaCardiaca: valor numérico en lpm ej "72"
- frecuenciaRespiratoria: valor numérico en rpm ej "16"
- temperatura: valor numérico en °C ej "36.5"
- peso: valor numérico en kg ej "68"
- talla: valor numérico en cm ej "162"
- imc: índice de masa corporal si se menciona
- tipoPiel: tipo de piel (seca, grasa, mixta, sensible, normal)
- fototipo: fototipo Fitzpatrick (I al VI)
- zonasTratar: zonas anatómicas a tratar
- analisisFacial: descripción del análisis facial
- expectativasPaciente: expectativas y objetivos del paciente
- diagnostico: diagnóstico médico o estético
- planTratamiento: plan de tratamiento propuesto
- procedimientoPropuesto: procedimiento(s) a realizar
- recomendaciones: recomendaciones post procedimiento
- consentimientoExplicacion: explicación dada al paciente sobre riesgos
- observaciones: observaciones adicionales del médico

Responde ÚNICAMENTE con JSON válido, sin markdown, sin explicaciones.
Ejemplo: {"quejaPrincipal":"Flacidez abdominal post embarazo","peso":"68","presionArterial":"120/80","tipoPiel":"mixta","diagnostico":"Lipedema grado II"}`;

  try {
    const content = await llamarModeloTexto(apiKey, prompt);
    if (!content) return null;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);
    const clean: Record<string, string> = {};
    Object.entries(parsed).forEach(([k, v]) => {
      if (v !== null && v !== '' && v !== undefined) clean[k] = String(v);
    });
    return Object.keys(clean).length > 0 ? clean : null;
  } catch (err: any) {
    console.error('[SARAI] geminiTextoACampos error:', err?.message || err);
    return null;
  }
}

// -----------------------------------------------------------------------------
// Gemini: audio ? transcripcion + campos estructurados
// -----------------------------------------------------------------------------
async function geminiAudioACampos(
  audioBase64: string,
  mimeType: string,
  contexto: string
): Promise<{ transcripcion: string; campos: Record<string, string> } | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes('pon-tu') || apiKey.includes('aqui')) return null;

  // Normalizar mimeType a lo que Gemini acepta
  const mimeNorm = mimeType.split(';')[0].trim() || 'audio/webm';

  const prompt = `Eres SARAI, asistente médica de EstetIA (clínica de cirugía estética colombiana).
Transcribe el audio del médico y extrae los campos de historia clínica.

Responde SOLO con este JSON (sin markdown, sin explicaciones):
{
  "transcripcion": "texto completo de lo que dijo el médico",
  "quejaPrincipal": null,
  "historiaEnfermedad": null,
  "antecedentesFamiliares": null,
  "antecedentesPersonales": null,
  "antecedentesQuirurgicos": null,
  "medicamentosActuales": null,
  "alergias": null,
  "habitosToxicos": null,
  "examenFisico": null,
  "presionArterial": null,
  "frecuenciaCardiaca": null,
  "frecuenciaRespiratoria": null,
  "temperatura": null,
  "peso": null,
  "talla": null,
  "diagnostico": null,
  "planTratamiento": null,
  "procedimientoPropuesto": null,
  "observaciones": null
}
Contexto: ${contexto || 'historia clínica de cirugía estética colombiana'}`;

  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inlineData: { mimeType: mimeNorm, data: audioBase64 } },
            ],
          }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 1000 },
        }),
      }
    );

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('Gemini audio error:', resp.status, errText);
      return null;
    }

    const data = await resp.json() as any;
    const content: string = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    const transcripcion: string = parsed.transcripcion || '';
    const campos: Record<string, string> = {};
    Object.entries(parsed).forEach(([k, v]) => {
      if (k !== 'transcripcion' && v !== null && v !== '' && v !== undefined) {
        campos[k] = String(v);
      }
    });
    return { transcripcion, campos };
  } catch (err) {
    console.error('Gemini audio parse error:', err);
    return null;
  }
}

// -----------------------------------------------------------------------------
// Endpoint: POST /api/sarai/procesar-voz  (texto)
// -----------------------------------------------------------------------------
export async function procesarVoz(req: Request, res: Response): Promise<void> {
  try {
    const { texto, contexto } = req.body;
    if (!texto || String(texto).trim().length < 3) {
      res.status(400).json({ error: 'Texto vacío' });
      return;
    }
    const gemini = await geminiTextoACampos(String(texto), String(contexto || ''));
    if (gemini && Object.keys(gemini).length > 1) {
      res.json({ campos: gemini, motor: 'gemini' });
      return;
    }
    res.json({ campos: extraerCamposLocalmente(String(texto)), motor: 'local' });
  } catch (err) {
    console.error('procesarVoz error:', err);
    res.status(500).json({ error: 'Error interno' });
  }
}

// -----------------------------------------------------------------------------
// Endpoint: POST /api/sarai/procesar-audio  (audio base64)
// -----------------------------------------------------------------------------
export async function procesarAudio(req: Request, res: Response): Promise<void> {
  try {
    const { audio, mimeType, contexto } = req.body;
    if (!audio || audio.length < 100) {
      res.status(400).json({ error: 'Audio vacío o muy corto' });
      return;
    }

    // 1. Intentar Gemini con audio
    const geminiResult = await geminiAudioACampos(
      String(audio),
      String(mimeType || 'audio/webm'),
      String(contexto || '')
    );

    if (geminiResult) {
      const { transcripcion, campos } = geminiResult;
      if (Object.keys(campos).length > 0) {
        res.json({ campos, transcripcion, motor: 'gemini-audio' });
        return;
      }
      // Gemini transcribio pero no extrajo campos ? intentar con texto
      if (transcripcion && transcripcion.length > 5) {
        const camposDeTexto = await geminiTextoACampos(transcripcion, String(contexto || ''))
          || extraerCamposLocalmente(transcripcion);
        res.json({ campos: camposDeTexto, transcripcion, motor: 'gemini-audio+texto' });
        return;
      }
    }

    // 2. Sin Gemini (no hay key) ? informar al usuario
    res.json({
      campos: {},
      transcripcion: '',
      motor: 'sin-ia',
      error: 'Configura GEMINI_API_KEY en el backend para activar transcripcion de audio.',
    });
  } catch (err) {
    console.error('procesarAudio error:', err);
    res.status(500).json({ error: 'Error interno procesando audio' });
  }
}
