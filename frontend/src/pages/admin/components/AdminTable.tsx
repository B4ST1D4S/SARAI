import { Edit2, Trash2 } from 'lucide-react';

export function TableSkeleton({ cols }: { cols: number }) {
  return (
    <div className="rounded-xl border border-white/5 overflow-hidden animate-pulse">
      <div className="bg-slate-800/70 flex gap-3 px-4 py-3">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-2.5 bg-slate-600 rounded flex-1" />
        ))}
        <div className="h-2.5 bg-slate-600 rounded w-14 shrink-0" />
      </div>
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="flex gap-3 items-center px-4 py-4 border-t border-white/5">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-2.5 bg-slate-800/80 rounded flex-1" style={{ maxWidth: `${80 + j * 25}px` }} />
          ))}
          <div className="h-2.5 bg-slate-800/80 rounded w-10 shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function Table({ items, cols, onEdit, onDelete, loading = false }: {
  items: any[];
  cols: { key: string; label: string; render?: (r: any) => React.ReactNode }[];
  onEdit: (r: any) => void;
  onDelete: (r: any) => void;
  loading?: boolean;
}) {
  if (loading && !items.length)
    return <TableSkeleton cols={cols.length} />;
  if (!items.length)
    return (
      <p className="text-center text-gray-500 py-14 text-sm">
        Sin registros. Agrega uno nuevo o usa <span className="text-yellow-500">Cargue Masivo</span>.
      </p>
    );
  return (
    <div className="overflow-x-auto rounded-xl border border-white/5">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-800/70">
            {cols.map(c => (
              <th key={c.key} className="text-left px-4 py-3 font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{c.label}</th>
            ))}
            <th className="px-4 py-3 text-right font-semibold text-gray-400 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {items.map((row, i) => (
            <tr key={row.id || i} className="hover:bg-slate-800/30 transition">
              {cols.map(c => (
                <td key={c.key} className="px-4 py-3 text-gray-300">
                  {c.render ? c.render(row) : (row[c.key] ?? '—')}
                </td>
              ))}
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button onClick={() => onEdit(row)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 transition">
                    <Edit2 size={13} />
                  </button>
                  <button onClick={() => onDelete(row)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition">
                    <Trash2 size={13} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function EBadge(v: boolean) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium
      ${v ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
      {v ? 'Activo' : 'Inactivo'}
    </span>
  );
}
