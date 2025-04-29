import { createClient } from "@supabase/supabase-js"

// ตรวจสอบว่ามีการกำหนดค่า environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn("Missing Supabase environment variables for admin client.")
}

// สร้าง Supabase admin client ที่ใช้ service role key (ข้าม RLS)
export const supabaseAdmin =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null
