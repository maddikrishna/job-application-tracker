import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { v4 as uuidv4 } from "uuid"

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ""
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ""
const REDIRECT_URI = "https://v0-job-application-tracker-drab.vercel.app/api/auth/gmail/callback"

export async function GET() {
  try {
    // Generate a random state value to prevent CSRF attacks
    const state = uuidv4()

    // Store the state in a cookie
    cookies().set("gmail_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 10, // 10 minutes
      path: "/",
    })

    // Construct the Google OAuth URL
    const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")
    googleAuthUrl.searchParams.append("client_id", GOOGLE_CLIENT_ID)
    googleAuthUrl.searchParams.append("redirect_uri", REDIRECT_URI)
    googleAuthUrl.searchParams.append("response_type", "code")
    googleAuthUrl.searchParams.append(
      "scope",
      "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile",
    )
    googleAuthUrl.searchParams.append("access_type", "offline")
    googleAuthUrl.searchParams.append("prompt", "consent")
    googleAuthUrl.searchParams.append("state", state)

    // Redirect to Google's OAuth page
    return NextResponse.redirect(googleAuthUrl.toString())
  } catch (error) {
    console.error("Error initiating OAuth flow:", error)
    return NextResponse.redirect("/dashboard/settings?error=oauth_init_failed")
  }
}
