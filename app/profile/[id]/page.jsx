"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Loader2, MessageSquare, Edit } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function UserProfilePage({ params }) {
  const [profile, setProfile] = useState(null)
  const [photos, setPhotos] = useState([])
  const [likedPhotos, setLikedPhotos] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const { toast } = useToast()

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

  // ดึงข้อมูลโปรไฟล์และรูปภาพของผู้ใช้
  useEffect(() => {
    // ถ้าไม่ได้เข้าสู่ระบบ ไม่ต้องดึงข้อมูล
    if (!currentUser) {
      setIsLoading(false)
      return
    }

    const fetchUserProfile = async () => {
      setIsLoading(true)
      try {
        // ตรวจสอบว่าเป็นโปรไฟล์ของผู้ใช้ปัจจุบันหรือไม่
        if (params.id === currentUser.id) {
          setProfile(currentUser)
        } else {
          // ดึงข้อมูลผู้ใช้จาก localStorage
          const registeredUsers = localStorage.getItem("registeredUsers")
          if (registeredUsers) {
            const users = JSON.parse(registeredUsers)
            const user = users.find((u) => u.id === params.id)
            if (user) {
              setProfile({
                id: user.id,
                name: user.name,
                email: user.email,
                avatar_url: user.avatar_url,
                bio: user.bio,
              })
            }
          }

          // ถ้าไม่พบผู้ใช้ใน registeredUsers ให้ตรวจสอบใน photos
          if (!profile) {
            const photosData = localStorage.getItem("photos")
            if (photosData) {
              const allPhotos = JSON.parse(photosData)
              // หาข้อมูลผู้ใช้จากรูปภาพแรกที่พบ
              const photoByUser = allPhotos.find((photo) => photo.user_id === params.id)
              if (photoByUser && photoByUser.user) {
                setProfile({
                  id: photoByUser.user_id,
                  name: photoByUser.user.name || "ผู้ใช้งาน",
                  avatar_url: photoByUser.user.avatar_url || `/placeholder.svg?height=40&width=40`,
                })
              }
            }
          }
        }

        // ดึงรายการรูปภาพที่ถูกลบ
        const deletedPhotosData = localStorage.getItem("deletedPhotos") || "[]"
        const deletedPhotos = JSON.parse(deletedPhotosData)

        // ดึงรูปภาพของผู้ใช้จาก localStorage
        const photosData = localStorage.getItem("photos")
        if (photosData) {
          const allPhotos = JSON.parse(photosData)
          // กรองเฉพาะรูปภาพของผู้ใช้ที่ต้องการและไม่อยู่ในรายการที่ถูกลบ
          const userPhotos = allPhotos.filter(
            (photo) => photo.user_id === params.id && !deletedPhotos.includes(photo.id),
          )
          setPhotos(userPhotos)
        }

        // ดึงรูปภาพที่ผู้ใช้ถูกใจ
        const likedPhotosKey = `likedPhotos_${params.id}`
        const likedPhotoIds = JSON.parse(localStorage.getItem(likedPhotosKey) || "[]")

        if (likedPhotoIds.length > 0 && photosData) {
          const allPhotos = JSON.parse(photosData)
          // กรองเฉพาะรูปภาพที่ผู้ใช้ถูกใจและไม่อยู่ในรายการที่ถูกลบ
          const userLikedPhotos = allPhotos.filter(
            (photo) => likedPhotoIds.includes(photo.id) && !deletedPhotos.includes(photo.id),
          )
          setLikedPhotos(userLikedPhotos)
        }
      } catch (error) {
        console.error("Error fetching user profile:", error)
        toast({
          variant: "destructive",
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถดึงข้อมูลโปรไฟล์ได้ กรุณาลองใหม่อีกครั้ง",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserProfile()

    // เพิ่ม event listener สำหรับการเปลี่ยนแปลงของ localStorage
    const handleStorageChange = () => {
      fetchUserProfile()
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("focus", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("focus", handleStorageChange)
    }
  }, [params.id, toast, currentUser, profile])

  // ถ้าไม่ได้เข้าสู่ระบบ ให้แสดงข้อความแจ้งเตือน
  if (!currentUser) {
    return (
      <div className="container mx-auto py-10">
        <div className="max-w-md mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>ไม่สามารถเข้าถึงได้</AlertTitle>
            <AlertDescription>คุณต้องเข้าสู่ระบบก่อนจึงจะสามารถดูโปรไฟล์ของผู้ใช้อื่นได้</AlertDescription>
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

  if (!profile) {
    return (
      <div className="container mx-auto py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">ไม่พบผู้ใช้งาน</h1>
        <p className="text-muted-foreground mb-6">ผู้ใช้งานที่คุณกำลังค้นหาอาจไม่มีอยู่ในระบบ</p>
        <Button asChild>
          <Link href="/explore">กลับไปยังหน้าสำรวจ</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8 mb-8">
          <div className="flex flex-col items-center md:items-start">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarImage src={profile.avatar_url || "/placeholder.svg?height=96&width=96"} alt={profile.name} />
              <AvatarFallback className="text-2xl">{profile.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <Button variant="outline" size="sm" className="mb-4" asChild>
              <Link href="/profile/edit" className="flex items-center">
                <Edit className="h-4 w-4 mr-2" />
                แก้ไขโปรไฟล์
              </Link>
            </Button>
          </div>

          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold mb-2">{profile.name}</h1>
            {profile.email && <p className="text-muted-foreground mb-4">{profile.email}</p>}
            {profile.bio && <p className="mb-4">{profile.bio}</p>}

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

        <Tabs defaultValue="photos">
          <TabsList className="mb-6">
            <TabsTrigger value="photos">รูปภาพทั้งหมด</TabsTrigger>
            <TabsTrigger value="liked">รูปภาพที่ถูกใจ</TabsTrigger>
          </TabsList>

          <TabsContent value="photos">
            {photos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {photos.map((photo) => (
                  <Card key={photo.id} className="overflow-hidden">
                    <Link href={`/photos/${photo.id}`} className="block">
                      <div className="relative aspect-[4/3]">
                        <Image
                          src={photo.image_url || "/placeholder.svg"}
                          alt={photo.title}
                          fill
                          className="object-cover transition-transform hover:scale-105"
                        />
                      </div>
                    </Link>
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
                <p className="text-muted-foreground">ผู้ใช้งานนี้ยังไม่มีรูปภาพที่อัปโหลด</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="liked">
            {likedPhotos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {likedPhotos.map((photo) => (
                  <Card key={photo.id} className="overflow-hidden">
                    <Link href={`/photos/${photo.id}`} className="block">
                      <div className="relative aspect-[4/3]">
                        <Image
                          src={photo.image_url || "/placeholder.svg"}
                          alt={photo.title}
                          fill
                          className="object-cover transition-transform hover:scale-105"
                        />
                      </div>
                    </Link>
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
                <p className="text-muted-foreground">ผู้ใช้งานนี้ยังไม่มีรูปภาพที่ถูกใจ</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
