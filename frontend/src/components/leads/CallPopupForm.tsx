"use client"

import { useState, useEffect } from "react"
import { Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { leadsApi } from "@/lib/api"
import { useLists } from "@/contexts/ListsContext"
import { toast } from "sonner"

type CallPopupFormProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  leadId?: number
  onSuccess?: () => void
}

export function CallPopupForm({ open, onOpenChange, leadId, onSuccess }: CallPopupFormProps) {
  const [callStatus, setCallStatus] = useState("")
  const [remark, setRemark] = useState("")
  const [newStage, setNewStage] = useState("")
  const [nextFollowupDate, setNextFollowupDate] = useState("")
  const [nextFollowupTime, setNextFollowupTime] = useState("")
  const [tags, setTags] = useState("")
  const [saving, setSaving] = useState(false)
  const { callStatuses: callStatusOptions, stages: stageOptions } = useLists()

  function resetForm() {
    setCallStatus("")
    setRemark("")
    setNewStage("")
    setNextFollowupDate("")
    setNextFollowupTime("")
    setTags("")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!leadId) return
    setSaving(true)
    try {
      const callStatusId = callStatusOptions.find((o) => o.name === callStatus)?.id
      const newStageId = stageOptions.find((o) => o.name === newStage)?.id
      await leadsApi.addConversation(leadId, {
        call_status: callStatus || undefined,
        call_status_id: callStatusId,
        remark: remark || undefined,
        new_stage: newStage || undefined,
        new_stage_id: newStageId,
        next_followup_date: nextFollowupDate || undefined,
        next_followup_time: nextFollowupTime || undefined,
        tags: tags || undefined,
      })
      toast.success("Call summary saved")
      resetForm()
      onSuccess?.()
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save call")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Call / Fill Info</DialogTitle>
          <DialogDescription>Record call status, remark, stage change, and follow-up</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Call Status</Label>
            <Select value={callStatus} onValueChange={(v) => v && setCallStatus(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {callStatusOptions.map((opt) => (
                  <SelectItem key={opt.id} value={opt.name}>{opt.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Remark</Label>
            <Textarea placeholder="Call notes..." value={remark} onChange={(e) => setRemark(e.target.value)} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Change Stage</Label>
            <Select value={newStage} onValueChange={(v) => v && setNewStage(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                {stageOptions.map((opt) => (
                  <SelectItem key={opt.id} value={opt.name}>{opt.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Next Follow-up Date</Label>
              <Input type="date" value={nextFollowupDate} onChange={(e) => setNextFollowupDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Next Follow-up Time</Label>
              <Input type="time" value={nextFollowupTime} onChange={(e) => setNextFollowupTime(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Add Tags</Label>
            <Input placeholder="Hot, VIP, etc." value={tags} onChange={(e) => setTags(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              <Phone className="mr-2 size-4" />
              {saving ? "Saving..." : "Save Call"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
