'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setCargando(true)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Error al enviar el correo.')
        setCargando(false)
        return
      }

      setEnviado(true)
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.')
      setCargando(false)
    }
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
          bg-[#E8D0F8] border-b-4 border-[#2D2D2D]
          px-6 py-4 text-center
        ">
          <div className="flex justify-center gap-3 mb-2 text-2xl">
            🔑
          </div>
          <h1 className="font-['Press_Start_2P',_monospace] text-lg text-[#2D2D2D] leading-tight">
            RECUPERAR
          </h1>
          <h2 className="font-['Press_Start_2P',_monospace] text-xs text-[#7B5AB8] mt-1">
            CONTRASEÑA
          </h2>
        </div>

        {enviado ? (
          /* Estado: correo enviado */
          <div className="px-6 py-8 flex flex-col gap-4 items-center text-center">
            <div className="text-4xl">📬</div>
            <p className="font-['Courier_Prime',_monospace] text-sm text-[#2D2D2D]">
              Si ese email está registrado, recibirás un enlace para restablecer tu contraseña en los próximos minutos.
            </p>
            <p className="font-['Courier_Prime',_monospace] text-xs text-[#666]">
              El enlace expira en 30 minutos. Revisa también la carpeta de spam.
            </p>
            <Link
              href="/login"
              className="
                mt-2 font-['Courier_Prime',_monospace] text-sm font-bold
                text-[#2D2D2D] underline hover:text-[#5A8AB8]
              "
            >
              ← Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          /* Formulario */
          <form onSubmit={handleSubmit} className="px-6 py-6 flex flex-col gap-4">
            <p className="font-['Courier_Prime',_monospace] text-sm text-[#555] text-center">
              Introduce tu email y te enviaremos un enlace para restablecer tu contraseña.
            </p>

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

            {error && (
              <p className="
                font-['Courier_Prime',_monospace] text-sm text-[#CC3333]
                border-2 border-[#CC3333] bg-[#FFF0F0]
                px-3 py-2 text-center
              ">
                ⚠ {error}
              </p>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="
                w-full bg-[#E8D0F8] border-4 border-[#2D2D2D]
                px-6 py-3
                shadow-[4px_4px_0px_0px_rgba(0,0,0,0.6)]
                active:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.6)]
                active:translate-x-[2px] active:translate-y-[2px]
                transition-all duration-75 cursor-pointer
                font-['Courier_Prime',_monospace] font-bold text-[#2D2D2D]
                text-sm uppercase tracking-wide
                hover:bg-[#D8B8F0]
                disabled:opacity-60 disabled:cursor-not-allowed
              "
            >
              {cargando ? '⏳ Enviando...' : '📧 Enviar enlace'}
            </button>
          </form>
        )}

        {/* Footer */}
        <div className="
          bg-[#FFE5A8] border-t-4 border-[#2D2D2D]
          px-6 py-3 text-center
        ">
          <p className="font-['Courier_Prime',_monospace] text-xs text-[#555]">
            ¿Recuerdas tu contraseña?{' '}
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
