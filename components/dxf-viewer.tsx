"use client"

import type React from "react"

import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  X,
  Upload,
  Eye,
  EyeOff,
  PieChart,
  Download,
  AlertTriangle,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Move,
  RotateCcw,
  Maximize2,
} from "lucide-react"
import { FullscreenButton } from "@/components/fullscreen-button"
import { FullscreenViewer } from "@/components/fullscreen-viewer"
import { DXFInfoCard } from "@/components/dxf-info-card"
import { useDXFAnalysis } from "@/hooks/use-dxf-analysis"
import { apiClient } from "@/lib/api-client"

interface DXFViewerProps {
  file: File | null
  onClose: () => void
}

export function DXFViewer({ file, onClose }: DXFViewerProps) {
  const {
    isLoading,
    error,
    data: analysisData,
    isConnected,
    analyzeDxf,
    checkConnection,
    clearError,
    errorAnalysis, // Datos del nuevo backend
  } = useDXFAnalysis()

  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showValidEntities, setShowValidEntities] = useState(true)
  const [showPhantomEntities, setShowPhantomEntities] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Estados para zoom y pan - valores más conservadores
  const [zoom, setZoom] = useState(1)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const [isPanning, setIsPanning] = useState(false)
  const [panMode, setPanMode] = useState(false)
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 })
  const [initialViewSet, setInitialViewSet] = useState(false)

  useEffect(() => {
    checkConnection()
  }, [checkConnection])

  useEffect(() => {
    if (file && isConnected) {
      analyzeDxf(file)
      // Resetear el estado de la vista inicial cuando se carga un nuevo archivo
      setInitialViewSet(false)
      setZoom(1)
      setPanX(0)
      setPanY(0)
    }
  }, [file, isConnected, analyzeDxf])

  // Función para centrar el diseño automáticamente
  const centerDesign = useCallback(() => {
    if (!analysisData || !canvasRef.current) return

    const canvas = canvasRef.current
    const bbox = analysisData.bounding_box

    // Calcular el zoom para que el diseño ocupe aproximadamente el 70% de la pantalla
    const padding = 80
    const scaleX = (canvas.width - padding * 2) / bbox.width
    const scaleY = (canvas.height - padding * 2) / bbox.height
    const optimalZoom = Math.min(scaleX, scaleY) * 0.7 // 70% del espacio disponible

    // Establecer zoom y centrar
    setZoom(optimalZoom)
    setPanX(0) // Centrado perfecto
    setPanY(0) // Centrado perfecto

    // Marcar que la vista inicial ya se ha establecido
    setInitialViewSet(true)
  }, [analysisData])

  // Centrar automáticamente cuando se cargan los datos
  useEffect(() => {
    if (analysisData && !initialViewSet) {
      // Pequeño retraso para asegurar que el canvas está listo
      const timer = setTimeout(() => {
        centerDesign()
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [analysisData, initialViewSet, centerDesign])

  const drawVisualization = useCallback(
    (data: typeof analysisData) => {
      if (!data) return

      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // Configurar canvas
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight

      // Limpiar canvas
      ctx.fillStyle = "#FAFAFA"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Aplicar transformaciones - centrado exacto
      ctx.save()

      // Trasladar al centro del canvas y aplicar pan
      ctx.translate(canvas.width / 2 + panX, canvas.height / 2 + panY)

      // Aplicar zoom
      ctx.scale(zoom, zoom)

      // Calcular el centro del bounding box del diseño
      const bbox = data.bounding_box
      const designCenterX = bbox.min_x + bbox.width / 2
      const designCenterY = bbox.min_y + bbox.height / 2

      // Trasladar para que el centro del diseño esté en el origen
      ctx.translate(-designCenterX, designCenterY) // Invertir Y para coordenadas correctas

      // Dibujar grid sutil solo si el zoom es suficiente
      if (zoom > 0.8) {
        ctx.strokeStyle = "#F0F0F0"
        ctx.lineWidth = 0.5 / zoom
        ctx.setLineDash([3 / zoom, 3 / zoom])

        const gridSize = 25
        const range = Math.max(bbox.width, bbox.height) * 0.6 // Área limitada alrededor del diseño
        const startX = designCenterX - range
        const endX = designCenterX + range
        const startY = designCenterY - range
        const endY = designCenterY + range

        for (let x = Math.floor(startX / gridSize) * gridSize; x <= endX; x += gridSize) {
          ctx.beginPath()
          ctx.moveTo(x, startY)
          ctx.lineTo(x, endY)
          ctx.stroke()
        }

        for (let y = Math.floor(startY / gridSize) * gridSize; y <= endY; y += gridSize) {
          ctx.beginPath()
          ctx.moveTo(startX, y)
          ctx.lineTo(endX, y)
          ctx.stroke()
        }
        ctx.setLineDash([])
      }

      // Dibujar entidades válidas - vectores azules
      ctx.strokeStyle = "#2563EB"
      ctx.lineWidth = 1.5 / zoom
      ctx.lineCap = "round"
      ctx.lineJoin = "round"

      data.entities.valid.forEach((entity) => {
        if (entity.points.length >= 2) {
          ctx.beginPath()
          entity.points.forEach((point, index) => {
            if (index === 0) {
              ctx.moveTo(point.x, -point.y) // Invertir Y para coordenadas correctas
            } else {
              ctx.lineTo(point.x, -point.y)
            }
          })

          // Cerrar polígonos si es necesario
          if (entity.entity_type === "LWPOLYLINE" || entity.entity_type === "POLYLINE") {
            ctx.closePath()
          }

          ctx.stroke()
        }
      })

      // Dibujar bounding box sutil
      ctx.strokeStyle = "#10B981"
      ctx.lineWidth = 0.8 / zoom
      ctx.setLineDash([4 / zoom, 4 / zoom])
      ctx.strokeRect(bbox.min_x, -bbox.max_y, bbox.width, bbox.height)
      ctx.setLineDash([])

      // Punto central de referencia (muy sutil)
      if (zoom > 1.5) {
        ctx.fillStyle = "#EF4444"
        ctx.beginPath()
        ctx.arc(designCenterX, -designCenterY, 2 / zoom, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.restore()
    },
    [zoom, panX, panY],
  )

  // Redibujar cuando cambien los datos o las transformaciones
  useEffect(() => {
    if (analysisData) {
      drawVisualization(analysisData)
    }
  }, [analysisData, drawVisualization])

  // Funciones de zoom con límites más conservadores
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev * 1.15, 5)) // Límite máximo más bajo
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev / 1.15, 0.2)) // Límite mínimo más alto
  }

  const handleResetView = () => {
    centerDesign() // Usar la función de centrado en lugar de resetear a 1
  }

  const handleFitToView = () => {
    centerDesign()
  }

  // Manejo de eventos del mouse con límites de pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (panMode) {
      setIsPanning(true)
      setLastMousePos({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && panMode && analysisData) {
      const deltaX = e.clientX - lastMousePos.x
      const deltaY = e.clientY - lastMousePos.y

      // Limitar el pan para que no se aleje demasiado del diseño
      const canvas = canvasRef.current
      if (!canvas) return

      const bbox = analysisData.bounding_box
      const maxPan = Math.max(bbox.width, bbox.height) * zoom * 0.5 // Límite basado en el tamaño del diseño

      setPanX((prev) => Math.max(-maxPan, Math.min(maxPan, prev + deltaX)))
      setPanY((prev) => Math.max(-maxPan, Math.min(maxPan, prev + deltaY)))

      setLastMousePos({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseUp = () => {
    setIsPanning(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.92 : 1.08 // Zoom más suave
    setZoom((prev) => Math.max(0.2, Math.min(5, prev * delta)))
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const exportResults = () => {
    if (!analysisData) return

    const dataStr = JSON.stringify(analysisData, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })

    const link = document.createElement("a")
    link.href = URL.createObjectURL(dataBlob)
    link.download = `${file?.name || "dxf"}-analysis-results.json`
    link.click()
  }

  const openApiDocs = () => {
    window.open(apiClient.getDocsUrl(), "_blank")
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
    // Resetear la vista inicial cuando se cambia a pantalla completa
    setInitialViewSet(false)
  }

  // Convertir datos de analysisData a DXFMetrics para DXFInfoCard
  const convertToMetrics = () => {
    if (!analysisData) return null

    return {
      totalLayers: 1,
      totalVectors: analysisData.statistics.valid_entities,
      totalLength: analysisData.cut_length.total_mm,
      usableMaterialArea: analysisData.bounding_box.area,
      boundingBox: {
        width: analysisData.bounding_box.width,
        height: analysisData.bounding_box.height,
        minX: analysisData.bounding_box.min_x,
        maxX: analysisData.bounding_box.max_x,
        minY: analysisData.bounding_box.min_y,
        maxY: analysisData.bounding_box.max_y,
      },
      layersWithVectors: analysisData.entities.valid.reduce((acc, entity) => {
        const existingLayer = acc.find((layer) => layer.name === entity.layer)
        if (existingLayer) {
          existingLayer.vectorCount++
          existingLayer.totalLength += entity.length
        } else {
          acc.push({
            name: entity.layer,
            entities: [],
            vectorCount: 1,
            totalLength: entity.length,
            isHidden: false,
          })
        }
        return acc
      }, [] as any[]),
      filteredEntities: {
        suspiciousLines: 0,
        hiddenLayers: 0,
        zeroLength: 0,
        outOfBounds: 0,
        phantomEntities: analysisData.statistics.phantom_entities,
        geometricInconsistent: 0,
        clusterOutliers: 0,
      },
      designStatistics: {
        centerX: analysisData.bounding_box.min_x + analysisData.bounding_box.width / 2,
        centerY: analysisData.bounding_box.min_y + analysisData.bounding_box.height / 2,
        maxDimension: Math.max(analysisData.bounding_box.width, analysisData.bounding_box.height),
        entityDensity: analysisData.statistics.valid_entities / analysisData.bounding_box.area,
      },
    }
  }

  const metrics = convertToMetrics()

  return (
    <>
      <div className="relative w-full h-full bg-[#FAFAFA] rounded-lg overflow-hidden">
        <FullscreenButton onClick={toggleFullscreen} />

        {/* Controles de zoom y navegación */}
        {analysisData && (
          <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
            <div className="bg-white rounded-lg shadow-md p-2 flex flex-col gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleZoomIn} title="Zoom In">
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleZoomOut} title="Zoom Out">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant={panMode ? "default" : "outline"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setPanMode(!panMode)}
                title="Modo Pan"
              >
                <Move className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={handleFitToView}
                title="Centrar Diseño"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleResetView} title="Reset Vista">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            {/* Indicador de zoom */}
            <div className="bg-white rounded-lg shadow-md px-3 py-1">
              <span className="text-xs font-medium text-gray-600">{Math.round(zoom * 100)}%</span>
            </div>

            {/* Indicador de modo pan */}
            {panMode && (
              <div className="bg-blue-100 border border-blue-200 rounded-lg px-3 py-1">
                <span className="text-xs font-medium text-blue-700">Modo Pan Activo</span>
              </div>
            )}
          </div>
        )}

        {/* Controles superiores */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          {analysisData && (
            <>
              <Button
                variant="outline"
                size="icon"
                className="bg-white shadow-md"
                onClick={exportResults}
                title="Exportar resultados"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="bg-white shadow-md"
                onClick={openApiDocs}
                title="Ver documentación API"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="bg-white shadow-md"
                onClick={() => setShowValidEntities(!showValidEntities)}
                title="Mostrar capas"
              >
                {showValidEntities ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="bg-white shadow-md"
                onClick={() => setShowPhantomEntities(!showPhantomEntities)}
                title="Entidades fantasma"
              >
                <PieChart className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button variant="outline" size="icon" className="bg-white shadow-md" onClick={onClose} title="Cerrar">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Panel de información - usando DXFInfoCard con datos del nuevo backend */}
        {metrics && (
          <div className="absolute top-4 left-16 z-10 w-80">
            <DXFInfoCard
              metrics={metrics}
              fileName={file?.name}
              errorAnalysis={errorAnalysis} // Pasar datos del nuevo backend
            />
          </div>
        )}

        {/* Instrucciones de navegación simplificadas */}
        {analysisData && (
          <div className="absolute bottom-4 left-4 z-10">
            <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md p-3 max-w-xs">
              <h4 className="text-xs font-medium text-gray-800 mb-2">Navegación Centrada:</h4>
              <div className="space-y-1 text-xs text-gray-600">
                <div>
                  • <strong>Scroll:</strong> Zoom preciso
                </div>
                <div>
                  • <strong>Pan:</strong> Movimiento limitado
                </div>
                <div>
                  • <strong>Centrar:</strong> Volver al centro
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Estados de carga y error */}
        {!isConnected && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#FAFAFA]/90">
            <div className="bg-white p-6 rounded-lg shadow-md max-w-md text-center">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-[16px] font-medium text-[#18181B] mb-2">Conectando con Backend</h3>
              <p className="text-[13px] text-[#52525B] mb-4">Verificando conexión con backend-dxf.onrender.com...</p>
              <div className="flex gap-2 justify-center">
                <Button onClick={checkConnection} variant="outline">
                  Reintentar Conexión
                </Button>
                <Button onClick={openApiDocs} variant="ghost" size="sm">
                  Ver API Docs
                </Button>
              </div>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#FAFAFA]/80">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 border-4 border-[#E4E4E7] border-t-[#18181B] rounded-full animate-spin"></div>
              <p className="mt-4 text-[13px] text-[#52525B]">Procesando archivo DXF...</p>
              <p className="text-[11px] text-[#71717A]">Conectado con backend especializado</p>
              {file && (
                <p className="text-[10px] text-[#A1A1AA] mt-1">
                  {file.name} • {formatFileSize(file.size)}
                </p>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#FAFAFA]/90">
            <div className="bg-white p-6 rounded-lg shadow-md max-w-md">
              <AlertTriangle className="h-8 w-8 text-red-500 mb-4" />
              <h3 className="text-[16px] font-medium text-[#18181B] mb-2">Error de Procesamiento</h3>
              <p className="text-[13px] text-[#52525B] mb-4">{error}</p>
              <div className="flex gap-2">
                <Button onClick={clearError} variant="outline">
                  Cerrar
                </Button>
                <Button onClick={checkConnection}>Reintentar</Button>
              </div>
            </div>
          </div>
        )}

        {/* Canvas de visualización con eventos de mouse */}
        <canvas
          ref={canvasRef}
          className={`w-full h-full ${panMode ? "cursor-grab" : "cursor-default"} ${isPanning ? "cursor-grabbing" : ""}`}
          style={{ display: analysisData && !isLoading && !error ? "block" : "none" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        />

        {/* Estado inicial */}
        {!file && !isLoading && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Upload className="h-16 w-16 text-[#A1A1AA] mx-auto mb-4" />
              <h3 className="text-[16px] font-medium text-[#18181B] mb-2">Selecciona un archivo DXF</h3>
              <p className="text-[13px] text-[#52525B]">
                Conectado con backend especializado para análisis profesional
              </p>
              <p className="text-[11px] text-[#A1A1AA] mt-1">backend-dxf.onrender.com</p>
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen viewer con las mismas funcionalidades */}
      {isFullscreen && (
        <FullscreenViewer isOpen={isFullscreen} onClose={toggleFullscreen} title={file?.name || "DXF Viewer"}>
          <div className="w-full h-full flex items-center justify-center">
            <canvas
              ref={canvasRef}
              className={`max-w-full max-h-full ${panMode ? "cursor-grab" : "cursor-default"} ${isPanning ? "cursor-grabbing" : ""}`}
              style={{ display: analysisData ? "block" : "none" }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
            />
          </div>
        </FullscreenViewer>
      )}
    </>
  )
}
