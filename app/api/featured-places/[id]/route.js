import { NextResponse } from "next/server"
import { featuredPlaces } from "@/lib/featured-places"

export async function GET(request, { params }) {
  try {
    const id = params.id
    const place = featuredPlaces.find((place) => place.id === id)

    if (!place) {
      return NextResponse.json({ error: "ไม่พบสถานที่ท่องเที่ยว" }, { status: 404 })
    }

    return NextResponse.json(place)
  } catch (error) {
    console.error("Error fetching featured place:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลสถานที่ท่องเที่ยว" }, { status: 500 })
  }
}
