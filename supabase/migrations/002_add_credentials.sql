-- =============================================================
-- TRIVIAL RETRO — Migración 002
-- Añade soporte para autenticación con email + contraseña.
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- =============================================================

ALTER TABLE public.player_profiles
  ADD COLUMN IF NOT EXISTS password_hash TEXT;

COMMENT ON COLUMN public.player_profiles.password_hash IS 'Hash bcrypt de la contraseña (solo para auth con credenciales)';
