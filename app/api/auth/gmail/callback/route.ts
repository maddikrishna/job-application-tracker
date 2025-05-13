import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    // Get the authorization code from the URL query parameters
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get("code")
    const state = searchParams.get("state")

    if (!code) {
      return NextResponse.redirect(new URL("/dashboard/settings?error=missing_code", request.url))
    }

    // Get user from Supabase
    const supabase = createRouteHandlerClient({ cookies })
    const { data: user, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.redirect(new URL("/login?error=auth_required", request.url))
    }

    // Exchange the authorization code for access and refresh tokens
    // In a real implementation, you would use the Google OAuth API to exchange the code
    // For demo purposes, we'll simulate this process

    const tokens = {
      access_token: `mock_access_token_${Date.now()}`,
      refresh_token: `mock_refresh_token_${Date.now()}`,
      expires_in: 3600,
      token_type: "Bearer",
    }

    // Store the tokens in the database
    const { error } = await supabase.from("email_integrations").insert({
      user_id: user.user.id,
      provider: "gmail",
      credentials: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        token_type: tokens.token_type,
      },
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Error storing Gmail credentials:", error)
      return NextResponse.redirect(new URL("/dashboard/settings?error=db_error", request.url))
    }

    // Redirect back to the settings page with success message
    return NextResponse.redirect(new URL("/dashboard/settings?success=gmail_connected", request.url))
  } catch (error) {
    console.error("Error in Gmail OAuth callback:", error)
    return NextResponse.redirect(new URL("/dashboard/settings?error=server_error", request.url))
  }
}
