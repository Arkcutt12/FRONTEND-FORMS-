import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'arcat'
  }
})

// Tipos para tu esquema arcat
export interface ArcatUsuario {
  id: number
  created_at: string
  name: string | null
  email: string
  role: string | null
  telf: string | null
}

export interface ArcatProyecto {
  id: string
  created_at: string
  user_id: number
  name: string
  estado: string
  update_at: string
}

export interface ArcatArchivo {
  id: string
  created_at: string
  Project_id: string | null
  user_id: number | null
  name_file: string
  type_file: string
  Ruta_file: string
  tamaño: number | null
  cargado_en: string
  dxf_unidades: string | null
  dxf_dimensiones: any | null
  dxf_capas: any | null
}

export interface ArcatMaterial {
  ID: number
  GROSORES: number | null
  'MEDIDA PLANCHA': string | null
  COLOR: string | null
  'POTENCIA CORTE': number | null
  'PRECIO POR PLANCHA': number | null
  'VELOCIDAD CORTE': number | null
  'POTENCIA GRABADO': number | null
  'VELOCIDAD GRABADO': number | null
  MATERIALES: string | null
}

export interface ArcatPresupuesto {
  id: string
  created_at: string
  proyecto_id: string
  descripcion: string | null
  cantidad: number | null
  material_id: number | null
  proceso: string | null
  precio_unitario: number | null
  archivo_id: string | null
  precio_total: number | null
}

// Helper functions
function determineUserRole(email: string, name?: string): string {
  // Normalizar email y nombre para comparación
  const normalizedEmail = email.toLowerCase().trim()
  const normalizedName = name?.toLowerCase().trim() || ''
  
  // Emails de trabajadores
  const workerEmails = [
    'hierrooivan@gmail.com',
    'ivan.hierro@alumni.mondragon.edu',
    'arkcutt@gmail.com',
    'info@arkcutt.com'
  ]
  
  // Nombres de trabajadores (todas las variaciones)
  const workerNames = [
    'iván hierro',
    'ivan hierro',
    'iván hierro',
    'ivan hierro'
  ]
  
  // Verificar si es email de trabajador
  if (workerEmails.includes(normalizedEmail)) {
    console.log(`🔧 Detectado email de trabajador: ${email}`)
    return "Arkcutt's Team"
  }
  
  // Verificar si es nombre de trabajador
  if (workerNames.includes(normalizedName)) {
    console.log(`🔧 Detectado nombre de trabajador: ${name}`)
    return "Arkcutt's Team"
  }
  
  console.log(`👤 Usuario detectado como cliente: ${email}`)
  return 'cliente'
}

export async function findOrCreateUser(email: string, name?: string, phone?: string): Promise<ArcatUsuario> {
  // Buscar usuario existente
  const { data: existingUser, error: searchError } = await supabase
    .from('USUARIOS')
    .select('*')
    .eq('email', email)
    .single()

  if (existingUser && !searchError) {
    return existingUser
  }

  // Determinar el rol del usuario
  const userRole = determineUserRole(email, name)
  
  // Crear nuevo usuario
  const { data: newUser, error: createError } = await supabase
    .from('USUARIOS')
    .insert({
      email,
      name: name || null,
      telf: phone || null,
      role: userRole
    })
    .select()
    .single()

  if (createError) {
    throw new Error(`Error creando usuario: ${createError.message}`)
  }

  return newUser
}

export async function createProject(userId: number, projectName: string): Promise<ArcatProyecto> {
  const { data: newProject, error } = await supabase
    .from('PROYECTOS')
    .insert({
      user_id: userId,
      name: projectName,
      estado: 'borrador'
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Error creando proyecto: ${error.message}`)
  }

  return newProject
}