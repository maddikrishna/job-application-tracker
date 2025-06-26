export const runtime = 'edge';
import { getJobApplications } from "@/lib/supabase-server"
import ApplicationsList from "@/components/applications/applications-list"

export default async function ApplicationsPage() {
  const applications = await getJobApplications()

  return (
    <div className="container mx-auto py-6 px-4 pb-24 lg:px-0 lg:pb-0 space-y-8">
      <h1 className="text-3xl font-bold mb-6">Job Applications</h1>
      <ApplicationsList applications={applications} />
    </div>
  )
}
