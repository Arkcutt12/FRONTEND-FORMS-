import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://tivguffcwtqiyslrvquy.supabase.co"
const supabaseServiceRoleKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpdmd1ZmZjd3RxaXlzbHJ2cXV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTMzNzg0OSwiZXhwIjoyMDc0OTEzODQ5fQ.Udr48-uwSTBp2_FT-PiDvDVKcBoYHQ9DgS8VKK-SE5E"

console.log("[v0] Creating Supabase client for:", supabaseUrl)
console.log("[v0] Using schema: public")
console.log("[v0] Using Service Role Key to bypass RLS")

export const externalSupabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  db: {
    schema: "public",
  },
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

console.log("[v0] Supabase client created successfully")
