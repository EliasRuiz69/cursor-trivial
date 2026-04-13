-- =============================================================
-- TRIVIAL RETRO — Migración inicial
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- =============================================================

-- ---------------------------------------------------------------
-- TABLA: player_profiles
-- Almacena el perfil de cada jugador autenticado vía Google OAuth
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.player_profiles (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        TEXT        NOT NULL UNIQUE,  -- Email o ID del proveedor OAuth
  display_name   TEXT        NOT NULL,
  total_points   INTEGER     NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para búsqueda rápida por user_id
CREATE INDEX IF NOT EXISTS idx_player_profiles_user_id
  ON public.player_profiles (user_id);

-- ---------------------------------------------------------------
-- TABLA: score_history
-- Historial de puntuaciones por tema para cada jugador
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.score_history (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id            UUID        NOT NULL REFERENCES public.player_profiles(id) ON DELETE CASCADE,
  tema                 TEXT        NOT NULL CHECK (tema IN ('Historia', 'Geografía', 'Matemáticas', 'Cine')),
  preguntas_realizadas INTEGER     NOT NULL DEFAULT 0,
  aciertos             INTEGER     NOT NULL DEFAULT 0,
  fallos               INTEGER     NOT NULL DEFAULT 0,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Un registro único por jugador y tema
  UNIQUE (player_id, tema)
);

-- Índice para búsqueda rápida por player_id
CREATE INDEX IF NOT EXISTS idx_score_history_player_id
  ON public.score_history (player_id);

-- ---------------------------------------------------------------
-- FUNCIÓN: actualizar updated_at automáticamente
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER trigger_player_profiles_updated_at
  BEFORE UPDATE ON public.player_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_score_history_updated_at
  BEFORE UPDATE ON public.score_history
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
-- ---------------------------------------------------------------

-- Habilitar RLS en ambas tablas
ALTER TABLE public.player_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.score_history ENABLE ROW LEVEL SECURITY;

-- Políticas para player_profiles:
-- Los jugadores solo pueden leer y modificar su propio perfil.
-- La creación del perfil se realiza desde el servidor con service_role (bypasses RLS).

CREATE POLICY "Jugador puede ver su propio perfil"
  ON public.player_profiles
  FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Jugador puede actualizar su propio perfil"
  ON public.player_profiles
  FOR UPDATE
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'email');

-- Políticas para score_history:
-- Los jugadores solo pueden leer y modificar su propio historial.

CREATE POLICY "Jugador puede ver su propio historial"
  ON public.score_history
  FOR SELECT
  USING (
    player_id IN (
      SELECT id FROM public.player_profiles
      WHERE user_id = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

CREATE POLICY "Jugador puede actualizar su propio historial"
  ON public.score_history
  FOR UPDATE
  USING (
    player_id IN (
      SELECT id FROM public.player_profiles
      WHERE user_id = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

CREATE POLICY "Jugador puede insertar en su propio historial"
  ON public.score_history
  FOR INSERT
  WITH CHECK (
    player_id IN (
      SELECT id FROM public.player_profiles
      WHERE user_id = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

-- ---------------------------------------------------------------
-- COMENTARIOS DE DOCUMENTACIÓN
-- ---------------------------------------------------------------
COMMENT ON TABLE public.player_profiles IS 'Perfil de cada jugador autenticado';
COMMENT ON TABLE public.score_history IS 'Historial de puntuaciones por jugador y tema';
COMMENT ON COLUMN public.player_profiles.user_id IS 'Email del usuario (identificador único de Google OAuth)';
COMMENT ON COLUMN public.player_profiles.display_name IS 'Nombre visible editable por el jugador';
COMMENT ON COLUMN public.score_history.tema IS 'Uno de: Historia, Geografía, Matemáticas, Cine';
