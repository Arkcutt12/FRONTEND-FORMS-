"use client"
import { CheckCircle, FileText, Mail, Phone, Clock, ArrowRight, AlertCircle, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ThankYouPageProps } from "@/lib/types"

export function ThankYouPage({ personalData, formData, onClose }: ThankYouPageProps) {
  const requestNumber = `DXF${Math.floor(100000 + Math.random() * 900000)}`
  const currentDate = new Date()

  const handleEmailSupport = () => {
    window.location.href = `mailto:info@arkcutt.com?subject=Consulta sobre solicitud ${requestNumber}&body=Hola,%0D%0A%0D%0ATengo una consulta sobre mi solicitud número ${requestNumber}.%0D%0A%0D%0AGracias.`
  }

  const handlePhoneSupport = () => {
    window.location.href = "tel:+34677649458"
  }

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm border-b border-[#E4E4E7]"></div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-[600px] mx-auto space-y-6">
          {/* Success Message */}
          <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <CardContent className="p-8">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h2 className="text-[24px] font-semibold text-green-900 mb-2">¡Solicitud Enviada Correctamente!</h2>
                  <p className="text-[14px] text-green-700">Solicitud #{requestNumber}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="border-blue-200 bg-blue-50/30">
            <CardHeader>
              <CardTitle className="text-[18px] text-blue-900 flex items-center gap-2">
                <Send className="h-5 w-5" />
                Próximos Pasos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-[14px] font-semibold text-blue-600">1</span>
                  </div>
                  <div>
                    <p className="text-[14px] font-medium text-[#18181B]">Generaremos tu presupuesto personalizado</p>
                    <p className="text-[13px] text-[#52525B]">
                      Nuestro equipo analizará tus archivos DXF y calculará el presupuesto exacto. Recibirás la
                      cotización en un <strong>máximo de 24 horas</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-[14px] font-semibold text-blue-600">2</span>
                  </div>
                  <div>
                    <p className="text-[14px] font-medium text-[#18181B]">Verificación de datos</p>
                    <p className="text-[13px] text-[#52525B]">
                      Si necesitamos algún dato adicional o aclaración sobre tu pedido, nos pondremos en contacto
                      contigo antes de enviar el presupuesto.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-[14px] font-semibold text-blue-600">3</span>
                  </div>
                  <div>
                    <p className="text-[14px] font-medium text-[#18181B]">Revisión de criterios de pedido</p>
                    <p className="text-[13px] text-[#52525B]">
                      Verificaremos que tu solicitud cumple con nuestros criterios de producción para garantizar la
                      mejor calidad en el resultado final.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-[14px] font-semibold text-blue-600">4</span>
                  </div>
                  <div>
                    <p className="text-[14px] font-medium text-[#18181B]">Recibirás el presupuesto por email</p>
                    <p className="text-[13px] text-[#52525B]">
                      Te enviaremos el presupuesto detallado a <strong>{personalData.email}</strong> con todos los
                      costos desglosados y las condiciones del servicio.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[13px] font-medium text-amber-900 mb-1">Importante</p>
                    <p className="text-[12px] text-amber-800">
                      Revisa tu bandeja de entrada y la carpeta de spam. Si no recibes nuestro presupuesto en 24 horas,
                      no dudes en contactarnos.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-[16px] font-medium text-[#18181B] mb-4">Tus Datos de Contacto</h3>
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

          {/* Contact Support */}
          <Card className="border-gray-200">
            <CardContent className="p-6">
              <div className="text-center space-y-3">
                <Clock className="h-8 w-8 text-blue-600 mx-auto" />
                <h3 className="text-[16px] font-medium text-[#18181B]">¿Tienes alguna pregunta?</h3>
                <p className="text-[13px] text-[#52525B]">
                  Nuestro equipo está disponible para ayudarte con cualquier duda sobre tu solicitud
                </p>
                <div className="flex justify-center gap-3 pt-2">
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
            Finalizar
          </Button>
        </div>
      </div>
    </div>
  )
}
