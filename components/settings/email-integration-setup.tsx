"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Mail, Info } from "lucide-react"

export default function EmailIntegrationSetup() {
  const [connectedEmail, setConnectedEmail] = useState<string | null>(null)
  const searchParams = useSearchParams()

  // Get error and success messages from URL
  const error = searchParams?.get("error")
  const success = searchParams?.get("success")
  const details = searchParams?.get("details")
  const email = searchParams?.get("email")

  useEffect(() => {
    // Check for email in URL params or cookies
    if (email) {
      setConnectedEmail(email)
    } else {
      // Try to get from cookie
      const emailFromCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("gmail_connected_email="))
        ?.split("=")[1]

      if (emailFromCookie) {
        setConnectedEmail(decodeURIComponent(emailFromCookie))
      }
    }
  }, [email])

  const handleConnect = () => {
    window.location.href = "/api/auth/gmail"
  }

  const handleDisconnect = () => {
    // Clear the cookie
    document.cookie = "gmail_connected_email=; path=/; max-age=0"
    setConnectedEmail(null)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Email Integration</CardTitle>
          <CardDescription>Connect your email account to automatically track job applications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Show error message if present */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {error === "token_exchange_failed"
                  ? "Failed to authenticate with Google. Please try again."
                  : error === "invalid_state"
                    ? "Security verification failed. Please try again."
                    : error === "integration_storage_failed"
                      ? "Failed to save integration. Please try again."
                      : `An error occurred: ${error}`}
                {details && <div className="mt-2 text-xs opacity-80">{details}</div>}
              </AlertDescription>
            </Alert>
          )}

          {/* Show success message if present */}
          {success === "gmail_connected" && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Success</AlertTitle>
              <AlertDescription className="text-green-700">
                Gmail integration connected successfully. Your job application emails will now be automatically tracked.
              </AlertDescription>
            </Alert>
          )}

          {/* Preview mode notice */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Preview Mode</AlertTitle>
            <AlertDescription>
              This is running in preview mode. In the actual application, email integrations would be saved to the
              database.
            </AlertDescription>
          </Alert>

          {connectedEmail ? (
            <div className="border p-4 rounded-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Gmail</p>
                    <p className="text-sm text-muted-foreground">{connectedEmail} (Active)</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleDisconnect}>
                  Disconnect
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center">
              <p className="text-muted-foreground mb-4">No email integrations found</p>
              <Button onClick={handleConnect}>Connect Gmail</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email Sync Settings</CardTitle>
          <CardDescription>Configure how your emails are synced and processed</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Coming soon: Configure email sync frequency, filters, and other settings.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
