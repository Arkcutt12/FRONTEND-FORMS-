"use client"

import type React from "react"

import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import {
  X,
  Upload,
  Eye,
  EyeOff,
  BarChart3,
  PieChart,
  Download,
  AlertTriangle,
  CheckCircle,
  Zap,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Move,
  RotateCcw,
  Maximize2,
} from "lucide-react"
import { FullscreenButton } from "@/components/fullscreen-button"
import { FullscreenViewer } from "@/components/fullscreen-viewer"
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

  const getQualityStatus = () => {
    if (!analysisData) return { status: "unknown", color: "text-gray-600", icon: AlertTriangle, label: "Sin datos" }

    const totalFiltered = analysisData.statistics.phantom_entities
    const phantomCount = analysisData.statistics.phantom_entities

    if (totalFiltered === 0)
      return {
        status: "excellent",
        color: "text-green-600",
        bgColor: "bg-green-50 border-green-200",
        icon: CheckCircle,
        label: "Diseño Perfecto",
      }
    if (phantomCount < 3)
      return {
        status: "good",
        color: "text-blue-600",
        bgColor: "bg-blue-50 border-blue-200",
        icon: Zap,
        label: "Diseño Limpio",
      }
    return {
      status: "filtered",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 border-yellow-200",
      icon: AlertTriangle,
      label: "Artefactos Filtrados",
    }
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

  const qualityInfo = getQualityStatus()

  // Función para agrupar entidades por capas
  const groupEntitiesByLayer = (
    entities: Array<{ entity_type: string; layer: string; length: number; points: Array<{ x: number; y: number }> }>,
  ) => {
    const layerMap = new Map<
      string,
      {
        name: string
        entityCount: number
        totalLength: number
        entities: typeof entities
        entityTypes: Set<string>
      }
    >()

    entities.forEach((entity) => {
      const layerName = entity.layer || "0" // Default layer

      if (!layerMap.has(layerName)) {
        layerMap.set(layerName, {
          name: layerName,
          entityCount: 0,
          totalLength: 0,
          entities: [],
          entityTypes: new Set(),
        })
      }

      const layer = layerMap.get(layerName)!
      layer.entityCount++
      layer.totalLength += entity.length
      layer.entities.push(entity)
      layer.entityTypes.add(entity.entity_type)
    })

    return Array.from(layerMap.values()).sort((a, b) => b.entityCount - a.entityCount)
  }

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

        {/* Panel de información */}
        {analysisData && (
          <div className="absolute top-4 left-16 z-10 w-80">
            <Card className="bg-white shadow-lg border border-[#E4E4E7]">
              <CardHeader className="pb-3">
                <CardTitle className="text-[14px] font-medium text-[#18181B] flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-[#52525B]" />
                  Análisis DXF Profesional
                  <Badge variant="outline" className="text-[10px] h-4 px-1 bg-green-50 text-green-700 border-green-200">
                    API
                  </Badge>
                </CardTitle>
                {file && (
                  <p className="text-[12px] text-[#71717A] truncate" title={file.name}>
                    {file.name} ({formatFileSize(file.size)})
                  </p>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Estado de calidad */}
                <div className={`p-3 rounded-md border ${qualityInfo.bgColor}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <qualityInfo.icon className={`h-4 w-4 ${qualityInfo.color}`} />
                    <h4 className={`text-[12px] font-medium ${qualityInfo.color}`}>{qualityInfo.label}</h4>
                    <Badge variant="secondary" className="text-[10px] h-4 px-1">
                      {Math.round(
                        (analysisData.statistics.valid_entities / analysisData.statistics.total_entities) * 100 || 0,
                      )}
                      %
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] text-gray-600">Entidades válidas</span>
                      <span className={`text-[11px] font-medium ${qualityInfo.color}`}>
                        {analysisData.statistics.valid_entities} / {analysisData.statistics.total_entities}
                      </span>
                    </div>
                    <Progress
                      value={(analysisData.statistics.valid_entities / analysisData.statistics.total_entities) * 100}
                      className="h-1"
                    />
                  </div>
                </div>

                {/* Métricas principales */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2 bg-[#FAFAFA] rounded-md">
                    <p className="text-[11px] text-[#71717A]">Longitud Corte</p>
                    <p className="text-[13px] font-medium text-[#18181B]">
                      {analysisData.cut_length.total_m.toFixed(2)} m
                    </p>
                    <p className="text-[10px] text-[#A1A1AA]">{analysisData.cut_length.total_mm.toFixed(0)} mm</p>
                  </div>
                  <div className="p-2 bg-[#FAFAFA] rounded-md">
                    <p className="text-[11px] text-[#71717A]">Capas Activas</p>
                    <p className="text-[13px] font-medium text-[#18181B]">
                      {groupEntitiesByLayer(analysisData.entities.valid).length}
                    </p>
                    <p className="text-[10px] text-[#A1A1AA]">{analysisData.statistics.valid_entities} entidades</p>
                  </div>
                </div>

                {/* Dimensiones */}
                <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                  <h4 className="text-[12px] font-medium text-blue-900 mb-2">Dimensiones Precisas</h4>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-blue-700">Ancho:</span>
                      <span className="font-medium text-blue-900 ml-1">
                        {analysisData.bounding_box.width.toFixed(1)} mm
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-700">Alto:</span>
                      <span className="font-medium text-blue-900 ml-1">
                        {analysisData.bounding_box.height.toFixed(1)} mm
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-blue-200">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-blue-700">Coordenadas:</span>
                      <span className="text-[10px] font-medium text-blue-900">
                        ({analysisData.bounding_box.min_x.toFixed(1)}, {analysisData.bounding_box.min_y.toFixed(1)}) → (
                        {analysisData.bounding_box.max_x.toFixed(1)}, {analysisData.bounding_box.max_y.toFixed(1)})
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Capas del archivo */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[13px] font-medium text-[#18181B]">Capas del Archivo</h4>
                    <Badge variant="secondary" className="text-[11px] h-5">
                      {groupEntitiesByLayer(analysisData.entities.valid).length}
                    </Badge>
                  </div>

                  {showValidEntities && (
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {groupEntitiesByLayer(analysisData.entities.valid)
                        .slice(0, 6)
                        .map((layer, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-[#FAFAFA] rounded-md">
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] font-medium text-[#18181B] truncate">{layer.name}</p>
                              <p className="text-[10px] text-[#71717A]">
                                {layer.entityCount} entidades • {layer.totalLength.toFixed(1)}mm
                              </p>
                              <p className="text-[9px] text-[#A1A1AA]">{Array.from(layer.entityTypes).join(", ")}</p>
                            </div>
                          </div>
                        ))}
                      {groupEntitiesByLayer(analysisData.entities.valid).length > 6 && (
                        <p className="text-[11px] text-[#71717A] text-center">
                          +{groupEntitiesByLayer(analysisData.entities.valid).length - 6} capas más...
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Entidades fantasma */}
                {analysisData.statistics.phantom_entities > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[13px] font-medium text-[#18181B]">Entidades Fantasma</h4>
                      <Badge variant="destructive" className="text-[11px] h-5">
                        {analysisData.statistics.phantom_entities}
                      </Badge>
                    </div>

                    {showPhantomEntities && (
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {analysisData.entities.phantom.slice(0, 3).map((entity, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded-md">
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] font-medium text-red-900 truncate">{entity.entity_type}</p>
                              <p className="text-[10px] text-red-700 italic">{entity.rejection_reason}</p>
                              <p className="text-[10px] text-red-600">
                                {entity.layer} • {entity.length.toFixed(1)}mm
                              </p>
                            </div>
                          </div>
                        ))}
                        {analysisData.entities.phantom.length > 3 && (
                          <p className="text-[11px] text-red-600 text-center">
                            +{analysisData.entities.phantom.length - 3} más filtradas...
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
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
