import Link from "next/link"
import { Facebook, Instagram, Twitter } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-secondary py-12 mt-20">
      <div className="minimal-container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Amazing Thailand</h3>
            <p className="text-muted-foreground text-sm">แพลตฟอร์มแบ่งปันภาพถ่ายสถานที่ท่องเที่ยวทั่วประเทศไทย</p>
            <div className="flex space-x-4">
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">เมนูหลัก</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  หน้าแรก
                </Link>
              </li>
              <li>
                <Link href="/explore" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  สำรวจ
                </Link>
              </li>
              <li>
                <Link href="/upload" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  แบ่งปัน
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">สมาชิก</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/auth/login" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  เข้าสู่ระบบ
                </Link>
              </li>
              <li>
                <Link
                  href="/auth/register"
                  className="text-muted-foreground hover:text-primary transition-colors text-sm"
                >
                  สมัครสมาชิก
                </Link>
              </li>
              <li>
                <Link href="/profile" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  โปรไฟล์
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">ช่วยเหลือ</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  ติดต่อเรา
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/50 mt-10 pt-6 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Amazing Thailand. สงวนลิขสิทธิ์.</p>
        </div>
      </div>
    </footer>
  )
}
