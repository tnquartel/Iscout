-- Migration 003: Afbeeldingskaarten voor reisvragen

-- lat/lng/radius zijn alleen nog verplicht voor wereldkaart-vragen
ALTER TABLE reisvragen
  ALTER COLUMN lat DROP NOT NULL,
  ALTER COLUMN lng DROP NOT NULL,
  ALTER COLUMN radius_km DROP NOT NULL;

ALTER TABLE reisvragen
  ADD COLUMN map_type TEXT NOT NULL DEFAULT 'world'
    CHECK (map_type IN ('world', 'image')),
  ADD COLUMN image_url TEXT,
  ADD COLUMN image_width INTEGER,
  ADD COLUMN image_height INTEGER,
  -- Genormaliseerd: x/y 0..1 (0,0 = linksboven), radius = fractie van de breedte
  ADD COLUMN answer_x FLOAT,
  ADD COLUMN answer_y FLOAT,
  ADD COLUMN answer_radius FLOAT;

ALTER TABLE reisvragen
  ADD CONSTRAINT reisvragen_map_data_check CHECK (
    (map_type = 'world' AND lat IS NOT NULL AND lng IS NOT NULL AND radius_km IS NOT NULL)
    OR
    (map_type = 'image' AND image_url IS NOT NULL AND image_width > 0 AND image_height > 0
       AND answer_x BETWEEN 0 AND 1 AND answer_y BETWEEN 0 AND 1 AND answer_radius > 0)
  );

-- Safe view opnieuw aanmaken met de publieke kolommen (NIET answer_x/y/radius)
DROP VIEW IF EXISTS reisvragen_safe;
CREATE VIEW reisvragen_safe AS
  SELECT id, name, hint, cost_credits, points_awarded, is_active, created_at,
         map_type, image_url, image_width, image_height
  FROM reisvragen;

-- Storage bucket voor kaartafbeeldingen (publiek leesbaar, schrijven via service role)
INSERT INTO storage.buckets (id, name, public)
VALUES ('vraag-images', 'vraag-images', true)
ON CONFLICT (id) DO NOTHING;