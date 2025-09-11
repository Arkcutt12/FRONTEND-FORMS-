"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { apiClient, type DXFAnalysisResponse } from "@/lib/api-client"

export interface UseDXFAnalysisReturn {
  isLoading: boolean
  error: string | null
  data: DXFAnalysisResponse | null
  isConnected: boolean
  retryCount: number
  maxRetries: number
  isRetrying: boolean
  analyzeDxf: (file: File) => Promise<void>
  checkConnection: () => Promise<void>
  clearError: () => void
  clearData: () => void
  retryAnalysis: () => Promise<void>
}

const MAX_RETRIES = 5
const INITIAL_RETRY_DELAY = 2000 // 2 seconds
const MAX_RETRY_DELAY = 60000 // 1 minute

export function useDXFAnalysis(): UseDXFAnalysisReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<DXFAnalysisResponse | null>(null)
  const [isConnected, setIsConnected] = useState(false)

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
    console.log("🔄 Verificando conexión con el backend...")

    try {
      await apiClient.checkHealth()
      setIsConnected(true)
      console.log("✅ Backend: CONECTADO")
    } catch (err) {
      setIsConnected(false)
      console.error("❌ Backend: DESCONECTADO", err)
    }

    if (!isConnected) {
      setError("❌ Error de conexión con el servicio de análisis")
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

        if (isConnected) {
          try {
            const analysisResult = await apiClient.analyzeDxf(file)
            if (analysisResult.success) {
              setData(analysisResult)
              setIsRetrying(false)
              setRetryCount(0)
              console.log("✅ Análisis completado exitosamente")
              console.log(`📊 Entidades válidas: ${analysisResult.statistics.valid_entities}`)
              console.log(`⚠️ Entidades problemáticas: ${analysisResult.statistics.phantom_entities}`)
            }
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Error desconocido"
            console.error(`❌ Error en análisis: ${errorMessage}`)

            if (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError")) {
              scheduleRetry(file, currentRetry)
              return
            }

            throw new Error(`Error en análisis: ${errorMessage}`)
          }
        } else {
          scheduleRetry(file, currentRetry)
          return
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
    [isConnected, scheduleRetry],
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
    isConnected,
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
