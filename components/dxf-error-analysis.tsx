"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, AlertTriangle, XCircle, Info, Target, Zap, TrendingUp } from "lucide-react"
import type { DXFErrorAnalysisResponse } from "@/lib/api-client"

interface DXFErrorAnalysisProps {
  analysis: DXFErrorAnalysisResponse
}

export function DXFErrorAnalysis({ analysis }: DXFErrorAnalysisProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "VALID":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "WARNING":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "ERROR":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "VALID":
        return "bg-green-100 text-green-800 border-green-200"
      case "WARNING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "ERROR":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-blue-100 text-blue-800 border-blue-200"
    }
  }

  const getErrorIcon = (type: string) => {
    switch (type) {
      case "CRITICAL":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "WARNING":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "INFO":
        return <Info className="h-4 w-4 text-blue-500" />
      default:
        return <Info className="h-4 w-4 text-gray-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-100 text-red-800"
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800"
      case "LOW":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className="space-y-6">
      {/* Header con estado general */}
      <Card className="border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(analysis.validation_status)}
              Análisis de Calidad DXF
            </CardTitle>
            <Badge className={getStatusColor(analysis.validation_status)}>{analysis.validation_status}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Puntuación General</span>
                <span className={`text-2xl font-bold ${getScoreColor(analysis.overall_score)}`}>
                  {analysis.overall_score}/100
                </span>
              </div>
              <Progress value={analysis.overall_score} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Archivo:</span>
                <span className="font-medium">{analysis.file_info.filename}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Versión DXF:</span>
                <span className="font-medium">{analysis.file_info.dxf_version}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tamaño:</span>
                <span className="font-medium">{(analysis.file_info.size / 1024).toFixed(1)} KB</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas de calidad */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Métricas de Calidad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">Integridad Geométrica</span>
                <span className="font-medium">{analysis.quality_metrics.geometry_integrity}%</span>
              </div>
              <Progress value={analysis.quality_metrics.geometry_integrity} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">Organización de Capas</span>
                <span className="font-medium">{analysis.quality_metrics.layer_organization}%</span>
              </div>
              <Progress value={analysis.quality_metrics.layer_organization} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">Estándares de Dibujo</span>
                <span className="font-medium">{analysis.quality_metrics.drawing_standards}%</span>
              </div>
              <Progress value={analysis.quality_metrics.drawing_standards} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">Optimización de Archivo</span>
                <span className="font-medium">{analysis.quality_metrics.file_optimization}%</span>
              </div>
              <Progress value={analysis.quality_metrics.file_optimization} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Estadísticas del Archivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{analysis.statistics.total_entities}</div>
              <div className="text-sm text-gray-600">Total Entidades</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{analysis.statistics.valid_entities}</div>
              <div className="text-sm text-gray-600">Válidas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{analysis.statistics.problematic_entities}</div>
              <div className="text-sm text-gray-600">Problemáticas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{analysis.statistics.layers_count}</div>
              <div className="text-sm text-gray-600">Capas</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs para errores y recomendaciones */}
      <Tabs defaultValue="errors" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="errors" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Errores ({analysis.errors.length})
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Recomendaciones ({analysis.recommendations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="errors" className="space-y-3">
          {analysis.errors.length === 0 ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>¡Excelente! No se encontraron errores en el archivo DXF.</AlertDescription>
            </Alert>
          ) : (
            analysis.errors.map((error, index) => (
              <Alert key={index} className="border-l-4 border-l-red-500">
                <div className="flex items-start gap-3">
                  {getErrorIcon(error.type)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {error.category}
                      </Badge>
                      {error.entity_type && (
                        <Badge variant="secondary" className="text-xs">
                          {error.entity_type}
                        </Badge>
                      )}
                      {error.count && (
                        <Badge variant="destructive" className="text-xs">
                          {error.count} ocurrencias
                        </Badge>
                      )}
                    </div>
                    <AlertDescription className="text-sm">{error.message}</AlertDescription>
                    {error.layer && <div className="text-xs text-gray-500 mt-1">Capa: {error.layer}</div>}
                  </div>
                </div>
              </Alert>
            ))
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-3">
          {analysis.recommendations.length === 0 ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>El archivo está optimizado. No hay recomendaciones adicionales.</AlertDescription>
            </Alert>
          ) : (
            analysis.recommendations.map((rec, index) => (
              <Alert key={index} className="border-l-4 border-l-blue-500">
                <div className="flex items-start gap-3">
                  <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getPriorityColor(rec.priority)}>{rec.priority}</Badge>
                      <span className="font-medium text-sm">{rec.action}</span>
                    </div>
                    <AlertDescription className="text-sm">{rec.description}</AlertDescription>
                  </div>
                </div>
              </Alert>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
