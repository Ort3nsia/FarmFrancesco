/*
# Aggiungi campi distanza e anni piantagione/morte alle piante

1. Modifiche alla tabella `plants`
- `distance_cm` (int, default 0): distanza in centimetri dall'inizio del filare.
  Sostituisce il calcolo derivato da position+offset per il posizionamento visivo.
- `planted_year` (int, nullable): anno di piantumazione della pianta.
- `death_year` (int, nullable): anno in cui la pianta è morta (null se viva).

2. Note
- Tutti i nuovi campi sono opzionali (nullable o con default) per non rompere
  le righe esistenti. Il campo `distance_cm` mantiene il default 0.
- La logica dell'app userà `distance_cm` come posizione principale lungo il filare.
*/

ALTER TABLE plants ADD COLUMN IF NOT EXISTS distance_cm int NOT NULL DEFAULT 0;
ALTER TABLE plants ADD COLUMN IF NOT EXISTS planted_year int;
ALTER TABLE plants ADD COLUMN IF NOT EXISTS death_year int;
