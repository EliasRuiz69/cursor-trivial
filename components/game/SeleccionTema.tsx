'use client'

import { Tema } from '@/lib/types'

interface TemaConfig {
  nombre: Tema
  emoji: string
  color: string
  borderColor: string
  shadowColor: string
  descripcion: string
}

const TEMAS: TemaConfig[] = [
  {
    nombre: 'Historia',
    emoji: '🏛️',
    color: 'bg-[#A8C8E8] hover:bg-[#8FB5D8]',
    borderColor: 'border-[#5A8AB8]',
    shadowColor: 'shadow-[6px_6px_0px_0px_#5A8AB8]',
    descripcion: 'Civilizaciones, guerras y grandes eventos',
  },
  {
    nombre: 'Geografía',
    emoji: '🌍',
    color: 'bg-[#A8E6CF] hover:bg-[#8ED4BA]',
    borderColor: 'border-[#4A9E78]',
    shadowColor: 'shadow-[6px_6px_0px_0px_#4A9E78]',
    descripcion: 'Países, ríos, montañas y continentes',
  },
  {
    nombre: 'Matemáticas',
    emoji: '🔢',
    color: 'bg-[#FFE5A8] hover:bg-[#F0D090]',
    borderColor: 'border-[#C9A040]',
    shadowColor: 'shadow-[6px_6px_0px_0px_#C9A040]',
    descripcion: 'Números, geometría y operaciones',
  },
  {
    nombre: 'Cine',
    emoji: '🎬',
    color: 'bg-[#F4A8A8] hover:bg-[#E09090]',
    borderColor: 'border-[#C06060]',
    shadowColor: 'shadow-[6px_6px_0px_0px_#C06060]',
    descripcion: 'Películas, directores y premios',
  },
]

interface SeleccionTemaProps {
  onSeleccionar: (tema: Tema) => void
  cargando: boolean
}

export default function SeleccionTema({ onSeleccionar, cargando }: SeleccionTemaProps) {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <h2 className="
        font-['Press_Start_2P',_monospace] text-center
        text-lg text-[#2D2D2D] mb-8
      ">
        ELIGE UN TEMA
      </h2>

      <div className="grid grid-cols-2 gap-4 sm:gap-6">
        {TEMAS.map((tema) => (
          <button
            key={tema.nombre}
            onClick={() => !cargando && onSeleccionar(tema.nombre)}
            disabled={cargando}
            className={`
              ${tema.color} ${tema.borderColor} ${tema.shadowColor}
              border-4 p-5 sm:p-6
              flex flex-col items-center gap-3
              active:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]
              active:translate-x-[4px] active:translate-y-[4px]
              transition-all duration-75
              cursor-pointer
              ${cargando ? 'opacity-60 cursor-not-allowed' : ''}
            `}
          >
            <span className="text-5xl sm:text-6xl">{tema.emoji}</span>
            <span className="font-['Press_Start_2P',_monospace] text-xs sm:text-sm text-[#2D2D2D]">
              {tema.nombre}
            </span>
            <span className="font-['Courier_Prime',_monospace] text-xs text-center text-[#555] hidden sm:block">
              {tema.descripcion}
            </span>
          </button>
        ))}
      </div>

      {cargando && (
        <div className="text-center mt-6">
          <p className="font-['Courier_Prime',_monospace] text-sm text-[#555] animate-pulse">
            ⏳ Cargando pregunta...
          </p>
        </div>
      )}
    </div>
  )
}
