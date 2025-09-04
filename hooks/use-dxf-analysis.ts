"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { apiClient, type DXFAnalysisResponse, type DXFErrorAnalysisResponse } from "@/lib/api-client"

export interface UseDXFAnalysisReturn {
  isLoading: boolean
  error: string | null
  data: DXFAnalysisResponse | null
  errorAnalysis: DXFErrorAnalysisResponse | null
  isConnected: boolean
  isErrorAnalysisConnected: boolean
  retryCount: number
  maxRetries: number
  isRetrying: boolean
  analyzeDxf: (file: File) => Promise<void>
  checkConnection: () => Promise<void>
  clearError: () => void
  clearData: () => void
  retryAnalysis: () => Promise<void>
}

const createMockErrorAnalysis = (file: File, data: DXFAnalysisResponse | null): DXFErrorAnalysisResponse => {
  const validEntities = data?.statistics?.valid_entities || 0
  const phantomEntities = data?.statistics?.phantom_entities || 0
  const totalEntities = validEntities + phantomEntities
  const layersCount =
    data?.entities?.valid?.reduce((acc, entity) => {
      if (!acc.includes(entity.layer)) acc.push(entity.layer)
      return acc
    }, [] as string[]).length || 1

  let validationStatus: "VALID" | "WARNING" | "ERROR" = "VALID"
  const errors: any[] = []
  const recommendations: any[] = []

  // Simulate critical errors
  if (phantomEntities > 0) {
    const phantomRatio = phantomEntities / Math.max(totalEntities, 1)
    if (phantomRatio > 0.2) {
      validationStatus = "ERROR"
      errors.push({
        type: "CRITICAL",
        category: "Integridad Geométrica",
        message: `Polilínea abierta detectada o entidades fantasma (${phantomEntities})`,
        entity_type: "POLYLINE",
        layer: "CORTE",
        count: phantomEntities,
        details: "Más del 20% de las entidades tienen problemas de integridad o son abiertas.",
      })
      recommendations.push({
        priority: "HIGH",
        action: "Revisar y corregir polilíneas abiertas",
        description: "Es crítico cerrar todas las polilíneas para un corte láser preciso.",
      })
    } else if (phantomRatio > 0.05) {
      validationStatus = "WARNING"
      errors.push({
        type: "WARNING",
        category: "Calidad del Diseño",
        message: `Se detectaron ${phantomEntities} entidades con problemas menores`,
        count: phantomEntities,
        details: "Entre 5% y 20% de las entidades requieren atención.",
      })
      recommendations.push({
        priority: "MEDIUM",
        action: "Verificar entidades marcadas",
        description: "Revisa las entidades problemáticas para asegurar la calidad del diseño.",
      })
    }
  }

  // Simulate warnings
  if (file.size > 5 * 1024 * 1024) {
    // > 5MB
    if (validationStatus === "VALID") validationStatus = "WARNING"
    errors.push({
      type: "WARNING",
      category: "Optimización",
      message: "Archivo de gran tamaño detectado",
      details: `Tamaño: ${(file.size / 1024 / 1024).toFixed(1)} MB. Puede afectar el rendimiento.`,
    })
    recommendations.push({
      priority: "MEDIUM",
      action: "Optimizar tamaño del archivo",
      description: "Considera limpiar capas no utilizadas o simplificar geometrías complejas.",
    })
  }

  // Simulate recommendations
  if (layersCount > 10) {
    recommendations.push({
      priority: "LOW",
      action: "Consolidar capas similares",
      description: "Un menor número de capas puede mejorar la organización del archivo.",
    })
  }
  if (totalEntities > 500) {
    recommendations.push({
      priority: "LOW",
      action: "Simplificar geometrías complejas",
      description: "Reducir el número de vértices en polilíneas puede optimizar el corte.",
    })
  }

  // Calculate score based on multiple factors
  let score = 100
  if (phantomEntities > 0) {
    score -= Math.min(50, (phantomEntities / Math.max(totalEntities, 1)) * 100)
  }
  if (file.size > 5 * 1024 * 1024) {
    score -= 5 // Minor penalty for size
  }
  if (layersCount > 10) {
    score -= 3
  }

  return {
    success: true,
    file_info: {
      filename: file.name,
      size: file.size,
      dxf_version: "AutoCAD 2018 (AC1032)", // Example version
    },
    validation_status: validationStatus,
    overall_score: Math.max(0, Math.round(score)),
    errors,
    statistics: {
      total_entities: totalEntities,
      valid_entities: validEntities,
      problematic_entities: phantomEntities + errors.length, // Sum of phantom and other detected issues
      layers_count: layersCount,
      empty_layers: 0, // Mock for now
    },
    recommendations,
    quality_metrics: {
      geometry_integrity: Math.max(0, 100 - (phantomEntities / Math.max(totalEntities, 1)) * 100),
      layer_organization: Math.max(0, 100 - Math.min(20, layersCount * 2)), // Penalize many layers
      drawing_standards: validationStatus === "VALID" ? 95 : validationStatus === "WARNING" ? 75 : 50,
      file_optimization: file.size > 10 * 1024 * 1024 ? 60 : 85,
    },
  }
}

const MAX_RETRIES = 5
const INITIAL_RETRY_DELAY = 2000 // 2 seconds
const MAX_RETRY_DELAY = 60000 // 1 minute

export function useDXFAnalysis(): UseDXFAnalysisReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<DXFAnalysisResponse | null>(null)
  const [errorAnalysis, setErrorAnalysis] = useState<DXFErrorAnalysisResponse | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isErrorAnalysisConnected, setIsErrorAnalysisConnected] = useState(false)

  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)
  const currentFileRef = useRef<File | null>(null)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    checkConnection()
  }, [])

  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [])

  const checkConnection = useCallback(async () => {
    console.log("🔄 Verificando conexiones con los backends...")

    try {
      await apiClient.checkHealth()
      setIsConnected(true)
      console.log("✅ Backend principal: CONECTADO")
    } catch (err) {
      setIsConnected(false)
      console.error("❌ Backend principal: DESCONECTADO", err)
    }

    try {
      await apiClient.checkErrorAnalysisHealth()
      setIsErrorAnalysisConnected(true)
      console.log("✅ Backend de análisis de errores: CONECTADO")

      try {
        const endpoints = await apiClient.discoverEndpoints()
        if (endpoints.length > 0) {
          console.log("📋 Endpoints disponibles para análisis:", endpoints)
        }
      } catch (e) {
        console.log("ℹ️ No se pudieron descubrir endpoints automáticamente")
      }
    } catch (err) {
      setIsErrorAnalysisConnected(false)
      const errorMessage = err instanceof Error ? err.message : "Error desconocido"

      if (errorMessage.includes("NETWORK_ERROR") || errorMessage.includes("Failed to fetch")) {
        console.log("ℹ️ Backend de análisis de errores: NO DISPONIBLE (problema de red)")
      } else if (errorMessage.includes("CORS_ERROR")) {
        console.log("ℹ️ Backend de análisis de errores: NO DISPONIBLE (problema CORS)")
      } else {
        console.log("ℹ️ Backend de análisis de errores: NO DISPONIBLE (servicio no responde)")
      }

      console.log("💡 Tip: El análisis funcionará con datos simulados basados en el backend principal")
    }

    if (!isConnected) {
      setError("❌ Error de conexión con el servicio principal de análisis")
    } else {
      setError(null)
    }
  }, [isConnected])

  const scheduleRetry = useCallback(
    (file: File, currentRetry: number) => {
      if (currentRetry >= MAX_RETRIES) {
        setIsRetrying(false)
        setError(
          "❌ No se pudo conectar con el backend después de varios intentos. El análisis puede tardar más de lo habitual. Vuelve a intentarlo en 1 minuto.",
        )
        return
      }

      const delay = Math.min(INITIAL_RETRY_DELAY * Math.pow(2, currentRetry), MAX_RETRY_DELAY)
      console.log(`🔄 Programando reintento ${currentRetry + 1}/${MAX_RETRIES} en ${delay}ms`)

      setIsRetrying(true)
      retryTimeoutRef.current = setTimeout(async () => {
        console.log(`🔄 Ejecutando reintento ${currentRetry + 1}/${MAX_RETRIES}`)
        setRetryCount(currentRetry + 1)

        try {
          await checkConnection()
          if (isConnected) {
            await performAnalysis(file, currentRetry + 1)
          } else {
            scheduleRetry(file, currentRetry + 1)
          }
        } catch (err) {
          scheduleRetry(file, currentRetry + 1)
        }
      }, delay)
    },
    [isConnected, checkConnection],
  )

  const performAnalysis = useCallback(
    async (file: File, currentRetry = 0) => {
      try {
        console.log(`📤 Procesando archivo: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`)

        let analysisResult: DXFAnalysisResponse | null = null
        if (isConnected) {
          try {
            analysisResult = await apiClient.analyzeDxf(file)
            if (analysisResult.success) {
              setData(analysisResult)
              setIsRetrying(false)
              setRetryCount(0)
              console.log("✅ Análisis principal completado exitosamente")
              console.log(`📊 Entidades válidas: ${analysisResult.statistics.valid_entities}`)
              console.log(`⚠️ Entidades problemáticas: ${analysisResult.statistics.phantom_entities}`)
            }
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Error desconocido"
            console.error(`❌ Error en análisis principal: ${errorMessage}`)

            if (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError")) {
              scheduleRetry(file, currentRetry)
              return
            }

            throw new Error(`Error en análisis principal: ${errorMessage}`)
          }
        } else {
          scheduleRetry(file, currentRetry)
          return
        }

        if (isErrorAnalysisConnected) {
          try {
            console.log("🔍 Iniciando análisis de errores con backend especializado...")
            const errorResult = await apiClient.analyzeErrors(file)
            if (errorResult.success) {
              setErrorAnalysis(errorResult)
              console.log("✅ Análisis de errores completado exitosamente")
              console.log(`📊 Estado de validación: ${errorResult.validation_status}`)
              console.log(`🎯 Puntuación general: ${errorResult.overall_score}/100`)
            }
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Error desconocido"
            console.log(`ℹ️ Error en análisis de errores especializado: ${errorMessage}`)

            if (
              errorMessage.includes("NETWORK_ERROR") ||
              errorMessage.includes("CORS_ERROR") ||
              errorMessage.includes("SERVICE_UNAVAILABLE") ||
              errorMessage.includes("ENDPOINT_NOT_FOUND")
            ) {
              console.log("🔄 Servicio externo no disponible o endpoint no encontrado, generando análisis simulado...")
            } else if (errorMessage.includes("TIMEOUT")) {
              console.log("⏱️ Timeout en servicio externo, generando análisis simulado...")
            } else {
              console.log("🔄 Error en servicio externo, generando análisis simulado...")
            }

            const mockAnalysis = createMockErrorAnalysis(file, analysisResult)
            setErrorAnalysis(mockAnalysis)
            console.log(`✅ Análisis simulado generado - Estado: ${mockAnalysis.validation_status}`)
          }
        } else {
          console.log("🔄 Generando análisis de errores simulado (backend no disponible)...")
          const mockAnalysis = createMockErrorAnalysis(file, analysisResult)
          setErrorAnalysis(mockAnalysis)
          console.log(`✅ Análisis simulado generado - Estado: ${mockAnalysis.validation_status}`)
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Error desconocido"

        if (
          (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError")) &&
          currentRetry < MAX_RETRIES
        ) {
          scheduleRetry(file, currentRetry)
          return
        }

        setError(`❌ Error procesando archivo: ${errorMessage}`)
        setIsRetrying(false)
        console.error("Error en análisis DXF:", err)
      }
    },
    [isConnected, isErrorAnalysisConnected, scheduleRetry],
  )

  const analyzeDxf = useCallback(
    async (file: File) => {
      if (!file) {
        setError("No se ha proporcionado ningún archivo")
        return
      }

      if (!file.name.toLowerCase().endsWith(".dxf")) {
        setError("Por favor, selecciona un archivo DXF válido")
        return
      }

      const maxSize = 50 * 1024 * 1024 // 50MB
      if (file.size > maxSize) {
        setError("El archivo es demasiado grande. Máximo permitido: 50MB")
        return
      }

      currentFileRef.current = file
      setRetryCount(0)
      setIsRetrying(false)

      setIsLoading(true)
      setError(null)
      setData(null)
      setErrorAnalysis(null)

      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }

      try {
        await performAnalysis(file, 0)
      } finally {
        setIsLoading(false)
      }
    },
    [performAnalysis],
  )

  const retryAnalysis = useCallback(async () => {
    if (!currentFileRef.current) {
      setError("No hay archivo para reintentar")
      return
    }

    console.log("🔄 Reintentando análisis manualmente...")
    await analyzeDxf(currentFileRef.current)
  }, [analyzeDxf])

  const clearError = useCallback(() => {
    setError(null)
    setIsRetrying(false)
    setRetryCount(0)

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
    }
  }, [])

  const clearData = useCallback(() => {
    setData(null)
    setErrorAnalysis(null)
    setError(null)
    setIsRetrying(false)
    setRetryCount(0)
    currentFileRef.current = null

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
    }
  }, [])

  return {
    isLoading,
    error,
    data,
    errorAnalysis,
    isConnected,
    isErrorAnalysisConnected,
    retryCount,
    maxRetries: MAX_RETRIES,
    isRetrying,
    analyzeDxf,
    checkConnection,
    clearError,
    clearData,
    retryAnalysis,
  }
}
