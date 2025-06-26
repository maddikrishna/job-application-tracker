export const runtime = 'edge';
import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ""
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ""

export async function GET(request: NextRequest) {
  console.log("🔍 [OAuth Callback] Starting callback processing")
  // Dynamically determine base URL from request
  const protocol = request.headers.get("x-forwarded-proto") || "http"
  const host = request.headers.get("host")
  const baseUrl = `${protocol}://${host}`
  console.log(`🔍 [OAuth Callback] baseUrl: ${baseUrl}`)

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
      // Always redirect to app with error
      return NextResponse.redirect(`${baseUrl}/dashboard/settings?error=${error}`, 302)
    }

    if (!code) {
      console.error("❌ [OAuth Callback] No authorization code received")
      // Always redirect to app with error
      return NextResponse.redirect(`${baseUrl}/dashboard/settings?error=no_code`, 302)
    }

    // Dynamically determine redirectUri based on request
    const redirectUri = `${protocol}://${host}/api/auth/gmail/callback`
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
        // Always redirect to app with error and details
        return NextResponse.redirect(
          `${baseUrl}/dashboard/settings?error=token_exchange_failed&details=${encodeURIComponent(
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
        // Always redirect to app with error
        return NextResponse.redirect(`${baseUrl}/dashboard/settings?error=userinfo_failed`, 302)
      }

      console.log(`✅ [OAuth Callback] User info retrieved: ${userInfo.email}`)

      // Get the current user from Supabase
      console.log("🔍 [OAuth Callback] Getting user from Supabase...")
      const supabase = createRouteHandlerClient({ cookies })
      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError || !userData.user) {
        console.error(`❌ [OAuth Callback] Error getting user from Supabase: ${userError?.message || "No user found"}`)
        // Always redirect to app with error
        return NextResponse.redirect(`${baseUrl}/login?error=authentication_required`, 302)
      }

      console.log(`✅ [OAuth Callback] Supabase user retrieved: ${userData.user.id}`)

      // --- PRODUCTION GRADE: Remove old Gmail integrations and revoke token ---
      // Find existing Gmail integrations for this user (case-insensitive)
      const { data: oldIntegrations, error: oldIntegrationsError } = await supabase
        .from("email_integrations")
        .select("id, credentials")
        .ilike("provider", "gmail")
        .eq("user_id", userData.user.id)

      if (oldIntegrationsError) {
        console.error("Error fetching old Gmail integrations:", oldIntegrationsError)
      }

      console.log(`[Cleanup] Found ${oldIntegrations?.length || 0} old Gmail integrations for user ${userData.user.id}`)
      let integrationIdToUpdate = null
      if (oldIntegrations && oldIntegrations.length > 0) {
        for (const old of oldIntegrations) {
          console.log(`[Cleanup] Old integration ID: ${old.id}, credentials:`, old.credentials)
          // Try to revoke the old token if present
          const token = old.credentials?.refresh_token || old.credentials?.access_token
          if (token) {
            try {
              const revokeRes = await fetch('https://oauth2.googleapis.com/revoke', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ token }),
              })
              if (revokeRes.ok) {
                console.log(`✅ Revoked old Gmail token for integration ${old.id}`)
              } else {
                console.warn(`⚠️ Failed to revoke token for integration ${old.id}`)
              }
            } catch (revokeError) {
              console.error(`Error revoking token for integration ${old.id}:`, revokeError)
            }
          } else {
            console.warn(`[Cleanup] No token found to revoke for integration ${old.id}`)
          }
          // Instead of deleting, mark for update
          if (!integrationIdToUpdate) integrationIdToUpdate = old.id
          else {
            // Delete any extras
            const { error: deleteError } = await supabase
              .from("email_integrations")
              .delete()
              .eq("id", old.id)
            if (deleteError) {
              console.error(`[Cleanup] Error deleting old integration ${old.id}:`, deleteError)
            } else {
              console.log(`[Cleanup] ✅ Deleted extra Gmail integration ${old.id}`)
            }
          }
        }
      }
      // --- END PRODUCTION GRADE CLEANUP ---

      // Store or update the integration in the database
      console.log("🔍 [OAuth Callback] Storing or updating integration in database...")
      let integrationError = null
      if (integrationIdToUpdate) {
        // Update existing integration
        const { error } = await supabase.from("email_integrations").update({
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
        }).eq("id", integrationIdToUpdate)
        integrationError = error
        console.log(`[OAuth Callback] Updated existing integration ${integrationIdToUpdate}`)
      } else {
        // Insert new integration
        const { error } = await supabase.from("email_integrations").insert({
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
        integrationError = error
        console.log(`[OAuth Callback] Inserted new integration for user ${userData.user.id}`)
      }

      if (integrationError) {
        console.error(`❌ [OAuth Callback] Error storing integration: ${integrationError.message}`)
        // Always redirect to app with error
        return NextResponse.redirect(`${baseUrl}/dashboard/settings?error=integration_storage_failed`, 302)
      }

      console.log("✅ [OAuth Callback] Integration stored successfully")

      // Redirect back to the settings page with success message
      const redirectUrl = `${baseUrl}/dashboard/settings?tab=email-setup&success=gmail_connected`
      console.log(`🔍 [OAuth Callback] Redirecting to: ${redirectUrl}`)

      return NextResponse.redirect(redirectUrl, 302)
    } catch (error) {
      console.error(`❌ [OAuth Callback] Error in Gmail OAuth callback: ${error}`)
      // Always redirect to app with error and details
      return NextResponse.redirect(
        `${baseUrl}/dashboard/settings?error=unexpected_error&details=${encodeURIComponent(String(error))}`,
        302,
      )
    }
  } catch (error) {
    console.error(`❌ [OAuth Callback] Unhandled error in callback route: ${error}`)
    // Always redirect to app with error
    return NextResponse.redirect(`${baseUrl}/dashboard/settings?error=unhandled_error`, 302)
  }
}
