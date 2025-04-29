"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Loader2, MessageSquare, Trash2, AlertCircle, Edit } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function ProfilePage() {
  const [user, setUser] = useState(null)
  const [photos, setPhotos] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(null)
  const router = useRouter()
  const { toast } = useToast()

  const [likedPhotos, setLikedPhotos] = useState([])
  const [isLoadingLiked, setIsLoadingLiked] = useState(false)
  const [activeTab, setActiveTab] = useState("photos")

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

  // ดึงรูปภาพที่ผู้ใช้อัปโหลด
  useEffect(() => {
    if (!user) return

    const fetchUserPhotos = async () => {
      setIsLoading(true)
      try {
        // ดึงข้อมูลจาก localStorage
        const photosData = localStorage.getItem("photos")
        if (photosData) {
          try {
            const allPhotos = JSON.parse(photosData)

            // ดึงรายการรูปภาพที่ถูกลบ
            const deletedPhotosData = localStorage.getItem("deletedPhotos") || "[]"
            const deletedPhotos = JSON.parse(deletedPhotosData)

            // กรองเฉพาะรูปภาพของผู้ใช้ปัจจุบันและไม่อยู่ในรายการที่ถูกลบ
            const userPhotos = allPhotos.filter(
              (photo) => photo.user_id === user.id && !deletedPhotos.includes(photo.id),
            )

            setPhotos(userPhotos)
          } catch (error) {
            console.error("Error parsing photos from localStorage:", error)
            setPhotos([])
          }
        } else {
          setPhotos([])
        }
      } catch (error) {
        console.error("Error fetching user photos:", error)
        setPhotos([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserPhotos()

    // เพิ่ม event listener สำหรับการเปลี่ยนแปลงของ localStorage
    const handleStorageChange = () => {
      fetchUserPhotos()
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("focus", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("focus", handleStorageChange)
    }
  }, [user])

  // ฟังก์ชันสำหรับลบรูปภาพ
  const handleDeletePhoto = async (photoId) => {
    if (!user) return

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
        // ลบออกจากรายการไลค์ของผู้ใช้ทุกคน
        const registeredUsersData = localStorage.getItem("registeredUsers")
        if (registeredUsersData) {
          const registeredUsers = JSON.parse(registeredUsersData)

          // วนลูปผ่านผู้ใช้ทุกคนเพื่อลบรูปภาพออกจากรายการไลค์
          registeredUsers.forEach((registeredUser) => {
            const likedPhotosKey = `likedPhotos_${registeredUser.id}`
            const likedPhotosData = localStorage.getItem(likedPhotosKey)
            if (likedPhotosData) {
              const likedPhotos = JSON.parse(likedPhotosData)
              const updatedLikedPhotos = likedPhotos.filter((id) => id !== photoId)
              localStorage.setItem(likedPhotosKey, JSON.stringify(updatedLikedPhotos))
            }
          })
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
      const fetchUserPhotos = async () => {
        try {
          const photosData = localStorage.getItem("photos")
          if (photosData) {
            const allPhotos = JSON.parse(photosData)
            const userPhotos = allPhotos.filter((photo) => photo.user_id === user.id)
            setPhotos(userPhotos)
          }
        } catch (fetchError) {
          console.error("Error fetching user photos:", fetchError)
        }
      }

      fetchUserPhotos()

      toast({
        variant: "destructive",
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถลบรูปภาพได้ กรุณาลองใหม่อีกครั้ง",
      })
    } finally {
      setIsDeleting(null)
    }
  }

  // ดึงรูปภาพที่ถูกใจของผู้ใช้
  const fetchLikedPhotos = async () => {
    if (!user) return

    setIsLoadingLiked(true)
    try {
      // ดึงรายการ ID ของรูปภาพที่ถูกใจ
      const likedPhotosKey = `likedPhotos_${user.id}`
      const likedPhotoIds = JSON.parse(localStorage.getItem(likedPhotosKey) || "[]")

      if (likedPhotoIds.length === 0) {
        setLikedPhotos([])
        setIsLoadingLiked(false)
        return
      }

      // ดึงข้อมูลรูปภาพจาก localStorage
      const photosData = localStorage.getItem("photos")
      if (photosData) {
        try {
          const allPhotos = JSON.parse(photosData)

          // ดึงรายการรูปภาพที่ถูกลบ
          const deletedPhotosData = localStorage.getItem("deletedPhotos") || "[]"
          const deletedPhotos = JSON.parse(deletedPhotosData)

          // กรองเฉพาะรูปภาพที่ถูกใจและไม่อยู่ในรายการที่ถูกลบ
          const userLikedPhotos = allPhotos.filter(
            (photo) => likedPhotoIds.includes(photo.id) && !deletedPhotos.includes(photo.id),
          )

          setLikedPhotos(userLikedPhotos)
        } catch (error) {
          console.error("Error parsing photos from localStorage:", error)
          setLikedPhotos([])
        }
      } else {
        setLikedPhotos([])
      }
    } catch (error) {
      console.error("Error fetching liked photos:", error)
      setLikedPhotos([])
    } finally {
      setIsLoadingLiked(false)
    }
  }

  // เรียกใช้ fetchLikedPhotos เมื่อคอมโพเนนต์โหลดหรือเมื่อผู้ใช้เปลี่ยน
  useEffect(() => {
    if (user) {
      fetchLikedPhotos()

      // เพิ่ม event listener สำหรับการเปลี่ยนแปลงของ localStorage
      const handleStorageChange = () => {
        fetchLikedPhotos()
      }

      window.addEventListener("storage", handleStorageChange)
      window.addEventListener("focus", handleStorageChange)

      return () => {
        window.removeEventListener("storage", handleStorageChange)
        window.removeEventListener("focus", handleStorageChange)
      }
    }
  }, [user])

  // ถ้าไม่ได้เข้าสู่ระบบ ให้แสดงข้อความแจ้งเตือน
  if (!user) {
    return (
      <div className="container mx-auto py-10">
        <div className="max-w-md mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>ไม่สามารถเข้าถึงได้</AlertTitle>
            <AlertDescription>คุณต้องเข้าสู่ระบบก่อนจึงจะสามารถดูโปรไฟล์ได้</AlertDescription>
          </Alert>
          <div className="flex justify-center mt-6 gap-4">
            <Button asChild variant="outline">
              <Link href="/auth/login">เข้าสู่ระบบ</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/register">สมัครสมาชิก</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8 mb-8">
          <div className="flex flex-col items-center md:items-start">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarImage src={user.avatar_url || "/placeholder.svg?height=96&width=96"} alt={user.name} />
              <AvatarFallback className="text-2xl">{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <Button variant="outline" size="sm" className="mb-4" asChild>
              <Link href="/profile/edit" className="flex items-center">
                <Edit className="h-4 w-4 mr-2" />
                แก้ไขโปรไฟล์
              </Link>
            </Button>
          </div>

          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold mb-2">{user.name}</h1>
            <p className="text-muted-foreground mb-4">{user.email}</p>
            {user.bio && <p className="mb-4">{user.bio}</p>}

            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <div className="text-center">
                <p className="text-2xl font-bold">{photos.length}</p>
                <p className="text-sm text-muted-foreground">รูปภาพ</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {photos.reduce((sum, photo) => {
                    if (Array.isArray(photo.comments)) {
                      return sum + photo.comments.length
                    } else if (photo.comments && typeof photo.comments === "object") {
                      return sum + 1
                    } else {
                      return sum
                    }
                  }, 0)}
                </p>
                <p className="text-sm text-muted-foreground">ความคิดเห็น</p>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        <Tabs defaultValue="photos" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="photos">รูปภาพของฉัน</TabsTrigger>
            <TabsTrigger value="liked">รูปภาพที่ถูกใจ</TabsTrigger>
          </TabsList>

          <TabsContent value="photos">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : photos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {photos.map((photo) => (
                  <Card key={photo.id} className="overflow-hidden">
                    <div className="relative aspect-[4/3] group">
                      <Link href={`/photos/${photo.id}`}>
                        <Image
                          src={photo.image_url || "/placeholder.svg"}
                          alt={photo.title}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      </Link>
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button asChild variant="ghost" size="icon" className="text-white">
                          <Link href={`/photos/${photo.id}`}>
                            <Edit className="h-5 w-5" />
                          </Link>
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-white">
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>ยืนยันการลบรูปภาพ</AlertDialogTitle>
                              <AlertDialogDescription>
                                คุณแน่ใจหรือไม่ว่าต้องการลบรูปภาพนี้? การกระทำนี้ไม่สามารถย้อนกลับได้
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeletePhoto(photo.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {isDeleting === photo.id ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    กำลังลบ...
                                  </>
                                ) : (
                                  "ลบรูปภาพ"
                                )}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    <CardHeader className="p-4">
                      <CardTitle className="text-lg">{photo.title}</CardTitle>
                      <CardDescription>{photo.location}</CardDescription>
                    </CardHeader>
                    <CardFooter className="p-4 pt-0 flex justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          {Array.isArray(photo.comments) ? photo.comments.length : 0}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/photos/${photo.id}`}>ดูรายละเอียด</Link>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบรูปภาพนี้?")) {
                              handleDeletePhoto(photo.id)
                            }
                          }}
                          disabled={isDeleting === photo.id}
                        >
                          {isDeleting === photo.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">คุณยังไม่มีรูปภาพที่อัปโหลด</p>
                <Button asChild>
                  <Link href="/upload">อัปโหลดรูปภาพแรกของคุณ</Link>
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="liked">
            {isLoadingLiked ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : likedPhotos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {likedPhotos.map((photo) => (
                  <Card key={photo.id} className="overflow-hidden">
                    <div className="relative aspect-[4/3] group">
                      <Link href={`/photos/${photo.id}`}>
                        <Image
                          src={photo.image_url || "/placeholder.svg"}
                          alt={photo.title}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      </Link>
                    </div>
                    <CardHeader className="p-4">
                      <CardTitle className="text-lg">{photo.title}</CardTitle>
                      <CardDescription>{photo.location}</CardDescription>
                    </CardHeader>
                    <CardFooter className="p-4 pt-0 flex justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          {Array.isArray(photo.comments) ? photo.comments.length : 0}
                        </span>
                      </div>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/photos/${photo.id}`}>ดูรายละเอียด</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">คุณยังไม่มีรูปภาพที่ถูกใจ</p>
                <Button asChild>
                  <Link href="/explore">สำรวจรูปภาพ</Link>
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
