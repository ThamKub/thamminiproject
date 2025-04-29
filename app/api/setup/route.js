import { NextResponse } from "next/server"
import { setupStorage } from "@/lib/setup-storage"

export async function GET() {
  try {
    // ตั้งค่า Supabase Storage
    await setupStorage()

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("Setup error:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการตั้งค่าระบบ" }, { status: 500 })
  }
}
