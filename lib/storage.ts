import { supabase } from './supabase'

export async function uploadDxfFile(file: File, projectId: string): Promise<string> {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${projectId}/${Date.now()}.${fileExt}`
    
    const { data, error } = await supabase.storage
      .from('dxf-files')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      throw error
    }

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from('dxf-files')
      .getPublicUrl(data.path)

    return urlData.publicUrl
  } catch (error) {
    console.error('Error uploading file:', error)
    throw error
  }
}

export async function deleteDxfFile(filePath: string): Promise<void> {
  try {
    // Extraer el path relativo de la URL completa
    const relativePath = filePath.split('/dxf-files/').pop()
    
    if (!relativePath) {
      throw new Error('Invalid file path')
    }

    const { error } = await supabase.storage
      .from('dxf-files')
      .remove([relativePath])

    if (error) {
      throw error
    }
  } catch (error) {
    console.error('Error deleting file:', error)
    throw error
  }
}

export function getFileUrlFromPath(filePath: string): string {
  const { data } = supabase.storage
    .from('dxf-files')
    .getPublicUrl(filePath)

  return data.publicUrl
}

export async function uploadPdfToStorage(pdfBlob: Blob, projectId: string, budgetId: string): Promise<string> {
  try {
    const fileName = `presupuesto_${projectId}_${budgetId}_${Date.now()}.pdf`
    
    const { data, error } = await supabase.storage
      .from('budget-pdfs')
      .upload(fileName, pdfBlob, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'application/pdf'
      })

    if (error) {
      throw error
    }

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from('budget-pdfs')
      .getPublicUrl(data.path)

    console.log('📄 PDF subido exitosamente:', urlData.publicUrl)
    return urlData.publicUrl
  } catch (error) {
    console.error('❌ Error subiendo PDF:', error)
    throw error
  }
}

export async function downloadPdfFromUrl(pdfUrl: string): Promise<Blob> {
  try {
    console.log('📥 Descargando PDF desde:', pdfUrl)
    
    const response = await fetch(pdfUrl)
    if (!response.ok) {
      throw new Error(`Error descargando PDF: ${response.status}`)
    }
    
    const blob = await response.blob()
    console.log('✅ PDF descargado, tamaño:', blob.size, 'bytes')
    return blob
  } catch (error) {
    console.error('❌ Error descargando PDF:', error)
    throw error
  }
}