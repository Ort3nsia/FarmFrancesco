import { useState } from 'react';
import { Sprout, LayoutDashboard, Rows3, Leaf, DatabaseBackup, Plus, Trash2, X, Check } from 'lucide-react';
import type { Year, YearAggregate } from '@/lib/types';

interface SidebarProps {
  years: Year[];
  activeYear: Year | null;
  view: string;
  onViewChange: (v: 'dashboard' | 'rows' | 'plants' | 'backup') => void;
  onSelectYear: (y: Year) => void;
  onAddYear: (yearValue: number) => void;
  onDeleteYear: (id: string) => void;
  aggregates: YearAggregate[];
  open: boolean;
}

export function Sidebar({
  years, activeYear, view, onViewChange, onSelectYear, onAddYear, onDeleteYear, aggregates, open,
}: SidebarProps) {
  const [adding, setAdding] = useState(false);
  const [newYear, setNewYear] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleAdd = () => {
    const val = parseInt(newYear, 10);
    if (isNaN(val) || val < 1900 || val > 2100) return;
    onAddYear(val);
    setNewYear('');
    setAdding(false);
  };

  const aggFor = (yv: number) => aggregates.find((a) => a.year_value === yv);

  const navItems = [
    { id: 'dashboard' as const, label: 'Cruscotto', icon: LayoutDashboard },
    { id: 'rows' as const, label: 'Filari', icon: Rows3 },
    { id: 'plants' as const, label: 'Piante', icon: Leaf },
    { id: 'backup' as const, label: 'Backup e Ripristino', icon: DatabaseBackup },
  ];

  return (
    <aside
      className={`fixed lg:sticky top-0 left-0 h-screen w-72 bg-white border-r border-stone-200 flex flex-col z-40 transition-transform duration-300 ${
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b border-stone-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shadow-sm">
            <Sprout className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-stone-800 text-lg leading-tight">Mappa Campo</h1>
            <p className="text-xs text-stone-400">Gestione permacoltura</p>
          </div>
        </div>
      </div>

      {/* Navigazione */}
      <nav className="px-3 py-3 border-b border-stone-100">
        <p className="text-xs font-medium text-stone-400 uppercase tracking-wide px-2 mb-2">Menu</p>
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-stone-600 hover:bg-stone-50'
                }`}
              >
                <Icon className={`w-4.5 h-4.5 ${active ? 'text-emerald-600' : 'text-stone-400'}`} />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Anni */}
      <div className="flex-1 overflow-auto px-3 py-3">
        <div className="flex items-center justify-between px-2 mb-2">
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wide">Anni</p>
          <button
            onClick={() => setAdding(!adding)}
            className="p-1 rounded-md hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {adding && (
          <div className="flex items-center gap-1.5 mb-2 px-1">
            <input
              type="number"
              value={newYear}
              onChange={(e) => setNewYear(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="2025"
              autoFocus
              className="flex-1 min-w-0 px-2 py-1.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
            />
            <button onClick={handleAdd} className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
              <Check className="w-4 h-4" />
            </button>
            <button onClick={() => { setAdding(false); setNewYear(''); }} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="space-y-1">
          {years.map((y) => {
            const agg = aggFor(y.year_value);
            const isActive = activeYear?.id === y.id;
            const isConfirming = confirmDelete === y.id;
            return (
              <div
                key={y.id}
                className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                  isActive ? 'bg-stone-100 border border-stone-200' : 'hover:bg-stone-50 border border-transparent'
                }`}
                onClick={() => onSelectYear(y)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-stone-700">{y.year_value}</span>
                    {y.is_active && (
                      <span className="px-1.5 py-0.5 text-[10px] font-medium bg-emerald-100 text-emerald-700 rounded-full">
                        Attivo
                      </span>
                    )}
                  </div>
                  {agg && (
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      {agg.total} piante · {agg.alive} sane · {agg.dead} morte
                    </p>
                  )}
                </div>
                {isConfirming ? (
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => { onDeleteYear(y.id); setConfirmDelete(null); }}
                      className="p-1 rounded-md bg-red-500 text-white hover:bg-red-600"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setConfirmDelete(null)} className="p-1 rounded-md hover:bg-stone-200 text-stone-400">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmDelete(y.id); }}
                    className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-50 text-stone-400 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
          {years.length === 0 && !adding && (
            <p className="text-xs text-stone-400 px-3 py-2">Nessun anno. Clicca + per aggiungerne uno.</p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-stone-100">
        <p className="text-[11px] text-stone-400">Dati salvati in Supabase</p>
      </div>
    </aside>
  );
}
