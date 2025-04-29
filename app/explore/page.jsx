"use client"
import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PhotoGrid } from "@/components/photo-grid"
import { Search, MapPin } from "lucide-react"

// รายชื่อจังหวัดในประเทศไทย
const provinces = [
  "กรุงเทพมหานคร",
  "กระบี่",
  "กาญจนบุรี",
  "กาฬสินธุ์",
  "กำแพงเพชร",
  "ขอนแก่น",
  "จันทบุรี",
  "ฉะเชิงเทรา",
  "ชลบุรี",
  "ชัยนาท",
  "ชัยภูมิ",
  "ชุมพร",
  "เชียงราย",
  "เชียงใหม่",
  "ตรัง",
  "ตราด",
  "ตาก",
  "นครนายก",
  "นครปฐม",
  "นครพนม",
  "นครราชสีมา",
  "นครศรีธรรมราช",
  "นครสวรรค์",
  "นนทบุรี",
  "นราธิวาส",
  "น่าน",
  "บึงกาฬ",
  "บุรีรัมย์",
  "ปทุมธานี",
  "ประจวบคีรีขันธ์",
  "ปราจีนบุรี",
  "ปัตตานี",
  "พระนครศรีอยุธยา",
  "พะเยา",
  "พังงา",
  "พัทลุง",
  "พิจิตร",
  "พิษณุโลก",
  "เพชรบุรี",
  "เพชรบูรณ์",
  "แพร่",
  "ภูเก็ต",
  "มหาสารคาม",
  "มุกดาหาร",
  "แม่ฮ่องสอน",
  "ยโสธร",
  "ยะลา",
  "ร้อยเอ็ด",
  "ระนอง",
  "ระยอง",
  "ราชบุรี",
  "ลพบุรี",
  "ลำปาง",
  "ลำพูน",
  "เลย",
  "ศรีสะเกษ",
  "สกลนคร",
  "สงขลา",
  "สตูล",
  "สมุทรปราการ",
  "สมุทรสงคราม",
  "สมุทรสาคร",
  "สระแก้ว",
  "สระบุรี",
  "สิงห์บุรี",
  "สุโขทัย",
  "สุพรรณบุรี",
  "สุราษฎร์ธานี",
  "สุรินทร์",
  "หนองคาย",
  "หนองบัวลำภู",
  "อ่างทอง",
  "อำนาจเจริญ",
  "อุดรธานี",
  "อุตรดิตถ์",
  "อุทัยธานี",
  "อุบลราชธานี",
]

// ประเภทสถานที่ท่องเที่ยว
const placeTypes = [
  { id: "waterfall", label: "น้ำตก" },
  { id: "mountain", label: "ภูเขา" },
  { id: "doi", label: "ดอย" },
  { id: "temple", label: "วัด" },
  { id: "restaurant", label: "ร้านอาหาร" },
  { id: "beach", label: "ชายหาด" },
  { id: "park", label: "สวนสาธารณะ" },
  { id: "museum", label: "พิพิธภัณฑ์" },
  { id: "market", label: "ตลาด" },
  { id: "other", label: "อื่นๆ" },
]

export default function ExplorePage() {
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProvince, setSelectedProvince] = useState("")
  const [refreshKey, setRefreshKey] = useState(0)

  // ดึงค่า query parameter
  useEffect(() => {
    const location = searchParams.get("location")
    if (location) {
      setSelectedProvince(location)
    }
  }, [searchParams])

  // เพิ่ม effect เพื่อตรวจสอบการเปลี่ยนแปลงของ localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      setRefreshKey((prev) => prev + 1)
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("focus", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("focus", handleStorageChange)
    }
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    // ในที่นี้เราจะใช้ refreshKey เพื่อบังคับให้ PhotoGrid โหลดข้อมูลใหม่
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">สำรวจสถานที่ท่องเที่ยว</h1>
          <p className="text-muted-foreground">ค้นพบสถานที่ท่องเที่ยวสวยๆ ทั่วประเทศไทย</p>
        </div>

        <div className="bg-muted rounded-lg p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="ค้นหาสถานที่ท่องเที่ยว..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="w-full md:w-64">
                <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                  <SelectTrigger>
                    <div className="flex items-center">
                      <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="เลือกจังหวัด" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="all">ทุกจังหวัด</SelectItem>
                    {provinces.map((province) => (
                      <SelectItem key={province} value={province}>
                        {province}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="md:w-auto">
                <Search className="mr-2 h-4 w-4" />
                ค้นหา
              </Button>
            </div>
          </form>
        </div>

        <Tabs defaultValue="all">
          <TabsList className="mb-6">
            <TabsTrigger value="all">ทั้งหมด</TabsTrigger>
            <TabsTrigger value="featured">แนะนำ</TabsTrigger>
            <TabsTrigger value="popular">ยอดนิยม</TabsTrigger>
            <TabsTrigger value="recent">ล่าสุด</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <PhotoGrid locationFilter={selectedProvince} limit={24} refreshKey={refreshKey} />
          </TabsContent>

          <TabsContent value="featured">
            <PhotoGrid featured={true} locationFilter={selectedProvince} limit={24} refreshKey={refreshKey} />
          </TabsContent>

          <TabsContent value="popular">
            <PhotoGrid locationFilter={selectedProvince} limit={24} refreshKey={refreshKey} />
          </TabsContent>

          <TabsContent value="recent">
            <PhotoGrid locationFilter={selectedProvince} limit={24} refreshKey={refreshKey} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
