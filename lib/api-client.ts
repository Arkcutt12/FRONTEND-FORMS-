// Cliente API para el backend DXF
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

export interface HealthResponse {
  status: string
  message: string
  timestamp: string
}

export class DXFApiClient {
  private baseUrl: string

  constructor(baseUrl = "https://backend-dxf.onrender.com") {
    this.baseUrl = baseUrl
  }

  async checkHealth(): Promise<HealthResponse> {
    const response = await fetch(`${this.baseUrl}/health`)

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`)
    }

    return response.json()
  }

  async analyzeDxf(file: File): Promise<DXFAnalysisResponse> {
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

    return data
  }

  async getApiInfo(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/`)

    if (!response.ok) {
      throw new Error(`API info failed: ${response.status}`)
    }

    return response.json()
  }

  getDocsUrl(): string {
    return `${this.baseUrl}/docs`
  }
}

// Instancia singleton del cliente API
export const apiClient = new DXFApiClient()
