import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { Year, FarmRow, Plant, Observation, YearAggregate } from '@/lib/types';
import { Sidebar } from '@/components/Sidebar';
import { Dashboard } from '@/components/Dashboard';
import { RowManager } from '@/components/RowManager';
import { PlantManager } from '@/components/PlantManager';
import { BackupRestore } from '@/components/BackupRestore';
import { Sprout, Menu } from 'lucide-react';

type View = 'dashboard' | 'rows' | 'plants' | 'backup';

export default function App() {
  const [years, setYears] = useState<Year[]>([]);
  const [activeYear, setActiveYear] = useState<Year | null>(null);
  const [rows, setRows] = useState<FarmRow[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [aggregates, setAggregates] = useState<YearAggregate[]>([]);
  const [view, setView] = useState<View>('dashboard');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadYears = useCallback(async () => {
    const { data, error } = await supabase.from('years').select('*').order('year_value', { ascending: false });
    if (error) return;
    setYears(data as Year[]);
    const active = (data as Year[]).find((y) => y.is_active) ?? (data as Year[])[0] ?? null;
    setActiveYear(active);
  }, []);

  const loadAggregates = useCallback(async () => {
    const { data, error } = await supabase.rpc('year_dead_aggregate');
    if (!error && data) setAggregates(data as YearAggregate[]);
  }, []);

  const loadRows = useCallback(async (yearId: string) => {
    const { data, error } = await supabase.from('rows').select('*').eq('year_id', yearId).order('sort_order');
    if (error) return;
    setRows(data as FarmRow[]);
  }, []);

  const loadPlants = useCallback(async (rowIds: string[]) => {
    if (rowIds.length === 0) { setPlants([]); setObservations([]); return; }
    const { data, error } = await supabase.from('plants').select('*').in('row_id', rowIds).order('position');
    if (error) return;
    setPlants(data as Plant[]);
  }, []);

  const loadObservations = useCallback(async (plantIds: string[]) => {
    if (plantIds.length === 0) { setObservations([]); return; }
    const { data, error } = await supabase.from('observations').select('*').in('plant_id', plantIds).order('created_at', { ascending: false });
    if (error) return;
    setObservations(data as Observation[]);
  }, []);

  const refreshAll = useCallback(async () => {
    await loadYears();
    await loadAggregates();
  }, [loadYears, loadAggregates]);

  // Initial load
  useEffect(() => {
    (async () => {
      await refreshAll();
      setLoading(false);
    })();
  }, [refreshAll]);

  // When active year changes, load its rows
  useEffect(() => {
    if (!activeYear) { setRows([]); setPlants([]); setObservations([]); return; }
    loadRows(activeYear.id);
  }, [activeYear, loadRows]);

  // When rows change, load plants for those rows
  useEffect(() => {
    const rowIds = rows.map((r) => r.id);
    loadPlants(rowIds);
  }, [rows, loadPlants]);

  // When plants change, load observations
  useEffect(() => {
    const plantIds = plants.map((p) => p.id);
    loadObservations(plantIds);
  }, [plants, loadObservations]);

  const handleSelectYear = async (year: Year) => {
    if (activeYear && !activeYear.is_active) {
      await supabase.from('years').update({ is_active: false }).eq('is_active', true);
    }
    await supabase.from('years').update({ is_active: true }).eq('id', year.id);
    await refreshAll();
  };

  const handleAddYear = async (yearValue: number) => {
    await supabase.from('years').update({ is_active: false }).eq('is_active', true);
    const { data, error } = await supabase.from('years').insert({ year_value: yearValue, is_active: true }).select().single();
    if (!error && data) await refreshAll();
  };

  const handleDeleteYear = async (id: string) => {
    await supabase.from('years').delete().eq('id', id);
    await refreshAll();
  };

  const handleRefresh = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(async () => {
      await refreshAll();
      if (activeYear) await loadRows(activeYear.id);
    }, 100);
  }, [activeYear, loadRows, refreshAll]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Sprout className="w-10 h-10 text-emerald-600 animate-pulse" />
          <p className="text-stone-500 text-sm">Loading your farm...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        years={years}
        activeYear={activeYear}
        view={view}
        onViewChange={(v) => { setView(v); setSidebarOpen(false); }}
        onSelectYear={handleSelectYear}
        onAddYear={handleAddYear}
        onDeleteYear={handleDeleteYear}
        aggregates={aggregates}
        open={sidebarOpen}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-stone-200 sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-stone-100 text-stone-600"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Sprout className="w-5 h-5 text-emerald-600" />
            <span className="font-semibold text-stone-800">Farm Manager</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          {view === 'dashboard' && (
            <Dashboard
              activeYear={activeYear}
              rows={rows}
              plants={plants}
              observations={observations}
              aggregates={aggregates}
              onNavigate={setView}
            />
          )}
          {view === 'rows' && activeYear && (
            <RowManager
              year={activeYear}
              rows={rows}
              onRefresh={handleRefresh}
              onSelectRow={(id) => { setSelectedRowId(id); setView('plants'); }}
            />
          )}
          {view === 'plants' && activeYear && (
            <PlantManager
              year={activeYear}
              rows={rows}
              plants={plants}
              observations={observations}
              onRefresh={handleRefresh}
              selectedRowId={selectedRowId}
              selectedPlantId={selectedPlantId}
              onSelectPlant={setSelectedPlantId}
            />
          )}
          {view === 'backup' && (
            <BackupRestore onRefresh={handleRefresh} />
          )}
          {view === 'rows' && !activeYear && (
            <EmptyState text="Create a year first to start managing rows." />
          )}
          {view === 'plants' && !activeYear && (
            <EmptyState text="Create a year and some rows first to start managing plants." />
          )}
        </main>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center h-full p-8">
      <p className="text-stone-400 text-sm">{text}</p>
    </div>
  );
}
