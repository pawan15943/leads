"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataTableCard } from "@/components/ui/data-table-card"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Bell, Calendar, Loader2 } from "lucide-react"
import { remindersApi, type ApiReminder } from "@/lib/api"

function formatReminder(dateStr: string, timeStr: string | null) {
  try {
    const d = new Date(dateStr)
    const datePart = d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    if (timeStr) {
      const [h, m] = timeStr.split(":")
      return `${datePart} at ${parseInt(h, 10)}:${m}`
    }
    return datePart
  } catch {
    return dateStr
  }
}

export default function RemindersPage() {
  const [todayReminders, setTodayReminders] = useState<ApiReminder[]>([])
  const [overdueReminders, setOverdueReminders] = useState<ApiReminder[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"today" | "overdue">("today")

  const fetchReminders = useCallback(() => {
    setLoading(true)
    Promise.all([
      remindersApi.listToday(100),
      remindersApi.listOverdue(100),
    ])
      .then(([today, overdue]) => {
        setTodayReminders(today || [])
        setOverdueReminders(overdue || [])
      })
      .catch(() => {
        setTodayReminders([])
        setOverdueReminders([])
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchReminders()
  }, [fetchReminders])

  const reminders = activeTab === "today" ? todayReminders : overdueReminders

  return (
    <div className="min-w-0 space-y-3">
      <div>
        <h1 className="text-lg font-semibold sm:text-xl">Reminders</h1>
        <p className="text-xs text-muted-foreground sm:text-sm">Daily reminder dashboard, overdue reminders, set during call update</p>
      </div>

      <DataTableCard
        totalCount={reminders.length}
        tabs={
          <div className="no-scrollbar flex overflow-x-auto border-b">
            <button
              type="button"
              onClick={() => setActiveTab("today")}
              className={`shrink-0 px-2.5 py-2 text-sm font-medium transition-colors sm:px-3 ${
                activeTab === "today"
                  ? "border-b-2 border-primary text-foreground bg-background"
                  : "text-muted-foreground hover:text-foreground bg-muted/30"
              }`}
            >
              <Bell className="mr-1.5 inline size-4" />
              Today&apos;s Reminders
              {todayReminders.length > 0 && (
                <span className="ml-1 rounded-full bg-primary/20 px-1.5 py-0.5 text-xs">{todayReminders.length}</span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("overdue")}
              className={`shrink-0 px-2.5 py-2 text-sm font-medium transition-colors sm:px-3 ${
                activeTab === "overdue"
                  ? "border-b-2 border-primary text-foreground bg-background"
                  : "text-muted-foreground hover:text-foreground bg-muted/30"
              }`}
            >
              Overdue Reminders
              {overdueReminders.length > 0 && (
                <span className="ml-1 rounded-full bg-destructive/20 px-1.5 py-0.5 text-xs text-destructive">{overdueReminders.length}</span>
              )}
            </button>
          </div>
        }
      >
        {loading ? (
          <>
            <div className="md:hidden">
              <TableSkeleton rows={5} cols={3} mobileCards />
            </div>
            <div className="hidden md:block">
              <TableSkeleton rows={8} cols={3} />
            </div>
          </>
        ) : reminders.length === 0 ? (
          <EmptyState
            title={activeTab === "today" ? "No reminders for today" : "No overdue reminders"}
            description={activeTab === "today" ? "Reminders due today will appear here." : "All caught up! No missed reminders."}
            illustration="default"
          />
        ) : (
        <>
        {/* Mobile: Card list */}
        <div className="space-y-1.5 p-3 md:hidden">
          {reminders.map((r) => (
            <Link
              key={r.id}
              href={`/leads?id=${r.lead_id}`}
              className={`flex flex-col gap-2 rounded-lg border bg-card p-3 shadow-sm transition-colors hover:bg-muted/50 ${
                activeTab === "overdue" ? "border-destructive/30 bg-destructive/5" : ""
              }`}
            >
              <div className="flex items-start gap-2">
                <Calendar className={`size-4 shrink-0 mt-0.5 ${activeTab === "overdue" ? "text-destructive" : "text-muted-foreground"}`} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate text-foreground">{r.lead?.library_name || "Lead"}</p>
                  <p className="text-xs text-muted-foreground">{formatReminder(r.reminder_date, r.reminder_time)}</p>
                  {r.note && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{r.note}</p>}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Desktop: Table */}
        <Table className="hidden md:table">
          <TableHeader>
            <TableRow>
              <TableHead>Lead</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Note</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reminders.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <Link href={`/leads?id=${r.lead_id}`} className="font-medium hover:underline">
                    {r.lead?.library_name || "Lead"}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{formatReminder(r.reminder_date, r.reminder_time)}</TableCell>
                <TableCell className="text-muted-foreground">{r.note || "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </>
        )}
      </DataTableCard>
    </div>
  )
}
