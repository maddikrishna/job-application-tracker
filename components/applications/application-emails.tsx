"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mail, ChevronDown, ChevronUp } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface ApplicationEmail {
  id: string
  subject: string
  sender: string
  received_at: string
  content: string
  category: string
}

interface ApplicationEmailsProps {
  applicationId: string
}

export default function ApplicationEmails({ applicationId }: ApplicationEmailsProps) {
  const [emails, setEmails] = useState<ApplicationEmail[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [openEmailId, setOpenEmailId] = useState<string | null>(null)

  useEffect(() => {
    fetchEmails()
  }, [applicationId])

  const fetchEmails = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/application-emails?applicationId=${applicationId}`)
      const data = await response.json()

      if (data.success) {
        setEmails(data.emails || [])
      }
    } catch (error) {
      console.error("Error fetching emails:", error)
    } finally {
      setIsLoading(false)
    }
  }

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

  const getCategoryBadgeClass = (category: string) => {
    switch (category.toLowerCase()) {
      case "application":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "interview":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      case "offer":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "rejection":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      case "update":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  // For demo purposes, let's add some mock emails if none are found
  useEffect(() => {
    if (!isLoading && emails.length === 0) {
      setEmails([
        {
          id: "mock-1",
          subject: "Thank you for your application to Software Engineer",
          sender: "recruiting@example.com",
          received_at: new Date().toISOString(),
          content: `Dear Applicant,

Thank you for applying to the Software Engineer position at Example Corp. We have received your application and our team is currently reviewing your qualifications.

We appreciate your interest in joining our team and will be in touch soon with updates on your application status.

Best regards,
Example Corp Recruiting Team`,
          category: "application",
        },
        {
          id: "mock-2",
          subject: "Interview Request: Software Engineer Position",
          sender: "hr@example.com",
          received_at: new Date(Date.now() - 3 * 86400000).toISOString(), // 3 days ago
          content: `Dear Applicant,

We've reviewed your application for the Software Engineer position and we're impressed with your qualifications. We would like to schedule an interview with you to discuss the role further.

Please let us know your availability for the next week, and we'll arrange a time that works for everyone.

Looking forward to speaking with you!

Best regards,
HR Team
Example Corp`,
          category: "interview",
        },
      ])
    }
  }, [isLoading, emails])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Communication
        </CardTitle>
        <CardDescription>Email history related to this job application</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Emails</TabsTrigger>
            <TabsTrigger value="application">Application</TabsTrigger>
            <TabsTrigger value="interview">Interview</TabsTrigger>
            <TabsTrigger value="updates">Updates</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">Loading emails...</div>
            ) : emails.length === 0 ? (
              <div className="text-center py-8">
                <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No emails found</h3>
                <p className="text-muted-foreground">
                  No email communication has been tracked for this application yet.
                </p>
              </div>
            ) : (
              emails.map((email) => (
                <Collapsible
                  key={email.id}
                  open={openEmailId === email.id}
                  onOpenChange={() => setOpenEmailId(openEmailId === email.id ? null : email.id)}
                  className="border rounded-lg overflow-hidden"
                >
                  <div className="flex items-center justify-between p-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge className={getCategoryBadgeClass(email.category)}>
                          {email.category.charAt(0).toUpperCase() + email.category.slice(1)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{formatDate(email.received_at)}</span>
                      </div>
                      <h3 className="font-medium mt-1">{email.subject}</h3>
                      <p className="text-sm text-muted-foreground">From: {email.sender}</p>
                    </div>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm">
                        {openEmailId === email.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                        <span className="sr-only">Toggle email content</span>
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent>
                    <div className="p-4 pt-0 border-t">
                      <pre className="whitespace-pre-wrap font-sans text-sm">{email.content}</pre>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))
            )}
          </TabsContent>

          <TabsContent value="application" className="space-y-4">
            {emails
              .filter((email) => email.category === "application")
              .map((email) => (
                <Collapsible
                  key={email.id}
                  open={openEmailId === email.id}
                  onOpenChange={() => setOpenEmailId(openEmailId === email.id ? null : email.id)}
                  className="border rounded-lg overflow-hidden"
                >
                  <div className="flex items-center justify-between p-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge className={getCategoryBadgeClass(email.category)}>
                          {email.category.charAt(0).toUpperCase() + email.category.slice(1)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{formatDate(email.received_at)}</span>
                      </div>
                      <h3 className="font-medium mt-1">{email.subject}</h3>
                      <p className="text-sm text-muted-foreground">From: {email.sender}</p>
                    </div>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm">
                        {openEmailId === email.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                        <span className="sr-only">Toggle email content</span>
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent>
                    <div className="p-4 pt-0 border-t">
                      <pre className="whitespace-pre-wrap font-sans text-sm">{email.content}</pre>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
          </TabsContent>

          <TabsContent value="interview" className="space-y-4">
            {emails
              .filter((email) => email.category === "interview")
              .map((email) => (
                <Collapsible
                  key={email.id}
                  open={openEmailId === email.id}
                  onOpenChange={() => setOpenEmailId(openEmailId === email.id ? null : email.id)}
                  className="border rounded-lg overflow-hidden"
                >
                  <div className="flex items-center justify-between p-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge className={getCategoryBadgeClass(email.category)}>
                          {email.category.charAt(0).toUpperCase() + email.category.slice(1)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{formatDate(email.received_at)}</span>
                      </div>
                      <h3 className="font-medium mt-1">{email.subject}</h3>
                      <p className="text-sm text-muted-foreground">From: {email.sender}</p>
                    </div>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm">
                        {openEmailId === email.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                        <span className="sr-only">Toggle email content</span>
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent>
                    <div className="p-4 pt-0 border-t">
                      <pre className="whitespace-pre-wrap font-sans text-sm">{email.content}</pre>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
          </TabsContent>

          <TabsContent value="updates" className="space-y-4">
            {emails
              .filter(
                (email) => email.category === "update" || email.category === "offer" || email.category === "rejection",
              )
              .map((email) => (
                <Collapsible
                  key={email.id}
                  open={openEmailId === email.id}
                  onOpenChange={() => setOpenEmailId(openEmailId === email.id ? null : email.id)}
                  className="border rounded-lg overflow-hidden"
                >
                  <div className="flex items-center justify-between p-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge className={getCategoryBadgeClass(email.category)}>
                          {email.category.charAt(0).toUpperCase() + email.category.slice(1)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{formatDate(email.received_at)}</span>
                      </div>
                      <h3 className="font-medium mt-1">{email.subject}</h3>
                      <p className="text-sm text-muted-foreground">From: {email.sender}</p>
                    </div>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm">
                        {openEmailId === email.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                        <span className="sr-only">Toggle email content</span>
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent>
                    <div className="p-4 pt-0 border-t">
                      <pre className="whitespace-pre-wrap font-sans text-sm">{email.content}</pre>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
