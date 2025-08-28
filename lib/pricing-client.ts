import type { PricingRequestData, PricingResponse } from "@/app/api/pricing/route"
import type { SubmitRequestResponse } from "@/app/api/submit-request/route"

export class PricingClient {
  private baseUrl: string

  constructor(baseUrl = "") {
    this.baseUrl = baseUrl
  }

  async calculatePricing(data: PricingRequestData): Promise<PricingResponse> {
    try {
      console.log("[v0] PricingClient: Enviando datos para cálculo de precio")

      const response = await fetch(`${this.baseUrl}/api/pricing`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP Error: ${response.status}`)
      }

      const result = await response.json()
      console.log("[v0] PricingClient: Precio calculado exitosamente")

      return result
    } catch (error) {
      console.error("[v0] PricingClient Error:", error)
      throw error
    }
  }

  async submitRequest(data: PricingRequestData): Promise<SubmitRequestResponse> {
    try {
      console.log("[v0] PricingClient: Enviando solicitud completa")

      const response = await fetch(`${this.baseUrl}/api/submit-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP Error: ${response.status}`)
      }

      const result = await response.json()
      console.log("[v0] PricingClient: Solicitud enviada exitosamente")

      return result
    } catch (error) {
      console.error("[v0] PricingClient Error:", error)
      throw error
    }
  }
}

// Instancia singleton del cliente
export const pricingClient = new PricingClient()
