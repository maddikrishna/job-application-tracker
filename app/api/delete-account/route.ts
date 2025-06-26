export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    // Check if all required environment variables are available
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!serviceRoleKey) {
      console.error("SUPABASE_SERVICE_ROLE_KEY is not configured")
      return NextResponse.json({ 
        error: "Server configuration error. Please contact support." 
      }, { status: 500 })
    }

    if (!supabaseUrl) {
      console.error("NEXT_PUBLIC_SUPABASE_URL is not configured")
      return NextResponse.json({ 
        error: "Server configuration error. Please contact support." 
      }, { status: 500 })
    }

    if (!anonKey) {
      console.error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured")
      return NextResponse.json({ 
        error: "Server configuration error. Please contact support." 
      }, { status: 500 })
    }

    // Create admin client dynamically to avoid import issues
    const { createClient } = await import('@supabase/supabase-js')
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = user.id

    // Delete all user data from related tables using admin client
    console.log(`Deleting account data for user: ${userId}`)

    // Delete email integrations
    const { error: emailError } = await supabaseAdmin
      .from("email_integrations")
      .delete()
      .eq("user_id", userId)

    if (emailError) {
      console.error("Error deleting email integrations:", emailError)
    }

    // Delete platform integrations
    const { error: platformError } = await supabaseAdmin
      .from("platform_integrations")
      .delete()
      .eq("user_id", userId)

    if (platformError) {
      console.error("Error deleting platform integrations:", platformError)
    }

    // Delete application emails
    const { error: emailsError } = await supabaseAdmin
      .from("application_emails")
      .delete()
      .eq("user_id", userId)

    if (emailsError) {
      console.error("Error deleting application emails:", emailsError)
    }

    // Delete job applications
    const { error: appsError } = await supabaseAdmin
      .from("job_applications")
      .delete()
      .eq("user_id", userId)

    if (appsError) {
      console.error("Error deleting job applications:", appsError)
    }

    // Delete user profile
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", userId)

    if (profileError) {
      console.error("Error deleting profile:", profileError)
    }

    // Delete the user account using admin client
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error("Error deleting user account:", deleteError)
      return NextResponse.json({ 
        error: `Failed to delete account: ${deleteError.message}` 
      }, { status: 500 })
    }

    console.log(`Successfully deleted account for user: ${userId}`)

    return NextResponse.json({ 
      success: true, 
      message: "Account deleted successfully" 
    })

  } catch (error) {
    console.error("Error in delete account API:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "An unexpected error occurred" 
    }, { status: 500 })
  }
} 