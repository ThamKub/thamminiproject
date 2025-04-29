"use client"

import { useState, useEffect } from "react"

export function useMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // ตรวจสอบว่าเป็นอุปกรณ์มือถือหรือไม่
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // ตรวจสอบครั้งแรก
    checkMobile()

    // เพิ่ม event listener สำหรับการเปลี่ยนขนาดหน้าจอ
    window.addEventListener("resize", checkMobile)

    // ทำความสะอาด event listener เมื่อ component unmount
    return () => {
      window.removeEventListener("resize", checkMobile)
    }
  }, [])

  return isMobile
}
