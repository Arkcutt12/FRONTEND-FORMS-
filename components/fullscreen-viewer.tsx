"use client"

import { useState, useEffect, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Minus, Plus, RotateCcw, Minimize2 } from "lucide-react"
import Image from "next/image"

interface FullscreenViewerProps {
  children: ReactNode
  isOpen: boolean
  onClose: () => void
  title?: string
}

export function FullscreenViewer({ children, isOpen, onClose, title = "Servicio Corte Láser" }: FullscreenViewerProps) {
  const [zoom, setZoom] = useState(100)

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEsc)
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEsc)
      document.body.style.overflow = "auto"
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 20, 200))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 20, 50))
  }

  const handleResetZoom = () => {
    setZoom(100)
  }

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-[#E4E4E7]">
        <div className="flex justify-between items-center px-4 py-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-md" onClick={onClose}>
              <ArrowLeft className="h-[15px] w-[15px] text-[#52525B]" />
            </Button>
            <div className="bg-[#FAFAFA] px-1 py-0.5 rounded text-xs font-medium text-[#52525B] border border-[#E4E4E7]">
              volver
            </div>
          </div>
          <div className="text-[13px] font-medium text-[#52525B]">{title}</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-7 w-7 rounded-md bg-transparent" onClick={handleZoomOut}>
              <Minus className="h-[15px] w-[15px]" />
            </Button>
            <div className="text-[13px] font-medium text-[#52525B]">{zoom}%</div>
            <Button variant="outline" size="icon" className="h-7 w-7 rounded-md bg-transparent" onClick={handleZoomIn}>
              <Plus className="h-[15px] w-[15px]" />
            </Button>
            <Button variant="outline" className="rounded-xl px-3 h-10 text-[13px] font-medium bg-transparent">
              Edit Mode
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 bg-[#FAFAFA] overflow-auto relative">
        <div
          className="w-full h-full flex items-center justify-center"
          style={{ transform: `scale(${zoom / 100})`, transition: "transform 0.2s ease" }}
        >
          {children}
        </div>

        {/* Exit fullscreen button */}
        <Button
          variant="outline"
          size="icon"
          className="absolute top-4 right-4 h-7 w-7 bg-white shadow-md rounded-md z-10"
          onClick={onClose}
          title="Salir de pantalla completa"
        >
          <Minimize2 className="h-[15px] w-[15px] text-[#52525B]" />
        </Button>

        {/* Zoom controls */}
        <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-white rounded-md shadow-sm border border-[#E4E4E7] overflow-hidden">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomOut}>
            <Minus className="h-[15px] w-[15px] text-[#52525B]" />
          </Button>
          <div className="w-[60px] text-center text-[13px] text-[#52525B]">{zoom}%</div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomIn}>
            <Plus className="h-[15px] w-[15px] text-[#52525B]" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleResetZoom}>
            <RotateCcw className="h-[15px] w-[15px] text-[#52525B]" />
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-[#E4E4E7] p-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className={`w-7 h-7 rounded bg-[#FAFAFA] shadow-sm overflow-hidden flex-shrink-0 ${
                i === 1 ? "ring-2 ring-[#3B82F6] ring-offset-1" : ""
              }`}
            >
              <Image
                src={`/images/robe-${i % 4 === 0 ? "front" : i % 4 === 1 ? "back" : i % 4 === 2 ? "detail-1" : "detail-2"}.${
                  i % 4 < 2 ? "png" : "jpeg"
                }`}
                alt={`Thumbnail ${i + 1}`}
                width={28}
                height={28}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
