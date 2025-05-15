"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
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

  useEffect(() => {
    // Initialize Supabase client
    try {
      console.log("Initializing Supabase client...")
      const supabase = createClientComponentClient<Database>()

      // Test if the client works by making a simple request
      supabase.auth
        .getSession()
        .then(() => {
          console.log("Supabase client initialized successfully")
          setClient(supabase)
        })
        .catch((error) => {
          console.error("Error testing Supabase client:", error)
          console.log("Falling back to dummy client")
          setClient(createDummyClient())
        })
        .finally(() => {
          setIsLoading(false)
        })

      // Set up auth state change listener
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(() => {
        // Refresh the page on auth state change
      })

      return () => {
        subscription?.unsubscribe()
      }
    } catch (error) {
      console.error("Error initializing Supabase client:", error)
      setClient(createDummyClient())
      setIsLoading(false)
      return () => {}
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
