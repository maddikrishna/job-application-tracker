import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ""
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ""
const REDIRECT_URI = "https://v0-job-application-tracker-drab.vercel.app/api/auth/gmail/callback"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

export async function GET(request: NextRequest) {
  try {
    console.log("OAuth callback received")

    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get("code")
    const state = searchParams.get("state")
    const error = searchParams.get("error")

    // Check for errors in the OAuth response
    if (error) {
      console.error("Error in OAuth response:", error)
      return NextResponse.redirect(`/dashboard/settings?error=${error}`)
    }

    if (!code) {
      console.error("No authorization code received")
      return NextResponse.redirect(`/dashboard/settings?error=no_code`)
    }

    // Verify the state parameter to prevent CSRF attacks
    let storedState
    try {
      storedState = cookies().get("gmail_oauth_state")?.value
    } catch (cookieError) {
      console.error("Error reading state cookie:", cookieError)
      return NextResponse.redirect(`/dashboard/settings?error=cookie_error`)
    }

    if (!storedState || storedState !== state) {
      console.error("State mismatch:", { storedState, receivedState: state })
      return NextResponse.redirect(`/dashboard/settings?error=invalid_state`)
    }

    // Clear the state cookie
    try {
      cookies().delete("gmail_oauth_state")
    } catch (cookieError) {
      console.error("Error deleting state cookie:", cookieError)
      // Continue anyway
    }

    // Exchange the authorization code for access and refresh tokens
    try {
      console.log("Exchanging code for tokens")
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code: code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: REDIRECT_URI,
          grant_type: "authorization_code",
        }),
      })

      const tokenData = await tokenResponse.json()

      if (!tokenResponse.ok) {
        console.error("Error exchanging code for tokens:", tokenData)
        return NextResponse.redirect(
          `/dashboard/settings?error=token_exchange_failed&details=${encodeURIComponent(JSON.stringify(tokenData))}`,
        )
      }

      // Get user information from Google
      console.log("Getting user info")
      const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      })

      const userInfo = await userInfoResponse.json()

      if (!userInfoResponse.ok) {
        console.error("Error getting user info:", userInfo)
        return NextResponse.redirect(`/dashboard/settings?error=userinfo_failed`)
      }

      // Store the email in a cookie for display purposes (in v0 preview only)
      cookies().set("gmail_connected_email", userInfo.email, {
        httpOnly: false, // Allow JavaScript to read this cookie
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24, // 1 day
        path: "/",
      })

      // Redirect back to the settings page with success message and email
      return NextResponse.redirect(
        `/dashboard/settings?tab=email-setup&success=gmail_connected&email=${encodeURIComponent(userInfo.email)}`,
      )
    } catch (error) {
      console.error("Error in Gmail OAuth callback:", error)
      return NextResponse.redirect(
        `/dashboard/settings?error=unexpected_error&details=${encodeURIComponent(String(error))}`,
      )
    }
  } catch (error) {
    console.error("Unhandled error in callback route:", error)
    return NextResponse.redirect(`/dashboard/settings?error=unhandled_error`)
  }
}
