"use client"

import { useState } from "react"
import type { User } from "@supabase/supabase-js"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { useSupabase } from "@/components/supabase-provider"
import { toast } from "@/components/ui/use-toast"
import { Mail, Linkedin, Brain, AlertTriangle } from "lucide-react"
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
      // Use a simple window.location.href to navigate to the OAuth endpoint
      window.location.href = "/api/auth/gmail"
    } catch (error) {
      console.error("Error navigating to Gmail OAuth:", error)
      toast({
        title: "Error",
        description: "Failed to connect to Gmail. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Tabs defaultValue="account" className="space-y-4">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="integrations">Integrations</TabsTrigger>
        <TabsTrigger value="email-setup">Email Setup</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
        <TabsTrigger value="appearance">Appearance</TabsTrigger>
      </TabsList>

      <TabsContent value="account" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Manage your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user.email} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <Button onClick={handleUpdateProfile} disabled={isUpdatingProfile}>
              {isUpdatingProfile ? "Updating..." : "Update Profile"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>Change your password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
            <Button>Change Password</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Delete Account</CardTitle>
            <CardDescription>Permanently delete your account and all your data</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive">Delete Account</Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="integrations" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Email Integration</CardTitle>
            <CardDescription>Connect your email account to automatically track job applications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Gmail</p>
                  <p className="text-sm text-muted-foreground">
                    {emailIntegrations.some((i) => i.provider === "gmail") ? "Connected" : "Not connected"}
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={handleConnectGmail}>
                {emailIntegrations.some((i) => i.provider === "gmail") ? "Manage" : "Connect with Google"}
              </Button>
            </div>
            <Separator />
            <div className="rounded-md bg-muted p-4 flex items-start gap-2">
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
                    {platformIntegrations.some((i) => i.platform === "linkedin") ? "Connected" : "Not connected"}
                  </p>
                </div>
              </div>
              <Button variant="outline">
                {platformIntegrations.some((i) => i.platform === "linkedin") ? "Disconnect" : "Connect"}
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
  )
}
