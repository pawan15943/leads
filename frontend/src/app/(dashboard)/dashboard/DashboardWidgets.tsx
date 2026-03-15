"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Phone, TrendingUp, Calendar, ClipboardList, Bell, AlertCircle } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { dashboardApi, type DashboardStats } from "@/lib/api"
import { cn } from "@/lib/utils"

function StatCardSkeleton() {
  return (
    <Card className="border-border/60 bg-card shadow-sm overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        <div className="size-4 animate-pulse rounded bg-muted" />
      </CardHeader>
      <CardContent className="pt-0 px-4 pb-3">
        <div className="h-7 w-16 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-3 w-20 animate-pulse rounded bg-muted" />
      </CardContent>
    </Card>
  )
}

export function DashboardWidgets({
  stats,
  loading,
}: {
  stats: DashboardStats | null
  loading: boolean
}) {
  const { isAdmin } = useAuth()

  if (loading) {
    return (
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  const w = stats?.widgets
  const adminStats = [
    { title: "Total Leads", value: w?.total_leads ?? 0, icon: Users, desc: "All time", href: "/leads" },
    { title: "New Today", value: w?.new_today ?? 0, icon: TrendingUp, desc: "Last 24 hrs", href: "/leads" },
    { title: "Today Follow-ups", value: w?.today_follow_ups ?? 0, icon: Calendar, desc: "Scheduled", href: "/leads?view=follow-ups" },
    { title: "Unassigned", value: w?.unassigned ?? 0, icon: Users, desc: "Need assignment", href: "/leads?view=unassigned" },
  ]
  const bdStats = [
    { title: "My Leads", value: w?.my_leads ?? 0, icon: Users, desc: "Assigned to you", href: "/leads" },
    { title: "Today's Tasks", value: w?.today_tasks ?? 0, icon: ClipboardList, desc: "Pending", href: "/tasks" },
    { title: "Today's Reminders", value: w?.today_reminders ?? 0, icon: Bell, desc: "Upcoming", href: "/reminders" },
    { title: "Overdue", value: (w?.overdue_tasks ?? 0) + (w?.overdue_reminders ?? 0), icon: AlertCircle, desc: "Needs attention", href: "/tasks" },
  ]
  const items = isAdmin ? adminStats : bdStats

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 animate-in fade-in duration-300">
      {items.map((stat) => {
        const Icon = stat.icon
        const isAlert = stat.title === "Overdue" && (stat.value as number) > 0
        return (
          <a key={stat.title} href={stat.href} className="block group">
            <Card
              className={cn(
                "border-border/60 bg-card shadow-sm transition-all hover:shadow-md hover:border-primary/30",
                isAlert && "border-destructive/50"
              )}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={cn("size-4 transition-colors group-hover:text-primary", isAlert ? "text-destructive" : "text-muted-foreground/80")} />
              </CardHeader>
              <CardContent className="pt-0 px-4 pb-3">
                <div className={cn("text-xl font-bold tracking-tight", isAlert && "text-destructive")}>
                  {typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{stat.desc}</p>
              </CardContent>
            </Card>
          </a>
        )
      })}
    </div>
  )
}
