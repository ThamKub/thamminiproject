import { NextResponse } from "next/server"
import { supabase } from "@/lib/db"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { isUUID } from "@/lib/db"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "กรุณาระบุ ID ผู้ใช้" }, { status: 400 })
    }

    // ตรวจสอบว่า userId เป็น UUID หรือไม่
    const isValidUUID = isUUID(userId)

    // ถ้า userId ไม่ใช่ UUID ให้ดึงข้อมูลจาก localStorage
    if (!isValidUUID) {
      console.log("Using localStorage data due to non-UUID userId:", userId)

      // สร้างข้อมูลว่างเพื่อให้ client ดึงข้อมูลจาก localStorage เอง
      // ส่งกลับข้อมูลว่างแทนที่จะส่ง error
      return NextResponse.json([])
    }

    // ใช้ supabaseAdmin เพื่อข้าม RLS
    const client = supabaseAdmin || supabase

    // ถ้าไม่มี Supabase client ให้ใช้ข้อมูลจาก localStorage
    if (!client) {
      // ส่งข้อมูลว่างกลับไป เพื่อให้ client ดึงข้อมูลจาก localStorage เอง
      return NextResponse.json([])
    }

    try {
      // ดึงข้อมูลรูปภาพของผู้ใช้จาก Supabase
      const { data, error } = await client
        .from("photos")
        .select(`
          *,
          user:users(id, name, avatar_url),
          comments:comments(*),
          likes:likes(*)
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching user photos:", error)
        // ส่งข้อมูลว่างกลับไป เพื่อให้ client ดึงข้อมูลจาก localStorage เอง
        return NextResponse.json([])
      }

      // แปลงข้อมูลให้ตรงกับโครงสร้างที่ต้องการ
      const formattedPhotos = data.map((photo) => ({
        id: photo.id,
        title: photo.title,
        description: photo.description || "",
        location: photo.location,
        image_url: photo.image_url,
        created_at: photo.created_at,
        user_id: photo.user_id,
        likes: photo.likes?.length || 0,
        comments: photo.comments || [],
      }))

      return NextResponse.json(formattedPhotos)
    } catch (dbError) {
      console.error("Database error:", dbError)
      // ส่งข้อมูลว่างกลับไป เพื่อให้ client ดึงข้อมูลจาก localStorage เอง
      return NextResponse.json([])
    }
  } catch (error) {
    console.error("Error fetching user photos:", error)
    // ส่งข้อมูลว่างกลับไป เพื่อให้ client ดึงข้อมูลจาก localStorage เอง
    return NextResponse.json([])
  }
}
