import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase admin client not available" }, { status: 500 })
    }

    // ตรวจสอบว่ามีบัญชีทดสอบอยู่แล้วหรือไม่
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("email", "test@example.com")
      .maybeSingle()

    if (checkError) {
      console.error("Error checking existing test user:", checkError)
      return NextResponse.json({ error: "Failed to check existing test user" }, { status: 500 })
    }

    // ถ้ามีบัญชีทดสอบอยู่แล้ว ให้ส่งข้อมูลกลับไป
    if (existingUser) {
      return NextResponse.json({ success: true, user: existingUser }, { status: 200 })
    }

    // สร้างบัญชีทดสอบใน Supabase Auth
    const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email: "test@example.com",
      password: "password123",
      email_confirm: true,
    })

    if (signUpError) {
      console.error("Error creating test user:", signUpError)
      return NextResponse.json({ error: "Failed to create test user" }, { status: 500 })
    }

    // สร้าง password hash
    const password_hash = await bcrypt.hash("password123", 10)

    // เพิ่มข้อมูลผู้ใช้ในตาราง users
    const { data: userData, error: insertError } = await supabaseAdmin
      .from("users")
      .insert({
        id: authData.user.id,
        name: "ผู้ใช้ทดสอบ",
        email: "test@example.com",
        password_hash,
        avatar_url: `/placeholder.svg?height=40&width=40`,
      })
      .select()

    if (insertError) {
      console.error("Error inserting test user data:", insertError)
      return NextResponse.json({ error: "Failed to insert test user data" }, { status: 500 })
    }

    return NextResponse.json({ success: true, user: userData[0] }, { status: 201 })
  } catch (error) {
    console.error("Error creating test account:", error)
    return NextResponse.json({ error: "Failed to create test account" }, { status: 500 })
  }
}
