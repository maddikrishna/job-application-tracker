"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/supabase-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { CheckCircle2, Clock, Briefcase, Globe, Linkedin, Building2, Users, Mail, Star } from "lucide-react"

interface NewApplicationFormProps {
  userId: string
}

export default function NewApplicationForm({ userId }: NewApplicationFormProps) {
  const router = useRouter()
  const { supabase } = useSupabase()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    job_title: "",
    company_name: "",
    job_description: "",
    job_url: "",
    status: "applied",
    source: "manual",
    location: "",
    remote: false,
    salary_range: "",
    notes: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.from("job_applications").insert({
        ...formData,
        user_id: userId,
      })

      if (error) throw error

      // If status is not 'applied', add a status history entry
      if (formData.status !== "applied") {
        await supabase.from("application_status_history").insert({
          application_id: (
            await supabase
              .from("job_applications")
              .select("id")
              .eq("user_id", userId)
              .eq("job_title", formData.job_title)
              .eq("company_name", formData.company_name)
              .single()
          ).data?.id,
          status: formData.status,
          notes: `Initial status: ${formData.status}`,
        })
      }

      router.push("/dashboard/applications")
      router.refresh()
    } catch (error: any) {
      setError(error.message || "An error occurred while saving the application")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="job_title">Job Title *</Label>
              <Input id="job_title" name="job_title" value={formData.job_title} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name *</Label>
              <Input
                id="company_name"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="job_url">Job URL</Label>
              <Input id="job_url" name="job_url" type="url" value={formData.job_url} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
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
              <Label htmlFor="source">Source *</Label>
              <Select value={formData.source} onValueChange={(value) => handleSelectChange("source", value)}>
                <SelectTrigger className="py-3 px-4 rounded-xl text-base font-semibold shadow-md border-2 border-primary/20 bg-background flex items-center gap-2">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-lg">
                  <SelectItem value="manual" className="flex items-center gap-2 py-3 px-4 text-base">Manual Entry</SelectItem>
                  <SelectItem value="linkedin" className="flex items-center gap-2 py-3 px-4 text-base">LinkedIn</SelectItem>
                  <SelectItem value="indeed" className="flex items-center gap-2 py-3 px-4 text-base">Indeed</SelectItem>
                  <SelectItem value="glassdoor" className="flex items-center gap-2 py-3 px-4 text-base">Glassdoor</SelectItem>
                  <SelectItem value="company-website" className="flex items-center gap-2 py-3 px-4 text-base">Company Website</SelectItem>
                  <SelectItem value="referral" className="flex items-center gap-2 py-3 px-4 text-base">Referral</SelectItem>
                  <SelectItem value="other" className="flex items-center gap-2 py-3 px-4 text-base">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" name="location" value={formData.location} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salary_range">Salary Range</Label>
              <Input id="salary_range" name="salary_range" value={formData.salary_range} onChange={handleChange} />
            </div>

            <div className="flex items-center space-x-2 h-full pt-8">
              <Checkbox
                id="remote"
                checked={formData.remote}
                onCheckedChange={(checked) => handleCheckboxChange("remote", checked as boolean)}
              />
              <Label htmlFor="remote">Remote Position</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="job_description">Job Description</Label>
            <Textarea
              id="job_description"
              name="job_description"
              value={formData.job_description}
              onChange={handleChange}
              rows={5}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={3} />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Application"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
