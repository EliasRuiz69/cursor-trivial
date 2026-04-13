/**
 * app/api/auth/register/route.ts
 * Registro de nuevos jugadores con email + contraseña.
 */

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, password, displayName } = await request.json()

    if (!email || !password || !displayName) {
      return NextResponse.json(
        { error: 'Todos los campos son obligatorios.' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres.' },
        { status: 400 }
      )
    }

    const emailNorm = email.toLowerCase().trim()
    const supabase = createServerSupabaseClient()

    // Comprobar si el email ya está registrado
    const { data: existing } = await supabase
      .from('player_profiles')
      .select('user_id')
      .eq('user_id', emailNorm)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: 'Este email ya está registrado.' },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const { error } = await supabase.from('player_profiles').insert({
      user_id: emailNorm,
      display_name: displayName.trim(),
      total_points: 0,
      password_hash: passwordHash,
    })

    if (error) {
      console.error('Error creando perfil:', error)
      return NextResponse.json(
        { error: 'Error al crear la cuenta. Inténtalo de nuevo.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (err) {
    console.error('Error en /api/auth/register:', err)
    return NextResponse.json(
      { error: 'Error interno del servidor.' },
      { status: 500 }
    )
  }
}
