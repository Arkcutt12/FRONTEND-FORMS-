"use client"

import { CheckCircle, FileText, Mail, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

interface PersonalData {
  firstName: string
  lastName: string
  email: string
  phone: string
}

interface RequestSuccessProps {
  personalData: PersonalData
  fileCount: number
  onClose: () => void
}

export function RequestSuccess({ personalData, fileCount, onClose }: RequestSuccessProps) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-white">
      <div className="w-full max-w-[560px] flex flex-col items-center justify-center gap-6">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#F0FDF4] flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-[#22C55E]" />
          </div>

          <div className="flex flex-col items-center gap-2 text-center">
            <h2 className="text-[20px] font-semibold text-[#18181B]">¡Solicitud Enviada!</h2>
            <p className="text-[14px] text-[#52525B]">
              Hemos recibido tu solicitud de corte láser. Te contactaremos pronto con el presupuesto.
            </p>
          </div>
        </div>

        <div className="w-full bg-[#FAFAFA] p-4 rounded-lg space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[13px] text-[#52525B]">Número de Solicitud</span>
            <span className="text-[13px] font-medium text-[#18181B]">
              #DXF{Math.floor(100000 + Math.random() * 900000)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[13px] text-[#52525B]">Fecha</span>
            <span className="text-[13px] font-medium text-[#18181B]">{new Date().toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[13px] text-[#52525B]">Archivos</span>
            <span className="text-[13px] font-medium text-[#18181B]">{fileCount} archivo(s) DXF</span>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="text-[14px] font-medium text-[#18181B]">Estado</span>
            <span className="text-[14px] font-medium text-[#22C55E]">En Revisión</span>
          </div>
        </div>

        <div className="w-full bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-[13px] font-medium text-blue-900 mb-2">Datos de Contacto Registrados</h4>
              <div className="space-y-1 text-[12px] text-blue-800">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Nombre:</span>
                  <span>
                    {personalData.firstName} {personalData.lastName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3" />
                  <span>{personalData.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3" />
                  <span>{personalData.phone}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-center space-y-2">
            <h4 className="text-[13px] font-medium text-green-900">Próximos Pasos</h4>
            <div className="text-[12px] text-green-800 space-y-1">
              <p>📧 Recibirás un email de confirmación en los próximos minutos</p>
              <p>🔍 Nuestro equipo analizará tus archivos DXF</p>
              <p>💰 Te enviaremos un presupuesto detallado en 24-48 horas</p>
              <p>📞 Te contactaremos para coordinar el servicio</p>
            </div>
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
