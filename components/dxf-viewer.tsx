"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { X, ZoomIn, ZoomOut, RotateCw, Move, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useDXFAnalysis } from "@/hooks/use-dxf-analysis"
import { DXFInfoCard } from "@/components/dxf-info-card"
import { DXFErrorAnalysis } from "@/components/dxf-error-analysis"
import { FullscreenButton } from "@/components/fullscreen-button"

interface DXFViewerProps {
  file: File
  onClose: () => void
}

export function DXFViewer({ file, onClose }: DXFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [rotation, setRotation] = useState(0)
  const [tool, setTool] = useState<"pan" | "zoom">("pan")

  const { data: analysisData, isLoading, error } = useDXFAnalysis(file)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Set canvas size
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Apply transformations
    ctx.save()
    ctx.translate(canvas.width / 2 + pan.x, canvas.height / 2 + pan.y)
    ctx.scale(zoom, zoom)
    ctx.rotate((rotation * Math.PI) / 180)

    // Draw DXF content (simplified representation)
    ctx.strokeStyle = "#2563eb"
    ctx.lineWidth = 2 / zoom
    ctx.fillStyle = "#f3f4f6"

    // Draw some sample shapes to represent DXF content
    ctx.beginPath()
    ctx.rect(-100, -50, 200, 100)
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(0, 0, 30, 0, 2 * Math.PI)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(-50, -25)
    ctx.lineTo(50, 25)
    ctx.stroke()

    ctx.restore()
  }, [zoom, pan, rotation])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (tool === "pan") {
      setIsDragging(true)
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && tool === "pan") {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoom((prev) => Math.max(0.1, Math.min(5, prev * delta)))
  }

  const resetView = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
    setRotation(0)
  }

  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const link = document.createElement("a")
    link.download = `${file.name.replace(/\.[^/.]+$/, "")}_preview.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  return (
    <div className="w-full h-full bg-[#FAFAFA] flex flex-col relative">
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <Card className="p-2">
          <div className="flex gap-1">
            <Button
              variant={tool === "pan" ? "default" : "ghost"}
              size="sm"
              onClick={() => setTool("pan")}
              title="Mover vista"
            >
              <Move className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom((prev) => Math.min(5, prev * 1.2))}
              title="Acercar"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom((prev) => Math.max(0.1, prev * 0.8))}
              title="Alejar"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setRotation((prev) => (prev + 90) % 360)} title="Rotar">
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={resetView} title="Restablecer vista">
              Reset
            </Button>
          </div>
        </Card>
      </div>

      {/* Close button */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button variant="ghost" size="sm" onClick={handleDownload} title="Descargar vista">
          <Download className="h-4 w-4" />
        </Button>
        <FullscreenButton />
        <Button variant="ghost" size="sm" onClick={onClose} title="Cerrar">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="flex-1 cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* Info Panel */}
      <div className="absolute bottom-4 left-4 right-4 z-10 flex gap-4">
        <DXFInfoCard file={file} />
        {analysisData && <DXFErrorAnalysis data={analysisData} />}
      </div>

      {/* Status */}
      <div className="absolute bottom-4 right-4 z-10">
        <Card className="p-2">
          <div className="text-xs text-[#52525B] space-y-1">
            <div>Zoom: {(zoom * 100).toFixed(0)}%</div>
            <div>Rotación: {rotation}°</div>
          </div>
        </Card>
      </div>
    </div>
  )
}
