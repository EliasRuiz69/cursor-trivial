/**
 * app/api/player/route.ts
 * CRUD del jugador: obtener perfil + historial, actualizar nombre y puntos.
 *
 * GET    /api/player        → obtener perfil completo + historial
 * PATCH  /api/player        → actualizar display_name o total_points
 * POST   /api/player/score  → upsert en score_history por tema
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { createServerSupabaseClient } from '@/lib/supabase'
import { Tema } from '@/lib/types'

// ---------------------------------------------------------------
// GET — Obtener perfil + historial del jugador autenticado
// ---------------------------------------------------------------
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const supabase = createServerSupabaseClient()

  // Obtener perfil
  const { data: perfil, error: errorPerfil } = await supabase
    .from('player_profiles')
    .select('*')
    .eq('user_id', session.user.email)
    .single()

  if (errorPerfil || !perfil) {
    return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })
  }

  // Obtener historial de todos los temas
  const { data: historial, error: errorHistorial } = await supabase
    .from('score_history')
    .select('*')
    .eq('player_id', perfil.id)

  if (errorHistorial) {
    return NextResponse.json({ error: 'Error obteniendo historial' }, { status: 500 })
  }

  return NextResponse.json({ perfil, historial: historial || [] })
}

// ---------------------------------------------------------------
// PATCH — Actualizar display_name o total_points
// ---------------------------------------------------------------
export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await request.json()
  const { display_name, total_points } = body

  // Validar que al menos un campo viene en el body
  if (display_name === undefined && total_points === undefined) {
    return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
  }

  // Validar display_name
  if (display_name !== undefined) {
    if (typeof display_name !== 'string' || display_name.trim().length === 0) {
      return NextResponse.json({ error: 'Nombre inválido' }, { status: 400 })
    }
    if (display_name.trim().length > 30) {
      return NextResponse.json({ error: 'El nombre no puede superar 30 caracteres' }, { status: 400 })
    }
  }

  // Validar total_points
  if (total_points !== undefined) {
    if (typeof total_points !== 'number' || total_points < 0) {
      return NextResponse.json({ error: 'Puntos inválidos' }, { status: 400 })
    }
  }

  const supabase = createServerSupabaseClient()

  const updates: Record<string, unknown> = {}
  if (display_name !== undefined) updates.display_name = display_name.trim()
  if (total_points !== undefined) updates.total_points = Math.max(0, total_points)

  const { data, error } = await supabase
    .from('player_profiles')
    .update(updates)
    .eq('user_id', session.user.email)
    .select()
    .single()

  if (error) {
    console.error('Error actualizando perfil:', error)
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
  }

  return NextResponse.json({ perfil: data })
}

// ---------------------------------------------------------------
// POST — Upsert de score_history para un tema específico
// ---------------------------------------------------------------
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await request.json()
  const { tema, correcto } = body

  const temasValidos: Tema[] = ['Historia', 'Geografía', 'Matemáticas', 'Cine']
  if (!temasValidos.includes(tema)) {
    return NextResponse.json({ error: 'Tema inválido' }, { status: 400 })
  }

  if (typeof correcto !== 'boolean') {
    return NextResponse.json({ error: 'Parámetro "correcto" requerido' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()

  // Obtener el player_id
  const { data: perfil, error: errorPerfil } = await supabase
    .from('player_profiles')
    .select('id, total_points')
    .eq('user_id', session.user.email)
    .single()

  if (errorPerfil || !perfil) {
    return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })
  }

  // Obtener el registro actual del tema (si existe)
  const { data: registroActual } = await supabase
    .from('score_history')
    .select('*')
    .eq('player_id', perfil.id)
    .eq('tema', tema)
    .single()

  // Calcular nuevos valores
  const nuevoRegistro = {
    player_id: perfil.id,
    tema,
    preguntas_realizadas: (registroActual?.preguntas_realizadas || 0) + 1,
    aciertos: (registroActual?.aciertos || 0) + (correcto ? 1 : 0),
    fallos: (registroActual?.fallos || 0) + (correcto ? 0 : 1),
  }

  // Upsert: insertar o actualizar según (player_id, tema)
  const { error: errorUpsert } = await supabase
    .from('score_history')
    .upsert(nuevoRegistro, { onConflict: 'player_id,tema' })

  if (errorUpsert) {
    console.error('Error en upsert score_history:', errorUpsert)
    return NextResponse.json({ error: 'Error guardando historial' }, { status: 500 })
  }

  // Actualizar puntos totales del jugador (nunca negativos)
  const cambio = correcto ? 2 : -1
  const nuevosPuntos = Math.max(0, perfil.total_points + cambio)

  const { error: errorPuntos } = await supabase
    .from('player_profiles')
    .update({ total_points: nuevosPuntos })
    .eq('id', perfil.id)

  if (errorPuntos) {
    console.error('Error actualizando puntos:', errorPuntos)
  }

  return NextResponse.json({
    ok: true,
    nuevosPuntos,
    cambio,
    historial: nuevoRegistro,
  })
}
