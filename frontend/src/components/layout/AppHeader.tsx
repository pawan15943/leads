"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/theme/ThemeToggle"
import { ReminderNotificationDropdown } from "@/components/layout/ReminderNotificationDropdown"
import { ChevronRight } from "lucide-react"

const breadcrumbMap: Record<string, string> = {
  dashboard: "Dashboard",
  leads: "Leads",
  "follow-ups": "Today Follow-ups",
  interested: "Interested Leads",
  "demo-scheduled": "Demo Scheduled",
  tasks: "Tasks",
  reminders: "Reminders",
  reports: "Reports",
  users: "Users",
  roles: "Roles",
  permissions: "Permissions",
  "master-data": "Master Data",
  "lead-stages": "Lead Stages",
  "lead-sources": "Lead Sources",
  "lead-types": "Lead Types",
  "call-status": "Call Status",
  tags: "Tags",
  import: "Import",
  settings: "Settings",
}

export function AppHeader() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)
  const breadcrumbs = segments.map((seg, i) => ({
    label: breadcrumbMap[seg] || seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " "),
    href: "/" + segments.slice(0, i + 1).join("/"),
  }))

  return (
    <header className="flex h-14 items-center gap-4 border-b border-border/60 bg-background px-6">
      <SidebarTrigger className="-ml-1 rounded-md hover:bg-muted/60" />
      <nav className="flex flex-1 items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:text-foreground transition-colors">
          Lead Management
        </Link>
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1.5">
            <ChevronRight className="size-4 shrink-0 text-muted-foreground/70" />
            <Link
              href={crumb.href}
              className={i === breadcrumbs.length - 1 ? "font-medium text-foreground" : "hover:text-foreground transition-colors"}
            >
              {crumb.label}
            </Link>
          </span>
        ))}
      </nav>
      <ReminderNotificationDropdown />
      <ThemeToggle />
    </header>
  )
}
