'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'
import BotonRetro from '@/components/ui/BotonRetro'

interface ModalSalirProps {
  abierto: boolean
  onCerrar: () => void
  onGuardarYSalir?: () => Promise<void>
}

export default function ModalSalir({ abierto, onCerrar, onGuardarYSalir }: ModalSalirProps) {
  const [guardando, setGuardando] = useState(false)
  const router = useRouter()

  const handleSalir = async () => {
    setGuardando(true)
    try {
      if (onGuardarYSalir) {
        await onGuardarYSalir()
      }
      // Cerrar sesión sin dejar que NextAuth haga la redirección
      // (evita que proxy.ts intercepte antes de que la promesa resuelva)
      await signOut({ redirect: false })
      router.push('/login')
    } catch {
      setGuardando(false)
    }
  }

  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo="🚪 SALIR DEL JUEGO" anchura="sm">
      <div className="font-['Courier_Prime',_monospace] text-[#2D2D2D] space-y-5">
        <div className="text-center">
          <p className="text-base font-bold mb-2">¿Seguro que quieres salir?</p>
          <p className="text-sm text-gray-600">
            💾 Tu progreso ha sido guardado automáticamente.
          </p>
        </div>

        <div className="flex gap-3 justify-center flex-wrap">
          <BotonRetro
            variante="peligro"
            onClick={handleSalir}
            disabled={guardando}
          >
            {guardando ? '⏳ Guardando...' : '✅ Sí, salir'}
          </BotonRetro>
          <BotonRetro variante="secundario" onClick={onCerrar} disabled={guardando}>
            Cancelar
          </BotonRetro>
        </div>
      </div>
    </Modal>
  )
}
