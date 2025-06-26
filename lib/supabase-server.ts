import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "./database.types"

export function createServerSupabaseClient() {
  const cookieStore = cookies()
  return createServerComponentClient<Database>({ cookies: () => cookieStore })
}

export async function getSession() {
  const supabase = createServerSupabaseClient()
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session
  } catch (error) {
    console.error("Error:", error)
    return null
  }
}

export async function getUserDetails() {
  const supabase = createServerSupabaseClient()
  try {
    const { data: userDetails } = await supabase.from("profiles").select("*").single()
    return userDetails
  } catch (error) {
    console.error("Error:", error)
    return null
  }
}

export async function getJobApplications() {
  const supabase = createServerSupabaseClient()
  try {
    const { data: applications } = await supabase
      .from("job_applications")
      .select("*")
      .order("applied_date", { ascending: false })
    return applications || []
  } catch (error) {
    console.error("Error:", error)
    return []
  }
}

export async function getJobApplicationById(id: string) {
  const supabase = createServerSupabaseClient()
  try {
    const { data: application } = await supabase.from("job_applications").select("*").eq("id", String(id)).single()
    return application
  } catch (error) {
    console.error("Error:", error)
    return null
  }
}

export async function getApplicationStatusHistory(applicationId: string) {
  const supabase = createServerSupabaseClient()
  try {
    const { data: history } = await supabase
      .from("application_status_history")
      .select("*")
      .eq("application_id", String(applicationId))
      .order("created_at", { ascending: false })
    return history || []
  } catch (error) {
    console.error("Error:", error)
    return []
  }
}

export async function getEmailIntegrations() {
  const supabase = createServerSupabaseClient()
  try {
    const { data: integrations } = await supabase.from("email_integrations").select("*")
    return integrations || []
  } catch (error) {
    console.error("Error:", error)
    return []
  }
}

export async function getPlatformIntegrations() {
  const supabase = createServerSupabaseClient()
  try {
    const { data: integrations } = await supabase.from("platform_integrations").select("*")
    return integrations || []
  } catch (error) {
    console.error("Error:", error)
    return []
  }
}
