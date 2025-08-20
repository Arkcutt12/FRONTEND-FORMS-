"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, Trash2, FileIcon, Eye } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface FileUploadProps {
  files: File[]
  setFiles: (files: File[]) => void
  onPreviewFile: (file: File) => void
  maxFiles?: number
  maxSize?: number
  accept?: Record<string, string[]>
  filePrice?: number
}

export function FileUpload({
  files,
  setFiles,
  onPreviewFile,
  maxFiles = 5,
  maxSize = 50 * 1024 * 1024, // 50MB default
  accept = { "application/dxf": [".dxf"], "application/dwg": [".dwg"] },
  filePrice = 0, // Default to 0 for no price display
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
  }

  const handleFiles = (fileList: FileList) => {
    const newFiles: File[] = []

    Array.from(fileList).forEach((file) => {
      // Check file size
      if (file.size > maxSize) {
        alert(`El archivo ${file.name} excede el tamaño máximo permitido de ${(maxSize / (1024 * 1024)).toFixed(0)}MB`)
        return
      }

      // Check file extension
      const fileExtension = file.name.split(".").pop()?.toLowerCase()
      if (!fileExtension || !["dxf", "dwg"].includes(fileExtension)) {
        alert(`Solo se permiten archivos DXF y DWG`)
        return
      }

      newFiles.push(file)
    })

    if (files.length + newFiles.length > maxFiles) {
      alert(`Solo puedes subir un máximo de ${maxFiles} archivos`)
      return
    }

    const updatedFiles = [...files, ...newFiles]
    setFiles(updatedFiles)

    // Automatically preview the first new file
    if (newFiles.length > 0) {
      onPreviewFile(newFiles[0])
    }
  }

  const removeFile = (index: number) => {
    const newFiles = [...files]
    const removedFile = newFiles[index]
    newFiles.splice(index, 1)
    setFiles(newFiles)

    // If we removed the currently previewed file and there are other files, preview the first one
    if (newFiles.length > 0) {
      onPreviewFile(newFiles[0])
    }
  }

  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const getFileNameWithoutExtension = (fileName: string) => {
    const lastDotIndex = fileName.lastIndexOf(".")
    if (lastDotIndex === -1) return fileName
    return fileName.substring(0, lastDotIndex)
  }

  const getFileExtension = (fileName: string) => {
    const lastDotIndex = fileName.lastIndexOf(".")
    if (lastDotIndex === -1) return ""
    return fileName.substring(lastDotIndex)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B"
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    else return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept=".dxf,.dwg"
        multiple={maxFiles > 1}
        className="hidden"
      />

      {files.length === 0 && (
        <div
          onClick={openFileDialog}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "border border-[#D4D4D8] rounded-lg bg-[#FAFAFA] h-[120px] flex flex-col items-center justify-center p-6 cursor-pointer transition-colors",
            isDragging ? "border-[#18181B] bg-[#F4F4F5]" : "hover:border-[#A1A1AA]",
          )}
        >
          <div className="flex items-center gap-2 text-[13px] font-medium text-[#52525B]">
            <Upload className="h-[15px] w-[15px]" />
            Import Files
          </div>
          <p className="text-[13px] text-[#71717A]">Drag and drop files here or click to upload</p>
          <p className="text-[11px] text-[#71717A] mt-1">Tamaño máximo: 50MB. Formatos: .dxf, .dwg</p>
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div key={index} className="px-3 py-2 bg-[#FAFAFA] shadow-sm rounded-lg flex justify-between items-center">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-6 h-8 bg-white shadow-[0px_0px_0px_1px_rgba(0,0,0,0.08)] rounded flex items-center justify-center">
                  <FileIcon className="w-4 h-4 text-[#52525B]" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center">
                    <span className="text-[13px] font-medium text-[#18181B]">
                      {getFileNameWithoutExtension(file.name)}
                    </span>
                    <span className="text-[13px] text-[#52525B]">{getFileExtension(file.name)}</span>
                  </div>
                  <span className="text-[11px] text-[#71717A]">{formatFileSize(file.size)}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {filePrice > 0 && (
                  <>
                    <span className="text-[13px] text-[#52525B]">+</span>
                    <span className="text-[13px] text-[#52525B]">{filePrice.toFixed(2)}€</span>
                  </>
                )}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-md hover:bg-blue-50 hover:text-blue-500 transition-colors"
                    onClick={() => onPreviewFile(file)}
                    title="Previsualizar archivo"
                  >
                    <Eye className="h-[15px] w-[15px] text-[#52525B]" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-md hover:bg-red-50 hover:text-red-500 transition-colors"
                    onClick={() => removeFile(index)}
                    title="Eliminar archivo"
                  >
                    <Trash2 className="h-[15px] w-[15px] text-[#52525B]" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          <Button onClick={openFileDialog} variant="outline" className="w-full mt-2 text-[13px] font-medium">
            <Upload className="h-[15px] w-[15px] mr-2" />
            Añadir más archivos
          </Button>
        </div>
      )}
    </div>
  )
}
