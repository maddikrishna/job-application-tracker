import type { NextRequest } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ""
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ""
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get("code")
    const state = searchParams.get("state")
    const error = searchParams.get("error")

    // Check for errors in the OAuth response
    if (error) {
      console.error("Error in OAuth response:", error)
      return Response.redirect(`${APP_URL}/dashboard/settings?error=${error}`, 302)
    }

    if (!code) {
      console.error("No authorization code received")
      return Response.redirect(`${APP_URL}/dashboard/settings?error=no_code`, 302)
    }

    // Use the same redirect URI as in the auth route
    const redirectUri = "https://kzmje1g3tdu7zw4r1lps.lite.vusercontent.net/api/auth/gmail/callback"

    // Exchange the authorization code for access and refresh tokens
    try {
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code: code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      })

      const tokenData = await tokenResponse.json()

      if (!tokenResponse.ok) {
        console.error("Error exchanging code for tokens:", tokenData)
        return Response.redirect(
          `${APP_URL}/dashboard/settings?error=token_exchange_failed&details=${encodeURIComponent(
            JSON.stringify(tokenData),
          )}`,
          302,
        )
      }

      // Get user information from Google
      const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      })

      const userInfo = await userInfoResponse.json()

      if (!userInfoResponse.ok) {
        console.error("Error getting user info:", userInfo)
        return Response.redirect(`${APP_URL}/dashboard/settings?error=userinfo_failed`, 302)
      }

      // Get the current user from Supabase
      const supabase = createRouteHandlerClient({ cookies })
      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError || !userData.user) {
        console.error("Error getting user from Supabase:", userError)
        return Response.redirect(`${APP_URL}/login?error=authentication_required`, 302)
      }

      // Store the integration in the database
      const { error: integrationError } = await supabase.from("email_integrations").insert({
        user_id: userData.user.id,
        provider: "gmail",
        credentials: {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_type: tokenData.token_type,
          expires_in: tokenData.expires_in,
          id_token: tokenData.id_token,
          email: userInfo.email,
          issued_at: Math.floor(Date.now() / 1000),
        },
        is_active: true,
        sync_frequency: "hourly",
      })

      if (integrationError) {
        console.error("Error storing integration:", integrationError)
        return Response.redirect(`${APP_URL}/dashboard/settings?error=integration_storage_failed`, 302)
      }

      // Redirect back to the settings page with success message
      return Response.redirect(`${APP_URL}/dashboard/settings?tab=email-setup&success=gmail_connected`, 302)
    } catch (error) {
      console.error("Error in Gmail OAuth callback:", error)
      return Response.redirect(
        `${APP_URL}/dashboard/settings?error=unexpected_error&details=${encodeURIComponent(String(error))}`,
        302,
      )
    }
  } catch (error) {
    console.error("Unhandled error in callback route:", error)
    return Response.redirect(`${APP_URL}/dashboard/settings?error=unhandled_error`, 302)
  }
}
