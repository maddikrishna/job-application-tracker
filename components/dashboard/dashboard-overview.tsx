"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Briefcase,
  Building,
  Calendar,
  Clock,
  MapPin,
  Star,
  StarOff,
  PlusCircle,
  Search,
  Settings,
  LineChart,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useSupabase } from "@/components/supabase-provider"
import { useRouter } from "next/navigation"

interface JobApplication {
  id: string
  job_title: string
  company_name: string
  status: string
  applied_date: string
  location: string | null
  remote: boolean | null
  is_favorite: boolean | null
}

interface DashboardOverviewProps {
  applications: JobApplication[]
  userDetails: any
}

export default function DashboardOverview({ applications: initialApplications, userDetails }: DashboardOverviewProps) {
  const router = useRouter()
  const { supabase } = useSupabase()
  const [applications, setApplications] = useState<JobApplication[]>(initialApplications || [])
  const [searchQuery, setSearchQuery] = useState("")

  const filteredApplications = applications.filter(
    (app) =>
      app.job_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.company_name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const applicationsByStatus = {
    applied: applications.filter((app) => app.status === "applied").length,
    interview: applications.filter((app) => app.status === "interview").length,
    offer: applications.filter((app) => app.status === "offer").length,
    rejected: applications.filter((app) => app.status === "rejected").length,
    saved: applications.filter((app) => app.status === "saved").length,
  }

  const toggleFavorite = async (id: string, currentValue: boolean | null) => {
    try {
      const { error } = await supabase.from("job_applications").update({ is_favorite: !currentValue }).eq("id", id)

      if (error) throw error

      setApplications(applications.map((app) => (app.id === id ? { ...app, is_favorite: !app.is_favorite } : app)))
    } catch (error) {
      console.error("Error updating favorite status:", error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date)
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "applied":
        return "job-status-applied"
      case "interview":
        return "job-status-interview"
      case "offer":
        return "job-status-offer"
      case "rejected":
        return "job-status-rejected"
      case "saved":
        return "job-status-saved"
      default:
        return ""
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{applications.length}</div>
            <p className="text-xs text-muted-foreground">
              {applications.length > 0
                ? `Last application on ${formatDate(applications[0].applied_date)}`
                : "No applications yet"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applications in Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{applicationsByStatus.applied + applicationsByStatus.interview}</div>
            <p className="text-xs text-muted-foreground">{applicationsByStatus.interview} in interview stage</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offers Received</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{applicationsByStatus.offer}</div>
            <p className="text-xs text-muted-foreground">
              {((applicationsByStatus.offer / (applications.length || 1)) * 100).toFixed(1)}% success rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejection Rate</CardTitle>
            <StarOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((applicationsByStatus.rejected / (applications.length || 1)) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">{applicationsByStatus.rejected} applications rejected</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold">Recent Applications</h2>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search applications..."
                className="pl-8 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Link href="/dashboard/applications/new">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Application
              </Button>
            </Link>
          </div>
        </div>

        {applications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">No applications yet</h3>
              <p className="text-muted-foreground mb-4 text-center">
                Start tracking your job applications to get insights and stay organized
              </p>
              <Link href="/dashboard/applications/new">
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Your First Application
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : filteredApplications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">No matching applications</h3>
              <p className="text-muted-foreground mb-4">Try adjusting your search query</p>
              <Button variant="outline" onClick={() => setSearchQuery("")}>
                Clear Search
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredApplications.slice(0, 5).map((application) => (
              <Card key={application.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold mb-1">
                            <Link href={`/dashboard/applications/${application.id}`} className="hover:underline">
                              {application.job_title}
                            </Link>
                          </h3>
                          <div className="flex items-center text-muted-foreground mb-2">
                            <Building className="h-4 w-4 mr-1" />
                            <span>{application.company_name}</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleFavorite(application.id, application.is_favorite)}
                          className="text-muted-foreground hover:text-yellow-500"
                        >
                          {application.is_favorite ? (
                            <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                          ) : (
                            <Star className="h-5 w-5" />
                          )}
                          <span className="sr-only">Toggle favorite</span>
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge className={getStatusBadgeClass(application.status)}>
                          {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                        </Badge>
                        {application.location && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {application.location}
                          </Badge>
                        )}
                        {application.remote && <Badge variant="outline">Remote</Badge>}
                      </div>
                    </div>
                    <div className="flex items-center justify-between md:justify-end gap-4 p-4 md:p-6 bg-muted/50 md:w-48">
                      <div className="flex flex-col">
                        <div className="flex items-center text-sm text-muted-foreground mb-1">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>Applied</span>
                        </div>
                        <div className="font-medium">{formatDate(application.applied_date)}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredApplications.length > 5 && (
              <div className="flex justify-center">
                <Link href="/dashboard/applications">
                  <Button variant="outline">View All Applications</Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>AI Integration Status</CardTitle>
            <CardDescription>Configure AI to automatically track your job applications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500"></div>
                  <span className="font-medium">Email Integration</span>
                </div>
                <Link href="/dashboard/settings?tab=email-setup">
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </Link>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500"></div>
                  <span className="font-medium">LinkedIn Integration</span>
                </div>
                <Link href="/dashboard/settings/integrations">
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/dashboard/applications/new">
                <Button variant="outline" className="w-full justify-start">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Application
                </Button>
              </Link>
              <Link href="/dashboard/settings/integrations">
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="mr-2 h-4 w-4" />
                  Configure AI
                </Button>
              </Link>
              <Link href="/dashboard/analytics">
                <Button variant="outline" className="w-full justify-start">
                  <LineChart className="mr-2 h-4 w-4" />
                  View Analytics
                </Button>
              </Link>
              <Link href="/dashboard/applications">
                <Button variant="outline" className="w-full justify-start">
                  <Briefcase className="mr-2 h-4 w-4" />
                  All Applications
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
