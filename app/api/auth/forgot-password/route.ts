import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { createServerSupabaseClient } from '@/lib/supabase'
import { sendPasswordResetEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email requerido.' }, { status: 400 })
    }

    const emailNorm = email.toLowerCase().trim()
    const supabase = createServerSupabaseClient()

    const { data: player } = await supabase
      .from('player_profiles')
      .select('id')
      .eq('user_id', emailNorm)
      .maybeSingle()

    // Respuesta genérica para no revelar si el email existe
    if (!player) {
      return NextResponse.json({ ok: true })
    }

    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()

    const { error: insertError } = await supabase
      .from('password_reset_tokens')
      .insert({ player_id: player.id, token, expires_at: expiresAt })

    if (insertError) {
      console.error('Error guardando token de reset:', insertError)
      return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
    }

    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`

    try {
      await sendPasswordResetEmail(emailNorm, resetUrl)
    } catch (emailErr) {
      // El token ya está guardado; solo falló el envío. Logueamos pero no rompemos el flujo.
      console.error('Error enviando email de reset:', emailErr)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Error en /api/auth/forgot-password:', err)
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
  }
}
