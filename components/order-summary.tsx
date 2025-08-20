"use client"

import { useState } from "react"
import { ArrowLeft, Info, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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

interface OrderSummaryProps {
  formData: FormData
  materials: Material[]
  onBack: () => void
  onSubmit: (personalData: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }) => void
}

export function OrderSummary({ formData, materials, onBack, onSubmit }: OrderSummaryProps) {
  const [personalData, setPersonalData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!personalData.firstName.trim()) {
      newErrors.firstName = "El nombre es obligatorio"
    }

    if (!personalData.lastName.trim()) {
      newErrors.lastName = "Los apellidos son obligatorios"
    }

    if (!personalData.email.trim()) {
      newErrors.email = "El email es obligatorio"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personalData.email)) {
      newErrors.email = "El email no es válido"
    }

    if (!personalData.phone.trim()) {
      newErrors.phone = "El teléfono es obligatorio"
    } else if (!/^[+]?[\d\s-()]{9,}$/.test(personalData.phone)) {
      newErrors.phone = "El teléfono no es válido"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(personalData)
    }
  }

  const getSelectedMaterial = () => {
    return materials.find((m) => m.id === formData.selectedMaterial)
  }

  const getSelectedColor = () => {
    const material = getSelectedMaterial()
    return material?.colors.find((c) => c.id === formData.selectedColor)
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
            <Button variant="ghost" size="icon" className="rounded-md" onClick={onBack}>
              <ArrowLeft className="h-[15px] w-[15px] text-[#52525B]" />
            </Button>
            <div className="bg-[#FAFAFA] px-1 py-0.5 rounded text-xs font-medium text-[#52525B] border border-[#E4E4E7]">
              volver
            </div>
          </div>
          <div className="text-[13px] font-medium text-[#52525B]">Resumen del Pedido</div>
          <Button variant="outline" className="rounded-xl px-3 h-10 text-[13px] font-medium bg-transparent">
            Arkcutt
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Order Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[#18181B]">Resumen de tu Solicitud</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Files */}
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-[#18181B]">Archivos</span>
                <Info className="h-4 w-4 text-[#71717A]" />
              </div>
              <div className="text-sm text-[#52525B]">
                {formData.files.length} archivo{formData.files.length !== 1 ? "s" : ""} subido
                {formData.files.length !== 1 ? "s" : ""}
              </div>
              <div className="space-y-1">
                {formData.files.map((file, index) => (
                  <div key={index} className="text-xs text-[#71717A]">
                    • {file.name}
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* City */}
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4 text-[#71717A]" />
                <span className="text-sm font-medium text-[#18181B]">Ciudad</span>
              </div>
              <div className="text-sm text-[#52525B]">{getCityName()}</div>
            </div>

            <Separator />

            {/* Material */}
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-[#18181B]">Material</span>
                <Info className="h-4 w-4 text-[#71717A]" />
              </div>
              {formData.materialProvider === "client" ? (
                <div className="space-y-1">
                  <div className="text-sm text-[#52525B]">Material proporcionado por el cliente</div>
                  <div className="text-xs text-[#71717A] space-y-1">
                    <div>• Tipo: {formData.clientMaterial?.materialType}</div>
                    <div>• Grosor: {formData.clientMaterial?.thickness}mm</div>
                    <div>
                      • Entrega: {formData.clientMaterial?.deliveryDate} a las {formData.clientMaterial?.deliveryTime}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="text-sm text-[#52525B]">Material proporcionado por Arkcutt</div>
                  <div className="text-xs text-[#71717A] space-y-1">
                    <div>• Material: {getSelectedMaterial()?.name}</div>
                    <div>
                      • Grosor: {formData.selectedThickness} {getSelectedMaterial()?.unit}
                    </div>
                    <div>• Color: {getSelectedColor()?.name}</div>
                  </div>
                </div>
              )}
            </div>

            {formData.isUrgent && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium text-[#18181B]">Reserva Urgente</span>
                    <Info className="h-4 w-4 text-[#71717A]" />
                  </div>
                  <div className="text-sm text-[#52525B]">
                    Fecha solicitada:{" "}
                    {formData.urgentDateTime ? new Date(formData.urgentDateTime).toLocaleString() : "No especificada"}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Personal Data Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[#18181B]">Datos Personales</CardTitle>
            <p className="text-sm text-[#52525B]">Necesitamos tus datos para procesar la solicitud</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm text-[#52525B]">
                  Nombre *
                </Label>
                <Input
                  id="firstName"
                  value={personalData.firstName}
                  onChange={(e) => setPersonalData((prev) => ({ ...prev, firstName: e.target.value }))}
                  className={errors.firstName ? "border-red-500" : ""}
                />
                {errors.firstName && <p className="text-xs text-red-500">{errors.firstName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm text-[#52525B]">
                  Apellidos *
                </Label>
                <Input
                  id="lastName"
                  value={personalData.lastName}
                  onChange={(e) => setPersonalData((prev) => ({ ...prev, lastName: e.target.value }))}
                  className={errors.lastName ? "border-red-500" : ""}
                />
                {errors.lastName && <p className="text-xs text-red-500">{errors.lastName}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-[#52525B]">
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={personalData.email}
                onChange={(e) => setPersonalData((prev) => ({ ...prev, email: e.target.value }))}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm text-[#52525B]">
                Teléfono *
              </Label>
              <Input
                id="phone"
                type="tel"
                value={personalData.phone}
                onChange={(e) => setPersonalData((prev) => ({ ...prev, phone: e.target.value }))}
                className={errors.phone ? "border-red-500" : ""}
              />
              {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 bg-white border-t border-[#E4E4E7] p-6">
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onBack} className="text-[13px] font-medium text-[#18181B] bg-transparent">
            Volver
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-[#27272A] text-[13px] font-medium text-[rgba(255,255,255,0.88)] hover:bg-[#18181B]"
          >
            Enviar Solicitud
          </Button>
        </div>
      </div>
    </div>
  )
}
