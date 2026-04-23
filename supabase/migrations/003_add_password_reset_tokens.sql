-- =============================================================
-- TRIVIAL RETRO — Migración 003
-- Tabla para tokens de recuperación de contraseña.
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- =============================================================

CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id  UUID        NOT NULL REFERENCES public.player_profiles(id) ON DELETE CASCADE,
  token      TEXT        NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token
  ON public.password_reset_tokens(token);

COMMENT ON TABLE public.password_reset_tokens IS
  'Tokens de un solo uso para el flujo de recuperación de contraseña (TTL 30 min).';
