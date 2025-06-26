export const runtime = 'edge';
import { redirect } from "next/navigation"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import ConfirmationPage from "@/components/auth/confirmation-page"

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const supabase = createRouteHandlerClient({ cookies })
  
  // Get the token and type from the URL
  const token = searchParams.token as string
  const type = searchParams.type as string

  if (!token || !type) {
    return (
      <ConfirmationPage 
        status="error" 
        message="Invalid confirmation link. Please check your email and try again." 
      />
    )
  }

  try {
    if (type === 'signup') {
      // Confirm the email
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'signup',
      })

      if (error) {
        console.error('Email confirmation error:', error)
        return (
          <ConfirmationPage 
            status="error" 
            message="Failed to confirm your email. Please try again or contact support." 
          />
        )
      }

      // Email confirmed successfully
      return (
        <ConfirmationPage 
          status="success" 
          message="Your email has been confirmed successfully! You can now sign in to your account." 
        />
      )
    } else if (type === 'recovery') {
      // Handle password recovery
      return (
        <ConfirmationPage 
          status="info" 
          message="Password recovery link received. You can now reset your password." 
        />
      )
    } else {
      return (
        <ConfirmationPage 
          status="error" 
          message="Invalid confirmation type. Please check your email and try again." 
        />
      )
    }
  } catch (error) {
    console.error('Confirmation error:', error)
    return (
      <ConfirmationPage 
        status="error" 
        message="An unexpected error occurred. Please try again." 
      />
    )
  }
} 