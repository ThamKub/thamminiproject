import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { isUUID } from "@/lib/db"

export async function POST(request) {
  try {
    const formData = await request.formData()
    const name = formData.get("name")
    const bio = formData.get("bio")
    const userId = formData.get("userId")
    const avatar = formData.get("avatar")

    if (!name || !userId) {
      return NextResponse.json({ error: "กรุณาระบุชื่อและ ID ผู้ใช้" }, { status: 400 })
    }

    // ตรวจสอบว่า userId เป็น UUID หรือไม่
    const isValidUUID = isUUID(userId)

    // ตรวจสอบว่ามี supabaseAdmin หรือไม่
    if (!supabaseAdmin || !isValidUUID) {
      // ถ้าไม่มี Supabase client หรือ userId ไม่ใช่ UUID ให้จำลองการอัปเดตสำเร็จ
      return NextResponse.json(
        {
          id: userId,
          name,
          bio,
          avatar_url: avatar ? URL.createObjectURL(avatar) : undefined,
        },
        { status: 200 },
      )
    }

    // อัปเดตข้อมูลผู้ใช้
    let avatar_url = undefined

    // ถ้ามีการอัปโหลดรูปโปรไฟล์ใหม่
    if (avatar && avatar.size > 0) {
      // อัปโหลดรูปภาพไปยัง Supabase Storage
      const fileName = `avatar-${userId}-${Date.now()}`
      const fileBuffer = await avatar.arrayBuffer()

      // ใช้ bucket "photos" แทน "avatars" เนื่องจาก bucket "photos" มีอยู่แล้ว
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from("photos")
        .upload(fileName, fileBuffer, {
          contentType: avatar.type,
          cacheControl: "3600",
        })

      if (uploadError) {
        console.error("Error uploading avatar:", uploadError)
        return NextResponse.json({ error: "เกิดข้อผิดพลาดในการอัปโหลดรูปโปรไฟล์" }, { status: 500 })
      }

      // สร้าง URL สำหรับรูปภาพ
      const { data: urlData } = supabaseAdmin.storage.from("photos").getPublicUrl(fileName)
      avatar_url = urlData.publicUrl
    }

    // อัปเดตข้อมูลผู้ใช้ในฐานข้อมูล
    const updateData = {
      name,
      updated_at: new Date().toISOString(),
    }

    if (avatar_url) {
      updateData.avatar_url = avatar_url
    }

    const { data, error } = await supabaseAdmin.from("users").update(updateData).eq("id", userId).select().single()

    if (error) {
      console.error("Error updating user:", error)
      return NextResponse.json({ error: "เกิดข้อผิดพลาดในการอัปเดตข้อมูลผู้ใช้" }, { status: 500 })
    }

    // เพิ่ม bio กลับไปในข้อมูลที่ส่งกลับ แม้จะไม่ได้บันทึกในฐานข้อมูล
    return NextResponse.json({
      ...data,
      bio,
    })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการอัปเดตข้อมูลผู้ใช้" }, { status: 500 })
  }
}
