"use client"

import { useState } from "react"
import { ArrowLeft, CreditCard, Shield, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface PaymentGatewayProps {
  amount: number
  onBack: () => void
  onPaymentSuccess: () => void
}

export function PaymentGateway({ amount, onBack, onPaymentSuccess }: PaymentGatewayProps) {
  const [paymentMethod, setPaymentMethod] = useState("card")
  const [cardData, setCardData] = useState({
    number: "",
    expiry: "",
    cvv: "",
    name: "",
  })
  const [isProcessing, setIsProcessing] = useState(false)

  const handlePayment = async () => {
    setIsProcessing(true)

    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false)
      onPaymentSuccess()
    }, 2000)
  }

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ""
    const parts = []

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }

    if (parts.length) {
      return parts.join(" ")
    } else {
      return v
    }
  }

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4)
    }
    return v
  }

  return (
    <div className="w-full h-full bg-white flex flex-col">
      {/* Header */}
      <div className="bg-white flex-shrink-0 border-b border-[#E4E4E7]">
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
          <Button variant="outline" className="rounded-xl px-3 h-10 text-[13px] font-medium bg-transparent">
            Arkcutt
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Payment Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[#18181B]">Resumen del Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#52525B]">Total a pagar:</span>
              <span className="text-xl font-bold text-[#18181B]">{amount.toFixed(2)}€</span>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[#18181B]">Método de Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer">
                  <CreditCard className="h-4 w-4" />
                  Tarjeta de Crédito/Débito
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg opacity-50">
                <RadioGroupItem value="paypal" id="paypal" disabled />
                <Label htmlFor="paypal" className="cursor-not-allowed">
                  PayPal (Próximamente)
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Card Details */}
        {paymentMethod === "card" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-[#18181B]">Datos de la Tarjeta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cardName">Nombre del titular</Label>
                <Input
                  id="cardName"
                  placeholder="Nombre completo"
                  value={cardData.name}
                  onChange={(e) => setCardData((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cardNumber">Número de tarjeta</Label>
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={cardData.number}
                  onChange={(e) => setCardData((prev) => ({ ...prev, number: formatCardNumber(e.target.value) }))}
                  maxLength={19}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiry">Fecha de vencimiento</Label>
                  <Input
                    id="expiry"
                    placeholder="MM/AA"
                    value={cardData.expiry}
                    onChange={(e) => setCardData((prev) => ({ ...prev, expiry: formatExpiry(e.target.value) }))}
                    maxLength={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    placeholder="123"
                    value={cardData.cvv}
                    onChange={(e) => setCardData((prev) => ({ ...prev, cvv: e.target.value.replace(/\D/g, "") }))}
                    maxLength={4}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Security Notice */}
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-700">
              <Shield className="h-5 w-5" />
              <span className="font-medium">Pago 100% Seguro</span>
            </div>
            <p className="text-sm text-green-600 mt-2">
              Tus datos están protegidos con encriptación SSL de 256 bits. No almacenamos información de tarjetas de
              crédito.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 bg-white border-t border-[#E4E4E7] p-6">
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onBack} className="text-[13px] font-medium text-[#18181B] bg-transparent">
            Volver
          </Button>
          <Button
            onClick={handlePayment}
            disabled={isProcessing || !cardData.name || !cardData.number || !cardData.expiry || !cardData.cvv}
            className="bg-[#27272A] text-[13px] font-medium text-[rgba(255,255,255,0.88)] hover:bg-[#18181B] flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Procesando...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                Pagar {amount.toFixed(2)}€
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
