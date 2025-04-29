import Link from "next/link"
import Image from "next/image"
import { Facebook, Phone, Mail, MapPin, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function ContactPage() {
  return (
    <div className="container mx-auto py-12">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">ติดต่อเรา</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            หากคุณมีคำถามหรือต้องการข้อมูลเพิ่มเติมเกี่ยวกับ Amazing Thailand 2025 สามารถติดต่อเราได้ตามช่องทางด้านล่าง
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card className="overflow-hidden">
            <div className="relative h-48">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/pnew.jpg-4WYYWhlTcpKU8DNglR9Z0lcC1xMwwp.jpeg"
                alt="Amazing Thailand"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <h2 className="text-3xl font-bold text-white">Amazing Thailand 2025</h2>
              </div>
            </div>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Facebook className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium">Facebook</h3>
                    <p className="text-muted-foreground">
                      <Link href="https://www.facebook.com/AmazingThailand" className="hover:underline text-primary">
                        facebook.com/AmazingThailand
                      </Link>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium">เบอร์โทรศัพท์</h3>
                    <p className="text-muted-foreground">xxx-xxxxxxxxxx</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium">อีเมล</h3>
                    <p className="text-muted-foreground">Tham@xxxx.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium">ที่อยู่</h3>
                    <p className="text-muted-foreground">19 1 ถ.เพชรเกษม แขวงหนองค้างพลู เขตหนองแขม กรุงเทพมหานคร 10160</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium">เวลาทำการ</h3>
                    <p className="text-muted-foreground">จันทร์ - ศุกร์: 08:30 - 16:30 น.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ส่งข้อความถึงเรา</CardTitle>
              <CardDescription>กรอกแบบฟอร์มด้านล่างเพื่อส่งข้อความหาเรา</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">
                      ชื่อ
                    </label>
                    <input id="name" type="text" className="w-full p-2 border rounded-md" placeholder="กรุณากรอกชื่อ" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
                      อีเมล
                    </label>
                    <input
                      id="email"
                      type="email"
                      className="w-full p-2 border rounded-md"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="subject" className="text-sm font-medium">
                    หัวข้อ
                  </label>
                  <input id="subject" type="text" className="w-full p-2 border rounded-md" placeholder="กรุณากรอกหัวข้อ" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium">
                    ข้อความ
                  </label>
                  <textarea
                    id="message"
                    className="w-full p-2 border rounded-md min-h-[120px]"
                    placeholder="กรุณากรอกข้อความ"
                  ></textarea>
                </div>
                <Button type="submit" className="w-full">
                  ส่งข้อความ
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-12" />

        <div className="text-center">
          <h2 className="text-2xl font-bold mb-6">ติดตามเราบนโซเชียลมีเดีย</h2>
          <div className="flex justify-center gap-4">
            <Button variant="outline" size="lg" className="gap-2">
              <Facebook className="h-5 w-5" />
              Facebook
            </Button>
            <Button variant="outline" size="lg" className="gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
              Instagram
            </Button>
            <Button variant="outline" size="lg" className="gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
              </svg>
              Twitter
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
