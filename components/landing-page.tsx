"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Briefcase, LineChart, Bell, Mail, Linkedin, Brain, Smartphone, Laptop, ArrowRight } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-2 sm:px-4 lg:px-6 h-16 flex items-center w-full">
        <Link className="flex items-center justify-center" href="/">
          <Briefcase className="h-6 w-6 text-primary" />
          <span className="ml-2 text-xl font-bold">JobTrackr</span>
        </Link>
        <nav className="ml-auto flex gap-2 sm:gap-4 md:gap-6">
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/features">
            Features
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/pricing">
            Pricing
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/about">
            About
          </Link>
        </nav>
        <div className="ml-2 flex items-center gap-1 sm:gap-2">
          <Link href="/login">
            <Button variant="outline" size="sm">
              Log In
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">Sign Up</Button>
          </Link>
        </div>
      </header>
      <main className="flex-1 w-full">
        <section className="w-full py-8 sm:py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-2 sm:px-4 md:px-6">
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                    AI-Powered Job Application Tracking
                  </h1>
                  <p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
                    Automatically track your job applications across platforms without manual input. Works with email,
                    LinkedIn, and more.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/signup">
                    <Button size="lg" className="px-8">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/features">
                    <Button variant="outline" size="lg">
                      Learn More
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-center mt-8 lg:mt-0">
                <div className="relative w-full h-64 sm:h-80 md:h-[400px] bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Briefcase className="h-24 w-24 text-primary/40" />
                  </div>
                  <div className="z-10 bg-background/80 backdrop-blur-sm p-6 rounded-lg shadow-lg max-w-md">
                    <h3 className="text-xl font-bold mb-2">Passive Job Tracking</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Our AI automatically detects job applications from your email and connected platforms, so you
                      don't have to manually input anything.
                    </p>
                    <div className="flex gap-2">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div className="p-2 bg-primary/10 rounded-full">
                        <Linkedin className="h-5 w-5 text-primary" />
                      </div>
                      <div className="p-2 bg-primary/10 rounded-full">
                        <Brain className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-8 sm:py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-2 sm:px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Key Features</h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Everything you need to manage your job search effectively
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8">
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">AI-Powered Tracking</h3>
                <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                  Automatically detects and tracks job applications from emails and platforms
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                <div className="p-2 bg-primary/10 rounded-full">
                  <LineChart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Analytics Dashboard</h3>
                <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                  Track your application success rate and interview conversion metrics
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Bell className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Smart Notifications</h3>
                <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                  Get reminders for follow-ups and interview preparation
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Email Integration</h3>
                <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                  Connect your email to automatically track job applications
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Linkedin className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">LinkedIn Integration</h3>
                <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                  Track applications from LinkedIn without manual input
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Smartphone className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Cross-Platform</h3>
                <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                  Works seamlessly across Web, Android, and iOS devices
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-8 sm:py-12 md:py-24 lg:py-32">
          <div className="container px-2 sm:px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Works Across All Platforms
                </h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Access your job application data from any device
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 sm:gap-8 md:grid-cols-3 mt-8">
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                <Laptop className="h-12 w-12 text-primary mb-2" />
                <h3 className="text-xl font-bold">Web</h3>
                <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                  Access from any browser on desktop or laptop
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                <Smartphone className="h-12 w-12 text-primary mb-2" />
                <h3 className="text-xl font-bold">Android</h3>
                <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                  Native Android app for on-the-go tracking
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                <Smartphone className="h-12 w-12 text-primary mb-2" />
                <h3 className="text-xl font-bold">iOS</h3>
                <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                  Native iOS app with all features available
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-8 sm:py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-2 sm:px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Ready to Simplify Your Job Search?
                </h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Join thousands of job seekers who are tracking their applications effortlessly
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row w-full items-center justify-center">
                <Link href="/signup">
                  <Button size="lg" className="px-8">
                    Get Started for Free
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-4 sm:py-6 w-full shrink-0 items-center px-2 sm:px-4 md:px-6 border-t text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">© 2023 JobTrackr. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="/terms">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="/privacy">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  )
}
