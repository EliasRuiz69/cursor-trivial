/**
 * app/(game)/play/page.tsx
 * Página principal del juego.
 * Gestiona el estado global: selección de tema → pregunta → resultado → siguiente.
 */

'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'
import {
  PreguntaPublica,
  ResultadoRespuesta,
  PlayerProfile,
  ScoreHistory,
  Tema,
} from '@/lib/types'
import SeleccionTema from '@/components/game/SeleccionTema'
import TarjetaPregunta from '@/components/game/TarjetaPregunta'
import Marcador from '@/components/game/Marcador'
import ModalReglas from '@/components/game/ModalReglas'
import ModalSalir from '@/components/game/ModalSalir'

// ID de sesión para rotar artículos de Wikipedia
const SESSION_ID = uuidv4()

type EstadoJuego = 'seleccion' | 'jugando' | 'error'

export default function PlayPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Estado del jugador
  const [perfil, setPerfil] = useState<PlayerProfile | null>(null)
  const [historial, setHistorial] = useState<ScoreHistory[]>([])
  const [cargandoPerfil, setCargandoPerfil] = useState(true)

  // Estado del juego
  const [estadoJuego, setEstadoJuego] = useState<EstadoJuego>('seleccion')
  const [temaActual, setTemaActual] = useState<Tema | null>(null)
  const [preguntaActual, setPreguntaActual] = useState<PreguntaPublica | null>(null)
  const [cargandoPregunta, setCargandoPregunta] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Modales
  const [modalReglas, setModalReglas] = useState(false)
  const [modalSalir, setModalSalir] = useState(false)

  // Redirigir si no está autenticado
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // Cargar perfil del jugador
  const cargarPerfil = useCallback(async () => {
    if (!session?.user?.email) return
    try {
      const res = await fetch('/api/player')
      if (!res.ok) throw new Error('Error')
      const data = await res.json()
      setPerfil(data.perfil)
      setHistorial(data.historial)
    } catch {
      // Silencioso
    } finally {
      setCargandoPerfil(false)
    }
  }, [session])

  useEffect(() => {
    if (status === 'authenticated') {
      cargarPerfil()
    }
  }, [status, cargarPerfil])

  // ---------------------------------------------------------------
  // SELECCIÓN DE TEMA → cargar pregunta
  // ---------------------------------------------------------------
  const handleSeleccionarTema = async (tema: Tema) => {
    setTemaActual(tema)
    setCargandoPregunta(true)
    setErrorMsg(null)

    try {
      const res = await fetch(
        `/api/questions?tema=${encodeURIComponent(tema)}&sessionId=${SESSION_ID}`
      )
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error obteniendo pregunta')
      }
      const pregunta: PreguntaPublica = await res.json()
      setPreguntaActual(pregunta)
      setEstadoJuego('jugando')
    } catch {
      setErrorMsg('Oops, no encontramos una pregunta. ¡Intenta con otro tema!')
      setEstadoJuego('error')
    } finally {
      setCargandoPregunta(false)
    }
  }

  // ---------------------------------------------------------------
  // RESPONDER — validar en el backend y actualizar Supabase
  // ---------------------------------------------------------------
  const handleResponder = async (
    letra: 'A' | 'B' | 'C' | 'D'
  ): Promise<ResultadoRespuesta> => {
    if (!preguntaActual || !temaActual) {
      throw new Error('Sin pregunta activa')
    }

    // 1. Validar respuesta en el backend
    const resValidacion = await fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        preguntaId: preguntaActual.id,
        respuesta: letra,
      }),
    })

    if (!resValidacion.ok) {
      throw new Error('Error validando respuesta')
    }

    const resultado: ResultadoRespuesta = await resValidacion.json()

    // 2. Guardar en Supabase (score_history + total_points)
    try {
      const resGuardar = await fetch('/api/player', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tema: temaActual,
          correcto: resultado.correcto,
        }),
      })

      if (resGuardar.ok) {
        const dataGuardado = await resGuardar.json()

        // Actualizar estado local con los nuevos puntos
        setPerfil((prev) =>
          prev ? { ...prev, total_points: dataGuardado.nuevosPuntos } : prev
        )

        // Actualizar historial local
        setHistorial((prev) => {
          const idx = prev.findIndex((h) => h.tema === temaActual)
          const nuevaEntrada = dataGuardado.historial
          if (idx >= 0) {
            const nuevo = [...prev]
            nuevo[idx] = { ...nuevo[idx], ...nuevaEntrada }
            return nuevo
          } else {
            return [...prev, { id: '', player_id: '', updated_at: '', ...nuevaEntrada }]
          }
        })
      }
    } catch {
      // El juego continúa aunque falle el guardado
      console.error('Error guardando en Supabase')
    }

    return resultado
  }

  // ---------------------------------------------------------------
  // SIGUIENTE PREGUNTA (mismo tema)
  // ---------------------------------------------------------------
  const handleSiguientePregunta = async () => {
    if (!temaActual) return
    setPreguntaActual(null)
    setEstadoJuego('seleccion') // Forzar re-render antes de cargar
    await handleSeleccionarTema(temaActual)
  }

  // ---------------------------------------------------------------
  // ELEGIR OTRO TEMA
  // ---------------------------------------------------------------
  const handleElegirOtroTema = () => {
    setPreguntaActual(null)
    setTemaActual(null)
    setEstadoJuego('seleccion')
    setErrorMsg(null)
  }

  // ---------------------------------------------------------------
  // EDITAR NOMBRE
  // ---------------------------------------------------------------
  const handleEditarNombre = async (nuevoNombre: string) => {
    try {
      const res = await fetch('/api/player', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: nuevoNombre }),
      })
      if (res.ok) {
        const data = await res.json()
        setPerfil((prev) => (prev ? { ...prev, display_name: data.perfil.display_name } : prev))
      }
    } catch {
      // Silencioso
    }
  }

  // ---------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------
  if (status === 'loading' || cargandoPerfil) {
    return (
      <div className="min-h-screen bg-[#FDFAF0] flex items-center justify-center">
        <p className="font-['Courier_Prime',_monospace] text-[#2D2D2D] animate-pulse">
          ⏳ Cargando...
        </p>
      </div>
    )
  }

  return (
    <main className="
      min-h-screen bg-[#FDFAF0]
      bg-[radial-gradient(circle,_#D0D0D0_1px,_transparent_1px)]
      bg-[length:24px_24px]
      pb-20
    ">
      {/* Header con marcador */}
      <header className="
        bg-[#A8C8E8] border-b-4 border-[#2D2D2D]
        px-4 sm:px-6 py-3
        flex items-center justify-between gap-4 flex-wrap
      ">
        {/* Logo + volver */}
        <button
          onClick={() => router.push('/welcome')}
          className="
            font-['Press_Start_2P',_monospace] text-xs text-[#2D2D2D]
            hover:text-[#5A8AB8] transition-colors cursor-pointer
          "
        >
          ← TRIVIAL RETRO
        </button>

        {/* Marcador central */}
        {perfil && (
          <div className="flex-1 flex justify-center">
            <Marcador
              displayName={perfil.display_name}
              totalPuntos={perfil.total_points}
              historial={historial}
              onEditarNombre={handleEditarNombre}
            />
          </div>
        )}

        {/* Botón salir */}
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

      {/* Contenido principal */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">

        {/* Estado: Selección de tema */}
        {(estadoJuego === 'seleccion' || estadoJuego === 'error') && (
          <>
            {errorMsg && (
              <div className="
                mb-6 bg-[#F4A8A8] border-2 border-[#C06060]
                p-4 font-['Courier_Prime',_monospace] text-sm text-center
              ">
                ⚠️ {errorMsg}
              </div>
            )}
            <SeleccionTema
              onSeleccionar={handleSeleccionarTema}
              cargando={cargandoPregunta}
            />
          </>
        )}

        {/* Estado: Jugando */}
        {estadoJuego === 'jugando' && preguntaActual && (
          <TarjetaPregunta
            pregunta={preguntaActual}
            onResponder={handleResponder}
            onSiguientePregunta={handleSiguientePregunta}
            onElegirOtroTema={handleElegirOtroTema}
          />
        )}

        {/* Cargando pregunta */}
        {cargandoPregunta && estadoJuego === 'seleccion' && (
          <div className="text-center py-12">
            <div className="
              inline-block border-4 border-[#2D2D2D] bg-[#FFE5A8]
              px-6 py-4
              shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)]
              font-['Courier_Prime',_monospace] text-sm
              animate-pulse
            ">
              🔍 Buscando pregunta sobre {temaActual}...
            </div>
          </div>
        )}
      </div>

      {/* Botón flotante de reglas */}
      <button
        onClick={() => setModalReglas(true)}
        className="
          fixed bottom-5 left-5 z-40
          bg-[#FFE5A8] border-4 border-[#2D2D2D]
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

      {/* Modales */}
      <ModalReglas abierto={modalReglas} onCerrar={() => setModalReglas(false)} />
      <ModalSalir abierto={modalSalir} onCerrar={() => setModalSalir(false)} />
    </main>
  )
}
