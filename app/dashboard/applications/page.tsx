import { getJobApplications } from "@/lib/supabase-server"
import ApplicationsList from "@/components/applications/applications-list"

export default async function ApplicationsPage() {
  const applications = await getJobApplications()

  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">Job Applications</h1>
      <ApplicationsList applications={applications} />
    </div>
  )
}
