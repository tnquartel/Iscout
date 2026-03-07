-- Migration 002: Service Role Policies
-- These policies allow server-side operations using the service role key
-- The service role bypasses RLS by default, but we add explicit policies
-- for clarity and documentation purposes.

-- Allow service role to do everything on game_state
CREATE POLICY "game_state_service_write" ON game_state
  FOR ALL USING (auth.role() = 'service_role');

-- Allow service role to write doe_inzendingen
CREATE POLICY "doe_inzendingen_service_write" ON doe_inzendingen
  FOR UPDATE USING (auth.role() = 'service_role');

-- Allow service role to manage doe_opdrachten
CREATE POLICY "doe_opdrachten_service_all" ON doe_opdrachten
  FOR ALL USING (auth.role() = 'service_role');

-- Allow service role to manage reisvragen
CREATE POLICY "reisvragen_service_all" ON reisvragen
  FOR ALL USING (auth.role() = 'service_role');

-- Allow service role to manage gespeelde_reisvragen
CREATE POLICY "gespeelde_reisvragen_service_all" ON gespeelde_reisvragen
  FOR ALL USING (auth.role() = 'service_role');
