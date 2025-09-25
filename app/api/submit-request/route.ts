import { type NextRequest, NextResponse } from "next/server"
import type { PricingRequestData } from "../pricing/route"

export interface SubmitRequestResponse {
  success: boolean
  request_id: string
  mensaje: string
  presupuesto?: {
    precio_total: number
    tiempo_estimado: string
  }
  error?: string
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Submit Request API: Procesando solicitud completa")

    const data: PricingRequestData = await request.json()

    // Generar ID único para la solicitud
    const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    console.log(`[v0] Submit Request API: Solicitud generada con ID: ${requestId}`)

    // Por ahora, simularemos el proceso (como estaba originalmente)
    const response: SubmitRequestResponse = {
      success: true,
      request_id: requestId,
      mensaje: "Solicitud enviada correctamente. Recibirás el presupuesto en tu email en las próximas horas.",
      presupuesto: {
        precio_total: 46.25, // Precio simulado
        tiempo_estimado: data.pedido.urgente ? "24 horas" : "3-5 días laborables",
      },
    }

    console.log("[v0] Submit Request API: Solicitud procesada exitosamente")

    return NextResponse.json(response)
  } catch (error) {
    console.error("[v0] Submit Request API Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor al procesar la solicitud",
      },
      { status: 500 },
    )
  }
}
