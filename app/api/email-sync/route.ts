export const runtime = 'edge';
import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { syncUserEmails } from "@/lib/email-service"

export async function POST(request: NextRequest) {
  try {
    console.log("Email sync API route called")
    const body = await request.json()

    // Validate request payload
    if (!body.integrationId) {
      console.error("Integration ID is required")
      return NextResponse.json({ error: "Integration ID is required" }, { status: 400 })
    }

    console.log(`Syncing emails for integration: ${body.integrationId}`)

    // Get user from Supabase
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: user, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error("Unauthorized:", userError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log(`User authenticated: ${user.user.id}`)

    // Sync emails
    const result = await syncUserEmails(user.user.id, body.integrationId, cookieStore)

    if (!result.success) {
      console.error("Email sync failed:", result.error)
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    console.log("Email sync completed successfully")
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
