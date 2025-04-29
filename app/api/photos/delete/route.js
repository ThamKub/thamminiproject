import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const photoId = searchParams.get("id")
    const userId = searchParams.get("userId")

    if (!photoId || !userId) {
      return NextResponse.json({ error: "กรุณาระบุ ID รูปภาพและ ID ผู้ใช้" }, { status: 400 })
    }

    // ตรวจสอบว่ามี supabaseAdmin หรือไม่
    if (!supabaseAdmin) {
      // ถ้าไม่มี Supabase client ให้จำลองการลบสำเร็จ
      // และลบข้อมูลจาก localStorage ในฝั่ง client
      return NextResponse.json({ success: true, deletedPhotoId: photoId }, { status: 200 })
    }

    // ตรวจสอบว่าผู้ใช้เป็นเจ้าของรูปภาพหรือไม่
    const { data: photo, error: fetchError } = await supabaseAdmin
      .from("photos")
      .select("*")
      .eq("id", photoId)
      .eq("user_id", userId)
      .single()

    if (fetchError) {
      console.error("Error fetching photo:", fetchError)

      // ถ้าไม่พบรูปภาพในฐานข้อมูล ให้ตรวจสอบใน localStorage
      return NextResponse.json({ success: true, deletedPhotoId: photoId }, { status: 200 })
    }

    // ลบความคิดเห็นที่เกี่ยวข้องกับรูปภาพนี้
    const { error: deleteCommentsError } = await supabaseAdmin.from("comments").delete().eq("photo_id", photoId)

    if (deleteCommentsError) {
      console.error("Error deleting comments:", deleteCommentsError)
      // ไม่ต้อง return error เพราะเราต้องการลบรูปภาพต่อไป
    }

    // ลบการกดถูกใจที่เกี่ยวข้องกับรูปภาพนี้
    const { error: deleteLikesError } = await supabaseAdmin.from("likes").delete().eq("photo_id", photoId)

    if (deleteLikesError) {
      console.error("Error deleting likes:", deleteLikesError)
      // ไม่ต้อง return error เพราะเราต้องการลบรูปภาพต่อไป
    }

    // ลบรูปภาพจากฐานข้อมูล
    const { error: deleteError } = await supabaseAdmin.from("photos").delete().eq("id", photoId)

    if (deleteError) {
      console.error("Error deleting photo:", deleteError)
      return NextResponse.json({ error: "ไม่สามารถลบรูปภาพได้" }, { status: 500 })
    }

    // ลบไฟล์รูปภาพจาก Storage (ถ้ามี)
    if (photo.image_url) {
      try {
        const fileName = photo.image_url.split("/").pop()
        if (fileName) {
          const { error: storageError } = await supabaseAdmin.storage.from("photos").remove([fileName])
          if (storageError) {
            console.error("Error deleting photo from storage:", storageError)
            // ไม่ต้อง return error เพราะเราลบข้อมูลจากฐานข้อมูลสำเร็จแล้ว
          }
        }
      } catch (storageError) {
        console.error("Error processing storage deletion:", storageError)
      }
    }

    return NextResponse.json({ success: true, deletedPhotoId: photoId }, { status: 200 })
  } catch (error) {
    console.error("Error deleting photo:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการลบรูปภาพ" }, { status: 500 })
  }
}
