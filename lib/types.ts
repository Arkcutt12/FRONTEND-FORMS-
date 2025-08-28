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
  dxfErrorAnalysis?: any | null
}
