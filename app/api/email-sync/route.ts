import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { syncUserEmails } from "@/lib/email-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request payload
    if (!body.integrationId) {
      return NextResponse.json({ error: "Integration ID is required" }, { status: 400 })
    }

    // Get user from Supabase
    const supabase = createRouteHandlerClient({ cookies })
    const { data: user, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Sync emails
    const result = await syncUserEmails(user.user.id, body.integrationId)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      processedCount: result.processedCount,
      jobRelatedCount: result.jobRelatedCount,
      newApplications: result.newApplications,
      updatedApplications: result.updatedApplications,
    })
  } catch (error) {
    console.error("Error syncing emails:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
