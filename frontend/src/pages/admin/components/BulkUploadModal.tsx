import { useRef, useState } from 'react';
import { AlertTriangle, CheckCircle, Download, Upload } from 'lucide-react';
import { Modal } from './AdminModal';

export function csvToObjects(text: string): any[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim().replace(/"/g, ''));
    const obj: any = {};
    headers.forEach((h, i) => { obj[h] = vals[i] ?? ''; });
    return obj;
  });
}

export function downloadTemplate(headers: string[], filename: string) {
  const blob = new Blob([headers.join(',') + '\n'], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function BulkModal({ title, headers, filename, onUpload, onClose }: {
  title: string; headers: string[]; filename: string;
  onUpload: (items: any[]) => Promise<any>; onClose: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<'idle'|'loading'|'done'|'error'>('idle');
  const [result, setResult] = useState<any>(null);
  const [preview, setPreview] = useState<any[]>([]);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setPreview(csvToObjects(ev.target?.result as string).slice(0, 5));
    reader.readAsText(file, 'utf-8');
  };

  const send = async () => {
    const file = ref.current?.files?.[0]; if (!file) return;
    setState('loading');
    try {
      const res = await onUpload(csvToObjects(await file.text()));
      setResult(res); setState('done');
    } catch (err: any) { setResult({ error: err.message }); setState('error'); }
  };

  return (
    <Modal title={title} onClose={onClose} maxW="max-w-lg">
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <div>
            <p className="text-xs font-semibold text-blue-300">1. Descarga la plantilla CSV</p>
            <p className="text-[11px] text-blue-400/70">Columnas: {headers.join(', ')}</p>
          </div>
          <button onClick={() => downloadTemplate(headers, filename)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 text-xs rounded-lg border border-blue-500/30 transition">
            <Download size={13} /> Plantilla
          </button>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-300 mb-2">2. Sube el archivo CSV completado</p>
          <label className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-slate-600 hover:border-yellow-600/50 rounded-xl cursor-pointer transition">
            <Upload size={24} className="text-gray-500" />
            <span className="text-xs text-gray-400">Haz clic o arrastra tu archivo CSV aquí</span>
            <input ref={ref} type="file" accept=".csv" className="hidden" onChange={onFile} />
          </label>
        </div>

        {preview.length > 0 && (
          <div>
            <p className="text-xs text-gray-400 mb-1">Vista previa (primeras {preview.length} filas):</p>
            <div className="overflow-x-auto rounded-lg border border-white/5">
              <table className="w-full text-[10px]">
                <thead><tr className="bg-slate-800">
                  {Object.keys(preview[0]).map(k => <th key={k} className="px-2 py-1 text-gray-400 text-left">{k}</th>)}
                </tr></thead>
                <tbody>{preview.map((r, i) => (
                  <tr key={i} className="border-t border-white/5">
                    {Object.values(r).map((v: any, j) => <td key={j} className="px-2 py-1 text-gray-300">{v}</td>)}
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        )}

        {state === 'done' && result && (
          <div className="flex items-start gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <CheckCircle size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-emerald-300">
              <p className="font-semibold">¡Cargue completado!</p>
              <p>Creados: {result.created} · Omitidos (ya existen): {result.skipped}</p>
              {result.errors?.length > 0 && <p className="text-yellow-400 mt-1">Errores: {result.errors.length}</p>}
            </div>
          </div>
        )}
        {state === 'error' && result && (
          <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
            <AlertTriangle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-300">{result.error}</p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <button onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-white/10 rounded-lg transition">
            {state === 'done' ? 'Cerrar' : 'Cancelar'}
          </button>
          {state !== 'done' && (
            <button onClick={send} disabled={state === 'loading'}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition">
              {state === 'loading' ? 'Procesando...' : <><Upload size={14} /> Importar</>}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
