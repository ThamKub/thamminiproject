import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

// แก้ไขฟังก์ชัน POST เพื่อให้บันทึกข้อมูลรูปภาพลงในฐานข้อมูลได้อย่างถูกต้อง
export async function POST(request) {
  try {
    const formData = await request.formData()
    const title = formData.get("title")
    const description = formData.get("description")
    const location = formData.get("location")
    const province = formData.get("province")
    const placeTypesJson = formData.get("placeTypes")
    const placeTypes = placeTypesJson ? JSON.parse(placeTypesJson) : []
    const image = formData.get("image")
    const userId = formData.get("userId")

    // ตรวจสอบว่ามีข้อมูลครบถ้วนหรือไม่
    if (!title || !location || !image || !userId || !province || !placeTypes.length) {
      return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 })
    }

    // ตรวจสอบว่ามี supabaseAdmin หรือไม่
    if (!supabaseAdmin) {
      // ถ้าไม่มี Supabase client ให้จำลองการอัปโหลดสำเร็จ
      const photoId = `photo-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`

      // สร้าง URL สำหรับรูปภาพ (ใช้ URL.createObjectURL เพื่อสร้าง URL ชั่วคราว)
      const imageUrl = URL.createObjectURL(image)

      // สร้างข้อมูลรูปภาพใหม่
      const newPhoto = {
        id: photoId,
        title,
        description: description || "",
        location,
        province,
        placeTypes,
        image_url: imageUrl,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        featured: false,
        user: {
          id: userId,
          name: "ผู้ใช้งานตัวอย่าง",
          avatar_url: `/placeholder.svg?height=40&width=40`,
        },
        comments: [],
        likes: 0,
      }

      // บันทึกข้อมูลรูปภาพลงใน localStorage
      const photosData = localStorage.getItem("photos")
      const photos = photosData ? JSON.parse(photosData) : []
      photos.unshift(newPhoto)
      localStorage.setItem("photos", JSON.stringify(photos))

      return NextResponse.json(newPhoto, { status: 201 })
    }

    // อัปโหลดรูปภาพไปยัง Supabase Storage
    const fileName = `${userId}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}.jpg`
    const fileBuffer = await image.arrayBuffer()

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("photos")
      .upload(fileName, fileBuffer, {
        contentType: image.type,
        cacheControl: "3600",
      })

    if (uploadError) {
      console.error("Error uploading image:", uploadError)
      return NextResponse.json({ error: "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ" }, { status: 500 })
    }

    // สร้าง URL สำหรับรูปภาพ
    const { data: urlData } = supabaseAdmin.storage.from("photos").getPublicUrl(fileName)
    const image_url = urlData.publicUrl

    // เพิ่มข้อมูล placeTypes ลงในคำอธิบาย
    const enhancedDescription = description
      ? `${description}\n\nประเภทสถานที่: ${placeTypes.join(", ")}\nจังหวัด: ${province}`
      : `ประเภทสถานที่: ${placeTypes.join(", ")}\nจังหวัด: ${province}`

    // บันทึกข้อมูลรูปภาพลงในฐานข้อมูล
    const { data: photoData, error: insertError } = await supabaseAdmin
      .from("photos")
      .insert({
        title,
        description: enhancedDescription,
        location,
        image_url,
        user_id: userId,
        featured: false,
      })
      .select()

    if (insertError) {
      console.error("Error inserting photo data:", insertError)
      return NextResponse.json({ error: "เกิดข้อผิดพลาดในการบันทึกข้อมูลรูปภาพ" }, { status: 500 })
    }

    // เพิ่มข้อมูล province และ placeTypes ในการตอบกลับ
    const responseData = {
      ...photoData[0],
      province,
      placeTypes,
    }

    // บันทึกข้อมูลรูปภาพลงใน localStorage เพื่อให้แสดงผลได้ทันที
    try {
      const photosData = localStorage.getItem("photos")
      const photos = photosData ? JSON.parse(photosData) : []

      // สร้างข้อมูลรูปภาพใหม่
      const newPhoto = {
        ...responseData,
        user: {
          id: userId,
          name: "ผู้ใช้งาน", // จะถูกอัปเดตเมื่อดึงข้อมูลผู้ใช้
          avatar_url: `/placeholder.svg?height=40&width=40`,
        },
        comments: [],
        likes: 0,
      }

      photos.unshift(newPhoto)
      localStorage.setItem("photos", JSON.stringify(photos))
    } catch (error) {
      console.error("Error updating localStorage:", error)
    }

    return NextResponse.json(responseData, { status: 201 })
  } catch (error) {
    console.error("Error uploading photo:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ" }, { status: 500 })
  }
}
