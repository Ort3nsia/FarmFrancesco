/*
# Permaculture Farm Management Schema (single-tenant, no auth)

1. New Tables
- `years` — one row per agricultural year (e.g. 2024, 2025). Tracks which year is active.
  - id (uuid pk), year_value (int, unique), is_active (bool), created_at (timestamptz)
- `rows` — ordered plant rows (filari) belonging to a year.
  - id (uuid pk), year_id (uuid fk -> years), name (text), sort_order (int),
    length_m (numeric), spacing_cm (int), created_at (timestamptz)
- `plants` — individual plant nodes positioned along a row.
  - id (uuid pk), row_id (uuid fk -> rows), position (int, 1-based index along the row),
    species (text), category (text: focus/arbustive/support/artichoke/emergent),
    status (text: alive/dead), notes (text), created_at (timestamptz)
- `observations` — timestamped history entries attached to a plant.
  - id (uuid pk), plant_id (uuid fk -> plants), text (text), created_at (timestamptz)

2. Relationships
- years 1:N rows (CASCADE on delete)
- rows 1:N plants (CASCADE on delete)
- plants 1:N observations (CASCADE on delete)

3. Security
- RLS enabled on all tables.
- Single-tenant (no sign-in): TO anon, authenticated with USING(true) / WITH CHECK(true)
  so the anon-key frontend can freely read and write its own shared data.
*/

CREATE TABLE IF NOT EXISTS years (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year_value int NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE years ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_years" ON years;
CREATE POLICY "anon_select_years" ON years FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_years" ON years;
CREATE POLICY "anon_insert_years" ON years FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_years" ON years;
CREATE POLICY "anon_update_years" ON years FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_years" ON years;
CREATE POLICY "anon_delete_years" ON years FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year_id uuid NOT NULL REFERENCES years(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  length_m numeric NOT NULL DEFAULT 10,
  spacing_cm int NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE rows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_rows" ON rows;
CREATE POLICY "anon_select_rows" ON rows FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_rows" ON rows;
CREATE POLICY "anon_insert_rows" ON rows FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_rows" ON rows;
CREATE POLICY "anon_update_rows" ON rows FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_rows" ON rows;
CREATE POLICY "anon_delete_rows" ON rows FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS plants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id uuid NOT NULL REFERENCES rows(id) ON DELETE CASCADE,
  position int NOT NULL DEFAULT 1,
  species text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'support',
  status text NOT NULL DEFAULT 'alive',
  notes text NOT NULL DEFAULT '',
  offset_cm int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE plants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_plants" ON plants;
CREATE POLICY "anon_select_plants" ON plants FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_plants" ON plants;
CREATE POLICY "anon_insert_plants" ON plants FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_plants" ON plants;
CREATE POLICY "anon_update_plants" ON plants FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_plants" ON plants;
CREATE POLICY "anon_delete_plants" ON plants FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id uuid NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  text text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE observations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_observations" ON observations;
CREATE POLICY "anon_select_observations" ON observations FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_observations" ON observations;
CREATE POLICY "anon_insert_observations" ON observations FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_observations" ON observations;
CREATE POLICY "anon_delete_observations" ON observations FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_rows_year ON rows(year_id);
CREATE INDEX IF NOT EXISTS idx_plants_row ON plants(row_id);
CREATE INDEX IF NOT EXISTS idx_observations_plant ON observations(plant_id);
CREATE INDEX IF NOT EXISTS idx_plants_status ON plants(status);
