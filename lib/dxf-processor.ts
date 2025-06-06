// Procesador DXF simplificado para frontend
export interface DXFEntity {
  type: string
  layer: string
  points: Array<{ x: number; y: number }>
  length: number
  isPhantom: boolean
  rejectionReason?: string
}

export interface DXFProcessResult {
  success: boolean
  statistics: {
    total_entities: number
    valid_entities: number
    phantom_entities: number
  }
  bounding_box: {
    width: number
    height: number
    area: number
    min_x: number
    min_y: number
    max_x: number
    max_y: number
  }
  cut_length: {
    total_mm: number
    total_m: number
  }
  entities: {
    valid: Array<{
      entity_type: string
      layer: string
      length: number
      points: Array<{ x: number; y: number }>
    }>
    phantom: Array<{
      entity_type: string
      layer: string
      length: number
      rejection_reason: string
    }>
  }
}

export class DXFProcessor {
  private hiddenLayerPatterns = [
    /defpoints/i,
    /construction/i,
    /hidden/i,
    /auxiliary/i,
    /temp/i,
    /guide/i,
    /reference/i,
    /dimension/i,
    /text/i,
    /phantom/i,
    /^_/,
  ]

  async processFile(file: File): Promise<DXFProcessResult> {
    const content = await this.readFileContent(file)
    const entities = this.parseEntities(content)
    const { valid, phantom } = this.filterEntities(entities)

    return this.generateResult(valid, phantom)
  }

  private async readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = reject
      reader.readAsText(file)
    })
  }

  private parseEntities(content: string): DXFEntity[] {
    const lines = content.split("\n").map((line) => line.trim())
    const entities: DXFEntity[] = []

    let currentEntity: Partial<DXFEntity> | null = null
    let vertices: Array<{ x: number; y: number }> = []
    let inEntities = false

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const nextLine = i + 1 < lines.length ? lines[i + 1] : ""

      // Detectar sección ENTITIES
      if (line === "SECTION" && nextLine === "2" && i + 2 < lines.length && lines[i + 2] === "ENTITIES") {
        inEntities = true
        i += 2
        continue
      }

      if (line === "ENDSEC" && inEntities) {
        if (currentEntity?.type) {
          entities.push(this.finalizeEntity(currentEntity, vertices))
        }
        break
      }

      if (!inEntities) continue

      // Inicio de entidad
      if (line === "0" && ["LINE", "LWPOLYLINE", "POLYLINE", "CIRCLE", "ARC"].includes(nextLine)) {
        if (currentEntity?.type) {
          entities.push(this.finalizeEntity(currentEntity, vertices))
        }

        currentEntity = {
          type: nextLine,
          layer: "0",
          points: [],
          length: 0,
          isPhantom: false,
        }
        vertices = []
        i++
      }
      // Propiedades de entidad
      else if (currentEntity) {
        if (line === "8" && nextLine) {
          currentEntity.layer = nextLine
          i++
        } else if (line === "10" && nextLine) {
          const x = Number.parseFloat(nextLine)
          let y = 0

          if (i + 2 < lines.length && lines[i + 2] === "20") {
            y = Number.parseFloat(lines[i + 3])
            i += 2
          }

          vertices.push({ x, y })
          i++
        }
      }
    }

    return entities
  }

  private finalizeEntity(entity: Partial<DXFEntity>, vertices: Array<{ x: number; y: number }>): DXFEntity {
    const points = [...vertices]
    const length = this.calculateLength(entity.type || "", points)

    return {
      type: entity.type || "",
      layer: entity.layer || "0",
      points,
      length,
      isPhantom: false,
    }
  }

  private calculateLength(type: string, points: Array<{ x: number; y: number }>): number {
    if (points.length < 2) return 0

    let totalLength = 0
    for (let i = 0; i < points.length - 1; i++) {
      const dx = points[i + 1].x - points[i].x
      const dy = points[i + 1].y - points[i].y
      totalLength += Math.sqrt(dx * dx + dy * dy)
    }

    return totalLength
  }

  private filterEntities(entities: DXFEntity[]): { valid: DXFEntity[]; phantom: DXFEntity[] } {
    const valid: DXFEntity[] = []
    const phantom: DXFEntity[] = []

    entities.forEach((entity) => {
      const phantomCheck = this.isPhantomEntity(entity)

      if (phantomCheck.isPhantom) {
        phantom.push({
          ...entity,
          isPhantom: true,
          rejectionReason: phantomCheck.reason,
        })
      } else {
        valid.push(entity)
      }
    })

    return { valid, phantom }
  }

  private isPhantomEntity(entity: DXFEntity): { isPhantom: boolean; reason: string } {
    // Verificar capas ocultas
    if (this.hiddenLayerPatterns.some((pattern) => pattern.test(entity.layer))) {
      return { isPhantom: true, reason: "Capa oculta detectada" }
    }

    // Verificar longitud cero
    if (entity.length < 0.001) {
      return { isPhantom: true, reason: "Línea de longitud cero" }
    }

    // Verificar coordenadas extremas
    for (const point of entity.points) {
      if (Math.abs(point.x) > 10000 || Math.abs(point.y) > 10000) {
        return { isPhantom: true, reason: "Coordenadas extremas detectadas" }
      }
    }

    // Verificar líneas al origen
    if (entity.type === "LINE" && entity.points.length >= 2) {
      const hasOrigin = entity.points.some((p) => Math.abs(p.x) < 0.001 && Math.abs(p.y) < 0.001)
      if (hasOrigin) {
        return { isPhantom: true, reason: "Línea conecta con origen (0,0)" }
      }
    }

    return { isPhantom: false, reason: "" }
  }

  private generateResult(valid: DXFEntity[], phantom: DXFEntity[]): DXFProcessResult {
    const allPoints = valid.flatMap((e) => e.points)

    let minX = Number.POSITIVE_INFINITY,
      maxX = Number.NEGATIVE_INFINITY,
      minY = Number.POSITIVE_INFINITY,
      maxY = Number.NEGATIVE_INFINITY

    allPoints.forEach((point) => {
      minX = Math.min(minX, point.x)
      maxX = Math.max(maxX, point.x)
      minY = Math.min(minY, point.y)
      maxY = Math.max(maxY, point.y)
    })

    if (!isFinite(minX)) {
      minX = maxX = minY = maxY = 0
    }

    const width = maxX - minX
    const height = maxY - minY
    const area = width * height
    const totalLength = valid.reduce((sum, entity) => sum + entity.length, 0)

    return {
      success: true,
      statistics: {
        total_entities: valid.length + phantom.length,
        valid_entities: valid.length,
        phantom_entities: phantom.length,
      },
      bounding_box: {
        width: Number(width.toFixed(1)),
        height: Number(height.toFixed(1)),
        area: Number(area.toFixed(0)),
        min_x: Number(minX.toFixed(2)),
        min_y: Number(minY.toFixed(2)),
        max_x: Number(maxX.toFixed(2)),
        max_y: Number(maxY.toFixed(2)),
      },
      cut_length: {
        total_mm: Number(totalLength.toFixed(1)),
        total_m: Number((totalLength / 1000).toFixed(3)),
      },
      entities: {
        valid: valid.map((entity) => ({
          entity_type: entity.type,
          layer: entity.layer,
          length: Number(entity.length.toFixed(2)),
          points: entity.points,
        })),
        phantom: phantom.map((entity) => ({
          entity_type: entity.type,
          layer: entity.layer,
          length: Number(entity.length.toFixed(2)),
          rejection_reason: entity.rejectionReason || "Entidad filtrada",
        })),
      },
    }
  }
}
