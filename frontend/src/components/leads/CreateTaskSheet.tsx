"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import { tasksApi } from "@/lib/api"
import { toast } from "sonner"
import type { Lead } from "./LeadDetailSheet"

const TASK_TYPES = ["Call", "Email", "Meeting", "Follow-up", "Demo", "Other"]

type CreateTaskSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  lead: Lead | null
  onSuccess?: () => void
}

export function CreateTaskSheet({ open, onOpenChange, lead, onSuccess }: CreateTaskSheetProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [taskType, setTaskType] = useState("Call")
  const [dueDate, setDueDate] = useState("")
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      toast.error("Please enter a task title")
      return
    }
    setSaving(true)
    try {
      if (lead) {
        await tasksApi.createForLead(lead.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          task_type: taskType,
          due_date: dueDate || undefined,
        })
      } else {
        await tasksApi.create({
          title: title.trim(),
          description: description.trim() || undefined,
          task_type: taskType,
          due_date: dueDate || undefined,
        })
      }
      toast.success("Task created")
      setTitle("")
      setDescription("")
      setTaskType("Call")
      setDueDate("")
      onSuccess?.()
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create task")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col p-0">
        <SheetHeader className="shrink-0 px-6 pt-6 pb-4">
          <SheetTitle>Create Task</SheetTitle>
          <SheetDescription>
            {lead ? `Create a task for ${lead.library}` : "Create a new task"}
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 pb-4">
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="task-title">Task Title *</Label>
                <Input
                  id="task-title"
                  placeholder="e.g. Follow-up call, Send proposal"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-type">Type</Label>
                <Select value={taskType} onValueChange={(v) => setTaskType(v ?? "Call")}>
                  <SelectTrigger id="task-type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-due-date">Due Date</Label>
                <Input
                  id="task-due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-description">Description</Label>
                <Textarea
                  id="task-description"
                  placeholder="Task details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
              {saving ? "Creating..." : "Create Task"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
