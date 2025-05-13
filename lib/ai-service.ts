import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "./database.types"
import type { EmailData } from "./email-service"

// Result interface for email processing
interface EmailProcessingResult {
  isJobRelated: boolean
  category: string // 'application', 'update', 'interview', 'offer', 'rejection', 'other'
  companyName?: string
  jobTitle?: string
  jobDescription?: string
  jobUrl?: string
  externalJobId?: string
  suggestedStatus?: string
  metadata?: any
}

// Function to process an email with AI
export async function processEmailWithAI(email: EmailData, userId: string): Promise<EmailProcessingResult> {
  try {
    // In a real implementation, this would use an AI model to analyze the email
    // For now, we'll use simple pattern matching

    const subject = email.subject.toLowerCase()
    const content = email.content.toLowerCase()
    const sender = email.sender.toLowerCase()

    // Check if this is job related
    const isJobRelated =
      subject.includes("application") ||
      subject.includes("job") ||
      subject.includes("position") ||
      subject.includes("career") ||
      subject.includes("interview") ||
      subject.includes("offer") ||
      content.includes("thank you for applying") ||
      content.includes("we have received your application") ||
      content.includes("we would like to schedule an interview") ||
      content.includes("we are pleased to offer you")

    if (!isJobRelated) {
      return {
        isJobRelated: false,
        category: "other",
      }
    }

    // Determine the category
    let category = "other"
    let suggestedStatus = undefined

    if (
      subject.includes("application") ||
      subject.includes("applied") ||
      content.includes("thank you for applying") ||
      content.includes("we have received your application")
    ) {
      category = "application"
      suggestedStatus = "applied"
    } else if (
      subject.includes("interview") ||
      content.includes("would like to schedule an interview") ||
      content.includes("interview invitation")
    ) {
      category = "interview"
      suggestedStatus = "interview"
    } else if (subject.includes("offer") || content.includes("pleased to offer you") || content.includes("job offer")) {
      category = "offer"
      suggestedStatus = "offer"
    } else if (
      subject.includes("rejection") ||
      subject.includes("not moving forward") ||
      content.includes("we regret to inform you") ||
      content.includes("we have decided to pursue other candidates")
    ) {
      category = "rejection"
      suggestedStatus = "rejected"
    } else if (subject.includes("update") || content.includes("update on your application")) {
      category = "update"
    }

    // Extract company name (simple pattern matching)
    const companyRegex = /from\s+([A-Za-z0-9\s]+)|([A-Za-z0-9\s]+)\s+team/i
    const companyMatch = email.content.match(companyRegex)
    const companyName = companyMatch ? companyMatch[1] || companyMatch[2] : extractCompanyFromEmail(sender)

    // Extract job title (simple pattern matching)
    const titleRegex = /application\s+for\s+([A-Za-z0-9\s]+)|([A-Za-z0-9\s]+)\s+position|([A-Za-z0-9\s]+)\s+role/i
    const titleMatch = email.content.match(titleRegex)
    const jobTitle = titleMatch ? titleMatch[1] || titleMatch[2] || titleMatch[3] : extractJobTitleFromSubject(subject)

    // Extract job ID (simple pattern matching)
    const jobIdRegex =
      /job\s+id[:\s]+([A-Za-z0-9-]+)|reference\s+number[:\s]+([A-Za-z0-9-]+)|requisition\s+id[:\s]+([A-Za-z0-9-]+)/i
    const jobIdMatch = email.content.match(jobIdRegex)
    const externalJobId = jobIdMatch ? jobIdMatch[1] || jobIdMatch[2] || jobIdMatch[3] : undefined

    // Extract job URL (simple pattern matching)
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const urlMatches = email.content.match(urlRegex)
    const jobUrl = urlMatches ? urlMatches[0] : undefined

    return {
      isJobRelated,
      category,
      companyName: companyName?.trim(),
      jobTitle: jobTitle?.trim(),
      jobDescription: email.content,
      jobUrl,
      externalJobId,
      suggestedStatus,
      metadata: {
        extractedFields: {
          companyName: companyName?.trim(),
          jobTitle: jobTitle?.trim(),
          jobUrl,
          externalJobId,
        },
        confidence: 0.8, // Mock confidence score
      },
    }
  } catch (error) {
    console.error("Error processing email with AI:", error)
    return {
      isJobRelated: false,
      category: "other",
    }
  }
}

// Helper function to extract company name from email address
function extractCompanyFromEmail(email: string): string | undefined {
  const match = email.match(/@([^.]+)/)
  if (match && match[1]) {
    return match[1].charAt(0).toUpperCase() + match[1].slice(1)
  }
  return undefined
}

// Helper function to extract job title from subject
function extractJobTitleFromSubject(subject: string): string | undefined {
  // Remove common prefixes
  const cleanSubject = subject
    .replace(/re:/i, "")
    .replace(/fwd:/i, "")
    .replace(/application for/i, "")
    .replace(/job application:/i, "")
    .trim()

  // If the subject is short, it might be just the job title
  if (cleanSubject.split(" ").length <= 5) {
    return cleanSubject
  }

  return undefined
}

// Function to parse job application emails
export async function parseJobApplicationEmail(emailContent: string, userId: string) {
  try {
    const email: EmailData = {
      id: "manual-" + Date.now(),
      subject: "Manual Email Import",
      sender: "unknown@example.com",
      receivedAt: new Date(),
      content: emailContent,
    }

    const result = await processEmailWithAI(email, userId)

    if (!result.isJobRelated) {
      return { success: false, message: "Email does not appear to be job related" }
    }

    const supabase = createServerComponentClient<Database>({ cookies })

    // Create job application record
    const { data, error } = await supabase
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
        applied_date: new Date().toISOString(),
        last_updated: new Date().toISOString(),
      })
      .select()

    if (error) throw error

    // Store the email
    await supabase.from("application_emails").insert({
      user_id: userId,
      application_id: data[0].id,
      email_id: email.id,
      subject: email.subject,
      sender: email.sender,
      received_at: email.receivedAt.toISOString(),
      content: email.content,
      category: result.category,
      metadata: result.metadata,
    })

    return { success: true, application: data[0] }
  } catch (error) {
    console.error("Error parsing job application email:", error)
    throw error
  }
}

// Function to parse LinkedIn job applications
export async function parseLinkedInApplication(applicationData: any, userId: string) {
  try {
    // This would be replaced with actual AI processing of LinkedIn data
    // For now, we'll just use the data directly

    const supabase = createServerComponentClient<Database>({ cookies })

    const { data, error } = await supabase
      .from("job_applications")
      .insert({
        user_id: userId,
        job_title: applicationData.title || "Unknown Position",
        company_name: applicationData.company || "Unknown Company",
        status: "applied",
        source: "linkedin",
        job_url: applicationData.url,
        job_description: applicationData.description,
        location: applicationData.location,
        remote: applicationData.remote,
        external_job_id: applicationData.jobId,
        applied_date: new Date().toISOString(),
        last_updated: new Date().toISOString(),
      })
      .select()

    if (error) throw error

    return data[0]
  } catch (error) {
    console.error("Error parsing LinkedIn application:", error)
    throw error
  }
}

// Function to analyze job application and provide insights
export async function analyzeJobApplication(applicationId: string) {
  try {
    const supabase = createServerComponentClient<Database>({ cookies })

    // Get the job application
    const { data: application, error } = await supabase
      .from("job_applications")
      .select("*")
      .eq("id", applicationId)
      .single()

    if (error) throw error

    // Get related emails
    const { data: emails } = await supabase
      .from("application_emails")
      .select("*")
      .eq("application_id", applicationId)
      .order("received_at", { ascending: true })

    // This would be replaced with actual AI analysis
    // For now, we'll return some simple insights based on the emails

    const insights = {
      keySkills: ["communication", "teamwork", "problem-solving"],
      missingKeywords: ["leadership", "project management"],
      similarApplications: 3,
      successProbability: 0.65,
      emailTimeline:
        emails?.map((email) => ({
          date: email.received_at,
          type: email.category,
          subject: email.subject,
        })) || [],
      suggestedActions: [
        "Follow up in 7 days if no response",
        "Connect with employees on LinkedIn",
        "Research recent company news for interview prep",
      ],
    }

    return insights
  } catch (error) {
    console.error("Error analyzing job application:", error)
    throw error
  }
}
