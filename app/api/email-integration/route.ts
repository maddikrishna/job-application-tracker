import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { getEmailProvider } from "@/lib/email-service"

// GET endpoint to list email integrations
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: user, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: integrations, error } = await supabase
      .from("email_integrations")
      .select("*")
      .eq("user_id", user.user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, integrations })
  } catch (error) {
    console.error("Error fetching email integrations:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST endpoint to create a new email integration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request payload
    if (!body.provider || !body.credentials) {
      return NextResponse.json({ error: "Provider and credentials are required" }, { status: 400 })
    }

    // Get user from Supabase
    const supabase = createRouteHandlerClient({ cookies })
    const { data: user, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Test the connection
    try {
      const provider = getEmailProvider(body.provider)
      const connected = await provider.connect(body.credentials)

      if (!connected) {
        return NextResponse.json({ error: "Failed to connect to email provider" }, { status: 400 })
      }
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Create the integration
    const { data: integration, error } = await supabase
      .from("email_integrations")
      .insert({
        user_id: user.user.id,
        provider: body.provider,
        credentials: body.credentials,
        is_active: true,
        sync_frequency: body.syncFrequency || "hourly",
        filters: body.filters || {},
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, integration })
  } catch (error) {
    console.error("Error creating email integration:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE endpoint to remove an email integration
export async function DELETE(request: NextRequest) {
  try {
    const integrationId = request.nextUrl.searchParams.get("id")

    if (!integrationId) {
      return NextResponse.json({ error: "Integration ID is required" }, { status: 400 })
    }

    // Get user from Supabase
    const supabase = createRouteHandlerClient({ cookies })
    const { data: user, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Delete the integration
    const { error } = await supabase
      .from("email_integrations")
      .delete()
      .eq("id", integrationId)
      .eq("user_id", user.user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting email integration:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
