import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { isUUID } from "@/lib/db"

export async function POST(request) {
  try {
    const { photoId, userId } = await request.json()

    if (!photoId || !userId) {
      return NextResponse.json({ error: "กรุณาระบุ ID รูปภาพและ ID ผู้ใช้" }, { status: 400 })
    }

    // ตรวจสอบว่า ID เป็น UUID หรือไม่
    const isValidPhotoId = isUUID(photoId)
    const isValidUserId = isUUID(userId)

    // ถ้า ID ไม่ใช่ UUID ให้ใช้วิธีการจำลองการกดไลค์
    if (!isValidPhotoId || !isValidUserId) {
      // ไม่สามารถใช้ localStorage ใน server-side ได้
      // ส่งข้อมูลกลับไปให้ client จัดการเอง
      return NextResponse.json(
        {
          simulateLike: true,
          photoId,
          userId,
        },
        { status: 200 },
      )
    }

    // ถ้า ID เป็น UUID ให้ใช้ Supabase
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "ไม่สามารถเข้าถึงฐานข้อมูลได้" }, { status: 500 })
    }

    // ตรวจสอบว่าผู้ใช้กดไลค์รูปภาพนี้แล้วหรือยัง
    const { data: existingLike, error: checkError } = await supabaseAdmin
      .from("likes")
      .select("*")
      .eq("photo_id", photoId)
      .eq("user_id", userId)
      .maybeSingle()

    if (checkError) {
      console.error("Error checking like:", checkError)
      return NextResponse.json({ error: "เกิดข้อผิดพลาดในการตรวจสอบการกดไลค์" }, { status: 500 })
    }

    if (existingLike) {
      // ถ้ากดไลค์แล้ว ให้ลบการกดไลค์
      const { error: deleteError } = await supabaseAdmin.from("likes").delete().eq("id", existingLike.id)

      if (deleteError) {
        console.error("Error deleting like:", deleteError)
        return NextResponse.json({ error: "เกิดข้อผิดพลาดในการลบการกดไลค์" }, { status: 500 })
      }

      // ดึงจำนวนไลค์ทั้งหมดของรูปภาพนี้
      const { count, error: countError } = await supabaseAdmin
        .from("likes")
        .select("*", { count: "exact" })
        .eq("photo_id", photoId)

      if (countError) {
        console.error("Error counting likes:", countError)
        return NextResponse.json({ error: "เกิดข้อผิดพลาดในการนับจำนวนไลค์" }, { status: 500 })
      }

      return NextResponse.json({ liked: false, likesCount: count || 0 }, { status: 200 })
    } else {
      // ถ้ายังไม่ได้กดไลค์ ให้เพิ่มการกดไลค์
      const { error: insertError } = await supabaseAdmin.from("likes").insert({
        photo_id: photoId,
        user_id: userId,
      })

      if (insertError) {
        console.error("Error inserting like:", insertError)
        return NextResponse.json({ error: "เกิดข้อผิดพลาดในการเพิ่มการกดไลค์" }, { status: 500 })
      }

      // ดึงจำนวนไลค์ทั้งหมดของรูปภาพนี้
      const { count, error: countError } = await supabaseAdmin
        .from("likes")
        .select("*", { count: "exact" })
        .eq("photo_id", photoId)

      if (countError) {
        console.error("Error counting likes:", countError)
        return NextResponse.json({ error: "เกิดข้อผิดพลาดในการนับจำนวนไลค์" }, { status: 500 })
      }

      return NextResponse.json({ liked: true, likesCount: count || 0 }, { status: 200 })
    }
  } catch (error) {
    console.error("Error toggling like:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการกดไลค์" }, { status: 500 })
  }
}
