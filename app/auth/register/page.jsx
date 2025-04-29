"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase-client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"

// สร้าง schema สำหรับตรวจสอบข้อมูล
const formSchema = z
  .object({
    name: z.string().min(2, {
      message: "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร",
    }),
    email: z.string().email({
      message: "กรุณากรอกอีเมลที่ถูกต้อง",
    }),
    password: z.string().min(6, {
      message: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร",
    }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "รหัสผ่านไม่ตรงกัน",
    path: ["confirmPassword"],
  })

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [registerError, setRegisterError] = useState(null)
  const router = useRouter()
  const { toast } = useToast()

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
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  async function onSubmit(values) {
    setIsLoading(true)
    setRegisterError(null)

    try {
      // ตรวจสอบว่าอีเมลซ้ำกับฐานข้อมูลหรือไม่
      const checkEmailResponse = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: values.email }),
      })

      const checkEmailData = await checkEmailResponse.json()

      if (checkEmailData.exists) {
        setRegisterError("อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น")
        setIsLoading(false)
        return
      }

      // ตรวจสอบว่ามีผู้ใช้นี้อยู่แล้วหรือไม่ใน localStorage
      const registeredUsers = localStorage.getItem("registeredUsers")
      const users = registeredUsers ? JSON.parse(registeredUsers) : []

      // ตรวจสอบว่าอีเมลซ้ำหรือไม่
      const existingUser = users.find((user) => user.email === values.email)
      if (existingUser) {
        setRegisterError("อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น")
        setIsLoading(false)
        return
      }

      // ถ้ามี Supabase client ให้ลองสมัครสมาชิกด้วย Supabase Auth ก่อน
      if (supabase) {
        try {
          // สมัครสมาชิกด้วย Supabase Auth
          const { data: authData, error: signUpError } = await supabase.auth.signUp({
            email: values.email,
            password: values.password,
            options: {
              data: {
                name: values.name,
              },
            },
          })

          if (signUpError) {
            console.error("Error signing up with Supabase:", signUpError)
            throw new Error(signUpError.message)
          }

          if (authData.user) {
            // เพิ่มข้อมูลผู้ใช้ลงในตาราง public.users
            try {
              const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  id: authData.user.id,
                  name: values.name,
                  email: values.email,
                  password: values.password,
                }),
              })

              if (!response.ok) {
                const errorData = await response.json()
                console.error("Error registering user in database:", errorData)
                // ไม่ต้อง throw error เพราะเราได้สร้างผู้ใช้ใน auth แล้ว
              }
            } catch (dbError) {
              console.error("Error calling register API:", dbError)
              // ไม่ต้อง throw error เพราะเราได้สร้างผู้ใช้ใน auth แล้ว
            }

            // เก็บข้อมูลผู้ใช้ปัจจุบันเพื่อจำลองการเข้าสู่ระบบ
            localStorage.setItem(
              "user",
              JSON.stringify({
                id: authData.user.id,
                name: values.name,
                email: values.email,
                isLoggedIn: true,
                avatar_url: `/placeholder.svg?height=40&width=40`,
                bio: "",
              }),
            )

            toast({
              title: "สมัครสมาชิกสำเร็จ",
              description: "ยินดีต้อนรับ " + values.name + " เข้าสู่ระบบ",
            })

            // ใช้ window.location แทน router.push เพื่อให้มีการโหลดหน้าใหม่
            window.location.href = "/"
            return
          }
        } catch (supabaseError) {
          console.error("Error with Supabase signup:", supabaseError)

          // ถ้าเป็นข้อผิดพลาดเกี่ยวกับอีเมลซ้ำ
          if (supabaseError.message && supabaseError.message.includes("email")) {
            setRegisterError("อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น")
            setIsLoading(false)
            return
          }

          // ถ้าเป็นข้อผิดพลาดอื่นๆ ให้ใช้ localStorage แทน
        }
      }

      // สร้างข้อมูลผู้ใช้ใหม่
      const newUser = {
        id: "user-" + Date.now(),
        name: values.name,
        email: values.email,
        password: values.password,
        avatar_url: `/placeholder.svg?height=128&width=128`,
        bio: "",
        createdAt: new Date().toISOString(),
      }

      // เพิ่มผู้ใช้ใหม่ลงในรายการ
      users.push(newUser)

      // บันทึกรายการผู้ใช้ลงใน localStorage
      localStorage.setItem("registeredUsers", JSON.stringify(users))

      // เก็บข้อมูลผู้ใช้ปัจจุบันเพื่อจำลองการเข้าสู่ระบบ
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          isLoggedIn: true,
          avatar_url: newUser.avatar_url,
          bio: newUser.bio,
        }),
      )

      toast({
        title: "สมัครสมาชิกสำเร็จ",
        description: "ยินดีต้อนรับ " + values.name + " เข้าสู่ระบบ",
      })

      // ใช้ window.location แทน router.push เพื่อให้มีการโหลดหน้าใหม่
      window.location.href = "/"
    } catch (error) {
      console.error("Registration error:", error)
      setRegisterError("ไม่สามารถสมัครสมาชิกได้ กรุณาลองใหม่อีกครั้ง")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">สมัครสมาชิก</h1>
          <p className="text-muted-foreground">สร้างบัญชีผู้ใช้งานเพื่อแบ่งปันรูปภาพและแสดงความคิดเห็น</p>
        </div>

        {registerError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>สมัครสมาชิกไม่สำเร็จ</AlertTitle>
            <AlertDescription>{registerError}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ยืนยันรหัสผ่าน</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังสมัครสมาชิก...
                  </>
                ) : (
                  "สมัครสมาชิก"
                )}
              </Button>
            </form>
          </Form>
        </div>

        <div className="text-center text-sm">
          <p className="text-muted-foreground">
            มีบัญชีผู้ใช้งานแล้ว?{" "}
            <Link href="/auth/login" className="text-primary hover:underline">
              เข้าสู่ระบบ
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
