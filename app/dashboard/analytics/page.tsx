import { getJobApplications } from "@/lib/supabase-server"
import AnalyticsDashboard from "@/components/analytics/analytics-dashboard"

export default async function AnalyticsPage() {
  const applications = await getJobApplications()

  return (
    <div className="container mx-auto py-6 px-4 pb-24 lg:px-0 lg:pb-0 space-y-8">
      <h1 className="text-3xl font-bold mb-6">Analytics</h1>
      <AnalyticsDashboard applications={applications} />
    </div>
  )
}
