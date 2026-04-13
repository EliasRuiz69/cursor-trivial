/**
 * app/(auth)/register/page.tsx
 * Página de registro de nuevos jugadores.
 */

'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.push('/welcome')
    }
  }, [session, status, router])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setCargando(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          displayName: displayName.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al registrarse.')
        setCargando(false)
        return
      }

      // Registro exitoso → ir al login
      router.push('/login?registered=1')
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.')
      setCargando(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#FDFAF0] flex items-center justify-center">
        <p className="font-['Courier_Prime',_monospace] text-[#2D2D2D] animate-pulse text-sm">
          ⏳ Cargando...
        </p>
      </div>
    )
  }

  return (
    <main className="
      min-h-screen bg-[#FDFAF0]
      flex flex-col items-center justify-center
      p-6
      bg-[radial-gradient(circle,_#D0D0D0_1px,_transparent_1px)]
      bg-[length:24px_24px]
    ">
      <div className="
        w-full max-w-md
        bg-[#FDFAF0] border-4 border-[#2D2D2D]
        shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)]
        overflow-hidden
      ">
        {/* Header */}
        <div className="
          bg-[#B8E8C8] border-b-4 border-[#2D2D2D]
          px-6 py-4 text-center
        ">
          <div className="flex justify-center gap-3 mb-2 text-2xl">
            🏛️ 🌍 🔢 🎬
          </div>
          <h1 className="font-['Press_Start_2P',_monospace] text-lg text-[#2D2D2D] leading-tight">
            NUEVA CUENTA
          </h1>
        </div>

        {/* Formulario */}
        <form onSubmit={handleRegister} className="px-6 py-6 flex flex-col gap-4">
          <p className="font-['Courier_Prime',_monospace] text-sm text-[#555] text-center">
            Crea tu cuenta para guardar puntuaciones y competir.
          </p>

          {/* Email */}
          <div className="flex flex-col gap-1">
            <label className="font-['Courier_Prime',_monospace] text-xs font-bold text-[#2D2D2D] uppercase tracking-wide">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="tu@email.com"
              className="
                border-4 border-[#2D2D2D] bg-white
                px-3 py-2
                font-['Courier_Prime',_monospace] text-sm text-[#2D2D2D]
                placeholder:text-[#aaa]
                focus:outline-none focus:bg-[#FFFDE8]
              "
            />
          </div>

          {/* Nombre visible */}
          <div className="flex flex-col gap-1">
            <label className="font-['Courier_Prime',_monospace] text-xs font-bold text-[#2D2D2D] uppercase tracking-wide">
              Nombre de jugador
            </label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              required
              autoComplete="nickname"
              placeholder="Como quieres aparecer en el juego"
              maxLength={30}
              className="
                border-4 border-[#2D2D2D] bg-white
                px-3 py-2
                font-['Courier_Prime',_monospace] text-sm text-[#2D2D2D]
                placeholder:text-[#aaa]
                focus:outline-none focus:bg-[#FFFDE8]
              "
            />
          </div>

          {/* Contraseña */}
          <div className="flex flex-col gap-1">
            <label className="font-['Courier_Prime',_monospace] text-xs font-bold text-[#2D2D2D] uppercase tracking-wide">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="Mínimo 6 caracteres"
              className="
                border-4 border-[#2D2D2D] bg-white
                px-3 py-2
                font-['Courier_Prime',_monospace] text-sm text-[#2D2D2D]
                placeholder:text-[#aaa]
                focus:outline-none focus:bg-[#FFFDE8]
              "
            />
          </div>

          {/* Confirmar contraseña */}
          <div className="flex flex-col gap-1">
            <label className="font-['Courier_Prime',_monospace] text-xs font-bold text-[#2D2D2D] uppercase tracking-wide">
              Confirmar contraseña
            </label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="Repite la contraseña"
              className="
                border-4 border-[#2D2D2D] bg-white
                px-3 py-2
                font-['Courier_Prime',_monospace] text-sm text-[#2D2D2D]
                placeholder:text-[#aaa]
                focus:outline-none focus:bg-[#FFFDE8]
              "
            />
          </div>

          {/* Error */}
          {error && (
            <p className="
              font-['Courier_Prime',_monospace] text-sm text-[#CC3333]
              border-2 border-[#CC3333] bg-[#FFF0F0]
              px-3 py-2 text-center
            ">
              ⚠ {error}
            </p>
          )}

          {/* Botón */}
          <button
            type="submit"
            disabled={cargando}
            className="
              w-full bg-[#B8E8C8] border-4 border-[#2D2D2D]
              px-6 py-3
              shadow-[4px_4px_0px_0px_rgba(0,0,0,0.6)]
              active:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.6)]
              active:translate-x-[2px] active:translate-y-[2px]
              transition-all duration-75 cursor-pointer
              font-['Courier_Prime',_monospace] font-bold text-[#2D2D2D]
              text-sm uppercase tracking-wide
              hover:bg-[#9ED8B0]
              disabled:opacity-60 disabled:cursor-not-allowed
            "
          >
            {cargando ? '⏳ Creando cuenta...' : '✚ Crear cuenta'}
          </button>
        </form>

        {/* Footer */}
        <div className="
          bg-[#FFE5A8] border-t-4 border-[#2D2D2D]
          px-6 py-3 text-center
        ">
          <p className="font-['Courier_Prime',_monospace] text-xs text-[#555]">
            ¿Ya tienes cuenta?{' '}
            <Link
              href="/login"
              className="font-bold text-[#2D2D2D] underline hover:text-[#5A8AB8]"
            >
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>

      <div className="mt-6 flex gap-4 text-2xl opacity-40">
        <span className="animate-bounce" style={{ animationDelay: '0ms' }}>🏛️</span>
        <span className="animate-bounce" style={{ animationDelay: '150ms' }}>🌍</span>
        <span className="animate-bounce" style={{ animationDelay: '300ms' }}>🔢</span>
        <span className="animate-bounce" style={{ animationDelay: '450ms' }}>🎬</span>
      </div>
    </main>
  )
}
