/**
 * lib/types.ts
 * Tipos compartidos entre frontend y backend.
 */

export type Tema = 'Historia' | 'Geografía' | 'Matemáticas' | 'Cine'

export interface OpcionRespuesta {
  letra: 'A' | 'B' | 'C' | 'D'
  texto: string
}

// Respuesta del endpoint /api/questions (sin revelar cuál es la correcta)
export interface PreguntaPublica {
  id: string          // ID único para validar en el backend
  tema: Tema
  pregunta: string
  opciones: OpcionRespuesta[]
}

// Respuesta al validar la respuesta del jugador
export interface ResultadoRespuesta {
  correcto: boolean
  letraCorrecta: 'A' | 'B' | 'C' | 'D'
  explicacion: string
  puntosCambio: number  // +2 o -1
}

// Perfil del jugador desde Supabase
export interface PlayerProfile {
  id: string
  user_id: string
  display_name: string
  total_points: number
  created_at: string
  updated_at: string
}

// Historial por tema
export interface ScoreHistory {
  id: string
  player_id: string
  tema: Tema
  preguntas_realizadas: number
  aciertos: number
  fallos: number
  updated_at: string
}

// Estado completo del jugador (perfil + historial por tema)
export interface EstadoJugador {
  profile: PlayerProfile
  historial: ScoreHistory[]
}
