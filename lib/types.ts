export interface PersonalData {
  firstName: string
  lastName: string
  email: string
  phone: string
}

export interface LocationData {
  address: string
  city: string
  postalCode: string
  phone: string
}

export interface FormData {
  files: File[]
  city: string
  locationData?: LocationData
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

export interface ThankYouPageProps {
  personalData: PersonalData
  formData: FormData
  onClose: () => void
  dxfAnalysisData?: any | null
}

// Esquema para la tabla pedidos en Supabase (nombres exactos de columnas)
export interface Pedido {
  id: string // UUID generado por servidor
  createdAt: string // timestamp del servidor
  nombre: string // obligatorio
  apellido?: string | null
  mail: string // obligatorio, validar email
  teléfono: string // obligatorio, validar formato
  archivo: string // URL resultante del upload al bucket
  "quien-material"?: string | null // "arkcutt" | "cliente"
  material?: string | null
  grosor?: string | number | null
  color?: string | null
  "fecha-cliente"?: string | null // date - solo si quien_material == cliente
  "hora-cliente"?: string | null // solo si quien_material == cliente
  "sitio-recogida"?: string | null // "madrid" | "barcelona" | "malaga" | "a domicilio"
  dirección?: string | null // solo si sitio_recogida == "a domicilio"
  ciudad?: string | null // solo si sitio_recogida == "a domicilio"
  "codigo-postal"?: string | null // solo si sitio_recogida == "a domicilio"
  "telefono-contacto"?: string | null // solo si sitio_recogida == "a domicilio"
  "reserva-urgente": boolean
  "fecha-recogida"?: string | null // date
  "hora-recogida"?: string | null
  "presupuesto-final": number // total calculado
  "datos-analisis-dxf": any // json
  "datos-presupuesto": any // json
  feedback?: string | null
}

// Payload para crear un pedido
export interface CreatePedidoPayload {
  nombre: string
  apellido?: string
  mail: string
  teléfono: string
  archivo: {
    filename: string
    content: string | Buffer // binary data o base64
  }
  "quien-material"?: string
  material?: string
  grosor?: string | number
  color?: string
  "fecha-cliente"?: string
  "hora-cliente"?: string
  "sitio-recogida"?: string
  dirección?: string
  ciudad?: string
  "codigo-postal"?: string
  "telefono-contacto"?: string
  "reserva-urgente": boolean
  "fecha-recogida"?: string
  "hora-recogida"?: string
  "presupuesto-final": number
  "datos-analisis-dxf": any
  "datos-presupuesto": any
  feedback?: string
}

// Respuesta del API de crear pedido
export interface CreatePedidoResponse {
  ok: boolean
  pedidoId?: string
  fila?: Pedido
  error?: string
}
