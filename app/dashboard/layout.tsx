import type React from "react"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/supabase-server"
import DashboardNav from "@/components/dashboard/dashboard-nav"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  // If the user is not logged in, redirect to the login page
  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardNav user={session.user} />
      <div className="flex-1">{children}</div>
    </div>
  )
}
