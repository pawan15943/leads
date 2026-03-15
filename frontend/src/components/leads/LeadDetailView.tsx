"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  Phone,
  Calendar,
  ArrowLeft,
  Pencil,
  Loader2,
  Building2,
  MessageCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CallPopupForm } from "@/components/leads/CallPopupForm"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { leadsApi, type ApiLead, type ApiLeadConversation } from "@/lib/api"

const EMPTY = "\u2014"

function formatDateTime(d: string | null | undefined) {
  if (!d) return EMPTY
  try {
    return new Date(d).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return EMPTY
  }
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-foreground">{value ?? EMPTY}</span>
    </div>
  )
}

export function LeadDetailView({ leadId, onBack }: { leadId: number; onBack?: () => void }) {
  const [lead, setLead] = useState<ApiLead | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [callOpen, setCallOpen] = useState(false)

  const fetchLead = useCallback(async () => {
    if (!leadId || isNaN(leadId)) return
    setLoading(true)
    setError(null)
    try {
      const data = await leadsApi.get(leadId)
      setLead(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load lead")
      setLead(null)
    } finally {
      setLoading(false)
    }
  }, [leadId])

  useEffect(() => {
    fetchLead()
  }, [fetchLead])

  const location = lead?.city
    ? [lead.city.name, lead.city.state?.name].filter(Boolean).join(", ")
    : null

  const whatsappLink = (contact: string) => {
    let digits = (contact || "").replace(/\D/g, "")
    if (digits.startsWith("0")) digits = "91" + digits.slice(1)
    else if (digits.length === 10) digits = "91" + digits
    return digits.length >= 10 ? `https://wa.me/${digits}` : undefined
  }

  const telLink = (contact: string) => {
    const digits = (contact || "").replace(/\D/g, "")
    return digits.length ? `tel:${contact.replace(/\s/g, "")}` : undefined
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-in fade-in duration-200">
        <div className="h-5 w-32 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="h-6 w-40 animate-pulse rounded bg-muted" />
              <div className="mt-2 h-4 w-64 animate-pulse rounded bg-muted" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-10 animate-pulse rounded bg-muted" />
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="h-6 w-32 animate-pulse rounded bg-muted" />
            </CardHeader>
            <CardContent className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded bg-muted" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error || !lead) {
    return (
      <div className="space-y-4">
        <Link
          href="/leads"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Leads
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive">{error || "Lead not found"}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button variant="outline" onClick={() => fetchLead()}>
                Retry
              </Button>
              <Link href="/leads">
                <Button variant="outline">Back to Leads</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const conversations = (lead.conversations ?? []) as ApiLeadConversation[]
  const wa = whatsappLink(lead.contact_number)
  const tel = telLink(lead.contact_number)

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/leads"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
            Back to Leads
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Building2 className="size-6" />
            </div>
            <div>
              <h1 className="text-xl font-semibold uppercase tracking-wide">
                {lead.library_name || "Unnamed Library"}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {lead.lead_stage && (
                  <Badge
                    variant={lead.lead_stage.color ? "default" : "secondary"}
                    style={
                      lead.lead_stage.color
                        ? { backgroundColor: lead.lead_stage.color, color: "#fff", borderColor: "transparent" }
                        : undefined
                    }
                  >
                    {lead.lead_stage.name}
                  </Badge>
                )}
                {lead.lead_source && (
                  <Badge variant="outline">{lead.lead_source.name}</Badge>
                )}
                {lead.tags && lead.tags.length > 0 && (
                  <>
                    {lead.tags.map((t) => (
                      <Badge key={t.id} variant="outline" className="text-xs">
                        {t.name}
                      </Badge>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setCallOpen(true)} size="sm">
            <Phone className="mr-2 size-4" />
            Add Call
          </Button>
          <Link href="/leads">
            <Button variant="outline" size="sm">
              <Pencil className="mr-2 size-4" />
              Edit Lead
            </Button>
          </Link>
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700 hover:bg-green-50">
                <MessageCircle className="mr-2 size-4" />
                WhatsApp
              </Button>
            </a>
          )}
          {tel && (
            <a href={tel}>
              <Button variant="outline" size="sm">
                <Phone className="mr-2 size-4" />
                Call
              </Button>
            </a>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lead Information</CardTitle>
            <CardDescription>Library details and business info</CardDescription>
          </CardHeader>
          <CardContent className="space-y-0">
            <InfoRow label="Library Name" value={lead.library_name} />
            <InfoRow label="Owner" value={lead.owner_name} />
            <InfoRow label="Location" value={location} />
            <InfoRow label="Assigned To" value={(lead.assignedTo as { name?: string })?.name ?? (lead as { assigned_user_name?: string }).assigned_user_name} />
            <InfoRow label="Total Seats" value={lead.total_seats} />
            <InfoRow label="Branches" value={lead.no_of_branches} />
            <InfoRow label="Working Since" value={lead.working_since_year} />
            <InfoRow label="Interested For" value={lead.interested_for} />
            <InfoRow label="Subscription Type" value={lead.subscription_type} />
            <InfoRow label="Demo Type" value={lead.demo_type} />
            <InfoRow label="Demo Date/Time" value={formatDateTime(lead.demo_datetime)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contact Details</CardTitle>
            <CardDescription>Phone, email, and alternate contact</CardDescription>
          </CardHeader>
          <CardContent className="space-y-0">
            <InfoRow
              label="Contact"
              value={
                tel ? (
                  <a href={tel} className="text-primary hover:underline">
                    {lead.contact_number}
                  </a>
                ) : (
                  lead.contact_number
                )
              }
            />
            <InfoRow label="Alternate Contact" value={lead.alternate_contact} />
            <InfoRow
              label="Email"
              value={
                lead.email ? (
                  <a href={`mailto:${lead.email}`} className="text-primary hover:underline">
                    {lead.email}
                  </a>
                ) : (
                  EMPTY
                )
              }
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conversation History</CardTitle>
          <CardDescription>Call history, follow-ups, and notes</CardDescription>
        </CardHeader>
        <CardContent>
          {conversations.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/30 py-12 text-center">
              <Phone className="mx-auto size-10 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">No call history yet</p>
              <p className="text-xs text-muted-foreground">Click &quot;Add Call&quot; to record your first conversation</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setCallOpen(true)}>
                Add Call
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className="flex gap-4 rounded-lg border border-border/60 bg-muted/20 p-4"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Phone className="size-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {conv.call_status && (
                        <Badge variant="secondary">{conv.call_status.name}</Badge>
                      )}
                      {conv.new_stage && (
                        <span className="text-xs text-muted-foreground">
                          Stage: {conv.previous_stage?.name ?? EMPTY} → {conv.new_stage.name}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(conv.created_at)}
                      </span>
                    </div>
                    {conv.remark && (
                      <p className="text-sm text-foreground">{conv.remark}</p>
                    )}
                    {(conv.next_followup_date || conv.next_followup_time) && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="size-3.5" />
                        Next follow-up: {conv.next_followup_date || ""}{" "}
                        {conv.next_followup_time ? conv.next_followup_time : ""}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CallPopupForm
        open={callOpen}
        onOpenChange={setCallOpen}
        leadId={leadId}
        onSuccess={fetchLead}
      />
    </div>
  )
}
