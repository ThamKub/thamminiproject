"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { MapPin, Loader2, ArrowLeft } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { th } from "date-fns/locale"
import { PhotoGrid } from "@/components/photo-grid"

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

export default function FeaturedPlacePage({ params }) {
  const [place, setPlace] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [comments, setComments] = useState([])
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // ดึงข้อมูลผู้ใช้จาก localStorage
  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
      } catch (error) {
        console.error("Failed to parse user data:", error)
      }
    }
  }, [])

  // ดึงข้อมูลสถานที่ท่องเที่ยวจากข้อมูลที่กำหนดไว้
  useEffect(() => {
    const fetchPlace = async () => {
      setIsLoading(true)
      try {
        // ค้นหาสถานที่จาก ID ที่ระบุใน URL
        const foundPlace = customPlaces.find((place) => place.id === params.id)

        if (foundPlace) {
          setPlace(foundPlace)

          // ดึงข้อมูลความคิดเห็นจาก localStorage
          const commentsKey = `featuredPlaceComments_${params.id}`
          const savedComments = localStorage.getItem(commentsKey)
          if (savedComments) {
            try {
              const parsedComments = JSON.parse(savedComments)
              setComments(
                parsedComments.map((c) => ({
                  ...c,
                  createdAt: new Date(c.createdAt),
                })),
              )
            } catch (error) {
              console.error("Error parsing comments:", error)
            }
          }
        } else {
          setNotFound(true)
        }
      } catch (error) {
        console.error("Error fetching place:", error)
        setNotFound(true)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPlace()
  }, [params.id])

  const handleCommentSubmit = async (e) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "กรุณาเข้าสู่ระบบ",
        description: "คุณต้องเข้าสู่ระบบก่อนจึงจะสามารถแสดงความคิดเห็นได้",
        variant: "destructive",
      })
      return
    }

    if (!comment.trim()) {
      toast({
        title: "ข้อความว่างเปล่า",
        description: "กรุณากรอกข้อความก่อนส่งความคิดเห็น",
        variant: "destructive",
      })
      return
    }

    if (!place) return

    setIsSubmitting(true)

    try {
      // สร้างข้อมูลความคิดเห็นใหม่
      const newComment = {
        id: `comment-${Date.now()}`,
        text: comment,
        createdAt: new Date(),
        user: {
          id: user.id,
          name: user.name,
          image: user.avatar_url || "/placeholder.svg?height=40&width=40",
        },
      }

      // เพิ่มความคิดเห็นใหม่ลงในรายการ
      const updatedComments = [newComment, ...comments]
      setComments(updatedComments)

      // บันทึกความคิดเห็นลงใน localStorage
      const commentsKey = `featuredPlaceComments_${place.id}`
      localStorage.setItem(commentsKey, JSON.stringify(updatedComments))

      setComment("")
      toast({
        title: "ส่งความคิดเห็นสำเร็จ",
        description: "ความคิดเห็นของคุณถูกเพิ่มเรียบร้อยแล้ว",
      })
    } catch (error) {
      console.error("Error adding comment:", error)
      toast({
        variant: "destructive",
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถเพิ่มความคิดเห็นได้ กรุณาลองใหม่อีกครั้ง",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    )
  }

  if (notFound || !place) {
    return (
      <div className="container mx-auto py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">ไม่พบสถานที่ท่องเที่ยว</h1>
        <p className="text-muted-foreground mb-6">สถานที่ท่องเที่ยวที่คุณกำลังค้นหาอาจไม่มีอยู่ในระบบ</p>
        <Button asChild>
          <Link href="/">กลับไปยังหน้าแรก</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        กลับ
      </Button>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-lg overflow-hidden border bg-card">
            <div className="relative aspect-video">
              <Image
                src={place.image_url || "/placeholder.svg"}
                alt={place.title}
                fill
                className="object-cover"
                priority
                unoptimized={place.image_url?.startsWith("https://")}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl font-bold">{place.title}</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>
                {place.location}, {place.province}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mt-2">
              {place.placeTypes.map((type) => (
                <span key={type} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
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

            <p className="text-lg leading-relaxed">{place.description}</p>
          </div>

          <Separator className="my-6" />

          <div className="space-y-6">
            <h2 className="text-xl font-semibold">ความคิดเห็น ({comments.length})</h2>

            <form onSubmit={handleCommentSubmit} className="space-y-4">
              <Textarea
                placeholder={user ? "แสดงความคิดเห็นของคุณ..." : "กรุณาเข้าสู่ระบบเพื่อแสดงความคิดเห็น"}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={!user || isSubmitting}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={!user || isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      กำลังส่ง...
                    </>
                  ) : (
                    "ส่งความคิดเห็น"
                  )}
                </Button>
              </div>
            </form>

            {!user && (
              <div className="bg-muted p-4 rounded-lg text-center">
                <p className="text-muted-foreground mb-2">คุณต้องเข้าสู่ระบบก่อนจึงจะสามารถแสดงความคิดเห็นได้</p>
                <div className="flex justify-center gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href="/auth/login">เข้าสู่ระบบ</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href="/auth/register">สมัครสมาชิก</Link>
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-4">
                    <Link href={`/profile/${comment.user.id}`}>
                      <Avatar className="h-10 w-10 cursor-pointer">
                        <AvatarImage src={comment.user.image || "/placeholder.svg"} alt={comment.user.name} />
                        <AvatarFallback>{comment.user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Link href={`/profile/${comment.user.id}`} className="font-medium hover:underline">
                          {comment.user.name}
                        </Link>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(comment.createdAt, { addSuffix: true, locale: th })}
                        </span>
                      </div>
                      <p className="text-muted-foreground">{comment.text}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">ยังไม่มีความคิดเห็น เป็นคนแรกที่แสดงความคิดเห็น</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium mb-4">ข้อมูลเพิ่มเติม</h3>
            <ul className="space-y-2">
              <li className="flex justify-between">
                <span className="text-muted-foreground">จังหวัด:</span>
                <span className="font-medium">{place.province}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted-foreground">สถานที่:</span>
                <span className="font-medium">{place.location}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted-foreground">ประเภท:</span>
                <span className="font-medium">
                  {place.placeTypes
                    .map((type) => {
                      switch (type) {
                        case "beach":
                          return "ชายหาด"
                        case "mountain":
                          return "ภูเขา"
                        case "doi":
                          return "ดอย"
                        case "temple":
                          return "วัด"
                        case "restaurant":
                          return "ร้านอาหาร"
                        case "park":
                          return "สวนสาธารณะ"
                        case "museum":
                          return "พิพิธภัณฑ์"
                        case "market":
                          return "ตลาด"
                        case "waterfall":
                          return "น้ำตก"
                        default:
                          return "อื่นๆ"
                      }
                    })
                    .join(", ")}
                </span>
              </li>
            </ul>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium mb-4">สถานที่ท่องเที่ยวใกล้เคียง</h3>
            <PhotoGrid locationFilter={place.province} limit={4} />
          </div>
        </div>
      </div>
    </div>
  )
}
