import { supabase, findOrCreateUser, createProject } from './supabase'
import { uploadDxfFile } from './storage'
import { apiClient, DXFAnalysisResponse } from './api-client'

export interface FormData {
  // Datos del cliente
  clientName: string
  clientEmail: string
  clientPhone?: string
  
  // Datos del archivo DXF
  dxfFile: File
  
  // Datos del material
  selectedMaterial: string
  materialThickness?: number
  materialColor?: string
  materialProvider: 'Arkcutt' | 'Cliente'
  clientMaterialDetails?: any
  
  // Datos de entrega
  pickupType: 'recogida' | 'domicilio'
  pickupAddress?: string
  pickupCity?: string
  pickupPostalCode?: string
  pickupNotes?: string
  
  // Requisitos especiales
  isUrgent: boolean
  specialRequirements?: string
}

export interface BudgetCalculation {
  total: number
  currency: string
  breakdown: any
  // Agrega otros campos según tu backend de presupuestos
}

export class FormClient {
  async submitForm(formData: FormData): Promise<{ success: true; projectId: string } | { success: false; error: string }> {
    try {
      console.log('🚀 Iniciando procesamiento del formulario...')
      
      // 1. Analizar archivo DXF
      console.log('📤 Analizando archivo DXF...')
      const dxfAnalysis = await apiClient.analyzeDxf(formData.dxfFile)
      
      // 2. Crear o encontrar usuario
      console.log('👤 Creando/buscando usuario...')
      const user = await findOrCreateUser(
        formData.clientEmail,
        formData.clientName,
        formData.clientPhone
      )
      
      // 3. Generar nombre del proyecto
      const projectName = this.generateProjectName(formData)
      
      // 4. Crear proyecto
      console.log('📋 Creando proyecto...')
      const project = await createProject(user.id, projectName)
      
      // 5. Subir archivo DXF a Storage
      console.log('💾 Subiendo archivo DXF...')
      const fileUrl = await uploadDxfFile(formData.dxfFile, project.id)
      
      // 6. Crear registro en ARCHIVOS
      console.log('📁 Registrando archivo...')
      const archivo = await this.createFileRecord(
        formData.dxfFile,
        fileUrl,
        project.id,
        user.id,
        dxfAnalysis
      )
      
      // 7. Calcular presupuesto (aquí deberías llamar a tu backend de presupuestos)
      console.log('💰 Calculando presupuesto...')
      const budgetCalculation = await this.calculateBudget(dxfAnalysis, formData)
      
      // 8. Crear registro en PRESUPUESTOS
      console.log('📊 Creando presupuesto...')
      const presupuesto = await this.createBudgetRecord(
        project.id,
        formData,
        dxfAnalysis,
        budgetCalculation,
        archivo.id
      )

      // 8. Actualizar estado del proyecto
      console.log('✅ Finalizando proyecto...')
      await this.updateProjectStatus(project.id, 'enviado')
      
      console.log('🎉 Formulario procesado exitosamente!')
      return { success: true, projectId: project.id }
      
    } catch (error) {
      console.error('❌ Error procesando formulario:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      }
    }
  }
  
  private generateProjectName(formData: FormData): string {
    const today = new Date().toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
    
    const material = formData.selectedMaterial.toLowerCase()
    const thickness = formData.materialThickness ? `${formData.materialThickness}mm` : ''
    const color = formData.materialColor?.toLowerCase() || 'natural'
    
    return `${material}, ${thickness}, ${color}, ${today}`.replace(/,\s*,/g, ',')
  }
  
  private async createFileRecord(
    file: File,
    fileUrl: string,
    projectId: string,
    userId: number,
    dxfAnalysis: DXFAnalysisResponse
  ) {
    const { data, error } = await supabase
      .from('ARCHIVOS')
      .insert({
        Project_id: projectId,
        user_id: userId,
        name_file: file.name,
        type_file: 'dxf',
        Ruta_file: fileUrl,
        tamaño: file.size,
        dxf_unidades: 'mm', // Asumiendo mm, puedes extraer de dxfAnalysis si está disponible
        dxf_dimensiones: {
          width: dxfAnalysis.bounding_box.width,
          height: dxfAnalysis.bounding_box.height,
          area: dxfAnalysis.bounding_box.area
        },
        dxf_capas: dxfAnalysis.entities
      })
      .select()
      .single()
    
    if (error) {
      throw new Error(`Error creando registro de archivo: ${error.message}`)
    }
    
    return data
  }
  
  private async calculateBudget(
    dxfAnalysis: DXFAnalysisResponse,
    formData: FormData
  ): Promise<BudgetCalculation> {
    // Aquí implementarías la llamada a tu backend de presupuestos
    // Por ahora, retorno un cálculo mock
    const basePrice = dxfAnalysis.cut_length.total_m * 2.5 // 2.5€ por metro de corte
    const materialMultiplier = this.getMaterialMultiplier(formData.selectedMaterial)
    const urgencyMultiplier = formData.isUrgent ? 1.5 : 1
    
    const total = basePrice * materialMultiplier * urgencyMultiplier
    
    return {
      total: Math.round(total * 100) / 100,
      currency: 'EUR',
      breakdown: {
        basePrice,
        materialMultiplier,
        urgencyMultiplier,
        cutLength: dxfAnalysis.cut_length.total_m
      }
    }
  }
  
  private getMaterialMultiplier(material: string): number {
    const multipliers: { [key: string]: number } = {
      'dm': 1.0,
      'contrachapado': 1.2,
      'metacrilato': 2.0,
      'carton': 0.8,
      'balsa': 1.5
    }
    
    return multipliers[material.toLowerCase()] || 1.0
  }
  
  private async findMaterialId(materialName: string, thickness: number): Promise<number | null> {
    try {
      // Mapear nombres del frontend a nombres de la base de datos
      const materialMap: { [key: string]: string } = {
        'Madera Balsa': 'MADERA BALSA',
        'Dm': 'DM',
        'DM': 'DM', 
        'Contrachapado': 'CONTRACHAPADO',
        'Metacrilato': 'METACRILATO',
        'Cartón Gris': 'CARTÓN GRIS',
        'cardboard': 'CARTÓN GRIS'
      }

      const dbMaterialName = materialMap[materialName] || materialName.toUpperCase()
      
      console.log(`🔍 Buscando material: "${dbMaterialName}", grosor: "${thickness}"`)
      
      // Buscar con thickness como string Y como número para mayor compatibilidad
      let { data, error } = await supabase
        .from('MATERIALES')
        .select('ID, MATERIALES, GROSORES')
        .eq('MATERIALES', dbMaterialName)
        .eq('GROSORES', thickness.toString())
        .single()

      // Si no encuentra con string, probar con diferentes variaciones
      if (error || !data) {
        console.log(`🔍 No encontrado con "${thickness}", probando variaciones...`)
        
        // Buscar todos los materiales de ese tipo para debug
        const { data: allMaterials } = await supabase
          .from('MATERIALES')
          .select('ID, MATERIALES, GROSORES')
          .eq('MATERIALES', dbMaterialName)
        
        console.log(`📋 Materiales disponibles para "${dbMaterialName}":`, allMaterials)
        
        // Buscar coincidencia manual
        const match = allMaterials?.find(m => 
          parseFloat(m.GROSORES) === thickness || 
          m.GROSORES === thickness.toString() ||
          parseFloat(m.GROSORES) === parseFloat(thickness.toString())
        )
        
        if (match) {
          console.log(`✅ Encontrado por coincidencia manual:`, match)
          return match.ID
        }
      } else {
        console.log(`✅ Material encontrado:`, data)
        return data.ID
      }

      console.warn(`❌ Material no encontrado: ${dbMaterialName}, grosor: ${thickness}`)
      return null
    } catch (error) {
      console.error('❌ Error buscando material:', error)
      return null
    }
  }

  private async createBudgetRecord(
    projectId: string,
    formData: FormData,
    dxfAnalysis: DXFAnalysisResponse,
    budgetCalculation: BudgetCalculation,
    archivoId: string
  ) {
    // Buscar el material_id correcto
    const materialId = await this.findMaterialId(
      formData.selectedMaterial, 
      formData.materialThickness || 3
    )

    const { data, error } = await supabase
      .from('PRESUPUESTOS')
      .insert({
        proyecto_id: projectId,
        descripcion: `Presupuesto para corte láser - ${formData.selectedMaterial}`,
        cantidad: 1,
        material_id: materialId,
        proceso: 'corte láser',
        precio_total: budgetCalculation.total,
        archivo_id: archivoId,
        dxf_analysis_json: dxfAnalysis,
        budget_calculation_json: budgetCalculation,
        client_requirements: {
          urgency: formData.isUrgent,
          specialRequirements: formData.specialRequirements,
          pickupType: formData.pickupType,
          pickupAddress: formData.pickupAddress,
          pickupCity: formData.pickupCity,
          pickupPostalCode: formData.pickupPostalCode,
          pickupNotes: formData.pickupNotes
        },
        pickup_type: formData.pickupType,
        pickup_address: formData.pickupAddress,
        pickup_city: formData.pickupCity,
        pickup_postal_code: formData.pickupPostalCode,
        pickup_notes: formData.pickupNotes,
        is_urgent: formData.isUrgent,
        material_provider: formData.materialProvider,
        client_material_details: formData.clientMaterialDetails,
        form_status: 'completed'
      })
      .select()
      .single()
    
    if (error) {
      throw new Error(`Error creando presupuesto: ${error.message}`)
    }
    
    return data
  }
  
  private async updateProjectStatus(projectId: string, estado: string) {
    const { error } = await supabase
      .from('PROYECTOS')
      .update({ 
        estado,
        update_at: new Date().toISOString()
      })
      .eq('id', projectId)
    
    if (error) {
      throw new Error(`Error actualizando proyecto: ${error.message}`)
    }
  }

}

// Instancia singleton del cliente de formulario
export const formClient = new FormClient()