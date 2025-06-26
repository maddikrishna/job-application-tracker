import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const error = request.nextUrl.searchParams.get("error");

  // Debug logging
  console.log("LinkedIn OAuth Callback - Environment variables check:");
  console.log("LINKEDIN_CLIENT_ID:", process.env.LINKEDIN_CLIENT_ID ? "Set" : "NOT SET");
  console.log("LINKEDIN_CLIENT_SECRET:", process.env.LINKEDIN_CLIENT_SECRET ? "Set" : "NOT SET");
  console.log("NEXT_PUBLIC_LINKEDIN_REDIRECT_URI:", process.env.NEXT_PUBLIC_LINKEDIN_REDIRECT_URI ? "Set" : "NOT SET");

  if (error) {
    console.error("LinkedIn OAuth error:", error);
    return NextResponse.redirect(`/dashboard/settings?tab=integrations&error=${error}`);
  }

  if (!code) {
    console.error("LinkedIn OAuth: No authorization code received");
    return NextResponse.redirect(`/dashboard/settings?tab=integrations&error=no_code`);
  }

  // Validate environment variables
  if (!process.env.LINKEDIN_CLIENT_ID) {
    console.error("LinkedIn OAuth: LINKEDIN_CLIENT_ID not configured");
    return NextResponse.redirect(`/dashboard/settings?tab=integrations&error=client_id_missing`);
  }

  if (!process.env.LINKEDIN_CLIENT_SECRET) {
    console.error("LinkedIn OAuth: LINKEDIN_CLIENT_SECRET not configured");
    return NextResponse.redirect(`/dashboard/settings?tab=integrations&error=client_secret_missing`);
  }

  if (!process.env.NEXT_PUBLIC_LINKEDIN_REDIRECT_URI) {
    console.error("LinkedIn OAuth: NEXT_PUBLIC_LINKEDIN_REDIRECT_URI not configured");
    return NextResponse.redirect(`/dashboard/settings?tab=integrations&error=redirect_uri_missing`);
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.NEXT_PUBLIC_LINKEDIN_REDIRECT_URI,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
      }),
    });

    const tokenData = await tokenRes.json();
    console.log("LinkedIn token response:", tokenData);

    if (!tokenData.access_token) {
      console.error("LinkedIn OAuth: Token exchange failed:", tokenData);
      return NextResponse.redirect(`/dashboard/settings?tab=integrations&error=token_exchange_failed`);
    }

    // Fetch LinkedIn profile
    const profileRes = await fetch("https://api.linkedin.com/v2/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json();
    console.log("LinkedIn profile:", profile);

    // Fetch LinkedIn email
    const emailRes = await fetch(
      "https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))",
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
    );
    const emailData = await emailRes.json();
    const email = emailData.elements?.[0]?.["handle~"]?.emailAddress;
    console.log("LinkedIn email:", email);

    // Redirect to settings with success and profile info
    const profileName = profile.localizedFirstName && profile.localizedLastName 
      ? `${profile.localizedFirstName} ${profile.localizedLastName}`
      : "LinkedIn User";
    
    return NextResponse.redirect(
      `/dashboard/settings?tab=integrations&success=linkedin_connected&name=${encodeURIComponent(profileName)}&email=${encodeURIComponent(email || "")}`
    );
  } catch (error) {
    console.error("LinkedIn OAuth callback error:", error);
    return NextResponse.redirect(`/dashboard/settings?tab=integrations&error=unexpected_error&details=${encodeURIComponent(String(error))}`);
  }
} 