"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import {
  MessageSquare,
  Share2,
  Flag,
  MoreHorizontal,
  MapPin,
  Calendar,
  Loader2,
  Trash2,
  Edit,
  UserPlus,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatDistanceToNow } from "date-fns"
import { th } from "date-fns/locale"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { isUUID } from "@/lib/db"
import { LikeButton } from "@/components/like-button"

export default function PhotoPage({ params }) {
  const [photo, setPhoto] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [user, setUser] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // ดึงข้อมูลผู้ใช้จาก localStorage
  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
      } catch (error) {
        console.error("Failed to parse user data:", error)
      }
    }
  }, [])

  // ตรวจสอบว่ารูปภาพถูกลบไปแล้วหรือไม่
  useEffect(() => {
    try {
      const deletedPhotosData = localStorage.getItem("deletedPhotos") || "[]"
      const deletedPhotos = JSON.parse(deletedPhotosData)

      if (deletedPhotos.includes(params.id)) {
        setNotFound(true)
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Error checking deleted photos:", error)
    }
  }, [params.id])

  // ดึงข้อมูลรูปภาพจาก API
  useEffect(() => {
    const fetchPhoto = async () => {
      if (notFound) return // ถ้ารูปภาพถูกลบไปแล้ว ไม่ต้องดึงข้อมูล

      setIsLoading(true)
      try {
        // ตรวจสอบว่า ID เป็น UUID หรือไม่
        if (!isUUID(params.id)) {
          setNotFound(true)
          setIsLoading(false)
          return
        }

        // ดึงข้อมูลจาก API
        const response = await fetch(`/api/photos/${params.id}?t=${Date.now()}`, { cache: "no-store" })

        if (!response.ok) {
          if (response.status === 404) {
            setNotFound(true)
          } else {
            throw new Error(`API error: ${response.status}`)
          }
          setIsLoading(false)
          return
        }

        const photoData = await response.json()

        // ตรวจสอบว่าผู้ใช้ถูกใจรูปภาพนี้หรือไม่
        let isLiked = false
        let likesList = []
        let likesCount = 0

        // วิธีที่ 1: ตรวจสอบจาก likedPhotos
        if (user) {
          const likedPhotosKey = `likedPhotos_${user.id}`
          try {
            const likedPhotosData = localStorage.getItem(likedPhotosKey)
            if (likedPhotosData) {
              const likedPhotos = JSON.parse(likedPhotosData)
              if (likedPhotos.includes(params.id)) {
                isLiked = true
              }
            }
          } catch (error) {
            console.error("Error checking liked photos:", error)
          }
        }

        // วิธีที่ 2: ตรวจสอบจาก photoLikes
        const likesKey = `photoLikes_${params.id}`
        try {
          const likesData = localStorage.getItem(likesKey)
          if (likesData) {
            likesList = JSON.parse(likesData)
            likesCount = likesList.length

            // ตรวจสอบว่าผู้ใช้ปัจจุบันกดถูกใจรูปนี้หรือไม่
            if (user && !isLiked) {
              isLiked = likesList.some((like) => like.userId === user.id)
            }
          }
        } catch (error) {
          console.error("Error parsing likes data:", error)
        }

        // แปลงข้อมูลให้ตรงกับโครงสร้างที่ต้องการ
        const formattedPhoto = {
          id: photoData.id,
          title: photoData.title,
          description: photoData.description || "",
          location: photoData.location,
          imageUrl: photoData.image_url,
          createdAt: new Date(photoData.created_at),
          likes: likesCount || (Array.isArray(photoData.likes) ? photoData.likes.length : 0),
          likesList: likesList,
          liked: isLiked,
          user: {
            id: photoData.user?.id || "unknown",
            name: photoData.user?.name || "ผู้ใช้งานไม่ระบุชื่อ",
            image: photoData.user?.avatar_url || "/placeholder.svg?height=40&width=40",
          },
          comments: (photoData.comments || []).map((comment) => ({
            id: comment.id,
            text: comment.text,
            createdAt: new Date(comment.created_at),
            user: {
              id: comment.user?.id || "unknown",
              name: comment.user?.name || "ผู้ใช้งานไม่ระบุชื่อ",
              image: comment.user?.avatar_url || "/placeholder.svg?height=40&width=40",
            },
          })),
        }

        setPhoto(formattedPhoto)
        setNotFound(false)
      } catch (error) {
        console.error("Error fetching photo:", error)
        setNotFound(true)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPhoto()
  }, [params.id, user, notFound])

  // ตรวจสอบการเปลี่ยนแปลงใน localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      // ตรวจสอบว่ารูปภาพถูกลบไปแล้วหรือไม่
      try {
        const deletedPhotosData = localStorage.getItem("deletedPhotos") || "[]"
        const deletedPhotos = JSON.parse(deletedPhotosData)

        if (deletedPhotos.includes(params.id)) {
          setNotFound(true)
          return
        }
      } catch (error) {
        console.error("Error checking deleted photos:", error)
      }

      // ดึงข้อมูลการกดถูกใจใหม่จาก localStorage
      if (photo) {
        const likesKey = `photoLikes_${photo.id}`
        let likesList = []
        let isLiked = false

        try {
          const likesData = localStorage.getItem(likesKey)
          if (likesData) {
            likesList = JSON.parse(likesData)

            // ตรวจสอบว่าผู้ใช้ปัจจุบันกดถูกใจรูปนี้หรือไม่
            if (user) {
              isLiked = likesList.some((like) => like.userId === user.id)
            }
          }
        } catch (error) {
          console.error("Error parsing likes data:", error)
        }

        setPhoto((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            likes: likesList.length,
            likesList: likesList,
            liked: isLiked,
          }
        })
      }
    }

    // เพิ่ม event listener
    window.addEventListener("storage", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [photo, user, params.id])

  // แก้ไขฟังก์ชัน handleCommentSubmit เพื่อให้แสดงความคิดเห็นได้ถูกต้อง

  const handleCommentSubmit = async (e) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "กรุณาเข้าสู่ระบบ",
        description: "คุณต้องเข้าสู่ระบบก่อนจึงจะสามารถแสดงความคิดเห็นได้",
        variant: "destructive",
      })
      return
    }

    if (!comment.trim()) {
      toast({
        title: "ข้อความว่างเปล่า",
        description: "กรุณากรอกข้อความก่อนส่งความคิดเห็น",
        variant: "destructive",
      })
      return
    }

    if (!photo) return

    setIsSubmitting(true)

    try {
      // สร้างข้อมูลความคิดเห็นใหม่
      const commentId = `comment-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      const newComment = {
        id: commentId,
        text: comment,
        createdAt: new Date(),
        user: {
          id: user.id,
          name: user.name,
          image: user.avatar_url || "/placeholder.svg?height=40&width=40",
        },
      }

      // อัปเดต state ทันทีเพื่อให้แสดงความคิดเห็นใหม่
      setPhoto((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          comments: [newComment, ...prev.comments],
        }
      })

      // อัปเดตข้อมูลใน localStorage
      try {
        const photosData = localStorage.getItem("photos")
        if (photosData) {
          const photos = JSON.parse(photosData)
          const photoIndex = photos.findIndex((p) => p.id === photo.id)

          if (photoIndex !== -1) {
            // ถ้าไม่มี comments array ให้สร้างใหม่
            if (!photos[photoIndex].comments) {
              photos[photoIndex].comments = []
            }

            // เพิ่มความคิดเห็นใหม่ลงในรายการ
            photos[photoIndex].comments.unshift({
              id: newComment.id,
              text: newComment.text,
              created_at: newComment.createdAt.toISOString(),
              user_id: user.id,
              photo_id: photo.id,
              user: {
                id: user.id,
                name: user.name,
                avatar_url: user.avatar_url || "/placeholder.svg?height=40&width=40",
              },
            })

            // บันทึกข้อมูลลงใน localStorage
            localStorage.setItem("photos", JSON.stringify(photos))

            // ทำให้เกิด storage event เพื่อให้หน้าอื่นรับรู้การเปลี่ยนแปลง
            window.dispatchEvent(new Event("storage"))
          }
        }
      } catch (localStorageError) {
        console.error("Error updating localStorage:", localStorageError)
      }

      // ล้างข้อความความคิดเห็น
      setComment("")

      // แสดง toast แจ้งว่าส่งความคิดเห็นสำเร็จ
      toast({
        title: "ส่งความคิดเห็นสำเร็จ",
        description: "ความคิดเห็นของคุณถูกเพิ่มเรียบร้อยแล้ว",
      })

      // ส่งข้อมูลไปยัง API (ทำหลังจากอัปเดต UI แล้ว)
      try {
        const response = await fetch("/api/photos/comments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            photoId: photo.id,
            userId: user.id,
            text: comment,
          }),
        })

        if (response.ok) {
          const newCommentData = await response.json()
          console.log("API comment success:", newCommentData)
        } else {
          console.warn("API comment failed but UI was updated")
        }
      } catch (apiError) {
        console.error("API comment error:", apiError)
        // ไม่ต้อง throw error เพราะเราได้อัปเดต UI แล้ว
      }
    } catch (error) {
      console.error("Error adding comment:", error)
      toast({
        variant: "destructive",
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถเพิ่มความคิดเห็นได้ กรุณาลองใหม่อีกครั้ง",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // ฟังก์ชันสำหรับลบรูปภาพ
  const handleDeletePhoto = async () => {
    if (!user || !photo) return

    setIsDeleting(true)

    try {
      // ลบรูปภาพจาก localStorage
      const photosData = localStorage.getItem("photos")
      if (photosData) {
        try {
          const allPhotos = JSON.parse(photosData)
          const updatedPhotos = allPhotos.filter((p) => p.id !== photo.id)
          localStorage.setItem("photos", JSON.stringify(updatedPhotos))

          // เก็บข้อมูลรูปภาพที่ถูกลบใน localStorage เพื่อให้หน้าอื่นๆ รับรู้
          const deletedPhotosData = localStorage.getItem("deletedPhotos") || "[]"
          const deletedPhotos = JSON.parse(deletedPhotosData)
          if (!deletedPhotos.includes(photo.id)) {
            deletedPhotos.push(photo.id)
            localStorage.setItem("deletedPhotos", JSON.stringify(deletedPhotos))
          }
        } catch (error) {
          console.error("Error updating localStorage:", error)
        }
      }

      // ลบข้อมูลการกดไลค์ของรูปภาพนี้
      const likesKey = `photoLikes_${photo.id}`
      localStorage.removeItem(likesKey)

      // ลบรูปภาพนี้ออกจากรายการรูปภาพที่ผู้ใช้กดไลค์
      try {
        const likedPhotosKey = `likedPhotos_${user.id}`
        const likedPhotosData = localStorage.getItem(likedPhotosKey)
        if (likedPhotosData) {
          const likedPhotos = JSON.parse(likedPhotosData)
          const updatedLikedPhotos = likedPhotos.filter((id) => id !== photo.id)
          localStorage.setItem(likedPhotosKey, JSON.stringify(updatedLikedPhotos))
        }
      } catch (error) {
        console.error("Error updating liked photos:", error)
      }

      // นำผู้ใช้กลับไปยังหน้าหลักทันที
      router.push("/")

      // ลบรูปภาพผ่าน API
      const response = await fetch(`/api/photos/delete?id=${photo.id}&userId=${user.id}`, {
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
      toast({
        variant: "destructive",
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถลบรูปภาพได้ กรุณาลองใหม่อีกครั้ง",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    )
  }

  if (notFound || !photo) {
    return (
      <div className="container mx-auto py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">ไม่พบรูปภาพ</h1>
        <p className="text-muted-foreground mb-6">รูปภาพที่คุณกำลังค้นหาอาจถูกลบไปแล้วหรือไม่มีอยู่ในระบบ</p>
        <Button asChild>
          <Link href="/explore">กลับไปยังหน้าสำรวจ</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="grid md:grid-cols-5 gap-8">
        <div className="md:col-span-3 space-y-6">
          <div className="rounded-lg overflow-hidden border bg-card relative group">
            <div className="relative aspect-[4/3] md:aspect-[16/9]">
              <Image
                src={photo.imageUrl || "/placeholder.svg"}
                alt={photo.title}
                fill
                className="object-cover"
                priority
              />

              {/* ปุ่มแก้ไขและลบที่แสดงเมื่อเป็นเจ้าของรูปภาพ */}
              {user?.id === photo.user.id && (
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="secondary" size="icon" className="bg-white/80 hover:bg-white/90 text-black">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="bg-white/80 hover:bg-red-500 text-red-500 hover:text-white"
                    onClick={handleDeletePhoto}
                    disabled={isDeleting}
                  >
                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <LikeButton
                      key={`like-button-${photo.id}-${photo.likes}`}
                      photoId={photo.id}
                      initialLiked={photo.liked}
                      initialLikesCount={photo.likes}
                      size="sm"
                      onLikeChange={(liked, likesCount) => {
                        setPhoto((prev) => {
                          if (!prev) return prev
                          return {
                            ...prev,
                            liked,
                            likes: likesCount,
                          }
                        })

                        // อัปเดต likesList ด้วย
                        if (liked && user) {
                          const newLike = {
                            userId: user.id,
                            userName: user.name,
                            timestamp: new Date().toISOString(),
                          }

                          // ตรวจสอบว่ามีข้อมูลนี้อยู่แล้วหรือไม่
                          const existingIndex = photo.likesList.findIndex((like) => like.userId === user.id)
                          if (existingIndex === -1) {
                            setPhoto((prev) => {
                              if (!prev) return prev
                              return {
                                ...prev,
                                likesList: [...prev.likesList, newLike],
                              }
                            })
                          }
                        } else if (!liked && user) {
                          setPhoto((prev) => {
                            if (!prev) return prev
                            return {
                              ...prev,
                              likesList: prev.likesList.filter((like) => like.userId !== user.id),
                            }
                          })
                        }
                      }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    {photo.likesList.length > 0 ? (
                      <div className="space-y-1 max-w-[200px] max-h-[150px] overflow-y-auto">
                        <p className="font-semibold">ผู้ที่กดถูกใจ:</p>
                        <ul className="text-sm">
                          {photo.likesList.map((like) => (
                            <li key={like.userId} className="flex items-center gap-1">
                              <UserPlus className="h-3 w-3" />
                              <span>{like.userName}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <p>ยังไม่มีผู้กดถูกใจ</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button variant="outline" size="sm">
                <MessageSquare className="h-4 w-4 mr-2" />
                {photo.comments.length}
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                แชร์
              </Button>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Flag className="h-4 w-4 mr-2" />
                  รายงาน
                </DropdownMenuItem>
                {user?.id === photo.user.id && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault()
                        handleDeletePhoto()
                      }}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      ลบรูปภาพ
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-bold">{photo.title}</h1>
              <div className="flex items-center gap-2 text-muted-foreground mt-1">
                <MapPin className="h-4 w-4" />
                <span>{photo.location}</span>
              </div>
            </div>

            <p className="text-muted-foreground">{photo.description}</p>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formatDistanceToNow(photo.createdAt, { addSuffix: true, locale: th })}</span>
            </div>
          </div>

          <Separator />

          <div className="space-y-6">
            <h2 className="text-xl font-semibold">ความคิดเห็น ({photo.comments.length})</h2>

            <form onSubmit={handleCommentSubmit} className="space-y-4">
              <Textarea
                placeholder={user ? "แสดงความคิดเห็นของคุณ..." : "กรุณาเข้าสู่ระบบเพื่อแสดงความคิดเห็น"}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={!user || isSubmitting}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={!user || isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      กำลังส่ง...
                    </>
                  ) : (
                    "ส่งความคิดเห็น"
                  )}
                </Button>
              </div>
            </form>

            {!user && (
              <div className="bg-muted p-4 rounded-lg text-center">
                <p className="text-muted-foreground mb-2">คุณต้องเข้าสู่ระบบก่อนจึงจะสามารถแสดงความคิดเห็นได้</p>
                <div className="flex justify-center gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href="/auth/login">เข้าสู่ระบบ</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href="/auth/register">สมัครสมาชิก</Link>
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {photo.comments.length > 0 ? (
                photo.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={comment.user.image || "/placeholder.svg"} alt={comment.user.name} />
                      <AvatarFallback>{comment.user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{comment.user.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(comment.createdAt, { addSuffix: true, locale: th })}
                        </span>
                      </div>
                      <p className="text-muted-foreground">{comment.text}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">ยังไม่มีความคิดเห็น เป็นคนแรกที่แสดงความคิดเห็น</p>
              )}
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-4 mb-4">
              <Link href={`/profile/${photo.user.id}`}>
                <Avatar className="cursor-pointer">
                  <AvatarImage src={photo.user.image || "/placeholder.svg"} alt={photo.user.name} />
                  <AvatarFallback>{photo.user.name.charAt(0)}</AvatarFallback>
                </Avatar>
              </Link>
              <div>
                <Link href={`/profile/${photo.user.id}`} className="hover:underline">
                  <h3 className="font-medium">{photo.user.name}</h3>
                </Link>
                <p className="text-sm text-muted-foreground">ผู้โพสต์</p>
              </div>
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link href={`/profile/${photo.user.id}`}>ดูโปรไฟล์</Link>
            </Button>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium mb-4">ผู้ที่กดถูกใจ ({photo.likes})</h3>
            {photo.likesList.length > 0 ? (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {photo.likesList.slice(0, 10).map((like) => (
                  <div key={like.userId} className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback>{like.userName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <Link href={`/profile/${like.userId}`} className="text-sm hover:underline">
                      {like.userName}
                    </Link>
                  </div>
                ))}
                {photo.likesList.length > 10 && (
                  <p className="text-sm text-muted-foreground text-center">และอีก {photo.likesList.length - 10} คน</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">ยังไม่มีผู้กดถูกใจ</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
