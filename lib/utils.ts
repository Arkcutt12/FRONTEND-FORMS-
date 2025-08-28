import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getSelectedMaterial(materialId?: string): string {
  const materials = [
    { id: "acrylic", name: "Metacrilato" },
    { id: "balsa", name: "Madera Balsa" },
    { id: "plywood", name: "Contrachapado" },
    { id: "dm", name: "DM" },
    { id: "cardboard", name: "Cartón Gris" },
  ]

  return materials.find((material) => material.id === materialId)?.name || materialId || "No especificado"
}

export function getSelectedCity(cityId?: string): string {
  const cities = [
    { id: "madrid", name: "Madrid" },
    { id: "barcelona", name: "Barcelona" },
    { id: "malaga", name: "Málaga" },
    { id: "home", name: "A domicilio" },
  ]

  return cities.find((city) => city.id === cityId)?.name || cityId || "No especificada"
}
