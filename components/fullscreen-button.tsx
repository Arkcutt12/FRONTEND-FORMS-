"use client"

import { Button } from "@/components/ui/button"
import { ArrowsPointingOutMini } from "@medusajs/icons"

interface FullscreenButtonProps {
  onClick: () => void
  className?: string
}

export function FullscreenButton({ onClick, className = "" }: FullscreenButtonProps) {
  return (
    <Button
      variant="outline"
      size="icon"
      className={`absolute top-2 left-2 h-7 w-7 bg-white shadow-sm rounded-md z-10 ${className}`}
      onClick={onClick}
      title="Pantalla completa"
    >
      <ArrowsPointingOutMini className="h-[15px] w-[15px] text-[#52525B]" />
    </Button>
  )
}
