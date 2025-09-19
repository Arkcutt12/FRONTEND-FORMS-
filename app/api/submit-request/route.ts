import { type NextRequest, NextResponse } from "next/server"
import type { PricingRequestData } from "../pricing/route"
import { convertirFormDataAPedido, guardarPedidoCompleto } from "../../../lib/pedido-client"

export interface SubmitRequestResponse {
  success: boolean
  request_id: string
  mensaje: string
  presupuesto?: {
    precio_total: number
    tiempo_estimado: string
  }
  pedidoId?: string // ID del pedido guardado en Supabase
  error?: string
}

export async function POST(request: NextRequest) {
  try {
    console.log("[submit-request] Procesando solicitud completa")

    const data: PricingRequestData = await request.json()

    // Generar ID único para la solicitud
    const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    console.log(`[submit-request] Solicitud generada con ID: ${requestId}`)

    // 1. Primero llamar al backend de análisis DXF
    console.log("[submit-request] Enviando archivo para análisis DXF")
    const dxfBackendUrl = process.env.NEXT_PUBLIC_DXF_BACKEND_URL || "https://backend-dxf.onrender.com"

    // Preparar datos para análisis DXF
    const dxfFormData = new FormData()
    // Nota: Aquí necesitarías el archivo real, por ahora simularemos
    const datosAnalisisDxf = {
      archivo_validado: true,
      longitud_vector_total: data.pedido.longitud_vector_total,
      area_material: data.pedido.area_material,
      capas: data.pedido.capas,
      timestamp: new Date().toISOString()
    }

    // 2. Llamar al backend de cálculo de presupuesto
    console.log("[submit-request] Calculando presupuesto")
    const budgetBackendUrl = "https://calculadora-presupuestos-laser.onrender.com/calculate"

    const budgetResponse = await fetch(budgetBackendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!budgetResponse.ok) {
      throw new Error(`Error en calculadora de presupuesto: ${budgetResponse.status}`)
    }

    const datosPresupuesto = await budgetResponse.json()
    console.log("[submit-request] Presupuesto calculado exitosamente:", datosPresupuesto.precio_total)

    // 3. Si el presupuesto se calculó exitosamente, guardar pedido completo en Supabase
    let pedidoId: string | undefined = undefined

    try {
      console.log("[submit-request] Guardando pedido completo en Supabase")

      // Convertir datos a formato de pedido
      const pedidoPayload = convertirFormDataAPedido(
        data.pedido,
        data.cliente,
        datosPresupuesto.precio_total,
        datosAnalisisDxf,
        datosPresupuesto
      )

      // Agregar archivo DXF (simular por ahora)
      pedidoPayload.archivo = {
        filename: data.pedido.archivo_dxf.nombre,
        content: Buffer.from('archivo-dxf-simulado') // En producción vendría del formulario
      }

      const resultadoGuardado = await guardarPedidoCompleto(pedidoPayload)

      if (resultadoGuardado.ok) {
        pedidoId = resultadoGuardado.pedidoId
        console.log("[submit-request] Pedido guardado exitosamente en Supabase:", pedidoId)
      } else {
        console.error("[submit-request] Error guardando pedido:", resultadoGuardado.error)
        // No fallar la request principal por esto, solo logear
      }
    } catch (supabaseError) {
      console.error("[submit-request] Error inesperado guardando en Supabase:", supabaseError)
      // Continuar con la respuesta aunque falle el guardado
    }

    // 4. Responder al cliente con el presupuesto
    const response: SubmitRequestResponse = {
      success: true,
      request_id: requestId,
      pedidoId: pedidoId,
      mensaje: pedidoId
        ? "Solicitud procesada y guardada correctamente. Tu pedido ha sido registrado."
        : "Solicitud procesada correctamente. Presupuesto calculado.",
      presupuesto: {
        precio_total: datosPresupuesto.precio_total,
        tiempo_estimado: datosPresupuesto.tiempo_estimado || (data.pedido.urgente ? "24 horas" : "3-5 días laborables"),
      },
    }

    console.log("[submit-request] Solicitud procesada exitosamente")

    return NextResponse.json(response)
  } catch (error) {
    console.error("[submit-request] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor al procesar la solicitud",
      },
      { status: 500 },
    )
  }
}
