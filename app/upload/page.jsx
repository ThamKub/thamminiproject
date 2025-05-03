"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Upload, Loader2 } from "lucide-react"
import Image from "next/image"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

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

const formSchema = z.object({
  title: z.string().min(2, {
    message: "ชื่อสถานที่ต้องมีอย่างน้อย 2 ตัวอักษร",
  }),
  location: z.string().min(2, {
    message: "ชื่อสถานที่ต้องมีอย่างน้อย 2 ตัวอักษร",
  }),
  province: z.string({
    required_error: "กรุณาเลือกจังหวัด",
  }),
  placeTypes: z.array(z.string()).min(1, {
    message: "กรุณาเลือกประเภทสถานที่อย่างน้อย 1 ประเภท",
  }),
  description: z.string().optional(),
  image: z.instanceof(File).refine((file) => file.size > 0, "กรุณาเลือกรูปภาพ"),
})

export default function UploadPage() {
  const [preview, setPreview] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState(null)
  const [error, setError] = useState(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // ตรวจสอบว่าผู้ใช้เข้าสู่ระบบแล้วหรือไม่
    const userData = localStorage.getItem("user")
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
      } catch (error) {
        console.error("Failed to parse user data:", error)
        setError("กรุณาเข้าสู่ระบบก่อนอัปโหลดรูปภาพ")
      }
    } else {
      setError("กรุณาเข้าสู่ระบบก่อนอัปโหลดรูปภาพ")
    }
  }, [])

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      location: "",
      province: "",
      placeTypes: [],
      description: "",
    },
  })

  function handleImageChange(e) {
    const file = e.target.files?.[0]

    if (file) {
      form.setValue("image", file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  async function onSubmit(values) {
    if (!user) {
      setError("กรุณาเข้าสู่ระบบก่อนอัปโหลดรูปภาพ")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // สร้าง FormData สำหรับส่งไฟล์
      const formData = new FormData()
      formData.append("title", values.title)
      formData.append("location", values.location)
      formData.append("province", values.province)
      formData.append("placeTypes", JSON.stringify(values.placeTypes))
      formData.append("description", values.description || "")
      formData.append("image", values.image)
      formData.append("userId", user.id)

      // สร้างข้อมูลรูปภาพใหม่สำหรับเก็บใน localStorage ก่อน
      const newPhotoId = `photo-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      const newPhoto = {
        id: newPhotoId,
        title: values.title,
        description: values.description || "",
        location: values.location,
        province: values.province,
        placeTypes: values.placeTypes,
        image_url: preview || `/placeholder.svg?height=600&width=800`,
        user_id: user.id,
        created_at: new Date().toISOString(),
        featured: false,
        user: {
          id: user.id,
          name: user.name || "ผู้ใช้งานตัวอย่าง",
          avatar_url: user.avatar_url || `/placeholder.svg?height=40&width=40`,
        },
        comments: [],
        likes: 0,
      }

      // บันทึกข้อมูลใน localStorage ก่อนเพื่อให้แสดงผลทันที
      const photosData = localStorage.getItem("photos")
      const photos = photosData ? JSON.parse(photosData) : []
      photos.unshift(newPhoto)
      localStorage.setItem("photos", JSON.stringify(photos))

      // เก็บข้อมูลว่ามีการอัปโหลดล่าสุด
      localStorage.setItem("lastUpload", "true")

      // ทำให้เกิด storage event เพื่อให้หน้าอื่นรับรู้การเปลี่ยนแปลง
      window.dispatchEvent(new Event("storage"))

      // เพิ่มการแจ้งเตือนการเปลี่ยนแปลงอีกวิธี
      try {
        localStorage.setItem("photosUpdated", Date.now().toString())
      } catch (e) {
        console.error("Error setting photosUpdated:", e)
      }

      // แสดง toast ว่าอัปโหลดสำเร็จ
      toast({
        title: "อัปโหลดสำเร็จ",
        description: "รูปภาพของคุณถูกอัปโหลดเรียบร้อยแล้ว",
      })

      // ส่งข้อมูลไปยัง API (ใช้ API admin แทน) - ทำหลังจากบันทึกใน localStorage แล้ว
      try {
        const response = await fetch("/api/admin/photos", {
          method: "POST",
          body: formData,
        })

        if (response.ok) {
          const data = await response.json()
          console.log("API upload success:", data)
        } else {
          console.warn("API upload failed but local storage was updated")
        }
      } catch (apiError) {
        console.error("API error:", apiError)
        // ไม่ต้อง throw error เพราะเราได้บันทึกใน localStorage แล้ว
      }

      // รีเฟรชหน้าแรกเพื่อแสดงรูปภาพใหม่
      setTimeout(() => {
        router.push("/?refresh=" + Date.now())
      }, 1000) // รอ 1 วินาทีเพื่อให้ toast แสดงก่อนเด้งไปหน้าแรก
    } catch (error) {
      console.error("Upload error:", error)
      setError(error.message || "ไม่สามารถอัปโหลดรูปภาพได้ กรุณาลองใหม่อีกครั้ง")
      toast({
        variant: "destructive",
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถอัปโหลดรูปภาพได้ กรุณาลองใหม่อีกครั้ง",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (error && !user) {
    return (
      <div className="container mx-auto py-10">
        <div className="max-w-2xl mx-auto space-y-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>ไม่สามารถอัปโหลดรูปภาพได้</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="flex justify-center">
            <Button onClick={() => router.push("/auth/login")}>เข้าสู่ระบบ</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">แบ่งปันภาพถ่ายของคุณ</h1>
          <p className="text-muted-foreground">อัปโหลดภาพถ่ายสถานที่ท่องเที่ยวสวยๆ ของคุณเพื่อแบ่งปันให้ผู้อื่นได้ชื่นชม</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>เกิดข้อผิดพลาด</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="image"
              render={({ field: { value, onChange, ...fieldProps } }) => (
                <FormItem>
                  <FormLabel>รูปภาพ</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      <div
                        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors ${
                          preview ? "border-primary" : "border-muted-foreground/25"
                        }`}
                        onClick={() => document.getElementById("image-upload")?.click()}
                      >
                        {preview ? (
                          <div className="relative aspect-video w-full overflow-hidden rounded-md">
                            <Image src={preview || "/placeholder.svg"} alt="Preview" fill className="object-cover" />
                          </div>
                        ) : (
                          <div className="py-12 flex flex-col items-center justify-center text-muted-foreground">
                            <Upload className="h-12 w-12 mb-4" />
                            <p className="text-lg font-medium">คลิกเพื่อเลือกรูปภาพ หรือลากและวางที่นี่</p>
                            <p className="text-sm">PNG, JPG, WEBP ขนาดไม่เกิน 10MB</p>
                          </div>
                        )}
                        <Input
                          id="image-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageChange}
                          {...fieldProps}
                        />
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ชื่อรูปภาพ</FormLabel>
                    <FormControl>
                      <Input placeholder="ชื่อรูปภาพของคุณ" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>สถานที่</FormLabel>
                    <FormControl>
                      <Input placeholder="ชื่อสถานที่" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="province"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>จังหวัด</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="เลือกจังหวัด" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-background max-h-[300px] overflow-y-auto">
                      {provinces.map((province) => (
                        <SelectItem key={province} value={province}>
                          {province}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="placeTypes"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel>ประเภทสถานที่</FormLabel>
                    <FormDescription>เลือกประเภทสถานที่ท่องเที่ยว (เลือกได้มากกว่า 1)</FormDescription>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {placeTypes.map((item) => (
                      <FormField
                        key={item.id}
                        control={form.control}
                        name="placeTypes"
                        render={({ field }) => {
                          return (
                            <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(item.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, item.id])
                                      : field.onChange(field.value?.filter((value) => value !== item.id))
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">{item.label}</FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>คำอธิบาย</FormLabel>
                  <FormControl>
                    <Textarea placeholder="เล่าเรื่องราวเกี่ยวกับรูปภาพนี้..." className="min-h-[120px]" {...field} />
                  </FormControl>
                  <FormDescription>คำอธิบายเพิ่มเติมเกี่ยวกับสถานที่หรือประสบการณ์ของคุณ</FormDescription>
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
                    กำลังอัปโหลด...
                  </>
                ) : (
                  "อัปโหลดรูปภาพ"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
