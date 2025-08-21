"use client"

import Image from "next/image"

interface EmptyFilesStateProps {
  onUploadClick: () => void
}

export function EmptyFilesState({ onUploadClick }: EmptyFilesStateProps) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-[#FAFAFA]">
      <div className="w-full max-w-[728px] h-full max-h-[724px] pt-3 pb-16 px-4 overflow-hidden flex flex-col items-center justify-center gap-4">
        <div
          className="w-[300px] h-[300px] relative flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
          onClick={onUploadClick}
        >
          <Image
            src="/images/upload-interface.png"
            alt="Subir archivo"
            width={300}
            height={300}
            className="object-contain"
            priority
          />
        </div>

        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-[#999999] text-[12px] font-normal">
            Formatos compatibles: DXF, DWG • Tamaño máximo: 10 MB por archivo
          </p>
        </div>
      </div>
    </div>
  )
}
