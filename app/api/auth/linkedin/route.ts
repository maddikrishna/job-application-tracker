import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Debug logging
  console.log("LinkedIn OAuth Init - Environment variables check:");
  console.log("LINKEDIN_CLIENT_ID:", process.env.LINKEDIN_CLIENT_ID ? "Set" : "NOT SET");
  console.log("NEXT_PUBLIC_LINKEDIN_REDIRECT_URI:", process.env.NEXT_PUBLIC_LINKEDIN_REDIRECT_URI ? "Set" : "NOT SET");

  // Validate environment variables
  if (!process.env.LINKEDIN_CLIENT_ID) {
    console.error("LinkedIn OAuth: LINKEDIN_CLIENT_ID not configured");
    return NextResponse.redirect(`/dashboard/settings?tab=integrations&error=client_id_missing`);
  }

  if (!process.env.NEXT_PUBLIC_LINKEDIN_REDIRECT_URI) {
    console.error("LinkedIn OAuth: NEXT_PUBLIC_LINKEDIN_REDIRECT_URI not configured");
    return NextResponse.redirect(`/dashboard/settings?tab=integrations&error=redirect_uri_missing`);
  }

  try {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_LINKEDIN_REDIRECT_URI;
    const state = Math.random().toString(36).substring(2);
    const scope = "r_liteprofile r_emailaddress";

    console.log("LinkedIn OAuth Init - Creating auth URL with:");
    console.log("Client ID:", clientId.substring(0, 5) + "...");
    console.log("Redirect URI:", redirectUri);
    console.log("State:", state);

    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${encodeURIComponent(scope)}`;

    console.log("LinkedIn OAuth Init - Redirecting to LinkedIn");
    return NextResponse.redirect(authUrl, 302);
  } catch (error) {
    console.error("LinkedIn OAuth Init error:", error);
    return NextResponse.redirect(`/dashboard/settings?tab=integrations&error=init_failed&details=${encodeURIComponent(String(error))}`);
  }
} 