'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Enlace inválido. Solicita uno nuevo desde la página de recuperación.')
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
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
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al restablecer la contraseña.')
        setCargando(false)
        return
      }

      setExito(true)
      setTimeout(() => router.push('/login'), 3000)
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
            🔒
          </div>
          <h1 className="font-['Press_Start_2P',_monospace] text-lg text-[#2D2D2D] leading-tight">
            NUEVA
          </h1>
          <h2 className="font-['Press_Start_2P',_monospace] text-xs text-[#7B5AB8] mt-1">
            CONTRASEÑA
          </h2>
        </div>

        {exito ? (
          /* Estado: éxito */
          <div className="px-6 py-8 flex flex-col gap-4 items-center text-center">
            <div className="text-4xl">✅</div>
            <p className="font-['Courier_Prime',_monospace] text-sm text-[#2D2D2D]">
              ¡Contraseña actualizada correctamente!
            </p>
            <p className="font-['Courier_Prime',_monospace] text-xs text-[#666]">
              Redirigiendo al inicio de sesión...
            </p>
            <Link
              href="/login"
              className="
                mt-2 font-['Courier_Prime',_monospace] text-sm font-bold
                text-[#2D2D2D] underline hover:text-[#5A8AB8]
              "
            >
              ▶ Ir al login
            </Link>
          </div>
        ) : (
          /* Formulario */
          <form onSubmit={handleSubmit} className="px-6 py-6 flex flex-col gap-4">
            <p className="font-['Courier_Prime',_monospace] text-sm text-[#555] text-center">
              Elige una nueva contraseña para tu cuenta.
            </p>

            <div className="flex flex-col gap-1">
              <label className="font-['Courier_Prime',_monospace] text-xs font-bold text-[#2D2D2D] uppercase tracking-wide">
                Nueva contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                disabled={!token}
                autoComplete="new-password"
                placeholder="Mínimo 6 caracteres"
                className="
                  border-4 border-[#2D2D2D] bg-white
                  px-3 py-2
                  font-['Courier_Prime',_monospace] text-sm text-[#2D2D2D]
                  placeholder:text-[#aaa]
                  focus:outline-none focus:bg-[#FFFDE8]
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-['Courier_Prime',_monospace] text-xs font-bold text-[#2D2D2D] uppercase tracking-wide">
                Confirmar contraseña
              </label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                disabled={!token}
                autoComplete="new-password"
                placeholder="Repite la contraseña"
                className="
                  border-4 border-[#2D2D2D] bg-white
                  px-3 py-2
                  font-['Courier_Prime',_monospace] text-sm text-[#2D2D2D]
                  placeholder:text-[#aaa]
                  focus:outline-none focus:bg-[#FFFDE8]
                  disabled:opacity-50 disabled:cursor-not-allowed
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
              disabled={cargando || !token}
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
              {cargando ? '⏳ Guardando...' : '🔒 Guardar contraseña'}
            </button>
          </form>
        )}

        {/* Footer */}
        <div className="
          bg-[#FFE5A8] border-t-4 border-[#2D2D2D]
          px-6 py-3 text-center
        ">
          <p className="font-['Courier_Prime',_monospace] text-xs text-[#555]">
            ¿Enlace expirado?{' '}
            <Link
              href="/forgot-password"
              className="font-bold text-[#2D2D2D] underline hover:text-[#5A8AB8]"
            >
              Solicitar otro
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

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
