"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Upload, Zap, Shield } from "lucide-react"

interface EmptyFilesStateProps {
  onUploadClick: () => void
}

export function EmptyFilesState({ onUploadClick }: EmptyFilesStateProps) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-[#FAFAFA]">
      <div className="w-full max-w-[728px] h-full max-h-[724px] pt-3 pb-16 px-4 overflow-hidden flex flex-col items-center justify-center gap-6">
        {/* SVG Illustration */}
        <div className="w-[160px] h-[160px] relative flex items-center justify-center">
          <Image src="/images/files.svg" alt="No files" width={160} height={160} className="object-contain" priority />
        </div>

        {/* Text Content */}
        <div className="flex flex-col items-center gap-3">
          <h3 className="text-[#333333] text-[16px] font-semibold leading-[19.2px]">Análisis DXF Profesional</h3>
          <p className="text-[#999999] text-[13px] font-normal leading-[18.2px] text-center max-w-[400px]">
            Conectado con backend especializado para análisis preciso de archivos DXF y detección de entidades fantasma.
          </p>
        </div>

        {/* Features */}
        <div className="flex flex-col gap-2 text-center">
          <div className="flex items-center gap-2 text-[12px] text-[#666666]">
            <Shield className="w-4 h-4 text-green-600" />
            <span>Backend especializado en DXF</span>
          </div>
          <div className="flex items-center gap-2 text-[12px] text-[#666666]">
            <Zap className="w-4 h-4 text-blue-600" />
            <span>Análisis en tiempo real</span>
          </div>
          <div className="flex items-center gap-2 text-[12px] text-[#666666]">
            <Upload className="w-4 h-4 text-purple-600" />
            <span>API REST optimizada</span>
          </div>
        </div>

        {/* Upload Button */}
        <div className="max-w-[400px] rounded-lg flex justify-start items-center">
          <Button
            variant="outline"
            className="h-8 px-2 py-2 bg-[rgba(0,0,0,0.02)] border border-[rgba(0,0,0,0.04)] rounded-md flex items-center gap-1"
            onClick={onUploadClick}
          >
            <div className="w-[14px] h-[14px] flex items-center justify-center">
              <Upload className="w-[14px] h-[14px] text-[#666666]" />
            </div>
            <span className="text-[#666666] text-[13px] font-medium leading-[18.2px]">Subir archivo DXF</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
