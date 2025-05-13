import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const applicationId = request.nextUrl.searchParams.get("applicationId")

    if (!applicationId) {
      return NextResponse.json({ error: "Application ID is required" }, { status: 400 })
    }

    // Get user from Supabase
    const supabase = createRouteHandlerClient({ cookies })
    const { data: user, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify the application belongs to the user
    const { data: application, error: appError } = await supabase
      .from("job_applications")
      .select("user_id")
      .eq("id", applicationId)
      .single()

    if (appError || !application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    if (application.user_id !== user.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get emails for this application
    const { data: emails, error: emailsError } = await supabase
      .from("application_emails")
      .select("*")
      .eq("application_id", applicationId)
      .order("received_at", { ascending: false })

    if (emailsError) {
      return NextResponse.json({ error: emailsError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, emails })
  } catch (error) {
    console.error("Error fetching application emails:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
