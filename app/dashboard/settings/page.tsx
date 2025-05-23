import { redirect } from "next/navigation"
import { getSession, getUserDetails, getEmailIntegrations, getPlatformIntegrations } from "@/lib/supabase-server"
import SettingsPage from "@/components/settings/settings-page"

export default async function Settings() {
  const session = await getSession()

  // If the user is not logged in, redirect to the login page
  if (!session) {
    redirect("/login")
  }

  const userDetails = await getUserDetails()
  const emailIntegrations = await getEmailIntegrations()
  const platformIntegrations = await getPlatformIntegrations()

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <SettingsPage
        user={session.user}
        userDetails={userDetails}
        emailIntegrations={emailIntegrations}
        platformIntegrations={platformIntegrations}
      />
    </div>
  )
}
