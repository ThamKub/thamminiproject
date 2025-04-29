import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function POST(request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "กรุณาระบุอีเมล" }, { status: 400 })
    }

    // ถ้าไม่มี Supabase admin client ให้ตรวจสอบใน localStorage
    if (!supabaseAdmin) {
      return NextResponse.json({ exists: false }, { status: 200 })
    }

    // ตรวจสอบว่ามีอีเมลนี้ในตาราง users หรือไม่
    const { data, error } = await supabaseAdmin.from("users").select("email").eq("email", email).maybeSingle()

    if (error) {
      console.error("Error checking email:", error)
      return NextResponse.json({ error: "เกิดข้อผิดพลาดในการตรวจสอบอีเมล" }, { status: 500 })
    }

    // ตรวจสอบว่ามีอีเมลนี้ใน auth.users หรือไม่
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers()

    if (authError) {
      console.error("Error checking auth users:", authError)
      return NextResponse.json({ error: "เกิดข้อผิดพลาดในการตรวจสอบอีเมล" }, { status: 500 })
    }

    // ตรวจสอบว่ามีอีเมลนี้ใน auth.users หรือไม่
    const authUser = authData.users.find((user) => user.email === email)

    // ถ้าพบอีเมลในตาราง users หรือ auth.users แสดงว่าอีเมลนี้ถูกใช้แล้ว
    const emailExists = !!data || !!authUser

    return NextResponse.json({ exists: emailExists }, { status: 200 })
  } catch (error) {
    console.error("Error checking email:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการตรวจสอบอีเมล" }, { status: 500 })
  }
}
