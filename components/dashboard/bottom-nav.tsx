import Link from "next/link"
import { usePathname } from "next/navigation"
import { Briefcase, LayoutDashboard, LineChart, Settings } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/applications", label: "Applications", icon: Briefcase },
  { href: "/dashboard/analytics", label: "Analytics", icon: LineChart },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
]

export default function BottomNav() {
  const pathname = usePathname()
  return (
    <TooltipProvider delayDuration={100}>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-background border-t shadow-lg rounded-t-2xl flex justify-around items-center h-16 px-2 sm:hidden">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Tooltip key={href}>
            <TooltipTrigger asChild>
              <Link
                href={href}
                className={`flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors duration-150 px-2 py-1 rounded-lg ${
                  pathname === href
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                <Icon className="h-6 w-6 mb-0.5" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs px-2 py-1 rounded-md shadow-md">
              {label}
            </TooltipContent>
          </Tooltip>
        ))}
      </nav>
    </TooltipProvider>
  )
} 