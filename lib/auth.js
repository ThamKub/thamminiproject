import { cookies } from "next/headers"
import { jwtVerify } from "jose"
import { supabase } from "@/lib/db"

// สร้าง secret key สำหรับ JWT
const secretKey = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key-for-jwt-at-least-32-chars")

// ฟังก์ชันสำหรับดึงข้อมูลผู้ใช้ปัจจุบัน
export async function getCurrentUser() {
  try {
    // ดึง token จาก cookie
    const token = cookies().get("auth-token")?.value

    if (!token) {
      return null
    }

    // ตรวจสอบ token
    const { payload } = await jwtVerify(token, secretKey)
    const userId = payload.sub

    // ถ้าไม่มี Supabase client ให้จำลองข้อมูลผู้ใช้
    if (!supabase) {
      return {
        id: userId,
        name: "ผู้ใช้งานตัวอย่าง",
        email: "user@example.com",
        avatar_url: `/placeholder.svg?height=40&width=40`,
      }
    }

    // ดึงข้อมูลผู้ใช้จากฐานข้อมูล
    const { data: user, error } = await supabase
      .from("users")
      .select("id, name, email, avatar_url")
      .eq("id", userId)
      .single()

    if (error || !user) {
      console.error("Error fetching user:", error)
      return null
    }

    return user
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}
