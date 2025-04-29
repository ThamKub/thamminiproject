import { supabaseAdmin } from "@/lib/supabase-admin"

// ฟังก์ชันสำหรับตรวจสอบและสร้าง bucket ใน Supabase Storage
export async function setupStorage() {
  if (!supabaseAdmin) return

  try {
    // ตรวจสอบว่ามี bucket "avatars" หรือไม่
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets()

    if (listError) {
      console.error("Error listing buckets:", listError)
      return
    }

    // ถ้าไม่มี bucket "avatars" ให้สร้างใหม่
    if (!buckets.find((bucket) => bucket.name === "avatars")) {
      const { error: createError } = await supabaseAdmin.storage.createBucket("avatars", {
        public: true,
        fileSizeLimit: 1024 * 1024 * 2, // 2MB
      })

      if (createError) {
        console.error("Error creating avatars bucket:", createError)
      } else {
        console.log("Created avatars bucket successfully")
      }
    }
  } catch (error) {
    console.error("Error setting up storage:", error)
  }
}
