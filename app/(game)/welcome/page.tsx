/**
 * app/(game)/welcome/page.tsx
 * Página de bienvenida post-login.
 * Muestra saludo personalizado, historial y acceso al juego.
 */

'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PlayerProfile, ScoreHistory, Tema } from '@/lib/types'
import BotonRetro from '@/components/ui/BotonRetro'
import Modal from '@/components/ui/Modal'
import ModalReglas from '@/components/game/ModalReglas'
import ModalSalir from '@/components/game/ModalSalir'

const TEMA_COLORS: Record<Tema, string> = {
  Historia: 'bg-[#A8C8E8]',
  Geografía: 'bg-[#A8E6CF]',
  Matemáticas: 'bg-[#FFE5A8]',
  Cine: 'bg-[#F4A8A8]',
}

const TEMA_EMOJIS: Record<Tema, string> = {
  Historia: '🏛️',
  Geografía: '🌍',
  Matemáticas: '🔢',
  Cine: '🎬',
}

export default function WelcomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [perfil, setPerfil] = useState<PlayerProfile | null>(null)
  const [historial, setHistorial] = useState<ScoreHistory[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modales
  const [modalNombre, setModalNombre] = useState(false)
  const [modalReglas, setModalReglas] = useState(false)
  const [modalSalir, setModalSalir] = useState(false)

  // Campo de edición de nombre
  const [editandoNombre, setEditandoNombre] = useState('')
  const [guardandoNombre, setGuardandoNombre] = useState(false)

  // Redirigir si no está autenticado
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // Cargar datos del jugador
  const cargarDatos = useCallback(async () => {
    if (!session?.user?.email) return

    try {
      setCargando(true)
      const res = await fetch('/api/player')
      if (!res.ok) throw new Error('Error cargando datos')

      const data = await res.json()
      setPerfil(data.perfil)
      setHistorial(data.historial)

      // Si el display_name es la parte del email (primer login), abrir modal de nombre
      const emailPrefix = session.user.email.split('@')[0]
      if (data.perfil.display_name === emailPrefix || data.perfil.display_name === session.user.name) {
        // Solo mostrar el modal si no hay partidas previas (primera vez real)
        if (data.historial.length === 0) {
          setEditandoNombre(data.perfil.display_name)
          setModalNombre(true)
        }
      }
    } catch {
      setError('No se pudieron cargar tus datos. Intenta recargar la página.')
    } finally {
      setCargando(false)
    }
  }, [session])

  useEffect(() => {
    if (status === 'authenticated') {
      cargarDatos()
    }
  }, [status, cargarDatos])

  const guardarNombre = async () => {
    const nombre = editandoNombre.trim()
    if (!nombre || nombre.length > 30) return

    setGuardandoNombre(true)
    try {
      const res = await fetch('/api/player', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: nombre }),
      })
      if (res.ok) {
        const data = await res.json()
        setPerfil(data.perfil)
      }
      setModalNombre(false)
    } catch {
      // Error silencioso
    } finally {
      setGuardandoNombre(false)
    }
  }

  if (status === 'loading' || cargando) {
    return (
      <div className="min-h-screen bg-[#FDFAF0] flex items-center justify-center">
        <p className="font-['Courier_Prime',_monospace] text-[#2D2D2D] animate-pulse">
          ⏳ Cargando tu perfil...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FDFAF0] flex items-center justify-center p-6">
        <div className="text-center">
          <p className="font-['Courier_Prime',_monospace] text-red-600 mb-4">{error}</p>
          <BotonRetro onClick={cargarDatos}>Reintentar</BotonRetro>
        </div>
      </div>
    )
  }

  const tienePuntajes = historial.some((h) => h.preguntas_realizadas > 0)

  return (
    <main className="
      min-h-screen bg-[#FDFAF0]
      bg-[radial-gradient(circle,_#D0D0D0_1px,_transparent_1px)]
      bg-[length:24px_24px]
      pb-20
    ">
      {/* Header */}
      <header className="
        bg-[#A8C8E8] border-b-4 border-[#2D2D2D]
        px-4 sm:px-6 py-4
        flex items-center justify-between
      ">
        <h1 className="font-['Press_Start_2P',_monospace] text-base sm:text-xl text-[#2D2D2D]">
          TRIVIAL RETRO
        </h1>
        <button
          onClick={() => setModalSalir(true)}
          className="
            px-3 py-2 border-2 border-[#2D2D2D] bg-[#F4A8A8]
            font-['Courier_Prime',_monospace] text-sm font-bold text-[#2D2D2D]
            shadow-[3px_3px_0px_0px_rgba(0,0,0,0.4)]
            active:shadow-none active:translate-x-[3px] active:translate-y-[3px]
            transition-all duration-75 cursor-pointer hover:bg-[#E09090]
          "
        >
          🚪 Salir
        </button>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Saludo */}
        <div className="
          bg-[#FDFAF0] border-4 border-[#2D2D2D]
          shadow-[6px_6px_0px_0px_rgba(0,0,0,0.5)]
          p-6 text-center
        ">
          <p className="font-['Courier_Prime',_monospace] text-sm text-[#555] mb-2">
            ¡Bienvenido/a de nuevo!
          </p>
          <h2 className="font-['Press_Start_2P',_monospace] text-xl sm:text-2xl text-[#2D2D2D] mb-4 break-words">
            {perfil?.display_name || '...'}
          </h2>
          <div className="
            inline-block px-4 py-2
            bg-[#FFE5A8] border-2 border-[#C9A040]
            font-['Courier_Prime',_monospace] text-sm font-bold
          ">
            ⭐ {perfil?.total_points || 0} puntos totales
          </div>
        </div>

        {/* Historial por tema */}
        {tienePuntajes && (
          <div className="
            bg-[#FDFAF0] border-4 border-[#2D2D2D]
            shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)]
            overflow-hidden
          ">
            <div className="bg-[#2D2D2D] px-4 py-3">
              <h3 className="font-['Press_Start_2P',_monospace] text-xs text-[#FDFAF0]">
                📊 TU HISTORIAL
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-0">
              {(['Historia', 'Geografía', 'Matemáticas', 'Cine'] as Tema[]).map((tema) => {
                const h = historial.find((x) => x.tema === tema)
                return (
                  <div
                    key={tema}
                    className={`${TEMA_COLORS[tema]} border-[#2D2D2D] border p-3`}
                  >
                    <div className="font-['Courier_Prime',_monospace] text-xs font-bold mb-1">
                      {TEMA_EMOJIS[tema]} {tema}
                    </div>
                    <div className="font-['Courier_Prime',_monospace] text-xs text-[#2D2D2D]">
                      <span className="mr-2">✅ {h?.aciertos || 0}</span>
                      <span>❌ {h?.fallos || 0}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Botón principal */}
        <div className="text-center">
          <BotonRetro
            variante="exito"
            tamaño="lg"
            onClick={() => router.push('/play')}
            className="w-full sm:w-auto text-base"
          >
            🎮 ¡JUGAR AHORA!
          </BotonRetro>
        </div>

        {/* Botón de reglas */}
        <div className="text-center">
          <BotonRetro
            variante="secundario"
            tamaño="sm"
            onClick={() => setModalReglas(true)}
          >
            📋 Ver reglas
          </BotonRetro>
        </div>
      </div>

      {/* Modal: Definir nombre (primer login) */}
      <Modal
        abierto={modalNombre}
        onCerrar={() => setModalNombre(false)}
        titulo="👤 ¿CÓMO TE LLAMAS?"
        anchura="sm"
      >
        <div className="font-['Courier_Prime',_monospace] space-y-4">
          <p className="text-sm text-[#555]">
            Escribe tu nombre para la tabla de puntuación:
          </p>
          <input
            type="text"
            value={editandoNombre}
            onChange={(e) => setEditandoNombre(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') guardarNombre()
            }}
            maxLength={30}
            placeholder="Tu nombre aquí..."
            autoFocus
            className="
              w-full border-2 border-[#2D2D2D] px-3 py-2
              font-['Courier_Prime',_monospace] text-sm
              bg-white focus:outline-none focus:border-[#A8C8E8]
            "
          />
          <p className="text-xs text-[#888]">
            Si no escribes nada, usaremos tu nombre de Google.
          </p>
          <div className="flex gap-3 justify-center">
            <BotonRetro
              variante="exito"
              onClick={guardarNombre}
              disabled={guardandoNombre}
            >
              {guardandoNombre ? '⏳ Guardando...' : '✅ Guardar'}
            </BotonRetro>
            <BotonRetro
              variante="secundario"
              onClick={() => setModalNombre(false)}
            >
              Usar nombre actual
            </BotonRetro>
          </div>
        </div>
      </Modal>

      {/* Modal de reglas */}
      <ModalReglas abierto={modalReglas} onCerrar={() => setModalReglas(false)} />

      {/* Modal de salir */}
      <ModalSalir abierto={modalSalir} onCerrar={() => setModalSalir(false)} />

      {/* Botón flotante de reglas */}
      <button
        onClick={() => setModalReglas(true)}
        className="
          fixed bottom-5 left-5 z-40
          bg-[#FFE5A8] border-3 border-[#2D2D2D] border-4
          px-3 py-2
          font-['Courier_Prime',_monospace] text-xs font-bold text-[#2D2D2D]
          shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]
          active:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]
          active:translate-x-[2px] active:translate-y-[2px]
          transition-all duration-75 cursor-pointer hover:bg-[#F0D090]
        "
      >
        📋 Reglas
      </button>
    </main>
  )
}
