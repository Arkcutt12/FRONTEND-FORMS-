// import { supabase, findOrCreateUser, createProject } from './supabase'
// import { uploadDxfFile } from './storage'
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

      // 2. Simular creación de usuario (mock)
      console.log('👤 Simulando creación de usuario...')
      const user = {
        id: Math.floor(Math.random() * 1000),
        email: formData.clientEmail,
        name: formData.clientName
      }

      // 3. Generar nombre del proyecto
      const projectName = this.generateProjectName(formData)

      // 4. Simular creación de proyecto (mock)
      console.log('📋 Simulando creación de proyecto...')
      const projectId = `mock-project-${Date.now()}`
      const project = {
        id: projectId,
        name: projectName,
        user_id: user.id
      }

      // 5. Simular subida de archivo DXF (mock)
      console.log('💾 Simulando subida de archivo DXF...')
      const fileUrl = `https://mock-storage.com/dxf-files/${projectId}/${formData.dxfFile.name}`

      // 6. Simular registro de archivo (mock)
      console.log('📁 Simulando registro de archivo...')
      const archivo = {
        id: `mock-file-${Date.now()}`,
        name: formData.dxfFile.name,
        url: fileUrl
      }

      // 7. Calcular presupuesto
      console.log('💰 Calculando presupuesto...')
      const budgetCalculation = await this.calculateBudget(dxfAnalysis, formData)

      // 8. Simular creación de presupuesto (mock)
      console.log('📊 Simulando creación de presupuesto...')
      const presupuesto = {
        id: `mock-budget-${Date.now()}`,
        total: budgetCalculation.total,
        project_id: projectId
      }

      // 9. Simular actualización del proyecto (mock)
      console.log('✅ Simulando finalización del proyecto...')

      console.log('🎉 Formulario procesado exitosamente (modo simulación)!')
      console.log('📄 Resumen del procesamiento:', {
        usuario: user,
        proyecto: project,
        archivo: archivo,
        presupuesto: presupuesto,
        analisisDXF: dxfAnalysis
      })

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
  
  // Método eliminado - funcionalidad movida al submitForm principal
  
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
  
  // Método eliminado - funcionalidad deshabilitada temporalmente

  // Métodos eliminados - funcionalidad deshabilitada temporalmente

}

// Instancia singleton del cliente de formulario
export const formClient = new FormClient()