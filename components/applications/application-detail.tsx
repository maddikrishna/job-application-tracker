"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/supabase-provider"
import {
  Building,
  Calendar,
  MapPin,
  Star,
  ExternalLink,
  Edit,
  Trash2,
  Clock,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Briefcase,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import ApplicationEmails from "./application-emails"

interface ApplicationDetailProps {
  application: any
  statusHistory: any[]
}

export default function ApplicationDetail({
  application,
  statusHistory: initialStatusHistory,
}: ApplicationDetailProps) {
  const router = useRouter()
  const { supabase } = useSupabase()
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [newStatus, setNewStatus] = useState(application.status)
  const [statusNote, setStatusNote] = useState("")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [statusHistory, setStatusHistory] = useState(initialStatusHistory)
  const [isFavorite, setIsFavorite] = useState(application.is_favorite)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
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

  const handleStatusUpdate = async () => {
    if (newStatus === application.status && !statusNote) return

    setIsUpdatingStatus(true)
    try {
      // Update the application status
      const { error: updateError } = await supabase
        .from("job_applications")
        .update({
          status: newStatus,
          last_updated: new Date().toISOString(),
        })
        .eq("id", application.id)

      if (updateError) throw updateError

      // Add status history entry
      const { data, error: historyError } = await supabase
        .from("application_status_history")
        .insert({
          application_id: application.id,
          status: newStatus,
          notes: statusNote || `Status changed to ${newStatus}`,
        })
        .select()

      if (historyError) throw historyError

      // Update local state
      setStatusHistory([data[0], ...statusHistory])
      setStatusNote("")
      toast({
        title: "Status updated",
        description: `Application status updated to ${newStatus}`,
      })
      router.refresh()
    } catch (error) {
      console.error("Error updating status:", error)
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const { error } = await supabase.from("job_applications").delete().eq("id", application.id)

      if (error) throw error

      toast({
        title: "Application deleted",
        description: "The job application has been deleted successfully",
      })
      router.push("/dashboard/applications")
      router.refresh()
    } catch (error) {
      console.error("Error deleting application:", error)
      toast({
        title: "Error",
        description: "Failed to delete application. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  const toggleFavorite = async () => {
    try {
      const { error } = await supabase
        .from("job_applications")
        .update({ is_favorite: !isFavorite })
        .eq("id", application.id)

      if (error) throw error

      setIsFavorite(!isFavorite)
      toast({
        title: isFavorite ? "Removed from favorites" : "Added to favorites",
        description: isFavorite ? "Application removed from favorites" : "Application added to favorites",
      })
    } catch (error) {
      console.error("Error updating favorite status:", error)
      toast({
        title: "Error",
        description: "Failed to update favorite status. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{application.job_title}</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFavorite}
            className="text-muted-foreground hover:text-yellow-500"
          >
            {isFavorite ? <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" /> : <Star className="h-5 w-5" />}
            <span className="sr-only">Toggle favorite</span>
          </Button>
          <Link href={`/dashboard/applications/${application.id}/edit`}>
            <Button variant="outline" size="icon">
              <Edit className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
          </Link>
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon">
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Application</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this job application? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{application.company_name}</CardTitle>
                  <div className="flex items-center text-muted-foreground mt-1">
                    <Building className="h-4 w-4 mr-1" />
                    <span>{application.company_name}</span>
                  </div>
                </div>
                <Badge className={getStatusBadgeClass(application.status)}>
                  {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="details">
                <TabsList className="mb-4">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="description">Job Description</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                  <TabsTrigger value="emails">Emails</TabsTrigger>
                </TabsList>
                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-2">
                      <Calendar className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Applied Date</p>
                        <p className="text-muted-foreground">{formatDate(application.applied_date)}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Last Updated</p>
                        <p className="text-muted-foreground">{formatDate(application.last_updated)}</p>
                      </div>
                    </div>
                    {application.location && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">Location</p>
                          <p className="text-muted-foreground">{application.location}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start gap-2">
                      <Briefcase className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Remote</p>
                        <p className="text-muted-foreground">{application.remote ? "Yes" : "No"}</p>
                      </div>
                    </div>
                    {application.salary_range && (
                      <div className="flex items-start gap-2">
                        <div>
                          <p className="font-medium">Salary Range</p>
                          <p className="text-muted-foreground">{application.salary_range}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start gap-2">
                      <div>
                        <p className="font-medium">Source</p>
                        <p className="text-muted-foreground">{application.source}</p>
                      </div>
                    </div>
                    {application.external_job_id && (
                      <div className="flex items-start gap-2">
                        <div>
                          <p className="font-medium">Job ID</p>
                          <p className="text-muted-foreground">{application.external_job_id}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {application.job_url && (
                    <div className="mt-4">
                      <a
                        href={application.job_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-primary hover:underline"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View Job Posting
                      </a>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="description">
                  {application.job_description ? (
                    <div className="prose dark:prose-invert max-w-none">
                      <pre className="whitespace-pre-wrap font-sans">{application.job_description}</pre>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No job description available.</p>
                  )}
                </TabsContent>
                <TabsContent value="notes">
                  {application.notes ? (
                    <div className="prose dark:prose-invert max-w-none">
                      <pre className="whitespace-pre-wrap font-sans">{application.notes}</pre>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No notes available.</p>
                  )}
                </TabsContent>
                <TabsContent value="emails">
                  <ApplicationEmails applicationId={application.id} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statusHistory.length > 0 ? (
                  statusHistory.map((entry, index) => (
                    <div key={entry.id} className="relative pl-6 pb-4">
                      {index < statusHistory.length - 1 && (
                        <div className="absolute top-0 left-2 h-full w-px bg-border"></div>
                      )}
                      <div className="absolute top-0 left-0 rounded-full w-4 h-4 bg-primary"></div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <p className="font-medium">
                            Status changed to{" "}
                            <Badge className={getStatusBadgeClass(entry.status)}>
                              {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                            </Badge>
                          </p>
                          {entry.notes && <p className="text-muted-foreground mt-1">{entry.notes}</p>}
                        </div>
                        <p className="text-sm text-muted-foreground">{formatDate(entry.created_at)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">No status history available.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Update Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger className="py-3 px-4 rounded-xl text-base font-semibold shadow-md border-2 border-primary/20 bg-background flex items-center gap-2">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl shadow-lg">
                      <SelectItem value="saved" className="flex items-center gap-2 py-3 px-4 text-base">Saved</SelectItem>
                      <SelectItem value="applied" className="flex items-center gap-2 py-3 px-4 text-base">Applied</SelectItem>
                      <SelectItem value="interview" className="flex items-center gap-2 py-3 px-4 text-base">Interview</SelectItem>
                      <SelectItem value="offer" className="flex items-center gap-2 py-3 px-4 text-base">Offer</SelectItem>
                      <SelectItem value="rejected" className="flex items-center gap-2 py-3 px-4 text-base">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Textarea
                    placeholder="Add notes about this status change (optional)"
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleStatusUpdate}
                  disabled={isUpdatingStatus || (newStatus === application.status && !statusNote)}
                >
                  {isUpdatingStatus ? "Updating..." : "Update Status"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {application.job_url && (
                  <a href={application.job_url} target="_blank" rel="noopener noreferrer" className="w-full">
                    <Button variant="outline" className="w-full justify-start">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Job Posting
                    </Button>
                  </a>
                )}
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Add Follow-up Reminder
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Mark as Offer Accepted
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <XCircle className="mr-2 h-4 w-4" />
                  Mark as Rejected
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
