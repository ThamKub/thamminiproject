"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { MapPin, ArrowRight } from "lucide-react"

// ข้อมูลสถานที่ท่องเที่ยวจากรูปภาพที่ผู้ใช้ส่งมา
const customPlaces = [
  {
    id: "custom-1",
    title: "น้ำตกทีลอซู",
    location: "อุทยานแห่งชาติอุ้มผาง",
    province: "ตาก",
    description:
      "น้ำตกทีลอซูเป็นน้ำตกที่ได้ชื่อว่าใหญ่และสวยที่สุดในประเทศไทย ตั้งอยู่ในเขตรักษาพันธุ์สัตว์ป่าอุ้มผาง จังหวัดตาก ความสวยงามของน้ำตกทีลอซูอยู่ที่ความใหญ่โตกว้างขวางถึง 500 เมตร และสูงประมาณ 300 เมตร ท่ามกลางผืนป่าอันอุดมสมบูรณ์",
    image_url:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/teelosu.jpg-mT8KWJR5bBnhLIPek44iD1fpj8zry1.jpeg",
    placeTypes: ["waterfall", "mountain"],
  },
  {
    id: "custom-2",
    title: "อ่าวมาหยา",
    location: "เกาะพีพี",
    province: "กระบี่",
    description:
      "อ่าวมาหยาเป็นอ่าวที่มีชื่อเสียงระดับโลก ตั้งอยู่บนเกาะพีพีเล จังหวัดกระบี่ มีหาดทรายขาวละเอียด น้ำทะเลใสสีเขียวมรกต และหน้าผาหินปูนสูงตระหง่านล้อมรอบ เป็นสถานที่ถ่ายทำภาพยนตร์ฮอลลีวูดเรื่อง The Beach ทำให้เป็นที่รู้จักไปทั่วโลก",
    image_url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/maya.jpg-AK2XeVvQmK7MdM9MGLfoNBOpvf2Wxd.png",
    placeTypes: ["beach"],
  },
  {
    id: "custom-3",
    title: "พระมหาเจดีย์นภเมทนีดล",
    location: "ดอยอินทนนท์",
    province: "เชียงใหม่",
    description:
      "พระมหาเจดีย์นภเมทนีดลเป็นเจดีย์สีทองอร่ามตั้งอยู่บนดอยอินทนนท์ จังหวัดเชียงใหม่ สร้างขึ้นเพื่อถวายเป็นพระราชกุศลแด่พระบาทสมเด็จพระเจ้าอยู่หัวรัชกาลที่ 9 เนื่องในวโรกาสทรงเจริญพระชนมพรรษาครบ 5 รอบ ตั้งอยู่ในพื้นที่ที่มีทัศนียภาพสวยงาม",
    image_url:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/mahaelement.jpg-zR9RWTw6kYL690WmzrLhjOb4ScZAJW.jpeg",
    placeTypes: ["temple", "mountain"],
  },
  {
    id: "custom-4",
    title: "ถนนข้าวสาร",
    location: "พระนคร",
    province: "กรุงเทพมหานคร",
    description:
      "ถนนข้าวสารเป็นแหล่งท่องเที่ยวยอดนิยมของนักท่องเที่ยวทั้งชาวไทยและชาวต่างชาติ ตั้งอยู่ในย่านพระนคร กรุงเทพมหานคร เป็นถนนสายสั้นๆ ที่เต็มไปด้วยที่พัก ร้านอาหาร บาร์ และร้านค้ามากมาย มีบรรยากาศคึกคักและเป็นสีสันของการท่องเที่ยวในกรุงเทพฯ",
    image_url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/kaosan.jpg-K8HJnlaLm2oW4gPZxz1aeJtQpydhD0.jpeg",
    placeTypes: ["market"],
  },
  {
    id: "custom-5",
    title: "วัดพระศรีรัตนศาสดาราม (วัดพระแก้ว)",
    location: "พระบรมมหาราชวัง",
    province: "กรุงเทพมหานคร",
    description:
      "วัดพระศรีรัตนศาสดาราม หรือวัดพระแก้ว เป็นวัดที่มีความสำคัญในประวัติศาสตร์ไทย ตั้งอยู่ภายในพระบรมมหาราชวัง กรุงเทพมหานคร เป็นที่ประดิษฐานพระแก้วมรกต พระพุทธรูปคู่บ้านคู่เมือง และเป็นสถานที่ประกอบพระราชพิธีสำคัญต่างๆ มีสถาปัตยกรรมไทยที่งดงามและวิจิตรตระการตา",
    image_url:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/watpakaw.jpg-ormr6G6YlsM6GBSmH1uUPECcs64Gvd.jpeg",
    placeTypes: ["temple"],
  },
]

export function FeaturedPlaces() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // จำลองการโหลดข้อมูล
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  // ฟังก์ชันสำหรับเลื่อนไปด้านบนสุดของหน้า
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  // ปรับการจัดวางใหม่ให้มีความน่าสนใจมากขึ้น
  return (
    <div>
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="flex flex-col md:flex-row gap-6 bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md"
            >
              <Skeleton className="h-full w-full md:w-2/5 aspect-square md:aspect-auto" />
              <div className="p-5 flex-1">
                <Skeleton className="h-6 w-3/4 mb-3" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-20 w-full mb-4" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {customPlaces.map((place, index) => (
            <div
              key={place.id}
              className={`flex flex-col ${
                index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
              } bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300`}
            >
              <div className="relative w-full md:w-2/5 aspect-video md:aspect-auto">
                <Image
                  src={place.image_url || "/placeholder.svg"}
                  alt={place.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 40vw"
                  unoptimized={place.image_url?.startsWith("https://")}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent md:opacity-0 md:hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {place.placeTypes.map((type) => (
                        <span
                          key={type}
                          className="px-2 py-1 bg-white/20 text-white text-xs rounded-full backdrop-blur-sm"
                        >
                          {type === "beach" && "ชายหาด"}
                          {type === "mountain" && "ภูเขา"}
                          {type === "doi" && "ดอย"}
                          {type === "temple" && "วัด"}
                          {type === "restaurant" && "ร้านอาหาร"}
                          {type === "park" && "สวนสาธารณะ"}
                          {type === "museum" && "พิพิธภัณฑ์"}
                          {type === "market" && "ตลาด"}
                          {type === "waterfall" && "น้ำตก"}
                          {type === "other" && "อื่นๆ"}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <h3 className="text-2xl font-medium mb-2 hover:text-primary transition-colors">
                      <Link href={`/featured-places/${place.id}`} onClick={scrollToTop}>
                        {place.title}
                      </Link>
                    </h3>
                    <span className="text-xs font-medium bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground px-3 py-1 rounded-full">
                      ยอดนิยม
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground flex items-center mb-4">
                    <MapPin className="h-4 w-4 mr-1 text-primary" />
                    {place.location}, {place.province}
                  </p>

                  <p className="text-sm text-muted-foreground mb-6">{place.description}</p>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {place.placeTypes.map((type) => (
                      <span
                        key={type}
                        className="px-2 py-1 bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground text-xs rounded-full"
                      >
                        {type === "beach" && "ชายหาด"}
                        {type === "mountain" && "ภูเขา"}
                        {type === "doi" && "ดอย"}
                        {type === "temple" && "วัด"}
                        {type === "restaurant" && "ร้านอาหาร"}
                        {type === "park" && "สวนสาธารณะ"}
                        {type === "museum" && "พิพิธภัณฑ์"}
                        {type === "market" && "ตลาด"}
                        {type === "waterfall" && "น้ำตก"}
                        {type === "other" && "อื่นๆ"}
                      </span>
                    ))}
                  </div>
                </div>

                <Button
                  asChild
                  className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white group"
                  onClick={scrollToTop}
                >
                  <Link href={`/featured-places/${place.id}`} className="flex items-center justify-center">
                    ดูรายละเอียด
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
