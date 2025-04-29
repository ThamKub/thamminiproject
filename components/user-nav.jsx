"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, LogOut, Upload } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase-client"

// ลบ interface UserData ออกเพราะเป็น TypeScript syntax

export function UserNav() {
  // แก้ไข useState ให้เป็นแบบ JavaScript ทั่วไป ไม่มี type annotation
  const [user, setUser] = useState(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // ดึงข้อมูลผู้ใช้จาก localStorage เมื่อคอมโพเนนต์โหลด
    const userData = localStorage.getItem("user")
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
      } catch (error) {
        console.error("Failed to parse user data:", error)
      }
    }

    // ปรับปรุงการตรวจสอบการเปลี่ยนแปลงของ localStorage
    // เพิ่ม event listener สำหรับการเปลี่ยนแปลงของ localStorage
    const handleStorageChange = () => {
      const userData = localStorage.getItem("user")
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData)
          setUser(parsedUser)
        } catch (error) {
          console.error("Failed to parse user data:", error)
        }
      } else {
        setUser(null)
      }
    }

    window.addEventListener("storage", handleStorageChange)
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        handleStorageChange()
      }
    })

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      document.removeEventListener("visibilitychange", handleStorageChange)
    }
  }, [])

  const handleLogout = async () => {
    // ออกจากระบบด้วย Supabase Auth ถ้ามี
    if (supabase) {
      await supabase.auth.signOut()
    }

    // ลบข้อมูลผู้ใช้จาก localStorage
    localStorage.removeItem("user")
    setUser(null)

    toast({
      title: "ออกจากระบบสำเร็จ",
      description: "คุณได้ออกจากระบบแล้ว",
    })

    // แก้ไขฟังก์ชัน handleLogout ให้ทำการนำทางทันทีหลังจากออกจากระบบ
    // ลบ router.push และ router.refresh
    // ทำการนำทางทันที
    window.location.href = "/auth/login"
  }

  if (!user || !user.isLoggedIn) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/auth/login">
          <Button variant="ghost">เข้าสู่ระบบ</Button>
        </Link>
        <Link href="/auth/register">
          <Button>สมัครสมาชิก</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Link href="/upload">
        <Button variant="ghost" size="icon" className="hidden md:flex">
          <Upload className="h-5 w-5" />
          <span className="sr-only">อัพโหลดรูปภาพ</span>
        </Button>
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              {/* แก้ไขส่วนนี้เพื่อแสดงรูปโปรไฟล์ของผู้ใช้ */}
              <AvatarImage src={user.avatar_url || "/placeholder.svg?height=32&width=32"} alt={user.name} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-background border-border shadow-md">
          <div className="flex items-center justify-start gap-2 p-2">
            <div className="flex flex-col space-y-1 leading-none">
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/profile">
              <User className="mr-2 h-4 w-4" />
              <span>โปรไฟล์</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/upload">
              <Upload className="mr-2 h-4 w-4" />
              <span>อัพโหลดรูปภาพ</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>ออกจากระบบ</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
