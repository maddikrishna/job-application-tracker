// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ""

export async function GET() {
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
      "https://www.googleapis.com/auth/userinfo.profile",
    ]

    // Use the v0 preview URL for testing
    const redirectUri = "https://kzmje1g3tdu7zw4r1lps.lite.vusercontent.net/api/auth/gmail/callback"

    // Construct the Google OAuth authorization URL
    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")
    authUrl.searchParams.append("client_id", GOOGLE_CLIENT_ID)
    authUrl.searchParams.append("redirect_uri", redirectUri)
    authUrl.searchParams.append("response_type", "code")
    authUrl.searchParams.append("scope", SCOPES.join(" "))
    authUrl.searchParams.append("access_type", "offline")
    authUrl.searchParams.append("prompt", "consent")
    authUrl.searchParams.append("state", state)

    // Use basic Response instead of NextResponse
    return Response.redirect(authUrl.toString(), 302)
  } catch (error) {
    console.error("Error in Gmail OAuth route:", error)
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
