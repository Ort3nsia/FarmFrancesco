import { Sprout, Rows3, Leaf, MessageSquare, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import type { Year, FarmRow, Plant, Observation, YearAggregate, Category } from '@/lib/types';
import { CATEGORY_META, CATEGORY_LIST } from '@/lib/types';

interface DashboardProps {
  activeYear: Year | null;
  rows: FarmRow[];
  plants: Plant[];
  observations: Observation[];
  aggregates: YearAggregate[];
  onNavigate: (v: 'dashboard' | 'rows' | 'plants' | 'backup') => void;
}

export function Dashboard({ activeYear, rows, plants, observations, aggregates, onNavigate }: DashboardProps) {
  if (!activeYear) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <Sprout className="w-12 h-12 text-stone-300 mb-3" />
        <h2 className="text-lg font-semibold text-stone-700 mb-1">Benvenuto in Mappa Campo</h2>
        <p className="text-sm text-stone-400 max-w-sm">
          Crea il tuo primo anno agricolo usando il pulsante + nella sidebar per iniziare.
        </p>
      </div>
    );
  }

  const aliveCount = plants.filter((p) => p.status === 'alive').length;
  const deadCount = plants.filter((p) => p.status === 'dead').length;
  const survivalRate = plants.length > 0 ? Math.round((aliveCount / plants.length) * 100) : 0;

  const categoryCounts = plants.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const stats = [
    { label: 'Filari', value: rows.length, icon: Rows3, color: 'text-sky-600', bg: 'bg-sky-50', onClick: () => onNavigate('rows') },
    { label: 'Piante', value: plants.length, icon: Leaf, color: 'text-emerald-600', bg: 'bg-emerald-50', onClick: () => onNavigate('plants') },
    { label: 'Osservazioni', value: observations.length, icon: MessageSquare, color: 'text-amber-600', bg: 'bg-amber-50', onClick: () => onNavigate('plants') },
    { label: 'Tasso Sopravvivenza', value: `${survivalRate}%`, icon: survivalRate >= 50 ? TrendingUp : TrendingDown, color: survivalRate >= 50 ? 'text-emerald-600' : 'text-red-500', bg: survivalRate >= 50 ? 'bg-emerald-50' : 'bg-red-50', onClick: () => onNavigate('plants') },
  ];

  // Report mortalità per categoria
  const mortalityByCategory = CATEGORY_LIST.map((cat) => {
    const catPlants = plants.filter((p) => p.category === cat);
    const dead = catPlants.filter((p) => p.status === 'dead').length;
    const total = catPlants.length;
    const rate = total > 0 ? Math.round((dead / total) * 100) : 0;
    return { category: cat, total, dead, rate };
  }).filter((r) => r.total > 0);

  // Report mortalità per specie
  const mortalityBySpecies = plants.reduce((acc, p) => {
    const key = p.species || 'Senza nome';
    if (!acc[key]) acc[key] = { total: 0, dead: 0 };
    acc[key].total++;
    if (p.status === 'dead') acc[key].dead++;
    return acc;
  }, {} as Record<string, { total: number; dead: number }>);

  const speciesRows = Object.entries(mortalityBySpecies)
    .map(([species, data]) => ({
      species,
      total: data.total,
      dead: data.dead,
      rate: data.total > 0 ? Math.round((data.dead / data.total) * 100) : 0,
    }))
    .filter((r) => r.dead > 0)
    .sort((a, b) => b.dead - a.dead);

  const yearComparison = aggregates.filter((a) => a.total > 0);

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            Anno {activeYear.year_value}
          </span>
          {activeYear.is_active && (
            <span className="text-xs font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
              Anno attivo
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold text-stone-800">Cruscotto</h1>
        <p className="text-sm text-stone-400 mt-1">Panoramica del tuo campo agricolo per il {activeYear.year_value}.</p>
      </div>

      {/* Schede statistiche */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.label}
              onClick={s.onClick}
              className="bg-white rounded-xl border border-stone-200 p-4 text-left hover:border-stone-300 hover:shadow-sm transition-all group"
            >
              <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <Icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold text-stone-800">{s.value}</p>
              <p className="text-xs text-stone-400 mt-0.5">{s.label}</p>
            </button>
          );
        })}
      </div>

      {/* Barra sana/morta */}
      {plants.length > 0 && (
        <div className="bg-white rounded-xl border border-stone-200 p-5">
          <h3 className="text-sm font-semibold text-stone-700 mb-3">Distribuzione stato piante</h3>
          <div className="flex h-3 rounded-full overflow-hidden bg-stone-100">
            <div
              className="bg-emerald-500 transition-all duration-500"
              style={{ width: `${(aliveCount / plants.length) * 100}%` }}
            />
            <div
              className="bg-red-400 transition-all duration-500"
              style={{ width: `${(deadCount / plants.length) * 100}%` }}
            />
          </div>
          <div className="flex items-center gap-6 mt-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs text-stone-600">{aliveCount} sane</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <span className="text-xs text-stone-600">{deadCount} morte</span>
            </div>
          </div>
        </div>
      )}

      {/* Ripartizione categorie */}
      {plants.length > 0 && (
        <div className="bg-white rounded-xl border border-stone-200 p-5">
          <h3 className="text-sm font-semibold text-stone-700 mb-3">Categorie Piante</h3>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {Object.entries(CATEGORY_META).map(([key, meta]) => {
              const count = categoryCounts[key] ?? 0;
              return (
                <div key={key} className={`${meta.bg} ${meta.border} border rounded-lg p-3`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-base leading-none">{meta.icon}</span>
                    <span className={`text-xs font-medium ${meta.color}`}>{meta.label}</span>
                  </div>
                  <p className="text-xl font-bold text-stone-700">{count}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Confronto anno per anno */}
      {yearComparison.length > 1 && (
        <div className="bg-white rounded-xl border border-stone-200 p-5">
          <h3 className="text-sm font-semibold text-stone-700 mb-4">Confronto Anno per Anno</h3>
          <div className="space-y-3">
            {yearComparison.map((a) => {
              const max = Math.max(...yearComparison.map((y) => y.total));
              const width = max > 0 ? (a.total / max) * 100 : 0;
              return (
                <div key={a.year_value} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-stone-500 w-10 text-right">{a.year_value}</span>
                  <div className="flex-1 h-6 bg-stone-100 rounded-md overflow-hidden relative">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-md transition-all duration-500 flex items-center justify-end pr-2"
                      style={{ width: `${width}%` }}
                    >
                      <span className="text-[10px] font-semibold text-white">{a.total}</span>
                    </div>
                  </div>
                  <span className="text-[11px] text-stone-400 w-20">{a.alive} sane / {a.dead} morte</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Report Mortalità */}
      {plants.length > 0 && deadCount > 0 && (
        <div className="bg-white rounded-xl border border-red-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h3 className="text-sm font-semibold text-stone-700">Report Mortalità</h3>
            <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded-full">{deadCount} piante morte</span>
          </div>

          {/* Per categoria */}
          {mortalityByCategory.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-medium text-stone-500 mb-2">Per categoria</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-stone-400 border-b border-stone-100">
                      <th className="text-left py-2 pr-4 font-medium">Categoria</th>
                      <th className="text-right py-2 px-3 font-medium">Totale</th>
                      <th className="text-right py-2 px-3 font-medium">Morte</th>
                      <th className="text-right py-2 pl-3 font-medium">% Mortalità</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mortalityByCategory.map((r) => {
                      const meta = CATEGORY_META[r.category as Category];
                      return (
                        <tr key={r.category} className="border-b border-stone-50 last:border-0">
                          <td className="py-2 pr-4">
                            <span className="flex items-center gap-1.5">
                              <span>{meta.icon}</span>
                              <span className="text-stone-700">{meta.label}</span>
                            </span>
                          </td>
                          <td className="text-right py-2 px-3 text-stone-600 tabular-nums">{r.total}</td>
                          <td className="text-right py-2 px-3 text-red-600 tabular-nums">{r.dead}</td>
                          <td className="text-right py-2 pl-3">
                            <span className={`tabular-nums font-medium ${r.rate >= 50 ? 'text-red-600' : r.rate >= 25 ? 'text-amber-600' : 'text-stone-500'}`}>
                              {r.rate}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Per specie */}
          {speciesRows.length > 0 && (
            <div>
              <p className="text-xs font-medium text-stone-500 mb-2">Per specie (solo quelle con morti)</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-stone-400 border-b border-stone-100">
                      <th className="text-left py-2 pr-4 font-medium">Specie</th>
                      <th className="text-right py-2 px-3 font-medium">Totale piantate</th>
                      <th className="text-right py-2 px-3 font-medium">Morte</th>
                      <th className="text-right py-2 pl-3 font-medium">% Mortalità</th>
                    </tr>
                  </thead>
                  <tbody>
                    {speciesRows.map((r) => (
                      <tr key={r.species} className="border-b border-stone-50 last:border-0">
                        <td className="py-2 pr-4 text-stone-700">{r.species}</td>
                        <td className="text-right py-2 px-3 text-stone-600 tabular-nums">{r.total}</td>
                        <td className="text-right py-2 px-3 text-red-600 tabular-nums">{r.dead}</td>
                        <td className="text-right py-2 pl-3">
                          <span className={`tabular-nums font-medium ${r.rate >= 50 ? 'text-red-600' : r.rate >= 25 ? 'text-amber-600' : 'text-stone-500'}`}>
                            {r.rate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Osservazioni recenti */}
      {observations.length > 0 && (
        <div className="bg-white rounded-xl border border-stone-200 p-5">
          <h3 className="text-sm font-semibold text-stone-700 mb-3">Osservazioni Recenti</h3>
          <div className="space-y-2">
            {observations.slice(0, 5).map((o) => {
              const plant = plants.find((p) => p.id === o.plant_id);
              const row = plant ? rows.find((r) => r.id === plant.row_id) : null;
              return (
                <div key={o.id} className="flex items-start gap-3 py-2 border-b border-stone-100 last:border-0">
                  <div className="w-7 h-7 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-stone-700">{o.text}</p>
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      {row?.name ?? 'Filare sconosciuto'} · {plant?.species || 'Specie sconosciuta'} · {new Date(o.created_at).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {plants.length === 0 && rows.length === 0 && (
        <div className="bg-white rounded-xl border border-dashed border-stone-300 p-8 text-center">
          <Sprout className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-stone-600 mb-1">Niente qui per ora</h3>
          <p className="text-xs text-stone-400 mb-4">Inizia aggiungendo dei filari, poi riempili con le piante.</p>
          <button
            onClick={() => onNavigate('rows')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Rows3 className="w-4 h-4" />
            Aggiungi il primo filare
          </button>
        </div>
      )}
    </div>
  );
}
