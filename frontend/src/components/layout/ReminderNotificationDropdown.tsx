"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Bell, Calendar, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { remindersApi, type ApiReminder } from "@/lib/api"
import { cn } from "@/lib/utils"

function formatReminderDate(dateStr: string, timeStr: string | null) {
  try {
    const d = new Date(dateStr)
    const datePart = d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    if (timeStr) {
      const [h, m] = timeStr.split(":")
      return `${datePart} at ${h}:${m}`
    }
    return datePart
  } catch {
    return dateStr
  }
}

export function ReminderNotificationDropdown() {
  const [reminders, setReminders] = useState<ApiReminder[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const fetchReminders = () => {
    setLoading(true)
    remindersApi
      .list({ limit: 20 })
      .then(setReminders)
      .catch(() => setReminders([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (open) fetchReminders()
  }, [open])

  const todayCount = reminders.filter((r) => {
    try {
      return new Date(r.reminder_date).toDateString() === new Date().toDateString()
    } catch {
      return false
    }
  }).length

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-5" />
          {reminders.length > 0 && (
            <span
              className={cn(
                "absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full text-[10px] font-medium",
                todayCount > 0 ? "bg-destructive text-destructive-foreground" : "bg-muted-foreground/80 text-background"
              )}
            >
              {todayCount > 0 ? todayCount : reminders.length > 9 ? "9+" : reminders.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[400px] overflow-y-auto">
        <div className="p-2 border-b border-border">
          <h3 className="font-semibold text-sm">Reminders</h3>
          <p className="text-xs text-muted-foreground">Your upcoming reminders</p>
        </div>
        <div className="p-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : reminders.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <Bell className="mx-auto size-10 text-muted-foreground/50 mb-2" />
              <p>No reminders</p>
              <Link href="/reminders" onClick={() => setOpen(false)}>
                <Button variant="link" size="sm" className="mt-1">
                  View all reminders
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-1">
              {reminders.map((r) => (
                <Link
                  key={r.id}
                  href={`/leads?id=${r.lead_id}`}
                  onClick={() => setOpen(false)}
                  className="block rounded-md p-2 hover:bg-muted/60 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <Calendar className="size-4 shrink-0 text-muted-foreground mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {r.lead?.library_name || "Lead"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatReminderDate(r.reminder_date, r.reminder_time)}
                      </p>
                      {r.note && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {r.note}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
              <Link href="/reminders" onClick={() => setOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full mt-2">
                  View all reminders
                </Button>
              </Link>
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
