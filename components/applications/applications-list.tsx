"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Briefcase,
  Building,
  Calendar,
  MapPin,
  Star,
  PlusCircle,
  Search,
  Filter,
  SortAsc,
  SortDesc,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useSupabase } from "@/components/supabase-provider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface JobApplication {
  id: string
  job_title: string
  company_name: string
  status: string
  applied_date: string
  location: string | null
  remote: boolean | null
  is_favorite: boolean | null
  source: string
}

interface ApplicationsListProps {
  applications: JobApplication[]
}

export default function ApplicationsList({ applications: initialApplications }: ApplicationsListProps) {
  const { supabase } = useSupabase()
  const [applications, setApplications] = useState<JobApplication[]>(initialApplications || [])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortField, setSortField] = useState<string>("applied_date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

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

  const filteredApplications = applications
    .filter(
      (app) =>
        (app.job_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          app.company_name.toLowerCase().includes(searchQuery.toLowerCase())) &&
        (statusFilter === "all" || app.status === statusFilter),
    )
    .sort((a, b) => {
      if (sortField === "applied_date") {
        return sortDirection === "asc"
          ? new Date(a.applied_date).getTime() - new Date(b.applied_date).getTime()
          : new Date(b.applied_date).getTime() - new Date(a.applied_date).getTime()
      } else if (sortField === "company_name") {
        return sortDirection === "asc"
          ? a.company_name.localeCompare(b.company_name)
          : b.company_name.localeCompare(a.company_name)
      } else if (sortField === "job_title") {
        return sortDirection === "asc" ? a.job_title.localeCompare(b.job_title) : b.job_title.localeCompare(a.job_title)
      }
      return 0
    })

  const toggleSortDirection = () => {
    setSortDirection(sortDirection === "asc" ? "desc" : "asc")
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-2xl font-bold">All Applications</h2>
          <Badge variant="outline">{applications.length}</Badge>
        </div>
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
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

      <div className="flex flex-col md:flex-row gap-2 justify-between">
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] py-3 px-4 rounded-xl text-base font-semibold shadow-md border-2 border-primary/20 bg-background flex items-center gap-2">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="rounded-xl shadow-lg">
              <SelectItem value="all" className="flex items-center gap-2 py-3 px-4 text-base">All Statuses</SelectItem>
              <SelectItem value="saved" className="flex items-center gap-2 py-3 px-4 text-base">Saved</SelectItem>
              <SelectItem value="applied" className="flex items-center gap-2 py-3 px-4 text-base">Applied</SelectItem>
              <SelectItem value="interview" className="flex items-center gap-2 py-3 px-4 text-base">Interview</SelectItem>
              <SelectItem value="offer" className="flex items-center gap-2 py-3 px-4 text-base">Offer</SelectItem>
              <SelectItem value="rejected" className="flex items-center gap-2 py-3 px-4 text-base">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>More Filters</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Filter By</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>Remote Only</DropdownMenuItem>
                <DropdownMenuItem>Favorites Only</DropdownMenuItem>
                <DropdownMenuItem>Source</DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <Select value={sortField} onValueChange={setSortField}>
            <SelectTrigger className="w-[180px] py-3 px-4 rounded-xl text-base font-semibold shadow-md border-2 border-primary/20 bg-background flex items-center gap-2">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="rounded-xl shadow-lg">
              <SelectItem value="applied_date" className="flex items-center gap-2 py-3 px-4 text-base">Date Applied</SelectItem>
              <SelectItem value="company_name" className="flex items-center gap-2 py-3 px-4 text-base">Company Name</SelectItem>
              <SelectItem value="job_title" className="flex items-center gap-2 py-3 px-4 text-base">Job Title</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={toggleSortDirection}>
            {sortDirection === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
          </Button>
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
            <p className="text-muted-foreground mb-4">Try adjusting your search query or filters</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setSearchQuery("")}>
                Clear Search
              </Button>
              <Button variant="outline" onClick={() => setStatusFilter("all")}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 mt-4 grid-cols-1">
          {filteredApplications.map((application) => (
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
                      <Badge variant="outline">{application.source}</Badge>
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
        </div>
      )}
    </div>
  )
}
