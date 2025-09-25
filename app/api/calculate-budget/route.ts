import { type NextRequest, NextResponse } from "next/server"
import { guardarPedidoCompleto, convertirFormDataAPedido } from "../../../lib/pedido-client"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Budget API proxy: Starting request")

    const body = await request.json()
    console.log("[v0] Budget API proxy: Request body received", { hasData: !!body })
    console.log("[v0] Budget API proxy: Full request body:", JSON.stringify(body, null, 2))

    const externalApiUrl = "https://calculadora-presupuestos-laser.onrender.com/calculate"
    console.log("[v0] Budget API proxy: Calling external API:", externalApiUrl)

    const response = await fetch(externalApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    })

    console.log("[v0] Budget API proxy: External API response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.log("[v0] Budget API proxy: External API error:", errorText)

      return NextResponse.json(
        {
          error: "External API error",
          status: response.status,
          message: errorText,
        },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log("[v0] Budget API proxy: External API success response received")
    console.log("[v0] Budget API proxy: Response data:", JSON.stringify(data, null, 2))

    // Guardar pedido asíncronamente siempre que tengamos una respuesta exitosa (sin bloquear la respuesta)
    const precioTotal = data?.data?.total || data?.precio_total || data?.total
    console.log("[v0] Budget API proxy: Checking conditions - total:", precioTotal, "success:", data?.success, "data exists:", !!data)
    console.log("[v0] Budget API proxy: Body keys:", Object.keys(body || {}))

    // Condición más flexible: si hay datos y respuesta exitosa del backend
    if (data && (data.success || precioTotal > 0) && body && Object.keys(body).length > 0) {
      // Llamar save-order de manera asíncrona sin esperar la respuesta
      setImmediate(async () => {
        try {
          console.log("[v0] Budget API proxy: Guardando pedido asíncronamente")

          // Extraer datos del cliente de cualquier estructura posible
          const clienteData = body.cliente || {
            firstName: body.nombre || body.personal?.firstName || "Cliente",
            lastName: body.apellido || body.personal?.lastName || "",
            email: body.email || body.mail || body.personal?.email || "cliente@example.com",
            phone: body.telefono || body.phone || body.personal?.phone || "600000000"
          }

          console.log("[v0] Budget API proxy: Datos del cliente extraídos:", clienteData)

          // Preparar el payload para crear pedido
          const pedidoPayload = convertirFormDataAPedido(
            body.formData || body.pedido || body,
            clienteData,
            precioTotal,
            body.analisisDxf || body.dxfData || {
              archivo_validado: true,
              timestamp: new Date().toISOString(),
              fuente: "frontend-form-budget"
            },
            data
          )

          // Asegurar que tenemos archivo
          if (!pedidoPayload.archivo || !pedidoPayload.archivo.content) {
            pedidoPayload.archivo = {
              filename: body.filename || body.files?.[0]?.name || "archivo.dxf",
              content: Buffer.from(`archivo-placeholder-${Date.now()}`)
            }
          }

          console.log("[v0] Budget API proxy: Payload preparado para guardar:", {
            nombre: pedidoPayload.nombre,
            email: pedidoPayload.mail,
            precio: pedidoPayload["presupuesto-final"],
            archivo: pedidoPayload.archivo.filename
          })

          // Llamar directamente a la función de guardado
          const resultado = await guardarPedidoCompleto(pedidoPayload)

          if (resultado.ok) {
            console.log("[v0] Budget API proxy: ✅ Pedido guardado exitosamente:", resultado.pedidoId)
          } else {
            console.error("[v0] Budget API proxy: ❌ Error guardando pedido:", resultado.error)
          }
        } catch (error) {
          console.error("[v0] Budget API proxy: ❌ Error en guardado asíncrono:", error)
        }
      })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Budget API proxy: Error:", error)

    return NextResponse.json(
      {
        error: "Proxy error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
