"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useRef } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { SupabaseClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/lib/database.types"

type SupabaseContext = {
  supabase: SupabaseClient<Database>
}

const Context = createContext<SupabaseContext | undefined>(undefined)

// Create a dummy client that won't make actual API calls
const createDummyClient = () => {
  return {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithOtp: () => Promise.resolve({ data: null, error: null }),
      signOut: () => Promise.resolve({ error: null }),
    },
    from: (table: string) => ({
      select: () => ({ data: null, error: null }),
      insert: () => ({ data: null, error: null }),
      update: () => ({ data: null, error: null }),
      delete: () => ({ data: null, error: null }),
      eq: () => ({ data: null, error: null }),
    }),
    storage: {
      from: (bucket: string) => ({
        upload: () => Promise.resolve({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: "" } }),
      }),
    },
    rpc: () => Promise.resolve({ data: null, error: null }),
  } as unknown as SupabaseClient<Database>
}

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<SupabaseClient<Database> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    let unsub: (() => void) | undefined

    async function init() {
      try {
        const supabase = createClientComponentClient<Database>()
        // Only call getSession once, and don't retry rapidly on error
        await supabase.auth.getSession()
        setClient(supabase)

        // Set up auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
            // Force a router refresh to update the UI state
            window.location.reload()
          }
        })
        unsub = () => subscription?.unsubscribe()
      } catch (error) {
        console.error("Error initializing Supabase client:", error)
        setClient(createDummyClient())
      } finally {
        setIsLoading(false)
      }
    }

    init()

    return () => {
      if (unsub) unsub()
    }
  }, [])

  // Show a loading state while Supabase is initializing
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Loading application...</h2>
          <p className="text-muted-foreground">Please wait while we set up your experience</p>
        </div>
      </div>
    )
  }

  // If client is null (should never happen due to dummy client), show error
  if (!client) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="max-w-md rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <h2 className="text-xl font-semibold text-destructive">Application Error</h2>
          <p className="mt-2 text-muted-foreground">
            There was a problem initializing the application. Please try refreshing the page.
          </p>
        </div>
      </div>
    )
  }

  return <Context.Provider value={{ supabase: client }}>{children}</Context.Provider>
}

export const useSupabase = () => {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error("useSupabase must be used inside SupabaseProvider")
  }
  return context
}
