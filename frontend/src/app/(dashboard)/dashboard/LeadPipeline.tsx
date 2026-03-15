"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronRight, Loader2 } from "lucide-react"
import type { DashboardStats } from "@/lib/api"
import { cn } from "@/lib/utils"

const STAGE_COLORS: Record<string, string> = {
  new: "bg-blue-500",
  contacted: "bg-amber-500",
  interested: "bg-emerald-500",
  "demo-scheduled": "bg-violet-500",
  closed: "bg-slate-500",
}

function getStageColor(slug: string, color: string | null) {
  if (color) return color.startsWith("#") ? "" : color
  return STAGE_COLORS[slug] || "bg-primary"
}

export function LeadPipeline({
  pipeline,
  loading,
}: {
  pipeline: DashboardStats["pipeline"] | null
  loading: boolean
}) {
  const stages = pipeline ?? []
  const total = stages.reduce((s, st) => s + st.count, 0)

  if (loading) {
    return (
      <Card className="border-border/60 bg-card shadow-sm">
        <CardHeader>
          <CardTitle>Lead Pipeline</CardTitle>
          <CardDescription>Leads by stage — from new to demo scheduled</CardDescription>
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
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Lead Pipeline</CardTitle>
          <CardDescription>
            Leads by stage — from new to demo scheduled
          </CardDescription>
        </div>
        <Link
          href="/leads"
          className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
        >
          View all
          <ChevronRight className="size-4" />
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stages.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No stages configured</p>
          ) : (
            stages.map((stage) => {
              const pct = total > 0 ? (stage.count / total) * 100 : 0
              const href = stage.name === "Interested"
                ? "/leads?view=interested"
                : stage.name === "Demo Scheduled"
                  ? "/leads?view=demo-scheduled"
                  : `/leads?stage=${encodeURIComponent(stage.name)}`
              const bgColor = getStageColor(stage.slug, stage.color)
              return (
                <Link key={stage.slug} href={href} className="block group">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium">{stage.name}</span>
                    <span className="text-sm text-muted-foreground">{stage.count} leads</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all group-hover:opacity-90",
                        bgColor.startsWith("#") ? "" : bgColor
                      )}
                      style={bgColor.startsWith("#") ? { width: `${Math.max(pct, 4)}%`, backgroundColor: bgColor } : { width: `${Math.max(pct, 4)}%` }}
                    />
                  </div>
                </Link>
              )
            })
          )}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Total: {total} leads in pipeline. Click a stage to filter.
        </p>
      </CardContent>
    </Card>
  )
}
