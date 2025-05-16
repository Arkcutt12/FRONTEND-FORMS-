import * as THREE from "three"

// A more robust DXF parser and loader
export class DXFLoader {
  async parse(dxfContent: string): Promise<THREE.Object3D> {
    // Create a group to hold all the parsed entities
    const group = new THREE.Group()

    try {
      // Basic parsing of DXF content
      const lines = dxfContent.split("\n")

      // Track current entity and its properties
      let currentEntity: any = null
      let vertices: THREE.Vector3[] = []
      let inEntities = false
      let currentLayer = ""
      let currentColor = 0

      // Process the DXF file line by line
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : ""

        // Check if we're in the ENTITIES section
        if (line === "SECTION" && nextLine === "2" && i + 2 < lines.length && lines[i + 2].trim() === "ENTITIES") {
          inEntities = true
          i += 2 // Skip to after ENTITIES
          continue
        }

        // Check if we're leaving the ENTITIES section
        if (line === "ENDSEC" && inEntities) {
          inEntities = false
          // Process the last entity if there is one
          if (currentEntity && currentEntity.type) {
            this.createEntity(currentEntity, vertices, group)
          }
          continue
        }

        // Only process entities if we're in the ENTITIES section
        if (!inEntities) continue

        // Start of an entity
        if (
          line === "0" &&
          ["LINE", "LWPOLYLINE", "POLYLINE", "CIRCLE", "ARC", "TEXT", "MTEXT", "POINT"].includes(nextLine)
        ) {
          // Save previous entity if exists
          if (currentEntity && currentEntity.type) {
            this.createEntity(currentEntity, vertices, group)
            vertices = []
          }

          currentEntity = {
            type: nextLine,
            layer: currentLayer,
            color: currentColor,
          }
          i++ // Skip the entity type line
        }

        // Entity properties
        else if (currentEntity) {
          // Layer
          if (line === "8" && nextLine) {
            currentEntity.layer = nextLine
            currentLayer = nextLine
            i++
          }
          // Color
          else if (line === "62" && nextLine) {
            currentEntity.color = Number.parseInt(nextLine)
            currentColor = Number.parseInt(nextLine)
            i++
          }
          // X coordinate
          else if (line === "10" && nextLine) {
            const x = Number.parseFloat(nextLine)
            let y = 0
            let z = 0

            // Look ahead for Y coordinate
            if (i + 2 < lines.length && lines[i + 2].trim() === "20") {
              y = Number.parseFloat(lines[i + 3].trim())
              i += 2
            }

            // Look ahead for Z coordinate
            if (i + 2 < lines.length && lines[i + 2].trim() === "30") {
              z = Number.parseFloat(lines[i + 3].trim())
              i += 2
            }

            vertices.push(new THREE.Vector3(x, y, z))
            i++
          }
          // Additional vertex for LWPOLYLINE
          else if (line === "11" && nextLine && currentEntity.type === "LWPOLYLINE") {
            const x = Number.parseFloat(nextLine)
            let y = 0
            let z = 0

            // Look ahead for Y coordinate
            if (i + 2 < lines.length && lines[i + 2].trim() === "21") {
              y = Number.parseFloat(lines[i + 3].trim())
              i += 2
            }

            // Look ahead for Z coordinate
            if (i + 2 < lines.length && lines[i + 2].trim() === "31") {
              z = Number.parseFloat(lines[i + 3].trim())
              i += 2
            }

            vertices.push(new THREE.Vector3(x, y, z))
            i++
          }
          // Radius for CIRCLE
          else if (line === "40" && nextLine) {
            currentEntity.radius = Number.parseFloat(nextLine)
            i++
          }
          // Start angle for ARC
          else if (line === "50" && nextLine) {
            currentEntity.startAngle = Number.parseFloat(nextLine) * (Math.PI / 180)
            i++
          }
          // End angle for ARC
          else if (line === "51" && nextLine) {
            currentEntity.endAngle = Number.parseFloat(nextLine) * (Math.PI / 180)
            i++
          }
          // Text content
          else if (line === "1" && nextLine && (currentEntity.type === "TEXT" || currentEntity.type === "MTEXT")) {
            currentEntity.text = nextLine
            i++
          }
          // Text height
          else if (line === "40" && nextLine && (currentEntity.type === "TEXT" || currentEntity.type === "MTEXT")) {
            currentEntity.height = Number.parseFloat(nextLine)
            i++
          }
        }
      }

      // Process the last entity if there is one
      if (currentEntity && currentEntity.type) {
        this.createEntity(currentEntity, vertices, group)
      }

      // If the group is empty, try a more aggressive parsing approach
      if (group.children.length === 0) {
        console.log("No entities found with standard parsing, trying alternative approach...")
        return this.parseAlternative(dxfContent)
      }

      // Center the model
      const box = new THREE.Box3().setFromObject(group)
      const center = box.getCenter(new THREE.Vector3())
      group.position.sub(center)

      return group
    } catch (error) {
      console.error("Error parsing DXF:", error)
      // Try alternative parsing method if standard method fails
      console.log("Trying alternative parsing approach...")
      return this.parseAlternative(dxfContent)
    }
  }

  // Alternative parsing method for different DXF formats
  private async parseAlternative(dxfContent: string): Promise<THREE.Object3D> {
    const group = new THREE.Group()

    try {
      // Look for any coordinates in the file
      const coordPattern = /\s*10\s*\n\s*([-+]?\d*\.?\d+)\s*\n\s*20\s*\n\s*([-+]?\d*\.?\d+)/g
      let match
      const points: THREE.Vector3[] = []

      while ((match = coordPattern.exec(dxfContent)) !== null) {
        const x = Number.parseFloat(match[1])
        const y = Number.parseFloat(match[2])
        points.push(new THREE.Vector3(x, y, 0))
      }

      // If we found points, create lines between consecutive points
      if (points.length > 1) {
        for (let i = 0; i < points.length - 1; i++) {
          const geometry = new THREE.BufferGeometry().setFromPoints([points[i], points[i + 1]])
          const material = new THREE.LineBasicMaterial({ color: 0x000000 })
          const line = new THREE.Line(geometry, material)
          group.add(line)
        }
      }

      // Look for circles
      const circlePattern =
        /\s*0\s*\n\s*CIRCLE\s*\n(?:.*\n)*?\s*10\s*\n\s*([-+]?\d*\.?\d+)\s*\n\s*20\s*\n\s*([-+]?\d*\.?\d+)(?:.*\n)*?\s*40\s*\n\s*([-+]?\d*\.?\d+)/g

      while ((match = circlePattern.exec(dxfContent)) !== null) {
        const x = Number.parseFloat(match[1])
        const y = Number.parseFloat(match[2])
        const radius = Number.parseFloat(match[3])

        // Create points for a circle
        const segments = 32
        const circlePoints = []
        for (let i = 0; i <= segments; i++) {
          const theta = (i / segments) * Math.PI * 2
          const px = x + radius * Math.cos(theta)
          const py = y + radius * Math.sin(theta)
          circlePoints.push(new THREE.Vector3(px, py, 0))
        }

        const geometry = new THREE.BufferGeometry().setFromPoints(circlePoints)
        const material = new THREE.LineBasicMaterial({ color: 0x000000 })
        const circle = new THREE.Line(geometry, material)
        group.add(circle)
      }

      // Center the model
      if (group.children.length > 0) {
        const box = new THREE.Box3().setFromObject(group)
        const center = box.getCenter(new THREE.Vector3())
        group.position.sub(center)
      } else {
        // If still no entities found, add a dummy object so we know parsing failed
        const geometry = new THREE.BoxGeometry(10, 10, 10)
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true })
        const cube = new THREE.Mesh(geometry, material)
        group.add(cube)

        console.warn("No entities found in DXF file")
      }

      return group
    } catch (error) {
      console.error("Error in alternative DXF parsing:", error)
      return group // Return empty group on error
    }
  }

  private createEntity(entity: any, vertices: THREE.Vector3[], group: THREE.Group) {
    // Choose color based on entity color or layer
    let color = 0x000000 // Default black
    if (entity.color && entity.color > 0) {
      // Map AutoCAD color index to RGB
      // This is a simplified mapping
      const colors = [
        0x000000, 0xff0000, 0xffff00, 0x00ff00, 0x00ffff, 0x0000ff, 0xff00ff, 0xffffff, 0x414141, 0x808080, 0xff0000,
        0xffaaaa, 0xbd0000, 0xbd7e7e, 0x810000, 0x815656,
      ]
      color = colors[entity.color % colors.length]
    }

    const material = new THREE.LineBasicMaterial({ color })

    switch (entity.type) {
      case "LINE":
        if (vertices.length >= 2) {
          const geometry = new THREE.BufferGeometry().setFromPoints(vertices)
          const line = new THREE.Line(geometry, material)
          group.add(line)
        }
        break

      case "LWPOLYLINE":
      case "POLYLINE":
        if (vertices.length >= 2) {
          const geometry = new THREE.BufferGeometry().setFromPoints(vertices)
          const polyline = new THREE.Line(geometry, material)
          group.add(polyline)
        }
        break

      case "CIRCLE":
        if (vertices.length > 0 && entity.radius) {
          // Create points for a circle
          const segments = 64 // More segments for smoother circles
          const circlePoints = []
          for (let i = 0; i <= segments; i++) {
            const theta = (i / segments) * Math.PI * 2
            const x = vertices[0].x + entity.radius * Math.cos(theta)
            const y = vertices[0].y + entity.radius * Math.sin(theta)
            circlePoints.push(new THREE.Vector3(x, y, vertices[0].z))
          }

          const geometry = new THREE.BufferGeometry().setFromPoints(circlePoints)
          const circle = new THREE.Line(geometry, material)
          group.add(circle)
        }
        break

      case "ARC":
        if (vertices.length > 0 && entity.radius && entity.startAngle !== undefined && entity.endAngle !== undefined) {
          // Ensure end angle is greater than start angle
          if (entity.endAngle < entity.startAngle) {
            entity.endAngle += Math.PI * 2
          }

          const curve = new THREE.EllipseCurve(
            vertices[0].x,
            vertices[0].y,
            entity.radius,
            entity.radius,
            entity.startAngle,
            entity.endAngle,
            false,
            0,
          )
          const points = curve.getPoints(50)
          const arcPoints = points.map((p) => new THREE.Vector3(p.x, p.y, vertices[0].z))
          const geometry = new THREE.BufferGeometry().setFromPoints(arcPoints)
          const arc = new THREE.Line(geometry, material)
          group.add(arc)
        }
        break

      case "TEXT":
      case "MTEXT":
        if (vertices.length > 0 && entity.text) {
          // We can't render text directly in Three.js, but we can add a point to show where the text is
          const pointGeometry = new THREE.BufferGeometry().setFromPoints([vertices[0]])
          const pointMaterial = new THREE.PointsMaterial({ color, size: 5 })
          const point = new THREE.Points(pointGeometry, pointMaterial)
          group.add(point)
        }
        break

      case "POINT":
        if (vertices.length > 0) {
          const pointGeometry = new THREE.BufferGeometry().setFromPoints([vertices[0]])
          const pointMaterial = new THREE.PointsMaterial({ color, size: 5 })
          const point = new THREE.Points(pointGeometry, pointMaterial)
          group.add(point)
        }
        break
    }
  }
}
