"use client"

import { useState, useRef } from "react"
import { X, Info, AlertCircle, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { FileUpload } from "@/components/file-upload"
import { DXFViewer } from "@/components/dxf-viewer"
import { Switch } from "@/components/ui/switch"
import { FullscreenViewer } from "@/components/fullscreen-viewer"
import { EmptyFilesState } from "@/components/empty-files-state"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"

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

export default function MaterialSelectionPage() {
  const [formData, setFormData] = useState<FormData>({
    files: [],
    city: "",
    materialProvider: "arkcutt",
    isUrgent: false,
  })
  const [previewFile, setPreviewFile] = useState<File | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<number | null>(null)
  const [thicknessError, setThicknessError] = useState("")
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const cities = [
    { id: "madrid", name: "Madrid" },
    { id: "barcelona", name: "Barcelona" },
    { id: "malaga", name: "Málaga" },
    { id: "home", name: "A domicilio" },
  ]

  const materials: Material[] = [
    {
      id: "acrylic",
      name: "Metacrilato",
      description: "Material transparente y resistente, ideal para proyectos que requieren claridad visual.",
      thicknessOptions: [3, 5, 8],
      unit: "mm",
      colors: [
        { id: "transparent", name: "Transparente", color: "rgba(255, 255, 255, 0.1)" },
        { id: "red", name: "Rojo", color: "#DC2626" },
        { id: "white", name: "Blanco", color: "#FFFFFF" },
        { id: "black", name: "Negro", color: "#000000" },
      ],
    },
    {
      id: "balsa",
      name: "Madera Balsa",
      description: "Madera ligera y fácil de trabajar, perfecta para maquetas y prototipos.",
      thicknessOptions: [1, 3, 5],
      unit: "mm",
      colors: [{ id: "wood", name: "Color madera", color: "#D2B48C" }],
    },
    {
      id: "plywood",
      name: "Contrachapado",
      description: "Madera laminada resistente, ideal para proyectos estructurales.",
      thicknessOptions: [4, 5, 8],
      unit: "mm",
      colors: [
        { id: "light-wood", name: "Madera clara", color: "#F5DEB3" },
        { id: "dark-wood", name: "Madera oscura", color: "#8B4513" },
      ],
    },
    {
      id: "dm",
      name: "DM",
      description: "Tablero de densidad media, superficie lisa ideal para acabados.",
      thicknessOptions: [2.5, 5, 8],
      unit: "mm",
      colors: [{ id: "wood", name: "Color madera", color: "#D2B48C" }],
    },
    {
      id: "cardboard",
      name: "Cartón Gris",
      description: "Material económico y versátil para prototipos y maquetas.",
      thicknessOptions: [2, 3, 5],
      unit: "mm",
      colors: [{ id: "grey", name: "Gris", color: "#9CA3AF" }],
    },
  ]

  const timeSlots = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"]

  const handlePreviewFile = (file: File) => {
    setPreviewFile(file)
  }

  const closePreview = () => {
    setPreviewFile(null)
  }

  const handleThicknessChange = (value: string) => {
    const thickness = Number.parseFloat(value)
    if (thickness > 10) {
      setThicknessError("El grosor no puede superar los 10mm")
      return
    }
    setThicknessError("")
    setFormData((prev) => ({
      ...prev,
      clientMaterial: {
        ...prev.clientMaterial!,
        thickness,
      },
    }))
  }

  const getSelectedMaterial = () => {
    return materials.find((m) => m.id === formData.selectedMaterial)
  }

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleSubmit = () => {
    // Here you would send the formData to your tracking system
    console.log("Form Data:", formData)
    alert("Formulario enviado correctamente. Te contactaremos pronto con el presupuesto.")
  }

  const isFormValid = () => {
    if (formData.files.length === 0) return false
    if (!formData.city) return false
    if (!formData.materialProvider) return false

    if (formData.materialProvider === "client") {
      if (
        !formData.clientMaterial?.deliveryDate ||
        !formData.clientMaterial?.deliveryTime ||
        !formData.clientMaterial?.materialType ||
        !formData.clientMaterial?.thickness
      ) {
        return false
      }
    } else {
      if (!formData.selectedMaterial || !formData.selectedThickness || !formData.selectedColor) return false
    }

    if (formData.isUrgent && !formData.urgentDateTime) return false

    return true
  }

  const toggleFullscreen = (imageIndex?: number) => {
    setSelectedImage(imageIndex !== undefined ? imageIndex : 0)
    setIsFullscreen(!isFullscreen)
  }

  const getImageSrc = (index: number) => {
    const imageType = index % 4
    if (imageType === 0) return "/images/robe-front.png"
    if (imageType === 1) return "/images/robe-back.png"
    if (imageType === 2) return "/images/robe-detail-1.jpeg"
    return "/images/robe-detail-2.jpeg"
  }

  return (
    <>
      <div className="w-full h-screen bg-white flex flex-col">
        <div className="w-full bg-[#FAFAFA] shadow-lg overflow-hidden flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-white flex-shrink-0">
            <div className="flex justify-between items-center px-4 py-3">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="rounded-md">
                  <X className="h-[15px] w-[15px] text-[#52525B]" />
                </Button>
                <div className="bg-[#FAFAFA] px-1 py-0.5 rounded text-xs font-medium text-[#52525B] border border-[#E4E4E7]">
                  esc
                </div>
              </div>
              <div className="text-[13px] font-medium text-[#52525B]">Servicio Corte Láser</div>
              <Button variant="outline" className="rounded-xl px-3 h-10 text-[13px] font-medium">
                Arkcutt
              </Button>
            </div>
            <Separator />
          </div>

          <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
            {/* Gallery Section or DXF Viewer - Fixed height */}
            <div className="flex-1 bg-[#FAFAFA] relative overflow-hidden">
              {previewFile ? (
                <DXFViewer file={previewFile} onClose={closePreview} />
              ) : (
                <EmptyFilesState onUploadClick={handleUploadClick} />
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setFormData((prev) => ({
                      ...prev,
                      files: [...prev.files, ...Array.from(e.target.files)],
                    }))
                  }
                }}
                accept=".dxf,.dwg"
                multiple
                className="hidden"
              />
            </div>

            <Separator orientation="vertical" className="hidden md:block" />

            {/* Form Section - Scrollable */}
            <div className="w-full md:w-[560px] bg-white flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-8">
                  {/* File Upload Section */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <span className="text-[16px] text-[#18181B]">Archivos</span>
                        <Info className="h-[15px] w-[15px] text-[#71717A]" />
                      </div>
                      <p className="text-[13px] text-[#52525B]">Tamaño máximo: 50MB. Formatos soportados: .dxf, .dwg</p>
                    </div>

                    <FileUpload
                      files={formData.files}
                      setFiles={(files) => setFormData((prev) => ({ ...prev, files }))}
                      onPreviewFile={handlePreviewFile}
                      maxFiles={5}
                      maxSize={50 * 1024 * 1024}
                      filePrice={0} // No price calculation
                    />
                  </div>

                  {/* City Selection */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <span className="text-[16px] text-[#18181B]">Ciudad</span>
                        <Info className="h-[15px] w-[15px] text-[#71717A]" />
                      </div>
                      <p className="text-[13px] text-[#52525B]">Selecciona dónde quieres realizar el corte.</p>
                    </div>

                    <RadioGroup
                      value={formData.city}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, city: value }))}
                    >
                      <div className="grid grid-cols-2 gap-3">
                        {cities.map((city) => (
                          <div
                            key={city.id}
                            className="flex items-center gap-2 p-3 border border-[#E4E4E7]/50 shadow-sm rounded-lg"
                          >
                            <RadioGroupItem value={city.id} id={city.id} />
                            <Label htmlFor={city.id} className="text-[13px] font-medium text-[#18181B] cursor-pointer">
                              {city.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Material Provider Selection */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <span className="text-[16px] text-[#18181B]">Material</span>
                        <Info className="h-[15px] w-[15px] text-[#71717A]" />
                      </div>
                      <p className="text-[13px] text-[#52525B]">¿Quién proporcionará el material?</p>
                    </div>

                    <RadioGroup
                      value={formData.materialProvider}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          materialProvider: value as "client" | "arkcutt",
                          clientMaterial: undefined,
                          selectedMaterial: undefined,
                          selectedThickness: undefined,
                          selectedColor: undefined,
                        }))
                      }
                    >
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 p-3 border border-[#E4E4E7]/50 shadow-sm rounded-lg">
                          <RadioGroupItem value="client" id="client" />
                          <Label htmlFor="client" className="text-[13px] font-medium text-[#18181B] cursor-pointer">
                            Yo proporcionaré el material
                          </Label>
                        </div>
                        <div className="flex items-center gap-2 p-3 border border-[#E4E4E7]/50 shadow-sm rounded-lg">
                          <RadioGroupItem value="arkcutt" id="arkcutt" />
                          <Label htmlFor="arkcutt" className="text-[13px] font-medium text-[#18181B] cursor-pointer">
                            Arkcutt proporcionará el material
                          </Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Client Material Details */}
                  {formData.materialProvider === "client" && (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <span className="text-[16px] text-[#18181B]">Detalles del Material</span>
                        <p className="text-[13px] text-[#52525B]">
                          Proporciona los detalles del material que vas a entregar.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[13px] text-[#52525B]">Fecha de entrega</Label>
                            <Input
                              type="date"
                              value={formData.clientMaterial?.deliveryDate || ""}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  clientMaterial: {
                                    ...prev.clientMaterial!,
                                    deliveryDate: e.target.value,
                                    deliveryTime: prev.clientMaterial?.deliveryTime || "",
                                    materialType: prev.clientMaterial?.materialType || "",
                                    thickness: prev.clientMaterial?.thickness || 0,
                                  },
                                }))
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-[13px] text-[#52525B]">Hora de entrega</Label>
                            <select
                              className="w-full h-10 px-3 py-2 border border-[#E4E4E7] rounded-md text-[13px]"
                              value={formData.clientMaterial?.deliveryTime || ""}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  clientMaterial: {
                                    ...prev.clientMaterial!,
                                    deliveryTime: e.target.value,
                                  },
                                }))
                              }
                            >
                              <option value="">Seleccionar hora</option>
                              {timeSlots.map((time) => (
                                <option key={time} value={time}>
                                  {time}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[13px] text-[#52525B]">Tipo de material</Label>
                          <Input
                            placeholder="Ej: Metacrilato, Madera, Cartón..."
                            value={formData.clientMaterial?.materialType || ""}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                clientMaterial: {
                                  ...prev.clientMaterial!,
                                  materialType: e.target.value,
                                },
                              }))
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[13px] text-[#52525B]">Grosor (mm)</Label>
                          <Input
                            type="number"
                            placeholder="Máximo 10mm"
                            max="10"
                            step="0.1"
                            value={formData.clientMaterial?.thickness || ""}
                            onChange={(e) => handleThicknessChange(e.target.value)}
                          />
                          {thicknessError && (
                            <Alert variant="destructive">
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>{thicknessError}</AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Arkcutt Material Selection */}
                  {formData.materialProvider === "arkcutt" && (
                    <>
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="text-[16px] text-[#18181B]">Seleccionar Material</span>
                            <Info className="h-[15px] w-[15px] text-[#71717A]" />
                          </div>
                          <p className="text-[13px] text-[#52525B]">
                            Elige el material que quieres que proporcionemos.
                          </p>
                        </div>

                        <RadioGroup
                          value={formData.selectedMaterial || ""}
                          onValueChange={(value) =>
                            setFormData((prev) => ({
                              ...prev,
                              selectedMaterial: value,
                              selectedThickness: undefined,
                              selectedColor: undefined,
                            }))
                          }
                        >
                          <div className="space-y-3">
                            {materials.map((material) => (
                              <div
                                key={material.id}
                                className="flex items-start gap-2 p-3 border border-[#E4E4E7]/50 shadow-sm rounded-lg"
                              >
                                <RadioGroupItem value={material.id} id={material.id} className="mt-1" />
                                <div className="flex-1">
                                  <Label
                                    htmlFor={material.id}
                                    className="text-[13px] font-medium text-[#18181B] cursor-pointer"
                                  >
                                    {material.name}
                                  </Label>
                                  <p className="text-[13px] text-[#52525B] mt-1">{material.description}</p>
                                  <p className="text-[11px] text-[#71717A] mt-1">
                                    Grosores disponibles: {material.thicknessOptions.join(", ")} {material.unit}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </RadioGroup>
                      </div>

                      {/* Thickness Selection */}
                      {formData.selectedMaterial && (
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <span className="text-[16px] text-[#18181B]">Grosor</span>
                              <Info className="h-[15px] w-[15px] text-[#71717A]" />
                            </div>
                            <p className="text-[13px] text-[#52525B]">
                              Selecciona el grosor para {getSelectedMaterial()?.name}.
                            </p>
                          </div>

                          <div className="relative">
                            <Button
                              variant="outline"
                              className="w-full justify-between h-10"
                              onClick={() => setOpenDropdown(openDropdown === "thickness" ? null : "thickness")}
                            >
                              <span className="text-[13px]">
                                {formData.selectedThickness
                                  ? `${formData.selectedThickness} ${getSelectedMaterial()?.unit}`
                                  : "Seleccionar grosor"}
                              </span>
                              <ChevronDown className="h-4 w-4" />
                            </Button>

                            {openDropdown === "thickness" && (
                              <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg border border-[#E4E4E7]">
                                <div className="py-1">
                                  {getSelectedMaterial()?.thicknessOptions.map((thickness) => (
                                    <button
                                      key={thickness}
                                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-[#F4F4F5] ${
                                        formData.selectedThickness === thickness
                                          ? "bg-[#F4F4F5] font-medium text-[#18181B]"
                                          : "text-[#52525B]"
                                      }`}
                                      onClick={() => {
                                        setFormData((prev) => ({ ...prev, selectedThickness: thickness }))
                                        setOpenDropdown(null)
                                      }}
                                    >
                                      {thickness} {getSelectedMaterial()?.unit}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Color Selection */}
                      {formData.selectedMaterial && formData.selectedThickness && (
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <span className="text-[16px] text-[#18181B]">Color</span>
                              <Info className="h-[15px] w-[15px] text-[#71717A]" />
                            </div>
                            <p className="text-[13px] text-[#52525B]">
                              Selecciona el color para {getSelectedMaterial()?.name}.
                            </p>
                          </div>

                          <div className="flex items-center gap-4 flex-wrap">
                            {getSelectedMaterial()?.colors.map((color) => (
                              <button
                                key={color.id}
                                className={`flex items-center gap-2 p-2 border rounded-lg transition-colors ${
                                  formData.selectedColor === color.id
                                    ? "border-[#18181B] bg-[#F4F4F5]"
                                    : "border-[#E4E4E7] hover:border-[#A1A1AA]"
                                }`}
                                onClick={() => setFormData((prev) => ({ ...prev, selectedColor: color.id }))}
                              >
                                <div
                                  className="w-5 h-5 rounded-full border border-[#E4E4E7]"
                                  style={{ backgroundColor: color.color }}
                                />
                                <span className="text-[13px] text-[#18181B]">{color.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Urgent Request */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Switch
                          checked={formData.isUrgent}
                          onCheckedChange={(checked) =>
                            setFormData((prev) => ({ ...prev, isUrgent: checked, urgentDateTime: undefined }))
                          }
                        />
                        <div className="flex items-center gap-1">
                          <span className="text-[16px] text-[#18181B]">Reserva urgente</span>
                          <Info className="h-[15px] w-[15px] text-[#71717A]" />
                        </div>
                      </div>
                    </div>

                    {formData.isUrgent ? (
                      <div className="space-y-2">
                        <Label className="text-[13px] text-[#52525B]">Fecha y hora deseada para el corte</Label>
                        <Input
                          type="datetime-local"
                          value={formData.urgentDateTime || ""}
                          onChange={(e) => setFormData((prev) => ({ ...prev, urgentDateTime: e.target.value }))}
                        />
                      </div>
                    ) : (
                      <p className="text-[13px] text-[#52525B]">
                        Te indicaremos junto al presupuesto el próximo hueco disponible.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer - Fixed at bottom */}
              <div className="flex-shrink-0 bg-white border-t border-[#E4E4E7] p-6">
                <div className="flex justify-end gap-2">
                  <Button variant="outline" className="text-[13px] font-medium text-[#18181B]">
                    Cancelar
                  </Button>
                  <Button
                    className="bg-[#27272A] text-[13px] font-medium text-[rgba(255,255,255,0.88)] hover:bg-[#18181B]"
                    onClick={handleSubmit}
                    disabled={!isFormValid()}
                  >
                    Enviar Solicitud
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isFullscreen && selectedImage !== null && (
        <FullscreenViewer isOpen={isFullscreen} onClose={() => toggleFullscreen()} title="Servicio Corte Láser">
          <div className="flex items-center justify-center h-full">
            <Image
              src={getImageSrc(selectedImage) || "/placeholder.svg"}
              alt={`Design ${selectedImage + 1}`}
              width={400}
              height={600}
              className="max-h-full max-w-full object-contain"
            />
          </div>
        </FullscreenViewer>
      )}
    </>
  )
}
