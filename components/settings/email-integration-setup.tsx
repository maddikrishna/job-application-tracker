"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/supabase-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Mail, Trash2, RefreshCw, AlertTriangle } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface EmailIntegration {
  id: string
  provider: string
  is_active: boolean
  last_sync: string | null
  sync_frequency: string
}

export default function EmailIntegrationSetup() {
  const router = useRouter()
  const { supabase } = useSupabase()
  const [integrations, setIntegrations] = useState<EmailIntegration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [provider, setProvider] = useState("gmail")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [syncFrequency, setSyncFrequency] = useState("hourly")

  useEffect(() => {
    fetchIntegrations()
  }, [])

  // Add this useEffect to check for success or error messages in the URL
  useEffect(() => {
    const url = new URL(window.location.href)
    const success = url.searchParams.get("success")
    const error = url.searchParams.get("error")

    if (success === "gmail_connected") {
      toast({
        title: "Gmail connected successfully",
        description: "Your Gmail account has been connected for job tracking",
      })
      fetchIntegrations()

      // Remove the query parameter
      url.searchParams.delete("success")
      window.history.replaceState({}, "", url.toString())
    }

    if (error) {
      let errorMessage = "An error occurred while connecting your email account"

      switch (error) {
        case "missing_code":
          errorMessage = "Authorization code was missing from the callback"
          break
        case "auth_required":
          errorMessage = "You need to be logged in to connect your email account"
          break
        case "db_error":
          errorMessage = "There was an error storing your email credentials"
          break
        case "server_error":
          errorMessage = "An unexpected server error occurred"
          break
      }

      setError(errorMessage)

      // Remove the query parameter
      url.searchParams.delete("error")
      window.history.replaceState({}, "", url.toString())
    }
  }, [])

  const fetchIntegrations = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/email-integration")
      const data = await response.json()

      if (data.success) {
        setIntegrations(data.integrations || [])
      } else {
        setError(data.error || "Failed to fetch integrations")
      }
    } catch (error) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // Update the handleConnect function to use OAuth for Gmail
  const handleConnect = async () => {
    setIsConnecting(true)
    setError(null)

    try {
      if (provider === "gmail") {
        // For Gmail, we'll use OAuth 2.0
        // In a real implementation, this would redirect to Google's OAuth consent screen
        // For demo purposes, we'll simulate this with a direct redirect

        // Generate a random state parameter for security
        const state = Math.random().toString(36).substring(2, 15)

        // Store the state in localStorage to verify when the user returns
        localStorage.setItem("oauth_state", state)

        // Redirect to Google's OAuth consent screen
        // In a real implementation, you would use proper OAuth parameters
        const redirectUrl = `/api/auth/gmail/callback`
        const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(window.location.origin + redirectUrl)}&response_type=code&scope=https://www.googleapis.com/auth/gmail.readonly&state=${state}&access_type=offline&prompt=consent`

        window.location.href = googleAuthUrl
        return
      } else {
        // For other providers, use the existing email/password approach
        const response = await fetch("/api/email-integration", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            provider,
            credentials: {
              email,
              password, // In a real app, this would be an OAuth token, not a password
            },
            syncFrequency,
          }),
        })

        const data = await response.json()

        if (data.success) {
          toast({
            title: "Email connected successfully",
            description: "Your email account has been connected for job tracking",
          })
          setEmail("")
          setPassword("")
          fetchIntegrations()
        } else {
          setError(data.error || "Failed to connect email account")
        }
      }
    } catch (error) {
      setError("An unexpected error occurred")
    } finally {
      setIsConnecting(false)
    }
  }

  const handleSync = async (integrationId: string) => {
    setIsSyncing(true)
    try {
      const response = await fetch("/api/email-sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          integrationId,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Email sync completed",
          description: `Processed ${data.processedCount} emails`,
        })
        fetchIntegrations()
      } else {
        toast({
          title: "Sync failed",
          description: data.error || "Failed to sync emails",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Sync failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSyncing(false)
    }
  }

  const handleDelete = async (integrationId: string) => {
    try {
      const response = await fetch(`/api/email-integration?id=${integrationId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Integration removed",
          description: "Your email integration has been removed",
        })
        fetchIntegrations()
      } else {
        toast({
          title: "Removal failed",
          description: data.error || "Failed to remove integration",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Removal failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  const toggleActive = async (integration: EmailIntegration) => {
    try {
      const { error } = await supabase
        .from("email_integrations")
        .update({ is_active: !integration.is_active })
        .eq("id", integration.id)

      if (error) throw error

      setIntegrations(integrations.map((i) => (i.id === integration.id ? { ...i, is_active: !i.is_active } : i)))

      toast({
        title: integration.is_active ? "Integration paused" : "Integration activated",
        description: integration.is_active ? "Email tracking has been paused" : "Email tracking has been activated",
      })
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update integration status",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never"
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Email Integrations</CardTitle>
          <CardDescription>Connect your email accounts to automatically track job applications</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : integrations.length === 0 ? (
            <div className="text-center py-4">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No email accounts connected</h3>
              <p className="text-muted-foreground mb-4">
                Connect your email account to automatically track job applications
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {integrations.map((integration) => (
                <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">{integration.provider.toUpperCase()}</p>
                      <p className="text-sm text-muted-foreground">Last sync: {formatDate(integration.last_sync)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={integration.is_active} onCheckedChange={() => toggleActive(integration)} />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleSync(integration.id)}
                      disabled={isSyncing || !integration.is_active}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => handleDelete(integration.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Connect New Email Account</CardTitle>
          <CardDescription>Add a new email account for job application tracking</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="provider">Email Provider</Label>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gmail">Gmail</SelectItem>
                  <SelectItem value="outlook">Outlook</SelectItem>
                  <SelectItem value="yahoo">Yahoo Mail</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <p className="text-xs text-muted-foreground">
                Note: In a real application, we would use OAuth2 for secure authentication without storing your
                password.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="syncFrequency">Sync Frequency</Label>
              <Select value={syncFrequency} onValueChange={setSyncFrequency}>
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="manual">Manual Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md bg-muted p-4 flex items-start gap-2 mt-4">
              <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">How Email Integration Works</p>
                <p className="text-sm text-muted-foreground mt-1">
                  When connected, our AI will scan your inbox for job application emails. We only access emails related
                  to job applications and never store your email credentials.
                </p>
              </div>
            </div>

            <Button onClick={handleConnect} disabled={isConnecting || !email || !password} className="w-full">
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Connect Email Account"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
