import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { parseJobApplicationEmail } from "@/lib/ai-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate webhook payload
    if (!body.userId || !body.emailContent) {
      return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 })
    }

    // Get user from Supabase
    const supabase = createRouteHandlerClient({ cookies })
    const { data: user, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Process the email content with AI
    const result = await parseJobApplicationEmail(body.emailContent, body.userId)

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error("Error processing email webhook:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
