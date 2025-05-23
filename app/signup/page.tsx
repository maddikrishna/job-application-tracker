export const runtime = 'edge';
import { redirect } from "next/navigation"
import { getSession } from "@/lib/supabase-server"
import SignupForm from "@/components/auth/signup-form"

export default async function SignupPage() {
  const session = await getSession()

  // If the user is already logged in, redirect to the dashboard
  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight">Create a new account</h2>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <SignupForm />
        </div>
      </div>
    </div>
  )
}
