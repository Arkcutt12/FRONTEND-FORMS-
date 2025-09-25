import { type NextRequest, NextResponse } from "next/server"
import { guardarPedidoCompleto, convertirFormDataAPedido } from "../../../lib/pedido-client"
import type { CreatePedidoResponse } from "../../../lib/types"

export interface SaveOrderRequest {
  // Datos del cliente
  cliente: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  // Datos del formulario
  formData: {
    files?: Array<{ name: string, size: number }>
    city: string
    locationData?: {
      address: string
      city: string
      postalCode: string
      phone: string
    }
    materialProvider: "client" | "arkcutt"
    clientMaterial?: {
      deliveryDate: string
      deliveryTime: string
      materialType: string
      thickness: number
    }
    selectedMaterial?: string
    selectedThickness?: number
    selectedColor?: string
    isUrgent: boolean
    urgentDateTime?: string
  }
  // Resultado del cálculo de presupuesto
  presupuesto: {
    precio_total: number
    tiempo_estimado?: string
    desglose?: any
  }
  // Datos del análisis DXF (si están disponibles)
  analisisDxf?: any
  // Archivo DXF (como base64 o buffer)
  archivo?: {
    filename: string
    content: string // base64
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[save-order] Iniciando guardado de pedido en Supabase")

    const body: SaveOrderRequest = await request.json()

    // Validaciones básicas
    if (!body.cliente || !body.formData || !body.presupuesto) {
      return NextResponse.json({
        ok: false,
        error: "Faltan datos requeridos: cliente, formData, presupuesto"
      }, { status: 400 })
    }

    // Si no hay precio_total válido, usar un valor por defecto de 0
    const precioFinal = body.presupuesto.precio_total ||
                       body.presupuesto.total ||
                       body.presupuesto.data?.total ||
                       body.presupuesto.precio_total_estimado ||
                       0

    if (precioFinal === 0) {
      console.log("[save-order] Guardando pedido sin presupuesto válido (precio = 0)")
    }

    console.log("[save-order] Datos recibidos para:", body.cliente.email)

    // Convertir datos del formulario al formato de Supabase
    const pedidoPayload = convertirFormDataAPedido(
      body.formData,
      body.cliente,
      precioFinal,
      body.analisisDxf || {
        archivo_validado: true,
        timestamp: new Date().toISOString(),
        fuente: "frontend-form"
      },
      body.presupuesto
    )

    // Manejar archivo DXF
    if (body.archivo) {
      pedidoPayload.archivo = {
        filename: body.archivo.filename,
        content: body.archivo.content
      }
    } else if (body.formData.files && body.formData.files.length > 0) {
      // Si no hay archivo en base64, simular con info del archivo
      pedidoPayload.archivo = {
        filename: body.formData.files[0].name,
        content: Buffer.from(`archivo-placeholder-${Date.now()}`)
      }
    } else {
      return NextResponse.json({
        ok: false,
        error: "No se encontró archivo DXF para guardar"
      }, { status: 400 })
    }

    console.log("[save-order] Guardando pedido en Supabase...")

    // Guardar en Supabase
    const resultado = await guardarPedidoCompleto(pedidoPayload)

    if (resultado.ok) {
      console.log("[save-order] Pedido guardado exitosamente:", resultado.pedidoId)

      const response: CreatePedidoResponse = {
        ok: true,
        pedidoId: resultado.pedidoId,
        fila: resultado.fila
      }

      return NextResponse.json(response, { status: 201 })
    } else {
      console.error("[save-order] Error guardando pedido:", resultado.error)
      return NextResponse.json({
        ok: false,
        error: resultado.error
      }, { status: 500 })
    }

  } catch (error) {
    console.error("[save-order] Error inesperado:", error)
    return NextResponse.json({
      ok: false,
      error: "Error interno del servidor"
    }, { status: 500 })
  }
}