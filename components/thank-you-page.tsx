"use client"

import { useState } from "react"
import { ArrowLeft, Download, Share2, Mail, Phone, CheckCircle, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

interface FormData {
  files: File[]
  city: string
  materialProvider: "client" | "arkcutt"
  clientMaterial?: {
    deliveryDate: string
    deliveryTime: string
    materialType: string
    thickness: number
  }
  selectedMaterial?: string
  selectedThickness?: number
  selectedColor?: string
  isUrgent: boolean
  urgentDateTime?: string
}

interface PersonalData {
  firstName: string
  lastName: string
  email: string
  phone: string
}

interface ThankYouPageProps {
  personalData: PersonalData
  formData: FormData
  onClose: () => void
}

export function ThankYouPage({ personalData, formData, onClose }: ThankYouPageProps) {
  const [copied, setCopied] = useState(false)

  // Generate a unique request number
  const requestNumber = `ARK-${Date.now().toString().slice(-6)}`

  const handleDownloadSummary = () => {
    const summary = {
      requestNumber,
      personalData,
      formData: {
        ...formData,
        files: formData.files.map((f) => ({ name: f.name, size: f.size, type: f.type })),
      },
      timestamp: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(summary, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `arkcutt-request-${requestNumber}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleShare = async () => {
    const shareText = `Mi solicitud de corte láser en Arkcutt - Número: ${requestNumber}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Solicitud Arkcutt",
          text: shareText,
        })
      } catch (error) {
        // Fallback to clipboard
        copyToClipboard(shareText)
      }
    } else {
      copyToClipboard(shareText)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy to clipboard:", error)
    }
  }

  const getCityName = () => {
    const cities = [
      { id: "madrid", name: "Madrid" },
      { id: "barcelona", name: "Barcelona" },
      { id: "malaga", name: "Málaga" },
      { id: "home", name: "A domicilio" },
    ]
    return cities.find((c) => c.id === formData.city)?.name || formData.city
  }

  return (
    <div className="w-full h-full bg-white flex flex-col">
      {/* Header */}
      <div className="bg-white flex-shrink-0 border-b border-[#E4E4E7]">
        <div className="flex justify-between items-center px-4 py-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-md"
              onClick={() => (window.location.href = "https://www.arkcutt.com/")}
            >
              <ArrowLeft className="h-[15px] w-[15px] text-[#52525B]" />
            </Button>
            <div className="bg-[#FAFAFA] px-1 py-0.5 rounded text-xs font-medium text-[#52525B] border border-[#E4E4E7]">
              volver
            </div>
          </div>
          <div className="text-[13px] font-medium text-[#52525B]">Solicitud Enviada</div>
          <Button variant="outline" className="rounded-xl px-3 h-10 text-[13px] font-medium bg-transparent">
            Arkcutt
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Success Message */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#18181B] mb-2">¡Solicitud Enviada Correctamente!</h1>
            <p className="text-[#52525B]">
              Hemos recibido tu solicitud de corte láser. Te contactaremos pronto con el presupuesto y los próximos
              pasos.
            </p>
          </div>
        </div>

        {/* Request Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[#18181B]">Detalles de tu Solicitud</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-[#18181B]">Número de Solicitud:</span>
                <p className="text-sm text-[#52525B] font-mono">{requestNumber}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-[#18181B]">Fecha:</span>
                <p className="text-sm text-[#52525B]">{new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <span className="text-sm font-medium text-[#18181B]">Datos de Contacto:</span>
              <div className="text-sm text-[#52525B] space-y-1">
                <p>
                  {personalData.firstName} {personalData.lastName}
                </p>
                <p>{personalData.email}</p>
                <p>{personalData.phone}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <span className="text-sm font-medium text-[#18181B]">Resumen del Pedido:</span>
              <div className="text-sm text-[#52525B] space-y-1">
                <p>
                  • {formData.files.length} archivo{formData.files.length !== 1 ? "s" : ""}
                </p>
                <p>• Ciudad: {getCityName()}</p>
                <p>
                  • Material:{" "}
                  {formData.materialProvider === "client" ? "Proporcionado por cliente" : "Proporcionado por Arkcutt"}
                </p>
                {formData.isUrgent && <p>• Solicitud urgente</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[#18181B]">Próximos Pasos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium flex-shrink-0">
                1
              </div>
              <div>
                <p className="text-sm font-medium text-[#18181B]">Revisión de archivos</p>
                <p className="text-sm text-[#52525B]">Nuestro equipo revisará tus archivos DXF/DWG</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium flex-shrink-0">
                2
              </div>
              <div>
                <p className="text-sm font-medium text-[#18181B]">Presupuesto personalizado</p>
                <p className="text-sm text-[#52525B]">Te enviaremos un presupuesto detallado en 24-48 horas</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium flex-shrink-0">
                3
              </div>
              <div>
                <p className="text-sm font-medium text-[#18181B]">Confirmación y producción</p>
                <p className="text-sm text-[#52525B]">Una vez aprobado, comenzaremos con el corte láser</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Support Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[#18181B]">¿Necesitas Ayuda?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-[#52525B]">
              Si tienes alguna pregunta sobre tu solicitud, no dudes en contactarnos:
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  window.open(`mailto:soporte@arkcutt.com?subject=Consulta sobre solicitud ${requestNumber}`)
                }
                className="flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                Email Soporte
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open("tel:+34900000000")}
                className="flex items-center gap-2"
              >
                <Phone className="h-4 w-4" />
                Llamar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={handleDownloadSummary} className="flex items-center gap-2 bg-transparent">
            <Download className="h-4 w-4" />
            Descargar Resumen
          </Button>
          <Button variant="outline" onClick={handleShare} className="flex items-center gap-2 bg-transparent">
            {copied ? <Copy className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
            {copied ? "Copiado!" : "Compartir"}
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 bg-white border-t border-[#E4E4E7] p-6">
        <div className="flex justify-center">
          <Button
            onClick={() => (window.location.href = "https://www.arkcutt.com/")}
            className="bg-[#27272A] text-[13px] font-medium text-[rgba(255,255,255,0.88)] hover:bg-[#18181B]"
          >
            Volver a Arkcutt
          </Button>
        </div>
      </div>
    </div>
  )
}
