"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { useSupabase } from "@/components/supabase-provider"
import { toast } from "@/components/ui/use-toast"
import { Mail, Linkedin, Brain, AlertTriangle, User as UserIcon, Settings as SettingsIcon, Bell, Palette, MailCheck } from "lucide-react"
import EmailIntegrationSetup from "./email-integration-setup"

interface SettingsPageProps {
  user: User
  userDetails: any
  emailIntegrations: any[]
  platformIntegrations: any[]
}

export default function SettingsPage({
  user,
  userDetails,
  emailIntegrations,
  platformIntegrations,
}: SettingsPageProps) {
  const { supabase } = useSupabase()
  const [fullName, setFullName] = useState(userDetails?.full_name || "")
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState("account")

  // Handle URL parameters for OAuth flow
  useEffect(() => {
    console.log("🔍 [Settings] Checking URL parameters")

    const tab = searchParams?.get("tab")
    const error = searchParams?.get("error")
    const success = searchParams?.get("success")
    const details = searchParams?.get("details")

    console.log(
      `🔍 [Settings] URL params - tab: ${tab || "None"}, error: ${error || "None"}, success: ${success || "None"}, details: ${details || "None"}`,
    )

    // Set the active tab if specified in URL
    if (tab) {
      console.log(`🔍 [Settings] Setting active tab to: ${tab}`)
      setActiveTab(tab)
    }

    if (error) {
      console.error(`❌ [Settings] Error from OAuth flow: ${error}${details ? ` (${details})` : ""}`)
      toast({
        title: "Error",
        description: `Failed to connect: ${error}${details ? ` (${details})` : ""}`,
        variant: "destructive",
      })
    }

    if (success === "gmail_connected") {
      console.log("✅ [Settings] Gmail connected successfully!")
      toast({
        title: "Success",
        description: "Gmail connected successfully!",
      })
    }
  }, [searchParams])

  const handleUpdateProfile = async () => {
    setIsUpdatingProfile(true)
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) throw error

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const handleConnectGmail = () => {
    try {
      console.log("🔍 [OAuth Init] Starting Gmail OAuth connection")

      // Create a direct link to Google's OAuth page
      const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
      if (!GOOGLE_CLIENT_ID) {
        console.error("❌ [OAuth Init] Google OAuth client ID not configured")
        toast({
          title: "Error",
          description: "Google OAuth client ID not configured",
          variant: "destructive",
        })
        return
      }

      console.log(`🔍 [OAuth Init] Using client ID: ${GOOGLE_CLIENT_ID.substring(0, 5)}...`)

      // Generate a simple state
      const state = Math.random().toString(36).substring(2)
      console.log(`🔍 [OAuth Init] Generated state: ${state}`)

      // Define scopes
      const SCOPES = [
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
      ]
      console.log(`🔍 [OAuth Init] Using scopes: ${SCOPES.join(", ")}`)

      // Use the actual deployed URL as the redirect URI
      const redirectUri = "https://v0-job-application-tracker-drab.vercel.app/api/auth/gmail/callback"
      console.log(`🔍 [OAuth Init] Using redirect URI: ${redirectUri}`)

      // Construct the Google OAuth authorization URL
      const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")
      authUrl.searchParams.append("client_id", GOOGLE_CLIENT_ID)
      authUrl.searchParams.append("redirect_uri", redirectUri)
      authUrl.searchParams.append("response_type", "code")
      authUrl.searchParams.append("scope", SCOPES.join(" "))
      authUrl.searchParams.append("access_type", "offline")
      authUrl.searchParams.append("prompt", "consent")
      authUrl.searchParams.append("state", state)

      console.log(`🔍 [OAuth Init] Auth URL created: ${authUrl.toString().substring(0, 100)}...`)
      console.log("✅ [OAuth Init] Redirecting to Google's OAuth page")

      // Redirect to Google's OAuth page
      window.location.href = authUrl.toString()
    } catch (error) {
      console.error(`❌ [OAuth Init] Error navigating to Gmail OAuth: ${error}`)
      toast({
        title: "Error",
        description: "Failed to connect to Gmail. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto py-6 px-4 pb-24 lg:px-0 lg:pb-0 space-y-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8 w-full">
        {/* Mobile: Use Select for tab selection */}
        <div className="block md:hidden mb-6">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="w-full py-3 px-3 rounded-xl text-base font-semibold shadow-md border border-primary/20 bg-background flex items-center gap-2">
              <SelectValue placeholder="Select section" />
            </SelectTrigger>
            <SelectContent className="rounded-xl shadow-lg">
              <SelectItem value="account" className="py-3 px-4 text-base">Account</SelectItem>
              <SelectItem value="integrations" className="py-3 px-4 text-base">Integrations</SelectItem>
              <SelectItem value="email-setup" className="py-3 px-4 text-base">Email Setup</SelectItem>
              <SelectItem value="notifications" className="py-3 px-4 text-base">Notifications</SelectItem>
              <SelectItem value="appearance" className="py-3 px-4 text-base">Appearance</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* Desktop: Use TabsList */}
        <TabsList className="hidden md:inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground mb-8">
           <TabsTrigger value="account">Account</TabsTrigger>
           <TabsTrigger value="integrations">Integrations</TabsTrigger>
           <TabsTrigger value="email-setup">Email Setup</TabsTrigger>
           <TabsTrigger value="notifications">Notifications</TabsTrigger>
           <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>
        {/* Account Section */}
        <TabsContent value="account" className="grid grid-cols-1 gap-6 w-full">
          <Card className="rounded-2xl shadow-md bg-background/80 w-full">
            <CardHeader className="mb-2">
              <CardTitle className="text-lg font-bold text-left">Profile</CardTitle>
              <CardDescription className="text-base text-left">Manage your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 w-full text-left">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user?.email || ""} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <Button onClick={handleUpdateProfile} disabled={isUpdatingProfile} className="w-full py-3 text-base font-semibold rounded-xl">
                {isUpdatingProfile ? "Updating..." : "Update Profile"}
              </Button>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-md bg-background/80 w-full">
            <CardHeader className="mb-2">
              <CardTitle className="text-lg font-bold text-left">Password</CardTitle>
              <CardDescription className="text-base text-left">Change your password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 w-full text-left">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input id="confirm-password" type="password" />
              </div>
              <Button className="w-full py-3 text-base font-semibold rounded-xl">Change Password</Button>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-md bg-background/80 w-full">
            <CardHeader className="mb-2">
              <CardTitle className="text-lg font-bold text-left">Delete Account</CardTitle>
              <CardDescription className="text-base text-left">Permanently delete your account and all your data</CardDescription>
            </CardHeader>
            <CardContent className="w-full text-left">
              <Button variant="destructive" className="w-full py-3 text-base font-semibold rounded-xl">Delete Account</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4 w-full">
          <Card>
            <CardHeader>
              <CardTitle>Email Integration</CardTitle>
              <CardDescription>Connect your email account to automatically track job applications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 w-full">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full">
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Gmail</p>
                    <p className="text-sm text-muted-foreground">
                      {emailIntegrations?.some((i) => i.provider === "gmail") ? "Connected" : "Not connected"}
                    </p>
                  </div>
                </div>
                <Button variant="outline" onClick={handleConnectGmail} className="w-full sm:w-auto">
                  {emailIntegrations?.some((i) => i.provider === "gmail") ? "Manage" : "Connect with Google"}
                </Button>
              </div>
              <Separator />
              <div className="rounded-md bg-muted p-4 flex flex-col sm:flex-row items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">How Email Integration Works</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    When connected, our AI will scan your inbox for job application emails. We only access emails related
                    to job applications and never store your email credentials.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Platform Integrations</CardTitle>
              <CardDescription>Connect job platforms to automatically track applications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Linkedin className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">LinkedIn</p>
                    <p className="text-sm text-muted-foreground">
                      {platformIntegrations?.some((i) => i.platform === "linkedin") ? "Connected" : "Not connected"}
                    </p>
                  </div>
                </div>
                <Button variant="outline">
                  {platformIntegrations?.some((i) => i.platform === "linkedin") ? "Disconnect" : "Connect"}
                </Button>
              </div>
              <Separator />
              <div className="rounded-md bg-muted p-4 flex items-start gap-2">
                <Brain className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">AI-Powered Tracking</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Our AI technology automatically detects when you apply for jobs on connected platforms, eliminating
                    the need for manual tracking.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email-setup" className="space-y-4" id="email-setup-tab">
          <EmailIntegrationSetup />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure how and when you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Application Status Updates</p>
                  <p className="text-sm text-muted-foreground">Get notified when your application status changes</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Follow-up Reminders</p>
                  <p className="text-sm text-muted-foreground">Receive reminders to follow up on applications</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">New Job Recommendations</p>
                  <p className="text-sm text-muted-foreground">Get notified about new job opportunities</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Theme</CardTitle>
              <CardDescription>Customize the appearance of the application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Dark Mode</p>
                  <p className="text-sm text-muted-foreground">Toggle between light and dark mode</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
