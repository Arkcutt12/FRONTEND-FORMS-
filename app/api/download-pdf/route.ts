import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] PDF download API proxy: Starting request")

    const body = await request.json()
    console.log("[v0] PDF download API proxy: Request body received", { hasData: !!body })

    const externalApiUrl = "https://calculadora-presupuestos-laser.onrender.com/calculate/pdf"
    console.log("[v0] PDF download API proxy: Calling external API:", externalApiUrl)

    const response = await fetch(externalApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/pdf",
      },
      body: JSON.stringify(body),
    })

    console.log("[v0] PDF download API proxy: External API response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.log("[v0] PDF download API proxy: External API error:", errorText)

      return NextResponse.json(
        {
          error: "External PDF API error",
          status: response.status,
          message: errorText,
        },
        { status: response.status },
      )
    }

    const pdfBuffer = await response.arrayBuffer()
    console.log("[v0] PDF download API proxy: PDF received, size:", pdfBuffer.byteLength)

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=presupuesto.pdf",
      },
    })
  } catch (error) {
    console.error("[v0] PDF download API proxy: Error:", error)

    return NextResponse.json(
      {
        error: "PDF proxy error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
