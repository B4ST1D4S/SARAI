"""
SARAI Whisper Service - EstetIA v2
Puerto: 8000
"""
import os
import tempfile
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel
import av
import numpy as np

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("sarai-whisper")

MODEL_SIZE = os.getenv("WHISPER_MODEL", "medium")
model: WhisperModel = None
RMS_VOZ_MINIMO = 0.015  # < 1.5% RMS = audio demasiado débil para Whisper

def get_audio_rms(file_path: str) -> float:
    try:
        container = av.open(file_path)
        samples_list = []
        fmt_name = "s16"
        for frame in container.decode(audio=0):
            fmt_name = frame.format.name  # e.g. "s16", "fltp", "s32", "u8"
            arr = frame.to_ndarray()      # PyAV 17: sin argumento format
            samples_list.append(arr.flatten().astype(np.float32))
        container.close()
        if not samples_list:
            return 0.0
        audio = np.concatenate(samples_list)
        # Normalizar según formato de muestra
        if "s16" in fmt_name:
            audio /= 32768.0
        elif "s32" in fmt_name:
            audio /= 2147483648.0
        elif "u8" in fmt_name:
            audio = (audio - 128.0) / 128.0
        # fltp / flt ya son float32 en rango [-1, 1]
        rms = float(np.sqrt(np.mean(audio ** 2)))
        log.info(f"Nivel RMS: {rms:.5f} ({rms*100:.2f}%)")
        return rms
    except Exception as e:
        log.warning(f"No se pudo medir nivel de audio: {e}")
        return -1.0

@asynccontextmanager
async def lifespan(app: FastAPI):
    global model
    log.info(f"Cargando modelo Whisper '{MODEL_SIZE}'...")
    model = WhisperModel(MODEL_SIZE, device="cpu", compute_type="int8")
    log.info("Modelo Whisper listo")
    yield
    log.info("Cerrando servicio Whisper")

app = FastAPI(title="SARAI Whisper Service", version="2.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.get("/health")
def health():
    return {"status": "ok", "modelo": MODEL_SIZE, "dispositivo": "cpu", "version": "2.0"}

@app.post("/test-audio")
async def test_audio(audio: UploadFile = File(...)):
    content = await audio.read()
    if len(content) < 100:
        return {"error": "archivo vacio", "bytes": len(content)}
    suffix = ".webm" if "webm" in (audio.content_type or "") else ".ogg"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(content)
        tmp_path = tmp.name
    try:
        rms = get_audio_rms(tmp_path)
        container = av.open(tmp_path)
        duracion = float(container.duration or 0) / 1_000_000
        container.close()
        return {"bytes": len(content), "duracion_seg": round(duracion, 2),
                "nivel_rms": round(rms, 5), "nivel_pct": round(rms * 100, 2),
                "tiene_voz": rms > RMS_VOZ_MINIMO}
    finally:
        try: os.unlink(tmp_path)
        except: pass

@app.post("/transcribir")
async def transcribir(audio: UploadFile = File(...)):
    if model is None:
        raise HTTPException(503, "Modelo no cargado aun")
    ct = audio.content_type or ""
    if "webm" in ct: suffix = ".webm"
    elif "ogg" in ct: suffix = ".ogg"
    elif "mp4" in ct or "m4a" in ct: suffix = ".mp4"
    elif "wav" in ct: suffix = ".wav"
    else: suffix = ".webm"
    content = await audio.read()
    if len(content) < 500:
        raise HTTPException(400, "Archivo de audio demasiado pequeno")
    log.info(f"Transcribiendo {len(content)} bytes ({suffix})")
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(content)
        tmp_path = tmp.name
    try:
        rms = get_audio_rms(tmp_path)
        if 0.0 <= rms < RMS_VOZ_MINIMO:
            log.warning(f"Audio demasiado debil RMS={rms:.5f} < {RMS_VOZ_MINIMO}. No se llama a Whisper.")
            return {"texto": "", "advertencia": "audio_silencio",
                    "nivel_rms": round(rms, 5), "nivel_pct": round(rms * 100, 2),
                    "idioma": "es", "confianza": 0.0, "segmentos": 0}
        segments, info = model.transcribe(
            tmp_path,
            language="es",
            beam_size=1,
            best_of=1,
            temperature=0.0,
            condition_on_previous_text=False,
            vad_filter=True,           # filtra silencios que causan alucinaciones
            vad_parameters={"min_silence_duration_ms": 300},
            no_speech_threshold=0.5,
            compression_ratio_threshold=1.8,  # rechaza texto repetitivo
            word_timestamps=False,
            suppress_blank=True,
            chunk_length=30,           # procesa en bloques de 30s → más rápido en audio largo
            initial_prompt="Consulta médica. Paciente, diagnóstico, antecedentes, presión arterial, peso, talla, alergias, medicamentos, cirugía estética.",
        )
        ALUCINACIONES = ["www.", ".com", ".net", ".org", ".info", ".edu",
            "gracias por ver", "suscribete", "subtitulos",
            "transcripcion automatica", "si te gusto", "dale like",
            "comparte", "canal de youtube", "copyright",
            # Frases típicas de alucinación en audio débil
            "la ciencia de", "hipotélica", "hipotetica", "hipotélica",
            "la medicina de la persona", "en el hospital",
            "las más importantes en el mundo", "lo más importante",
            "es una de las más", "en el mundo.",
            "subtítulos", "subtítulos en español", "música de fondo",
            "traducción", "traducción al español"]
        partes = []
        for seg in segments:
            t = seg.text.strip()
            if not t: continue
            tl = t.lower()
            if any(p in tl for p in ALUCINACIONES):
                log.warning(f"Alucinacion filtrada: '{t[:80]}'")
                continue
            if hasattr(seg, 'no_speech_prob') and seg.no_speech_prob > 0.9:
                log.warning(f"Silencio ignorado prob={seg.no_speech_prob:.2f}: '{t[:60]}'")
                continue
            partes.append(t)
        # Eliminar repeticiones consecutivas
        partes_uniq = []
        for p in partes:
            if not partes_uniq or p.strip('.').strip() != partes_uniq[-1].strip('.').strip():
                partes_uniq.append(p)
        texto = " ".join(partes_uniq).strip()
        log.info(f"Transcripcion ({info.language} {info.language_probability:.0%}) [{len(partes)} segs] RMS={rms:.4f}: '{texto[:120]}'")
        return {"texto": texto, "idioma": info.language,
                "confianza": round(info.language_probability, 3),
                "segmentos": len(partes),
                "nivel_rms": round(rms, 5), "nivel_pct": round(rms * 100, 2)}
    except Exception as e:
        log.error(f"Error transcribiendo: {e}")
        raise HTTPException(500, f"Error: {str(e)}")
    finally:
        try: os.unlink(tmp_path)
        except: pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
