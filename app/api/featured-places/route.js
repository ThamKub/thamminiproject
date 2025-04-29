import { NextResponse } from "next/server"
import { featuredPlaces } from "@/lib/featured-places"

export async function GET() {
  try {
    return NextResponse.json(featuredPlaces)
  } catch (error) {
    console.error("Error fetching featured places:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลสถานที่ท่องเที่ยวยอดนิยม" }, { status: 500 })
  }
}
