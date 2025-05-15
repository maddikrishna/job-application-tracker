"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { SupabaseClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/lib/database.types"

type SupabaseContext = {
  supabase: SupabaseClient<Database> | null
  isSupabaseReady: boolean
  supabaseError: Error | null
}

const Context = createContext<SupabaseContext | undefined>(undefined)

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabase, setSupabase] = useState<SupabaseClient<Database> | null>(null)
  const [isSupabaseReady, setIsSupabaseReady] = useState(false)
  const [supabaseError, setSupabaseError] = useState<Error | null>(null)

  useEffect(() => {
    try {
      console.log("Initializing Supabase client...")

      // Check if environment variables are available
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      console.log("Supabase URL available:", !!supabaseUrl)
      console.log("Supabase Anon Key available:", !!supabaseAnonKey)

      if (!supabaseUrl || !supabaseAnonKey) {
        console.error("Supabase environment variables are missing!")
        throw new Error("Supabase environment variables are missing. Please check your configuration.")
      }

      // Create the Supabase client
      const client = createClientComponentClient<Database>()
      setSupabase(client)
      setIsSupabaseReady(true)
      console.log("Supabase client initialized successfully")

      // Set up auth state change listener
      const {
        data: { subscription },
      } = client.auth.onAuthStateChange(() => {
        // Refresh the page on auth state change
        // This is a simple way to handle auth state changes
      })

      return () => {
        subscription?.unsubscribe()
      }
    } catch (error) {
      console.error("Error initializing Supabase client:", error)
      setSupabaseError(error instanceof Error ? error : new Error(String(error)))
      setIsSupabaseReady(true) // Still mark as ready so the app can render an error state
    }
  }, [])

  // Show a loading state while Supabase is initializing
  if (!isSupabaseReady) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Loading application...</h2>
          <p className="text-muted-foreground">Please wait while we set up your experience</p>
        </div>
      </div>
    )
  }

  // Show an error state if Supabase initialization failed
  if (supabaseError) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="max-w-md rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <h2 className="text-xl font-semibold text-destructive">Configuration Error</h2>
          <p className="mt-2 text-muted-foreground">
            There was a problem connecting to the database. This is likely due to missing environment variables.
          </p>
          <div className="mt-4 rounded bg-background/80 p-4 text-left text-sm">
            <p className="font-mono">{supabaseError.message}</p>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Please check your environment variables and try again.</p>
        </div>
      </div>
    )
  }

  return (
    <Context.Provider
      value={{
        supabase,
        isSupabaseReady,
        supabaseError,
      }}
    >
      {children}
    </Context.Provider>
  )
}

export const useSupabase = () => {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error("useSupabase must be used inside SupabaseProvider")
  }

  if (!context.supabase) {
    throw new Error("Supabase client is not available. Check your environment variables.")
  }

  return { supabase: context.supabase }
}
