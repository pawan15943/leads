"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { DashboardWidgets } from "./DashboardWidgets"
import { LeadPipeline } from "./LeadPipeline"
import { LeadSourceBreakdown } from "./LeadSourceBreakdown"
import { QuickActions } from "./QuickActions"
import { LeadInsights } from "./LeadInsights"
import { dashboardApi, type DashboardStats } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

const DASHBOARD_CACHE_MS = 60_000 // 1 min

let dashboardCache: { data: DashboardStats; ts: number } | null = null

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(() => dashboardCache?.data ?? null)
  const [loading, setLoading] = useState(!dashboardCache)
  const [error, setError] = useState<string | null>(null)
  const mounted = useRef(true)

  const fetchStats = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    setError(null)
    try {
      const data = await dashboardApi.stats()
      if (mounted.current) {
        setStats(data)
        dashboardCache = { data, ts: Date.now() }
      }
    } catch (err) {
      if (mounted.current) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard")
        setStats(null)
      }
    } finally {
      if (mounted.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    mounted.current = true
    const cached = dashboardCache
    const stale = !cached || Date.now() - cached.ts > DASHBOARD_CACHE_MS
    if (cached && !stale) {
      setStats(cached.data)
      setLoading(false)
      return
    }
    if (cached) setStats(cached.data)
    fetchStats(!cached)
    return () => { mounted.current = false }
  }, [fetchStats])

  const greeting = (() => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 17) return "Good afternoon"
    return "Good evening"
  })()

  return (
    <div className="min-w-0 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
            {greeting}{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
            Overview of your leads, pipeline, and key metrics at a glance
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchStats(true)}
          disabled={loading}
          className="shrink-0"
        >
          <RefreshCw className={`mr-2 size-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
          <Button variant="link" size="sm" className="ml-2 h-auto p-0" onClick={() => fetchStats(true)}>
            Retry
          </Button>
        </div>
      )}

      <DashboardWidgets stats={stats} loading={loading} />

      <div className="grid gap-4 lg:grid-cols-2">
        <LeadPipeline pipeline={stats?.pipeline ?? null} loading={loading} />
        <LeadSourceBreakdown sources={stats?.sources ?? null} loading={loading} />
      </div>

      <LeadInsights stats={stats} loading={loading} />

      <QuickActions />
    </div>
  )
}
