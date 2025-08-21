"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image"

interface LocationData {
  address: string
  city: string
  postalCode: string
  phone: string
}

interface LocationSelectorProps {
  selectedCity: string
  locationData?: LocationData
  onCityChange: (city: string) => void
  onLocationDataChange: (data: LocationData | undefined) => void
}

const cities = [
  {
    id: "madrid",
    name: "Madrid",
    mapImage: "/images/madrid-map.png",
    googleMapsUrl: "https://maps.app.goo.gl/c8CvtbgcBAynb1j78",
  },
  {
    id: "barcelona",
    name: "Barcelona",
    mapImage: "/images/barcelona-map.png",
    googleMapsUrl: "https://maps.app.goo.gl/5B2BU6om5SXDfEgz6",
  },
  {
    id: "malaga",
    name: "Málaga",
    mapImage: "/images/malaga-map.png",
    googleMapsUrl: "https://maps.app.goo.gl/YfSQHmaKsdqhyow68",
  },
  {
    id: "home",
    name: "A domicilio",
    mapImage: null,
    googleMapsUrl: null,
  },
]

export function LocationSelector({
  selectedCity,
  locationData,
  onCityChange,
  onLocationDataChange,
}: LocationSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const selectedCityData = cities.find((city) => city.id === selectedCity)

  const handleCitySelect = (cityId: string) => {
    onCityChange(cityId)
    setIsOpen(false)

    // Clear location data when switching away from home delivery
    if (cityId !== "home") {
      onLocationDataChange(undefined)
    }
  }

  const handleLocationDataChange = (field: keyof LocationData, value: string) => {
    const newData = {
      address: locationData?.address || "",
      city: locationData?.city || "",
      postalCode: locationData?.postalCode || "",
      phone: locationData?.phone || "",
      [field]: value,
    }
    onLocationDataChange(newData)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-[14px] font-medium text-[#18181B]">Ubicación</Label>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Button
              variant="outline"
              className="w-full justify-between h-12 bg-white text-left"
              onClick={() => setIsOpen(!isOpen)}
            >
              <span className="text-[14px] text-[#18181B]">
                {selectedCityData ? selectedCityData.name : "Seleccionar ubicación"}
              </span>
              <ChevronDown className="h-4 w-4 text-[#52525B]" />
            </Button>

            {isOpen && (
              <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg border border-[#E4E4E7]">
                <div className="py-1">
                  {cities.map((city) => (
                    <button
                      key={city.id}
                      className={`block w-full text-left px-4 py-3 text-[14px] hover:bg-[#F4F4F5] transition-colors ${
                        selectedCity === city.id ? "bg-[#F4F4F5] font-medium text-[#18181B]" : "text-[#52525B]"
                      }`}
                      onClick={() => handleCitySelect(city.id)}
                    >
                      {city.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {selectedCity && selectedCity !== "home" && selectedCityData && (
            <Button
              variant="outline"
              className="h-12 px-4 bg-white text-[14px] text-[#18181B] whitespace-nowrap"
              onClick={() => window.open(selectedCityData.googleMapsUrl!, "_blank")}
            >
              Ver en el Mapa
            </Button>
          )}
        </div>
      </div>

      {selectedCity && selectedCity !== "home" && selectedCityData && (
        <div className="relative rounded-lg overflow-hidden border border-[#E4E4E7]">
          <Image
            src={selectedCityData.mapImage! || "/placeholder.svg"}
            alt={`Mapa de ${selectedCityData.name}`}
            width={400}
            height={200}
            className="w-full h-[200px] object-cover"
          />
        </div>
      )}

      {/* Home delivery form */}
      {selectedCity === "home" && (
        <div className="space-y-4 p-4 bg-[#FAFAFA] rounded-lg border border-[#E4E4E7]">
          <div className="space-y-1">
            <span className="text-[14px] font-medium text-[#18181B]">Datos de Entrega a Domicilio</span>
            <p className="text-[12px] text-[#52525B]">Proporciona los datos para la entrega en tu domicilio.</p>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-[12px] text-[#52525B]">Dirección completa</Label>
              <Input
                placeholder="Calle, número, piso, puerta..."
                value={locationData?.address || ""}
                onChange={(e) => handleLocationDataChange("address", e.target.value)}
                className="text-[13px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-[12px] text-[#52525B]">Ciudad</Label>
                <Input
                  placeholder="Ciudad"
                  value={locationData?.city || ""}
                  onChange={(e) => handleLocationDataChange("city", e.target.value)}
                  className="text-[13px]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[12px] text-[#52525B]">Código Postal</Label>
                <Input
                  placeholder="28001"
                  value={locationData?.postalCode || ""}
                  onChange={(e) => handleLocationDataChange("postalCode", e.target.value)}
                  className="text-[13px]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[12px] text-[#52525B]">Teléfono de contacto</Label>
              <Input
                placeholder="+34 600 000 000"
                value={locationData?.phone || ""}
                onChange={(e) => handleLocationDataChange("phone", e.target.value)}
                className="text-[13px]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
