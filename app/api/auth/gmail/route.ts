import { NextResponse, NextRequest } from "next/server"

export const runtime = 'edge';

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ""

export async function GET(request: NextRequest) {
  try {
    // Basic validation
    if (!GOOGLE_CLIENT_ID) {
      return new Response(JSON.stringify({ error: "Google OAuth credentials not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Generate a simple state
    const state = Math.random().toString(36).substring(2)

    // Define scopes
    const SCOPES = [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/gmail.labels",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.modify",
      "https://www.googleapis.com/auth/gmail.compose",
    ]

    // Dynamically determine redirectUri based on request
    const protocol = request.headers.get("x-forwarded-proto") || "http"
    const host = request.headers.get("host")
    const redirectUri = `${protocol}://${host}/api/auth/gmail/callback`
    console.log('[Google OAuth] Using redirectUri:', redirectUri)

    // Construct the Google OAuth authorization URL
    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")
    authUrl.searchParams.append("client_id", GOOGLE_CLIENT_ID)
    authUrl.searchParams.append("redirect_uri", redirectUri)
    authUrl.searchParams.append("response_type", "code")
    authUrl.searchParams.append("scope", SCOPES.join(" "))
    authUrl.searchParams.append("access_type", "offline")
    authUrl.searchParams.append("prompt", "consent")
    authUrl.searchParams.append("state", state)
    authUrl.searchParams.append("include_granted_scopes", "true")

    // Use NextResponse for Edge compatibility
    return NextResponse.redirect(authUrl.toString(), 302)
  } catch (error) {
    console.error("Error in Gmail OAuth route:", error)
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
