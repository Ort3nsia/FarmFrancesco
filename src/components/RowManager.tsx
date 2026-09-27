import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Year, FarmRow } from '@/lib/types';
import { Plus, Pencil, Trash2, X, Check, GripVertical, ArrowRight, Ruler } from 'lucide-react';

interface RowManagerProps {
  year: Year;
  rows: FarmRow[];
  onRefresh: () => void;
  onSelectRow: (id: string) => void;
}

export function RowManager({ year, rows, onRefresh, onSelectRow }: RowManagerProps) {
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editLength, setEditLength] = useState('');
  const [editSpacing, setEditSpacing] = useState('');
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLength, setNewLength] = useState('10');
  const [newSpacing, setNewSpacing] = useState('100');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const startEdit = (row: FarmRow) => {
    setEditing(row.id);
    setEditName(row.name);
    setEditLength(String(row.length_m));
    setEditSpacing(String(row.spacing_cm));
  };

  const saveEdit = async (id: string) => {
    const length = parseFloat(editLength);
    const spacing = parseInt(editSpacing, 10);
    if (!editName.trim() || isNaN(length) || isNaN(spacing)) return;
    await supabase.from('rows').update({
      name: editName.trim(),
      length_m: length,
      spacing_cm: spacing,
    }).eq('id', id);
    setEditing(null);
    onRefresh();
  };

  const addRow = async () => {
    const length = parseFloat(newLength);
    const spacing = parseInt(newSpacing, 10);
    if (!newName.trim() || isNaN(length) || isNaN(spacing)) return;
    const sortOrder = rows.length > 0 ? Math.max(...rows.map((r) => r.sort_order)) + 1 : 0;
    await supabase.from('rows').insert({
      year_id: year.id,
      name: newName.trim(),
      length_m: length,
      spacing_cm: spacing,
      sort_order: sortOrder,
    });
    setNewName('');
    setNewLength('10');
    setNewSpacing('100');
    setAdding(false);
    onRefresh();
  };

  const deleteRow = async (id: string) => {
    await supabase.from('rows').delete().eq('id', id);
    setConfirmDelete(null);
    onRefresh();
  };

  const moveRow = async (id: string, direction: -1 | 1) => {
    const idx = rows.findIndex((r) => r.id === id);
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= rows.length) return;
    const a = rows[idx];
    const b = rows[swapIdx];
    await Promise.all([
      supabase.from('rows').update({ sort_order: b.sort_order }).eq('id', a.id),
      supabase.from('rows').update({ sort_order: a.sort_order }).eq('id', b.id),
    ]);
    onRefresh();
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              Anno {year.year_value}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-stone-800">Filari</h1>
          <p className="text-sm text-stone-400 mt-1">Filari agricoli ordinati per questo anno.</p>
        </div>
        <button
          onClick={() => setAdding(!adding)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Aggiungi filare
        </button>
      </div>

      {adding && (
        <div className="bg-white rounded-xl border border-stone-200 p-4 mb-4 space-y-3">
          <h3 className="text-sm font-semibold text-stone-700">Nuovo filare</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-stone-500 mb-1 block">Nome</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addRow()}
                placeholder="es. Filare Nord"
                autoFocus
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
              />
            </div>
            <div>
              <label className="text-xs text-stone-500 mb-1 block">Lunghezza (m)</label>
              <input
                type="number"
                value={newLength}
                onChange={(e) => setNewLength(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addRow()}
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
              />
            </div>
            <div>
              <label className="text-xs text-stone-500 mb-1 block">Spaziatura (cm)</label>
              <select
                value={newSpacing}
                onChange={(e) => setNewSpacing(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-emerald-400 bg-white"
              >
                <option value="25">25 cm</option>
                <option value="50">50 cm</option>
                <option value="100">100 cm</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={addRow} className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700">
              Salva
            </button>
            <button onClick={() => { setAdding(false); setNewName(''); }} className="px-4 py-2 text-stone-500 text-sm hover:bg-stone-100 rounded-lg">
              Annulla
            </button>
          </div>
        </div>
      )}

      {rows.length === 0 && !adding ? (
        <div className="bg-white rounded-xl border border-dashed border-stone-300 p-8 text-center">
          <Ruler className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-stone-600 mb-1">Nessun filare</h3>
          <p className="text-xs text-stone-400">Clicca "Aggiungi filare" per creare il tuo primo filare.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((row, idx) => {
            const isEditing = editing === row.id;
            const isConfirming = confirmDelete === row.id;
            return (
              <div
                key={row.id}
                className="bg-white rounded-xl border border-stone-200 hover:border-stone-300 transition-all group"
              >
                {isEditing ? (
                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-stone-500 mb-1 block">Nome</label>
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && saveEdit(row.id)}
                          className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-stone-500 mb-1 block">Lunghezza (m)</label>
                        <input
                          type="number"
                          value={editLength}
                          onChange={(e) => setEditLength(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && saveEdit(row.id)}
                          className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-stone-500 mb-1 block">Spaziatura (cm)</label>
                        <select
                          value={editSpacing}
                          onChange={(e) => setEditSpacing(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-emerald-400 bg-white"
                        >
                          <option value="25">25 cm</option>
                          <option value="50">50 cm</option>
                          <option value="100">100 cm</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => saveEdit(row.id)} className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700">
                        Salva
                      </button>
                      <button onClick={() => setEditing(null)} className="px-3 py-1.5 text-stone-500 text-sm hover:bg-stone-100 rounded-lg">
                        Annulla
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4">
                    <div className="flex flex-col items-center gap-0.5">
                      <button
                        onClick={() => moveRow(row.id, -1)}
                        disabled={idx === 0}
                        className="text-stone-300 hover:text-stone-600 disabled:opacity-30 disabled:cursor-not-allowed text-xs leading-none"
                      >
                        ▲
                      </button>
                      <GripVertical className="w-4 h-4 text-stone-300" />
                      <button
                        onClick={() => moveRow(row.id, 1)}
                        disabled={idx === rows.length - 1}
                        className="text-stone-300 hover:text-stone-600 disabled:opacity-30 disabled:cursor-not-allowed text-xs leading-none"
                      >
                        ▼
                      </button>
                    </div>

                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => onSelectRow(row.id)}
                    >
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-stone-800 text-sm">{row.name}</h3>
                        <span className="text-[11px] text-stone-400">#{row.sort_order + 1}</span>
                      </div>
                      <p className="text-xs text-stone-400 mt-0.5">
                        {row.length_m}m di lunghezza · {row.spacing_cm}cm di spaziatura
                      </p>
                    </div>

                    <button
                      onClick={() => onSelectRow(row.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                    >
                      Vedi piante
                      <ArrowRight className="w-3 h-3" />
                    </button>

                    {isConfirming ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => deleteRow(row.id)} className="p-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setConfirmDelete(null)} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEdit(row)} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-600">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => setConfirmDelete(row.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-stone-400 hover:text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
