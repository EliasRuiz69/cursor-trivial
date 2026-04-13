'use client'

import { useState } from 'react'
import { PreguntaPublica, ResultadoRespuesta, Tema } from '@/lib/types'
import BotonRetro from '@/components/ui/BotonRetro'

const TEMA_COLORS: Record<Tema, { bg: string; border: string; text: string }> = {
  Historia: { bg: 'bg-[#A8C8E8]', border: 'border-[#5A8AB8]', text: 'text-[#2D4A6A]' },
  Geografía: { bg: 'bg-[#A8E6CF]', border: 'border-[#4A9E78]', text: 'text-[#1A5E3A]' },
  Matemáticas: { bg: 'bg-[#FFE5A8]', border: 'border-[#C9A040]', text: 'text-[#6A4A00]' },
  Cine: { bg: 'bg-[#F4A8A8]', border: 'border-[#C06060]', text: 'text-[#6A1A1A]' },
}

const TEMA_EMOJIS: Record<Tema, string> = {
  Historia: '🏛️',
  Geografía: '🌍',
  Matemáticas: '🔢',
  Cine: '🎬',
}

interface TarjetaPreguntaProps {
  pregunta: PreguntaPublica
  onResponder: (letra: 'A' | 'B' | 'C' | 'D') => Promise<ResultadoRespuesta>
  onSiguientePregunta: () => void
  onElegirOtroTema: () => void
}

export default function TarjetaPregunta({
  pregunta,
  onResponder,
  onSiguientePregunta,
  onElegirOtroTema,
}: TarjetaPreguntaProps) {
  const [respuestaSeleccionada, setRespuestaSeleccionada] = useState<'A' | 'B' | 'C' | 'D' | null>(null)
  const [resultado, setResultado] = useState<ResultadoRespuesta | null>(null)
  const [cargando, setCargando] = useState(false)
  const [animacion, setAnimacion] = useState<'correcto' | 'incorrecto' | null>(null)

  const colores = TEMA_COLORS[pregunta.tema]

  const handleResponder = async (letra: 'A' | 'B' | 'C' | 'D') => {
    if (resultado || cargando) return

    setRespuestaSeleccionada(letra)
    setCargando(true)

    try {
      const res = await onResponder(letra)
      setResultado(res)
      setAnimacion(res.correcto ? 'correcto' : 'incorrecto')

      // Quitar animación después de 2 segundos
      setTimeout(() => setAnimacion(null), 2000)
    } catch {
      // Error silencioso, mantener estado
    } finally {
      setCargando(false)
    }
  }

  const getEstiloBotonOpcion = (letra: 'A' | 'B' | 'C' | 'D') => {
    if (!resultado) {
      // Sin respuesta aún
      return 'bg-white border-[#2D2D2D] hover:bg-gray-50 text-[#2D2D2D]'
    }

    if (letra === resultado.letraCorrecta) {
      // Esta es la correcta → verde
      return 'bg-[#A8E6CF] border-[#4A9E78] text-[#1A5E3A] font-bold'
    }

    if (letra === respuestaSeleccionada && !resultado.correcto) {
      // La que eligió el jugador y era incorrecta → roja
      return 'bg-[#F4A8A8] border-[#C06060] text-[#6A1A1A]'
    }

    // Otras opciones → gris
    return 'bg-gray-100 border-gray-300 text-gray-500'
  }

  return (
    <div
      className={`
        w-full max-w-2xl mx-auto
        ${animacion === 'correcto' ? 'animate-[pulseGreen_0.5s_ease-in-out_3]' : ''}
        ${animacion === 'incorrecto' ? 'animate-[shakeRed_0.5s_ease-in-out]' : ''}
      `}
    >
      {/* Header del tema */}
      <div className={`
        ${colores.bg} ${colores.border}
        border-4 border-b-0
        px-5 py-3 flex items-center gap-2
      `}>
        <span className="text-2xl">{TEMA_EMOJIS[pregunta.tema]}</span>
        <span className={`font-['Press_Start_2P',_monospace] text-sm ${colores.text}`}>
          {pregunta.tema}
        </span>
      </div>

      {/* Cuerpo de la pregunta */}
      <div className="
        border-4 border-[#2D2D2D] bg-[#FDFAF0]
        p-5 sm:p-6
        shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)]
      ">
        {/* Pregunta */}
        <p className="
          font-['Courier_Prime',_monospace] text-base sm:text-lg
          text-[#2D2D2D] font-bold leading-relaxed mb-6
        ">
          {pregunta.pregunta}
        </p>

        {/* Opciones */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          {pregunta.opciones.map((opcion) => (
            <button
              key={opcion.letra}
              onClick={() => handleResponder(opcion.letra)}
              disabled={!!resultado || cargando}
              className={`
                ${getEstiloBotonOpcion(opcion.letra)}
                border-2 p-3 text-left
                font-['Courier_Prime',_monospace] text-sm
                shadow-[3px_3px_0px_0px_rgba(0,0,0,0.25)]
                ${!resultado && !cargando
                  ? 'active:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.25)] active:translate-x-[2px] active:translate-y-[2px] cursor-pointer hover:scale-[1.02]'
                  : 'cursor-default'
                }
                transition-all duration-75
              `}
            >
              <span className="font-bold mr-2">{opcion.letra}.</span>
              {opcion.texto}
            </button>
          ))}
        </div>

        {/* Resultado */}
        {resultado && (
          <div className={`
            border-2 p-4
            ${resultado.correcto
              ? 'bg-[#A8E6CF] border-[#4A9E78]'
              : 'bg-[#F4A8A8] border-[#C06060]'
            }
          `}>
            {/* Mensaje resultado */}
            <p className="font-['Press_Start_2P',_monospace] text-sm mb-3">
              {resultado.correcto ? '✅ ¡CORRECTO!' : `❌ ¡INCORRECTO!`}
            </p>

            {!resultado.correcto && (
              <p className="font-['Courier_Prime',_monospace] text-sm mb-3 font-bold">
                La respuesta correcta era: <strong>{resultado.letraCorrecta}</strong>
              </p>
            )}

            {/* Explicación */}
            <p className="font-['Courier_Prime',_monospace] text-sm leading-relaxed text-[#2D2D2D]">
              💡 {resultado.explicacion}
            </p>

            {/* Puntos */}
            <p className={`
              font-['Courier_Prime',_monospace] text-sm font-bold mt-3
              ${resultado.correcto ? 'text-green-800' : 'text-red-800'}
            `}>
              {resultado.correcto ? '⭐ +2 puntos' : '💔 -1 punto'}
            </p>

            {/* Botones de acción */}
            <div className="flex gap-3 mt-4 flex-wrap">
              {resultado.correcto ? (
                <BotonRetro variante="exito" onClick={onSiguientePregunta}>
                  Siguiente pregunta →
                </BotonRetro>
              ) : (
                <BotonRetro variante="secundario" onClick={onElegirOtroTema}>
                  Elegir otro tema
                </BotonRetro>
              )}
            </div>
          </div>
        )}

        {/* Indicador de carga */}
        {cargando && (
          <div className="text-center py-3">
            <span className="font-['Courier_Prime',_monospace] text-sm text-[#555] animate-pulse">
              ⏳ Comprobando respuesta...
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
