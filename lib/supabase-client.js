import { createClient } from "@supabase/supabase-js"

// ตรวจสอบว่ามีการกำหนดค่า environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Missing Supabase environment variables. Using mock data instead.")
}

// สร้าง Supabase client สำหรับใช้งานฝั่ง client
export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null
