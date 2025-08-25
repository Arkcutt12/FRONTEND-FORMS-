"use client"

import Image from "next/image"

interface EmptyFilesStateProps {
  onUploadClick: () => void
}

export function EmptyFilesState({ onUploadClick }: EmptyFilesStateProps) {
  return (
    <div className="w-full h-full relative">
      <div
        className="w-full h-full relative cursor-pointer hover:opacity-95 transition-opacity"
        onClick={onUploadClick}
        onDragOver={(e) => {
          e.preventDefault()
          e.currentTarget.classList.add("opacity-90")
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          e.currentTarget.classList.remove("opacity-90")
        }}
        onDrop={(e) => {
          e.preventDefault()
          e.currentTarget.classList.remove("opacity-90")
          onUploadClick()
        }}
      >
        <Image
          src="/images/upload-background.png"
          alt="Subir archivo - Arrastra y suelta o haz clic para seleccionar"
          fill
          className="object-cover"
          priority
        />
      </div>
    </div>
  )
}
