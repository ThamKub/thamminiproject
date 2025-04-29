import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  try {
    // ลบ cookie auth-token
    cookies().delete("auth-token")

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการออกจากระบบ" }, { status: 500 })
  }
}
