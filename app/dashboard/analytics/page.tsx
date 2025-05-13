import { getJobApplications } from "@/lib/supabase-server"
import AnalyticsDashboard from "@/components/analytics/analytics-dashboard"

export default async function AnalyticsPage() {
  const applications = await getJobApplications()

  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">Analytics</h1>
      <AnalyticsDashboard applications={applications} />
    </div>
  )
}
