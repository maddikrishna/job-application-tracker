"use client"

import { useState } from "react"
import type { User } from "@supabase/supabase-js"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { useSupabase } from "@/components/supabase-provider"
import { toast } from "@/components/ui/use-toast"
import { User as UserIcon, Mail, Calendar, Edit, Save, X } from "lucide-react"

interface ProfilePageProps {
  user: User
  userDetails: any
}

export default function ProfilePage({
  user,
  userDetails,
}: ProfilePageProps) {
  const { supabase } = useSupabase()
  const [fullName, setFullName] = useState(userDetails?.full_name || "")
  const [isEditing, setIsEditing] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [tempName, setTempName] = useState(fullName)

  const getInitials = (name: string, email: string) => {
    if (name && name.trim()) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    }
    return email.substring(0, 2).toUpperCase()
  }

  const handleEdit = () => {
    setTempName(fullName)
    setIsEditing(true)
  }

  const handleCancel = () => {
    setTempName(fullName)
    setIsEditing(false)
  }

  const handleSave = async () => {
    setIsUpdating(true)
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: tempName,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) throw error

      setFullName(tempName)
      setIsEditing(false)
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
      setIsUpdating(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card className="rounded-2xl shadow-md bg-gradient-to-br from-primary/5 to-background">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-white shadow-lg">
              <AvatarFallback className="text-2xl md:text-3xl font-semibold bg-primary text-primary-foreground">
                {getInitials(fullName, user.email || "")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">
                {fullName || "Your Name"}
              </h2>
              <p className="text-lg text-muted-foreground mb-4 flex items-center justify-center md:justify-start gap-2">
                <Mail className="h-4 w-4" />
                {user.email}
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center md:justify-start">
                <Button 
                  onClick={handleEdit}
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit Profile
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Details */}
      <div className="grid gap-6 md:grid-cols-1">
        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-center">
              <UserIcon className="h-5 w-5 text-center" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Your basic profile information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <div className="space-y-2 text-center">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                value={user?.email || ""} 
                disabled 
                className="bg-muted"
              />
            </div>
            <div className="space-y-2 text-center">
              <Label htmlFor="name">Full Name</Label>
              {isEditing ? (
                <div className="flex gap-2">
                  <Input
                    id="name"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    placeholder="Enter your full name"
                  />
                  <Button 
                    onClick={handleSave} 
                    disabled={isUpdating}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {isUpdating ? "Saving..." : "Save"}
                  </Button>
                  <Button 
                    onClick={handleCancel} 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              ) : (
                <Input 
                  id="name" 
                  value={fullName} 
                  disabled 
                  className="bg-muted"
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 