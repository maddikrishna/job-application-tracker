export const runtime = 'edge';
import { getJobApplications, getUserDetails } from "@/lib/supabase-server"
import DashboardOverview from "@/components/dashboard/dashboard-overview"

export default async function DashboardPage() {
  const applications = await getJobApplications()
  const userDetails = await getUserDetails()

  return (
    <div className="container mx-auto py-6 px-4 pb-24 lg:px-0 lg:pb-0 space-y-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <DashboardOverview applications={applications} userDetails={userDetails} />
    </div>
  )
}
