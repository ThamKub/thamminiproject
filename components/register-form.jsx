"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { signIn } from "next-auth/react"

// ลบการ import Facebook และ Github icons

const formSchema = z
  .object({
    name: z.string().min(6, {
      message: "ชื่อต้องมีอย่างน้อย 6 ตัวอักษร",
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

export function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

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

    try {
      // In a real app, this would be an API call to register the user
      // const response = await fetch('/api/auth/register', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     name: values.name,
      //     email: values.email,
      //     password: values.password,
      //   }),
      // })

      // For demo purposes, we'll simulate a successful registration
      setTimeout(async () => {
        toast({
          title: "สมัครสมาชิกสำเร็จ",
          description: "กำลังเข้าสู่ระบบอัตโนมัติ",
        })

        // Auto sign in after registration
        await signIn("credentials", {
          email: values.email,
          password: values.password,
          redirect: false,
        })

        router.push("/")
        router.refresh()
        setIsLoading(false)
      }, 1500)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถสมัครสมาชิกได้ กรุณาลองใหม่อีกครั้ง",
      })
      setIsLoading(false)
    }
  }

  return (
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
            {isLoading ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
          </Button>
        </form>
      </Form>

      {/* ลบส่วนของการสมัครสมาชิกด้วย Facebook และ GitHub ออกทั้งหมด */}
    </div>
  )
}
