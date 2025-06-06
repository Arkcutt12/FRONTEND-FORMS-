"use client"

import { CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

interface PaymentSuccessProps {
  total: number
  onClose: () => void
}

export function PaymentSuccess({ total, onClose }: PaymentSuccessProps) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-white">
      <div className="w-full max-w-[560px] flex flex-col items-center justify-center gap-6">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#F0FDF4] flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-[#22C55E]" />
          </div>

          <div className="flex flex-col items-center gap-2 text-center">
            <h2 className="text-[20px] font-semibold text-[#18181B]">¡Pago Completado!</h2>
            <p className="text-[14px] text-[#52525B]">
              Tu pedido ha sido procesado correctamente. Recibirás un correo electrónico con los detalles.
            </p>
          </div>
        </div>

        <div className="w-full bg-[#FAFAFA] p-4 rounded-lg space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[13px] text-[#52525B]">Número de Pedido</span>
            <span className="text-[13px] font-medium text-[#18181B]">
              #{Math.floor(100000 + Math.random() * 900000)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[13px] text-[#52525B]">Fecha</span>
            <span className="text-[13px] font-medium text-[#18181B]">{new Date().toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[13px] text-[#52525B]">Total</span>
            <span className="text-[13px] font-medium text-[#18181B]">{(total * 1.21).toFixed(2)}€</span>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="text-[14px] font-medium text-[#18181B]">Estado</span>
            <span className="text-[14px] font-medium text-[#22C55E]">Pagado</span>
          </div>
        </div>

        <div className="w-full">
          <Separator className="mb-4" />
          <div className="flex justify-center">
            <Button
              className="bg-[#27272A] text-[13px] font-medium text-[rgba(255,255,255,0.88)] hover:bg-[#18181B] px-8"
              onClick={onClose}
            >
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
