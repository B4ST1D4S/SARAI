import { Plus, Save, ToggleLeft, ToggleRight, Upload } from 'lucide-react';

export function Sw({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" onClick={() => onChange(!value)}
      className="flex items-center gap-2 text-xs text-gray-300 hover:text-white transition select-none">
      {value
        ? <ToggleRight size={20} className="text-yellow-400" />
        : <ToggleLeft size={20} className="text-gray-500" />}
      {label}
    </button>
  );
}

export function Field({ label, value, onChange, type = 'text', required = false, placeholder = '', step }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; required?: boolean; placeholder?: string; step?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {type === 'textarea'
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-yellow-500 focus:outline-none resize-none" />
        : <input type={type} value={value} onChange={e => onChange(e.target.value)}
            placeholder={placeholder} required={required} step={step}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-yellow-500 focus:outline-none" />
      }
    </div>
  );
}

export function Sel({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-yellow-500 focus:outline-none">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

export function ErrBox({ msg }: { msg: string }) {
  return <p className="text-red-400 text-xs bg-red-500/10 rounded-lg px-3 py-2">{msg}</p>;
}

export function ErrBanner({ msg, onRetry }: { msg: string; onRetry: () => void }) {
  return (
    <div className="flex items-center gap-3 mb-3 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-300">
      <span className="flex-1">⚠ {msg}</span>
      <button onClick={onRetry} className="px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/30 transition text-red-200">
        Reintentar
      </button>
    </div>
  );
}

export function SecHeader({ title, onNew, onBulk }: { title: string; onNew: () => void; onBulk?: () => void }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
      <h2 className="text-sm font-bold text-white">{title}</h2>
      <div className="flex gap-2">
        {onBulk && (
          <button onClick={onBulk}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-gray-300 hover:text-white rounded-lg text-xs font-semibold border border-white/10 transition">
            <Upload size={13} /> Cargue Masivo
          </button>
        )}
        <button onClick={onNew}
          className="flex items-center gap-1.5 px-3 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg text-xs font-semibold transition">
          <Plus size={13} /> Nuevo
        </button>
      </div>
    </div>
  );
}

export function FormFooter({ onCancel, onSave, saving = false }: {
  onCancel: () => void; onSave: () => void; saving?: boolean;
}) {
  return (
    <div className="flex justify-end gap-3 pt-3 border-t border-white/5 mt-4">
      <button onClick={onCancel} disabled={saving}
        className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-white/10 rounded-lg transition disabled:opacity-40 disabled:pointer-events-none">
        Cancelar
      </button>
      <button
        onClick={onSave}
        disabled={saving}
        className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none">
        {saving
          ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando…</>
          : <><Save size={14} /> Guardar</>}
      </button>
    </div>
  );
}
