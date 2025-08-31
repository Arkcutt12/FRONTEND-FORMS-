"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface Material {
  id: string
  name: string
  description: string
  thicknessOptions: number[]
  unit: string
  colors: { id: string; name: string; color: string }[]
  sheetSize: { width: number; height: number; area: number }
}

interface MaterialSelectorProps {
  selectedMaterial?: string
  selectedThickness?: number
  selectedColor?: string
  onMaterialChange: (materialId: string) => void
  onThicknessChange: (thickness: number) => void
  onColorChange: (colorId: string) => void
}

const materials: Material[] = [
  {
    id: "Dm",
    name: "DM",
    description: "Tablero de densidad media, superficie lisa ideal para acabados.",
    thicknessOptions: [2.5, 3, 4, 5, 7, 10],
    unit: "mm",
    colors: [{ id: "natural", name: "Natural", color: "#D2B48C" }],
    sheetSize: { width: 60, height: 100, area: 0.6 },
  },
  {
    id: "Contrachapado",
    name: "Contrachapado",
    description: "Madera laminada resistente, ideal para proyectos estructurales.",
    thicknessOptions: [4, 5],
    unit: "mm",
    colors: [{ id: "light-wood", name: "Madera clara", color: "#F5DEB3" }],
    sheetSize: { width: 60, height: 100, area: 0.6 },
  },
  {
    id: "Madera Balsa",
    name: "Madera Balsa",
    description: "Madera ligera y fácil de trabajar, perfecta para maquetas y prototipos.",
    thicknessOptions: [1, 2, 3, 4, 8],
    unit: "mm",
    colors: [{ id: "light-wood", name: "Madera clara", color: "#F5DEB3" }],
    sheetSize: { width: 10, height: 100, area: 0.1 },
  },
  {
    id: "Metacrilato",
    name: "Metacrilato",
    description: "Material transparente y resistente, ideal para proyectos que requieren claridad visual.",
    thicknessOptions: [2, 3, 4, 5, 6, 8],
    unit: "mm",
    colors: [
      { id: "Transparente", name: "Transparente", color: "rgba(255, 255, 255, 0.1)" },
      { id: "Lila", name: "Lila", color: "#C084FC" },
      { id: "Blanco", name: "Blanco", color: "#FFFFFF" },
    ],
    sheetSize: { width: 60, height: 100, area: 0.6 },
  },
  {
    id: "Cartón",
    name: "Cartón",
    description: "Material económico y versátil para prototipos y maquetas.",
    thicknessOptions: [2],
    unit: "mm",
    colors: [{ id: "Gris", name: "Gris", color: "#9CA3AF" }],
    sheetSize: { width: 75, height: 105, area: 0.7875 },
  },
]

const METACRILATO_COMBINACIONES = {
  Transparente: [2, 3, 4, 5, 6, 8],
  Lila: [3], // Solo 3mm disponible
  Blanco: [2, 3, 4, 5, 6], // No incluye 8mm
}

function getGrosoresiDisponibles(material: string, color: string): number[] {
  if (material === "Metacrilato") {
    return METACRILATO_COMBINACIONES[color as keyof typeof METACRILATO_COMBINACIONES] || []
  }
  const materialData = materials.find((m) => m.id === material)
  return materialData?.thicknessOptions || []
}

function getColoresDisponibles(material: string, grosor: number): { id: string; name: string; color: string }[] {
  const materialData = materials.find((m) => m.id === material)
  if (!materialData) return []

  if (material === "Metacrilato") {
    const coloresDisponibles = []
    for (const [color, grosores] of Object.entries(METACRILATO_COMBINACIONES)) {
      if (grosores.includes(grosor)) {
        const colorData = materialData.colors.find((c) => c.id === color)
        if (colorData) coloresDisponibles.push(colorData)
      }
    }
    return coloresDisponibles
  }
  return materialData.colors
}

export function MaterialSelector({
  selectedMaterial,
  selectedThickness,
  selectedColor,
  onMaterialChange,
  onThicknessChange,
  onColorChange,
}: MaterialSelectorProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  const getSelectedMaterial = () => {
    return materials.find((m) => m.id === selectedMaterial)
  }

  const getMaterialPreviewImage = () => {
    switch (selectedMaterial) {
      case "Dm":
        return "/images/dm-preview.png"
      case "Contrachapado":
        return "/images/contrachapado-preview.png"
      case "Metacrilato":
        return "/images/metacrilato-preview.png"
      case "Cartón":
        return "/images/carton-preview.png"
      case "Madera Balsa":
        return "/images/balsa-preview.png"
      default:
        return "/images/material-preview.png"
    }
  }

  const selectedMaterialData = getSelectedMaterial()

  const getAvailableThicknesses = () => {
    if (!selectedMaterial) return []
    if (selectedMaterial === "Metacrilato" && selectedColor) {
      return getGrosoresiDisponibles(selectedMaterial, selectedColor)
    }
    return selectedMaterialData?.thicknessOptions || []
  }

  const getAvailableColors = () => {
    if (!selectedMaterial) return []
    if (selectedMaterial === "Metacrilato" && selectedThickness) {
      return getColoresDisponibles(selectedMaterial, selectedThickness)
    }
    return selectedMaterialData?.colors || []
  }

  return (
    <div className="space-y-4">
      {/* Material Selection */}
      <div className="space-y-2">
        <div className="space-y-1">
          <span className="text-[16px] text-[#18181B]">Seleccionar Material</span>
          <p className="text-[13px] text-[#52525B]">Elige el material que quieres que proporcionemos.</p>
        </div>

        <div className="relative">
          <Button
            variant="outline"
            className="w-full justify-between h-12 px-4 text-left bg-transparent"
            onClick={() => setOpenDropdown(openDropdown === "material" ? null : "material")}
          >
            <span className="text-[13px] font-normal">
              {selectedMaterial ? materials.find((m) => m.id === selectedMaterial)?.name : "Seleccionar material"}
            </span>
            <ChevronDown className="h-4 w-4" />
          </Button>

          {openDropdown === "material" && (
            <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-[#E4E4E7] rounded-md shadow-lg max-h-60 overflow-y-auto">
              {materials.map((material) => (
                <button
                  key={material.id}
                  className="w-full px-4 py-3 text-left hover:bg-[#F4F4F5] text-[13px] border-b border-[#F4F4F5] last:border-b-0"
                  onClick={() => {
                    onMaterialChange(material.id)
                    setOpenDropdown(null)
                  }}
                >
                  <div className="font-medium text-[#18181B]">{material.name}</div>
                  <div className="text-[#52525B] text-xs mt-1">{material.description}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Material Preview Image */}
      {selectedMaterial && (
        <div className="mt-4">
          <Image
            src={getMaterialPreviewImage() || "/placeholder.svg"}
            alt={`Vista previa del material ${selectedMaterialData?.name || selectedMaterial}`}
            width={512}
            height={205.52}
            className="w-[512px] h-[206px] object-cover rounded-lg"
          />
        </div>
      )}

      {/* Color Selection */}
      {selectedMaterial && (
        <div className="space-y-2">
          <div className="space-y-1">
            <span className="text-[16px] text-[#18181B]">Color del Material</span>
            <p className="text-[13px] text-[#52525B]">Elige el color que quieres para el material.</p>
          </div>

          <div className="flex gap-2 flex-wrap">
            {getAvailableColors().map((color) => (
              <button
                key={color.id}
                className={`w-9 h-9 rounded border-2 ${
                  selectedColor === color.id ? "border-[#18181B]" : "border-[#E4E4E7]"
                }`}
                style={{ backgroundColor: color.color }}
                onClick={() => onColorChange(color.id)}
                title={color.name}
              />
            ))}
          </div>
        </div>
      )}

      {/* Thickness Selection */}
      {selectedMaterial && (selectedMaterial !== "Metacrilato" || selectedColor) && (
        <div className="space-y-2">
          <div className="space-y-1">
            <span className="text-[16px] text-[#18181B]">Grosor del Material</span>
            <p className="text-[13px] text-[#52525B]">Elige el grosor que quieres para el material.</p>
          </div>

          <div className="relative">
            <Button
              variant="outline"
              className="w-full justify-between h-12 px-4 text-left bg-transparent"
              onClick={() => setOpenDropdown(openDropdown === "thickness" ? null : "thickness")}
            >
              <span className="text-[13px] font-normal">
                {selectedThickness ? `${selectedThickness}mm` : "Seleccionar grosor"}
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>

            {openDropdown === "thickness" && (
              <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-[#E4E4E7] rounded-md shadow-lg max-h-60 overflow-y-auto">
                {getAvailableThicknesses().map((thickness) => (
                  <button
                    key={thickness}
                    className="w-full px-4 py-3 text-left hover:bg-[#F4F4F5] text-[13px] border-b border-[#F4F4F5] last:border-b-0"
                    onClick={() => {
                      onThicknessChange(thickness)
                      setOpenDropdown(null)
                    }}
                  >
                    {thickness}mm
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sheet Size Preview */}
      {selectedMaterial && selectedThickness && selectedColor && (
        <div className="space-y-2">
          <div className="space-y-1">
            <span className="text-[16px] text-[#18181B]">Tamaño Plancha</span>
            <p className="text-[13px] text-[#52525B]">Cada material tiene unas medidas de plancha máximas.</p>
          </div>

          <div className="mt-0 justify-start flex-col w-[512px] h-[299px] flex items-center justify-center">
            <Image
              src="/images/sheet-size.png"
              alt="Tamaño de la plancha"
              width={512}
              height={299}
              className="w-[512px] h-[299px] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  )
}
