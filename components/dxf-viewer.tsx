"use client"

import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { DXFLoader } from "@/lib/dxf-loader"
import { Button } from "@/components/ui/button"
import { X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react"
import { FullscreenButton } from "@/components/fullscreen-button"
import { FullscreenViewer } from "@/components/fullscreen-viewer"

interface DXFViewerProps {
  file: File | null
  onClose: () => void
}

export function DXFViewer({ file, onClose }: DXFViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const fullscreenContainerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scene, setScene] = useState<THREE.Scene | null>(null)
  const [camera, setCamera] = useState<THREE.PerspectiveCamera | null>(null)
  const [controls, setControls] = useState<OrbitControls | null>(null)
  const [renderer, setRenderer] = useState<THREE.WebGLRenderer | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const setupViewer = (container: HTMLDivElement) => {
    if (!file) return

    setLoading(true)
    setError(null)

    const width = container.clientWidth
    const height = container.clientHeight

    // Setup scene
    const newScene = new THREE.Scene()
    newScene.background = new THREE.Color(0xfafafa)
    setScene(newScene)

    // Setup camera
    const newCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000)
    newCamera.position.set(0, 0, 100)
    setCamera(newCamera)

    // Setup renderer
    const newRenderer = new THREE.WebGLRenderer({ antialias: true })
    newRenderer.setSize(width, height)
    newRenderer.setPixelRatio(window.devicePixelRatio)
    container.appendChild(newRenderer.domElement)
    setRenderer(newRenderer)

    // Setup controls
    const newControls = new OrbitControls(newCamera, newRenderer.domElement)
    newControls.enableDamping = true
    newControls.dampingFactor = 0.25
    newControls.screenSpacePanning = true
    setControls(newControls)

    // Add grid and axes helpers
    const gridHelper = new THREE.GridHelper(100, 100, 0xd4d4d8, 0xe4e4e7)
    gridHelper.rotation.x = Math.PI / 2
    newScene.add(gridHelper)

    const axesHelper = new THREE.AxesHelper(50)
    newScene.add(axesHelper)

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    newScene.add(ambientLight)

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
    directionalLight.position.set(0, 1, 0)
    newScene.add(directionalLight)

    // Load and parse DXF file
    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        if (!event.target?.result) throw new Error("Failed to read file")

        const dxfContent = event.target.result as string

        // Use our custom DXF loader to parse and render the DXF content
        const loader = new DXFLoader()
        const dxfObject = await loader.parse(dxfContent)

        // Clear any previous content
        newScene.children = newScene.children.filter(
          (child) =>
            child === gridHelper || child === axesHelper || child === ambientLight || child === directionalLight,
        )

        newScene.add(dxfObject)

        // Center camera on the DXF content
        const box = new THREE.Box3().setFromObject(dxfObject)
        const center = box.getCenter(new THREE.Vector3())
        const size = box.getSize(new THREE.Vector3())

        // Adjust camera position to fit the object
        const maxDim = Math.max(size.x, size.y)
        const fov = newCamera.fov * (Math.PI / 180)
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2))
        cameraZ *= 1.5 // Add some margin

        newCamera.position.set(center.x, center.y, cameraZ)
        newControls.target.set(center.x, center.y, 0)

        newCamera.updateProjectionMatrix()
        newControls.update()

        setLoading(false)
      } catch (err) {
        console.error("Error parsing DXF:", err)
        setError("Error al cargar el archivo DXF. Verifique que el formato sea correcto.")
        setLoading(false)
      }
    }

    reader.onerror = () => {
      setError("Error al leer el archivo.")
      setLoading(false)
    }

    reader.readAsText(file)

    // Animation loop
    let animationFrameId: number
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)
      if (newControls) newControls.update()
      if (newRenderer && newScene && newCamera) newRenderer.render(newScene, newCamera)
    }
    animate()

    // Handle window resize
    const handleResize = () => {
      if (!container) return
      const newWidth = container.clientWidth
      const newHeight = container.clientHeight

      if (newCamera) {
        newCamera.aspect = newWidth / newHeight
        newCamera.updateProjectionMatrix()
      }

      if (newRenderer) {
        newRenderer.setSize(newWidth, newHeight)
      }
    }

    window.addEventListener("resize", handleResize)

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize)
      cancelAnimationFrame(animationFrameId)
      if (newRenderer && container.contains(newRenderer.domElement)) {
        container.removeChild(newRenderer.domElement)
      }
      if (newRenderer) newRenderer.dispose()
    }
  }

  useEffect(() => {
    if (!file || !containerRef.current) return

    const cleanup = setupViewer(containerRef.current)

    return cleanup
  }, [file])

  useEffect(() => {
    if (isFullscreen && fullscreenContainerRef.current) {
      // Clean up previous renderer
      if (renderer) {
        renderer.dispose()
      }

      // Setup new viewer in fullscreen container
      const cleanup = setupViewer(fullscreenContainerRef.current)

      return cleanup
    }
  }, [isFullscreen, file])

  const resetView = () => {
    if (!scene || !camera || !controls) return

    // Find the DXF object
    const dxfObject = scene.children.find(
      (child) =>
        child !== scene.children.find((c) => c instanceof THREE.GridHelper) &&
        child !== scene.children.find((c) => c instanceof THREE.AxesHelper) &&
        child !== scene.children.find((c) => c instanceof THREE.AmbientLight) &&
        child !== scene.children.find((c) => c instanceof THREE.DirectionalLight),
    )

    if (dxfObject) {
      // Center camera on the DXF content
      const box = new THREE.Box3().setFromObject(dxfObject)
      const center = box.getCenter(new THREE.Vector3())
      const size = box.getSize(new THREE.Vector3())

      // Adjust camera position to fit the object
      const maxDim = Math.max(size.x, size.y)
      const fov = camera.fov * (Math.PI / 180)
      let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2))
      cameraZ *= 1.5 // Add some margin

      camera.position.set(center.x, center.y, cameraZ)
      controls.target.set(center.x, center.y, 0)

      camera.updateProjectionMatrix()
      controls.update()
    }
  }

  const zoomIn = () => {
    if (!camera || !controls) return
    camera.position.z *= 0.8
    controls.update()
  }

  const zoomOut = () => {
    if (!camera || !controls) return
    camera.position.z *= 1.2
    controls.update()
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  return (
    <>
      <div className="relative w-full h-full bg-[#FAFAFA] rounded-lg overflow-hidden">
        <FullscreenButton onClick={toggleFullscreen} />

        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <Button variant="outline" size="icon" className="bg-white shadow-md" onClick={zoomIn} title="Acercar">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="bg-white shadow-md" onClick={zoomOut} title="Alejar">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="bg-white shadow-md"
            onClick={resetView}
            title="Restablecer vista"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="bg-white shadow-md" onClick={onClose} title="Cerrar">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#FAFAFA]/80">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 border-4 border-[#E4E4E7] border-t-[#18181B] rounded-full animate-spin"></div>
              <p className="mt-4 text-[13px] text-[#52525B]">Cargando archivo DXF...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#FAFAFA]/90">
            <div className="bg-white p-6 rounded-lg shadow-md max-w-md">
              <h3 className="text-[16px] font-medium text-[#18181B] mb-2">Error</h3>
              <p className="text-[13px] text-[#52525B] mb-4">{error}</p>
              <Button onClick={onClose}>Cerrar</Button>
            </div>
          </div>
        )}

        <div ref={containerRef} className="w-full h-full"></div>
      </div>

      {isFullscreen && (
        <FullscreenViewer isOpen={isFullscreen} onClose={toggleFullscreen} title={file?.name || "Visor DXF"}>
          <div ref={fullscreenContainerRef} className="w-full h-full"></div>
        </FullscreenViewer>
      )}
    </>
  )
}
