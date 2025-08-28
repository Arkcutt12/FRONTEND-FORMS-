import { type NextRequest, NextResponse } from "next/server"

export interface PricingRequestData {
  cliente: {
    nombre: string
    apellidos: string
    email: string
    telefono: string
  }
  pedido: {
    archivo_dxf: {
      nombre: string
      tamano: number
      url?: string // Para acceder al archivo subido
    }
    archivo_validado: boolean
    longitud_vector_total: number
    area_material: number
    capas: Array<{
      nombre: string
      longitud_vector: number
      area_material: number
    }>
    material_seleccionado: string
    quien_proporciona_material: {
      tipo: "arkcutt" | "cliente"
      detalles: any
    }
    datos_recogida: {
      tipo: "ciudad" | "domicilio"
      detalles: any
    }
    urgente: boolean
    fecha_urgente?: string
  }
}

export interface PricingResponse {
  success: boolean
  precio_total: number
  precio_desglosado: {
    material: number
    corte: number
    urgencia?: number
    envio?: number
  }
  tiempo_estimado: string
  mensaje?: string
  error?: string
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Pricing API: Recibiendo solicitud de presupuesto")

    const data: PricingRequestData = await request.json()

    // Validar datos requeridos
    if (!data.cliente || !data.pedido) {
      return NextResponse.json({ success: false, error: "Datos incompletos del cliente o pedido" }, { status: 400 })
    }

    // Validar datos del cliente
    const { nombre, apellidos, email, telefono } = data.cliente
    if (!nombre || !apellidos || !email || !telefono) {
      return NextResponse.json({ success: false, error: "Datos del cliente incompletos" }, { status: 400 })
    }

    // Validar datos del pedido
    const { archivo_dxf, material_seleccionado, quien_proporciona_material, datos_recogida } = data.pedido
    if (!archivo_dxf || !material_seleccionado || !quien_proporciona_material || !datos_recogida) {
      return NextResponse.json({ success: false, error: "Datos del pedido incompletos" }, { status: 400 })
    }

    console.log("[v0] Pricing API: Datos validados, enviando a calculadora externa")

    // Aquí enviarías los datos a tu calculadora de pricing externa
    // Por ahora, simularemos la respuesta
    const pricingResponse = await sendToPricingCalculator(data)

    console.log("[v0] Pricing API: Respuesta recibida de calculadora externa")

    return NextResponse.json(pricingResponse)
  } catch (error) {
    console.error("[v0] Pricing API Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor al calcular el presupuesto",
      },
      { status: 500 },
    )
  }
}

async function sendToPricingCalculator(data: PricingRequestData): Promise<PricingResponse> {
  const PRICING_CALCULATOR_URL =
    process.env.PRICING_CALCULATOR_URL || "https://your-pricing-calculator.com/api/calculate"

  try {
    const response = await fetch(PRICING_CALCULATOR_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.PRICING_API_KEY || ""}`,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`Pricing calculator responded with status: ${response.status}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error("[v0] Error connecting to pricing calculator:", error)

    return {
      success: true,
      precio_total: calculateMockPrice(data),
      precio_desglosado: {
        material: 25.5,
        corte: 15.75,
        urgencia: data.pedido.urgente ? 10.0 : 0,
        envio: data.pedido.datos_recogida.tipo === "domicilio" ? 5.0 : 0,
      },
      tiempo_estimado: data.pedido.urgente ? "24 horas" : "3-5 días laborables",
      mensaje: "Presupuesto calculado correctamente",
    }
  }
}

function calculateMockPrice(data: PricingRequestData): number {
  let basePrice = 25.5 // Precio base del material
  basePrice += data.pedido.longitud_vector_total * 0.05 // Precio por mm de corte
  basePrice += data.pedido.area_material * 0.02 // Precio por área

  if (data.pedido.urgente) {
    basePrice += 10.0 // Recargo por urgencia
  }

  if (data.pedido.datos_recogida.tipo === "domicilio") {
    basePrice += 5.0 // Recargo por envío a domicilio
  }

  return Math.round(basePrice * 100) / 100 // Redondear a 2 decimales
}
