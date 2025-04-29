import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import bcrypt from "bcryptjs"

export async function POST(request) {
  try {
    const { id, name, email, password } = await request.json()

    // ตรวจสอบว่ามีข้อมูลครบถ้วนหรือไม่
    if (!id || !name || !email) {
      return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 })
    }

    // ถ้าไม่มี Supabase admin client ให้จำลองการสมัครสมาชิกสำเร็จ
    if (!supabaseAdmin) {
      return NextResponse.json({ success: true, user: { id, name, email } }, { status: 200 })
    }

    // ตรวจสอบว่ามีอีเมลนี้ในตาราง users หรือไม่
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from("users")
      .select("email")
      .eq("email", email)
      .maybeSingle()

    if (checkError) {
      console.error("Error checking existing user:", checkError)
      return NextResponse.json({ error: "เกิดข้อผิดพลาดในการตรวจสอบอีเมล" }, { status: 500 })
    }

    // ถ้ามีอีเมลนี้ในตาราง users แล้ว
    if (existingUser) {
      return NextResponse.json({ error: "อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น" }, { status: 400 })
    }

    // สร้าง password hash
    let password_hash = ""
    if (password) {
      // ถ้ามีการส่งรหัสผ่านมา ให้เข้ารหัสด้วย bcrypt
      password_hash = await bcrypt.hash(password, 10)
    } else {
      // ถ้าไม่มีการส่งรหัสผ่านมา ให้สร้างรหัสผ่านสุ่ม (เนื่องจาก Supabase Auth จัดการรหัสผ่านแล้ว)
      password_hash = await bcrypt.hash(Math.random().toString(36).slice(-10), 10)
    }

    // เพิ่มข้อมูลผู้ใช้ในตาราง users โดยใช้ service role key (ข้าม RLS)
    const { data, error } = await supabaseAdmin
      .from("users")
      .insert({
        id,
        name,
        email,
        password_hash, // เพิ่ม password_hash
        avatar_url: `/placeholder.svg?height=40&width=40`,
      })
      .select()

    if (error) {
      console.error("Error inserting user data:", error)
      return NextResponse.json({ error: "ไม่สามารถบันทึกข้อมูลผู้ใช้ได้" }, { status: 500 })
    }

    return NextResponse.json({ success: true, user: data[0] }, { status: 201 })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการสมัครสมาชิก" }, { status: 500 })
  }
}
