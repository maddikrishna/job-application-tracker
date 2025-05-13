import { redirect } from "next/navigation"
import { getSession } from "@/lib/supabase-server"
import NotificationsPage from "@/components/notifications/notifications-page"

export default async function Notifications() {
  const session = await getSession()

  // If the user is not logged in, redirect to the login page
  if (!session) {
    redirect("/login")
  }

  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">Notifications</h1>
      <NotificationsPage userId={session.user.id} />
    </div>
  )
}
