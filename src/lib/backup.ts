import { supabase } from './supabase';
import type { BackupData, Year, FarmRow, Plant, Observation } from './types';

export async function exportBackup(): Promise<BackupData> {
  const [
    { data: years, error: eY },
    { data: rows, error: eR },
    { data: plants, error: eP },
    { data: observations, error: eO },
  ] = await Promise.all([
    supabase.from('years').select('*').order('year_value'),
    supabase.from('rows').select('*').order('sort_order'),
    supabase.from('plants').select('*').order('position'),
    supabase.from('observations').select('*').order('created_at'),
  ]);

  if (eY || eR || eP || eO) {
    throw new Error([eY?.message, eR?.message, eP?.message, eO?.message].filter(Boolean).join('; '));
  }

  return {
    version: 1,
    exported_at: new Date().toISOString(),
    years: (years ?? []) as Year[],
    rows: (rows ?? []) as FarmRow[],
    plants: (plants ?? []) as Plant[],
    observations: (observations ?? []) as Observation[],
  };
}

export function downloadBackup(data: BackupData) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup-campo-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function restoreBackup(data: BackupData, mode: 'replace' | 'merge'): Promise<void> {
  if (!data || data.version !== 1) {
    throw new Error('File di backup non valido: versione mancante o non supportata.');
  }

  const hasData =
    (data.years?.length ?? 0) > 0 ||
    (data.rows?.length ?? 0) > 0 ||
    (data.plants?.length ?? 0) > 0 ||
    (data.observations?.length ?? 0) > 0;
  if (!hasData) throw new Error('Il file di backup è vuoto.');

  if (mode === 'replace') {
    const { error: eObs } = await supabase.from('observations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (eObs) throw new Error(`Errore nella cancellazione delle osservazioni: ${eObs.message}`);
    const { error: ePlants } = await supabase.from('plants').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (ePlants) throw new Error(`Errore nella cancellazione delle piante: ${ePlants.message}`);
    const { error: eRows } = await supabase.from('rows').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (eRows) throw new Error(`Errore nella cancellazione dei filari: ${eRows.message}`);
    const { error: eYears } = await supabase.from('years').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (eYears) throw new Error(`Errore nella cancellazione degli anni: ${eYears.message}`);
  }

  // Insert in dependency order, preserving original IDs for referential integrity.
  if (data.years?.length) {
    const { error } = await supabase.from('years').upsert(
      data.years.map((y) => ({ id: y.id, year_value: y.year_value, is_active: y.is_active, created_at: y.created_at })),
      { onConflict: 'id', ignoreDuplicates: mode === 'merge' },
    );
    if (error) throw new Error(`Errore nel ripristino degli anni: ${error.message}`);
  }
  if (data.rows?.length) {
    const { error } = await supabase.from('rows').upsert(
      data.rows.map((r) => ({
        id: r.id, year_id: r.year_id, name: r.name, sort_order: r.sort_order,
        length_m: r.length_m, spacing_cm: r.spacing_cm, created_at: r.created_at,
      })),
      { onConflict: 'id', ignoreDuplicates: mode === 'merge' },
    );
    if (error) throw new Error(`Errore nel ripristino dei filari: ${error.message}`);
  }
  if (data.plants?.length) {
    const { error } = await supabase.from('plants').upsert(
      data.plants.map((p) => ({
        id: p.id, row_id: p.row_id, position: p.position, species: p.species,
        category: p.category, status: p.status, notes: p.notes, offset_cm: p.offset_cm,
        distance_cm: p.distance_cm, planted_year: p.planted_year, death_year: p.death_year,
        created_at: p.created_at,
      })),
      { onConflict: 'id', ignoreDuplicates: mode === 'merge' },
    );
    if (error) throw new Error(`Errore nel ripristino delle piante: ${error.message}`);
  }
  if (data.observations?.length) {
    const { error } = await supabase.from('observations').upsert(
      data.observations.map((o) => ({
        id: o.id, plant_id: o.plant_id, text: o.text, created_at: o.created_at,
      })),
      { onConflict: 'id', ignoreDuplicates: mode === 'merge' },
    );
    if (error) throw new Error(`Errore nel ripristino delle osservazioni: ${error.message}`);
  }
}
