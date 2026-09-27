export type Category = 'focus' | 'arbustive' | 'support' | 'artichoke' | 'emergent';
export type Status = 'alive' | 'dead';

export interface Year {
  id: string;
  year_value: number;
  is_active: boolean;
  created_at: string;
}

export interface FarmRow {
  id: string;
  year_id: string;
  name: string;
  sort_order: number;
  length_m: number;
  spacing_cm: number;
  created_at: string;
}

export interface Plant {
  id: string;
  row_id: string;
  position: number;
  species: string;
  category: Category;
  status: Status;
  notes: string;
  offset_cm: number;
  distance_cm: number;
  planted_year: number | null;
  death_year: number | null;
  created_at: string;
}

export interface Observation {
  id: string;
  plant_id: string;
  text: string;
  created_at: string;
}

export interface YearAggregate {
  year_value: number;
  total: number;
  dead: number;
  alive: number;
}

export interface BackupData {
  version: 1;
  exported_at: string;
  years: Year[];
  rows: FarmRow[];
  plants: Plant[];
  observations: Observation[];
}

export const CATEGORY_META: Record<
  Category,
  { label: string; short: string; color: string; bg: string; border: string; dot: string; ring: string; icon: string }
> = {
  focus:     { label: 'Piante Focus',            short: 'Focus',     color: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-300',  dot: 'bg-emerald-500',  ring: 'ring-emerald-200',  icon: '🌳' },
  arbustive: { label: 'Arbustive',               short: 'Arbustive', color: 'text-amber-700',   bg: 'bg-amber-50',    border: 'border-amber-300',    dot: 'bg-amber-500',    ring: 'ring-amber-200',    icon: '🌿' },
  support:   { label: 'Piante da Supporto',      short: 'Supporto',  color: 'text-yellow-700',  bg: 'bg-yellow-50',   border: 'border-yellow-300',   dot: 'bg-yellow-500',   ring: 'ring-yellow-200',   icon: '🍃' },
  artichoke: { label: 'Carciofi / Erbacee',      short: 'Carciofo',  color: 'text-violet-700',  bg: 'bg-violet-50',   border: 'border-violet-300',   dot: 'bg-violet-500',   ring: 'ring-violet-200',   icon: '🌱' },
  emergent:  { label: 'Emergenti (Canopia)',     short: 'Emergente', color: 'text-cyan-700',    bg: 'bg-cyan-50',     border: 'border-cyan-300',     dot: 'bg-cyan-500',     ring: 'ring-cyan-200',     icon: '⬆️' },
};

export const CATEGORY_LIST: Category[] = ['focus', 'arbustive', 'support', 'artichoke', 'emergent'];
