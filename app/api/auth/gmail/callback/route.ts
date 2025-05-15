import type { NextRequest } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ""
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ""
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://v0-job-application-tracker-drab.vercel.app"

export async function GET(request: NextRequest) {
  console.log("🔍 [OAuth Callback] Starting callback processing")
  console.log(`🔍 [OAuth Callback] APP_URL: ${APP_URL}`)

  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get("code")
    const state = searchParams.get("state")
    const error = searchParams.get("error")

    console.log(
      `🔍 [OAuth Callback] Received params - code: ${code ? "✅ Present" : "❌ Missing"}, state: ${state || "None"}, error: ${error || "None"}`,
    )

    // Check for errors in the OAuth response
    if (error) {
      console.error(`❌ [OAuth Callback] Error in OAuth response: ${error}`)
      return Response.redirect(`${APP_URL}/dashboard/settings?error=${error}`, 302)
    }

    if (!code) {
      console.error("❌ [OAuth Callback] No authorization code received")
      return Response.redirect(`${APP_URL}/dashboard/settings?error=no_code`, 302)
    }

    // Use the actual deployed URL as the redirect URI
    const redirectUri = "https://v0-job-application-tracker-drab.vercel.app/api/auth/gmail/callback"
    console.log(`🔍 [OAuth Callback] Using redirect URI: ${redirectUri}`)

    // Exchange the authorization code for access and refresh tokens
    try {
      console.log("🔍 [OAuth Callback] Exchanging code for tokens...")

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
        console.error(`❌ [OAuth Callback] Error exchanging code for tokens: ${JSON.stringify(tokenData)}`)
        return Response.redirect(
          `${APP_URL}/dashboard/settings?error=token_exchange_failed&details=${encodeURIComponent(
            JSON.stringify(tokenData),
          )}`,
          302,
        )
      }

      console.log("✅ [OAuth Callback] Successfully obtained tokens")
      console.log(`🔍 [OAuth Callback] Token types received: ${Object.keys(tokenData).join(", ")}`)

      // Get user information from Google
      console.log("🔍 [OAuth Callback] Fetching user info...")
      const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      })

      const userInfo = await userInfoResponse.json()

      if (!userInfoResponse.ok) {
        console.error(`❌ [OAuth Callback] Error getting user info: ${JSON.stringify(userInfo)}`)
        return Response.redirect(`${APP_URL}/dashboard/settings?error=userinfo_failed`, 302)
      }

      console.log(`✅ [OAuth Callback] User info retrieved: ${userInfo.email}`)

      // Get the current user from Supabase
      console.log("🔍 [OAuth Callback] Getting user from Supabase...")
      const supabase = createRouteHandlerClient({ cookies })
      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError || !userData.user) {
        console.error(`❌ [OAuth Callback] Error getting user from Supabase: ${userError?.message || "No user found"}`)
        return Response.redirect(`${APP_URL}/login?error=authentication_required`, 302)
      }

      console.log(`✅ [OAuth Callback] Supabase user retrieved: ${userData.user.id}`)

      // Store the integration in the database
      console.log("🔍 [OAuth Callback] Storing integration in database...")
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
        console.error(`❌ [OAuth Callback] Error storing integration: ${integrationError.message}`)
        return Response.redirect(`${APP_URL}/dashboard/settings?error=integration_storage_failed`, 302)
      }

      console.log("✅ [OAuth Callback] Integration stored successfully")

      // Redirect back to the settings page with success message
      const redirectUrl = `${APP_URL}/dashboard/settings?tab=email-setup&success=gmail_connected`
      console.log(`🔍 [OAuth Callback] Redirecting to: ${redirectUrl}`)

      return Response.redirect(redirectUrl, 302)
    } catch (error) {
      console.error(`❌ [OAuth Callback] Error in Gmail OAuth callback: ${error}`)
      return Response.redirect(
        `${APP_URL}/dashboard/settings?error=unexpected_error&details=${encodeURIComponent(String(error))}`,
        302,
      )
    }
  } catch (error) {
    console.error(`❌ [OAuth Callback] Unhandled error in callback route: ${error}`)
    return Response.redirect(`${APP_URL}/dashboard/settings?error=unhandled_error`, 302)
  }
}
