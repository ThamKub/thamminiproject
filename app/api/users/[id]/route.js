import { NextResponse } from "next/server"
import { supabase } from "@/lib/db"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { isUUID } from "@/lib/db"

export async function GET(request, { params }) {
  try {
    const userId = params.id

    if (!userId) {
      return NextResponse.json({ error: "กรุณาระบุ ID ผู้ใช้" }, { status: 400 })
    }

    // ตรวจสอบว่า userId เป็น UUID หรือไม่
    const isValidUUID = isUUID(userId)

    // ถ้า userId ไม่ใช่ UUID ให้ใช้ข้อมูลจาก localStorage
    if (!isValidUUID) {
      console.log("Using mock data due to non-UUID userId:", userId)
      // ส่งข้อมูลว่างกลับไป เพื่อให้ client ดึงข้อมูลจาก localStorage เอง
      return NextResponse.json(null, { status: 404 })
    }

    // ใช้ supabaseAdmin เพื่อข้าม RLS
    const client = supabaseAdmin || supabase

    // ถ้าไม่มี Supabase client ให้ใช้ข้อมูลจำลอง
    if (!client) {
      // ส่งข้อมูลว่างกลับไป เพื่อให้ client ดึงข้อมูลจาก localStorage เอง
      return NextResponse.json(null, { status: 404 })
    }

    // ดึงข้อมูลผู้ใช้จาก Supabase
    const { data, error } = await client.from("users").select("id, name, email, avatar_url").eq("id", userId).single()

    if (error) {
      console.error("Error fetching user:", error)
      return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้" }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้" }, { status: 500 })
  }
}
