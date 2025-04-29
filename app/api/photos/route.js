import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getAllPhotos } from "@/lib/db"

// API สำหรับดึงข้อมูลรูปภาพทั้งหมด
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = Number.parseInt(searchParams.get("offset") || "0")
    const featured = searchParams.get("featured") === "true"
    const locationFilter = searchParams.get("location") || undefined
    const userId = searchParams.get("userId") || undefined

    // ตรวจสอบว่ามี supabaseAdmin หรือไม่
    if (!supabaseAdmin) {
      // ถ้าไม่มี Supabase client ให้ดึงข้อมูลจาก localStorage แทน
      try {
        const photosData = localStorage.getItem("photos")
        if (photosData) {
          let allPhotos = JSON.parse(photosData)

          // กรองตามเงื่อนไข
          if (featured) {
            allPhotos = allPhotos.filter((photo) => photo.featured)
          }

          if (locationFilter) {
            allPhotos = allPhotos.filter(
              (photo) =>
                photo.location?.toLowerCase().includes(locationFilter.toLowerCase()) ||
                photo.province?.toLowerCase().includes(locationFilter.toLowerCase()),
            )
          }

          if (userId) {
            allPhotos = allPhotos.filter((photo) => photo.user_id === userId)
          }

          // เรียงลำดับตาม created_at จากใหม่ไปเก่า
          allPhotos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

          // จำกัดจำนวนและ offset
          return NextResponse.json(allPhotos.slice(offset, offset + limit))
        }
      } catch (error) {
        console.error("Error parsing photos from localStorage:", error)
      }
      return NextResponse.json([])
    }

    const photos = await getAllPhotos(limit, offset, featured, locationFilter, userId)

    return NextResponse.json(photos)
  } catch (error) {
    console.error("Error fetching photos:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลรูปภาพ" }, { status: 500 })
  }
}

// API สำหรับเพิ่มรูปภาพใหม่
export async function POST(request) {
  try {
    const formData = await request.formData()
    const title = formData.get("title")
    const description = formData.get("description")
    const location = formData.get("location")
    const image = formData.get("image")
    const userId = formData.get("userId")

    // ตรวจสอบว่ามีข้อมูลครบถ้วนหรือไม่
    if (!title || !location || !image || !userId) {
      return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 })
    }

    // ตรวจสอบว่ามี supabaseAdmin หรือไม่
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "ไม่สามารถเข้าถึงฐานข้อมูลได้ กรุณาตรวจสอบการตั้งค่า Supabase" }, { status: 500 })
    }

    // อัปโหลดรูปภาพไปยัง Supabase Storage
    const fileName = `${userId}-${Date.now()}-${image.name}`
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

    // บันทึกข้อมูลรูปภาพลงในฐานข้อมูล
    const { data: photoData, error: insertError } = await supabaseAdmin
      .from("photos")
      .insert({
        title,
        description,
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

    return NextResponse.json(photoData[0], { status: 201 })
  } catch (error) {
    console.error("Error uploading photo:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ" }, { status: 500 })
  }
}
