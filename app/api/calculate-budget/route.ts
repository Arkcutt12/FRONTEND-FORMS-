import { type NextRequest, NextResponse } from "next/server"

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

    // Guardar pedido asíncronamente siempre que tengamos datos del cliente (sin bloquear la respuesta)
    const precioTotal = data?.data?.total || data?.precio_total || data?.total
    console.log("[v0] Budget API proxy: Checking conditions - total:", precioTotal, "success:", data?.success, "data exists:", !!data)
    if (data && body && (body.cliente || body.email || body.mail)) {
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
            presupuesto: {
              ...data,
              precio_total: precioTotal, // Agregar el precio en el formato esperado
              total: precioTotal
            },
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
