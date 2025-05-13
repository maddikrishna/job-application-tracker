import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { analyzeJobApplication } from "@/lib/ai-service"

export async function GET(request: NextRequest) {
  try {
    const applicationId = request.nextUrl.searchParams.get("id")

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

    // Analyze the application
    const insights = await analyzeJobApplication(applicationId)

    return NextResponse.json({ success: true, insights })
  } catch (error) {
    console.error("Error analyzing application:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
