"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Users, ClipboardList, FileUp, UserX, Phone, Calendar, BarChart3, Bell, Plus } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

export function QuickActions() {
  const { isAdmin } = useAuth()

  const actions = [
    { href: "/leads", label: "View Leads", icon: Users, primary: true },
    { href: "/leads?action=add", label: "Add Lead", icon: Plus, primary: false },
    { href: "/tasks", label: "My Tasks", icon: ClipboardList, primary: false },
    { href: "/reminders", label: "Reminders", icon: Bell, primary: false },
    { href: "/leads?view=follow-ups", label: "Today Follow-ups", icon: Calendar, primary: false },
    { href: "/leads?view=demo-scheduled", label: "Demo Scheduled", icon: Phone, primary: false },
    ...(isAdmin
      ? [
          { href: "/import", label: "Import Leads", icon: FileUp, primary: false },
          { href: "/leads?view=unassigned", label: "Unassigned Leads", icon: UserX, primary: false },
          { href: "/reports", label: "Reports", icon: BarChart3, primary: false },
        ]
      : []),
  ]

  return (
    <Card className="border-border/60 bg-card shadow-sm">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks for quick access</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {actions.map((a) => {
          const Icon = a.icon
          return (
            <Link
              key={a.href + a.label}
              href={a.href}
              className={
                a.primary
                  ? "inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                  : "inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-muted hover:border-primary/30 transition-colors"
              }
            >
              <Icon className="size-4" />
              {a.label}
            </Link>
          )
        })}
      </CardContent>
    </Card>
  )
}
