// Cliente API para el backend DXF con análisis de errores
export interface DXFAnalysisResponse {
  success: boolean
  statistics: {
    total_entities: number
    valid_entities: number
    phantom_entities: number
  }
  bounding_box: {
    width: number
    height: number
    area: number
    min_x: number
    min_y: number
    max_x: number
    max_y: number
  }
  cut_length: {
    total_mm: number
    total_m: number
  }
  entities: {
    valid: Array<{
      entity_type: string
      layer: string
      length: number
      points: Array<{ x: number; y: number }>
    }>
    phantom: Array<{
      entity_type: string
      layer: string
      length: number
      rejection_reason: string
    }>
  }
  error?: string
  detail?: string
}

export interface DXFErrorAnalysisResponse {
  success: boolean
  file_info: {
    filename: string
    size: number
    dxf_version: string
  }
  validation_status: "VALID" | "WARNING" | "ERROR"
  overall_score: number
  errors: Array<{
    type: "CRITICAL" | "WARNING" | "INFO"
    category: string
    message: string
    entity_type?: string
    layer?: string
    count?: number
    details?: any
  }>
  statistics: {
    total_entities: number
    valid_entities: number
    problematic_entities: number
    layers_count: number
    empty_layers: number
  }
  recommendations: Array<{
    priority: "HIGH" | "MEDIUM" | "LOW"
    action: string
    description: string
  }>
  quality_metrics: {
    geometry_integrity: number
    layer_organization: number
    drawing_standards: number
    file_optimization: number
  }
}

export interface HealthResponse {
  status: string
  message: string
  timestamp: string
}

export class DXFApiClient {
  private baseUrl: string
  private errorAnalysisUrl: string

  constructor(
    baseUrl = "https://backend-dxf.onrender.com",
    errorAnalysisUrl = "https://dxf-analyzer-api.onrender.com",
  ) {
    this.baseUrl = baseUrl
    this.errorAnalysisUrl = errorAnalysisUrl
    console.log(`🔧 DXF API Client inicializado con URLs:`)
    console.log(`   - Principal: ${this.baseUrl}`)
    console.log(`   - Análisis de errores: ${this.errorAnalysisUrl}`)
  }

  async checkHealth(): Promise<HealthResponse> {
    try {
      console.log(`🔍 Verificando salud del backend principal: ${this.baseUrl}/health`)
      const response = await fetch(`${this.baseUrl}/health`)

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`)
      }

      return response.json()
    } catch (error) {
      console.error("❌ Error en health check del backend principal:", error)
      throw error
    }
  }

  async checkErrorAnalysisHealth(): Promise<HealthResponse> {
    try {
      console.log(`🔍 Verificando salud del backend de análisis de errores...`)

      // Try multiple endpoints with better error handling
      const endpoints = [
        `${this.errorAnalysisUrl}/`,
        `${this.errorAnalysisUrl}/health`,
        `${this.errorAnalysisUrl}/docs`,
      ]

      for (const endpoint of endpoints) {
        try {
          console.log(`   Probando endpoint: ${endpoint}`)

          const response = await fetch(endpoint, {
            method: "GET",
            mode: "cors",
            headers: {
              Accept: "application/json, text/html, */*",
            },
            // Add timeout
            signal: AbortSignal.timeout(10000), // 10 second timeout
          })

          if (response.ok) {
            console.log(`✅ Endpoint disponible: ${endpoint} (${response.status})`)

            // Try to get JSON response, fallback to text
            try {
              const data = await response.json()
              return {
                status: "ok",
                message: "Service available",
                timestamp: new Date().toISOString(),
              }
            } catch {
              // If not JSON, just return success
              return {
                status: "ok",
                message: "Service available (non-JSON response)",
                timestamp: new Date().toISOString(),
              }
            }
          } else {
            console.log(`   Endpoint respondió con: ${response.status}`)
          }
        } catch (e) {
          console.log(`   Endpoint no disponible: ${endpoint} - ${e}`)
        }
      }

      throw new Error("No se pudo conectar con ningún endpoint del servicio de análisis")
    } catch (error) {
      console.error("❌ Error en health check del backend de análisis:", error)
      throw error
    }
  }

  async analyzeDxf(file: File): Promise<DXFAnalysisResponse> {
    try {
      console.log(`📤 Enviando archivo al backend principal: ${file.name}`)
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch(`${this.baseUrl}/analyze-dxf`, {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.detail || `API Error: ${response.status}`)
      }

      console.log(`✅ Análisis principal completado exitosamente`)
      return data
    } catch (error) {
      console.error("❌ Error en análisis principal:", error)
      throw error
    }
  }

  async analyzeErrors(file: File): Promise<DXFErrorAnalysisResponse> {
    try {
      console.log(`📤 Enviando archivo al backend de análisis de errores: ${file.name}`)

      // First, let's try to discover the correct endpoint
      let correctEndpoint = null
      const possibleEndpoints = [
        "/analyze",
        "/api/analyze",
        "/dxf/analyze",
        "/analysis",
        "/api/analysis",
        "/validate",
        "/api/validate",
        "/dxf/validate",
      ]

      console.log(`🔍 Intentando descubrir el endpoint correcto...`)

      // Try a simple GET request first to check CORS and availability
      try {
        const healthResponse = await fetch(`${this.errorAnalysisUrl}/`, {
          method: "GET",
          mode: "cors",
          headers: {
            Accept: "application/json",
          },
        })

        if (!healthResponse.ok) {
          console.log(`⚠️ Servicio responde con ${healthResponse.status}, usando análisis simulado`)
          throw new Error("SERVICE_UNAVAILABLE")
        }

        console.log(`✅ Servicio disponible, código: ${healthResponse.status}`)

        // Try to get API docs to discover endpoints
        try {
          const docsResponse = await fetch(`${this.errorAnalysisUrl}/openapi.json`, {
            method: "GET",
            mode: "cors",
            headers: {
              Accept: "application/json",
            },
          })

          if (docsResponse.ok) {
            const apiDocs = await docsResponse.json()
            if (apiDocs.paths) {
              const availablePaths = Object.keys(apiDocs.paths)
              console.log(`📋 Endpoints disponibles: ${availablePaths.join(", ")}`)

              // Find the first endpoint that looks like an analysis endpoint
              const analysisEndpoint = availablePaths.find(
                (path) =>
                  path.includes("analyze") ||
                  path.includes("analysis") ||
                  path.includes("validate") ||
                  path.includes("dxf"),
              )

              if (analysisEndpoint) {
                correctEndpoint = analysisEndpoint
                console.log(`🎯 Endpoint encontrado en documentación: ${correctEndpoint}`)
              }
            }
          }
        } catch (e) {
          console.log(`ℹ️ No se pudo obtener documentación OpenAPI: ${e}`)
        }
      } catch (healthError) {
        console.log(`⚠️ Servicio no disponible, usando análisis simulado. Error: ${healthError}`)
        throw new Error("SERVICE_UNAVAILABLE")
      }

      // If we couldn't discover the endpoint from docs, try the possible endpoints
      if (!correctEndpoint) {
        // Try each possible endpoint with a HEAD request to see which one exists
        for (const endpoint of possibleEndpoints) {
          try {
            console.log(`🔍 Probando endpoint: ${this.errorAnalysisUrl}${endpoint}`)
            const response = await fetch(`${this.errorAnalysisUrl}${endpoint}`, {
              method: "HEAD",
              mode: "cors",
            })

            // If we get a response that's not 404, this might be the right endpoint
            if (response.status !== 404) {
              correctEndpoint = endpoint
              console.log(`🎯 Posible endpoint encontrado: ${correctEndpoint} (${response.status})`)
              break
            }
          } catch (e) {
            // Continue to the next endpoint
          }
        }
      }

      // If we still don't have an endpoint, default to the first one
      if (!correctEndpoint) {
        correctEndpoint = possibleEndpoints[0]
        console.log(`⚠️ No se pudo determinar el endpoint correcto, usando: ${correctEndpoint}`)
      }

      const formData = new FormData()
      formData.append("file", file)

      // Try the discovered or default endpoint
      console.log(`📤 Enviando archivo a: ${this.errorAnalysisUrl}${correctEndpoint}`)
      const response = await fetch(`${this.errorAnalysisUrl}${correctEndpoint}`, {
        method: "POST",
        body: formData,
        mode: "cors",
        headers: {
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(30000), // 30 second timeout
      })

      if (response.ok) {
        const data = await response.json()
        console.log(`✅ Análisis de errores completado exitosamente en: ${correctEndpoint}`)
        return data
      } else {
        const errorText = await response.text()
        console.error(`❌ Error en análisis de errores (${response.status}): ${errorText}`)

        // If we get a 404, try the next endpoint in the list
        if (response.status === 404 && possibleEndpoints.indexOf(correctEndpoint) < possibleEndpoints.length - 1) {
          const nextEndpointIndex = possibleEndpoints.indexOf(correctEndpoint) + 1
          console.log(`🔄 Intentando con el siguiente endpoint: ${possibleEndpoints[nextEndpointIndex]}`)

          // Recursive call with modified URL to try the next endpoint
          const originalUrl = this.errorAnalysisUrl
          this.errorAnalysisUrl = `${originalUrl}${possibleEndpoints[nextEndpointIndex]}`
          try {
            const result = await this.analyzeErrors(file)
            // Restore the original URL
            this.errorAnalysisUrl = originalUrl
            return result
          } catch (e) {
            // Restore the original URL
            this.errorAnalysisUrl = originalUrl
            throw e
          }
        }

        throw new Error(`HTTP_ERROR_${response.status}: ${errorText}`)
      }
    } catch (error) {
      console.error("❌ Error en análisis de errores:", error)

      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new Error("TIMEOUT: El análisis tardó demasiado tiempo")
        }
        if (error.message === "SERVICE_UNAVAILABLE") {
          throw new Error("SERVICE_UNAVAILABLE: Servicio de análisis no disponible")
        }
        if (error.message.includes("CORS")) {
          throw new Error("CORS_ERROR: Error de política de origen cruzado")
        }
        if (error.message === "Failed to fetch") {
          throw new Error("NETWORK_ERROR: No se pudo conectar con el servicio de análisis")
        }
        if (error.message.includes("HTTP_ERROR_404")) {
          throw new Error("ENDPOINT_NOT_FOUND: El endpoint de análisis no existe")
        }
      }

      throw error
    }
  }

  async discoverEndpoints(): Promise<string[]> {
    try {
      console.log(`🔍 Descubriendo endpoints disponibles en: ${this.errorAnalysisUrl}`)

      // Intentar obtener documentación OpenAPI
      const response = await fetch(`${this.errorAnalysisUrl}/openapi.json`)

      if (response.ok) {
        const openapi = await response.json()
        const endpoints = Object.keys(openapi.paths || {})
        console.log(`📋 Endpoints descubiertos:`, endpoints)
        return endpoints
      }
    } catch (e) {
      console.log(`ℹ️ No se pudo obtener documentación OpenAPI`)
    }

    return []
  }

  async getApiInfo(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/`)

      if (!response.ok) {
        throw new Error(`API info failed: ${response.status}`)
      }

      return response.json()
    } catch (error) {
      console.error("❌ Error obteniendo info de API:", error)
      throw error
    }
  }

  getDocsUrl(): string {
    return `${this.baseUrl}/docs`
  }

  getErrorAnalysisDocsUrl(): string {
    return `${this.errorAnalysisUrl}/docs`
  }
}

// Instancia singleton del cliente API
export const apiClient = new DXFApiClient()
