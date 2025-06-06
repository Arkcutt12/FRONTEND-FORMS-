"use client"

import { useState, useCallback } from "react"
import { apiClient, type DXFAnalysisResponse } from "@/lib/api-client"

export interface UseDXFAnalysisReturn {
  isLoading: boolean
  error: string | null
  data: DXFAnalysisResponse | null
  isConnected: boolean
  analyzeDxf: (file: File) => Promise<void>
  checkConnection: () => Promise<void>
  clearError: () => void
  clearData: () => void
}

export function useDXFAnalysis(): UseDXFAnalysisReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<DXFAnalysisResponse | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  const checkConnection = useCallback(async () => {
    try {
      await apiClient.checkHealth()
      setIsConnected(true)
      setError(null)
      console.log("✅ Conexión con backend establecida")
    } catch (err) {
      setIsConnected(false)
      const errorMessage = err instanceof Error ? err.message : "Error de conexión desconocido"
      setError(`❌ Error de conexión: ${errorMessage}`)
      console.error("Error conectando con backend:", err)
    }
  }, [])

  const analyzeDxf = useCallback(async (file: File) => {
    if (!file) {
      setError("No se ha proporcionado ningún archivo")
      return
    }

    // Validar tipo de archivo
    if (!file.name.toLowerCase().endsWith(".dxf")) {
      setError("Por favor, selecciona un archivo DXF válido")
      return
    }

    // Validar tamaño de archivo (máximo 50MB)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      setError("El archivo es demasiado grande. Máximo permitido: 50MB")
      return
    }

    setIsLoading(true)
    setError(null)
    setData(null)

    try {
      console.log(`📤 Enviando archivo: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`)

      const result = await apiClient.analyzeDxf(file)

      if (result.success) {
        setData(result)
        console.log("✅ Análisis completado exitosamente")
        console.log(
          `📊 Estadísticas: ${result.statistics.valid_entities} válidas, ${result.statistics.phantom_entities} fantasma`,
        )
      } else {
        setError(result.error || "Error procesando el archivo DXF")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido"
      setError(`❌ Error procesando archivo: ${errorMessage}`)
      console.error("Error en análisis DXF:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const clearData = useCallback(() => {
    setData(null)
    setError(null)
  }, [])

  return {
    isLoading,
    error,
    data,
    isConnected,
    analyzeDxf,
    checkConnection,
    clearError,
    clearData,
  }
}
