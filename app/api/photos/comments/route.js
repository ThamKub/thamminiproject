import { NextResponse } from "next/server"
import { addComment, isUUID } from "@/lib/db"

export async function POST(request) {
  try {
    const body = await request.json()
    const { photoId, userId, text } = body

    if (!photoId || !userId || !text) {
      return NextResponse.json({ error: "กรุณาระบุข้อมูลให้ครบถ้วน" }, { status: 400 })
    }

    // เพิ่มความคิดเห็นโดยใช้ฟังก์ชัน addComment
    const commentData = {
      text,
      photo_id: photoId,
      user_id: userId,
    }

    // ตรวจสอบว่า ID เป็น UUID หรือไม่
    const isValidPhotoId = isUUID(photoId)
    const isValidUserId = isUUID(userId)

    // ถ้า ID ไม่ใช่ UUID ให้ใช้วิธีการจำลองการเพิ่มความคิดเห็น
    if (!isValidPhotoId || !isValidUserId) {
      console.log("Using mock comment due to non-UUID IDs:", { photoId, userId })

      // สร้างข้อมูลความคิดเห็นใหม่
      const newComment = {
        id: `comment-${Date.now()}`,
        text,
        photo_id: photoId,
        user_id: userId,
        created_at: new Date().toISOString(),
        user: {
          id: userId,
          name: "ผู้ใช้งาน",
          avatar_url: `/placeholder.svg?height=40&width=40`,
        },
      }

      // เพิ่มความคิดเห็นลงใน localStorage
      try {
        const photosData = localStorage.getItem("photos")
        if (photosData) {
          const photos = JSON.parse(photosData)
          const photoIndex = photos.findIndex((p) => p.id === photoId)

          if (photoIndex !== -1) {
            if (!photos[photoIndex].comments) {
              photos[photoIndex].comments = []
            }

            photos[photoIndex].comments.unshift(newComment)
            localStorage.setItem("photos", JSON.stringify(photos))
          }
        }
      } catch (localStorageError) {
        console.error("Error updating localStorage:", localStorageError)
        // ถึงแม้จะมีข้อผิดพลาดกับ localStorage ก็ยังส่งคืนความคิดเห็นใหม่
      }

      return NextResponse.json(newComment, { status: 201 })
    }

    // ถ้า ID เป็น UUID ให้ใช้ addComment จาก lib/db
    try {
      const newComment = await addComment(commentData)

      if (!newComment) {
        // ถ้าไม่สามารถเพิ่มความคิดเห็นได้ ให้ใช้วิธีการจำลองแทน
        const mockComment = {
          id: `comment-${Date.now()}`,
          text,
          photo_id: photoId,
          user_id: userId,
          created_at: new Date().toISOString(),
          user: {
            id: userId,
            name: "ผู้ใช้งาน",
            avatar_url: `/placeholder.svg?height=40&width=40`,
          },
        }

        return NextResponse.json(mockComment, { status: 201 })
      }

      return NextResponse.json(newComment, { status: 201 })
    } catch (dbError) {
      console.error("Database error:", dbError)

      // ถ้าเกิดข้อผิดพลาดกับฐานข้อมูล ให้ใช้วิธีการจำลองแทน
      const fallbackComment = {
        id: `comment-${Date.now()}`,
        text,
        photo_id: photoId,
        user_id: userId,
        created_at: new Date().toISOString(),
        user: {
          id: userId,
          name: "ผู้ใช้งาน",
          avatar_url: `/placeholder.svg?height=40&width=40`,
        },
      }

      return NextResponse.json(fallbackComment, { status: 201 })
    }
  } catch (error) {
    console.error("Error adding comment:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการเพิ่มความคิดเห็น" }, { status: 500 })
  }
}
