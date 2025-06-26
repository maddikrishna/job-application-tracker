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
    console.log("Connecting to Gmail provider...")
    this.credentials = credentials
    this.accessToken = credentials.access_token

    // Check if the token is expired and refresh if needed
    const now = Math.floor(Date.now() / 1000)
    if (credentials.issued_at && credentials.expires_in && now > credentials.issued_at + credentials.expires_in - 300) {
      console.log("Token expired, refreshing...")
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
          console.log("Token refreshed successfully")
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

    console.log("Connected to Gmail provider successfully")
    return true
  }

  async fetchEmails(since?: Date, maxResults = 50): Promise<EmailData[]> {
    try {
      // If no since date is provided, use 5 days ago
      if (!since) {
        since = new Date()
        since.setDate(since.getDate() - 5)
      }

      console.log(`Fetching emails since: ${since.toISOString()}`)

      // Construct the Gmail API query
      let query = "category:primary"
      if (since) {
        const sinceDate = since.toISOString().split("T")[0] // Format as YYYY-MM-DD
        query += ` after:${sinceDate}`
      }

      console.log(`Gmail API query: ${query}`)

      // Make the API call to Gmail
      const response = await fetch(
        `https://www.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        },
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Gmail API error: ${response.status} ${response.statusText}`, errorText)
        throw new Error(`Gmail API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log(`Found ${data.messages?.length || 0} messages`)

      if (!data.messages || data.messages.length === 0) {
        return []
      }

      // Fetch details for each message
      const emails: EmailData[] = []

      for (const message of data.messages.slice(0, maxResults)) {
        try {
          console.log(`Fetching details for message: ${message.id}`)
          const messageResponse = await fetch(
            `https://www.googleapis.com/gmail/v1/users/me/messages/${message.id}?format=full`,
            {
              headers: {
                Authorization: `Bearer ${this.accessToken}`,
              },
            },
          )

          if (!messageResponse.ok) {
            console.error(`Error fetching message ${message.id}: ${messageResponse.status}`)
            continue
          }

          const messageData = await messageResponse.json()

          // Extract headers
          const headers = messageData.payload.headers
          const subject = headers.find((h: any) => h.name === "Subject")?.value || "No Subject"
          const from = headers.find((h: any) => h.name === "From")?.value || ""
          const date = headers.find((h: any) => h.name === "Date")?.value

          console.log(`Processing email: ${subject}`)

          // Extract content
          let content = ""

          // Function to extract text from parts recursively
          const extractText = (part: any) => {
            if (part.mimeType === "text/plain" && part.body.data) {
              content += Buffer.from(part.body.data, "base64").toString("utf-8")
            } else if (part.parts) {
              part.parts.forEach(extractText)
            }
          }

          if (messageData.payload.body.data) {
            content = Buffer.from(messageData.payload.body.data, "base64").toString("utf-8")
          } else if (messageData.payload.parts) {
            messageData.payload.parts.forEach(extractText)
          }

          emails.push({
            id: message.id,
            subject,
            sender: from,
            receivedAt: date ? new Date(date) : new Date(),
            content,
          })
        } catch (error) {
          console.error(`Error processing message ${message.id}:`, error)
        }
      }

      console.log(`Successfully processed ${emails.length} emails`)
      return emails
    } catch (error) {
      console.error("Error fetching emails:", error)
      return []
    }
  }

  async getEmailContent(emailId: string): Promise<string> {
    try {
      console.log(`Fetching content for email: ${emailId}`)
      const response = await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/${emailId}?format=full`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Gmail API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      // Extract content
      let content = ""

      // Function to extract text from parts recursively
      const extractText = (part: any) => {
        if (part.mimeType === "text/plain" && part.body.data) {
          content += Buffer.from(part.body.data, "base64").toString("utf-8")
        } else if (part.parts) {
          part.parts.forEach(extractText)
        }
      }

      if (data.payload.body.data) {
        content = Buffer.from(data.payload.body.data, "base64").toString("utf-8")
      } else if (data.payload.parts) {
        data.payload.parts.forEach(extractText)
      }

      return content
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
export async function syncUserEmails(userId: string, integrationId: string, cookieStore: any) {
  console.log(`Starting email sync for user ${userId}, integration ${integrationId}`)
  const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore })

  try {
    // Get the email integration details
    const { data: integration, error: integrationError } = await supabase
      .from("email_integrations")
      .select("*")
      .eq("id", integrationId)
      .eq("user_id", userId)
      .single()

    if (integrationError || !integration) {
      console.error("Email integration not found:", integrationError)
      throw new Error("Email integration not found")
    }

    console.log(`Found integration: ${integration.provider}`)

    // Get the email provider
    const provider = getEmailProvider(integration.provider)

    // Connect to the provider
    const connected = await provider.connect(integration.credentials)
    if (!connected) {
      console.error("Failed to connect to email provider")
      return { success: false, error: "connection_failed" }
    }

    // Determine the since date based on last sync or use 5 days ago
    let since: Date | undefined
    if (integration.last_sync) {
      since = new Date(integration.last_sync)
      console.log(`Using last sync date: ${since.toISOString()}`)
    } else {
      since = new Date()
      since.setDate(since.getDate() - 5) // 5 days ago
      console.log(`No last sync date, using 5 days ago: ${since.toISOString()}`)
    }

    // Fetch new emails
    const emails = await provider.fetchEmails(since)
    console.log(`Fetched ${emails.length} emails`)

    // Process each email
    let processedCount = 0
    let newApplications = 0
    let updatedApplications = 0

    for (const email of emails) {
      console.log(`Processing email: ${email.subject}`)

      // Get full email content if needed
      if (!email.content) {
        console.log(`Fetching content for email: ${email.id}`)
        email.content = await provider.getEmailContent(email.id)
      }

      // Process the email with AI
      const result = await processEmailWithAI(email, userId)
      console.log(`AI processing result: isJobRelated=${result.isJobRelated}, category=${result.category}, jobTitle=${result.jobTitle}, companyName=${result.companyName}`)

      // Validate AI result
      if (!result || typeof result.isJobRelated !== 'boolean') {
        console.error("Invalid AI result:", result)
        continue
      }

      if (result.isJobRelated) {
        processedCount++

        // Validate required fields for job applications
        if (result.category === "application" && (!result.companyName || !result.jobTitle)) {
          console.warn("Missing required fields for job application:", {
            companyName: result.companyName,
            jobTitle: result.jobTitle,
            subject: email.subject,
          })
        }

        // Check if this email is related to an existing application
        let applicationId: string | null = null

        if (result.externalJobId) {
          // Look for existing application with this external job ID
          console.log(`Looking for application with external job ID: ${result.externalJobId}`)
          const { data: existingApp } = await supabase
            .from("job_applications")
            .select("id")
            .eq("user_id", userId)
            .eq("external_job_id", result.externalJobId)
            .maybeSingle()

          if (existingApp) {
            applicationId = existingApp.id
            console.log(`Found existing application by job ID: ${applicationId}`)
          }
        }

        // If no existing application found by job ID, try to match by company and title
        if (!applicationId && result.companyName && result.jobTitle) {
          console.log(`Looking for application with company: ${result.companyName}, title: ${result.jobTitle}`)
          const { data: existingApp } = await supabase
            .from("job_applications")
            .select("id")
            .eq("user_id", userId)
            .eq("company_name", result.companyName)
            .eq("job_title", result.jobTitle)
            .maybeSingle()

          if (existingApp) {
            applicationId = existingApp.id
            console.log(`Found existing application by company and title: ${applicationId}`)
          }
        }

        // Only create new applications for explicit application confirmations with required fields
        if (!applicationId && result.category === "application") {
          // Require both jobTitle and companyName to be present and valid
          if (!result.jobTitle || !result.companyName || 
              result.jobTitle === "Unknown Position" || 
              result.companyName === "Unknown Company") {
            console.warn(`Skipping application creation - missing required fields:`, {
              jobTitle: result.jobTitle,
              companyName: result.companyName,
              subject: email.subject
            })
            continue
          }

          console.log(`Creating new application: ${result.jobTitle} at ${result.companyName}`)
          const { data: newApp, error: newAppError } = await supabase
            .from("job_applications")
            .insert({
              user_id: userId,
              job_title: result.jobTitle,
              company_name: result.companyName,
              job_description: result.jobDescription || null,
              job_url: result.jobUrl || null,
              status: result.suggestedStatus || "applied",
              source: "email",
              external_job_id: result.externalJobId || null,
              applied_date: email.receivedAt.toISOString(),
              last_updated: new Date().toISOString(),
              ai_metadata: result.metadata || null,
            })
            .select("id")
            .single()

          if (newAppError) {
            console.error("Error creating new application:", newAppError)
            continue
          }

          applicationId = newApp.id
          newApplications++
          console.log(`Created new application: ${applicationId}`)
        }

        // Store the email
        if (applicationId) {
          console.log(`Storing email for application: ${applicationId}`)

          // Check if this email is already stored
          const { data: existingEmail } = await supabase
            .from("application_emails")
            .select("id")
            .eq("application_id", applicationId)
            .eq("email_id", email.id)
            .maybeSingle()

          if (existingEmail) {
            console.log(`Email already stored, skipping: ${email.id}`)
            continue
          }

          const { error: emailError } = await supabase.from("application_emails").insert({
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

          if (emailError) {
            console.error("Error storing email:", emailError)
            continue
          }

          // Update application status if needed
          if (result.suggestedStatus && result.suggestedStatus !== "applied") {
            console.log(`Updating application status to: ${result.suggestedStatus}`)
            const { error: updateError } = await supabase
              .from("job_applications")
              .update({
                status: result.suggestedStatus,
                last_updated: new Date().toISOString(),
              })
              .eq("id", applicationId)

            if (updateError) {
              console.error("Error updating application status:", updateError)
              continue
            }

            // Add status history entry
            const { error: historyError } = await supabase.from("application_status_history").insert({
              application_id: applicationId,
              status: result.suggestedStatus,
              notes: `Status updated based on email: ${email.subject}`,
            })

            if (historyError) {
              console.error("Error adding status history:", historyError)
            }

            updatedApplications++
          }
        } else {
          console.warn(`No applicationId found or created for email: ${email.subject}`)
        }
      } else {
        console.log(`Email not job-related: ${email.subject}`)
      }
    }

    // Update the last sync time
    console.log(`Updating last sync time to: ${new Date().toISOString()}`)
    const { error: updateError } = await supabase
      .from("email_integrations")
      .update({
        last_sync: new Date().toISOString(),
        last_email_id: emails.length > 0 ? emails[0].id : integration.last_email_id,
      })
      .eq("id", integrationId)

    if (updateError) {
      console.error("Error updating last sync time:", updateError)
    }

    console.log(
      `Sync complete: ${processedCount} job-related emails, ${newApplications} new applications, ${updatedApplications} updated applications`,
    )
    return {
      success: true,
      processedCount: emails.length,
      jobRelatedCount: processedCount,
      newApplications,
      updatedApplications,
    }
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
