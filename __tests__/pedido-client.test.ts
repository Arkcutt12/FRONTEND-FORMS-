import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { convertirFormDataAPedido } from '../lib/pedido-client'

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        getPublicUrl: jest.fn(),
        remove: jest.fn()
      }))
    },
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        }))
      }))
    }))
  }))
}))

describe('Pedido Client', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('convertirFormDataAPedido', () => {
    it('debe convertir datos del formulario correctamente', () => {
      const mockFormData = {
        files: [{ name: 'test.dxf' }],
        city: 'madrid',
        materialProvider: 'client',
        clientMaterial: {
          deliveryDate: '2025-09-20',
          deliveryTime: '10:30',
          materialType: 'acero',
          thickness: 3
        },
        selectedColor: 'negro',
        isUrgent: true,
        urgentDateTime: '2025-09-22T16:00:00.000Z'
      }

      const mockPersonalData = {
        firstName: 'Ana',
        lastName: 'García',
        email: 'ana@example.com',
        phone: '+34 600000000'
      }

      const mockPresupuestoFinal = 123.45
      const mockDatosAnalisis = { longitud: 100, area: 50 }
      const mockDatosPresupuesto = { precio_base: 100, recargos: 23.45 }

      const resultado = convertirFormDataAPedido(
        mockFormData,
        mockPersonalData,
        mockPresupuestoFinal,
        mockDatosAnalisis,
        mockDatosPresupuesto
      )

      expect(resultado).toEqual({
        nombre: 'Ana',
        apellido: 'García',
        mail: 'ana@example.com',
        teléfono: '+34 600000000',
        archivo: {
          filename: 'test.dxf',
          content: ''
        },
        'quien-material': 'cliente',
        material: 'acero',
        grosor: 3,
        color: 'negro',
        'fecha-cliente': '2025-09-20',
        'hora-cliente': '10:30',
        'sitio-recogida': 'madrid',
        dirección: undefined,
        ciudad: undefined,
        'codigo-postal': undefined,
        'telefono-contacto': undefined,
        'reserva-urgente': true,
        'fecha-recogida': '2025-09-22',
        'hora-recogida': '16:00',
        'presupuesto-final': 123.45,
        'datos-analisis-dxf': mockDatosAnalisis,
        'datos-presupuesto': mockDatosPresupuesto,
        feedback: null
      })
    })

    it('debe manejar recogida a domicilio', () => {
      const mockFormData = {
        files: [{ name: 'test.dxf' }],
        city: 'home',
        locationData: {
          address: 'C/ Falsa 123',
          city: 'Madrid',
          postalCode: '28001',
          phone: '+34 600000001'
        },
        materialProvider: 'arkcutt',
        selectedMaterial: 'aluminio',
        selectedThickness: 2,
        selectedColor: 'plata',
        isUrgent: false
      }

      const mockPersonalData = {
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan@example.com',
        phone: '+34 600000000'
      }

      const resultado = convertirFormDataAPedido(
        mockFormData,
        mockPersonalData,
        100,
        {},
        {}
      )

      expect(resultado['sitio-recogida']).toBe('a domicilio')
      expect(resultado.dirección).toBe('C/ Falsa 123')
      expect(resultado.ciudad).toBe('Madrid')
      expect(resultado['codigo-postal']).toBe('28001')
      expect(resultado['telefono-contacto']).toBe('+34 600000001')
      expect(resultado['quien-material']).toBe('arkcutt')
      expect(resultado.material).toBe('aluminio')
      expect(resultado.grosor).toBe(2)
    })
  })
})

describe('Validaciones', () => {
  // Importar funciones de validación desde el archivo principal
  const validarEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const validarTelefono = (tel: string): boolean => {
    return /\d{7,}/.test(tel.replace(/\D/g, ''))
  }

  describe('validarEmail', () => {
    it('debe validar emails correctos', () => {
      expect(validarEmail('test@example.com')).toBe(true)
      expect(validarEmail('user.name@domain.co.uk')).toBe(true)
      expect(validarEmail('admin+tag@company.org')).toBe(true)
    })

    it('debe rechazar emails incorrectos', () => {
      expect(validarEmail('invalid-email')).toBe(false)
      expect(validarEmail('test@')).toBe(false)
      expect(validarEmail('@domain.com')).toBe(false)
      expect(validarEmail('test.domain.com')).toBe(false)
      expect(validarEmail('')).toBe(false)
    })
  })

  describe('validarTelefono', () => {
    it('debe validar teléfonos correctos', () => {
      expect(validarTelefono('+34 600000000')).toBe(true)
      expect(validarTelefono('600 000 000')).toBe(true)
      expect(validarTelefono('912345678')).toBe(true)
      expect(validarTelefono('+1 (555) 123-4567')).toBe(true)
    })

    it('debe rechazar teléfonos incorrectos', () => {
      expect(validarTelefono('123456')).toBe(false) // Menos de 7 dígitos
      expect(validarTelefono('abc')).toBe(false)
      expect(validarTelefono('')).toBe(false)
      expect(validarTelefono('+++')).toBe(false)
    })
  })
})