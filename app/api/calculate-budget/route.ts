import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Budget API proxy: Starting request")

    const body = await request.json()
    console.log("[v0] Budget API proxy: Request body received", { hasData: !!body })
    console.log("[v0] Budget API proxy: Full request body:", JSON.stringify(body, null, 2))

    const externalApiUrl = "https://calculadora-presupuestos-laser.onrender.com/calculate"
    console.log("[v0] Budget API proxy: Calling external API:", externalApiUrl)

    const response = await fetch(externalApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    })

    console.log("[v0] Budget API proxy: External API response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.log("[v0] Budget API proxy: External API error:", errorText)

      return NextResponse.json(
        {
          error: "External API error",
          status: response.status,
          message: errorText,
        },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log("[v0] Budget API proxy: External API success response received")
    console.log("[v0] Budget API proxy: Response data:", JSON.stringify(data, null, 2))

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Budget API proxy: Error:", error)

    return NextResponse.json(
      {
        error: "Proxy error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
