/*
# Add year_dead_aggregate RPC function

1. New Functions
- `year_dead_aggregate()` — SECURITY DEFINER function returning per-year
  counts of total/dead/alive plants by joining plants -> rows -> years.
  Returns TABLE(year_value int, total bigint, dead bigint, alive bigint).

2. Security
- SECURITY DEFINER so the anon role can call it without needing JOIN privileges
  beyond what RLS grants. RLS is enabled with open policies on all involved tables.
*/

CREATE OR REPLACE FUNCTION year_dead_aggregate()
RETURNS TABLE(year_value int, total bigint, dead bigint, alive bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    y.year_value,
    count(p.id)::bigint AS total,
    count(p.id) FILTER (WHERE p.status = 'dead')::bigint AS dead,
    count(p.id) FILTER (WHERE p.status = 'alive')::bigint AS alive
  FROM years y
  LEFT JOIN rows r ON r.year_id = y.id
  LEFT JOIN plants p ON p.row_id = r.id
  GROUP BY y.year_value
  ORDER BY y.year_value;
$$;

GRANT EXECUTE ON FUNCTION year_dead_aggregate() TO anon, authenticated;
