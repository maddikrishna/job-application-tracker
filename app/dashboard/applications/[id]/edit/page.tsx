export const runtime = 'edge';
import { notFound, redirect } from "next/navigation"
import { getSession, getJobApplicationById } from "@/lib/supabase-server"
import EditApplicationForm from "@/components/applications/edit-application-form"

interface EditApplicationPageProps {
  params: {
    id: string
  }
}

export default async function EditApplicationPage({ params }: EditApplicationPageProps) {
  const session = await getSession()

  // If the user is not logged in, redirect to the login page
  if (!session) {
    redirect("/login")
  }

  const application = await getJobApplicationById(params.id)

  if (!application) {
    notFound()
  }

  // Check if the application belongs to the user
  if (application.user_id !== session.user.id) {
    redirect("/dashboard/applications")
  }

  return (
    <div className="container m-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Edit Application</h1>
      <EditApplicationForm application={application} />
    </div>
  )
}
