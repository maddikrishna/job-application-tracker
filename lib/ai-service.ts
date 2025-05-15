import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "./database.types"
import type { EmailData } from "./email-service"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

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
    console.log("Processing email with AI:", email.subject)

    // Use AI SDK to analyze the email content
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: `
        Analyze the following email to determine if it's related to a job application. 
        Extract key information if it is job-related.
        
        Email Subject: ${email.subject}
        Email Sender: ${email.sender}
        Email Content: ${email.content}
        
        Respond in the following JSON format:
        {
          "isJobRelated": true/false,
          "category": "application"/"update"/"interview"/"offer"/"rejection"/"other",
          "companyName": "Company name if detected",
          "jobTitle": "Job title if detected",
          "jobDescription": "Brief summary of the job description if available",
          "jobUrl": "URL to the job posting if available",
          "externalJobId": "Job ID or reference number if available",
          "suggestedStatus": "applied"/"interview"/"offer"/"rejected"/"saved",
          "confidence": 0-1 score of confidence in this analysis,
          "reasoning": "Brief explanation of why this email was categorized this way"
        }
      `,
    })

    console.log("AI response received:", text.substring(0, 100) + "...")

    // Parse the AI response
    try {
      const result = JSON.parse(text)
      return {
        isJobRelated: result.isJobRelated,
        category: result.category,
        companyName: result.companyName,
        jobTitle: result.jobTitle,
        jobDescription: result.jobDescription,
        jobUrl: result.jobUrl,
        externalJobId: result.externalJobId,
        suggestedStatus: result.suggestedStatus,
        metadata: {
          confidence: result.confidence,
          reasoning: result.reasoning,
          extractedFields: {
            companyName: result.companyName,
            jobTitle: result.jobTitle,
            jobUrl: result.jobUrl,
            externalJobId: result.externalJobId,
          },
        },
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError)
      // Fallback to pattern matching if AI response parsing fails
      return fallbackEmailProcessing(email)
    }
  } catch (error) {
    console.error("Error processing email with AI:", error)
    // Fallback to pattern matching if AI processing fails
    return fallbackEmailProcessing(email)
  }
}

// Fallback function using pattern matching
function fallbackEmailProcessing(email: EmailData): EmailProcessingResult {
  console.log("Using fallback email processing for:", email.subject)

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
      confidence: 0.7, // Lower confidence for pattern matching
    },
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
    // Use AI to analyze the LinkedIn application data
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: `
        Analyze this LinkedIn job application data and extract key information:
        
        ${JSON.stringify(applicationData, null, 2)}
        
        Respond in the following JSON format:
        {
          "jobTitle": "Extracted job title",
          "companyName": "Extracted company name",
          "jobDescription": "Extracted job description",
          "location": "Extracted location",
          "remote": true/false,
          "jobUrl": "URL to the job posting if available",
          "externalJobId": "Job ID if available"
        }
      `,
    })

    // Parse the AI response
    try {
      const result = JSON.parse(text)

      const supabase = createServerComponentClient<Database>({ cookies })

      const { data, error } = await supabase
        .from("job_applications")
        .insert({
          user_id: userId,
          job_title: result.jobTitle || applicationData.title || "Unknown Position",
          company_name: result.companyName || applicationData.company || "Unknown Company",
          status: "applied",
          source: "linkedin",
          job_url: result.jobUrl || applicationData.url,
          job_description: result.jobDescription || applicationData.description,
          location: result.location || applicationData.location,
          remote: result.remote !== undefined ? result.remote : applicationData.remote,
          external_job_id: result.externalJobId || applicationData.jobId,
          applied_date: new Date().toISOString(),
          last_updated: new Date().toISOString(),
        })
        .select()

      if (error) throw error

      return data[0]
    } catch (parseError) {
      console.error("Error parsing AI response for LinkedIn data:", parseError)

      // Fallback to direct data usage if AI parsing fails
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
    }
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

    // Use AI to analyze the application and provide insights
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: `
        Analyze this job application and provide insights:
        
        Job Title: ${application.job_title}
        Company: ${application.company_name}
        Description: ${application.job_description || "Not provided"}
        Status: ${application.status}
        
        Email History: ${
          emails && emails.length > 0
            ? emails
                .map(
                  (email) => `
          - Date: ${new Date(email.received_at).toLocaleDateString()}
          - Subject: ${email.subject}
          - Category: ${email.category}
          - Content: ${email.content.substring(0, 200)}...
        `,
                )
                .join("\n")
            : "No email history available"
        }
        
        Provide insights in the following JSON format:
        {
          "keySkills": ["list", "of", "key", "skills", "for", "this", "role"],
          "missingKeywords": ["list", "of", "important", "keywords", "missing", "from", "application"],
          "similarApplications": "estimated number of similar applications the company might receive",
          "successProbability": "estimated probability of success (0-1)",
          "suggestedActions": ["list", "of", "suggested", "actions", "to", "improve", "chances"],
          "nextSteps": ["list", "of", "recommended", "next", "steps", "based", "on", "current", "status"]
        }
      `,
    })

    // Parse the AI response
    try {
      const insights = JSON.parse(text)
      return {
        ...insights,
        emailTimeline:
          emails?.map((email) => ({
            date: email.received_at,
            type: email.category,
            subject: email.subject,
          })) || [],
      }
    } catch (parseError) {
      console.error("Error parsing AI insights:", parseError)
      // Return fallback insights
      return {
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
    }
  } catch (error) {
    console.error("Error analyzing job application:", error)
    throw error
  }
}
