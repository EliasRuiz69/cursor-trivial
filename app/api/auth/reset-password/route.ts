import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json({ error: 'Datos incompletos.' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres.' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()

    const { data: resetToken } = await supabase
      .from('password_reset_tokens')
      .select('id, player_id, expires_at, used_at')
      .eq('token', token)
      .maybeSingle()

    if (
      !resetToken ||
      resetToken.used_at ||
      new Date(resetToken.expires_at) < new Date()
    ) {
      return NextResponse.json(
        { error: 'El enlace es inválido o ha expirado.' },
        { status: 400 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const { error: updateError } = await supabase
      .from('player_profiles')
      .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
      .eq('id', resetToken.player_id)

    if (updateError) {
      console.error('Error actualizando contraseña:', updateError)
      return NextResponse.json(
        { error: 'Error al actualizar la contraseña. Inténtalo de nuevo.' },
        { status: 500 }
      )
    }

    // Invalidar el token
    await supabase
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', resetToken.id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Error en /api/auth/reset-password:', err)
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
  }
}
