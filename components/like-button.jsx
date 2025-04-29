"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function LikeButton({
  photoId,
  initialLiked = false,
  initialLikesCount = 0,
  size = "default",
  variant = "outline",
  showCount = true,
  onLikeChange,
}) {
  const [liked, setLiked] = useState(initialLiked)
  const [likesCount, setLikesCount] = useState(initialLikesCount)
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState(null)
  const { toast } = useToast()

  // ดึงข้อมูลผู้ใช้จาก localStorage
  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)

        // ตรวจสอบว่าผู้ใช้กดไลค์รูปภาพนี้แล้วหรือยัง
        const likesKey = `photoLikes_${photoId}`
        try {
          const likesData = localStorage.getItem(likesKey)
          if (likesData) {
            const likesList = JSON.parse(likesData)
            const isLiked = likesList.some((like) => like.userId === parsedUser.id)
            setLiked(isLiked)
            setLikesCount(likesList.length)
          }
        } catch (error) {
          console.error("Error checking like status:", error)
        }
      } catch (error) {
        console.error("Failed to parse user data:", error)
      }
    }
  }, [photoId])

  const handleLike = async () => {
    if (!user) {
      toast({
        title: "กรุณาเข้าสู่ระบบ",
        description: "คุณต้องเข้าสู่ระบบก่อนจึงจะสามารถกดไลค์ได้",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // อัปเดตสถานะการไลค์ในคอมโพเนนต์ทันที
      const newLiked = !liked
      const newLikesCount = newLiked ? likesCount + 1 : Math.max(0, likesCount - 1)

      // อัปเดตสถานะในคอมโพเนนต์ทันที
      setLiked(newLiked)
      setLikesCount(newLikesCount)

      // เรียกใช้ callback ทันที (ก่อนบันทึกลง localStorage)
      if (onLikeChange) {
        onLikeChange(newLiked, newLikesCount)
      }

      // เรียกใช้ API เพื่อกดไลค์/ยกเลิกไลค์
      const response = await fetch("/api/photos/like", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          photoId,
          userId: user.id,
        }),
      })

      if (!response.ok) {
        throw new Error("ไม่สามารถกดไลค์ได้")
      }

      const data = await response.json()

      // ถ้าเป็นการจำลองการกดไลค์ (simulateLike = true) ให้จัดการด้วย localStorage
      if (data.simulateLike) {
        // อัปเดตสถานะการกดไลค์ใน localStorage
        const likesKey = `photoLikes_${photoId}`
        let likesList = []
        try {
          const likesData = localStorage.getItem(likesKey)
          if (likesData) {
            likesList = JSON.parse(likesData)
          }
        } catch (error) {
          console.error("Error parsing likes data:", error)
        }

        const userLikeIndex = likesList.findIndex((like) => like.userId === user.id)

        if (newLiked && userLikeIndex === -1) {
          // เพิ่มข้อมูลการกดไลค์
          likesList.push({
            userId: user.id,
            userName: user.name,
            timestamp: new Date().toISOString(),
          })
        } else if (!newLiked && userLikeIndex !== -1) {
          // ลบข้อมูลการกดไลค์
          likesList.splice(userLikeIndex, 1)
        }

        // บันทึกข้อมูลลงใน localStorage
        localStorage.setItem(likesKey, JSON.stringify(likesList))

        // อัปเดตรายการรูปภาพที่ผู้ใช้กดไลค์
        const likedPhotosKey = `likedPhotos_${user.id}`
        let likedPhotos = []
        try {
          const likedPhotosData = localStorage.getItem(likedPhotosKey)
          if (likedPhotosData) {
            likedPhotos = JSON.parse(likedPhotosData)
          }
        } catch (error) {
          console.error("Error parsing liked photos:", error)
        }

        if (newLiked && !likedPhotos.includes(photoId)) {
          likedPhotos.push(photoId)
        } else if (!newLiked) {
          const index = likedPhotos.indexOf(photoId)
          if (index !== -1) {
            likedPhotos.splice(index, 1)
          }
        }

        localStorage.setItem(likedPhotosKey, JSON.stringify(likedPhotos))

        // อัปเดตข้อมูลรูปภาพใน localStorage
        try {
          const photosData = localStorage.getItem("photos")
          if (photosData) {
            const photos = JSON.parse(photosData)
            const photoIndex = photos.findIndex((p) => p.id === photoId)

            if (photoIndex !== -1) {
              // อัปเดตจำนวนไลค์ในรูปภาพ
              if (typeof photos[photoIndex].likes === "number") {
                photos[photoIndex].likes = likesList.length
              } else {
                photos[photoIndex].likes = likesList
              }

              localStorage.setItem("photos", JSON.stringify(photos))
            }
          }
        } catch (error) {
          console.error("Error updating photo likes in localStorage:", error)
        }

        // ทำให้เกิด storage event เพื่อให้หน้าอื่นรับรู้การเปลี่ยนแปลง
        window.dispatchEvent(new Event("storage"))
      } else {
        // ถ้าเป็นการกดไลค์ผ่าน Supabase ให้อัปเดตตามข้อมูลที่ได้รับจาก API
        setLiked(data.liked)
        setLikesCount(data.likesCount)

        if (onLikeChange) {
          onLikeChange(data.liked, data.likesCount)
        }
      }

      console.log("Like API response:", data)
    } catch (error) {
      console.error("Error toggling like:", error)

      // กรณีเกิดข้อผิดพลาด ให้กลับไปใช้ค่าเดิม
      setLiked(initialLiked)
      setLikesCount(initialLikesCount)

      toast({
        variant: "destructive",
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถกดไลค์ได้ กรุณาลองใหม่อีกครั้ง",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant={liked ? "default" : variant}
      size={size}
      onClick={handleLike}
      disabled={isLoading}
      className={`minimal-button transition-all duration-300 ${liked ? "text-white" : ""}`}
    >
      <Heart
        className={`h-4 w-4 ${showCount ? "mr-2" : ""} ${liked ? "fill-current" : ""} transition-all duration-300`}
      />
      {showCount ? likesCount : ""}
    </Button>
  )
}
