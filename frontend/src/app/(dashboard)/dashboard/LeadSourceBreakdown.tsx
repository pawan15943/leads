"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronRight, Loader2 } from "lucide-react"
import type { DashboardStats } from "@/lib/api"

export function LeadSourceBreakdown({
  sources,
  loading,
}: {
  sources: DashboardStats["sources"] | null
  loading: boolean
}) {
  const items = sources ?? []
  const total = items.reduce((s, x) => s + x.count, 0)

  if (loading) {
    return (
      <Card className="border-border/60 bg-card shadow-sm">
        <CardHeader>
          <CardTitle>Lead Sources</CardTitle>
          <CardDescription>Where your leads come from</CardDescription>
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
          <CardTitle>Lead Sources</CardTitle>
          <CardDescription>
            Where your leads come from
          </CardDescription>
        </div>
        <Link
          href="/master-data/lead-sources"
          className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
        >
          Manage
          <ChevronRight className="size-4" />
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No sources configured</p>
          ) : (
            items.map((src) => (
              <div key={src.slug} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{src.name}</span>
                    <span className="text-muted-foreground">{src.count} ({src.pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary/70 transition-all hover:bg-primary/90"
                      style={{ width: `${Math.max(src.pct, 2)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Total: {total} leads by source. Configure sources in Master Data.
        </p>
      </CardContent>
    </Card>
  )
}
