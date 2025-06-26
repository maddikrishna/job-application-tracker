"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Info, Mail, ArrowRight, Home } from "lucide-react"

interface ConfirmationPageProps {
  status: 'success' | 'error' | 'info'
  message: string
}

export default function ConfirmationPage({ status, message }: ConfirmationPageProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-12 w-12 text-green-500" />
      case 'error':
        return <XCircle className="h-12 w-12 text-red-500" />
      case 'info':
        return <Info className="h-12 w-12 text-blue-500" />
      default:
        return <Mail className="h-12 w-12 text-gray-500" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'border-green-200 bg-green-50'
      case 'error':
        return 'border-red-200 bg-red-50'
      case 'info':
        return 'border-blue-200 bg-blue-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  const getStatusTitle = () => {
    switch (status) {
      case 'success':
        return 'Email Confirmed!'
      case 'error':
        return 'Confirmation Failed'
      case 'info':
        return 'Confirmation Link Received'
      default:
        return 'Email Confirmation'
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2">
            <Mail className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">JobTrackr</span>
          </div>
        </div>
      </div>
      
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {getStatusIcon()}
            </div>
            <CardTitle className="text-2xl font-bold">
              {getStatusTitle()}
            </CardTitle>
            <CardDescription className="text-base">
              {message}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <Alert className={getStatusColor()}>
              <AlertDescription className="text-center">
                {status === 'success' && (
                  <div className="space-y-4">
                    <p>Your account has been successfully created and verified.</p>
                    <p className="text-sm text-green-600">
                      You can now sign in and start tracking your job applications.
                    </p>
                  </div>
                )}
                {status === 'error' && (
                  <div className="space-y-4">
                    <p>We couldn't confirm your email address.</p>
                    <p className="text-sm text-red-600">
                      Please check your email for the correct confirmation link or try signing up again.
                    </p>
                  </div>
                )}
                {status === 'info' && (
                  <div className="space-y-4">
                    <p>Your confirmation link has been received.</p>
                    <p className="text-sm text-blue-600">
                      Please follow the instructions in your email to complete the process.
                    </p>
                  </div>
                )}
              </AlertDescription>
            </Alert>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              {status === 'success' && (
                <>
                  <Link href="/login" className="flex-1">
                    <Button className="w-full flex items-center gap-2">
                      Sign In
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/dashboard" className="flex-1">
                    <Button variant="outline" className="w-full flex items-center gap-2">
                      Go to Dashboard
                      <Home className="h-4 w-4" />
                    </Button>
                  </Link>
                </>
              )}
              
              {status === 'error' && (
                <>
                  <Link href="/signup" className="flex-1">
                    <Button className="w-full flex items-center gap-2">
                      Try Again
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/" className="flex-1">
                    <Button variant="outline" className="w-full flex items-center gap-2">
                      Go Home
                      <Home className="h-4 w-4" />
                    </Button>
                  </Link>
                </>
              )}
              
              {status === 'info' && (
                <>
                  <Link href="/login" className="flex-1">
                    <Button className="w-full flex items-center gap-2">
                      Sign In
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/" className="flex-1">
                    <Button variant="outline" className="w-full flex items-center gap-2">
                      Go Home
                      <Home className="h-4 w-4" />
                    </Button>
                  </Link>
                </>
              )}
            </div>

            <div className="text-center pt-4">
              <p className="text-sm text-muted-foreground">
                Need help?{' '}
                <Link href="/contact" className="text-primary hover:underline">
                  Contact support
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 