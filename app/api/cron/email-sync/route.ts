export const runtime = 'edge';
import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { syncUserEmails } from "@/lib/email-service"

// This endpoint would be called by a cron job service like Vercel Cron
export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Get all active email integrations
    const { data: integrations, error } = await supabase
      .from("email_integrations")
      .select("id, user_id, sync_frequency, last_sync")
      .eq("is_active", true)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const now = new Date()
    const results = []

    // Process each integration based on its sync frequency
    for (const integration of integrations) {
      let shouldSync = false
      const lastSync = integration.last_sync ? new Date(integration.last_sync) : null

      if (!lastSync) {
        shouldSync = true
      } else {
        const hoursSinceLastSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60)

        switch (integration.sync_frequency) {
          case "hourly":
            shouldSync = hoursSinceLastSync >= 1
            break
          case "daily":
            shouldSync = hoursSinceLastSync >= 24
            break
          case "manual":
            shouldSync = false
            break
          default:
            shouldSync = hoursSinceLastSync >= 1
        }
      }

      if (shouldSync) {
        const result = await syncUserEmails(integration.user_id, integration.id)
        results.push({
          integrationId: integration.id,
          userId: integration.user_id,
          success: result.success,
          processedCount: result.processedCount,
          jobRelatedCount: result.jobRelatedCount,
          newApplications: result.newApplications,
          updatedApplications: result.updatedApplications,
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} integrations`,
      results,
    })
  } catch (error) {
    console.error("Error in cron job:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
