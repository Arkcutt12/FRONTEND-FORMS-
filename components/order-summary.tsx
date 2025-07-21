"use client"

import type React from "react"

import { useState } from "react"
import { ArrowLeft, FileIcon, User, Mail, Phone, MapPin, Package, Clock, Zap, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

interface Material {
  id: string
  name: string
  description: string
  thicknessOptions: number[]
  unit: string
  colors: { id: string; name: string; color: string }[]
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

interface PersonalData {
  firstName: string
  lastName: string
  email: string
  phone: string
}

interface OrderSummaryProps {
  formData: FormData
  materials: Material[]
  onBack: () => void
  onSubmit: (personalData: PersonalData) => void
}

export function OrderSummary({ formData, materials, onBack, onSubmit }: OrderSummaryProps) {
  const [personalData, setPersonalData] = useState<PersonalData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const cities = [
    { id: "madrid", name: "Madrid" },
    { id: "barcelona", name: "Barcelona" },
    { id: "malaga", name: "Málaga" },
    { id: "home", name: "A domicilio" },
  ]

  const getSelectedCity = () => {
    return cities.find((city) => city.id === formData.city)?.name || formData.city
  }

  const getSelectedMaterial = () => {
    return materials.find((m) => m.id === formData.selectedMaterial)
  }

  const getSelectedColor = () => {
    const material = getSelectedMaterial()
    return material?.colors.find((c) => c.id === formData.selectedColor)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B"
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    else return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  const getFileNameWithoutExtension = (fileName: string) => {
    const lastDotIndex = fileName.lastIndexOf(".")
    if (lastDotIndex === -1) return fileName
    return fileName.substring(0, lastDotIndex)
  }

  const getFileExtension = (fileName: string) => {
    const lastDotIndex = fileName.lastIndexOf(".")
    if (lastDotIndex === -1) return ""
    return fileName.substring(lastDotIndex)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form before submitting
    if (!isFormValid()) {
      return
    }

    setIsSubmitting(true)

    // Simulate submission delay
    setTimeout(() => {
      setIsSubmitting(false)
      onSubmit(personalData)
    }, 2000)
  }

  const isFormValid = () => {
    return (
      personalData.firstName.trim() !== "" &&
      personalData.lastName.trim() !== "" &&
      personalData.email.trim() !== "" &&
      personalData.phone.trim() !== ""
    )
  }

  return (
    <div className="w-full bg-white flex flex-col h-full">
      <div className="bg-white border-b border-[#E4E4E7] flex-shrink-0">
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
          <div className="text-[13px] font-medium text-[#52525B]">Resumen de Solicitud</div>
          <div className="w-[60px]"></div> {/* Spacer for alignment */}
        </div>
        <Separator />
      </div>

      {/* Make this section scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-[560px] mx-auto">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Resumen de Archivos */}
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <span className="text-[16px] text-[#18181B]">Archivos a Procesar</span>
                  <Badge variant="secondary" className="text-[11px] h-5">
                    {formData.files.length}
                  </Badge>
                </div>
                <p className="text-[13px] text-[#52525B]">Archivos DXF seleccionados para el corte láser.</p>
              </div>

              <div className="space-y-2">
                {formData.files.map((file, index) => (
                  <div
                    key={index}
                    className="px-3 py-2 bg-[#FAFAFA] shadow-sm rounded-lg flex justify-between items-center"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-6 h-8 bg-white shadow-[0px_0px_0px_1px_rgba(0,0,0,0.08)] rounded flex items-center justify-center">
                        <FileIcon className="w-4 h-4 text-[#52525B]" />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center">
                          <span className="text-[13px] font-medium text-[#18181B]">
                            {getFileNameWithoutExtension(file.name)}
                          </span>
                          <span className="text-[13px] text-[#52525B]">{getFileExtension(file.name)}</span>
                        </div>
                        <span className="text-[11px] text-[#71717A]">{formatFileSize(file.size)}</span>
                      </div>
                    </div>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                ))}
              </div>
            </div>

            {/* Resumen de Configuración */}
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[16px] text-[#18181B]">Configuración del Servicio</span>
                <p className="text-[13px] text-[#52525B]">Detalles de tu solicitud de corte láser.</p>
              </div>

              <div className="bg-[#FAFAFA] p-4 rounded-lg space-y-3">
                {/* Ciudad */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#52525B]" />
                    <span className="text-[13px] text-[#52525B]">Ciudad</span>
                  </div>
                  <span className="text-[13px] font-medium text-[#18181B]">{getSelectedCity()}</span>
                </div>

                <Separator />

                {/* Material Provider */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-[#52525B]" />
                    <span className="text-[13px] text-[#52525B]">Proveedor de Material</span>
                  </div>
                  <span className="text-[13px] font-medium text-[#18181B]">
                    {formData.materialProvider === "client" ? "Cliente" : "Arkcutt"}
                  </span>
                </div>

                {/* Material Details */}
                {formData.materialProvider === "client" && formData.clientMaterial && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-[13px] text-[#52525B]">Tipo de Material:</span>
                        <span className="text-[13px] font-medium text-[#18181B]">
                          {formData.clientMaterial.materialType}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[13px] text-[#52525B]">Grosor:</span>
                        <span className="text-[13px] font-medium text-[#18181B]">
                          {formData.clientMaterial.thickness} mm
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[13px] text-[#52525B]">Entrega:</span>
                        <span className="text-[13px] font-medium text-[#18181B]">
                          {formData.clientMaterial.deliveryDate} a las {formData.clientMaterial.deliveryTime}
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {formData.materialProvider === "arkcutt" && formData.selectedMaterial && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-[13px] text-[#52525B]">Material:</span>
                        <span className="text-[13px] font-medium text-[#18181B]">{getSelectedMaterial()?.name}</span>
                      </div>
                      {formData.selectedThickness && (
                        <div className="flex justify-between">
                          <span className="text-[13px] text-[#52525B]">Grosor:</span>
                          <span className="text-[13px] font-medium text-[#18181B]">
                            {formData.selectedThickness} {getSelectedMaterial()?.unit}
                          </span>
                        </div>
                      )}
                      {formData.selectedColor && (
                        <div className="flex justify-between items-center">
                          <span className="text-[13px] text-[#52525B]">Color:</span>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded-full border border-[#E4E4E7]"
                              style={{ backgroundColor: getSelectedColor()?.color }}
                            />
                            <span className="text-[13px] font-medium text-[#18181B]">{getSelectedColor()?.name}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Urgency */}
                {formData.isUrgent && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-orange-500" />
                        <span className="text-[13px] text-[#52525B]">Reserva Urgente</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="text-[11px] h-5 bg-orange-50 text-orange-700 border-orange-200"
                        >
                          URGENTE
                        </Badge>
                        {formData.urgentDateTime && (
                          <span className="text-[13px] font-medium text-[#18181B]">
                            {new Date(formData.urgentDateTime).toLocaleString("es-ES", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Datos Personales */}
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <span className="text-[16px] text-[#18181B]">Datos de Contacto</span>
                  <User className="h-[15px] w-[15px] text-[#71717A]" />
                </div>
                <p className="text-[13px] text-[#52525B]">
                  Necesitamos tus datos para contactarte con el presupuesto y coordinar el servicio.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-[13px] text-[#52525B]">
                      Nombre *
                    </Label>
                    <div className="relative">
                      <Input
                        id="firstName"
                        value={personalData.firstName}
                        onChange={(e) => setPersonalData((prev) => ({ ...prev, firstName: e.target.value }))}
                        placeholder="Tu nombre"
                        className="pl-10"
                        required
                      />
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#71717A]" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-[13px] text-[#52525B]">
                      Apellidos *
                    </Label>
                    <Input
                      id="lastName"
                      value={personalData.lastName}
                      onChange={(e) => setPersonalData((prev) => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Tus apellidos"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[13px] text-[#52525B]">
                    Correo Electrónico *
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      value={personalData.email}
                      onChange={(e) => setPersonalData((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="tu@email.com"
                      className="pl-10"
                      required
                    />
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#71717A]" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-[13px] text-[#52525B]">
                    Teléfono *
                  </Label>
                  <div className="relative">
                    <Input
                      id="phone"
                      type="tel"
                      value={personalData.phone}
                      onChange={(e) => setPersonalData((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="+34 600 000 000"
                      className="pl-10"
                      required
                    />
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#71717A]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Información Adicional */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="text-[13px] font-medium text-blue-900 mb-1">¿Qué sigue?</h4>
                  <div className="text-[12px] text-blue-800 space-y-1">
                    <p>• Analizaremos tus archivos DXF en detalle</p>
                    <p>• Te enviaremos un presupuesto personalizado en 24-48h</p>
                    <p>• Coordinaremos la entrega/recogida según tu ubicación</p>
                    {formData.isUrgent && <p>• Priorizaremos tu solicitud urgente</p>}
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Footer - Fixed at bottom */}
      <div className="flex-shrink-0 bg-white border-t border-[#E4E4E7] p-6">
        <div className="max-w-[560px] mx-auto">
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              className="text-[13px] font-medium text-[#18181B] bg-transparent"
              onClick={onBack}
            >
              Volver
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-[#27272A] text-[13px] font-medium text-[rgba(255,255,255,0.88)] hover:bg-[#18181B]"
              disabled={!isFormValid() || isSubmitting}
            >
              {isSubmitting ? "Enviando..." : "Enviar Solicitud"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
