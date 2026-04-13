'use client'

import { ButtonHTMLAttributes, ReactNode } from 'react'

interface BotonRetroProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variante?: 'primario' | 'secundario' | 'peligro' | 'exito'
  tamaño?: 'sm' | 'md' | 'lg'
}

const variantes = {
  primario: 'bg-[#A8C8E8] border-[#6A9BC0] text-[#2D2D2D] hover:bg-[#8FB5D8]',
  secundario: 'bg-[#FFE5A8] border-[#C9A84C] text-[#2D2D2D] hover:bg-[#F0D090]',
  peligro: 'bg-[#F4A8A8] border-[#C97070] text-[#2D2D2D] hover:bg-[#E09090]',
  exito: 'bg-[#A8E6CF] border-[#6AB89A] text-[#2D2D2D] hover:bg-[#8ED4BA]',
}

const tamaños = {
  sm: 'px-3 py-2 text-xs',
  md: 'px-5 py-3 text-sm',
  lg: 'px-8 py-4 text-base',
}

export default function BotonRetro({
  children,
  variante = 'primario',
  tamaño = 'md',
  className = '',
  disabled,
  ...props
}: BotonRetroProps) {
  return (
    <button
      className={`
        font-['Courier_Prime',_monospace] font-bold
        border-4
        ${variantes[variante]}
        ${tamaños[tamaño]}
        shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]
        active:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]
        active:translate-x-[2px] active:translate-y-[2px]
        transition-all duration-75
        cursor-pointer
        uppercase tracking-wide
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
