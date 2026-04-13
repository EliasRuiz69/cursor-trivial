'use client'

import { useState } from 'react'
import { ScoreHistory, Tema } from '@/lib/types'

interface MarcadorProps {
  displayName: string
  totalPuntos: number
  historial: ScoreHistory[]
  onEditarNombre?: (nuevoNombre: string) => void
}

const TEMAS: { nombre: Tema; emoji: string; color: string }[] = [
  { nombre: 'Historia', emoji: '🏛️', color: 'bg-[#A8C8E8]' },
  { nombre: 'Geografía', emoji: '🌍', color: 'bg-[#A8E6CF]' },
  { nombre: 'Matemáticas', emoji: '🔢', color: 'bg-[#FFE5A8]' },
  { nombre: 'Cine', emoji: '🎬', color: 'bg-[#F4A8A8]' },
]

export default function Marcador({
  displayName,
  totalPuntos,
  historial,
  onEditarNombre,
}: MarcadorProps) {
  const [editandoNombre, setEditandoNombre] = useState(false)
  const [nuevoNombre, setNuevoNombre] = useState(displayName)
  const [tablaVisible, setTablaVisible] = useState(false)

  const guardarNombre = () => {
    const nombre = nuevoNombre.trim()
    if (nombre && nombre !== displayName && onEditarNombre) {
      onEditarNombre(nombre)
    }
    setEditandoNombre(false)
  }

  const getHistorialTema = (tema: Tema): ScoreHistory | undefined =>
    historial.find((h) => h.tema === tema)

  return (
    <div className="font-['Courier_Prime',_monospace]">
      {/* Fila principal */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Nombre del jugador (editable) */}
        <div className="flex items-center gap-2">
          {editandoNombre ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') guardarNombre()
                  if (e.key === 'Escape') setEditandoNombre(false)
                }}
                maxLength={30}
                autoFocus
                className="
                  border-2 border-[#2D2D2D] bg-white px-2 py-1
                  text-sm text-[#2D2D2D] w-36
                  focus:outline-none focus:border-[#A8C8E8]
                "
              />
              <button
                onClick={guardarNombre}
                className="text-green-700 font-bold px-1 text-sm hover:text-green-900"
                aria-label="Guardar nombre"
              >
                ✓
              </button>
              <button
                onClick={() => setEditandoNombre(false)}
                className="text-red-700 font-bold px-1 text-sm hover:text-red-900"
                aria-label="Cancelar"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setNuevoNombre(displayName)
                setEditandoNombre(true)
              }}
              className="
                text-sm font-bold text-[#2D2D2D]
                border-b-2 border-dashed border-[#2D2D2D]
                hover:border-[#A8C8E8] hover:text-[#5A8AB8]
                transition-colors cursor-pointer
              "
              title="Clic para editar tu nombre"
            >
              👤 {displayName}
            </button>
          )}
        </div>

        {/* Puntos */}
        <div className="
          px-3 py-1.5 border-2 border-[#2D2D2D]
          bg-[#FFE5A8] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.4)]
          font-bold text-sm text-[#2D2D2D]
        ">
          ⭐ {totalPuntos} pts
        </div>

        {/* Botón toggle tabla */}
        <button
          onClick={() => setTablaVisible(!tablaVisible)}
          className="
            px-2 py-1.5 border-2 border-[#2D2D2D]
            bg-[#A8C8E8] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.4)]
            text-xs font-bold text-[#2D2D2D]
            hover:bg-[#8FB5D8] active:translate-x-[1px] active:translate-y-[1px]
            active:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.4)]
            transition-all duration-75 cursor-pointer
          "
          title="Ver estadísticas por tema"
        >
          📊 {tablaVisible ? '▲' : '▼'}
        </button>
      </div>

      {/* Tabla desplegable de estadísticas */}
      {tablaVisible && (
        <div className="
          mt-2 border-2 border-[#2D2D2D] bg-[#FDFAF0]
          shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]
          text-xs overflow-hidden
        ">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#2D2D2D] text-[#FDFAF0]">
                <th className="px-2 py-1.5 text-left">Tema</th>
                <th className="px-2 py-1.5 text-center">Preguntas</th>
                <th className="px-2 py-1.5 text-center text-green-400">✅</th>
                <th className="px-2 py-1.5 text-center text-red-400">❌</th>
              </tr>
            </thead>
            <tbody>
              {TEMAS.map(({ nombre, emoji, color }) => {
                const h = getHistorialTema(nombre)
                return (
                  <tr key={nombre} className={`border-t border-[#2D2D2D] ${color}`}>
                    <td className="px-2 py-1.5 font-bold">
                      {emoji} {nombre}
                    </td>
                    <td className="px-2 py-1.5 text-center">{h?.preguntas_realizadas || 0}</td>
                    <td className="px-2 py-1.5 text-center text-green-700 font-bold">
                      {h?.aciertos || 0}
                    </td>
                    <td className="px-2 py-1.5 text-center text-red-700 font-bold">
                      {h?.fallos || 0}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
