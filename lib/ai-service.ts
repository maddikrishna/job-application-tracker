import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { EmailData } from "./email-service"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import type { Database } from "./database.types"

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
  metadata?: {
    confidence?: number
    reasoning?: string
    extractedFields?: {
      companyName?: string
      jobTitle?: string
      jobUrl?: string
      externalJobId?: string
    }
    raw?: unknown
  }
}

// Function to process an email with AI
export async function processEmailWithAI(email: EmailData, _userId: string): Promise<EmailProcessingResult> {
  try {
    console.log("Processing email with AI:", email.subject)

    // Use AI SDK to analyze the email content
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: `

Task:
Analyze the provided email to determine if it directly confirms or communicates about a specific job application. Strictly classify as job-related only if the email explicitly references a job application that the recipient (the user) has actively submitted.

Criteria for "Job-Related" (Mark as true):
    •	Application confirmation
    •	Status updates (application reviewed, shortlisted, etc.)
    •	Interview invitations or scheduling
    •	Job offers
    •	Application rejections

Criteria for "Not Job-Related" (Mark as false):
    •	Onboarding, welcome, sign-up, or account creation emails
    •	General platform updates
    •	Marketing, promotional, or newsletter communications
    •	Generic job alerts, job board promotions, or job recommendations unrelated to an explicitly submitted application
    •	Informational or unrelated content not explicitly tied to a user's specific application

Email Details:
    •	Subject: ${email.subject}
    •	Sender: ${email.sender}
    •	Content: ${email.content.replace(/<[^>]+>/g, '').slice(0, 2000)}

Provide your evaluation strictly following this JSON format:

{
  "isJobRelated": true/false,
  "category": "application" | "update" | "interview" | "offer" | "rejection" | "other",
  "companyName": "Company name if explicitly mentioned",
  "jobTitle": "Job title if explicitly mentioned",
  "jobDescription": "Brief job description summary if explicitly mentioned",
  "jobUrl": "URL to the job posting if explicitly provided",
  "externalJobId": "Job ID or reference number if explicitly provided",
  "suggestedStatus": "applied" | "interview" | "offer" | "rejected" | "saved",
  "confidence": 0 to 1 (confidence score in your analysis),
  "reasoning": "Clearly and explicitly justify why this email is or is not considered directly related to a specific job application. Include details or evidence from the email content to support your classification. Explicitly state if it's a marketing, onboarding, newsletter, general alert, or other non-specific communication."
}

Important: Be very strict and precise. Do not mark any general emails, marketing communications, newsletters, or non-application-specific job board promotions as "job-related." Only mark emails explicitly referencing a user's previously submitted application as "job-related."

      `,
    })

    console.log("AI response received:", text.substring(0, 100) + "...")

    // Parse the AI response robustly (handle code block formatting)
    try {
      let cleanText = text.trim()
      // Remove code block markers if present
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/^```json/, '').trim()
      }
      if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```/, '').trim()
      }
      if (cleanText.endsWith('```')) {
        cleanText = cleanText.replace(/```$/, '').trim()
      }
      const result = JSON.parse(cleanText)
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
          raw: result,
        },
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError, text)
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

  // Check if this is job related with more patterns
  const isJobRelated =
    subject.includes("application") ||
    subject.includes("job") ||
    subject.includes("position") ||
    subject.includes("career") ||
    subject.includes("interview") ||
    subject.includes("offer") ||
    subject.includes("rejection") ||
    subject.includes("hiring") ||
    subject.includes("recruitment") ||
    content.includes("thank you for applying") ||
    content.includes("we have received your application") ||
    content.includes("we would like to schedule an interview") ||
    content.includes("we are pleased to offer you") ||
    content.includes("application status") ||
    content.includes("application update") ||
    content.includes("interview invitation") ||
    content.includes("job offer") ||
    content.includes("application process")

  if (!isJobRelated) {
    console.log("Email not job-related based on fallback processing")
    return {
      isJobRelated: false,
      category: "other",
      metadata: {
        confidence: 0.5,
        reasoning: "Fallback processing did not detect job-related content",
      },
    }
  }

  // Determine the category with more patterns
  let category = "other"
  let suggestedStatus = undefined
  let confidence = 0.7

  if (
    subject.includes("application") ||
    subject.includes("applied") ||
    content.includes("thank you for applying") ||
    content.includes("we have received your application") ||
    content.includes("application received") ||
    content.includes("application submitted")
  ) {
    category = "application"
    suggestedStatus = "applied"
    confidence = 0.8
  } else if (
    subject.includes("interview") ||
    content.includes("would like to schedule an interview") ||
    content.includes("interview invitation") ||
    content.includes("interview scheduling") ||
    content.includes("interview process")
  ) {
    category = "interview"
    suggestedStatus = "interview"
    confidence = 0.85
  } else if (
    subject.includes("offer") ||
    content.includes("pleased to offer you") ||
    content.includes("job offer") ||
    content.includes("offer letter") ||
    content.includes("offer details")
  ) {
    category = "offer"
    suggestedStatus = "offer"
    confidence = 0.9
  } else if (
    subject.includes("rejection") ||
    subject.includes("not moving forward") ||
    content.includes("we regret to inform you") ||
    content.includes("we have decided to pursue other candidates") ||
    content.includes("unfortunately") ||
    content.includes("not selected") ||
    content.includes("other candidates")
  ) {
    category = "rejection"
    suggestedStatus = "rejected"
    confidence = 0.85
  } else if (
    subject.includes("update") ||
    content.includes("update on your application") ||
    content.includes("application status") ||
    content.includes("application progress")
  ) {
    category = "update"
    confidence = 0.75
  }

  // Extract company name with improved pattern matching
  const companyPatterns = [
    /from\s+([A-Za-z0-9\s]+)/i,
    /([A-Za-z0-9\s]+)\s+team/i,
    /([A-Za-z0-9\s]+)\s+recruitment/i,
    /([A-Za-z0-9\s]+)\s+hiring/i,
    /([A-Za-z0-9\s]+)\s+careers/i,
  ]

  let companyName = undefined
  for (const pattern of companyPatterns) {
    const match = email.content.match(pattern)
    if (match && match[1]) {
      companyName = match[1].trim()
      break
    }
  }

  if (!companyName) {
    companyName = extractCompanyFromEmail(sender)
  }

  // Extract job title with improved pattern matching
  const titlePatterns = [
    /application\s+for\s+([A-Za-z0-9\s]+)/i,
    /([A-Za-z0-9\s]+)\s+position/i,
    /([A-Za-z0-9\s]+)\s+role/i,
    /([A-Za-z0-9\s]+)\s+job/i,
    /([A-Za-z0-9\s]+)\s+opening/i,
  ]

  let jobTitle = undefined
  for (const pattern of titlePatterns) {
    const match = email.content.match(pattern)
    if (match && match[1]) {
      jobTitle = match[1].trim()
      break
    }
  }

  if (!jobTitle) {
    jobTitle = extractJobTitleFromSubject(subject)
  }

  // Extract job URL
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const urlMatches = email.content.match(urlRegex)
  const jobUrl = urlMatches ? urlMatches[0] : undefined

  // Extract job ID
  const jobIdPatterns = [
    /job\s+id[:\s]+([A-Za-z0-9-]+)/i,
    /reference\s+number[:\s]+([A-Za-z0-9-]+)/i,
    /requisition\s+id[:\s]+([A-Za-z0-9-]+)/i,
    /application\s+id[:\s]+([A-Za-z0-9-]+)/i,
  ]

  let externalJobId = undefined
  for (const pattern of jobIdPatterns) {
    const match = email.content.match(pattern)
    if (match && match[1]) {
      externalJobId = match[1].trim()
      break
    }
  }

  console.log("Fallback processing results:", {
    isJobRelated,
    category,
    companyName,
    jobTitle,
    jobUrl,
    externalJobId,
    suggestedStatus,
    confidence,
  })

  return {
    isJobRelated,
    category,
    companyName,
    jobTitle,
    jobDescription: email.content,
    jobUrl,
    externalJobId,
    suggestedStatus,
    metadata: {
      confidence,
      reasoning: "Processed using fallback pattern matching",
      extractedFields: {
        companyName,
        jobTitle,
        jobUrl,
        externalJobId,
      },
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
    console.log('AI result in parseJobApplicationEmail:', result)

    if (!result.isJobRelated) {
      return { success: false, message: "Email does not appear to be job related" }
    }

    const supabase = createServerComponentClient<Database>({ cookies })

    // Validate required fields for new applications
    if (!result.jobTitle || !result.companyName || 
        result.jobTitle === "N/A" || result.companyName === "N/A") {
      console.warn("Missing required fields for job application:", {
        jobTitle: result.jobTitle,
        companyName: result.companyName,
        subject: email.subject
      })
      return { success: false, message: "Missing required job application details" }
    }

    // Store the raw AI response for debugging
    const aiRaw = result.metadata && result.metadata.raw ? result.metadata.raw : result

    // Create job application record
    const { data, error } = await supabase
      .from("job_applications")
      .insert({
        user_id: userId,
        job_title: result.jobTitle,
        company_name: result.companyName,
        job_description: result.jobDescription,
        job_url: result.jobUrl,
        status: "applied",
        source: "email",
        external_job_id: result.externalJobId,
        applied_date: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        ai_raw: aiRaw,
      })
      .select()

    if (error) {
      console.error('Error inserting job application for job-related email:', error, result)
    } else if (!data || !data[0]) {
      console.warn('Job-related email was not saved to DB for unknown reason:', result)
    } else {
      console.log('Job-related application saved to DB:', data[0])
    }

    // Store the email only if data and data[0] exist
    if (data && data[0]) {
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
    } else {
      return { success: false, message: "Job-related email was not saved to DB" }
    }
  } catch (error) {
    console.error("Error parsing job application email:", error)
    throw error
  }
}

// Function to parse LinkedIn job applications
export async function parseLinkedInApplication(applicationData: Record<string, unknown>, userId: string) {
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
