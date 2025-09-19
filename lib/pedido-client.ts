import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'
import type { CreatePedidoPayload, CreatePedidoResponse, Pedido } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'pedidos'
  }
})

function validarEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validarTelefono(tel: string): boolean {
  return /\d{7,}/.test(tel.replace(/\D/g, ''))
}

/**
 * Guarda un pedido completo en Supabase
 */
export async function guardarPedidoCompleto(payload: CreatePedidoPayload): Promise<CreatePedidoResponse> {
  console.log("[pedido-client] Iniciando guardado de pedido")

  try {
    // Validaciones básicas
    if (!payload.nombre || !payload.mail || !payload.teléfono || !payload["presupuesto-final"]) {
      return {
        ok: false,
        error: 'Faltan campos obligatorios: nombre, mail, teléfono o presupuesto-final'
      }
    }

    if (!validarEmail(payload.mail)) {
      return {
        ok: false,
        error: 'Email inválido'
      }
    }

    if (!validarTelefono(payload.teléfono)) {
      return {
        ok: false,
        error: 'Teléfono inválido (mínimo 7 dígitos)'
      }
    }

    if (!payload.archivo || !payload.archivo.filename) {
      return {
        ok: false,
        error: 'Falta archivo DXF'
      }
    }

    console.log("[pedido-client] Validaciones pasadas, generando ID")

    // Generar ID único para el pedido
    const pedidoId = uuidv4()
    const path = `FORMS/${pedidoId}/${payload.archivo.filename}`

    console.log("[pedido-client] Subiendo archivo a:", path)

    // Subir archivo al bucket
    let fileBuffer: Buffer
    if (typeof payload.archivo.content === 'string') {
      // Si es base64, convertir a buffer
      fileBuffer = Buffer.from(payload.archivo.content, 'base64')
    } else {
      fileBuffer = Buffer.from(payload.archivo.content)
    }

    const uploadRes = await supabase.storage
      .from('dxf-files')
      .upload(path, fileBuffer, {
        upsert: false,
        contentType: 'application/octet-stream'
      })

    if (uploadRes.error) {
      console.error('[pedido-client] Error subiendo archivo:', uploadRes.error)
      return {
        ok: false,
        error: 'Error subiendo el archivo DXF'
      }
    }

    console.log("[pedido-client] Archivo subido exitosamente")

    // Obtener URL pública del archivo
    const { data: publicUrlData } = supabase.storage
      .from('dxf-files')
      .getPublicUrl(path)

    const archivoUrl = publicUrlData?.publicUrl ?? null

    if (!archivoUrl) {
      // Rollback: eliminar archivo subido
      await supabase.storage.from('dxf-files').remove([path])
      return {
        ok: false,
        error: 'Error obteniendo URL del archivo'
      }
    }

    console.log("[pedido-client] URL del archivo obtenida:", archivoUrl)

    // Construir objeto para insertar en la DB
    const fila: Partial<Pedido> = {
      id: pedidoId,
      createdAt: new Date().toISOString(),
      nombre: payload.nombre,
      apellido: payload.apellido || null,
      mail: payload.mail,
      teléfono: payload.teléfono,
      archivo: archivoUrl,
      "quien-material": payload["quien-material"] || null,
      material: payload.material || null,
      grosor: payload.grosor || null,
      color: payload.color || null,
      "fecha-cliente": payload["fecha-cliente"] || null,
      "hora-cliente": payload["hora-cliente"] || null,
      "sitio-recogida": payload["sitio-recogida"] || null,
      dirección: payload.dirección || null,
      ciudad: payload.ciudad || null,
      "codigo-postal": payload["codigo-postal"] || null,
      "telefono-contacto": payload["telefono-contacto"] || null,
      "reserva-urgente": !!payload["reserva-urgente"],
      "fecha-recogida": payload["fecha-recogida"] || null,
      "hora-recogida": payload["hora-recogida"] || null,
      "presupuesto-final": Number(payload["presupuesto-final"]),
      "datos-analisis-dxf": payload["datos-analisis-dxf"] || {},
      "datos-presupuesto": payload["datos-presupuesto"] || {},
      feedback: payload.feedback || null
    }

    console.log("[pedido-client] Insertando en base de datos")

    // Insertar en la tabla pedidos
    const insertRes = await supabase
      .from('pedidos')
      .insert([fila])
      .select()
      .single()

    if (insertRes.error) {
      console.error('[pedido-client] Error insertando en DB:', insertRes.error)

      // Rollback: eliminar archivo subido
      await supabase.storage.from('dxf-files').remove([path])

      return {
        ok: false,
        error: 'Error insertando en la base de datos'
      }
    }

    console.log("[pedido-client] Pedido creado exitosamente:", pedidoId)

    return {
      ok: true,
      pedidoId,
      fila: insertRes.data as Pedido
    }

  } catch (error) {
    console.error('[pedido-client] Error inesperado:', error)
    return {
      ok: false,
      error: 'Error inesperado del servidor'
    }
  }
}

/**
 * Convierte los datos del formulario a formato compatible con la DB
 */
export function convertirFormDataAPedido(
  formData: any,
  personalData: any,
  presupuestoFinal: number,
  datosAnalisisDxf: any,
  datosPresupuesto: any
): CreatePedidoPayload {
  return {
    nombre: personalData.firstName,
    apellido: personalData.lastName,
    mail: personalData.email,
    teléfono: personalData.phone,
    archivo: {
      filename: formData.files?.[0]?.name || 'archivo.dxf',
      content: '' // Este se debe agregar por separado
    },
    "quien-material": formData.materialProvider === "client" ? "cliente" : "arkcutt",
    material: formData.selectedMaterial || formData.clientMaterial?.materialType,
    grosor: formData.selectedThickness || formData.clientMaterial?.thickness,
    color: formData.selectedColor,
    "fecha-cliente": formData.clientMaterial?.deliveryDate,
    "hora-cliente": formData.clientMaterial?.deliveryTime,
    "sitio-recogida": formData.city === "home" ? "a domicilio" : formData.city,
    dirección: formData.locationData?.address,
    ciudad: formData.locationData?.city,
    "codigo-postal": formData.locationData?.postalCode,
    "telefono-contacto": formData.locationData?.phone,
    "reserva-urgente": formData.isUrgent,
    "fecha-recogida": formData.urgentDateTime ? new Date(formData.urgentDateTime).toISOString().split('T')[0] : null,
    "hora-recogida": formData.urgentDateTime ? new Date(formData.urgentDateTime).toTimeString().split(' ')[0].substring(0, 5) : null,
    "presupuesto-final": presupuestoFinal,
    "datos-analisis-dxf": datosAnalisisDxf,
    "datos-presupuesto": datosPresupuesto,
    feedback: null
  }
}