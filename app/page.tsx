"use client"

import { useState, useRef, useEffect } from "react"
import { Info, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { FileUpload } from "@/components/file-upload"
import { DXFViewer } from "@/components/dxf-viewer"
import { Switch } from "@/components/ui/switch"
import { FullscreenViewer } from "@/components/fullscreen-viewer"
import { EmptyFilesState } from "@/components/empty-files-state"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"
import { OrderSummary } from "@/components/order-summary"
import { ThankYouPage } from "@/components/thank-you-page"
import { MaterialSelector } from "@/components/material-selector"
import { LocationSelector } from "@/components/location-selector"
import { useDXFAnalysis } from "@/hooks/use-dxf-analysis"

interface Material {
  id: string
  name: string
  description: string
  thicknessOptions: number[]
  unit: string
  colors: { id: string; name: string; color: string }[]
}

interface LocationData {
  address: string
  city: string
  postalCode: string
  phone: string
}

interface FormData {
  files: File[]
  city: string
  locationData?: LocationData
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
  const {
    isLoading: isDXFAnalyzing,
    error: dxfError,
    data: dxfData,
    errorAnalysis: dxfErrorAnalysis,
    isConnected: isDXFConnected,
    analyzeDxf,
    clearData: clearDXFData,
  } = useDXFAnalysis()

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

  const [showOrderSummary, setShowOrderSummary] = useState(false)
  const [showRequestSuccess, setShowRequestSuccess] = useState(false)
  const [submittedPersonalData, setSubmittedPersonalData] = useState<{
    firstName: string
    lastName: string
    email: string
    phone: string
  } | null>(null)

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
    if (file && file.name.toLowerCase().endsWith(".dxf")) {
      console.log("[v0] Starting DXF analysis for file:", file.name)
      analyzeDxf(file)
    }
  }

  const closePreview = () => {
    setPreviewFile(null)
    clearDXFData()
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
    setShowOrderSummary(true)
  }

  const handleOrderSummarySubmit = (personalData: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }) => {
    console.log("Form Data:", formData)
    console.log("Personal Data:", personalData)
    console.log("DXF Analysis Data:", dxfData)
    console.log("DXF Error Analysis:", dxfErrorAnalysis)

    setSubmittedPersonalData(personalData)
    setShowOrderSummary(false)
    setShowRequestSuccess(true)
  }

  const handleBackToForm = () => {
    setShowOrderSummary(false)
  }

  const handleCloseSuccess = () => {
    setShowRequestSuccess(false)
    setFormData({
      files: [],
      city: "",
      materialProvider: "arkcutt",
      isUrgent: false,
    })
    setPreviewFile(null)
  }

  const isFormValid = () => {
    if (formData.files.length === 0) return false
    if (!formData.city) return false

    const hasDXFFiles = formData.files.some((file) => file.name.toLowerCase().endsWith(".dxf"))
    if (hasDXFFiles) {
      if (isDXFAnalyzing) {
        console.log("[v0] Form invalid: DXF analysis still in progress")
        return false
      }
      if (dxfError) {
        console.log("[v0] Form invalid: DXF analysis error:", dxfError)
        return false
      }
      if (!dxfData || !dxfErrorAnalysis) {
        console.log("[v0] Form invalid: DXF analysis not completed")
        return false
      }
      if (dxfErrorAnalysis.validation_status === "ERROR") {
        console.log("[v0] Form invalid: DXF file has critical errors")
        return false
      }
    }

    if (formData.city === "home") {
      if (
        !formData.locationData?.address ||
        !formData.locationData?.city ||
        !formData.locationData?.postalCode ||
        !formData.locationData?.phone
      ) {
        return false
      }
    }

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

  useEffect(() => {
    if (formData.files.length > 0 && !previewFile) {
      setPreviewFile(formData.files[0])
      const firstDXFFile = formData.files.find((file) => file.name.toLowerCase().endsWith(".dxf"))
      if (firstDXFFile) {
        console.log("[v0] Auto-analyzing first DXF file:", firstDXFFile.name)
        analyzeDxf(firstDXFFile)
      }
    } else if (formData.files.length === 0) {
      setPreviewFile(null)
      clearDXFData()
    }
  }, [formData.files, previewFile, analyzeDxf, clearDXFData])

  return (
    <>
      <div className="w-full h-screen bg-white flex flex-col">
        <div className="w-full bg-[#FAFAFA] shadow-lg overflow-hidden flex-1 flex flex-col">
          {showOrderSummary && (
            <OrderSummary
              formData={formData}
              materials={materials}
              onBack={handleBackToForm}
              onSubmit={handleOrderSummarySubmit}
            />
          )}

          {showRequestSuccess && submittedPersonalData && (
            <ThankYouPage
              personalData={submittedPersonalData}
              formData={formData}
              onClose={handleCloseSuccess}
              dxfAnalysisData={dxfData}
              dxfErrorAnalysis={dxfErrorAnalysis}
            />
          )}

          {!showOrderSummary && !showRequestSuccess && (
            <>
              <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
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
                        const newFiles = [...formData.files, ...Array.from(e.target.files)]
                        setFormData((prev) => ({
                          ...prev,
                          files: newFiles,
                        }))
                      }
                    }}
                    accept=".dxf,.dwg"
                    multiple
                    className="hidden"
                  />
                </div>

                <Separator orientation="vertical" className="hidden md:block" />

                <div className="w-full md:w-[560px] bg-white flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-8">
                      <div className="space-y-[10px]">
                        <Image
                          src="/images/form-header.png"
                          alt="Completa el formulario"
                          width={434}
                          height={250}
                          className="w-[434px] h-[250px] object-contain"
                        />
                        <Image
                          src="/images/form-subtitle.png"
                          alt="Criterios de pedido"
                          width={434}
                          height={24}
                          className="w-[434px] h-[24px] object-contain"
                        />
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="text-[16px] text-[#18181B]">Archivos</span>
                            <Info className="h-[15px] w-[15px] text-[#71717A]" />
                          </div>
                          <p className="text-[13px] text-[#52525B]">
                            Tamaño máximo: 50MB. Formatos soportados: .dxf, .dwg
                          </p>
                        </div>

                        <FileUpload
                          files={formData.files}
                          setFiles={(files) => setFormData((prev) => ({ ...prev, files }))}
                          onPreviewFile={handlePreviewFile}
                          maxFiles={5}
                          maxSize={50 * 1024 * 1024}
                          filePrice={0} // No price calculation
                        />

                        {formData.files.some((file) => file.name.toLowerCase().endsWith(".dxf")) && (
                          <div className="space-y-2">
                            {isDXFAnalyzing && (
                              <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>Analizando archivo DXF... Por favor espera.</AlertDescription>
                              </Alert>
                            )}

                            {dxfError && (
                              <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>Error en análisis: {dxfError}</AlertDescription>
                              </Alert>
                            )}

                            {dxfErrorAnalysis && dxfErrorAnalysis.validation_status === "ERROR" && (
                              <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                  El archivo DXF tiene errores críticos que deben corregirse antes de continuar.
                                </AlertDescription>
                              </Alert>
                            )}

                            {dxfErrorAnalysis && dxfErrorAnalysis.validation_status === "WARNING" && (
                              <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                  El archivo DXF tiene advertencias. Se recomienda revisar antes de continuar.
                                </AlertDescription>
                              </Alert>
                            )}

                            {dxfData && dxfErrorAnalysis && dxfErrorAnalysis.validation_status === "VALID" && (
                              <Alert className="border-green-200 bg-green-50">
                                <AlertCircle className="h-4 w-4 text-green-600" />
                                <AlertDescription className="text-green-800">
                                  Archivo DXF analizado correctamente. Listo para procesar.
                                </AlertDescription>
                              </Alert>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="text-[16px] text-[#18181B]">Material</span>
                            <Info className="h-[15px] w-[15px] text-[#71717A]" />
                          </div>
                          <p className="text-[13px] text-[#52525B]">¿Quién proporcionará el material?</p>
                        </div>

                        <div className="flex-col space-y-0">
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                materialProvider: "arkcutt",
                                clientMaterial: undefined,
                                selectedMaterial: undefined,
                                selectedThickness: undefined,
                                selectedColor: undefined,
                              }))
                            }
                            className="w-full items-end justify-center flex-col h-auto"
                          >
                            <Image
                              src={
                                formData.materialProvider === "arkcutt"
                                  ? "/images/arkcutt-button-selected.png"
                                  : "/images/arkcutt-button.png"
                              }
                              alt="Arkcutt proporcionará el material"
                              width={434}
                              height={124}
                              className="w-[434px] h-[124px] object-contain"
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                materialProvider: "client",
                                clientMaterial: undefined,
                                selectedMaterial: undefined,
                                selectedThickness: undefined,
                                selectedColor: undefined,
                              }))
                            }
                            className="w-full h-auto"
                          >
                            <Image
                              src={
                                formData.materialProvider === "client"
                                  ? "/images/client-button-selected.png"
                                  : "/images/client-button.png"
                              }
                              alt="Yo proporcionaré el material"
                              width={434}
                              height={124}
                              className="w-[434px] h-[124px] object-contain"
                            />
                          </button>
                        </div>
                      </div>

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

                      {formData.materialProvider === "arkcutt" && (
                        <MaterialSelector
                          selectedMaterial={formData.selectedMaterial}
                          selectedThickness={formData.selectedThickness}
                          selectedColor={formData.selectedColor}
                          onMaterialChange={(materialId) =>
                            setFormData((prev) => ({
                              ...prev,
                              selectedMaterial: materialId,
                              selectedThickness: undefined,
                              selectedColor: undefined,
                            }))
                          }
                          onThicknessChange={(thickness) =>
                            setFormData((prev) => ({ ...prev, selectedThickness: thickness }))
                          }
                          onColorChange={(colorId) => setFormData((prev) => ({ ...prev, selectedColor: colorId }))}
                        />
                      )}

                      {/* Location Selection */}
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="text-[16px] text-[#18181B]">Datos Recogida</span>
                            <Info className="h-[15px] w-[15px] text-[#71717A]" />
                          </div>
                          <p className="text-[13px] text-[#52525B]">Selecciona dónde quieres realizar el corte.</p>
                        </div>

                        <LocationSelector
                          selectedCity={formData.city}
                          locationData={formData.locationData}
                          onCityChange={(city) => setFormData((prev) => ({ ...prev, city }))}
                          onLocationDataChange={(locationData) => setFormData((prev) => ({ ...prev, locationData }))}
                        />
                      </div>

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

                  <div className="flex-shrink-0 bg-white border-t border-[#E4E4E7] p-6">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" className="text-[13px] font-medium text-[#18181B] bg-transparent">
                        Cancelar
                      </Button>
                      <Button
                        className="bg-[#27272A] text-[13px] font-medium text-[rgba(255,255,255,0.88)] hover:bg-[#18181B]"
                        onClick={handleSubmit}
                        disabled={!isFormValid()}
                      >
                        {isDXFAnalyzing ? "Analizando..." : "Enviar Solicitud"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
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
