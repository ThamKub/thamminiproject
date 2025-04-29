import { NextResponse } from "next/server"
import { supabase } from "@/lib/db"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { SignJWT } from "jose"

// สร้าง secret key สำหรับ JWT
const secretKey = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key-for-jwt-at-least-32-chars")

export async function POST(request) {
  try {
    const { email, password } = await request.json()

    // ตรวจสอบว่ามีข้อมูลครบถ้วนหรือไม่
    if (!email || !password) {
      return NextResponse.json({ error: "กรุณากรอกอีเมลและรหัสผ่าน" }, { status: 400 })
    }

    // ถ้าไม่มี Supabase client ให้จำลองการเข้าสู่ระบบสำเร็จ
    if (!supabase) {
      const mockUser = {
        id: `user-${Date.now()}`,
        name: "ผู้ใช้งานตัวอย่าง",
        email,
        avatar_url: `/placeholder.svg?height=40&width=40`,
      }

      // สร้าง JWT token
      const token = await new SignJWT({ sub: mockUser.id, email: mockUser.email })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("30d")
        .sign(secretKey)

      // เก็บ token ใน cookie
      cookies().set("auth-token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60, // 30 วัน
        path: "/",
      })

      return NextResponse.json({ success: true, user: mockUser }, { status: 200 })
    }

    // ค้นหาผู้ใช้จากอีเมล
    const { data: user, error: fetchError } = await supabase.from("users").select("*").eq("email", email).single()

    if (fetchError || !user) {
      return NextResponse.json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 })
    }

    // ตรวจสอบรหัสผ่าน
    const passwordMatch = await bcrypt.compare(password, user.password_hash)
    if (!passwordMatch) {
      return NextResponse.json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 })
    }

    // สร้าง JWT token
    const token = await new SignJWT({ sub: user.id, email: user.email })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(secretKey)

    // เก็บ token ใน cookie
    cookies().set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 วัน
      path: "/",
    })

    // ส่งข้อมูลผู้ใช้กลับไป (ไม่รวมรหัสผ่าน)
    const { password_hash, ...userWithoutPassword } = user

    return NextResponse.json({ success: true, user: userWithoutPassword }, { status: 200 })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ" }, { status: 500 })
  }
}
