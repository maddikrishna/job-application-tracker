"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useSupabase } from "@/components/supabase-provider"
import type { User } from "@supabase/supabase-js"
import { Briefcase, LayoutDashboard, Settings, LogOut, Menu, PlusCircle, LineChart, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface DashboardNavProps {
  user: User
}

export default function DashboardNav({ user }: DashboardNavProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { supabase } = useSupabase()
  const [isOpen, setIsOpen] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase()
  }

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      name: "Applications",
      href: "/dashboard/applications",
      icon: <Briefcase className="h-5 w-5" />,
    },
    {
      name: "Analytics",
      href: "/dashboard/analytics",
      icon: <LineChart className="h-5 w-5" />,
    },
    {
      name: "Notifications",
      href: "/dashboard/notifications",
      icon: <Bell className="h-5 w-5" />,
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ]

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 sm:max-w-sm">
              <div className="flex items-center gap-2 pb-4 border-b mb-4">
                <Briefcase className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">JobTrackr</span>
              </div>
              <nav className="flex flex-col gap-2">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent ${
                      pathname === item.href ? "bg-accent" : ""
                    }`}
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
          <Link href="/dashboard" className="flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold hidden md:inline-block">JobTrackr</span>
          </Link>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 text-sm font-medium ${
                pathname === item.href ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.icon}
              {item.name}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/applications/new">
            <Button size="sm" className="hidden md:flex">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Application
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar>
                  <AvatarFallback>{getInitials(user.email || "")}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
