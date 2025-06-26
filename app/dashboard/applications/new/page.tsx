export const runtime = 'edge';
import { redirect } from "next/navigation"
import { getSession } from "@/lib/supabase-server"
import NewApplicationForm from "@/components/applications/new-application-form"

export default async function NewApplicationPage() {
  const session = await getSession()

  // If the user is not logged in, redirect to the login page
  if (!session) {
    redirect("/login")
  }

  return (
    <div className="container m-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Add New Application</h1>
      <NewApplicationForm userId={session.user.id} />
    </div>
  )
}
