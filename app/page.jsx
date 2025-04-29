"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PhotoGrid } from "@/components/photo-grid"
import { HeroSection } from "@/components/hero-section"
import { FeaturedPlaces } from "@/components/featured-places"
import { useRouter } from "next/navigation"

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0)
  const router = useRouter()

  // เพิ่ม effect เพื่อตรวจสอบการเปลี่ยนแปลงของ localStorage
  useEffect(() => {
    // ฟังก์ชันสำหรับตรวจสอบการเปลี่ยนแปลงของ localStorage
    const handleStorageChange = () => {
      setRefreshKey((prev) => prev + 1)
    }

    // เพิ่ม event listener
    window.addEventListener("storage", handleStorageChange)

    // ตรวจสอบเมื่อกลับมาที่หน้านี้
    window.addEventListener("focus", handleStorageChange)

    // ทำความสะอาด event listener เมื่อ component unmount
    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("focus", handleStorageChange)
    }
  }, [])

  // เพิ่ม effect เพื่อตรวจสอบเมื่อโหลดหน้าแรก
  useEffect(() => {
    // ตรวจสอบว่ามีการอัปโหลดรูปภาพล่าสุดหรือไม่
    const lastUpload = localStorage.getItem("lastUpload")
    if (lastUpload) {
      // ลบข้อมูลการอัปโหลดล่าสุด
      localStorage.removeItem("lastUpload")

      // รีเฟรชข้อมูลทันที
      setRefreshKey((prev) => prev + 1)

      // และรีเฟรชอีกครั้งหลังจาก 1 วินาที เพื่อให้แน่ใจว่าข้อมูลถูกโหลดเรียบร้อยแล้ว
      setTimeout(() => {
        setRefreshKey((prev) => prev + 1)
      }, 1000)
    }
  }, [])

  // เพิ่ม useEffect เพื่อดึงข้อมูลรูปภาพจาก Supabase เมื่อโหลดหน้าแรก
  useEffect(() => {
    const fetchPhotosFromSupabase = async () => {
      try {
        // ดึงข้อมูลรูปภาพจาก API
        const response = await fetch("/api/photos?limit=50", { cache: "no-store" })

        if (response.ok) {
          const data = await response.json()

          // ถ้ามีข้อมูลรูปภาพ ให้บันทึกลงใน localStorage
          if (data && data.length > 0) {
            // ดึงข้อมูลรูปภาพเดิมจาก localStorage (ถ้ามี)
            const existingPhotosData = localStorage.getItem("photos")
            let existingPhotos = []

            if (existingPhotosData) {
              try {
                existingPhotos = JSON.parse(existingPhotosData)
              } catch (error) {
                console.error("Error parsing existing photos:", error)
              }
            }

            // รวมข้อมูลรูปภาพใหม่กับข้อมูลรูปภาพเดิม โดยไม่ซ้ำกัน
            const existingPhotoIds = new Set(existingPhotos.map((photo) => photo.id))
            const newPhotos = data.filter((photo) => !existingPhotoIds.has(photo.id))

            if (newPhotos.length > 0) {
              const updatedPhotos = [...newPhotos, ...existingPhotos]
              localStorage.setItem("photos", JSON.stringify(updatedPhotos))

              // ทำให้เกิด storage event เพื่อให้หน้าอื่นรับรู้การเปลี่ยนแปลง
              window.dispatchEvent(new Event("storage"))

              // รีเฟรชข้อมูล
              setRefreshKey((prev) => prev + 1)
            }
          }
        }
      } catch (error) {
        console.error("Error fetching photos from Supabase:", error)
      }
    }

    // เรียกใช้ฟังก์ชันเมื่อโหลดหน้าแรก
    fetchPhotosFromSupabase()
  }, [])

  return (
    <main className="flex min-h-screen flex-col">
      <HeroSection />

      {/* สถานที่ท่องเที่ยวยอดนิยม */}
      <section className="minimal-container py-24 featured-places-section">
        <div className="mb-16">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end">
            <div>
              <h2 className="text-4xl font-medium mb-3">สถานที่ท่องเที่ยวยอดนิยม</h2>
              <p className="text-muted-foreground max-w-2xl">แนะนำสถานที่ท่องเที่ยวยอดนิยมทั่วประเทศไทยที่คุณไม่ควรพลาด</p>
            </div>
            <Link href="/explore" className="mt-4 md:mt-0">
              <Button
                variant="outline"
                className="border-primary text-primary hover:bg-primary hover:text-white transition-colors"
              >
                ดูทั้งหมด
              </Button>
            </Link>
          </div>

          <div className="h-1 w-20 bg-primary mt-6"></div>
        </div>

        <FeaturedPlaces />
      </section>

      <section className="minimal-container py-20 bg-secondary">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h2 className="text-3xl font-medium mb-3">รูปภาพจากผู้ใช้งาน</h2>
            <p className="text-muted-foreground">ภาพถ่ายสวยๆ จากผู้ใช้งานทั่วประเทศ</p>
          </div>
          <Link href="/explore">
            <Button variant="outline" className="minimal-button">
              ดูทั้งหมด
            </Button>
          </Link>
        </div>
        <PhotoGrid random={true} limit={4} refreshKey={refreshKey} />
      </section>

      <section className="minimal-container py-20">
        <h2 className="text-3xl font-medium mb-12">ภาพล่าสุด</h2>
        <PhotoGrid limit={12} refreshKey={refreshKey} />
      </section>
    </main>
  )
}
