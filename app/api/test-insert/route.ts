import { type NextRequest, NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    console.log("[test-insert] Probando INSERT en tabla PEDIDOS")

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      db: {
        schema: 'Pedidos'
      }
    })

    // Datos de prueba
    const pedidoPrueba = {
      nombre: "Juan Test",
      apellido: "Apellido Test",
      mail: "test@example.com",
      teléfono: "600123456",
      archivo: "https://test-url.com/archivo.dxf",
      "quien-material": "arkcutt",
      material: "acero",
      grosor: "3mm",
      color: "negro",
      "sitio-recogida": "madrid",
      "reserva-urgente": "false", // text field
      "presupuesto-final": 123.45,
      "datos-analisis-dxf": { test: "datos analysis" },
      "datos-presupuesto": { test: "datos presupuesto" }
    }

    console.log("[test-insert] Insertando pedido de prueba:", pedidoPrueba.nombre)

    const insertResult = await supabase
      .from('PEDIDOS')
      .insert([pedidoPrueba])
      .select()
      .single()

    if (insertResult.error) {
      console.error('[test-insert] Error:', insertResult.error)
      return NextResponse.json({
        success: false,
        error: insertResult.error.message,
        details: insertResult.error
      }, { status: 500 })
    }

    console.log("[test-insert] INSERT exitoso")

    // Verificar que se insertó
    const selectResult = await supabase
      .from('PEDIDOS')
      .select('*')
      .eq('nombre', pedidoPrueba.nombre)
      .single()

    return NextResponse.json({
      success: true,
      inserted: insertResult.data,
      verified: selectResult.data,
      message: "Pedido de prueba insertado y verificado correctamente"
    })

  } catch (error) {
    console.error("[test-insert] Error inesperado:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido"
    }, { status: 500 })
  }
}