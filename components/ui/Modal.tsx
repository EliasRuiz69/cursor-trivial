'use client'

import { ReactNode, useEffect } from 'react'

interface ModalProps {
  abierto: boolean
  onCerrar: () => void
  titulo: string
  children: ReactNode
  anchura?: 'sm' | 'md' | 'lg'
}

export default function Modal({
  abierto,
  onCerrar,
  titulo,
  children,
  anchura = 'md',
}: ModalProps) {
  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && abierto) onCerrar()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [abierto, onCerrar])

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    if (abierto) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [abierto])

  if (!abierto) return null

  const maxWidths = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCerrar()
      }}
    >
      {/* Fondo oscuro */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Contenido del modal */}
      <div
        className={`
          relative w-full ${maxWidths[anchura]}
          bg-[#FDFAF0] border-4 border-[#2D2D2D]
          shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)]
          animate-[slideDown_0.2s_ease-out]
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b-4 border-[#2D2D2D] bg-[#A8C8E8]">
          <h2 className="font-['Press_Start_2P',_monospace] text-sm text-[#2D2D2D]">
            {titulo}
          </h2>
          <button
            onClick={onCerrar}
            className="
              w-8 h-8 flex items-center justify-center
              border-2 border-[#2D2D2D] bg-[#F4A8A8]
              font-bold text-[#2D2D2D] text-sm
              shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]
              active:shadow-none active:translate-x-[2px] active:translate-y-[2px]
              transition-all duration-75 cursor-pointer
              hover:bg-[#E09090]
            "
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
