import type React from "react"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/supabase-server"
import DashboardNav from "@/components/dashboard/dashboard-nav"
import BottomNavClientWrapper from "@/components/dashboard/BottomNavClientWrapper"

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
      <div className="flex-1 pt-20">{children}</div>
      <BottomNavClientWrapper />
    </div>
  )
}
