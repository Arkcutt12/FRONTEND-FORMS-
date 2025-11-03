"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Ruler,
  Square,
  AlertTriangle,
  CheckCircle,
  Filter,
  Target,
  Zap,
  TrendingUp,
  Shield,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react"
import { useState } from "react"
import type { DXFMetrics } from "@/lib/dxf-loader"
import type { DXFErrorAnalysisResponse } from "@/lib/api-client"

interface DXFInfoCardProps {
  metrics: DXFMetrics
  fileName?: string
  onSheetSizeChange?: (width: number, height: number) => void
  errorAnalysis?: DXFErrorAnalysisResponse | null // Nueva prop opcional
}

export function DXFInfoCard({ metrics, fileName, onSheetSizeChange, errorAnalysis }: DXFInfoCardProps) {
  const [sheetWidth, setSheetWidth] = useState(600)
  const [sheetHeight, setSheetHeight] = useState(400)
  const [showSheetConfig, setShowSheetConfig] = useState(false)
  const [showFilterStats, setShowFilterStats] = useState(false)
  const [showAdvancedStats, setShowAdvancedStats] = useState(false)
  const [showQualityDetails, setShowQualityDetails] = useState(false) // Nuevo estado para calidad

  const formatLength = (length: number): string => {
    if (length < 1000) {
      return `${length.toFixed(1)} mm`
    } else if (length < 1000000) {
      return `${(length / 1000).toFixed(2)} m`
    } else {
      return `${(length / 1000000).toFixed(2)} km`
    }
  }

  const formatArea = (area: number): string => {
    if (area < 1000000) {
      return `${area.toFixed(0)} mm²`
    } else if (area < 1000000000000) {
      return `${(area / 1000000).toFixed(2)} m²`
    } else {
      return `${(area / 1000000000000).toFixed(2)} km²`
    }
  }

  const handleSheetSizeUpdate = () => {
    if (onSheetSizeChange) {
      onSheetSizeChange(sheetWidth, sheetHeight)
    }
  }

  const getCoverageColor = (ratio: number): string => {
    if (ratio > 0.8) return "text-red-600"
    if (ratio > 0.6) return "text-yellow-600"
    return "text-green-600"
  }

  const getTotalFiltered = () => {
    const {
      suspiciousLines,
      hiddenLayers,
      zeroLength,
      outOfBounds,
      phantomEntities,
      geometricInconsistent,
      clusterOutliers,
    } = metrics.filteredEntities
    return (
      suspiciousLines +
      hiddenLayers +
      zeroLength +
      outOfBounds +
      phantomEntities +
      geometricInconsistent +
      clusterOutliers
    )
  }

  // Función mejorada que integra datos del nuevo backend
  const getEnhancedQualityStatus = () => {
    const totalFiltered = getTotalFiltered()
    const phantomCount = metrics.filteredEntities.phantomEntities

    // Si tenemos datos del análisis de errores, los usamos para enriquecer la información
    if (errorAnalysis) {
      const { validation_status, overall_score, errors } = errorAnalysis
      const criticalErrors = errors.filter((e) => e.type === "CRITICAL").length
      const warnings = errors.filter((e) => e.type === "WARNING").length

      if (validation_status === "ERROR" || criticalErrors > 0) {
        return {
          status: "error",
          color: "text-red-600",
          bgColor: "bg-red-50 border-red-200",
          icon: AlertTriangle,
          label: "Errores Críticos",
          score: overall_score,
          details: `${criticalErrors} errores críticos detectados`,
          hasBackendData: true,
        }
      }

      if (validation_status === "WARNING" || warnings > 0) {
        return {
          status: "warning",
          color: "text-yellow-600",
          bgColor: "bg-yellow-50 border-yellow-200",
          icon: Zap,
          label: "Advertencias",
          score: overall_score,
          details: `${warnings} advertencias encontradas`,
          hasBackendData: true,
        }
      }

      if (validation_status === "VALID" && overall_score >= 90) {
        return {
          status: "excellent",
          color: "text-green-600",
          bgColor: "bg-green-50 border-green-200",
          icon: CheckCircle,
          label: "Diseño Perfecto",
          score: overall_score,
          details: "Archivo optimizado para corte láser",
          hasBackendData: true,
        }
      }

      return {
        status: "good",
        color: "text-blue-600",
        bgColor: "bg-blue-50 border-blue-200",
        icon: Shield,
        label: "Diseño Válido",
        score: overall_score,
        details: "Archivo listo para producción",
        hasBackendData: true,
      }
    }

    // Fallback al sistema anterior si no hay datos del backend
    if (totalFiltered === 0)
      return {
        status: "excellent",
        color: "text-green-600",
        bgColor: "bg-green-50 border-green-200",
        icon: CheckCircle,
        label: "Diseño Perfecto",
        score: 100,
        details: "No se detectaron artefactos",
        hasBackendData: false,
      }
    if (phantomCount === 0 && totalFiltered < 3)
      return {
        status: "very-good",
        color: "text-blue-600",
        bgColor: "bg-blue-50 border-blue-200",
        icon: Shield,
        label: "Diseño Limpio",
        score: 95,
        details: "Filtrado básico aplicado",
        hasBackendData: false,
      }
    if (phantomCount < 3 && totalFiltered < 10)
      return {
        status: "good",
        color: "text-yellow-600",
        bgColor: "bg-yellow-50 border-yellow-200",
        icon: Zap,
        label: "Diseño Válido",
        score: 85,
        details: "Algunos elementos filtrados",
        hasBackendData: false,
      }
    return {
      status: "filtered",
      color: "text-red-600",
      bgColor: "bg-red-50 border-red-200",
      icon: AlertTriangle,
      label: "Artefactos Filtrados",
      score: Math.max(70, 100 - phantomCount * 2),
      details: "Múltiples elementos filtrados",
      hasBackendData: false,
    }
  }

  const getFilteringEfficiency = () => {
    if (errorAnalysis) {
      return errorAnalysis.overall_score
    }

    const totalFiltered = getTotalFiltered()
    const phantomCount = metrics.filteredEntities.phantomEntities

    if (totalFiltered === 0) return 100
    if (phantomCount === 0) return 95
    if (phantomCount < 5) return 85
    return Math.max(70, 100 - phantomCount * 2)
  }

  const qualityInfo = getEnhancedQualityStatus()
  const filteringEfficiency = getFilteringEfficiency()

  return (
    <Card className="w-full max-w-sm bg-white shadow-sm border border-[#E4E4E7]">
      <CardHeader className="pb-3">
        <CardTitle className="text-[14px] font-medium text-[#18181B] flex items-center gap-2">
          <Target className="h-4 w-4 text-[#52525B]" />
          Análisis DXF Avanzado
          {qualityInfo.hasBackendData ? (
            <Badge variant="outline" className="text-[10px] h-4 px-1 bg-blue-50 text-blue-700 border-blue-200">
              API
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] h-4 px-1 bg-gray-50 text-gray-600 border-gray-200">
              SIM
            </Badge>
          )}
        </CardTitle>
        {fileName && (
          <p className="text-[12px] text-[#71717A] truncate" title={fileName}>
            {fileName}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Estado de Calidad Mejorado con datos del backend */}
        <div className={`p-3 rounded-md border ${qualityInfo.bgColor}`}>
          <div className="flex items-center gap-2 mb-2">
            <qualityInfo.icon className={`h-4 w-4 ${qualityInfo.color}`} />
            <h4 className={`text-[12px] font-medium ${qualityInfo.color}`}>{qualityInfo.label}</h4>
            <Badge variant="secondary" className="text-[10px] h-4 px-1">
              {qualityInfo.score}%
            </Badge>
            {qualityInfo.hasBackendData ? (
              <Badge variant="outline" className="text-[10px] h-4 px-1 bg-blue-50 text-blue-700 border-blue-200">
                API
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] h-4 px-1 bg-gray-50 text-gray-600 border-gray-200">
                SIM
              </Badge>
            )}
            {qualityInfo.hasBackendData && (
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-auto"
                onClick={() => setShowQualityDetails(!showQualityDetails)}
              >
                {showQualityDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-gray-600">
                {qualityInfo.hasBackendData ? "Puntuación general" : "Eficiencia de filtrado"}
              </span>
              <span className={`text-[12px] font-medium ${qualityInfo.color}`}>{qualityInfo.score}%</span>
            </div>
            <Progress value={qualityInfo.score} className="h-1" />
            <p className="text-[10px] text-gray-600">{qualityInfo.details}</p>
          </div>

          {/* Detalles expandibles del análisis de errores */}
          {showQualityDetails && errorAnalysis && (
            <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
              <div className="text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">Integridad Geométrica:</span>
                  <span className="font-medium">{errorAnalysis.quality_metrics.geometry_integrity}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Organización de Capas:</span>
                  <span className="font-medium">{errorAnalysis.quality_metrics.layer_organization}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estándares de Dibujo:</span>
                  <span className="font-medium">{errorAnalysis.quality_metrics.drawing_standards}%</span>
                </div>
              </div>

              {errorAnalysis.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-[10px] text-gray-600 mb-1">Problemas detectados:</p>
                  <div className="space-y-1">
                    {errorAnalysis.errors.slice(0, 2).map((error, index) => (
                      <div key={index} className="flex items-center gap-1">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            error.type === "CRITICAL"
                              ? "bg-red-500"
                              : error.type === "WARNING"
                                ? "bg-yellow-500"
                                : "bg-blue-500"
                          }`}
                        />
                        <span className="text-[9px] text-gray-600 truncate">{error.message}</span>
                      </div>
                    ))}
                    {errorAnalysis.errors.length > 2 && (
                      <p className="text-[9px] text-gray-500">+{errorAnalysis.errors.length - 2} más...</p>
                    )}
                  </div>
                </div>
              )}

              {errorAnalysis.recommendations.length > 0 && (
                <div className="mt-2">
                  <p className="text-[10px] text-gray-600 mb-1">Recomendación principal:</p>
                  <div className="flex items-center gap-1">
                    <Info className="h-3 w-3 text-blue-500" />
                    <span className="text-[9px] text-gray-600">{errorAnalysis.recommendations[0].action}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        {!qualityInfo.hasBackendData && (
          <p className="text-[9px] text-gray-500 mt-1">* Análisis simulado (servicio externo no disponible)</p>
        )}

        {/* Métricas Principales */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 p-2 bg-[#FAFAFA] rounded-md">
            <Ruler className="h-4 w-4 text-[#52525B]" />
            <div>
              <p className="text-[11px] text-[#71717A]">Longitud Corte</p>
              <p className="text-[13px] font-medium text-[#18181B]">{formatLength(metrics.totalLength)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 bg-[#FAFAFA] rounded-md">
            <Square className="h-4 w-4 text-[#52525B]" />
            <div>
              <p className="text-[11px] text-[#71717A]">Área Material</p>
              <p className="text-[13px] font-medium text-[#18181B]">{formatArea(metrics.usableMaterialArea)}</p>
            </div>
          </div>
        </div>

        {/* Dimensiones del Diseño */}
        <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
          <h4 className="text-[12px] font-medium text-blue-900 mb-2">Dimensiones Precisas</h4>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-blue-700">Ancho:</span>
              <span className="font-medium text-blue-900 ml-1">{metrics.boundingBox.width.toFixed(1)} mm</span>
            </div>
            <div>
              <span className="text-blue-700">Alto:</span>
              <span className="font-medium text-blue-900 ml-1">{metrics.boundingBox.height.toFixed(1)} mm</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-blue-200">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-blue-700">Centro del diseño:</span>
              <span className="text-[10px] font-medium text-blue-900">
                ({metrics.designStatistics.centerX.toFixed(1)}, {metrics.designStatistics.centerY.toFixed(1)})
              </span>
            </div>
          </div>
        </div>

        {/* Estadísticas Avanzadas */}
        {getTotalFiltered() > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-[13px] font-medium text-[#18181B] flex items-center gap-1">
                <Filter className="h-3 w-3" />
                Filtrado Avanzado
              </h4>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2"
                onClick={() => setShowFilterStats(!showFilterStats)}
              >
                {showFilterStats ? "Ocultar" : "Ver"}
              </Button>
            </div>

            {showFilterStats && (
              <div className="space-y-1 p-2 bg-gray-50 rounded-md text-[11px]">
                {metrics.filteredEntities.phantomEntities > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">👻 Entidades fantasma:</span>
                    <span className="font-medium text-red-600">{metrics.filteredEntities.phantomEntities}</span>
                  </div>
                )}
                {metrics.filteredEntities.suspiciousLines > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">⚠️ Líneas sospechosas:</span>
                    <span className="font-medium text-orange-600">{metrics.filteredEntities.suspiciousLines}</span>
                  </div>
                )}
                {metrics.filteredEntities.geometricInconsistent > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">📐 Inconsistencia geométrica:</span>
                    <span className="font-medium text-yellow-600">
                      {metrics.filteredEntities.geometricInconsistent}
                    </span>
                  </div>
                )}
                {metrics.filteredEntities.clusterOutliers > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">🎯 Outliers de clustering:</span>
                    <span className="font-medium text-purple-600">{metrics.filteredEntities.clusterOutliers}</span>
                  </div>
                )}
                {metrics.filteredEntities.outOfBounds > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">📍 Fuera de área:</span>
                    <span className="font-medium text-orange-600">{metrics.filteredEntities.outOfBounds}</span>
                  </div>
                )}
                {metrics.filteredEntities.hiddenLayers > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">👁️ Capas ocultas:</span>
                    <span className="font-medium text-gray-600">{metrics.filteredEntities.hiddenLayers}</span>
                  </div>
                )}
                {metrics.filteredEntities.zeroLength > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">📏 Longitud cero:</span>
                    <span className="font-medium text-gray-600">{metrics.filteredEntities.zeroLength}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Estadísticas del Diseño */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-[13px] font-medium text-[#18181B] flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Estadísticas
            </h4>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2"
              onClick={() => setShowAdvancedStats(!showAdvancedStats)}
            >
              {showAdvancedStats ? "Ocultar" : "Ver"}
            </Button>
          </div>

          {showAdvancedStats && (
            <div className="space-y-1 p-2 bg-blue-50 rounded-md text-[11px]">
              <div className="flex justify-between">
                <span className="text-blue-700">Dimensión máxima:</span>
                <span className="font-medium text-blue-900">{metrics.designStatistics.maxDimension.toFixed(1)} mm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Densidad de entidades:</span>
                <span className="font-medium text-blue-900">
                  {(metrics.designStatistics.entityDensity * 1000000).toFixed(2)}/m²
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Vectores por capa:</span>
                <span className="font-medium text-blue-900">
                  {metrics.totalLayers > 0 ? (metrics.totalVectors / metrics.totalLayers).toFixed(1) : 0}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Configuración de Hoja */}
        <div className="space-y-2">
          {showSheetConfig && (
            <div className="space-y-2 p-2 bg-[#FAFAFA] rounded-md">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[11px] text-[#71717A]">Ancho (mm)</Label>
                  <Input
                    type="number"
                    value={sheetWidth}
                    onChange={(e) => setSheetWidth(Number(e.target.value))}
                    className="h-7 text-[12px]"
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-[#71717A]">Alto (mm)</Label>
                  <Input
                    type="number"
                    value={sheetHeight}
                    onChange={(e) => setSheetHeight(Number(e.target.value))}
                    className="h-7 text-[12px]"
                  />
                </div>
              </div>
              <Button size="sm" className="w-full h-6 text-[11px]" onClick={handleSheetSizeUpdate}>
                Actualizar Análisis
              </Button>
            </div>
          )}

          {metrics.materialCoverage && (
            <div className="p-2 bg-gray-50 rounded-md">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] text-[#71717A]">Cobertura</span>
                <span className={`text-[12px] font-medium ${getCoverageColor(metrics.materialCoverage.coverageRatio)}`}>
                  {(metrics.materialCoverage.coverageRatio * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(metrics.materialCoverage.coverageRatio * 100, 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-[#71717A] mt-1">
                Hoja: {metrics.materialCoverage.sheetWidth} × {metrics.materialCoverage.sheetHeight} mm
              </p>
            </div>
          )}
        </div>

        <Separator />

        {/* Capas Válidas */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-[13px] font-medium text-[#18181B]">Capas Válidas</h4>
            <Badge variant="secondary" className="text-[11px] h-5">
              {metrics.layersWithVectors.length}
            </Badge>
          </div>

          <div className="space-y-2 max-h-32 overflow-y-auto">
            {metrics.layersWithVectors.length > 0 ? (
              metrics.layersWithVectors.map((layer) => (
                <div key={layer.name} className="flex items-center justify-between p-2 bg-[#FAFAFA] rounded-md">
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-[#18181B] truncate">{layer.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-[#71717A]">{layer.vectorCount} vectores</span>
                      {layer.totalLength > 0 && (
                        <>
                          <span className="text-[10px] text-[#A1A1AA]">•</span>
                          <span className="text-[10px] text-[#71717A]">{formatLength(layer.totalLength)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-[12px] text-[#71717A]">No se encontraron vectores válidos</p>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Estadísticas Finales */}
        <div className="grid grid-cols-2 gap-2 text-center">
          <div>
            <p className="text-[11px] text-[#71717A]">Vectores Válidos</p>
            <p className="text-[14px] font-semibold text-[#18181B]">{metrics.totalVectors}</p>
          </div>
          <div>
            <p className="text-[11px] text-[#71717A]">Precisión</p>
            <p className={`text-[14px] font-semibold ${qualityInfo.color}`}>{filteringEfficiency}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
