import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Category, FarmRow, Observation, Plant, Status, Year } from '@/lib/types';
import { CATEGORY_LIST, CATEGORY_META } from '@/lib/types';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  Leaf,
  Maximize2,
  MessageSquare,
  Minimize2,
  Pencil,
  Plus,
  Ruler,
  Sprout,
  Trash2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

interface PlantManagerProps {
  year: Year;
  rows: FarmRow[];
  plants: Plant[];
  observations: Observation[];
  onRefresh: () => void;
  selectedRowId: string | null;
  selectedPlantId: string | null;
  onSelectPlant: (id: string | null) => void;
}

type PlantForm = {
  species: string;
  category: Category;
  status: Status;
  notes: string;
  distance_cm: string;
  planted_year: string;
  death_year: string;
};

const emptyForm: PlantForm = {
  species: '',
  category: 'support',
  status: 'alive',
  notes: '',
  distance_cm: '0',
  planted_year: '',
  death_year: '',
};

const inputClass =
  'w-full px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400';

export function PlantManager({
  year,
  rows,
  plants,
  observations,
  onRefresh,
  selectedRowId,
  selectedPlantId,
  onSelectPlant,
}: PlantManagerProps) {
  const [activeRowId, setActiveRowId] = useState<string | null>(selectedRowId ?? rows[0]?.id ?? null);
  const [filterCategory, setFilterCategory] = useState<Category | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<Status | 'all'>('all');
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [form, setForm] = useState<PlantForm>(emptyForm);
  const [editingPlantId, setEditingPlantId] = useState<string | null>(null);
  const [observationText, setObservationText] = useState('');
  const [saving, setSaving] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [manualDistance, setManualDistance] = useState('');
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    if (selectedRowId && rows.some((r) => r.id === selectedRowId)) setActiveRowId(selectedRowId);
  }, [selectedRowId, rows]);

  useEffect(() => {
    if (activeRowId && !rows.some((r) => r.id === activeRowId)) setActiveRowId(rows[0]?.id ?? null);
  }, [activeRowId, rows]);

  const activeRow = rows.find((r) => r.id === activeRowId) ?? null;
  const rowPlants = useMemo(() => plants.filter((p) => p.row_id === activeRowId), [plants, activeRowId]);
  const visiblePlants = rowPlants.filter(
    (p) =>
      (filterCategory === 'all' || p.category === filterCategory) &&
      (filterStatus === 'all' || p.status === filterStatus),
  );
  const selectedPlant = plants.find((p) => p.id === selectedPlantId) ?? null;
  const selectedObservations = observations.filter((o) => o.plant_id === selectedPlantId);
  const activeIndex = activeRowId ? rows.findIndex((r) => r.id === activeRowId) : -1;

  const openAdd = (distanceCm?: number) => {
    const dist = Math.max(0, Math.round(distanceCm ?? 0));
    setForm({ ...emptyForm, distance_cm: String(dist) });
    setEditingPlantId(null);
    onSelectPlant(null);
    setModal('add');
  };

  const parseDistance = (text: string): number | null => {
    const cleaned = text.trim().toLowerCase().replace(',', '.');
    const mMatch = cleaned.match(/^([\d.]+)\s*m$/);
    if (mMatch) return Math.round(parseFloat(mMatch[1]) * 100);
    const cmMatch = cleaned.match(/^([\d.]+)\s*cm?$/);
    if (cmMatch) return Math.round(parseFloat(cmMatch[1]));
    const bare = parseFloat(cleaned);
    if (!isNaN(bare)) return Math.round(bare);
    return null;
  };

  const handleManualAdd = () => {
    const dist = parseDistance(manualDistance);
    if (dist === null || !activeRow) return;
    const clamped = Math.min(dist, Math.round(activeRow.length_m * 100));
    openAdd(clamped);
    setManualDistance('');
    setShowManual(false);
  };

  const openEdit = (plant: Plant) => {
    setEditingPlantId(plant.id);
    setForm({
      species: plant.species,
      category: plant.category,
      status: plant.status,
      notes: plant.notes,
      distance_cm: String(plant.distance_cm),
      planted_year: plant.planted_year ? String(plant.planted_year) : '',
      death_year: plant.death_year ? String(plant.death_year) : '',
    });
    onSelectPlant(plant.id);
    setModal('edit');
  };

  const savePlant = async () => {
    if (!activeRow || !form.species.trim()) return;
    const distance = Math.max(0, parseInt(form.distance_cm, 10) || 0);
    const position = Math.floor(distance / activeRow.spacing_cm) + 1;
    const offset = distance - (position - 1) * activeRow.spacing_cm;
    const plantedYear = form.planted_year ? parseInt(form.planted_year, 10) || null : null;
    const deathYear = form.death_year ? parseInt(form.death_year, 10) || null : null;
    setSaving(true);
    const payload = {
      row_id: activeRow.id,
      species: form.species.trim(),
      category: form.category,
      status: form.status,
      notes: form.notes.trim(),
      position,
      offset_cm: offset,
      distance_cm: distance,
      planted_year: plantedYear,
      death_year: deathYear,
    };
    if (modal === 'edit' && editingPlantId) {
      await supabase.from('plants').update(payload).eq('id', editingPlantId);
    } else {
      await supabase.from('plants').insert(payload);
    }
    setSaving(false);
    setModal(null);
    onRefresh();
  };

  const deletePlant = async (id: string) => {
    await supabase.from('plants').delete().eq('id', id);
    onSelectPlant(null);
    onRefresh();
  };

  const addObservation = async () => {
    if (!selectedPlantId || !observationText.trim()) return;
    await supabase.from('observations').insert({ plant_id: selectedPlantId, text: observationText.trim() });
    setObservationText('');
    onRefresh();
  };

  const deleteObservation = async (id: string) => {
    await supabase.from('observations').delete().eq('id', id);
    onRefresh();
  };

  const selectRow = (rowId: string) => {
    setActiveRowId(rowId);
    onSelectPlant(null);
    setZoom(1);
  };

  if (!activeRow) {
    return (
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        <div className="bg-white rounded-xl border border-dashed border-stone-300 p-8 text-center">
          <Ruler className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-stone-600 mb-1">Nessun filare da mostrare</h3>
          <p className="text-xs text-stone-400">Crea prima dei filari, poi torna qui per mappare le piante visivamente.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              Anno {year.year_value}
            </span>
            <span className="text-xs text-stone-400">Mappa visiva del filare</span>
          </div>
          <h1 className="text-2xl font-bold text-stone-800">{activeRow.name}</h1>
          <p className="text-sm text-stone-400 mt-1">
            Lunghezza {activeRow.length_m} m · Spaziatura {activeRow.spacing_cm} cm · Clicca sul filare per inserire una pianta
          </p>
        </div>
        <div className="flex items-center gap-2">
          {showManual ? (
            <div className="flex items-center gap-1.5 bg-white border border-stone-200 rounded-lg p-1">
              <input
                value={manualDistance}
                onChange={(e) => setManualDistance(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManualAdd()}
                placeholder="es. 2.5m o 40cm"
                autoFocus
                className="w-32 px-2 py-1.5 text-sm border-0 focus:outline-none focus:ring-0"
              />
              <button onClick={handleManualAdd} className="px-2.5 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-md hover:bg-emerald-700">
                Inserisci
              </button>
              <button onClick={() => { setShowManual(false); setManualDistance(''); }} className="p-1.5 text-stone-400 hover:text-stone-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowManual(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium text-stone-600 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors"
            >
              <Ruler className="w-4 h-4" /> Distanza manuale
            </button>
          )}
          <button
            onClick={() => openAdd()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 shadow-sm transition-colors"
          >
            <CirclePlus className="w-4 h-4" /> Aggiungi pianta
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_310px] gap-5">
        {/* Area centrale: canvas verticale */}
        <section className="min-w-0 space-y-4">
          {/* Selettore filari */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {rows.map((row) => (
              <button
                key={row.id}
                onClick={() => selectRow(row.id)}
                className={`flex-shrink-0 px-3 py-2 rounded-lg border text-left transition-colors ${
                  activeRowId === row.id
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                    : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
                }`}
              >
                <span className="block text-xs font-semibold">{row.name}</span>
                <span className="block text-[10px] opacity-70 mt-0.5">{row.length_m}m · {row.spacing_cm}cm</span>
              </button>
            ))}
          </div>

          {/* Canvas verticale con zoom */}
          <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
            {/* Barra zoom */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-stone-100 bg-stone-50/50">
              <div className="flex items-center gap-2 text-xs text-stone-500">
                <Ruler className="w-4 h-4 text-emerald-600" />
                <span className="font-medium">{activeRow.name}</span>
                <span className="text-stone-400">· vista verticale</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setZoom((z) => Math.max(0.5, Math.round((z - 0.25) * 100) / 100))}
                  className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-500 transition-colors"
                  title="Zoom indietro"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs text-stone-400 w-10 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
                <button
                  onClick={() => setZoom((z) => Math.min(4, Math.round((z + 0.25) * 100) / 100))}
                  className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-500 transition-colors"
                  title="Zoom avanti"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <div className="w-px h-5 bg-stone-200 mx-1" />
                <button
                  onClick={() => setZoom(1)}
                  className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-500 transition-colors"
                  title="Zoom 100%"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoom(2.5)}
                  className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-500 transition-colors"
                  title="Zoom massimo"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Canvas */}
            <VerticalRowCanvas
              row={activeRow}
              plants={visiblePlants}
              allPlants={rowPlants}
              zoom={zoom}
              selectedPlantId={selectedPlantId}
              onSelectPlant={(p) => onSelectPlant(p.id)}
              onAddAtDistance={openAdd}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-stone-400">
            <span>{visiblePlants.length} piante visibili · {rowPlants.filter((p) => p.status === 'dead').length} morte in questo filare</span>
            <span>Suggerimento: usa lo zoom per leggere i nomi delle piante</span>
          </div>
        </section>

        {/* Sidebar destra: filtri, legenda, dettaglio pianta */}
        <aside className="space-y-4">
          {/* Filtri */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-stone-700">Filtri</h2>
              <span className="text-xs text-stone-400">{rowPlants.length} totali</span>
            </div>
            <label className="block text-xs text-stone-400 mb-1">Categoria</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as Category | 'all')}
              className="w-full mb-3 px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white focus:outline-none focus:border-emerald-400"
            >
              <option value="all">Tutte le categorie</option>
              {CATEGORY_LIST.map((c) => (
                <option key={c} value={c}>{CATEGORY_META[c].label}</option>
              ))}
            </select>
            <label className="block text-xs text-stone-400 mb-1">Stato</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as Status | 'all')}
              className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white focus:outline-none focus:border-emerald-400"
            >
              <option value="all">Tutti gli stati</option>
              <option value="alive">Sane</option>
              <option value="dead">Morte</option>
            </select>
          </div>

          {/* Legenda */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-stone-700 mb-3">Legenda Categorie</h2>
            <div className="space-y-2">
              {CATEGORY_LIST.map((c) => {
                const meta = CATEGORY_META[c];
                return (
                  <div key={c} className="flex items-center gap-2 text-xs text-stone-600">
                    <span className="text-base leading-none">{meta.icon}</span>
                    <span className={`w-3 h-3 rounded-full ${meta.dot}`} />
                    <span>{meta.label}</span>
                  </div>
                );
              })}
              <div className="flex items-center gap-2 text-xs text-stone-600 pt-1 border-t border-stone-100 mt-2">
                <span className="text-base leading-none">⚠️</span>
                <span className="w-3 h-3 rounded-full bg-red-400 opacity-70" />
                <span>Pianta morta</span>
              </div>
            </div>
          </div>

          {/* Dettaglio pianta */}
          <PlantDetail
            plant={selectedPlant}
            observations={selectedObservations}
            observationText={observationText}
            onObservationTextChange={setObservationText}
            onAddObservation={addObservation}
            onDeleteObservation={deleteObservation}
            onEdit={openEdit}
            onDelete={deletePlant}
            onClose={() => onSelectPlant(null)}
          />
        </aside>
      </div>

      {/* Navigazione filari */}
      <div className="flex items-center justify-between mt-5">
        <button
          onClick={() => activeIndex > 0 && selectRow(rows[activeIndex - 1].id)}
          disabled={activeIndex <= 0}
          className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" /> Filare precedente
        </button>
        <span className="text-xs text-stone-400">Filare {activeIndex + 1} di {rows.length}</span>
        <button
          onClick={() => activeIndex < rows.length - 1 && selectRow(rows[activeIndex + 1].id)}
          disabled={activeIndex >= rows.length - 1}
          className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Filare successivo <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Modale */}
      {modal && (
        <PlantModal
          mode={modal}
          form={form}
          setForm={setForm}
          saving={saving}
          onSave={savePlant}
          onClose={() => setModal(null)}
          rowLengthCm={Math.round(activeRow.length_m * 100)}
        />
      )}
    </div>
  );
}

// ─── Canvas verticale ──────────────────────────────────────────────────────

function VerticalRowCanvas({
  row,
  plants,
  allPlants,
  zoom,
  selectedPlantId,
  onSelectPlant,
  onAddAtDistance,
}: {
  row: FarmRow;
  plants: Plant[];
  allPlants: Plant[];
  zoom: number;
  selectedPlantId: string | null;
  onSelectPlant: (p: Plant) => void;
  onAddAtDistance: (distanceCm: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lengthCm = Math.max(row.length_m * 100, 100);
  const pxPerCm = 0.8 * zoom; // pixel per centimetro a zoom 1
  const totalHeight = Math.round(lengthCm * pxPerCm);
  const rulerWidth = 52;
  const nodeWidth = Math.min(220, Math.max(120, 160 * zoom));

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    const bounds = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - bounds.top;
    const distance = y / pxPerCm;
    onAddAtDistance(Math.min(lengthCm, Math.max(0, distance)));
  };

  // Tacche ogni 50cm o 1m in base allo zoom
  const tickInterval = zoom >= 2 ? 50 : zoom >= 1 ? 100 : 200;
  const ticks = Array.from({ length: Math.floor(lengthCm / tickInterval) + 1 }, (_, i) => i * tickInterval).filter(
    (cm) => cm <= lengthCm,
  );

  return (
    <div
      ref={containerRef}
      className="overflow-auto"
      style={{ maxHeight: '70vh' }}
    >
      <div
        className="relative flex"
        style={{ height: `${totalHeight}px`, minWidth: `${rulerWidth + nodeWidth + 40}px` }}
      >
        {/* Righello metrico verticale */}
      <div
        className="flex-shrink-0 border-r border-stone-200 bg-stone-50/80 relative"
        style={{ width: `${rulerWidth}px`, height: `${totalHeight}px` }}
      >
        {ticks.map((cm) => (
          <div
            key={cm}
            className="absolute right-0 flex items-center"
            style={{ top: `${cm * pxPerCm}px`, transform: 'translateY(-50%)' }}
          >
            <div className="w-2 h-px bg-stone-400" />
            <span className="text-[10px] text-stone-500 ml-1 tabular-nums whitespace-nowrap">
              {cm % 100 === 0 ? `${cm / 100}m` : `${cm}cm`}
            </span>
          </div>
        ))}
      </div>

      {/* Area cliccabile del filare */}
      <div
        className="flex-1 relative cursor-crosshair"
        style={{ minWidth: `${nodeWidth + 20}px` }}
        onClick={handleCanvasClick}
      >
        {/* Linea centrale del filare */}
        <div
          className="absolute left-1/2 -translate-x-1/2 w-1 rounded-full bg-gradient-to-b from-stone-300 via-stone-400 to-stone-300"
          style={{ top: 0, height: `${totalHeight}px` }}
        />

        {/* Tacche sulla linea */}
        {ticks.map((cm) => (
          <div
            key={cm}
            className="absolute left-1/2 -translate-x-1/2 w-3 h-px bg-stone-400/50"
            style={{ top: `${cm * pxPerCm}px` }}
          />
        ))}

        {/* Nodi piante */}
        {plants.map((plant) => {
          const distance = Math.min(lengthCm, Math.max(0, plant.distance_cm));
          const top = distance * pxPerCm;
          const meta = CATEGORY_META[plant.category];
          const selected = plant.id === selectedPlantId;
          const isDead = plant.status === 'dead';
          const nodeSize = Math.min(60, Math.max(28, 32 * zoom));
          const showName = zoom >= 1.5 || selected;
          const fontSize = Math.min(13, Math.max(9, 10 * zoom));

          return (
            <button
              key={plant.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectPlant(plant);
              }}
              className="absolute group"
              style={{
                top: `${top}px`,
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: selected ? 30 : 10,
              }}
            >
              <div className="flex items-center gap-2" style={{ transform: 'translateX(10px)' }}>
                {/* Nodo */}
                <div
                  className={`rounded-full border-2 flex items-center justify-center transition-all ${
                    isDead
                      ? 'bg-red-400 border-red-300 opacity-70'
                      : `${meta.dot} border-white`
                  } ${selected ? `ring-4 ${meta.ring} scale-110` : 'shadow-md'}`}
                  style={{ width: `${nodeSize}px`, height: `${nodeSize}px` }}
                >
                  {isDead ? (
                    <AlertTriangle className="text-white" style={{ width: `${nodeSize * 0.4}px`, height: `${nodeSize * 0.4}px` }} />
                  ) : (
                    <span style={{ fontSize: `${nodeSize * 0.35}px` }} className="leading-none">{meta.icon}</span>
                  )}
                </div>

                {/* Etichetta nome */}
                {(showName || true) && (
                  <div
                    className={`whitespace-nowrap rounded-lg px-2.5 py-1 shadow-sm border transition-opacity ${
                      isDead
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : 'bg-white text-stone-700 border-stone-200'
                    } ${selected ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'}`}
                    style={{ fontSize: `${fontSize}px` }}
                  >
                    <span className="font-medium">{plant.species || 'Senza nome'}</span>
                    <span className="text-stone-400 ml-1.5 tabular-nums">
                      {(distance / 100).toFixed(distance % 100 === 0 ? 0 : 1)}m
                    </span>
                  </div>
                )}
              </div>
            </button>
          );
        })}

        {/* Stato vuoto */}
        {allPlants.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <Sprout className="w-10 h-10 text-stone-300 mx-auto mb-2" />
              <p className="text-sm text-stone-400">Clicca sul filare per inserire la prima pianta</p>
            </div>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}

// ─── Dettaglio pianta ──────────────────────────────────────────────────────

function PlantDetail({
  plant,
  observations,
  observationText,
  onObservationTextChange,
  onAddObservation,
  onDeleteObservation,
  onEdit,
  onDelete,
  onClose,
}: {
  plant: Plant | null;
  observations: Observation[];
  observationText: string;
  onObservationTextChange: (v: string) => void;
  onAddObservation: () => void;
  onDeleteObservation: (id: string) => void;
  onEdit: (p: Plant) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  if (!plant) {
    return (
      <div className="bg-stone-50 border border-dashed border-stone-300 rounded-2xl p-5 text-center">
        <Leaf className="w-8 h-8 text-stone-300 mx-auto mb-2" />
        <h2 className="text-sm font-semibold text-stone-600">Seleziona una pianta</h2>
        <p className="text-xs text-stone-400 mt-1">Clicca un nodo colorato sul filare per vedere i dettagli e aggiungere osservazioni.</p>
      </div>
    );
  }

  const meta = CATEGORY_META[plant.category];
  return (
    <div className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-sm">
      <div className="flex items-start gap-3 mb-4">
        <div
          className={`w-10 h-10 rounded-full ${plant.status === 'dead' ? 'bg-red-400' : meta.dot} flex items-center justify-center`}
        >
          {plant.status === 'dead' ? (
            <AlertTriangle className="w-5 h-5 text-white" />
          ) : (
            <span className="text-lg leading-none">{meta.icon}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold text-stone-800 truncate">{plant.species || 'Pianta senza nome'}</h2>
            <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            {meta.label} · Distanza {(plant.distance_cm / 100).toFixed(plant.distance_cm % 100 === 0 ? 0 : 1)}m ·{' '}
            {plant.status === 'alive' ? 'Sana' : 'Morta'}
          </p>
        </div>
      </div>

      {plant.planted_year && (
        <p className="text-xs text-stone-500 mb-2">
          Piantumata nel {plant.planted_year}
          {plant.death_year && <span className="text-red-500"> · Morta nel {plant.death_year}</span>}
        </p>
      )}

      {plant.status === 'dead' && (
        <div className="flex gap-2 p-2.5 rounded-lg bg-red-50 text-red-700 text-xs mb-3">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          Questa pianta è segnalata come morta.
        </div>
      )}

      {plant.notes && (
        <div className="p-3 rounded-lg bg-stone-50 text-sm text-stone-600 mb-4">{plant.notes}</div>
      )}

      <div className="flex gap-2 mb-5">
        <button
          onClick={() => onEdit(plant)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100"
        >
          <Pencil className="w-3.5 h-3.5" /> Modifica pianta
        </button>
        <button
          onClick={() => onDelete(plant.id)}
          className="px-3 py-2 text-red-500 bg-red-50 rounded-lg hover:bg-red-100"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="border-t border-stone-100 pt-4">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-semibold text-stone-700">Osservazioni</h3>
        </div>
        <div className="space-y-2 mb-3">
          {observations.map((o) => (
            <div key={o.id} className="flex items-start gap-2 text-xs">
              <p className="flex-1 text-stone-600">
                {o.text}
                <span className="block text-[10px] text-stone-400 mt-0.5">
                  {new Date(o.created_at).toLocaleDateString('it-IT')}
                </span>
              </p>
              <button onClick={() => onDeleteObservation(o.id)} className="text-stone-300 hover:text-red-500">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {observations.length === 0 && (
            <p className="text-xs text-stone-400">Nessuna osservazione registrata.</p>
          )}
        </div>
        <div className="flex gap-2">
          <input
            value={observationText}
            onChange={(e) => onObservationTextChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onAddObservation()}
            placeholder="Aggiungi un'osservazione..."
            className="min-w-0 flex-1 px-2.5 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:border-emerald-400"
          />
          <button
            onClick={onAddObservation}
            className="px-2.5 py-2 text-xs bg-amber-500 text-white rounded-lg hover:bg-amber-600"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modale pianta ─────────────────────────────────────────────────────────

function PlantModal({
  mode,
  form,
  setForm,
  saving,
  onSave,
  onClose,
  rowLengthCm,
}: {
  mode: 'add' | 'edit';
  form: PlantForm;
  setForm: (f: PlantForm) => void;
  saving: boolean;
  onSave: () => void;
  onClose: () => void;
  rowLengthCm: number;
}) {
  const update = <K extends keyof PlantForm>(key: K, value: PlantForm[K]) => setForm({ ...form, [key]: value });
  const distCm = parseInt(form.distance_cm, 10) || 0;
  const distLabel = distCm % 100 === 0 ? `${distCm / 100}m` : `${(distCm / 100).toFixed(2)}m`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/35" onMouseDown={onClose}>
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-5" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-stone-800">
              {mode === 'add' ? 'Aggiungi pianta al filare' : 'Modifica pianta'}
            </h2>
            <p className="text-xs text-stone-400 mt-1">
              Posiziona la pianta alla distanza esatta dall'inizio del filare.
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-stone-100 text-stone-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block mb-3">
            <span className="block text-xs font-medium text-stone-500 mb-1">Nome specie</span>
            <input
              value={form.species}
              onChange={(e) => update('species', e.target.value)}
              autoFocus
              placeholder="es. Melo Fuji"
              className={inputClass}
            />
          </label>
          <label className="block mb-3">
            <span className="block text-xs font-medium text-stone-500 mb-1">Categoria</span>
            <select
              value={form.category}
              onChange={(e) => update('category', e.target.value as Category)}
              className={inputClass}
            >
              {CATEGORY_LIST.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_META[c].icon} {CATEGORY_META[c].label}
                </option>
              ))}
            </select>
          </label>
          <label className="block mb-3">
            <span className="block text-xs font-medium text-stone-500 mb-1">
              Distanza dall'inizio (cm) · {distLabel}
            </span>
            <input
              type="number"
              min="0"
              max={rowLengthCm}
              value={form.distance_cm}
              onChange={(e) => update('distance_cm', e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block mb-3">
            <span className="block text-xs font-medium text-stone-500 mb-1">Stato</span>
            <select
              value={form.status}
              onChange={(e) => update('status', e.target.value as Status)}
              className={inputClass}
            >
              <option value="alive">Sana</option>
              <option value="dead">Morta</option>
            </select>
          </label>
          <label className="block mb-3">
            <span className="block text-xs font-medium text-stone-500 mb-1">Anno piantumazione</span>
            <input
              type="number"
              value={form.planted_year}
              onChange={(e) => update('planted_year', e.target.value)}
              placeholder="es. 2024"
              className={inputClass}
            />
          </label>
          <label className="block mb-3">
            <span className="block text-xs font-medium text-stone-500 mb-1">Anno morte (opzionale)</span>
            <input
              type="number"
              value={form.death_year}
              onChange={(e) => update('death_year', e.target.value)}
              placeholder="es. 2025"
              className={inputClass}
            />
          </label>
        </div>

        <label className="block mb-4">
          <span className="block text-xs font-medium text-stone-500 mb-1">Note</span>
          <textarea
            value={form.notes}
            onChange={(e) => update('notes', e.target.value)}
            rows={3}
            placeholder="es. Potata ad aprile, scarsa idratazione..."
            className={`${inputClass} resize-none`}
          />
        </label>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-stone-500 hover:bg-stone-100 rounded-lg">
            Annulla
          </button>
          <button
            onClick={onSave}
            disabled={saving || !form.species.trim()}
            className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? 'Salvataggio...' : mode === 'add' ? 'Aggiungi pianta' : 'Salva modifiche'}
          </button>
        </div>
      </div>
    </div>
  );
}
