"use client"

import type React from "react"

import { useState } from "react"
import { Info, ArrowLeft, CreditCard, Calendar, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface PaymentGatewayProps {
  total: number
  onBack: () => void
  onComplete: () => void
}

export function PaymentGateway({ total, onBack, onComplete }: PaymentGatewayProps) {
  const [paymentMethod, setPaymentMethod] = useState<"card" | "paypal">("card")
  const [cardNumber, setCardNumber] = useState("")
  const [cardName, setCardName] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [cvv, setCvv] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false)
      onComplete()
    }, 2000)
  }

  const formatCardNumber = (value: string) => {
    // Remove non-digit characters
    const digits = value.replace(/\D/g, "")

    // Add space after every 4 digits
    let formatted = ""
    for (let i = 0; i < digits.length; i++) {
      if (i > 0 && i % 4 === 0) {
        formatted += " "
      }
      formatted += digits[i]
    }

    return formatted.substring(0, 19) // Limit to 16 digits + 3 spaces
  }

  const formatExpiryDate = (value: string) => {
    // Remove non-digit characters
    const digits = value.replace(/\D/g, "")

    // Format as MM/YY
    if (digits.length > 2) {
      return `${digits.substring(0, 2)}/${digits.substring(2, 4)}`
    }
    return digits
  }

  return (
    <div className="w-full bg-white">
      <div className="bg-white border-b border-[#E4E4E7]">
        <div className="flex justify-between items-center px-4 py-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-md"
              onClick={() => (window.location.href = "https://www.arkcutt.com/")}
            >
              <ArrowLeft className="h-[15px] w-[15px] text-[#52525B]" />
            </Button>
            <div className="bg-[#FAFAFA] px-1 py-0.5 rounded text-xs font-medium text-[#52525B] border border-[#E4E4E7]">
              volver
            </div>
          </div>
          <div className="text-[13px] font-medium text-[#52525B]">Pago Seguro</div>
          <div className="w-[60px]"></div> {/* Spacer for alignment */}
        </div>
        <Separator />
      </div>

      <div className="p-6 max-w-[560px] mx-auto">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Payment Method Selection */}
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <span className="text-[16px] text-[#18181B]">Método de Pago</span>
                <Info className="h-[15px] w-[15px] text-[#71717A]" />
              </div>
              <p className="text-[13px] text-[#52525B]">Selecciona tu método de pago preferido.</p>
            </div>

            <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as "card" | "paypal")}>
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 border border-[#E4E4E7]/50 shadow-sm rounded-lg">
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer">
                    <CreditCard className="h-5 w-5 text-[#52525B]" />
                    <span className="text-[13px] font-medium text-[#18181B]">Tarjeta de Crédito/Débito</span>
                  </Label>
                </div>

                <div className="flex items-center gap-2 p-3 border border-[#E4E4E7]/50 shadow-sm rounded-lg opacity-50">
                  <RadioGroupItem value="paypal" id="paypal" disabled />
                  <Label htmlFor="paypal" className="flex items-center gap-2 cursor-not-allowed">
                    <span className="text-[13px] font-medium text-[#18181B]">PayPal</span>
                    <span className="text-[11px] text-[#71717A]">(Próximamente)</span>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Card Details */}
          {paymentMethod === "card" && (
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <span className="text-[16px] text-[#18181B]">Detalles de la Tarjeta</span>
                  <Lock className="h-[15px] w-[15px] text-[#71717A]" />
                </div>
                <p className="text-[13px] text-[#52525B]">Introduce los datos de tu tarjeta de forma segura.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cardNumber" className="text-[13px] text-[#52525B]">
                    Número de Tarjeta
                  </Label>
                  <div className="relative">
                    <Input
                      id="cardNumber"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      placeholder="1234 5678 9012 3456"
                      className="pl-10"
                      required
                    />
                    <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#71717A]" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardName" className="text-[13px] text-[#52525B]">
                    Nombre en la Tarjeta
                  </Label>
                  <Input
                    id="cardName"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="NOMBRE APELLIDO"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiryDate" className="text-[13px] text-[#52525B]">
                      Fecha de Expiración
                    </Label>
                    <div className="relative">
                      <Input
                        id="expiryDate"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                        placeholder="MM/YY"
                        className="pl-10"
                        maxLength={5}
                        required
                      />
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#71717A]" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cvv" className="text-[13px] text-[#52525B]">
                      CVV
                    </Label>
                    <Input
                      id="cvv"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").substring(0, 3))}
                      placeholder="123"
                      type="password"
                      maxLength={3}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Billing Address */}
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <span className="text-[16px] text-[#18181B]">Dirección de Facturación</span>
                <Info className="h-[15px] w-[15px] text-[#71717A]" />
              </div>
              <p className="text-[13px] text-[#52525B]">Introduce tu dirección de facturación.</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-[13px] text-[#52525B]">
                    Nombre
                  </Label>
                  <Input id="firstName" placeholder="Nombre" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-[13px] text-[#52525B]">
                    Apellidos
                  </Label>
                  <Input id="lastName" placeholder="Apellidos" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-[13px] text-[#52525B]">
                  Dirección
                </Label>
                <Input id="address" placeholder="Calle y número" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="postalCode" className="text-[13px] text-[#52525B]">
                    Código Postal
                  </Label>
                  <Input id="postalCode" placeholder="28001" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city" className="text-[13px] text-[#52525B]">
                    Ciudad
                  </Label>
                  <Input id="city" placeholder="Madrid" required />
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-[16px] text-[#18181B]">Resumen del Pedido</span>
            </div>

            <div className="bg-[#FAFAFA] p-4 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[13px] text-[#52525B]">Subtotal</span>
                <span className="text-[13px] font-medium text-[#18181B]">{total.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[13px] text-[#52525B]">IVA (21%)</span>
                <span className="text-[13px] font-medium text-[#18181B]">{(total * 0.21).toFixed(2)}€</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-[14px] font-medium text-[#18181B]">Total</span>
                <span className="text-[14px] font-medium text-[#18181B]">{(total * 1.21).toFixed(2)}€</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div>
            <Separator className="mb-4" />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                className="text-[13px] font-medium text-[#18181B] bg-transparent"
                onClick={onBack}
              >
                Volver
              </Button>
              <Button
                type="submit"
                className="bg-[#27272A] text-[13px] font-medium text-[rgba(255,255,255,0.88)] hover:bg-[#18181B]"
                disabled={isProcessing}
              >
                {isProcessing ? "Procesando..." : "Pagar"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
