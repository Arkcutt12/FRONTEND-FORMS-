"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { X, Info, ChevronDown, Calendar, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { FileUpload } from "@/components/file-upload"
import { DXFViewer } from "@/components/dxf-viewer"
import { Switch } from "@/components/ui/switch"
import { FullscreenViewer } from "@/components/fullscreen-viewer"
import { EmptyFilesState } from "@/components/empty-files-state"
import Image from "next/image"

interface Material {
  id: string
  name: string
  price: number
  description: string
  thicknessOptions: number[]
  unit: string
}

interface ColorOption {
  id: string
  name: string
  color: string
}

export default function MaterialSelectionPage() {
  const [currentStep, setCurrentStep] = useState<"materials" | "checkout">("materials")
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null)
  const [thicknesses, setThicknesses] = useState<Record<string, number>>({
    balsa: 1,
    plywood: 4,
    dm: 2.5,
    acrylic: 3,
    cardboard: 2,
  })
  const [total, setTotal] = useState(0)
  const [files, setFiles] = useState<File[]>([])
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [previewFile, setPreviewFile] = useState<File | null>(null)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [needDeliveryDate, setNeedDeliveryDate] = useState(true)
  const [deliveryDate, setDeliveryDate] = useState<string>("")
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown && !(event.target as Element).closest(".dropdown-container")) {
        setOpenDropdown(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [openDropdown])

  // Update total when files change
  useEffect(() => {
    let newTotal = 0

    // Add price for selected material
    if (selectedMaterial) {
      const material = materials.find((m) => m.id === selectedMaterial)
      if (material) {
        newTotal += material.price
      }
    }

    // Add price for each file (21€ per file)
    newTotal += files.length * 21

    setTotal(newTotal)
  }, [selectedMaterial, files])

  const materials: Material[] = [
    {
      id: "balsa",
      name: "Madera Balsa",
      price: 10.0,
      description: "The quick brown fox jumps over a lazy dog.",
      thicknessOptions: [1, 3, 5],
      unit: "mm",
    },
    {
      id: "plywood",
      name: "Contrachapado",
      price: 8.0,
      description: "The quick brown fox jumps over a lazy dog.",
      thicknessOptions: [4, 5],
      unit: "mm",
    },
    {
      id: "dm",
      name: "DM",
      price: 5.0,
      description: "The quick brown fox jumps over a lazy dog.",
      thicknessOptions: [2.5],
      unit: "mm",
    },
    {
      id: "acrylic",
      name: "Metacrilato",
      price: 30.0,
      description: "The quick brown fox jumps over a lazy dog.",
      thicknessOptions: [3, 5],
      unit: "mm",
    },
    {
      id: "cardboard",
      name: "Cartón Gris",
      price: 4.0,
      description: "The quick brown fox jumps over a lazy dog.",
      thicknessOptions: [2, 3],
      unit: "mm",
    },
  ]

  const colorOptions: ColorOption[] = [
    { id: "white", name: "Blanco", color: "#FAFAFA" },
    { id: "orange", name: "Naranja", color: "#7C2D12" },
    { id: "green", name: "Verde", color: "#10B981" },
    { id: "blue", name: "Azul", color: "#60A5FA" },
    { id: "black", name: "Negro", color: "rgba(24, 24, 27, 0.88)" },
  ]

  const handleMaterialSelect = (materialId: string) => {
    setSelectedMaterial(materialId)
    const material = materials.find((m) => m.id === materialId)
    if (material) {
      // The total is now updated in the useEffect
    }
  }

  const handleThicknessChange = (materialId: string, value: number) => {
    setThicknesses((prev) => ({
      ...prev,
      [materialId]: value,
    }))
  }

  const handlePreviewFile = (file: File) => {
    setPreviewFile(file)
  }

  const closePreview = () => {
    setPreviewFile(null)
  }

  const handleContinue = () => {
    setCurrentStep("checkout")
  }

  const handleBack = () => {
    setCurrentStep("materials")
  }

  const handleColorSelect = (colorId: string) => {
    setSelectedColor(colorId)
  }

  const handleDeliveryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDeliveryDate(e.target.value)
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

  const getMaterialThickness = (materialId: string) => {
    if (!materialId) return ""
    const thickness = thicknesses[materialId]
    const material = materials.find((m) => m.id === materialId)
    if (!material) return ""
    return `${thickness}${material.unit}`
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

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <>
      <div className="w-full min-h-screen bg-white">
        <div className="w-full bg-[#FAFAFA] shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-white">
            <div className="flex justify-between items-center px-4 py-3">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="rounded-md">
                  <X className="h-[15px] w-[15px] text-[#52525B]" />
                </Button>
                <div className="bg-[#FAFAFA] px-1 py-0.5 rounded text-xs font-medium text-[#52525B] border border-[#E4E4E7]">
                  esc
                </div>
              </div>
              <div className="text-[13px] font-medium text-[#52525B]">Nombre Servicio</div>
              <Button variant="outline" className="rounded-xl px-3 h-10 text-[13px] font-medium">
                Gallery Mode
              </Button>
            </div>
            <Separator />
          </div>

          <div className="flex flex-col md:flex-row">
            {/* Gallery Section or DXF Viewer */}
            <div className="flex-1 bg-[#FAFAFA] min-h-[500px] relative">
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
                    setFiles([...files, ...Array.from(e.target.files)])
                  }
                }}
                accept=".dxf,.dwg"
                multiple
                className="hidden"
              />
            </div>

            <Separator orientation="vertical" className="hidden md:block" />

            {/* Form Section */}
            <div className="w-full md:w-[560px] bg-white p-6 flex flex-col justify-between">
              {currentStep === "materials" ? (
                <div className="space-y-10">
                  {/* File Upload Section */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <span className="text-[16px] text-[#18181B]">Archivo</span>
                        <Info className="h-[15px] w-[15px] text-[#71717A]" />
                      </div>
                      <p className="text-[13px] text-[#52525B]">
                        Max file size is 50MB. Supported file types are .dxf and .dwg.
                      </p>
                    </div>

                    <FileUpload
                      files={files}
                      setFiles={setFiles}
                      onPreviewFile={handlePreviewFile}
                      maxFiles={5}
                      maxSize={50 * 1024 * 1024} // 50MB
                      filePrice={21.0}
                    />
                  </div>

                  {/* Materials Section */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <span className="text-[16px] text-[#18181B]">Materiales</span>
                        <Info className="h-[15px] w-[15px] text-[#71717A]" />
                      </div>
                      <p className="text-[13px] text-[#52525B]">Selecciona el material que deseas y su grosor.</p>
                    </div>

                    <RadioGroup value={selectedMaterial || ""} onValueChange={handleMaterialSelect}>
                      <div className="space-y-4">
                        {materials.map((material) => (
                          <div key={material.id} className="flex items-center gap-5">
                            <div className="flex-1 flex items-start gap-2 p-2 border border-[#E4E4E7]/50 shadow-sm rounded-lg">
                              <RadioGroupItem value={material.id} id={material.id} className="mt-1" />
                              <div className="flex-1">
                                <div className="flex justify-between">
                                  <div className="flex items-center gap-1">
                                    <Label htmlFor={material.id} className="text-[13px] font-medium text-[#18181B]">
                                      {material.name}
                                    </Label>
                                    <Info className="h-[15px] w-[15px] text-[#71717A]" />
                                  </div>
                                  <span className="text-[13px] font-medium text-[#52525B]">
                                    {material.price.toFixed(2)}€
                                  </span>
                                </div>
                                <p className="text-[13px] text-[#52525B]">{material.description}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5">
                              <div className="relative dropdown-container">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-9 w-9 rounded-md"
                                  onClick={() => setOpenDropdown(openDropdown === material.id ? null : material.id)}
                                >
                                  <ChevronDown className="h-[15px] w-[15px]" />
                                </Button>

                                {openDropdown === material.id && (
                                  <div className="absolute z-10 mt-1 w-20 rounded-md bg-white shadow-lg border border-[#E4E4E7]">
                                    <div className="py-1">
                                      {material.thicknessOptions.map((option) => (
                                        <button
                                          key={option}
                                          className={`block w-full text-left px-4 py-2 text-sm ${
                                            thicknesses[material.id as keyof typeof thicknesses] === option
                                              ? "bg-[#F4F4F5] font-medium text-[#18181B]"
                                              : "text-[#52525B] hover:bg-[#F4F4F5]"
                                          }`}
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleThicknessChange(material.id, option)
                                            setOpenDropdown(null)
                                          }}
                                        >
                                          {option} {material.unit}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="p-2 border border-[#E4E4E7]/50 shadow-sm rounded-lg min-w-[40px] text-center">
                                <span className="text-[13px] font-medium text-[#18181B]">
                                  {thicknesses[material.id as keyof typeof thicknesses]}
                                </span>
                              </div>

                              <div className="p-2 border border-[#E4E4E7]/50 shadow-sm rounded-lg min-w-[40px] text-center">
                                <span className="text-[13px] font-medium text-[#52525B]">{material.unit}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Total Section */}
                  <div className="space-y-2">
                    <div>
                      <span className="text-[16px] text-[#18181B]">Total</span>
                    </div>
                    <div className="flex h-8 w-[280px] rounded-md border border-[#E4E4E7]/50 shadow-sm bg-[#FAFAFA] overflow-hidden">
                      <div className="px-2 py-1.5 text-[13px] text-[#71717A]">EUR</div>
                      <Separator orientation="vertical" />
                      <div className="flex-1 px-2 py-1.5 text-right text-[13px] text-[#18181B]">{total.toFixed(2)}</div>
                      <Separator orientation="vertical" />
                      <div className="px-2 py-1.5 text-center w-8 text-[13px] text-[#71717A]">€</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-10">
                  {/* Historial Section */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <span className="text-[16px] text-[#18181B]">Historial</span>
                        <Info className="h-[15px] w-[15px] text-[#71717A]" />
                      </div>
                      <p className="text-[13px] text-[#52525B]">
                        Max file size is 500kb. Supported file types are .jpg and .png.
                      </p>
                    </div>

                    {/* Files */}
                    {files.map((file, index) => (
                      <div
                        key={`file-${index}`}
                        className="px-3 py-2 bg-[#FAFAFA] shadow-sm rounded-lg flex justify-between items-center"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-6 h-8 bg-white shadow-[0px_0px_0px_1px_rgba(0,0,0,0.08)] rounded flex items-center justify-center">
                            <X className="w-4 h-4 text-[#52525B]" />
                          </div>
                          <div className="flex items-center">
                            <span className="text-[13px] font-medium text-[#18181B]">
                              {getFileNameWithoutExtension(file.name)}
                            </span>
                            <span className="text-[13px] text-[#52525B]">{getFileExtension(file.name)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[13px] text-[#52525B]">+</span>
                          <span className="text-[13px] text-[#52525B]">21.00€</span>
                        </div>
                      </div>
                    ))}

                    {/* Material */}
                    {selectedMaterial && (
                      <div className="px-3 py-2 bg-[#FAFAFA] shadow-sm rounded-lg flex justify-between items-center">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="flex items-center">
                            <span className="text-[13px] font-medium text-[#18181B]">
                              {materials.find((m) => m.id === selectedMaterial)?.name}
                            </span>
                            <span className="text-[13px] text-[#52525B] ml-2">
                              {getMaterialThickness(selectedMaterial)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[13px] text-[#52525B]">+</span>
                          <span className="text-[13px] text-[#52525B]">
                            {materials.find((m) => m.id === selectedMaterial)?.price.toFixed(2)}€
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Colors Section */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <span className="text-[16px] text-[#18181B]">Colores</span>
                        <Info className="h-[15px] w-[15px] text-[#71717A]" />
                      </div>
                      <p className="text-[13px] text-[#52525B]">Selecciona el color que deseas.</p>
                    </div>

                    <div className="flex items-center gap-4">
                      {colorOptions.map((color) => (
                        <button
                          key={color.id}
                          className={`w-7 h-7 rounded-full flex items-center justify-center ${
                            selectedColor === color.id ? "ring-2 ring-[#18181B] ring-offset-2" : ""
                          }`}
                          onClick={() => handleColorSelect(color.id)}
                          title={color.name}
                        >
                          <div
                            className="w-5 h-5 rounded-full"
                            style={{ backgroundColor: color.color }}
                            aria-label={color.name}
                          />
                          {selectedColor === color.id && (
                            <Check
                              className={`absolute h-3 w-3 ${color.id === "white" ? "text-[#18181B]" : "text-white"}`}
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Delivery Date Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Switch checked={needDeliveryDate} onCheckedChange={setNeedDeliveryDate} />
                        <div className="flex items-center gap-1">
                          <span className="text-[16px] text-[#18181B]">Fecha de entrega</span>
                          <span className="text-[13px] text-[#71717A]">(Optional)</span>
                          <Info className="h-[15px] w-[15px] text-[#71717A]" />
                        </div>
                      </div>
                    </div>
                    <p className="text-[13px] text-[#52525B]">Selecciona la fecha de entrega deseada.</p>

                    {needDeliveryDate && (
                      <div className="flex h-8 w-[280px] rounded-md border border-[#E4E4E7]/50 shadow-sm bg-[#FAFAFA] overflow-hidden">
                        <div className="px-2 py-1.5 flex items-center justify-center">
                          <Calendar className="h-[15px] w-[15px] text-[#71717A]" />
                        </div>
                        <Separator orientation="vertical" />
                        <input
                          type="date"
                          value={deliveryDate}
                          onChange={handleDeliveryDateChange}
                          className="flex-1 px-2 py-1.5 bg-transparent border-none outline-none text-[13px] text-[#18181B]"
                          placeholder="DD/MM/YYYY"
                        />
                        <Separator orientation="vertical" />
                        <div className="px-2 py-1.5 flex items-center justify-center">
                          <X className="h-[15px] w-[15px] text-[#71717A]" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Total Section */}
                  <div className="space-y-2">
                    <div>
                      <span className="text-[16px] text-[#18181B]">Total</span>
                    </div>
                    <div className="flex h-8 w-[280px] rounded-md border border-[#E4E4E7]/50 shadow-sm bg-[#FAFAFA] overflow-hidden">
                      <div className="px-2 py-1.5 text-[13px] text-[#71717A]">EUR</div>
                      <Separator orientation="vertical" />
                      <div className="flex-1 px-2 py-1.5 text-right text-[13px] text-[#18181B]">{total.toFixed(2)}</div>
                      <Separator orientation="vertical" />
                      <div className="px-2 py-1.5 text-center w-8 text-[13px] text-[#71717A]">€</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="mt-10">
                <Separator className="mb-4" />
                <div className="flex justify-end gap-2">
                  {currentStep === "materials" ? (
                    <>
                      <Button variant="outline" className="text-[13px] font-medium text-[#18181B]">
                        Cancel
                      </Button>
                      <Button
                        className="bg-[#27272A] text-[13px] font-medium text-[rgba(255,255,255,0.88)] hover:bg-[#18181B]"
                        onClick={handleContinue}
                      >
                        Continuar
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" className="text-[13px] font-medium text-[#18181B]" onClick={handleBack}>
                        Volver
                      </Button>
                      <Button className="bg-[#27272A] text-[13px] font-medium text-[rgba(255,255,255,0.88)] hover:bg-[#18181B]">
                        Finalizar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isFullscreen && selectedImage !== null && (
        <FullscreenViewer isOpen={isFullscreen} onClose={() => toggleFullscreen()} title="Nombre Servicio">
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
