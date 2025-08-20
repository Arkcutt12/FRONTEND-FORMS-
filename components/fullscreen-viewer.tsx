"use client"

import type React from "react"

import { X, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FullscreenViewerProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function FullscreenViewer({ isOpen, onClose, title, children }: FullscreenViewerProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex flex-col">
      {/* Header */}
      <div className="bg-white flex-shrink-0">
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
          <div className="text-[13px] font-medium text-[#52525B]">{title}</div>
          <Button variant="outline" className="rounded-xl px-3 h-10 text-[13px] font-medium bg-transparent">
            Arkcutt
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white hover:bg-black hover:bg-opacity-70"
          onClick={onClose}
        >
          <X className="h-6 w-6" />
        </Button>
        {children}
      </div>
    </div>
  )
}
