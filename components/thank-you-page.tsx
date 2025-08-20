"use client"

import {
  CheckCircle,
  FileText,
  Mail,
  Phone,
  MapPin,
  Package,
  Clock,
  ArrowRight,
  Download,
  Share2,
  ArrowLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

interface PersonalData {
  firstName: string
  lastName: string
  email: string
  phone: string
}

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

interface ThankYouPageProps {
  personalData: PersonalData
  formData: FormData
  onClose: () => void
}

export function ThankYouPage({ personalData, formData, onClose }: ThankYouPageProps) {
  const requestNumber = `DXF${Math.floor(100000 + Math.random() * 900000)}`
  const currentDate = new Date()

  const cities = [
    { id: "madrid", name: "Madrid" },
    { id: "barcelona", name: "Barcelona" },
    { id: "malaga", name: "Málaga" },
    { id: "home", name: "A domicilio" },
  ]

  const getSelectedCity = () => {
    return cities.find((city) => city.id === formData.city)?.name || formData.city
  }

  const handleDownloadSummary = () => {
    const summaryData = {
      requestNumber,
      date: currentDate.toLocaleDateString(),
      personalData,
      formData: {
        ...formData,
        files: formData.files.map((f) => ({ name: f.name, size: f.size })),
      },
    }

    const dataStr = JSON.stringify(summaryData, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })

    const link = document.createElement("a")
    link.href = URL.createObjectURL(dataBlob)
    link.download = `solicitud-${requestNumber}.json`
    link.click()
  }

  const handleShare = async () => {
    const shareData = {
      title: "Solicitud de Corte Láser - Arkcutt",
      text: `Mi solicitud #${requestNumber} ha sido enviada correctamente. ¡Pronto recibiré el presupuesto!`,
      url: window.location.href,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        console.log("Error sharing:", err)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${shareData.text} - ${shareData.url}`)
      alert("Información copiada al portapapeles")
    }
  }

  const handleEmailSupport = () => {
    window.location.href = `mailto:info@arkcutt.com?subject=Consulta sobre solicitud ${requestNumber}&body=Hola,%0D%0A%0D%0ATengo una consulta sobre mi solicitud número ${requestNumber}.%0D%0A%0D%0AGracias.`
  }

  const handlePhoneSupport = () => {
    window.location.href = "tel:+34677649458"
  }

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm border-b border-[#E4E4E7]">
        <div className="flex justify-between items-center px-6 py-4">
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
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h1 className="text-[16px] font-semibold text-[#18181B]">¡Solicitud Enviada!</h1>
              <p className="text-[12px] text-[#52525B]">#{requestNumber}</p>
            </div>
          </div>
          <Badge className="bg-green-100 text-green-800 border-green-200">Confirmado</Badge>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-[600px] mx-auto space-y-6">
          {/* Success Message */}
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-[18px] font-semibold text-green-900 mb-2">¡Gracias por confiar en Arkcutt!</h2>
                  <p className="text-[14px] text-green-800 mb-3">
                    Hemos recibido tu solicitud de corte láser correctamente. Nuestro equipo la revisará y te
                    contactaremos pronto.
                  </p>
                  <div className="flex items-center gap-2 text-[13px] text-green-700">
                    <Clock className="h-4 w-4" />
                    <span>Tiempo estimado de respuesta: 24-48 horas</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Request Details */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[16px] font-medium text-[#18181B]">Detalles de la Solicitud</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleDownloadSummary}>
                    <Download className="h-4 w-4 mr-2" />
                    Descargar
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleShare}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Compartir
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[12px] text-[#71717A]">Número de Solicitud</p>
                    <p className="text-[14px] font-medium text-[#18181B]">#{requestNumber}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[12px] text-[#71717A]">Fecha</p>
                    <p className="text-[14px] font-medium text-[#18181B]">
                      {currentDate.toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-[#52525B]" />
                      <span className="text-[13px] text-[#52525B]">Archivos DXF</span>
                    </div>
                    <Badge variant="secondary">{formData.files.length}</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[#52525B]" />
                      <span className="text-[13px] text-[#52525B]">Ciudad</span>
                    </div>
                    <span className="text-[13px] font-medium text-[#18181B]">{getSelectedCity()}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-[#52525B]" />
                      <span className="text-[13px] text-[#52525B]">Material</span>
                    </div>
                    <span className="text-[13px] font-medium text-[#18181B]">
                      {formData.materialProvider === "client" ? "Cliente" : "Arkcutt"}
                    </span>
                  </div>

                  {formData.isUrgent && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-orange-500" />
                        <span className="text-[13px] text-[#52525B]">Urgente</span>
                      </div>
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                        PRIORITARIO
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-[16px] font-medium text-[#18181B] mb-4">Datos de Contacto</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-[14px] font-medium text-[#18181B]">
                      {personalData.firstName} {personalData.lastName}
                    </p>
                    <p className="text-[12px] text-[#71717A]">Nombre completo</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <Mail className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-[14px] font-medium text-[#18181B]">{personalData.email}</p>
                    <p className="text-[12px] text-[#71717A]">Correo electrónico</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <Phone className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-[14px] font-medium text-[#18181B]">{personalData.phone}</p>
                    <p className="text-[12px] text-[#71717A]">Teléfono</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="p-6">
              <h3 className="text-[16px] font-medium text-blue-900 mb-4">Próximos Pasos</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[12px] font-medium mt-0.5">
                    1
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-blue-900">Confirmación por email</p>
                    <p className="text-[12px] text-blue-700">
                      Recibirás un email de confirmación en los próximos minutos
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[12px] font-medium mt-0.5">
                    2
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-blue-900">Análisis de archivos</p>
                    <p className="text-[12px] text-blue-700">Nuestro equipo analizará tus archivos DXF en detalle</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[12px] font-medium mt-0.5">
                    3
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-blue-900">Presupuesto personalizado</p>
                    <p className="text-[12px] text-blue-700">Te enviaremos un presupuesto detallado en 24-48 horas</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[12px] font-medium mt-0.5">
                    4
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-blue-900">Coordinación del servicio</p>
                    <p className="text-[12px] text-blue-700">Te contactaremos para coordinar la entrega/recogida</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Support */}
          <Card className="border-gray-200">
            <CardContent className="p-6">
              <div className="text-center space-y-3">
                <h3 className="text-[16px] font-medium text-[#18181B]">¿Necesitas ayuda?</h3>
                <p className="text-[13px] text-[#52525B]">
                  Si tienes alguna pregunta sobre tu solicitud, no dudes en contactarnos
                </p>
                <div className="flex justify-center gap-3">
                  <Button variant="outline" size="sm" onClick={handleEmailSupport}>
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </Button>
                  <Button variant="outline" size="sm" onClick={handlePhoneSupport}>
                    <Phone className="h-4 w-4 mr-2" />
                    Teléfono
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm border-t border-[#E4E4E7] p-6">
        <div className="max-w-[600px] mx-auto flex justify-between items-center">
          <div className="text-[12px] text-[#71717A]">
            Solicitud #{requestNumber} • {currentDate.toLocaleDateString()}
          </div>
          <Button onClick={onClose} className="bg-[#27272A] hover:bg-[#18181B]">
            <ArrowRight className="h-4 w-4 mr-2" />
            Continuar
          </Button>
        </div>
      </div>
    </div>
  )
}
