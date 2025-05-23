import { notFound } from "next/navigation"
import { getJobApplicationById, getApplicationStatusHistory } from "@/lib/supabase-server"
import ApplicationDetail from "@/components/applications/application-detail"

interface ApplicationDetailPageProps {
  params: {
    id: string
  }
}

export default async function ApplicationDetailPage({ params }: ApplicationDetailPageProps) {
  const application = await getJobApplicationById(params.id)
  const statusHistory = await getApplicationStatusHistory(params.id)

  if (!application) {
    notFound()
  }

  return (
    <div className="container m-auto py-6">
      <ApplicationDetail application={application} statusHistory={statusHistory} />
    </div>
  )
}
