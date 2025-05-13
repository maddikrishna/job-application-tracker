import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "./database.types"
import { processEmailWithAI } from "./ai-service"

// Interface for email data
export interface EmailData {
  id: string
  subject: string
  sender: string
  receivedAt: Date
  content: string
  attachments?: any[]
}

// Email provider interface
export interface EmailProvider {
  connect(credentials: any): Promise<boolean>
  fetchEmails(since?: Date, maxResults?: number): Promise<EmailData[]>
  getEmailContent(emailId: string): Promise<string>
  getAttachments(emailId: string): Promise<any[]>
}

// Gmail provider implementation
export class GmailProvider implements EmailProvider {
  private credentials: any
  private accessToken: string | null = null

  constructor() {
    this.credentials = null
  }

  async connect(credentials: any): Promise<boolean> {
    this.credentials = credentials
    this.accessToken = credentials.access_token

    // Check if the token is expired and refresh if needed
    const now = Math.floor(Date.now() / 1000)
    if (credentials.issued_at && credentials.expires_in && now > credentials.issued_at + credentials.expires_in - 300) {
      // Token is expired or will expire soon, refresh it
      try {
        const response = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID || "",
            client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
            refresh_token: credentials.refresh_token,
            grant_type: "refresh_token",
          }),
        })

        const data = await response.json()

        if (response.ok) {
          this.accessToken = data.access_token

          // Update the stored credentials with the new token
          this.credentials = {
            ...this.credentials,
            access_token: data.access_token,
            expires_in: data.expires_in,
            issued_at: Math.floor(Date.now() / 1000),
          }

          // Return the updated credentials for storage
          return true
        } else {
          console.error("Failed to refresh token:", data)
          return false
        }
      } catch (error) {
        console.error("Error refreshing token:", error)
        return false
      }
    }

    return true
  }

  async fetchEmails(since?: Date, maxResults = 50): Promise<EmailData[]> {
    try {
      // In a real implementation, this would use the Gmail API
      // For now, we'll simulate the API call

      // Construct the Gmail API query
      let query = ""
      if (since) {
        const sinceDate = since.toISOString().split("T")[0] // Format as YYYY-MM-DD
        query = `after:${sinceDate}`
      }

      // In a real implementation, we would make an API call like:
      // const response = await fetch(
      //   `https://www.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`,
      //   {
      //     headers: {
      //       Authorization: `Bearer ${this.accessToken}`,
      //     },
      //   }
      // );
      // const data = await response.json();

      // For now, return mock data
      return [
        {
          id: "email1",
          subject: "Your application for Software Engineer at Google",
          sender: "recruiting@google.com",
          receivedAt: new Date(),
          content: "Thank you for applying to the Software Engineer position at Google...",
        },
        {
          id: "email2",
          subject: "Interview Request: Software Developer Position",
          sender: "hr@microsoft.com",
          receivedAt: new Date(Date.now() - 86400000), // 1 day ago
          content: "We've reviewed your application and would like to schedule an interview...",
        },
      ]
    } catch (error) {
      console.error("Error fetching emails:", error)
      return []
    }
  }

  async getEmailContent(emailId: string): Promise<string> {
    try {
      // In a real implementation, we would make an API call like:
      // const response = await fetch(
      //   `https://www.googleapis.com/gmail/v1/users/me/messages/${emailId}?format=full`,
      //   {
      //     headers: {
      //       Authorization: `Bearer ${this.accessToken}`,
      //     },
      //   }
      // );
      // const data = await response.json();
      // Then decode the email content from base64

      // For now, return mock content
      return "Thank you for applying to the Software Engineer position at Google. We have received your application and will review it shortly."
    } catch (error) {
      console.error("Error fetching email content:", error)
      return ""
    }
  }

  async getAttachments(emailId: string): Promise<any[]> {
    // In a real implementation, this would fetch attachments
    return []
  }
}

// Factory function to get the appropriate email provider
export function getEmailProvider(provider: string): EmailProvider {
  switch (provider.toLowerCase()) {
    case "gmail":
      return new GmailProvider()
    // Add more providers as needed
    default:
      throw new Error(`Unsupported email provider: ${provider}`)
  }
}

// Function to sync emails for a user
export async function syncUserEmails(userId: string, integrationId: string) {
  const supabase = createServerComponentClient<Database>({ cookies })

  try {
    // Get the email integration details
    const { data: integration, error: integrationError } = await supabase
      .from("email_integrations")
      .select("*")
      .eq("id", integrationId)
      .eq("user_id", userId)
      .single()

    if (integrationError || !integration) {
      throw new Error("Email integration not found")
    }

    // Get the email provider
    const provider = getEmailProvider(integration.provider)

    // Connect to the provider
    await provider.connect(integration.credentials)

    // Determine the since date based on last sync
    const since = integration.last_sync ? new Date(integration.last_sync) : undefined

    // Fetch new emails
    const emails = await provider.fetchEmails(since)

    // Process each email
    for (const email of emails) {
      // Get full email content if needed
      if (!email.content) {
        email.content = await provider.getEmailContent(email.id)
      }

      // Process the email with AI
      const result = await processEmailWithAI(email, userId)

      if (result.isJobRelated) {
        // Check if this email is related to an existing application
        let applicationId: string | null = null

        if (result.externalJobId) {
          // Look for existing application with this external job ID
          const { data: existingApp } = await supabase
            .from("job_applications")
            .select("id")
            .eq("user_id", userId)
            .eq("external_job_id", result.externalJobId)
            .maybeSingle()

          if (existingApp) {
            applicationId = existingApp.id
          }
        }

        // If no existing application found by job ID, try to match by company and title
        if (!applicationId && result.companyName && result.jobTitle) {
          const { data: existingApp } = await supabase
            .from("job_applications")
            .select("id")
            .eq("user_id", userId)
            .eq("company_name", result.companyName)
            .eq("job_title", result.jobTitle)
            .maybeSingle()

          if (existingApp) {
            applicationId = existingApp.id
          }
        }

        // If this is a new application, create it
        if (!applicationId && result.category === "application") {
          const { data: newApp, error: newAppError } = await supabase
            .from("job_applications")
            .insert({
              user_id: userId,
              job_title: result.jobTitle || "Unknown Position",
              company_name: result.companyName || "Unknown Company",
              job_description: result.jobDescription,
              job_url: result.jobUrl,
              status: "applied",
              source: "email",
              external_job_id: result.externalJobId,
              applied_date: email.receivedAt.toISOString(),
              last_updated: new Date().toISOString(),
            })
            .select("id")
            .single()

          if (newAppError) {
            console.error("Error creating new application:", newAppError)
            continue
          }

          applicationId = newApp.id
        }

        // Store the email
        if (applicationId) {
          await supabase.from("application_emails").insert({
            user_id: userId,
            application_id: applicationId,
            email_id: email.id,
            subject: email.subject,
            sender: email.sender,
            received_at: email.receivedAt.toISOString(),
            content: email.content,
            category: result.category,
            metadata: result.metadata,
          })

          // Update application status if needed
          if (result.suggestedStatus && result.suggestedStatus !== "applied") {
            await supabase
              .from("job_applications")
              .update({
                status: result.suggestedStatus,
                last_updated: new Date().toISOString(),
              })
              .eq("id", applicationId)

            // Add status history entry
            await supabase.from("application_status_history").insert({
              application_id: applicationId,
              status: result.suggestedStatus,
              notes: `Status updated based on email: ${email.subject}`,
            })
          }
        }
      }
    }

    // Update the last sync time
    await supabase
      .from("email_integrations")
      .update({
        last_sync: new Date().toISOString(),
        last_email_id: emails.length > 0 ? emails[0].id : integration.last_email_id,
      })
      .eq("id", integrationId)

    return { success: true, processedCount: emails.length }
  } catch (error) {
    console.error("Error syncing emails:", error)
    return { success: false, error }
  }
}

// Function to get emails for a specific application
export async function getApplicationEmails(applicationId: string) {
  const supabase = createServerComponentClient<Database>({ cookies })

  try {
    const { data: emails, error } = await supabase
      .from("application_emails")
      .select("*")
      .eq("application_id", applicationId)
      .order("received_at", { ascending: false })

    if (error) throw error

    return emails || []
  } catch (error) {
    console.error("Error fetching application emails:", error)
    return []
  }
}
