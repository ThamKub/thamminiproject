"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { MessageSquare, Trash2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { supabase } from "@/lib/supabase-client"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LikeButton } from "@/components/like-button"

// ลบ interface Photo ออก

// ลบ interface PhotoGridProps ออก

export function PhotoGrid({ featured = false, limit = 12, userId, locationFilter, refreshKey = 0, random = false }) {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [noPhotos, setNoPhotos] = useState(false)
  const [isDeleting, setIsDeleting] = useState(null)
  const { toast } = useToast()
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState(null)

  // ดึงข้อมูลผู้ใช้ปัจจุบัน
  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setCurrentUser(parsedUser)
      } catch (error) {
        console.error("Failed to parse user data:", error)
      }
    }
  }, [])

  // ฟังก์ชันสำหรับลบรูปภาพ
  const handleDeletePhoto = async (photoId, e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    // ดึงข้อมูลผู้ใช้จาก localStorage
    const userData = localStorage.getItem("user")
    if (!userData) {
      toast({
        variant: "destructive",
        title: "กรุณาเข้าสู่ระบบ",
        description: "คุณต้องเข้าสู่ระบบก่อนจึงจะสามารถลบรูปภาพได้",
      })
      return
    }

    const user = JSON.parse(userData)
    setIsDeleting(photoId)

    try {
      // ลบรูปภาพออกจาก UI ทันที
      setPhotos((prevPhotos) => prevPhotos.filter((photo) => photo.id !== photoId))

      // ลบรูปภาพจาก localStorage
      const photosData = localStorage.getItem("photos")
      if (photosData) {
        try {
          const allPhotos = JSON.parse(photosData)
          const updatedPhotos = allPhotos.filter((photo) => photo.id !== photoId)
          localStorage.setItem("photos", JSON.stringify(updatedPhotos))

          // เก็บข้อมูลรูปภาพที่ถูกลบใน localStorage เพื่อให้หน้าอื่นๆ รับรู้
          const deletedPhotosData = localStorage.getItem("deletedPhotos") || "[]"
          const deletedPhotos = JSON.parse(deletedPhotosData)
          if (!deletedPhotos.includes(photoId)) {
            deletedPhotos.push(photoId)
            localStorage.setItem("deletedPhotos", JSON.stringify(deletedPhotos))
          }
        } catch (error) {
          console.error("Error updating localStorage:", error)
        }
      }

      // ลบข้อมูลการกดไลค์ของรูปภาพนี้
      const likesKey = `photoLikes_${photoId}`
      localStorage.removeItem(likesKey)

      // ลบรูปภาพนี้ออกจากรายการรูปภาพที่ผู้ใช้กดไลค์
      try {
        const likedPhotosKey = `likedPhotos_${user.id}`
        const likedPhotosData = localStorage.getItem(likedPhotosKey)
        if (likedPhotosData) {
          const likedPhotos = JSON.parse(likedPhotosData)
          const updatedLikedPhotos = likedPhotos.filter((id) => id !== photoId)
          localStorage.setItem(likedPhotosKey, JSON.stringify(updatedLikedPhotos))
        }
      } catch (error) {
        console.error("Error updating liked photos:", error)
      }

      // ลบรูปภาพผ่าน API
      const response = await fetch(`/api/photos/delete?id=${photoId}&userId=${user.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "ไม่สามารถลบรูปภาพได้")
      }

      toast({
        title: "ลบรูปภาพสำเร็จ",
        description: "รูปภาพถูกลบออกจากระบบเรียบร้อยแล้ว",
      })

      // ทำให้เกิด storage event เพื่อให้หน้าอื่นรับรู้การเปลี่ยนแปลง
      window.dispatchEvent(new Event("storage"))
    } catch (error) {
      console.error("Error deleting photo:", error)

      // ดึงข้อมูลรูปภาพกลับมาเนื่องจากเกิดข้อผิดพลาด
      fetchPhotos()

      toast({
        variant: "destructive",
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถลบรูปภาพได้ กรุณาลองใหม่อีกครั้ง",
      })
    } finally {
      setIsDeleting(null)
    }
  }

  // ฟังก์ชันสำหรับอัปเดตจำนวนไลค์ของรูปภาพ
  const updatePhotoLikes = useCallback((photoId, liked, likesCount) => {
    setPhotos((prevPhotos) =>
      prevPhotos.map((photo) => {
        if (photo.id === photoId) {
          return { ...photo, likes: likesCount }
        }
        return photo
      }),
    )
  }, [])

  // แก้ไขฟังก์ชัน fetchPhotos เพื่อให้ดึงข้อมูลรูปภาพได้อย่างถูกต้อง
  const fetchPhotos = async () => {
    setLoading(true)
    try {
      // สร้าง URL สำหรับ API
      const url = new URL("/api/photos", window.location.origin)
      url.searchParams.append("limit", limit.toString())
      url.searchParams.append("offset", "0")

      if (featured) {
        url.searchParams.append("featured", "true")
      }

      if (locationFilter) {
        url.searchParams.append("location", locationFilter)
      }

      if (userId) {
        url.searchParams.append("userId", userId)
      }

      // เพิ่ม timestamp เพื่อป้องกัน cache
      url.searchParams.append("t", Date.now().toString())

      // เรียกใช้ API
      const response = await fetch(url.toString(), { cache: "no-store" })

      if (!response.ok) {
        throw new Error("Failed to fetch photos")
      }

      const data = await response.json()

      // ถ้าไม่มีข้อมูลจาก API ให้ลองดึงข้อมูลจาก localStorage
      if (!data || data.length === 0) {
        const photosData = localStorage.getItem("photos")
        if (photosData) {
          try {
            let allPhotos = JSON.parse(photosData)

            // ดึงรายการรูปภาพที่ถูกลบ
            const deletedPhotosData = localStorage.getItem("deletedPhotos") || "[]"
            const deletedPhotos = JSON.parse(deletedPhotosData)

            // กรองรูปภาพที่ถูกลบออก
            allPhotos = allPhotos.filter((photo) => !deletedPhotos.includes(photo.id))

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

            // จำกัดจำนวน
            const limitedPhotos = allPhotos.slice(0, limit)

            if (limitedPhotos.length === 0) {
              setNoPhotos(true)
              setPhotos([])
              setLoading(false)
              return
            }

            // แปลงข้อมูลให้ตรงกับโครงสร้างที่ต้องการ
            let formattedPhotos = limitedPhotos.map((photo) => {
              // ดึงข้อมูลการกดถูกใจจาก localStorage
              let likesCount = 0
              const likesKey = `photoLikes_${photo.id}`
              try {
                const likesData = localStorage.getItem(likesKey)
                if (likesData) {
                  const likesList = JSON.parse(likesData)
                  likesCount = likesList.length
                } else if (typeof photo.likes === "number") {
                  likesCount = photo.likes
                } else if (Array.isArray(photo.likes)) {
                  likesCount = photo.likes.length
                }
              } catch (error) {
                console.error("Error parsing likes data:", error)
                likesCount = typeof photo.likes === "number" ? photo.likes : photo.likes?.length || 0
              }

              return {
                id: photo.id,
                image_url: photo.image_url,
                title: photo.title,
                location: photo.location,
                likes: likesCount,
                comments: Array.isArray(photo.comments) ? photo.comments.length : 0,
                user: {
                  name: photo.user?.name || "ผู้ใช้งาน",
                  avatar_url: photo.user?.avatar_url || `/placeholder.svg?height=40&width=40`,
                  id: photo.user_id || photo.user?.id || "unknown",
                },
              }
            })

            // ถ้า random=true ให้สุ่มลำดับรูปภาพ
            if (random && formattedPhotos.length > 0) {
              formattedPhotos = formattedPhotos.sort(() => Math.random() - 0.5).slice(0, limit)
            }

            setPhotos(formattedPhotos)
            setNoPhotos(false)
            setLoading(false)
            return
          } catch (error) {
            console.error("Error parsing photos from localStorage:", error)
          }
        }

        setNoPhotos(true)
        setPhotos([])
        setLoading(false)
        return
      }

      // ดึงรายการรูปภาพที่ถูกลบ
      const deletedPhotosData = localStorage.getItem("deletedPhotos") || "[]"
      const deletedPhotos = JSON.parse(deletedPhotosData)

      // กรองรูปภาพที่ถูกลบออก
      const filteredData = data.filter((photo) => !deletedPhotos.includes(photo.id))

      // แปลงข้อมูลจาก API ให้ตรงกับโครงสร้างที่ต้องการ
      let formattedPhotos = filteredData.map((photo) => {
        // ดึงข้อมูลการกดถูกใจจาก localStorage
        let likesCount = 0
        const likesKey = `photoLikes_${photo.id}`
        try {
          const likesData = localStorage.getItem(likesKey)
          if (likesData) {
            const likesList = JSON.parse(likesData)
            likesCount = likesList.length
          } else if (typeof photo.likes === "number") {
            likesCount = photo.likes
          } else if (Array.isArray(photo.likes)) {
            likesCount = photo.likes.length
          }
        } catch (error) {
          console.error("Error parsing likes data:", error)
          likesCount = typeof photo.likes === "number" ? photo.likes : photo.likes?.length || 0
        }

        return {
          id: photo.id,
          image_url: photo.image_url,
          title: photo.title,
          location: photo.location,
          likes: likesCount,
          comments: photo.comments?.length || 0,
          user: {
            name: photo.user?.name || "ผู้ใช้งาน",
            avatar_url: photo.user?.avatar_url || `/placeholder.svg?height=40&width=40`,
            id: photo.user_id || photo.user?.id || "unknown",
          },
        }
      })

      // ถ้า random=true ให้สุ่มลำดับรูปภาพ
      if (random && formattedPhotos.length > 0) {
        formattedPhotos = formattedPhotos.sort(() => Math.random() - 0.5).slice(0, limit)
      }

      setPhotos(formattedPhotos)
      setNoPhotos(formattedPhotos.length === 0)
    } catch (error) {
      console.error("Error fetching photos:", error)
      setNoPhotos(true)
      setPhotos([])
    } finally {
      setLoading(false)
    }
  }

  // ตรวจสอบรูปภาพที่ถูกลบ
  const checkDeletedPhotos = useCallback(() => {
    try {
      const deletedPhotosData = localStorage.getItem("deletedPhotos") || "[]"
      const deletedPhotos = JSON.parse(deletedPhotosData)

      if (deletedPhotos.length > 0) {
        // กรองรูปภาพที่ถูกลบออกจากรายการที่แสดงอยู่
        setPhotos((prevPhotos) => prevPhotos.filter((photo) => !deletedPhotos.includes(photo.id)))
      }
    } catch (error) {
      console.error("Error checking deleted photos:", error)
    }
  }, [])

  // ดึงข้อมูลรูปภาพเมื่อคอมโพเนนต์โหลดหรือเมื่อ refreshKey เปลี่ยน
  useEffect(() => {
    fetchPhotos()

    // ตั้งค่า subscription สำหรับการเปลี่ยนแปลงในตาราง photos
    if (supabase) {
      const subscription = supabase
        .channel("photos-changes")
        .on("postgres_changes", { event: "*", schema: "public", table: "photos" }, () => {
          // เมื่อมีการเปลี่ยนแปลงในตาราง photos ให้ดึงข้อมูลใหม่
          fetchPhotos()
        })
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }

    // เพิ่ม event listener สำหรับการเปลี่ยนแปลงใน localStorage
    const handleStorageChange = () => {
      checkDeletedPhotos()
      fetchPhotos()
    }

    window.addEventListener("storage", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [featured, limit, userId, locationFilter, refreshKey, random, checkDeletedPhotos])

  // ฟังก์ชันสำหรับตรวจสอบว่าผู้ใช้กดไลค์รูปภาพนี้แล้วหรือยัง
  const isPhotoLiked = (photoId) => {
    if (!currentUser) return false

    try {
      // วิธีที่ 1: ตรวจสอบจาก likedPhotos
      const likedPhotosKey = `likedPhotos_${currentUser.id}`
      const likedPhotosData = localStorage.getItem(likedPhotosKey)
      if (likedPhotosData) {
        const likedPhotos = JSON.parse(likedPhotosData)
        if (likedPhotos.includes(photoId)) {
          return true
        }
      }

      // วิธีที่ 2: ตรวจสอบจาก photoLikes
      const likesKey = `photoLikes_${photoId}`
      const likesData = localStorage.getItem(likesKey)
      if (likesData) {
        const likesList = JSON.parse(likesData)
        return likesList.some((like) => like.userId === currentUser.id)
      }
    } catch (error) {
      console.error("Error checking like status:", error)
    }

    return false
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: limit }).map((_, i) => (
          <div key={i} className="rounded-lg overflow-hidden">
            <Skeleton className="aspect-[4/3] w-full" />
            <div className="p-3 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (noPhotos || photos.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">ไม่พบรูปภาพที่ต้องการ</p>
      </div>
    )
  }

  // แก้ไขส่วนการแสดงผลรูปภาพ
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {photos.map((photo) => {
        // ตรวจสอบว่าผู้ใช้ปัจจุบันเป็นเจ้าของรูปภาพหรือไม่
        const isOwner = currentUser && currentUser.id === photo.user.id
        // ตรวจสอบว่าผู้ใช้กดไลค์รูปภาพนี้แล้วหรือยัง
        const isLiked = isPhotoLiked(photo.id)

        return (
          <div key={photo.id} className="minimal-card group transition-all duration-300 hover:translate-y-[-5px]">
            <Link href={`/photos/${photo.id}`} className="block">
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={photo.image_url || "/placeholder.svg"}
                  alt={photo.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  unoptimized={photo.image_url?.startsWith("https://")}
                />
              </div>
            </Link>
            <div className="p-4">
              <h3 className="font-medium line-clamp-1 mb-1">{photo.title}</h3>
              <p className="text-sm text-muted-foreground mb-3">{photo.location}</p>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-3">
                  <LikeButton
                    key={`like-${photo.id}-${photo.likes}`}
                    photoId={photo.id}
                    initialLiked={isLiked}
                    initialLikesCount={photo.likes}
                    size="sm"
                    variant="ghost"
                    showCount={true}
                    onLikeChange={(liked, likesCount) => {
                      // อัปเดตจำนวนไลค์ในรายการรูปภาพทันที
                      updatePhotoLikes(photo.id, liked, likesCount)
                    }}
                  />
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    {photo.comments}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/profile/${photo.user.id}`} className="text-xs hover:text-primary transition-colors">
                    {photo.user.name}
                  </Link>
                  {isOwner && (
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => handleDeletePhoto(photo.id, e)}
                      disabled={isDeleting === photo.id}
                    >
                      {isDeleting === photo.id ? (
                        <span className="animate-spin">⏳</span>
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
