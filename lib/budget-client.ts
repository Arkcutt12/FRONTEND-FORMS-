export interface BudgetRequest {
  cliente: {
    nombre: string
    email: string
    telefono: string
  }
  pedido: {
    archivos: Array<{
      nombre: string
      tamaño: string
      tipo: string
    }>
    archivo_validado: boolean
    longitud_vector_total_mm: number
    area_material_mm2: number
    capas: Array<{
      nombre: string
      vectores: number
      longitud_mm: number
      area_material: number
    }>
    material_seleccionado: string
    proveedor_material: "arkcutt" | "cliente"
    detalles_material?: {
      grosor?: number
      color?: string
      tipo?: string
    }
    ubicacion: {
      tipo: "tienda" | "domicilio"
      ciudad?: string
      direccion_completa?: string
    }
    urgente: boolean
  }
}

export interface BudgetResponse {
  presupuesto: {
    numero_presupuesto: string
    fecha_generacion: string
    subtotal: number
    iva: number
    total: number
    moneda: string
    validez_dias: number
  }
  desglose: {
    corte_laser: {
      longitud_total_m: number
      precio_por_metro: number
      subtotal: number
    }
    material?: {
      tipo: string
      cantidad: number
      precio_unitario: number
      subtotal: number
    }
    urgencia?: {
      recargo_porcentaje: number
      subtotal: number
    }
    entrega?: {
      tipo: string
      precio: number
    }
  }
  condiciones: {
    tiempo_entrega_dias: number
    forma_pago: string[]
    garantia_meses: number
    notas?: string[]
  }
  contacto: {
    empresa: string
    telefono: string
    email: string
    web: string
  }
}

export class BudgetClient {
  private baseUrl: string

  constructor(baseUrl = "/api") {
    this.baseUrl = baseUrl
  }

  async calculateBudget(completeFormData: any): Promise<BudgetResponse> {
    console.log("[v0] Starting budget calculation with data:", completeFormData)
    console.log("[v0] API URL:", `${this.baseUrl}/calculate-budget`)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

      const response = await fetch(`${this.baseUrl}/calculate-budget`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(completeFormData),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      console.log("[v0] Response status:", response.status)
      console.log("[v0] Response headers:", Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] Error response body:", errorText)
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
      }

      const data = await response.json()
      console.log("[v0] Budget calculation successful:", data)
      return data
    } catch (error) {
      console.error("[v0] Budget calculation error:", error)

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new Error("El servidor está tardando demasiado en responder. Por favor, inténtalo de nuevo.")
        }
        if (error.message.includes("Failed to fetch")) {
          throw new Error(
            "No se pudo conectar con el servidor de presupuestos. Verifica tu conexión a internet e inténtalo de nuevo.",
          )
        }
        if (error.message.includes("HTTP error")) {
          throw new Error(`Error del servidor: ${error.message}`)
        }
      }

      throw new Error("No se pudo calcular el presupuesto. Inténtalo de nuevo más tarde.")
    }
  }

  async generatePDF(completeFormData: any): Promise<Blob> {
    console.log("[v0] Starting PDF download from backend")

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      const response = await fetch(`${this.baseUrl}/download-pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/pdf",
        },
        body: JSON.stringify(completeFormData),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      console.log("[v0] PDF download response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] PDF download error response:", errorText)
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
      }

      const blob = await response.blob()
      console.log("[v0] PDF download successful, size:", blob.size)
      return blob
    } catch (error) {
      console.error("[v0] PDF download error:", error)

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new Error("La descarga del PDF está tardando demasiado. Por favor, inténtalo de nuevo.")
        }
        if (error.message.includes("Failed to fetch")) {
          throw new Error("No se pudo conectar con el servidor para descargar el PDF. Verifica tu conexión a internet.")
        }
      }

      throw new Error("No se pudo descargar el PDF. Inténtalo de nuevo más tarde.")
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log("[v0] Testing connection to backend")
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout for connection test

      const response = await fetch(`${this.baseUrl}/calculate-budget`, {
        method: "OPTIONS",
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      console.log("[v0] Connection test result:", response.status)
      return response.ok || response.status === 405 // 405 Method Not Allowed is also acceptable
    } catch (error) {
      console.error("[v0] Connection test failed:", error)
      return false
    }
  }
}
