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
  sheetSize: { width: number; height: number }
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
    sheetSize: { width: 100, height: 80 },
  },
  {
    id: "balsa",
    name: "Madera Balsa",
    description: "Madera ligera y fácil de trabajar, perfecta para maquetas y prototipos.",
    thicknessOptions: [1, 3, 5],
    unit: "mm",
    colors: [{ id: "wood", name: "Color madera", color: "#D2B48C" }],
    sheetSize: { width: 100, height: 80 },
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
    sheetSize: { width: 100, height: 80 },
  },
  {
    id: "dm",
    name: "DM",
    description: "Tablero de densidad media, superficie lisa ideal para acabados.",
    thicknessOptions: [2.5, 5, 8],
    unit: "mm",
    colors: [{ id: "wood", name: "Color madera", color: "#D2B48C" }],
    sheetSize: { width: 100, height: 80 },
  },
  {
    id: "cardboard",
    name: "Cartón Gris",
    description: "Material económico y versátil para prototipos y maquetas.",
    thicknessOptions: [2, 3, 5],
    unit: "mm",
    colors: [{ id: "grey", name: "Gris", color: "#9CA3AF" }],
    sheetSize: { width: 100, height: 80 },
  },
]

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

  const selectedMaterialData = getSelectedMaterial()

  return (
    <div className="space-y-4">
      {/* Material Selection Dropdown */}
      <div className="space-y-1">
        <span className="text-[14px] text-[#18181B] font-normal">Seleccionar Material</span>
        <p className="text-[13px] text-[#52525B]">Elige el material que quieres que proporcionemos.</p>
      </div>

      <div className="relative">
        <Button
          variant="outline"
          className="w-full justify-between h-10 bg-transparent"
          onClick={() => setOpenDropdown(openDropdown === "material" ? null : "material")}
        >
          <span className="text-[13px] font-normal">
            {selectedMaterialData ? selectedMaterialData.name : "Seleccionar material"}
          </span>
          <ChevronDown className="h-4 w-4" />
        </Button>

        {openDropdown === "material" && (
          <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg border border-[#E4E4E7]">
            <div className="py-1">
              {materials.map((material) => (
                <button
                  key={material.id}
                  className={`block w-full text-left px-4 py-2 text-sm hover:bg-[#F4F4F5] ${
                    selectedMaterial === material.id ? "bg-[#F4F4F5] font-medium text-[#18181B]" : "text-[#52525B]"
                  }`}
                  onClick={() => {
                    onMaterialChange(material.id)
                    setOpenDropdown(null)
                  }}
                >
                  {material.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Material Preview Image */}
      {selectedMaterial && (
        <div className="mt-4">
          <Image
            src="/images/material-preview.png"
            alt="Vista previa del material"
            width={512}
            height={205.52}
            className="w-[512px] h-[206px] object-cover rounded-lg"
          />
        </div>
      )}

      {/* Thickness Selection */}
      {selectedMaterial && (
        <div className="space-y-4">
          <div className="space-y-1">
            <span className="text-[14px] text-[#18181B] font-normal">Grosor del Material</span>
            <p className="text-[13px] text-[#52525B]">Elige el grosor que quieres para el material.</p>
          </div>

          <div className="relative">
            <Button
              variant="outline"
              className="w-full justify-between h-10 bg-transparent"
              onClick={() => setOpenDropdown(openDropdown === "thickness" ? null : "thickness")}
            >
              <span className="text-[13px] font-normal">
                {selectedThickness ? `${selectedThickness} ${selectedMaterialData?.unit}` : "Seleccionar grosor"}
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>

            {openDropdown === "thickness" && (
              <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg border border-[#E4E4E7]">
                <div className="py-1">
                  {selectedMaterialData?.thicknessOptions.map((thickness) => (
                    <button
                      key={thickness}
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-[#F4F4F5] ${
                        selectedThickness === thickness ? "bg-[#F4F4F5] font-medium text-[#18181B]" : "text-[#52525B]"
                      }`}
                      onClick={() => {
                        onThicknessChange(thickness)
                        setOpenDropdown(null)
                      }}
                    >
                      {thickness} {selectedMaterialData?.unit}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Color Selection */}
      {selectedMaterial && selectedThickness && (
        <div className="space-y-4">
          <div className="space-y-1">
            <span className="text-[14px] text-[#18181B] font-normal">Color del Material</span>
            <p className="text-[13px] text-[#52525B]">Elige el color que quieres para el material.</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {selectedMaterialData?.colors.map((color) => (
              <button
                key={color.id}
                className={`w-9 h-9 rounded border-2 transition-all ${
                  selectedColor === color.id ? "border-[#18181B] scale-110" : "border-[#E4E4E7] hover:border-[#A1A1AA]"
                }`}
                style={{ backgroundColor: color.color }}
                onClick={() => onColorChange(color.id)}
                title={color.name}
              />
            ))}
          </div>
        </div>
      )}

      {/* Sheet Size Preview */}
      {selectedMaterial && selectedThickness && selectedColor && (
        <div className="space-y-4">
          <div className="space-y-1">
            <span className="text-[14px] text-[#18181B] font-normal">Tamaño Plancha</span>
            <p className="text-[13px] text-[#52525B]">Cada material tiene unas medidas de plancha máximas.</p>
          </div>

          <div className="flex items-center justify-center w-72 h-44">
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
