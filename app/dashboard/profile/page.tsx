export const runtime = 'edge';
import { redirect } from "next/navigation"
import { getSession, getUserDetails } from "@/lib/supabase-server"
import ProfilePage from "@/components/profile/profile-page"

export default async function Profile() {
  const session = await getSession()

  // If the user is not logged in, redirect to the login page
  if (!session) {
    redirect("/login")
  }

  const userDetails = await getUserDetails()

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Profile</h1>
      <ProfilePage
        user={session.user}
        userDetails={userDetails}
      />
    </div>
  )
} 