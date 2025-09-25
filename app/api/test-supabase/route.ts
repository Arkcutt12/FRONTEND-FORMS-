import { type NextRequest, NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    console.log("[test-supabase] Probando conexión con Supabase")
    console.log("URL:", supabaseUrl)
    console.log("Key existe:", !!supabaseAnonKey)

    // Probar con schema Pedidos usando service_role
    const supabasePedidos = createClient(supabaseUrl, supabaseServiceKey, {
      db: {
        schema: 'Pedidos'
      }
    })

    console.log("[test-supabase] Probando acceso a tabla PEDIDOS en schema Pedidos con service_role")
    const resultPedidos = await supabasePedidos.from('PEDIDOS').select('*').limit(1)

    console.log("[test-supabase] Resultado pedidos:", resultPedidos)

    // Probar sin schema específico (default public)
    const supabaseDefault = createClient(supabaseUrl, supabaseAnonKey)

    console.log("[test-supabase] Probando acceso a tabla PEDIDOS en schema public")
    const resultDefault = await supabaseDefault.from('PEDIDOS').select('*').limit(1)

    console.log("[test-supabase] Resultado default:", resultDefault)

    // Probar bucket
    console.log("[test-supabase] Probando acceso a bucket dxf-files")
    const bucketResult = await supabaseDefault.storage.from('dxf-files').list('', { limit: 1 })

    console.log("[test-supabase] Resultado bucket:", bucketResult)

    return NextResponse.json({
      success: true,
      tests: {
        pedidosSchema: {
          error: resultPedidos.error?.message,
          count: resultPedidos.data?.length || 0
        },
        publicSchema: {
          error: resultDefault.error?.message,
          count: resultDefault.data?.length || 0
        },
        bucket: {
          error: bucketResult.error?.message,
          files: bucketResult.data?.length || 0
        }
      }
    })

  } catch (error) {
    console.error("[test-supabase] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido"
      },
      { status: 500 }
    )
  }
}