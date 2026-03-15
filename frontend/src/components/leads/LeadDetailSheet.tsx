"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Phone, MessageSquare, Loader2, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { leadsApi, type ApiLeadConversation } from "@/lib/api"
import { useLists } from "@/contexts/ListsContext"
import { toast } from "sonner"

const FALLBACK_CALL_STATUS = ["Call Not Received", "Not Connected", "Interested", "Demo Scheduled"]
const FALLBACK_STAGES = ["New", "Contacted", "Interested", "Demo Scheduled"]

export type Lead = {
  id: number
  library: string
  owner: string
  contact: string
  stage: string
  stageId?: number
  stageColor?: string | null
  source: string
  sourceId?: number
  assignedTo: string
  lastCall: string
  nextFollowup: string
  /** True when next_followup_date is today */
  isTodayFollowup?: boolean
  tags: string[]
  location: string
  cityId?: number
  stateId?: number
}

type LeadDetailSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  lead: Lead | null
  onSave?: (leadId: number, data: CallUpdateData) => void | Promise<void>
}

export type CallUpdateData = {
  callStatus: string
  callStatusId?: number
  remark: string
  newStage: string
  newStageId?: number
  nextFollowupDate: string
  nextFollowupTime: string
  tags: string
}

export function LeadDetailSheet({
  open,
  onOpenChange,
  lead,
  onSave,
}: LeadDetailSheetProps) {
  const [isDesktop, setIsDesktop] = useState(false)
  const [callStatus, setCallStatus] = useState("")
  const [remark, setRemark] = useState("")
  const [newStage, setNewStage] = useState("")
  const [nextFollowupDate, setNextFollowupDate] = useState("")
  const [nextFollowupTime, setNextFollowupTime] = useState("")
  const [tags, setTags] = useState("")
  const [conversations, setConversations] = useState<ApiLeadConversation[]>([])
  const [loadingConversations, setLoadingConversations] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string>("")
  const { tags: tagOptions, callStatuses: callStatusOptions, stages: stageOptions } = useLists()
  const leadIdRef = useRef<number | null>(null)

  useEffect(() => {
    leadIdRef.current = lead?.id ?? null
  }, [lead?.id])

  const fetchLeadDetails = useCallback(async (leadId: number, signal: AbortSignal) => {
    setLoadingConversations(true)
    try {
      const detail = await leadsApi.get(leadId, signal)
      if (leadIdRef.current !== leadId) return
      const raw = detail as { conversations?: ApiLeadConversation[]; conversation_history?: ApiLeadConversation[] }
      const convs = raw.conversations ?? raw.conversation_history
      setConversations(Array.isArray(convs) ? convs : [])
    } catch (err) {
      if (leadIdRef.current !== leadId) return
      if ((err as Error)?.name !== "AbortError") setConversations([])
    } finally {
      if (leadIdRef.current === leadId) setLoadingConversations(false)
    }
  }, [])

  useEffect(() => {
    if (!open || !lead?.id) {
      setConversations([])
      setLoadingConversations(false)
      return
    }
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    fetchLeadDetails(lead.id, controller.signal).finally(() => clearTimeout(timeoutId))
    return () => {
      controller.abort()
      clearTimeout(timeoutId)
    }
  }, [open, lead?.id, fetchLeadDetails])

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)")
    setIsDesktop(mq.matches)
    const handler = () => setIsDesktop(mq.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!lead) return
    setSaveError("")
    setSaving(true)
    try {
      const selectedStatus = callStatusOptions.find((o) => o.name === callStatus)
      const selectedStage = stageOptions.find((o) => o.name === newStage)
      await onSave?.(lead.id, {
        callStatus,
        callStatusId: selectedStatus?.id,
        remark,
        newStage,
        newStageId: selectedStage?.id,
        nextFollowupDate,
        nextFollowupTime,
        tags,
      })
      onOpenChange(false)
      setCallStatus("")
      setRemark("")
      setNewStage("")
      setNextFollowupDate("")
      setNextFollowupTime("")
      setTags("")
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save"
      setSaveError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  function handleClose(open: boolean) {
    if (!open) {
      setCallStatus("")
      setRemark("")
      setNewStage("")
      setNextFollowupDate("")
      setNextFollowupTime("")
      setTags("")
      setSaveError("")
    }
    onOpenChange(open)
  }

  const telLink = lead?.contact?.replace(/\D/g, "").length
    ? `tel:${lead.contact.replace(/\s/g, "")}`
    : undefined

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        className={cn(
          "overflow-hidden flex flex-col p-0 gap-0",
          isDesktop ? "!w-[50vw] sm:!max-w-none h-full max-h-none" : "h-[90vh] max-h-[90vh]"
        )}
        showCloseButton={true}
      >
        <div className="flex h-full flex-col overflow-hidden">
          <SheetHeader className="shrink-0 border-b px-6 pb-4 pt-5">
            <SheetTitle className="text-lg font-semibold">{lead?.library ?? "Lead"}</SheetTitle>
            <SheetDescription>
              {lead ? `${lead.owner} · ${lead.location || "—"}` : "—"}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto overscroll-contain px-6 pb-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
              {/* Section 1: Previous Conversation History (first) */}
              <div className="order-2 lg:order-1">
                <div className="flex items-center gap-2 text-sm font-medium mb-3">
                  <History className="size-4" />
                  Previous Conversation History
                </div>
                {loadingConversations ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                    No data
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[calc(100vh-20rem)] overflow-y-auto pr-1">
                    {conversations.map((conv) => {
                      const dt = conv.created_at ? new Date(conv.created_at) : null
                      const dateStr = dt ? dt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"
                      const timeStr = dt ? dt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"
                      const status = (conv as { call_status?: { name: string } }).call_status?.name
                      const stageChange = (conv as { new_stage?: { name: string }; previous_stage?: { name: string } }).new_stage?.name
                      const msg = conv.remark || status || (stageChange ? `Stage: ${stageChange}` : "Call update")
                      return (
                        <div
                          key={conv.id}
                          className="rounded-lg border bg-background p-3 text-sm"
                        >
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                            <span>{dateStr}</span>
                            <span>{timeStr}</span>
                          </div>
                          {status && (
                            <Badge variant="secondary" className="mb-1.5 text-xs">
                              {status}
                            </Badge>
                          )}
                          <p className="text-foreground">{msg}</p>
                          {stageChange && (
                            <p className="mt-1 text-xs text-muted-foreground">Stage: {stageChange}</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Section 2: Lead info + Fill info form / Summary (second) */}
              <div className="order-1 lg:order-2 lg:border-l lg:pl-6 lg:border-muted/50 space-y-6">
                <div className="space-y-2 rounded-lg bg-muted/40 p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contact</span>
                    <span className="font-medium">{lead?.contact ?? "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Stage</span>
                    <Badge
                    variant={lead?.stageColor ? "default" : "secondary"}
                    style={lead?.stageColor ? { backgroundColor: lead.stageColor, color: "#fff", borderColor: "transparent" } : undefined}
                  >
                    {lead?.stage ?? "—"}
                  </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Source</span>
                    <span>{lead?.source ?? "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Next Follow-up</span>
                    <span>{lead?.nextFollowup ?? "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Assigned BD</span>
                    <span>{lead?.assignedTo ?? "—"}</span>
                  </div>
                </div>

                <form id="fill-info-form" onSubmit={handleSubmit} className="space-y-4">
                  {saveError && (
                    <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{saveError}</div>
                  )}
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <MessageSquare className="size-4" />
                    Call Summary
                  </div>

                  <div className="space-y-2">
                    <Label>Call Status</Label>
                    <Select value={callStatus} onValueChange={(v) => v && setCallStatus(v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {(callStatusOptions.length ? callStatusOptions.map((o) => o.name) : FALLBACK_CALL_STATUS).map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Remark / Notes</Label>
                    <Textarea
                      placeholder="Call notes, feedback..."
                      value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                      rows={3}
                      className="min-h-[80px] resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Update Stage</Label>
                    <Select value={newStage} onValueChange={(v) => v && setNewStage(v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                      <SelectContent>
                        {(stageOptions.length ? stageOptions.map((o) => o.name) : FALLBACK_STAGES).map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Next Follow-up Date</Label>
                      <Input
                        type="date"
                        value={nextFollowupDate}
                        onChange={(e) => setNextFollowupDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Time</Label>
                      <Input
                        type="time"
                        value={nextFollowupTime}
                        onChange={(e) => setNextFollowupTime(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <Input
                      placeholder="Type tags (e.g. Hot, VIP) or click below"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                    />
                    {tagOptions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {tagOptions.map((t) => {
                          const current = tags.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean)
                          const isSelected = current.includes(t.name.toLowerCase())
                          return (
                            <Badge
                              key={t.id}
                              variant={isSelected ? "default" : "outline"}
                              className="cursor-pointer text-xs"
                              onClick={() => {
                                const list = tags ? tags.split(",").map((x) => x.trim()).filter(Boolean) : []
                                if (isSelected) {
                                  setTags(list.filter((x) => x.toLowerCase() !== t.name.toLowerCase()).join(", "))
                                } else {
                                  setTags([...list, t.name].join(", "))
                                }
                              }}
                            >
                              {t.name}
                            </Badge>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Fixed footer: Save, Cancel (like Add Lead) + Call at bottom */}
          <div className="shrink-0 border-t bg-background px-6 py-4 space-y-3">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => handleClose(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="fill-info-form"
                className="flex-1"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Update"}
              </Button>
            </div>
            {telLink && (
              <a href={telLink} className="block md:hidden">
                <Button className="w-full h-11" size="lg">
                  <Phone className="mr-2 size-4" />
                  Call
                </Button>
              </a>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
