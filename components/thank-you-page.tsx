"use client"

import { useState, useEffect } from "react"
import {
  CheckCircle,
  FileText,
  Mail,
  Phone,
  Clock,
  ArrowRight,
  Download,
  Share2,
  Calculator,
  Euro,
  Calendar,
  Truck,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BudgetClient, type BudgetResponse } from "@/lib/budget-client"
import type { ThankYouPageProps } from "@/lib/types"
import { getSelectedMaterial, getSelectedCity } from "@/lib/utils"

export function ThankYouPage({
  personalData,
  formData,
  onClose,
  dxfAnalysisData,
  dxfErrorAnalysis,
}: ThankYouPageProps) {
  const [budget, setBudget] = useState<BudgetResponse | null>(null)
  const [budgetLoading, setBudgetLoading] = useState(true)
  const [budgetError, setBudgetError] = useState<string | null>(null)
  const [pdfGenerating, setPdfGenerating] = useState(false)

  const requestNumber = `DXF${Math.floor(100000 + Math.random() * 900000)}`
  const currentDate = new Date()
  const budgetClient = new BudgetClient()

  const calculateBudget = async () => {
    if (!dxfAnalysisData) {
      setBudgetError("No se pueden calcular los costos sin análisis DXF")
      setBudgetLoading(false)
      return
    }

    setBudgetLoading(true)
    setBudgetError(null)

    try {
      const completeFormData = generateFormDataJSON()
      console.log("[v0] Sending data to budget API:", JSON.stringify(completeFormData, null, 2))
      const budgetResponse = await budgetClient.calculateBudget(completeFormData)
      console.log("[v0] Budget API response:", JSON.stringify(budgetResponse, null, 2))

      console.log("[v0] Budget response keys:", Object.keys(budgetResponse || {}))
      if (budgetResponse) {
        console.log("[v0] Budget response type:", typeof budgetResponse)
        console.log("[v0] Budget response structure analysis:")
        console.log("  - presupuesto exists:", !!budgetResponse.presupuesto)
        console.log("  - desglose exists:", !!budgetResponse.desglose)
        console.log("  - condiciones exists:", !!budgetResponse.condiciones)

        if (budgetResponse.presupuesto) {
          console.log("  - presupuesto keys:", Object.keys(budgetResponse.presupuesto))
          console.log("  - total value:", budgetResponse.presupuesto.total)
          console.log("  - numero_presupuesto:", budgetResponse.presupuesto.numero_presupuesto)
        }
      }

      setBudget(budgetResponse)
    } catch (error) {
      console.log("[v0] Budget calculation error:", error)
      setBudgetError(error instanceof Error ? error.message : "Error desconocido")
    } finally {
      setBudgetLoading(false)
    }
  }

  const generateFormDataJSON = () => {
    const processLayerData = () => {
      if (!dxfAnalysisData?.entities?.valid) {
        return []
      }

      const layerMap = new Map<string, { vectorCount: number; totalLength: number; area: number }>()

      dxfAnalysisData.entities.valid.forEach((entity: any) => {
        const layerName = entity.layer || "0"
        const current = layerMap.get(layerName) || { vectorCount: 0, totalLength: 0, area: 0 }

        layerMap.set(layerName, {
          vectorCount: current.vectorCount + 1,
          totalLength: current.totalLength + entity.length,
          area: current.area,
        })
      })

      return Array.from(layerMap.entries()).map(([layerName, data]) => ({
        nombre: layerName,
        vectores: data.vectorCount,
        longitud_mm: Math.round(data.totalLength * 100) / 100,
        longitud_m: Math.round((data.totalLength / 1000) * 100) / 100,
        area_material: data.area || 0,
      }))
    }

    const selectedMaterialRaw = getSelectedMaterial(formData.selectedMaterial) || "No especificado"
    let selectedMaterial = selectedMaterialRaw

    // Convert DM to Dm for backend compatibility
    if (selectedMaterialRaw === "DM" || selectedMaterialRaw === "dm") {
      selectedMaterial = "Dm"
    }

    const selectedCity = getSelectedCity(formData.city) || "No especificado"

    let selectedColor = formData.selectedColor || "No especificado"
    if (selectedMaterial === "Dm") {
      selectedColor = "natural" // Force natural color for Dm materials
    }

    return {
      Cliente: {
        "Nombre y Apellidos":
          `${personalData.firstName || ""} ${personalData.lastName || ""}`.trim() || "No especificado",
        Mail: personalData.email || "no-email@example.com",
        "Número de Teléfono": personalData.phone || "No especificado",
      },
      Pedido: {
        "Número de solicitud": requestNumber,
        "Fecha de solicitud": currentDate.toISOString(),
        "Material seleccionado": selectedMaterial,
        "Longitud vector total": `${((dxfAnalysisData?.cut_length?.total_mm || 0) / 1000).toFixed(3)} m`,
        "Area material": `${dxfAnalysisData?.bounding_box?.area || 0} mm²`,
        "Solicitud urgente": Boolean(formData.isUrgent),
        "¿Quién proporciona el material?":
          formData.materialProvider === "arkcutt"
            ? {
                proveedor: "Arkcutt",
                "Material seleccionado": selectedMaterial,
                Grosor: formData.selectedThickness || "No especificado",
                Color: selectedColor,
              }
            : {
                proveedor: "Cliente",
                "Fecha de entrega": formData.clientMaterial?.deliveryDate || "No especificado",
                "Hora de entrega": formData.clientMaterial?.deliveryTime || "No especificado",
                "Tipo de Material": formData.clientMaterial?.materialType || "No especificado",
                Grosor: formData.clientMaterial?.thickness || "No especificado",
              },
        Capas: processLayerData(),
        "Datos Recogida":
          formData.city === "home"
            ? {
                tipo: "A domicilio",
                nombre: formData.locationData?.name || "No especificado",
                telefono: formData.locationData?.phone || "No especificado",
                direccion: formData.locationData?.address || "No especificado",
                ciudad: formData.locationData?.city || "No especificado",
                codigo_postal: formData.locationData?.postalCode || "No especificado",
              }
            : {
                tipo: "Recogida en tienda",
                ciudad_seleccionada: selectedCity,
              },
      },
    }
  }

  const handleRetryBudget = () => {
    calculateBudget()
  }

  const handleGeneratePDF = async () => {
    if (!budget) return

    setPdfGenerating(true)
    try {
      const completeFormData = generateFormDataJSON()
      const pdfBlob = await budgetClient.generatePDF(completeFormData)
      const url = URL.createObjectURL(pdfBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = `presupuesto-${getBudgetValue("numero_presupuesto", getBudgetValue("presupuesto.numero_presupuesto", requestNumber))}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      alert("Error al descargar el PDF del backend. Inténtalo de nuevo.")
    } finally {
      setPdfGenerating(false)
    }
  }

  const handleShare = async () => {
    const budgetNumber = budget?.presupuesto?.numero_presupuesto || budget?.numero_presupuesto || requestNumber
    const totalAmount = budget?.presupuesto?.total || budget?.total || 0

    const shareData = {
      title: "Presupuesto de Corte Láser - Arkcutt",
      text: `Mi presupuesto #${budgetNumber} está listo. Total: €${totalAmount.toFixed(2)}`,
      url: window.location.href,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        console.log("Error sharing:", err)
      }
    } else {
      navigator.clipboard.writeText(`${shareData.text} - ${shareData.url}`)
      alert("Información copiada al portapapeles")
    }
  }

  const handleEmailSupport = () => {
    const budgetNumber = budget?.presupuesto?.numero_presupuesto || budget?.numero_presupuesto || requestNumber
    window.location.href = `mailto:info@arkcutt.com?subject=Consulta sobre presupuesto ${budgetNumber}&body=Hola,%0D%0A%0D%0ATengo una consulta sobre mi presupuesto número ${budgetNumber}.%0D%0A%0D%0AGracias.`
  }

  const handlePhoneSupport = () => {
    window.location.href = "tel:+34677649458"
  }

  useEffect(() => {
    calculateBudget()
  }, [dxfAnalysisData, dxfErrorAnalysis, personalData, formData])

  const getBudgetValue = (path: string, fallback: any = "N/A") => {
    try {
      if (budget && path.includes(".")) {
        const keys = path.split(".")
        let value = budget
        for (const key of keys) {
          value = value?.[key]
        }
        if (value !== undefined && value !== null) return value
      }

      // Try direct access to the field
      if (budget && budget[path] !== undefined && budget[path] !== null) {
        return budget[path]
      }

      return fallback
    } catch {
      return fallback
    }
  }

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm border-b border-[#E4E4E7]"></div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-[600px] mx-auto space-y-6">
          {budgetLoading ? (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-center gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <div>
                    <p className="text-[16px] font-medium text-blue-900">Calculando presupuesto...</p>
                    <p className="text-[13px] text-blue-700">Analizando tus archivos y generando costos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : budgetError ? (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-800">
                <div className="flex items-center justify-between">
                  <span>{budgetError}</span>
                  <Button variant="outline" size="sm" onClick={handleRetryBudget} className="ml-4 bg-transparent">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reintentar
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          ) : budget ? (
            <>
              {/* Budget Summary */}
              <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <CardTitle className="text-[18px] text-green-900 flex items-center gap-2 flex-shrink-0">
                      <Calculator className="h-5 w-5" />
                      <span className="truncate">
                        Presupuesto #
                        {getBudgetValue(
                          "numero_presupuesto",
                          getBudgetValue("presupuesto.numero_presupuesto", requestNumber),
                        )}
                      </span>
                    </CardTitle>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleGeneratePDF}
                        disabled={pdfGenerating}
                        className="flex-1 sm:flex-none bg-transparent"
                      >
                        {pdfGenerating ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4 mr-2" />
                        )}
                        PDF
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleShare}
                        className="flex-1 sm:flex-none bg-transparent"
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Compartir
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-4">
                    <div className="text-[32px] font-bold text-green-900 flex items-center justify-center gap-1">
                      <Euro className="h-6 w-6" />
                      {(getBudgetValue("data.total", getBudgetValue("total", 0)) as number).toFixed(2)}
                    </div>
                    <p className="text-[14px] text-green-700">IVA no incluido</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-green-200">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-[14px] font-medium text-green-900">
                        <Calendar className="h-4 w-4" />
                        48h
                      </div>
                      <p className="text-[12px] text-green-700">Tiempo de entrega</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-[14px] font-medium text-green-900">
                        <Clock className="h-4 w-4" />
                        30 días
                      </div>
                      <p className="text-[12px] text-green-700">Validez del presupuesto</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-yellow-200 bg-yellow-50">
                <CardHeader>
                  <CardTitle className="text-[16px] text-yellow-900">Debug: Respuesta de la API</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-[10px] text-yellow-800 overflow-auto max-h-40 bg-yellow-100 p-2 rounded">
                    {JSON.stringify(budget, null, 2)}
                  </pre>
                </CardContent>
              </Card>

              {/* Budget Breakdown */}
              {(budget?.desglose || budget?.breakdown) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-[16px]">Desglose de Costos</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {(budget.desglose?.corte_laser || budget.breakdown?.laser_cutting) && (
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-[14px] font-medium text-[#18181B]">Corte Láser</p>
                            <p className="text-[12px] text-[#71717A]">
                              {getBudgetValue(
                                "desglose.corte_laser.longitud_total_m",
                                getBudgetValue("breakdown.laser_cutting.total_length_m", 0),
                              )}
                              m × €
                              {getBudgetValue(
                                "desglose.corte_laser.precio_por_metro",
                                getBudgetValue("breakdown.laser_cutting.price_per_meter", 0),
                              )}
                              /m
                            </p>
                          </div>
                          <span className="text-[14px] font-medium">
                            €
                            {(
                              getBudgetValue(
                                "desglose.corte_laser.subtotal",
                                getBudgetValue("breakdown.laser_cutting.subtotal", 0),
                              ) as number
                            ).toFixed(2)}
                          </span>
                        </div>
                      )}

                      {budget.desglose?.material && (
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-[14px] font-medium text-[#18181B]">Material</p>
                            <p className="text-[12px] text-[#71717A]">
                              {budget.desglose.material.tipo} × {budget.desglose.material.cantidad}
                            </p>
                          </div>
                          <span className="text-[14px] font-medium">
                            €{budget.desglose.material.subtotal?.toFixed(2) || "0.00"}
                          </span>
                        </div>
                      )}

                      {budget.desglose?.urgencia && (
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-[14px] font-medium text-orange-600">Recargo por Urgencia</p>
                            <p className="text-[12px] text-orange-500">
                              +{budget.desglose.urgencia.recargo_porcentaje}%
                            </p>
                          </div>
                          <span className="text-[14px] font-medium text-orange-600">
                            €{budget.desglose.urgencia.subtotal?.toFixed(2) || "0.00"}
                          </span>
                        </div>
                      )}

                      {budget.desglose?.entrega && (
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-[14px] font-medium text-[#18181B]">Entrega</p>
                            <p className="text-[13px] text-[#71717A]">{budget.desglose.entrega.tipo}</p>
                          </div>
                          <span className="text-[14px] font-medium">
                            €{budget.desglose.entrega.precio?.toFixed(2) || "0.00"}
                          </span>
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[14px] text-[#71717A]">Subtotal</span>
                        <span className="text-[14px]">
                          €
                          {(getBudgetValue("subtotal", getBudgetValue("presupuesto.subtotal", 0)) as number).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[14px] text-[#71717A]">IVA (21%)</span>
                        <span className="text-[14px]">
                          €{(getBudgetValue("iva", getBudgetValue("presupuesto.iva", 0)) as number).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[16px] font-semibold">
                        <span>Total</span>
                        <span>
                          €{(getBudgetValue("total", getBudgetValue("presupuesto.total", 0)) as number).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Payment and Conditions */}
              {budget?.condiciones && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-[16px]">Condiciones del Servicio</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="flex items-start gap-3">
                        <Truck className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-[14px] font-medium text-[#18181B]">Tiempo de Entrega</p>
                          <p className="text-[13px] text-[#71717A]">
                            {getBudgetValue(
                              "tiempo_entrega_dias",
                              getBudgetValue("condiciones.tiempo_entrega_dias", "N/A"),
                            )}{" "}
                            días laborables desde la confirmación del pedido
                          </p>
                        </div>
                      </div>

                      {budget.condiciones?.forma_pago && (
                        <div className="flex items-start gap-3">
                          <Euro className="h-5 w-5 text-green-600 mt-0.5" />
                          <div>
                            <p className="text-[14px] font-medium text-[#18181B]">Formas de Pago</p>
                            <p className="text-[13px] text-[#71717A]">{budget.condiciones.forma_pago.join(", ")}</p>
                          </div>
                        </div>
                      )}

                      {budget.condiciones?.garantia_meses && (
                        <div className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-purple-600 mt-0.5" />
                          <div>
                            <p className="text-[14px] font-medium text-[#18181B]">Garantía</p>
                            <p className="text-[13px] text-[#71717A]">
                              {getBudgetValue("garantia_meses", getBudgetValue("condiciones.garantia_meses", "N/A"))}{" "}
                              meses de garantía en el servicio
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {budget.condiciones?.notas && budget.condiciones.notas.length > 0 && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-[13px] font-medium text-blue-900 mb-2">Notas importantes:</p>
                        <ul className="text-[12px] text-blue-800 space-y-1">
                          {budget.condiciones.notas.map((nota, index) => (
                            <li key={index}>• {nota}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          ) : null}

          {/* Contact Information */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-[16px] font-medium text-[#18181B] mb-4">Datos de Contacto</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-[14px] font-medium text-[#18181B]">
                      {personalData.firstName} {personalData.lastName}
                    </p>
                    <p className="text-[12px] text-[#71717A]">Nombre completo</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <Mail className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-[14px] font-medium text-[#18181B]">{personalData.email}</p>
                    <p className="text-[12px] text-[#71717A]">Correo electrónico</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <Phone className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-[14px] font-medium text-[#18181B]">{personalData.phone}</p>
                    <p className="text-[12px] text-[#71717A]">Teléfono</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Support */}
          <Card className="border-gray-200">
            <CardContent className="p-6">
              <div className="text-center space-y-3">
                <h3 className="text-[16px] font-medium text-[#18181B]">¿Necesitas ayuda?</h3>
                <p className="text-[13px] text-[#52525B]">
                  Si tienes alguna pregunta sobre tu presupuesto, no dudes en contactarnos
                </p>
                <div className="flex justify-center gap-3">
                  <Button variant="outline" size="sm" onClick={handleEmailSupport}>
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </Button>
                  <Button variant="outline" size="sm" onClick={handlePhoneSupport}>
                    <Phone className="h-4 w-4 mr-2" />
                    Teléfono
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm border-t border-[#E4E4E7] p-6">
        <div className="max-w-[600px] mx-auto flex justify-between items-center">
          <div className="text-[12px] text-[#71717A]">
            Presupuesto #
            {getBudgetValue("numero_presupuesto", getBudgetValue("presupuesto.numero_presupuesto", requestNumber))} •{" "}
            {currentDate.toLocaleDateString()}
          </div>
          <Button onClick={onClose} className="bg-[#27272A] hover:bg-[#18181B]">
            <ArrowRight className="h-4 w-4 mr-2" />
            Continuar
          </Button>
        </div>
      </div>
    </div>
  )
}
