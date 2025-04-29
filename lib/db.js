// ตัวอย่างการเชื่อมต่อ Supabase
import { createClient } from "@supabase/supabase-js"
import { supabaseAdmin } from "@/lib/supabase-admin"

// ตรวจสอบว่ามีการกำหนดค่า environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.warn("Missing Supabase environment variables. Using mock data instead.")
}

// สร้าง Supabase client ถ้ามี environment variables
export const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

// ฟังก์ชันตรวจสอบว่าเป็น UUID หรือไม่
export function isUUID(id) {
  if (!id) return false
  // ตรวจสอบว่าเป็น UUID รูปแบบ v4 หรือไม่
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

// แก้ไขฟังก์ชัน getAllPhotos เพื่อให้ดึงข้อมูลรูปภาพได้อย่างถูกต้อง
export async function getAllPhotos(limit = 20, offset = 0, featured = false, locationFilter, userId) {
  // ใช้ supabaseAdmin เพื่อข้าม RLS
  const client = supabaseAdmin || supabase

  // ถ้าไม่มี Supabase client ให้ดึงข้อมูลจาก localStorage แทน
  if (!client) {
    try {
      const photosData = localStorage.getItem("photos")
      if (photosData) {
        let allPhotos = JSON.parse(photosData)

        // กรองตามเงื่อนไข
        if (featured) {
          allPhotos = allPhotos.filter((photo) => photo.featured)
        }

        if (locationFilter) {
          allPhotos = allPhotos.filter(
            (photo) =>
              photo.location?.toLowerCase().includes(locationFilter.toLowerCase()) ||
              photo.province?.toLowerCase().includes(locationFilter.toLowerCase()),
          )
        }

        if (userId) {
          allPhotos = allPhotos.filter((photo) => photo.user_id === userId)
        }

        // เรียงลำดับตาม created_at จากใหม่ไปเก่า
        allPhotos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

        // จำกัดจำนวนและ offset
        return allPhotos.slice(offset, offset + limit)
      }
    } catch (error) {
      console.error("Error parsing photos from localStorage:", error)
    }
    return []
  }

  try {
    let query = client
      .from("photos")
      .select(`
        *,
        user:users(id, name, avatar_url),
        comments:comments(*),
        likes:likes(*)
      `)
      .order("created_at", { ascending: false })

    if (featured) {
      query = query.eq("featured", true)
    }

    if (locationFilter) {
      query = query.or(`location.ilike.%${locationFilter}%,description.ilike.%${locationFilter}%`)
    }

    if (userId) {
      query = query.eq("user_id", userId)
    }

    const { data, error } = await query.limit(limit).range(offset, offset + limit - 1)

    if (error) {
      console.error("Error fetching photos:", error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error("Error fetching photos:", error)

    // ถ้าเกิดข้อผิดพลาด ให้ลองดึงข้อมูลจาก localStorage แทน
    try {
      const photosData = localStorage.getItem("photos")
      if (photosData) {
        let allPhotos = JSON.parse(photosData)

        // กรองตามเงื่อนไข
        if (featured) {
          allPhotos = allPhotos.filter((photo) => photo.featured)
        }

        if (locationFilter) {
          allPhotos = allPhotos.filter(
            (photo) =>
              photo.location?.toLowerCase().includes(locationFilter.toLowerCase()) ||
              photo.province?.toLowerCase().includes(locationFilter.toLowerCase()),
          )
        }

        if (userId) {
          allPhotos = allPhotos.filter((photo) => photo.user_id === userId)
        }

        // เรียงลำดับตาม created_at จากใหม่ไปเก่า
        allPhotos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

        // จำกัดจำนวนและ offset
        return allPhotos.slice(offset, offset + limit)
      }
    } catch (localError) {
      console.error("Error parsing photos from localStorage:", localError)
    }

    return []
  }
}

// ฟังก์ชันสำหรับดึงข้อมูลรูปภาพตาม ID
export async function getPhotoById(id) {
  // ใช้ supabaseAdmin เพื่อข้าม RLS
  const client = supabaseAdmin || supabase

  // ถ้าไม่มี Supabase client หรือ ID ไม่ใช่ UUID ให้ส่งข้อมูลว่างกลับไป
  if (!client || !isUUID(id)) {
    return null
  }

  try {
    const { data, error } = await client
      .from("photos")
      .select(`
        *,
        user:users(id, name, avatar_url),
        comments:comments(
          id,
          text,
          created_at,
          user:users(id, name, avatar_url)
        ),
        likes:likes(*)
      `)
      .eq("id", id)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error fetching photo:", error)
    return null
  }
}

// ฟังก์ชันสำหรับเพิ่มความคิดเห็น
export async function addComment(commentData) {
  // ใช้ supabaseAdmin เพื่อข้าม RLS
  const client = supabaseAdmin || supabase

  // ถ้าไม่มี Supabase client หรือ user_id หรือ photo_id ไม่ใช่ UUID ให้ส่งข้อมูลว่างกลับไป
  if (!client || !isUUID(commentData.user_id) || !isUUID(commentData.photo_id)) {
    return null
  }

  try {
    const { data, error } = await client
      .from("comments")
      .insert(commentData)
      .select(`
        *,
        user:users(id, name, avatar_url)
      `)

    if (error) throw error

    if (!data || data.length === 0) {
      return null
    }

    return data[0]
  } catch (error) {
    console.error("Error adding comment:", error)
    return null
  }
}

// ฟังก์ชันสำหรับเพิ่ม/ลบการกดถูกใจ
export async function toggleLike(photoId, userId) {
  // ใช้ supabaseAdmin เพื่อข้าม RLS
  const client = supabaseAdmin || supabase

  // ถ้าไม่มี Supabase client หรือ userId หรือ photoId ไม่ใช่ UUID ให้ส่งข้อมูลว่างกลับไป
  if (!client || !isUUID(userId) || !isUUID(photoId)) {
    return { liked: false }
  }

  try {
    // ตรวจสอบว่าผู้ใช้กดถูกใจรูปภาพนี้แล้วหรือยัง
    const { data: existingLike, error: checkError } = await client
      .from("likes")
      .select("*")
      .eq("photo_id", photoId)
      .eq("user_id", userId)
      .maybeSingle()

    if (checkError) throw checkError

    if (existingLike) {
      // ถ้ากดถูกใจแล้ว ให้ลบการกดถูกใจ
      const { error: deleteError } = await client.from("likes").delete().eq("id", existingLike.id)

      if (deleteError) throw deleteError
      return { liked: false }
    } else {
      // ถ้ายังไม่ได้กดถูกใจ ให้เพิ่มการกดถูกใจ
      const { error: insertError } = await client.from("likes").insert({ photo_id: photoId, user_id: userId })

      if (insertError) throw insertError
      return { liked: true }
    }
  } catch (error) {
    console.error("Error toggling like:", error)
    return { liked: false }
  }
}
