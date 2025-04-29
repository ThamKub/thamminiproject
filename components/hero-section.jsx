import Link from "next/link"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section className="relative py-20 md:py-28 lg:py-36 overflow-hidden">
      {/* เพิ่มความเข้มของภาพพื้นหลังและปรับ gradient เพื่อให้ข้อความชัดเจนขึ้น */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-black/70 z-10" />

      <div
        className="absolute inset-0 bg-cover bg-center z-0 opacity-80"
        style={{
          backgroundImage:
            "url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-OI73Dw28N2ecqWXPUFzHTSa8HYRDCf.png')",
          backgroundPosition: "center",
        }}
      />

      <div className="minimal-container relative z-20 flex flex-col items-start text-left max-w-4xl">
        <div className="bg-black/60 p-6 md:p-8 rounded-lg backdrop-blur-sm">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-white">
            ค้นพบความงดงาม
            <br />
            ของประเทศไทย
          </h1>
          <p className="text-lg md:text-xl text-white max-w-2xl mb-10">
            แบ่งปันภาพถ่ายสถานที่ท่องเที่ยวทั่วประเทศไทย และค้นพบจุดหมายปลายทางใหม่ๆ ที่น่าตื่นตาตื่นใจ
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 px-8 py-6">
              <Link href="/explore">สำรวจสถานที่ท่องเที่ยว</Link>
            </Button>
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 text-primary px-8 py-6">
              <Link href="/upload">แบ่งปันภาพถ่าย</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
