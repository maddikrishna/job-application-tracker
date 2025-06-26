export const runtime = 'edge';
import { redirect } from "next/navigation"
import { getSession } from "@/lib/supabase-server"
import LandingPage from "@/components/landing-page"

export default async function Home() {
  const session = await getSession()

  // If the user is logged in, redirect to the dashboard
  if (session) {
    redirect("/dashboard")
  }

  // Otherwise, show the landing page
  return <LandingPage />
}
