import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Budget API proxy: Starting request")

    const body = await request.json()
    console.log("[v0] Budget API proxy: Request body received", { hasData: !!body })

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

    // Si el cálculo fue exitoso, guardar pedido asíncronamente (sin bloquear la respuesta)
    if (data && (data.precio_total || data.success)) {
      // Llamar save-order de manera asíncrona sin esperar la respuesta
      setImmediate(async () => {
        try {
          console.log("[v0] Budget API proxy: Guardando pedido asíncronamente")

          // Preparar datos para save-order
          const saveOrderPayload = {
            cliente: body.cliente || {
              firstName: body.nombre || "Cliente",
              lastName: body.apellido || "",
              email: body.email || body.mail || "cliente@example.com",
              phone: body.telefono || body.phone || "600000000"
            },
            formData: body.formData || body.pedido || body,
            presupuesto: data,
            analisisDxf: body.analisisDxf || body.dxfData,
            archivo: body.archivo || {
              filename: body.filename || "archivo.dxf",
              content: Buffer.from(`archivo-${Date.now()}`).toString('base64')
            }
          }

          const saveResponse = await fetch(`http://localhost:${process.env.PORT || 3001}/api/save-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(saveOrderPayload)
          })

          if (saveResponse.ok) {
            const saveResult = await saveResponse.json()
            console.log("[v0] Budget API proxy: Pedido guardado exitosamente:", saveResult.pedidoId)
          } else {
            console.error("[v0] Budget API proxy: Error guardando pedido:", await saveResponse.text())
          }
        } catch (error) {
          console.error("[v0] Budget API proxy: Error en guardado asíncrono:", error)
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
