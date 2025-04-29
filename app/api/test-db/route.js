import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    // แสดงค่าตัวแปรสภาพแวดล้อม (ไม่แสดง key เต็ม เพื่อความปลอดภัย)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "ไม่พบค่า"
    const supabaseAnonKeyPartial = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 5)}...`
      : "ไม่พบค่า"
    const supabaseServiceRoleKeyPartial = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? `${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 5)}...`
      : "ไม่พบค่า"

    // สร้าง Supabase client
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        {
          error: "ไม่พบตัวแปรสภาพแวดล้อมที่จำเป็น",
          envVars: {
            NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
            NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKeyPartial,
            SUPABASE_SERVICE_ROLE_KEY: supabaseServiceRoleKeyPartial,
          },
        },
        { status: 500 },
      )
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

    // ทดสอบการเชื่อมต่อโดยดึงข้อมูลจากตาราง users
    const { data, error, status } = await supabase.from("users").select("count()").limit(1).single()

    if (error) {
      return NextResponse.json(
        {
          error: "เกิดข้อผิดพลาดในการเชื่อมต่อกับฐานข้อมูล",
          details: error,
          envVars: {
            NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
            NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKeyPartial,
            SUPABASE_SERVICE_ROLE_KEY: supabaseServiceRoleKeyPartial,
          },
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "เชื่อมต่อกับฐานข้อมูลสำเร็จ",
      data,
      envVars: {
        NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKeyPartial,
        SUPABASE_SERVICE_ROLE_KEY: supabaseServiceRoleKeyPartial,
      },
    })
  } catch (error) {
    console.error("Error testing database connection:", error)
    return NextResponse.json(
      {
        error: "เกิดข้อผิดพลาดที่ไม่คาดคิด",
        details: error,
      },
      { status: 500 },
    )
  }
}
