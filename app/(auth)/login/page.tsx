/**
 * app/(auth)/login/page.tsx
 * Página de inicio de sesión con email y contraseña.
 */

'use client'

import { signIn, useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.push('/welcome')
    }
  }, [session, status, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setCargando(true)

    const result = await signIn('credentials', {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    })

    if (result?.error) {
      setError('Email o contraseña incorrectos.')
      setCargando(false)
    } else {
      router.push('/welcome')
    }
  }

  if (status === 'loading' || (status === 'authenticated' && session)) {
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
          bg-[#A8C8E8] border-b-4 border-[#2D2D2D]
          px-6 py-4 text-center
        ">
          <div className="flex justify-center gap-3 mb-2 text-2xl">
            🏛️ 🌍 🔢 🎬
          </div>
          <h1 className="font-['Press_Start_2P',_monospace] text-2xl text-[#2D2D2D] leading-tight">
            TRIVIAL
          </h1>
          <h2 className="font-['Press_Start_2P',_monospace] text-sm text-[#5A8AB8] mt-1">
            RETRO
          </h2>
        </div>

        {/* Formulario */}
        <form onSubmit={handleLogin} className="px-6 py-6 flex flex-col gap-4">
          <p className="font-['Courier_Prime',_monospace] text-sm text-[#555] text-center">
            Inicia sesión para jugar y guardar tu puntuación.
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
              autoComplete="current-password"
              placeholder="••••••••"
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

          {/* Botón login */}
          <button
            type="submit"
            disabled={cargando}
            className="
              w-full bg-[#A8C8E8] border-4 border-[#2D2D2D]
              px-6 py-3
              shadow-[4px_4px_0px_0px_rgba(0,0,0,0.6)]
              active:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.6)]
              active:translate-x-[2px] active:translate-y-[2px]
              transition-all duration-75 cursor-pointer
              font-['Courier_Prime',_monospace] font-bold text-[#2D2D2D]
              text-sm uppercase tracking-wide
              hover:bg-[#90B8D8]
              disabled:opacity-60 disabled:cursor-not-allowed
            "
          >
            {cargando ? '⏳ Entrando...' : '▶ Iniciar sesión'}
          </button>
        </form>

        {/* Footer con enlace a registro */}
        <div className="
          bg-[#FFE5A8] border-t-4 border-[#2D2D2D]
          px-6 py-3 text-center
        ">
          <p className="font-['Courier_Prime',_monospace] text-xs text-[#555]">
            ¿Sin cuenta?{' '}
            <Link
              href="/register"
              className="font-bold text-[#2D2D2D] underline hover:text-[#5A8AB8]"
            >
              Regístrate aquí
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
