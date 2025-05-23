"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts"
import { PieChart as PieChartIcon, BarChart as BarChartIcon, Activity as TimelineIcon, Filter as FilterIcon } from "lucide-react"

interface AnalyticsDashboardProps {
  applications: any[]
}

export default function AnalyticsDashboard({ applications }: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState("all")
  const [activeTab, setActiveTab] = useState("status")

  // Filter applications based on time range
  const filteredApplications = applications.filter((app) => {
    if (timeRange === "all") return true

    const appDate = new Date(app.applied_date)
    const now = new Date()

    if (timeRange === "30days") {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(now.getDate() - 30)
      return appDate >= thirtyDaysAgo
    }

    if (timeRange === "90days") {
      const ninetyDaysAgo = new Date()
      ninetyDaysAgo.setDate(now.getDate() - 90)
      return appDate >= ninetyDaysAgo
    }

    if (timeRange === "year") {
      const oneYearAgo = new Date()
      oneYearAgo.setFullYear(now.getFullYear() - 1)
      return appDate >= oneYearAgo
    }

    return true
  })

  // Status distribution data
  const statusCounts = filteredApplications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1
    return acc
  }, {})

  const statusData = Object.keys(statusCounts).map((status) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: statusCounts[status],
  }))

  // Application sources data
  const sourceCounts = filteredApplications.reduce((acc, app) => {
    acc[app.source] = (acc[app.source] || 0) + 1
    return acc
  }, {})

  const sourceData = Object.keys(sourceCounts).map((source) => ({
    name: source.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    value: sourceCounts[source],
  }))

  // Applications over time data
  const applicationsByMonth = filteredApplications.reduce((acc, app) => {
    const date = new Date(app.applied_date)
    const monthYear = `${date.toLocaleString("default", { month: "short" })} ${date.getFullYear()}`

    if (!acc[monthYear]) {
      acc[monthYear] = { name: monthYear, count: 0 }
    }

    acc[monthYear].count += 1
    return acc
  }, {})

  const timelineData = Object.values(applicationsByMonth).sort((a: any, b: any) => {
    const [aMonth, aYear] = a.name.split(" ")
    const [bMonth, bYear] = b.name.split(" ")

    if (aYear !== bYear) return Number.parseInt(aYear) - Number.parseInt(bYear)

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return months.indexOf(aMonth) - months.indexOf(bMonth)
  })

  // Status conversion data
  const totalApplications = filteredApplications.length
  const interviewCount = filteredApplications.filter((app) => app.status === "interview").length
  const offerCount = filteredApplications.filter((app) => app.status === "offer").length

  const conversionData = [
    { name: "Applied", value: totalApplications },
    { name: "Interview", value: interviewCount },
    { name: "Offer", value: offerCount },
  ]

  // Colors for charts
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"]

  // Calculate metrics
  const interviewRate = totalApplications > 0 ? ((interviewCount / totalApplications) * 100).toFixed(1) : "0"

  const offerRate = interviewCount > 0 ? ((offerCount / interviewCount) * 100).toFixed(1) : "0"

  const overallSuccessRate = totalApplications > 0 ? ((offerCount / totalApplications) * 100).toFixed(1) : "0"

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-8 mt-6">
        <h2 className="text-3xl font-extrabold mb-2">Application Analytics</h2>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-full sm:w-[220px] py-4 px-4 rounded-2xl text-lg font-semibold shadow-lg border-2 border-primary/20 bg-background flex items-center gap-3">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl shadow-xl">
            <SelectItem value="all" className="flex items-center gap-3 py-4 px-4 text-lg">All Time</SelectItem>
            <SelectItem value="30days" className="flex items-center gap-3 py-4 px-4 text-lg">Last 30 Days</SelectItem>
            <SelectItem value="90days" className="flex items-center gap-3 py-4 px-4 text-lg">Last 90 Days</SelectItem>
            <SelectItem value="year" className="flex items-center gap-3 py-4 px-4 text-lg">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalApplications}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interview Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{interviewRate}%</div>
            <p className="text-xs text-muted-foreground">
              {interviewCount} interviews from {totalApplications} applications
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offer Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{offerRate}%</div>
            <p className="text-xs text-muted-foreground">
              {offerCount} offers from {interviewCount} interviews
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallSuccessRate}%</div>
            <p className="text-xs text-muted-foreground">
              {offerCount} offers from {totalApplications} applications
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        {/* Mobile: Use Select for tab selection */}
        <div className="block md:hidden mb-6">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="w-full py-4 px-4 rounded-xl text-lg font-semibold shadow-md border-2 border-primary/20 bg-background flex items-center gap-2">
              <SelectValue placeholder="Select view" />
            </SelectTrigger>
            <SelectContent className="rounded-xl shadow-lg">
              <SelectItem value="status" className="flex items-center gap-2 py-3 px-4 text-base"><BarChartIcon className="h-5 w-5 mr-2 text-primary" />Status Distribution</SelectItem>
              <SelectItem value="sources" className="flex items-center gap-2 py-3 px-4 text-base"><PieChartIcon className="h-5 w-5 mr-2 text-primary" />Application Sources</SelectItem>
              <SelectItem value="timeline" className="flex items-center gap-2 py-3 px-4 text-base"><TimelineIcon className="h-5 w-5 mr-2 text-primary" />Timeline</SelectItem>
              <SelectItem value="conversion" className="flex items-center gap-2 py-3 px-4 text-base"><FilterIcon className="h-5 w-5 mr-2 text-primary" />Conversion Funnel</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* Desktop: Use TabsList */}
        <TabsList className="hidden md:inline-flex">
          <TabsTrigger value="status">Status Distribution</TabsTrigger>
          <TabsTrigger value="sources">Application Sources</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="conversion">Conversion Funnel</TabsTrigger>
        </TabsList>

        <TabsContent value="status">
          <Card>
            <CardHeader>
              <CardTitle>Application Status Distribution</CardTitle>
              <CardDescription>Breakdown of your applications by current status</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px]">
                {statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sources">
          <Card>
            <CardHeader>
              <CardTitle>Application Sources</CardTitle>
              <CardDescription>Where your job applications are coming from</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px]">
                {sourceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={sourceData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8884d8" name="Applications" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Applications Over Time</CardTitle>
              <CardDescription>Number of applications submitted by month</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px]">
                {timelineData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={timelineData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="count" stroke="#8884d8" activeDot={{ r: 8 }} name="Applications" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversion">
          <Card>
            <CardHeader>
              <CardTitle>Application Conversion Funnel</CardTitle>
              <CardDescription>How your applications progress through the hiring process</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px]">
                {conversionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={conversionData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8884d8" name="Count" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
