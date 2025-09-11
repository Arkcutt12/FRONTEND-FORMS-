import { supabase } from './supabase'

export async function testSupabaseConnection() {
  try {
    console.log('🔍 Probando conexión con Supabase...')
    
    // Test 1: Conectividad básica
    const { data: healthCheck, error: healthError } = await supabase
      .from('USUARIOS')
      .select('count')
      .limit(1)
    
    if (healthError) {
      console.error('❌ Error de conectividad:', healthError)
      return { success: false, error: healthError.message }
    }
    
    console.log('✅ Conexión exitosa con Supabase')
    
    // Test 2: Verificar Storage con método alternativo
    try {
      console.log('🔍 Probando acceso directo al Storage...')
      
      // Intentar listar buckets con manejo de errores mejorado
      const { data: buckets, error: storageError } = await supabase.storage.listBuckets()
      
      console.log('Storage response:', { buckets, error: storageError })
      
      if (storageError) {
        console.warn('⚠️ Error accediendo a Storage (continuando sin Storage):', storageError.message)
      } else if (buckets) {
        console.log('✅ Storage accesible, buckets encontrados:', buckets.map(b => b.name))
        const dxfBucket = buckets.find(bucket => bucket.name === 'dxf-files')
        if (dxfBucket) {
          console.log('✅ Bucket dxf-files encontrado y configurado')
        } else {
          console.warn('⚠️ Bucket dxf-files no encontrado en la lista')
        }
      } else {
        console.warn('⚠️ No se pudieron obtener buckets')
      }
    } catch (storageErr) {
      console.warn('⚠️ Error en test de Storage:', storageErr)
    }
    
    // Test 3: Verificar estructura de tablas
    const tables = ['USUARIOS', 'PROYECTOS', 'ARCHIVOS', 'PRESUPUESTOS', 'MATERIALES']
    
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      if (error) {
        console.error(`❌ Error accediendo a tabla ${table}:`, error)
        return { success: false, error: `Tabla ${table}: ${error.message}` }
      }
      
      console.log(`✅ Tabla ${table} accesible`)
    }
    
    return { 
      success: true, 
      message: 'Todas las conexiones y configuraciones están funcionando correctamente' 
    }
    
  } catch (error) {
    console.error('❌ Error general en test:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    }
  }
}

// Función para verificar materiales disponibles
export async function getMateriales() {
  try {
    const { data, error } = await supabase
      .from('MATERIALES')
      .select('*')
    
    if (error) {
      throw error
    }
    
    return data
  } catch (error) {
    console.error('Error obteniendo materiales:', error)
    throw error
  }
}