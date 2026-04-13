'use client'

import Modal from '@/components/ui/Modal'
import BotonRetro from '@/components/ui/BotonRetro'

interface ModalReglasProps {
  abierto: boolean
  onCerrar: () => void
}

export default function ModalReglas({ abierto, onCerrar }: ModalReglasProps) {
  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo="📋 CÓMO SE JUEGA" anchura="md">
      <div className="font-['Courier_Prime',_monospace] text-[#2D2D2D] space-y-4">
        <ol className="space-y-3 list-none">
          <li className="flex gap-3 items-start">
            <span className="text-xl shrink-0">1️⃣</span>
            <span className="text-sm leading-relaxed">
              Elige un tema: <strong>Historia, Geografía, Matemáticas o Cine.</strong>
            </span>
          </li>
          <li className="flex gap-3 items-start">
            <span className="text-xl shrink-0">2️⃣</span>
            <span className="text-sm leading-relaxed">
              Responde la pregunta seleccionando una de las <strong>4 opciones</strong>.
            </span>
          </li>
          <li className="flex gap-3 items-start">
            <span className="text-xl shrink-0">✅</span>
            <span className="text-sm leading-relaxed">
              <strong>Respuesta correcta</strong> → <span className="text-green-700 font-bold">+2 puntos</span>.
              Sigues con el mismo tema.
            </span>
          </li>
          <li className="flex gap-3 items-start">
            <span className="text-xl shrink-0">❌</span>
            <span className="text-sm leading-relaxed">
              <strong>Respuesta incorrecta</strong> → <span className="text-red-700 font-bold">-1 punto</span>.
              Vuelves a elegir tema.
            </span>
          </li>
          <li className="flex gap-3 items-start">
            <span className="text-xl shrink-0">🏆</span>
            <span className="text-sm leading-relaxed">
              ¡Acumula la <strong>mayor cantidad de puntos</strong> posible!
            </span>
          </li>
        </ol>

        <div className="border-t-2 border-dashed border-[#2D2D2D] pt-3">
          <p className="text-xs text-center text-gray-600 italic">
            💾 Tu puntuación se guarda automáticamente.
          </p>
        </div>

        <div className="flex justify-center pt-2">
          <BotonRetro variante="primario" onClick={onCerrar}>
            ¡Entendido!
          </BotonRetro>
        </div>
      </div>
    </Modal>
  )
}
