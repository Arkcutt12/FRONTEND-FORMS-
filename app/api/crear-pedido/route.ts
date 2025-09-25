import { type NextRequest, NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'
import type { CreatePedidoPayload, CreatePedidoResponse, Pedido } from '../../../lib/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: {
    schema: 'Pedidos'
  }
})

function validarEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validarTelefono(tel: string): boolean {
  return /\d{7,}/.test(tel.replace(/\D/g, ''))
}

export async function POST(request: NextRequest) {
  console.log("[crear-pedido] Iniciando procesamiento de pedido")

  try {
    // Verificar método
    if (request.method !== 'POST') {
      return NextResponse.json(
        { ok: false, error: 'Method not allowed' },
        { status: 405 }
      )
    }

    const body: CreatePedidoPayload = await request.json()
    console.log("[crear-pedido] Datos recibidos:", {
      nombre: body.nombre,
      mail: body.mail,
      hasArchivo: !!body.archivo
    })

    // Validaciones básicas
    if (!body.nombre || !body.mail || !body.teléfono || !body["presupuesto-final"]) {
      return NextResponse.json(
        { ok: false, error: 'Faltan campos obligatorios: nombre, mail, teléfono o presupuesto-final' },
        { status: 400 }
      )
    }

    if (!validarEmail(body.mail)) {
      return NextResponse.json(
        { ok: false, error: 'Email inválido' },
        { status: 400 }
      )
    }

    if (!validarTelefono(body.teléfono)) {
      return NextResponse.json(
        { ok: false, error: 'Teléfono inválido (mínimo 7 dígitos)' },
        { status: 400 }
      )
    }

    if (!body.archivo || !body.archivo.filename) {
      return NextResponse.json(
        { ok: false, error: 'Falta archivo DXF' },
        { status: 400 }
      )
    }

    console.log("[crear-pedido] Validaciones pasadas, generando ID")

    // Generar ID único para el pedido
    const pedidoId = uuidv4()
    const path = `FORMS/${pedidoId}/${body.archivo.filename}`

    console.log("[crear-pedido] Subiendo archivo a:", path)

    // Subir archivo al bucket
    let fileBuffer: Buffer
    if (typeof body.archivo.content === 'string') {
      // Si es base64, convertir a buffer
      fileBuffer = Buffer.from(body.archivo.content, 'base64')
    } else {
      fileBuffer = Buffer.from(body.archivo.content)
    }

    const uploadRes = await supabase.storage
      .from('dxf-files')
      .upload(path, fileBuffer, {
        upsert: false,
        contentType: 'application/octet-stream'
      })

    if (uploadRes.error) {
      console.error('[crear-pedido] Error subiendo archivo:', uploadRes.error)
      return NextResponse.json(
        { ok: false, error: 'Error subiendo el archivo DXF' },
        { status: 500 }
      )
    }

    console.log("[crear-pedido] Archivo subido exitosamente")

    // Obtener URL pública del archivo
    const { data: publicUrlData } = supabase.storage
      .from('dxf-files')
      .getPublicUrl(path)

    const archivoUrl = publicUrlData?.publicUrl ?? null

    if (!archivoUrl) {
      // Rollback: eliminar archivo subido
      await supabase.storage.from('dxf-files').remove([path])
      return NextResponse.json(
        { ok: false, error: 'Error obteniendo URL del archivo' },
        { status: 500 }
      )
    }

    console.log("[crear-pedido] URL del archivo obtenida:", archivoUrl)

    // Construir objeto para insertar en la DB (usar nombres de columna exactos)
    const fila: Partial<Pedido> = {
      nombre: body.nombre,
      apellido: body.apellido || null,
      mail: body.mail,
      teléfono: body.teléfono,
      archivo: archivoUrl,
      "quien-material": body["quien-material"] || null,
      material: body.material || null,
      grosor: body.grosor || null,
      color: body.color || null,
      "fecha-cliente": body["fecha-cliente"] || null,
      "hora-cliente": body["hora-cliente"] || null,
      "sitio-recogida": body["sitio-recogida"] || null,
      dirección: body.dirección || null,
      ciudad: body.ciudad || null,
      "codigo-postal": body["codigo-postal"] || null,
      "teléfono-contacto": body["telefono-contacto"] || null,
      "reserva-urgente": body["reserva-urgente"] ? "true" : "false", // text field
      "fecha-recogida": body["fecha-recogida"] || null,
      "hora-recogida": body["hora-recogida"] || null,
      "presupuesto-final": Number(body["presupuesto-final"]),
      "datos-analisis-dxf": body["datos-analisis-dxf"] || {},
      "datos-presupuesto": body["datos-presupuesto"] || {},
      feedback: body.feedback || null
    }

    console.log("[crear-pedido] Insertando en base de datos")

    // Insertar en la tabla PEDIDOS
    const insertRes = await supabase
      .from('PEDIDOS')
      .insert([fila])
      .select()
      .single()

    if (insertRes.error) {
      console.error('[crear-pedido] Error insertando en DB:', insertRes.error)

      // Rollback: eliminar archivo subido
      await supabase.storage.from('dxf-files').remove([path])

      return NextResponse.json(
        { ok: false, error: 'Error insertando en la base de datos' },
        { status: 500 }
      )
    }

    console.log("[crear-pedido] Pedido creado exitosamente:", pedidoId)

    const response: CreatePedidoResponse = {
      ok: true,
      pedidoId,
      fila: insertRes.data as Pedido
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('[crear-pedido] Error inesperado:', error)
    return NextResponse.json(
      { ok: false, error: 'Error inesperado del servidor' },
      { status: 500 }
    )
  }
}