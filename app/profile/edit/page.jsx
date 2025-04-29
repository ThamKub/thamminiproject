"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Upload, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase-client"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร",
  }),
  bio: z.string().optional(),
  avatar: z.instanceof(File).optional(),
})

export default function EditProfilePage() {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [preview, setPreview] = useState(null)
  const router = useRouter()
  const { toast } = useToast()

  // ดึงข้อมูลผู้ใช้จาก localStorage
  useEffect(() => {
    setIsLoadingUser(true)
    const userData = localStorage.getItem("user")
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)

        // ตั้งค่า preview รูปโปรไฟล์
        if (parsedUser.avatar_url) {
          setPreview(parsedUser.avatar_url)
        }
      } catch (error) {
        console.error("Failed to parse user data:", error)
      }
    }
    setIsLoadingUser(false)
  }, [])

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      bio: "",
    },
  })

  // อัปเดตค่าเริ่มต้นของฟอร์มเมื่อโหลดข้อมูลผู้ใช้
  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name,
        bio: user.bio || "",
      })
    }
  }, [user, form])

  function handleAvatarChange(e) {
    const file = e.target.files?.[0]

    if (file) {
      form.setValue("avatar", file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  async function onSubmit(values) {
    if (!user) return

    setIsLoading(true)

    try {
      // สร้าง FormData สำหรับส่งไฟล์
      const formData = new FormData()
      formData.append("name", values.name)
      formData.append("bio", values.bio || "")
      formData.append("userId", user.id)

      if (values.avatar) {
        formData.append("avatar", values.avatar)
      }

      // ส่งข้อมูลไปยัง API
      const response = await fetch("/api/users/update", {
        method: "POST",
        body: formData,
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || "ไม่สามารถอัปเดตโปรไฟล์ได้")
      }

      // อัปเดตข้อมูลผู้ใช้ใน localStorage
      const userData = localStorage.getItem("user")
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData)
          const newUserData = {
            ...parsedUser,
            name: values.name,
            bio: values.bio, // เก็บ bio ใน localStorage แม้จะไม่มีในฐานข้อมูล
            avatar_url: responseData.avatar_url || parsedUser.avatar_url,
          }
          localStorage.setItem("user", JSON.stringify(newUserData))

          // อัปเดตข้อมูลผู้ใช้ใน Supabase Auth ถ้ามี
          if (supabase) {
            try {
              // อัปเดตข้อมูลใน user_metadata
              await supabase.auth.updateUser({
                data: {
                  name: values.name,
                  avatar_url: responseData.avatar_url || parsedUser.avatar_url,
                },
              })
            } catch (authError) {
              console.error("Error updating auth user metadata:", authError)
              // ไม่ต้อง throw error เพราะเราได้อัปเดตข้อมูลในฐานข้อมูลแล้ว
            }
          }

          // ทำให้เกิด storage event เพื่อให้หน้าอื่นรับรู้การเปลี่ยนแปลง
          window.dispatchEvent(new Event("storage"))
        } catch (error) {
          console.error("Error updating user data in localStorage:", error)
        }
      }

      toast({
        title: "อัปเดตโปรไฟล์สำเร็จ",
        description: "ข้อมูลโปรไฟล์ของคุณถูกอัปเดตเรียบร้อยแล้ว",
      })

      router.push("/profile")
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        variant: "destructive",
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถอัปเดตโปรไฟล์ได้ กรุณาลองใหม่อีกครั้ง",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // แสดงหน้าโหลดขณะกำลังดึงข้อมูลผู้ใช้
  if (isLoadingUser) {
    return (
      <div className="container mx-auto py-10 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    )
  }

  // ถ้าไม่ได้เข้าสู่ระบบ ให้แสดงข้อความแจ้งเตือน
  if (!user) {
    return (
      <div className="container mx-auto py-10">
        <div className="max-w-md mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>ไม่สามารถเข้าถึงได้</AlertTitle>
            <AlertDescription>คุณต้องเข้าสู่ระบบก่อนจึงจะสามารถแก้ไขโปรไฟล์ได้</AlertDescription>
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
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">แก้ไขโปรไฟล์</CardTitle>
            <CardDescription>แก้ไขข้อมูลส่วนตัวและรูปโปรไฟล์ของคุณ</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="flex flex-col items-center mb-6">
                  <div className="relative mb-4">
                    <Avatar className="h-32 w-32">
                      <AvatarImage
                        src={preview || user.avatar_url || "/placeholder.svg?height=128&width=128"}
                        alt={user.name}
                      />
                      <AvatarFallback className="text-4xl">{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="absolute bottom-0 right-0 rounded-full bg-background"
                      onClick={() => document.getElementById("avatar-upload")?.click()}
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                    <Input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">คลิกที่ไอคอนเพื่ออัปโหลดรูปโปรไฟล์ใหม่</p>
                </div>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ชื่อผู้ใช้งาน</FormLabel>
                      <FormControl>
                        <Input placeholder="ชื่อของคุณ" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ประวัติโดยย่อ</FormLabel>
                      <FormControl>
                        <Textarea placeholder="เล่าเกี่ยวกับตัวคุณสั้นๆ..." className="min-h-[100px]" {...field} />
                      </FormControl>
                      <FormDescription>ข้อมูลนี้จะแสดงในหน้าโปรไฟล์ของคุณ (เก็บเฉพาะในเบราว์เซอร์)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-4">
                  <Button type="button" variant="outline" onClick={() => router.back()}>
                    ยกเลิก
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        กำลังบันทึก...
                      </>
                    ) : (
                      "บันทึกการเปลี่ยนแปลง"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
