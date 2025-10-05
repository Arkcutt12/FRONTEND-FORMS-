import { type NextRequest, NextResponse } from "next/server"
import { externalSupabase } from "@/lib/supabase/external-client"

export async function POST(request: NextRequest) {
  console.log("[v0] API route /api/submit-order called")

  try {
    const body = await request.json()
    console.log("[v0] Received order submission")
    console.log("[v0] Personal Data:", body.personalData)
    console.log("[v0] Form Data:", body.formData)
    console.log("[v0] DXF Data present:", !!body.dxfData)

    console.log("[v0] Testing Supabase connection...")
    const { data: testData, error: testError } = await externalSupabase.from("pedidos").select("count").limit(1)

    if (testError) {
      console.error("[v0] Supabase connection test failed:", testError)
      return NextResponse.json(
        {
          error: "Error de conexión a la base de datos",
          details: testError.message,
          code: testError.code,
          hint: testError.hint,
        },
        { status: 500 },
      )
    }

    console.log("[v0] Supabase connection successful")

    const orderData = {
      nombre: body.personalData.firstName,
      apellido: body.personalData.lastName,
      mail: body.personalData.email,
      telefono: body.personalData.phone,

      // Location data
      ciudad: body.formData.city,
      sitio_recogida: body.formData.city,
      direccion: body.formData.locationData?.address || null,
      codigo_postal: body.formData.locationData?.postalCode || null,
      telefono_contacto: body.formData.locationData?.phone || null,

      // Material provider
      quien_material: body.formData.materialProvider,

      // Material details (Arkcutt)
      material: body.formData.selectedMaterial || body.formData.clientMaterial?.materialType || null,
      grosor: body.formData.selectedThickness || body.formData.clientMaterial?.thickness || null,
      color: body.formData.selectedColor || null,

      // Client material delivery
      fecha_recogida: body.formData.clientMaterial?.deliveryDate || null,
      hora_recogida: body.formData.clientMaterial?.deliveryTime || null,

      // Urgent request
      reserva_urgente: body.formData.isUrgent,
      fecha_cliente: body.formData.urgentDateTime || null,
      hora_cliente: body.formData.urgentDateTime ? body.formData.urgentDateTime.split("T")[1] : null,

      // DXF Analysis data - store as JSONB
      datos_analisis_dxf: body.dxfData || null,

      // Files info - store file names and count
      archivo: body.formData.fileNames ? body.formData.fileNames.join(", ") : null,

      // Feedback field (empty for now)
      feedback: null,
    }

    console.log("[v0] Prepared order data with", Object.keys(orderData).length, "fields")
    console.log("[v0] Inserting into Supabase...")

    const { data, error } = await externalSupabase.from("pedidos").insert([orderData]).select()

    if (error) {
      console.error("[v0] Supabase insert error:")
      console.error("[v0] Error message:", error.message)
      console.error("[v0] Error code:", error.code)
      console.error("[v0] Error details:", error.details)
      console.error("[v0] Error hint:", error.hint)

      return NextResponse.json(
        {
          error: "Error al guardar el pedido",
          details: error.message,
          code: error.code,
          hint: error.hint,
        },
        { status: 500 },
      )
    }

    console.log("[v0] Order saved successfully!")
    console.log("[v0] Inserted record ID:", data[0]?.id)

    return NextResponse.json({
      success: true,
      message: "Pedido guardado correctamente",
      orderId: data[0]?.id,
    })
  } catch (error) {
    console.error("[v0] Unexpected error in API route:", error)
    console.error("[v0] Error type:", error instanceof Error ? error.constructor.name : typeof error)
    console.error("[v0] Error message:", error instanceof Error ? error.message : String(error))

    return NextResponse.json(
      {
        error: "Error al procesar el pedido",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
