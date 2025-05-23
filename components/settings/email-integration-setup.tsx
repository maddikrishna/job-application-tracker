"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Mail, RefreshCw, Settings } from "lucide-react"
import { useSupabase } from "@/components/supabase-provider"
import { toast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

type Integration = {
  id: string;
  provider: string;
  credentials?: { email?: string };
  is_active: boolean;
  last_sync: string | null;
  sync_frequency?: string;
};

export default function EmailIntegrationSetup() {
  const { supabase } = useSupabase()
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const searchParams = useSearchParams()

  // Get error and success messages from URL
  const error = searchParams?.get("error")
  const success = searchParams?.get("success")
  const details = searchParams?.get("details")

  useEffect(() => {
    const fetchIntegrations = async () => {
      try {
        const { data, error } = await supabase
          .from("email_integrations")
          .select("*")
          .order("created_at", { ascending: false })

        if (error) throw error
        setIntegrations(data || [])
      } catch (error) {
        console.error("Error fetching integrations:", error)
        toast({
          title: "Error",
          description: "Failed to load email integrations",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchIntegrations()
  }, [supabase])

  const handleDisconnect = async (id: string) => {
    try {
      const { error } = await supabase.from("email_integrations").update({ is_active: false }).eq("id", id)

      if (error) throw error

      setIntegrations(
        integrations.map((integration) => (integration.id === id ? { ...integration, is_active: false } : integration)),
      )

      toast({
        title: "Integration disconnected",
        description: "Email integration has been disconnected",
      })
    } catch (error) {
      console.error("Error disconnecting integration:", error)
      toast({
        title: "Error",
        description: "Failed to disconnect integration",
        variant: "destructive",
      })
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
          description: `Processed ${data.processedCount} emails, found ${data.jobRelatedCount || 0} job-related emails`,
        })

        // Refresh integrations to update last_sync time
        const { data: updatedIntegrations, error } = await supabase
          .from("email_integrations")
          .select("*")
          .order("created_at", { ascending: false })

        if (!error) {
          setIntegrations(updatedIntegrations || [])
        }
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

  const updateSyncFrequency = async (integrationId: string, frequency: string) => {
    try {
      const { error } = await supabase
        .from("email_integrations")
        .update({ sync_frequency: frequency })
        .eq("id", integrationId)

      if (error) throw error

      setIntegrations(
        integrations.map((integration) =>
          integration.id === integrationId ? { ...integration, sync_frequency: frequency } : integration,
        ),
      )

      toast({
        title: "Sync frequency updated",
        description: `Email sync frequency set to ${frequency}`,
      })
    } catch (error) {
      console.error("Error updating sync frequency:", error)
      toast({
        title: "Error",
        description: "Failed to update sync frequency",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never"
    return new Date(dateString).toLocaleString()
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

          {isLoading ? (
            <div className="py-4 text-center text-muted-foreground">Loading integrations...</div>
          ) : integrations.length > 0 ? (
            <div className="space-y-4">
              {integrations.map((integration) => (
                <div key={integration.id} className="border rounded-lg overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">
                            {integration.provider === "gmail" ? "Gmail" : integration.provider}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {integration.credentials?.email || "Email account"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={integration.is_active}
                          onCheckedChange={async (checked) => {
                            try {
                              const { error } = await supabase
                                .from("email_integrations")
                                .update({ is_active: checked })
                                .eq("id", integration.id)
                              if (error) throw error
                              setIntegrations(
                                integrations.map((i) => (i.id === integration.id ? { ...i, is_active: checked } : i)),
                              )
                              toast({
                                title: checked ? "Integration activated" : "Integration paused",
                                description: checked
                                  ? "Email tracking has been activated"
                                  : "Email tracking has been paused",
                              })
                            } catch (error: unknown) {
                              const err = error as Error
                              console.error("Error updating integration status:", err)
                              toast({
                                title: "Error",
                                description: "Failed to update integration status",
                                variant: "destructive",
                              })
                            }
                          }}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleSync(integration.id)}
                          disabled={isSyncing || !integration.is_active}
                        >
                          <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleDisconnect(integration.id)}>
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium">Last Sync</p>
                        <p className="text-sm text-muted-foreground">{formatDate(integration.last_sync)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Sync Frequency</p>
                        <Select
                          value={integration.sync_frequency || "hourly"}
                          onValueChange={(value) => updateSyncFrequency(integration.id, value)}
                          disabled={!integration.is_active}
                        >
                          <SelectTrigger className="h-8 mt-1 w-full">
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hourly">Hourly</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="manual">Manual Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-4 text-center">
              <p className="text-muted-foreground mb-4">No email integrations found</p>
              <Button onClick={() => (window.location.href = "/api/auth/gmail")}>Connect Gmail</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI Email Processing</CardTitle>
          <CardDescription>How our AI processes your job application emails</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm">
              Our AI system scans your emails to identify job-related communications and automatically:
            </p>

            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>Detects application confirmations, interview invitations, offers, and rejections</li>
              <li>Extracts company names, job titles, and other key information</li>
              <li>Creates new job application entries when you apply via email</li>
              <li>Updates existing applications when new communications arrive</li>
              <li>Organizes all job-related emails in one place for easy reference</li>
            </ul>

            <div className="rounded-md bg-blue-50 p-4 mt-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-blue-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Privacy First</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      We only process emails related to job applications. Your personal emails remain private and are
                      never stored or analyzed.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
