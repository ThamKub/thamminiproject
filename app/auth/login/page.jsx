"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase-client"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"

// สร้าง schema สำหรับตรวจสอบข้อมูล
const formSchema = z.object({
  email: z.string().email({
    message: "กรุณากรอกอีเมลที่ถูกต้อง",
  }),
  password: z.string().min(1, {
    message: "กรุณากรอกรหัสผ่าน",
  }),
  rememberMe: z.boolean().optional(),
})

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isCreatingTestAccount, setIsCreatingTestAccount] = useState(false)
  const [loginError, setLoginError] = useState(null)
  const router = useRouter()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/"

  // เพิ่มหลังจากประกาศตัวแปร state
  useEffect(() => {
    // ตรวจสอบว่าผู้ใช้เข้าสู่ระบบแล้วหรือไม่
    const userData = localStorage.getItem("user")
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData)
        if (parsedUser.isLoggedIn) {
          // ถ้าเข้าสู่ระบบแล้ว ให้ redirect ไปยังหน้าแรก
          window.location.href = "/"
        }
      } catch (error) {
        console.error("Failed to parse user data:", error)
      }
    }
  }, [])

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  })

  async function onSubmit(values) {
    setIsLoading(true)
    setLoginError(null)

    try {
      // ลองดึงข้อมูลผู้ใช้จาก localStorage ก่อน
      const registeredUsers = localStorage.getItem("registeredUsers")
      const users = registeredUsers ? JSON.parse(registeredUsers) : []

      // ค้นหาผู้ใช้จากอีเมล
      const user = users.find((user) => user.email === values.email)

      if (user) {
        // ถ้าพบผู้ใช้ใน localStorage ให้ตรวจสอบรหัสผ่าน
        if (user.password === values.password) {
          // เข้าสู่ระบบสำเร็จ
          // เก็บข้อมูลผู้ใช้ใน localStorage เพื่อจำลองการเข้าสู่ระบบ
          localStorage.setItem(
            "user",
            JSON.stringify({
              id: user.id,
              name: user.name,
              email: user.email,
              isLoggedIn: true,
              avatar_url: user.avatar_url,
              bio: user.bio,
            }),
          )

          // ทำให้เกิด storage event เพื่อให้ components อื่นรับรู้การเปลี่ยนแปลง
          window.dispatchEvent(new Event("storage"))

          toast({
            title: "เข้าสู่ระบบสำเร็จ",
            description: "ยินดีต้อนรับกลับมา " + user.name,
          })

          // ใช้ window.location แทน router.push เพื่อให้มีการโหลดหน้าใหม่
          window.location.href = callbackUrl

          setIsLoading(false)
          return
        } else {
          setLoginError("รหัสผ่านไม่ถูกต้อง")
          setIsLoading(false)
          return
        }
      }

      // ถ้าไม่พบผู้ใช้ใน localStorage และมี Supabase client ให้ลองเข้าสู่ระบบด้วย Supabase Auth
      if (supabase) {
        try {
          // เข้าสู่ระบบด้วย Supabase Auth
          const { data, error } = await supabase.auth.signInWithPassword({
            email: values.email,
            password: values.password,
          })

          if (error) {
            console.error("Supabase login error:", error)

            // ถ้าไม่พบผู้ใช้ในระบบ ให้แสดงข้อความแนะนำให้สมัครสมาชิก
            if (error.message.includes("Invalid login credentials")) {
              setLoginError("อีเมลหรือรหัสผ่านไม่ถูกต้อง หรือคุณอาจยังไม่ได้สมัครสมาชิก")
            } else {
              setLoginError(error.message || "ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่อีกครั้ง")
            }

            setIsLoading(false)
            return
          }

          // ดึงข้อมูลผู้ใช้จากตาราง users
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("*")
            .eq("id", data.user.id)
            .maybeSingle() // เปลี่ยนจาก single() เป็น maybeSingle() เพื่อไม่ให้เกิด error เมื่อไม่พบข้อมูล

          if (userError) {
            console.error("Error fetching user data:", userError)
            // ถ้าไม่พบข้อมูลผู้ใช้ในตาราง users ให้ใช้ข้อมูลจาก auth
            localStorage.setItem(
              "user",
              JSON.stringify({
                id: data.user.id,
                name: data.user.email?.split("@")[0] || "ผู้ใช้งาน",
                email: data.user.email,
                isLoggedIn: true,
                avatar_url: `/placeholder.svg?height=40&width=40`,
              }),
            )
          } else {
            // ถ้าพบข้อมูลผู้ใช้ในตาราง users ให้ใช้ข้อมูลนั้น
            localStorage.setItem(
              "user",
              JSON.stringify({
                id: data.user.id,
                name: userData?.name || data.user.email?.split("@")[0] || "ผู้ใช้งาน",
                email: data.user.email,
                isLoggedIn: true,
                avatar_url: userData?.avatar_url || `/placeholder.svg?height=40&width=40`,
              }),
            )
          }

          // ทำให้เกิด storage event เพื่อให้ components อื่นรับรู้การเปลี่ยนแปลง
          window.dispatchEvent(new Event("storage"))

          toast({
            title: "เข้าสู่ระบบสำเร็จ",
            description: "ยินดีต้อนรับกลับมา",
          })

          // ใช้ window.location แทน router.push เพื่อให้มีการโหลดหน้าใหม่
          window.location.href = callbackUrl

          setIsLoading(false)
          return
        } catch (supabaseError) {
          console.error("Supabase login error:", supabaseError)
          // ถ้าเกิดข้อผิดพลาดกับ Supabase ให้ลองใช้บัญชีทดสอบแทน
        }
      }

      // ถ้าไม่พบผู้ใช้ทั้งใน localStorage และ Supabase ให้แสดงข้อความแนะนำให้สมัครสมาชิก
      setLoginError("ไม่พบบัญชีผู้ใช้นี้ในระบบ กรุณาสมัครสมาชิกก่อน หรือใช้บัญชีทดสอบ")
    } catch (error) {
      console.error("Login error:", error)
      setLoginError("เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง")
    } finally {
      setIsLoading(false)
    }
  }

  // ฟังก์ชันสำหรับสร้างบัญชีทดสอบและเข้าสู่ระบบ
  const loginWithTestAccount = async () => {
    setIsCreatingTestAccount(true)
    setLoginError(null)

    try {
      // สร้างบัญชีทดสอบใน localStorage
      const testUser = {
        id: "test-user-" + Date.now(),
        name: "ผู้ใช้ทดสอบ",
        email: "test@example.com",
        password: "password123",
        isLoggedIn: true,
        avatar_url: "/placeholder.svg?height=128&width=128",
        bio: "นี่คือบัญชีทดสอบสำหรับการใช้งานแอปพลิเคชัน",
        createdAt: new Date().toISOString(),
      }

      // เก็บข้อมูลผู้ใช้ใน localStorage
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: testUser.id,
          name: testUser.name,
          email: testUser.email,
          isLoggedIn: true,
          avatar_url: testUser.avatar_url,
          bio: testUser.bio,
        }),
      )

      // ทำให้เกิด storage event เพื่อให้ components อื่นรับรู้การเปลี่ยนแปลง
      window.dispatchEvent(new Event("storage"))

      toast({
        title: "เข้าสู่ระบบสำเร็จ",
        description: "ยินดีต้อนรับ ผู้ใช้ทดสอบ",
      })

      // ใช้ window.location แทน router.push เพื่อให้มีการโหลดหน้าใหม่
      window.location.href = callbackUrl

      // เก็บข้อมูลผู้ใช้ในรายการผู้ใช้ที่ลงทะเบียน (ถ้ายังไม่มี)
      const registeredUsers = localStorage.getItem("registeredUsers")
      const users = registeredUsers ? JSON.parse(registeredUsers) : []

      if (!users.find((user) => user.email === testUser.email)) {
        users.push(testUser)
        localStorage.setItem("registeredUsers", JSON.stringify(users))
      }

      toast({
        title: "เข้าสู่ระบบสำเร็จ",
        description: "ยินดีต้อนรับ ผู้ใช้ทดสอบ",
      })
    } catch (error) {
      console.error("Error creating test account:", error)
      setLoginError("เกิดข้อผิดพลาดในการสร้างบัญชีทดสอบ กรุณาลองใหม่อีกครั้ง")
    } finally {
      setIsCreatingTestAccount(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">เข้าสู่ระบบ</h1>
          <p className="text-muted-foreground">เข้าสู่ระบบเพื่อแบ่งปันภาพถ่ายและแสดงความคิดเห็น</p>
        </div>

        {loginError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>เข้าสู่ระบบไม่สำเร็จ</AlertTitle>
            <AlertDescription>{loginError}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>อีเมล</FormLabel>
                    <FormControl>
                      <Input placeholder="your.email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>รหัสผ่าน</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>จดจำฉัน</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังเข้าสู่ระบบ...
                  </>
                ) : (
                  "เข้าสู่ระบบ"
                )}
              </Button>
            </form>
          </Form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">หรือ</span>
            </div>
          </div>

          <Button variant="outline" className="w-full" onClick={loginWithTestAccount} disabled={isCreatingTestAccount}>
            {isCreatingTestAccount ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                กำลังสร้างบัญชีทดสอบ...
              </>
            ) : (
              "เข้าสู่ระบบด้วยบัญชีทดสอบ"
            )}
          </Button>
        </div>

        <div className="text-center text-sm">
          <p className="text-muted-foreground">
            ยังไม่มีบัญชีผู้ใช้งาน?{" "}
            <Link href="/auth/register" className="text-primary hover:underline">
              สมัครสมาชิก
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
