"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UserX, Phone, AlertCircle, TrendingUp, Loader2 } from "lucide-react"
import type { DashboardStats } from "@/lib/api"

const insightConfig = (w: NonNullable<DashboardStats["widgets"]>) => [
  {
    title: "Unassigned Leads",
    value: w.unassigned,
    desc: "Waiting for BD assignment",
    icon: UserX,
    href: "/leads?view=unassigned",
    color: "text-amber-600",
    bg: "bg-amber-500/10",
  },
  {
    title: "Today Follow-ups",
    value: w.today_follow_ups,
    desc: "Scheduled for today",
    icon: AlertCircle,
    href: "/leads?view=follow-ups",
    color: "text-blue-600",
    bg: "bg-blue-500/10",
  },
  {
    title: "Demo Scheduled",
    value: w.demo_scheduled,
    desc: "Upcoming demos",
    icon: Phone,
    href: "/leads?view=demo-scheduled",
    color: "text-violet-600",
    bg: "bg-violet-500/10",
  },
  {
    title: "Conversion Rate",
    value: `${w.conversion_rate}%`,
    desc: "New → Demo Scheduled",
    icon: TrendingUp,
    href: "/reports",
    color: "text-emerald-600",
    bg: "bg-emerald-500/10",
  },
]

const bdInsightConfig = (w: NonNullable<DashboardStats["widgets"]>) => [
  {
    title: "Overdue Items",
    value: w.overdue_tasks + w.overdue_reminders,
    desc: "Tasks & reminders",
    icon: AlertCircle,
    href: "/tasks",
    color: "text-destructive",
    bg: "bg-destructive/10",
  },
  {
    title: "Today Follow-ups",
    value: w.today_follow_ups,
    desc: "Your scheduled calls",
    icon: Phone,
    href: "/leads?view=follow-ups",
    color: "text-blue-600",
    bg: "bg-blue-500/10",
  },
  {
    title: "My Demos",
    value: w.demo_scheduled,
    desc: "Your scheduled demos",
    icon: Phone,
    href: "/leads?view=demo-scheduled",
    color: "text-violet-600",
    bg: "bg-violet-500/10",
  },
  {
    title: "Conversion Rate",
    value: `${w.conversion_rate}%`,
    desc: "Your pipeline performance",
    icon: TrendingUp,
    href: "/reports",
    color: "text-emerald-600",
    bg: "bg-emerald-500/10",
  },
]

export function LeadInsights({
  stats,
  loading,
}: {
  stats: DashboardStats | null
  loading: boolean
}) {
  const w: DashboardStats["widgets"] = stats?.widgets ?? {
    total_leads: 0, new_today: 0, today_follow_ups: 0, unassigned: 0, my_leads: 0,
    today_tasks: 0, overdue_tasks: 0, today_reminders: 0, overdue_reminders: 0,
    interested: 0, demo_scheduled: 0, conversion_rate: 0,
  }
  const items = stats?.is_admin ? insightConfig(w) : bdInsightConfig(w)

  if (loading) {
    return (
      <Card className="border-border/60 bg-card shadow-sm">
        <CardHeader>
          <CardTitle>Lead Insights</CardTitle>
          <CardDescription>Key metrics to help you prioritize</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/60 bg-card shadow-sm">
      <CardHeader>
        <CardTitle>Lead Insights</CardTitle>
        <CardDescription>
          Key metrics to help you prioritize and understand your pipeline
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.title}
                href={item.href}
                className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 hover:border-primary/30"
              >
                <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${item.bg} ${item.color}`}>
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xl font-bold tracking-tight">
                    {typeof item.value === "number" ? item.value.toLocaleString() : item.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
