"use client"

import { Upload, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FileUploadAreaProps {
  onUploadClick: () => void
  hasFiles: boolean
}

export function FileUploadArea({ onUploadClick, hasFiles }: FileUploadAreaProps) {
  if (hasFiles) {
    return null // Don't show this component when files are uploaded
  }

  return (
    <div className="w-full h-full flex flex-col justify-center items-center gap-2.5 bg-[#FAFAFA]">
      <div className="w-[334px] flex flex-col justify-start items-center">
        {/* Preview mockup area */}
        <div className="w-[334px] h-[124px] rounded-t-lg border-l border-t border-r border-[#E0E0E0] bg-white relative">
          {/* Placeholder elements inside preview */}
          <div className="absolute top-4 left-4 space-y-2">
            <div className="w-[18px] h-[18px] bg-[#F5F5F5] rounded-sm"></div>
            <div className="w-[42px] h-2 bg-[#F5F5F5] rounded-sm"></div>
            <div className="w-[36px] h-2 bg-[#F5F5F5] rounded-sm"></div>
          </div>
        </div>

        {/* Divider line */}
        <div className="w-[334px] h-0 border-t border-[#E0E0E0]"></div>

        {/* Upload flow visualization */}
        <div className="w-[60px] flex flex-col justify-start items-center mt-4">
          {/* Upload circle */}
          <div className="w-[60px] h-[60px] p-[18px] bg-[#F5F5F5] rounded-full border border-[#E0E0E0] flex justify-center items-center">
            <div className="w-6 h-6 relative">
              <Upload className="w-6 h-6 text-[rgba(33,32,28,0.80)]" strokeWidth={1.5} />
            </div>
          </div>

          {/* Dotted line */}
          <div className="w-0.5 h-10 border-l-2 border-dashed border-[rgba(33,32,28,0.80)] my-2"></div>

          {/* Download arrow */}
          <div className="w-6 h-6 relative">
            <ChevronDown className="w-6 h-6 text-[rgba(33,32,28,0.80)]" strokeWidth={1.5} />
          </div>
        </div>
      </div>

      {/* Main title */}
      <div
        className="text-center flex justify-center flex-col text-[#21201C] text-[26px] font-normal leading-10"
        style={{ fontFamily: "serif" }}
      >
        Subir Archivo .dxf
      </div>

      {/* Description */}
      <div className="w-[215px] flex flex-col justify-start items-start gap-5">
        <div className="flex flex-col justify-start items-start gap-8">
          <div
            className="w-[215px] text-center flex justify-center flex-col text-[#21201C] text-base font-light leading-[18px]"
            style={{ fontFamily: "TWK Lausanne, sans-serif" }}
          >
            Sube tu archivo y comienza tu proceso de pedido
          </div>
        </div>
      </div>

      {/* Upload button */}
      <Button
        onClick={onUploadClick}
        className="h-[37px] px-[30px] py-[5px] bg-[#F5F5F5] border border-[#E0E0E0] hover:bg-[#EEEEEE] flex justify-center items-center gap-0.5"
        variant="outline"
      >
        <Upload className="w-[14px] h-[14px] text-[rgba(33,32,28,0.80)]" strokeWidth={1} />
        <span
          className="text-center flex justify-center flex-col text-[rgba(33,32,28,0.80)] text-xs font-light leading-6"
          style={{ fontFamily: "TWK Lausanne, sans-serif" }}
        >
          Subir Archivo
        </span>
      </Button>
    </div>
  )
}
