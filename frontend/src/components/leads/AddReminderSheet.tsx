"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import { remindersApi } from "@/lib/api"
import { toast } from "sonner"
import type { Lead } from "./LeadDetailSheet"

type AddReminderSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  lead: Lead | null
  onSuccess?: () => void
}

export function AddReminderSheet({ open, onOpenChange, lead, onSuccess }: AddReminderSheetProps) {
  const [reminderDate, setReminderDate] = useState("")
  const [reminderTime, setReminderTime] = useState("")
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!lead) {
      toast.error("No lead selected. Please select a lead first.")
      return
    }
    if (!reminderDate.trim()) {
      toast.error("Please select a reminder date")
      return
    }
    setSaving(true)
    try {
      await remindersApi.createForLead(lead.id, {
        reminder_date: reminderDate,
        reminder_time: reminderTime || undefined,
        note: note.trim() || undefined,
      })
      toast.success("Reminder added")
      setReminderDate("")
      setReminderTime("")
      setNote("")
      onSuccess?.()
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add reminder")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col p-0">
        <SheetHeader className="shrink-0 px-6 pt-6 pb-4">
          <SheetTitle>Add Reminder</SheetTitle>
          <SheetDescription>
            {lead ? `Set a reminder for ${lead.library}` : "Set a reminder for this lead"}
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 pb-4">
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="reminder-date">Reminder Date *</Label>
                <Input
                  id="reminder-date"
                  type="date"
                  value={reminderDate}
                  onChange={(e) => setReminderDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  required
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reminder-time">Reminder Time</Label>
                <Input
                  id="reminder-time"
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reminder-note">Note</Label>
                <Textarea
                  id="reminder-note"
                  placeholder="Follow-up call, send proposal, etc."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={4}
                  className="min-h-[100px] w-full resize-none"
                />
              </div>
            </div>
          </div>
          <SheetFooter className="shrink-0 flex-row gap-2 border-t px-6 py-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-none">
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="flex-1 sm:flex-none">
              {saving ? "Saving..." : "Add Reminder"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
