import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { validateAndUpdateGmailIntegrations } from "@/lib/email-service"

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  // @ts-expect-error Next.js 15+ cookies returns a Promise, but Supabase expects a sync function
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  const { data: user, error } = await supabase.auth.getUser()
  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  await validateAndUpdateGmailIntegrations(user.user.id, cookieStore)
  return NextResponse.json({ success: true })
} 