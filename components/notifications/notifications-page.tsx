"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Bell, Calendar, CheckCircle, Clock, Mail, MessageSquare } from "lucide-react"
import { useSupabase } from "@/components/supabase-provider"

interface NotificationsPageProps {
  userId: string
}

// Mock notifications for demonstration
const mockNotifications = [
  {
    id: "1",
    type: "reminder",
    title: "Follow-up Reminder",
    message: "Remember to follow up on your application at Google for the Software Engineer position",
    date: "2023-05-15T10:00:00Z",
    read: false,
    applicationId: "123",
  },
  {
    id: "2",
    type: "status",
    title: "Application Status Update",
    message: "Your application at Microsoft has moved to the interview stage",
    date: "2023-05-14T15:30:00Z",
    read: true,
    applicationId: "456",
  },
  {
    id: "3",
    type: "reminder",
    title: "Interview Preparation",
    message: "Your interview with Amazon is scheduled for tomorrow at 2:00 PM",
    date: "2023-05-13T09:15:00Z",
    read: false,
    applicationId: "789",
  },
  {
    id: "4",
    type: "system",
    title: "Email Integration Connected",
    message: "Your Gmail account has been successfully connected for automatic job tracking",
    date: "2023-05-10T11:45:00Z",
    read: true,
    applicationId: null,
  },
]

export default function NotificationsPage({ userId }: NotificationsPageProps) {
  const { supabase } = useSupabase()
  const [notifications, setNotifications] = useState(mockNotifications)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [applicationUpdates, setApplicationUpdates] = useState(true)
  const [followUpReminders, setFollowUpReminders] = useState(true)
  const [interviewReminders, setInterviewReminders] = useState(true)

  const markAsRead = (id: string) => {
    setNotifications(
      notifications.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "reminder":
        return <Clock className="h-5 w-5 text-blue-500" />
      case "status":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "system":
        return <Bell className="h-5 w-5 text-purple-500" />
      default:
        return <MessageSquare className="h-5 w-5 text-gray-500" />
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <Tabs defaultValue="all" className="space-y-4">
      <div className="flex justify-between items-center">
        <TabsList>
          <TabsTrigger value="all">
            All
            {unreadCount > 0 && (
              <span className="ml-2 bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">
                {unreadCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="unread">Unread</TabsTrigger>
          <TabsTrigger value="reminders">Reminders</TabsTrigger>
          <TabsTrigger value="updates">Updates</TabsTrigger>
        </TabsList>
        <Button variant="outline" size="sm">
          Mark All as Read
        </Button>
      </div>

      <TabsContent value="all" className="space-y-4">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">No notifications</h3>
              <p className="text-muted-foreground mb-4 text-center">You don't have any notifications yet</p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`overflow-hidden ${!notification.read ? "border-l-4 border-l-primary" : ""}`}
            >
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="mt-1">{getNotificationIcon(notification.type)}</div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold">{notification.title}</h3>
                      <span className="text-xs text-muted-foreground">{formatDate(notification.date)}</span>
                    </div>
                    <p className="text-sm mt-1">{notification.message}</p>
                    <div className="flex justify-between items-center mt-2">
                      {notification.applicationId && (
                        <Button variant="link" className="p-0 h-auto text-sm" onClick={() => {}}>
                          View Application
                        </Button>
                      )}
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-auto text-xs"
                          onClick={() => markAsRead(notification.id)}
                        >
                          Mark as Read
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </TabsContent>

      <TabsContent value="unread" className="space-y-4">
        {notifications.filter((n) => !n.read).length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">No unread notifications</h3>
              <p className="text-muted-foreground mb-4 text-center">You've read all your notifications</p>
            </CardContent>
          </Card>
        ) : (
          notifications
            .filter((n) => !n.read)
            .map((notification) => (
              <Card key={notification.id} className="overflow-hidden border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="mt-1">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold">{notification.title}</h3>
                        <span className="text-xs text-muted-foreground">{formatDate(notification.date)}</span>
                      </div>
                      <p className="text-sm mt-1">{notification.message}</p>
                      <div className="flex justify-between items-center mt-2">
                        {notification.applicationId && (
                          <Button variant="link" className="p-0 h-auto text-sm" onClick={() => {}}>
                            View Application
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-auto text-xs"
                          onClick={() => markAsRead(notification.id)}
                        >
                          Mark as Read
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
        )}
      </TabsContent>

      <TabsContent value="reminders" className="space-y-4">
        {notifications.filter((n) => n.type === "reminder").length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">No reminders</h3>
              <p className="text-muted-foreground mb-4 text-center">You don't have any reminders yet</p>
            </CardContent>
          </Card>
        ) : (
          notifications
            .filter((n) => n.type === "reminder")
            .map((notification) => (
              <Card
                key={notification.id}
                className={`overflow-hidden ${!notification.read ? "border-l-4 border-l-primary" : ""}`}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="mt-1">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold">{notification.title}</h3>
                        <span className="text-xs text-muted-foreground">{formatDate(notification.date)}</span>
                      </div>
                      <p className="text-sm mt-1">{notification.message}</p>
                      <div className="flex justify-between items-center mt-2">
                        {notification.applicationId && (
                          <Button variant="link" className="p-0 h-auto text-sm" onClick={() => {}}>
                            View Application
                          </Button>
                        )}
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-auto text-xs"
                            onClick={() => markAsRead(notification.id)}
                          >
                            Mark as Read
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
        )}
      </TabsContent>

      <TabsContent value="updates" className="space-y-4">
        {notifications.filter((n) => n.type === "status" || n.type === "system").length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">No updates</h3>
              <p className="text-muted-foreground mb-4 text-center">You don't have any status updates yet</p>
            </CardContent>
          </Card>
        ) : (
          notifications
            .filter((n) => n.type === "status" || n.type === "system")
            .map((notification) => (
              <Card
                key={notification.id}
                className={`overflow-hidden ${!notification.read ? "border-l-4 border-l-primary" : ""}`}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="mt-1">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold">{notification.title}</h3>
                        <span className="text-xs text-muted-foreground">{formatDate(notification.date)}</span>
                      </div>
                      <p className="text-sm mt-1">{notification.message}</p>
                      <div className="flex justify-between items-center mt-2">
                        {notification.applicationId && (
                          <Button variant="link" className="p-0 h-auto text-sm" onClick={() => {}}>
                            View Application
                          </Button>
                        )}
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-auto text-xs"
                            onClick={() => markAsRead(notification.id)}
                          >
                            Mark as Read
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
        )}
      </TabsContent>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>Configure how and when you receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="email-notifications">Email Notifications</Label>
            </div>
            <Switch id="email-notifications" checked={emailNotifications} onCheckedChange={setEmailNotifications} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="application-updates">Application Status Updates</Label>
            </div>
            <Switch id="application-updates" checked={applicationUpdates} onCheckedChange={setApplicationUpdates} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="follow-up-reminders">Follow-up Reminders</Label>
            </div>
            <Switch id="follow-up-reminders" checked={followUpReminders} onCheckedChange={setFollowUpReminders} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="interview-reminders">Interview Reminders</Label>
            </div>
            <Switch id="interview-reminders" checked={interviewReminders} onCheckedChange={setInterviewReminders} />
          </div>
        </CardContent>
      </Card>
    </Tabs>
  )
}
