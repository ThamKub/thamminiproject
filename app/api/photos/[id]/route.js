import { NextResponse } from "next/server"
import { getPhotoById } from "@/lib/db"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { isUUID } from "@/lib/db"

export async function GET(request, { params }) {
  try {
    const id = params.id

    // ตรวจสอบว่า id เป็น UUID หรือไม่
    if (!isUUID(id)) {
      return NextResponse.json({ error: "รูปแบบ ID ไม่ถูกต้อง" }, { status: 400 })
    }

    // ตรวจสอบว่ามี supabaseAdmin หรือไม่
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "ไม่สามารถเข้าถึงฐานข้อมูลได้" }, { status: 500 })
    }

    // ใช้ฟังก์ชัน getPhotoById จาก lib/db.js
    const photo = await getPhotoById(id)

    if (!photo) {
      return NextResponse.json({ error: "ไม่พบรูปภาพ" }, { status: 404 })
    }

    // ส่งข้อมูลรูปภาพกลับไป
    return NextResponse.json(photo)
  } catch (error) {
    console.error("Error fetching photo:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลรูปภาพ" }, { status: 500 })
  }
}
