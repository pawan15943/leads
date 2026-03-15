"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Phone, MoreHorizontal, Eye, Pencil, Bell, ClipboardList, Trash2, Plus, FileEdit, Loader2, MapPin, User, Tag, PhoneCall, Calendar, MessageCircle, Building2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTableCard } from "@/components/ui/data-table-card"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { LeadDetailSheet, type Lead } from "@/components/leads/LeadDetailSheet"
import { LeadFormSheet } from "@/components/leads/LeadFormSheet"
import { ImportLeadSheet } from "@/components/leads/ImportLeadSheet"
import { AddReminderSheet } from "@/components/leads/AddReminderSheet"
import { CreateTaskSheet } from "@/components/leads/CreateTaskSheet"
import { useAuth } from "@/contexts/AuthContext"
import { useLists } from "@/contexts/ListsContext"
import { leadsApi, type ApiLead, type LeadListResponse } from "@/lib/api"
import { parseApiError } from "@/lib/errors"

function mapApiLeadToLead(api: ApiLead, bdUsers: { id: number; name: string }[] = [], stages: { id: number; name: string; color?: string | null }[] = []): Lead {
  const city = api.city
  const stateName = api.city?.state?.name
  const cityName = api.city?.name
  const location = cityName && stateName ? `${cityName}, ${stateName}` : cityName || stateName || ""
  const assignedUser = api.assignedTo ?? (api as { assigned_to?: { id: number; name: string } }).assigned_to
  const assignedId = typeof api.assigned_to === "number" ? api.assigned_to : assignedUser && typeof assignedUser === "object" ? assignedUser.id : null
  const assignedName =
    (api as { assigned_user_name?: string }).assigned_user_name?.trim() ||
    (assignedUser && typeof assignedUser === "object" && assignedUser.name ? assignedUser.name.trim() : null) ||
    (assignedId ? bdUsers.find((u) => u.id === assignedId)?.name : null) ||
    null
  const latestConv = (api as { latest_conversation?: { call_status?: { name: string }; next_followup_date?: string }; latestConversation?: { call_status?: { name: string }; next_followup_date?: string } }).latest_conversation ?? (api as { latestConversation?: { call_status?: { name: string }; next_followup_date?: string } }).latestConversation
  const lastCallStatus = latestConv?.call_status?.name ?? null
  const nextFollowupDate = latestConv?.next_followup_date
  const nextFollowup = nextFollowupDate
    ? (() => {
        const d = new Date(nextFollowupDate)
        const today = new Date()
        if (d.toDateString() === today.toDateString()) return "Today"
        return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
      })()
    : "-"
  const isTodayFollowup = nextFollowupDate
    ? new Date(nextFollowupDate).toDateString() === new Date().toDateString()
    : false
  const stageName = (api.lead_stage?.name ?? (api as { leadStage?: { name: string } }).leadStage?.name) || "New"
  const stageFromApi = api.lead_stage ?? (api as { leadStage?: { id: number; name: string; color?: string | null } }).leadStage
  return {
    id: api.id,
    library: api.library_name,
    owner: api.owner_name || "",
    contact: api.contact_number,
    stage: stageName,
    stageId: stageFromApi?.id,
    stageColor: stageFromApi?.color ?? stages.find((s) => s.name === stageName)?.color ?? null,
    source: api.lead_source?.name || "Website",
    sourceId: api.lead_source?.id,
    assignedTo: assignedName || "—",
    lastCall: lastCallStatus || "-",
    nextFollowup,
    isTodayFollowup,
    tags: (api.tags || []).map((t) => t.name),
    location,
    cityId: api.city?.id,
    stateId: api.city?.state?.id,
  }
}

const STAGE_COLOR_FALLBACK: Record<string, string> = {
  New: "#c5dffe",
  Contacted: "#e0dafe",
  Interested: "#b0f4d5",
  "Demo Scheduled": "#fde996",
}

function getStageColor(lead: Lead): string | null {
  return lead.stageColor ?? STAGE_COLOR_FALLBACK[lead.stage] ?? null
}

const LEAD_VIEWS = [
  { value: "all", label: "All" },
  { value: "unassigned", label: "Unassigned Leads" },
  { value: "follow-ups", label: "Today Follow-ups" },
  { value: "interested", label: "Interested Leads" },
  { value: "demo-scheduled", label: "Demo Scheduled" },
] as const

export default function LeadsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { token, isBD } = useAuth()
  const [search, setSearch] = useState("")
  const [stageFilter, setStageFilter] = useState("All")
  const [sourceFilter, setSourceFilter] = useState("All")
  const [assignedFilter, setAssignedFilter] = useState("All")
  const [locationFilter, setLocationFilter] = useState("All")
  const [selected, setSelected] = useState<number[]>([])
  const [page, setPage] = useState(1)
  const LEADS_PAGE_SIZE = 20

  const viewParam = searchParams.get("view") as (typeof LEAD_VIEWS)[number]["value"] | null
  const [activeView, setActiveView] = useState<(typeof LEAD_VIEWS)[number]["value"]>(
    viewParam && LEAD_VIEWS.some((v) => v.value === viewParam) ? viewParam : "all"
  )
  const { stages, sources, users: bdUsers, loaded: listsLoaded } = useLists()
  const [leads, setLeads] = useState<Lead[]>([])
  const [locations, setLocations] = useState<{ id: number; location: string }[]>([])
  const [totalEntries, setTotalEntries] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [searchDebounced, setSearchDebounced] = useState("")

  const locationsRef = useRef(locations)
  locationsRef.current = locations
  const hasLeadsRef = useRef(false)
  hasLeadsRef.current = leads.length > 0
  const isInitialLoad = !leads.length && loading
  const isPageLoading = loading && leads.length > 0
  const requestIdRef = useRef(0)

  // Debounce search (50ms) for fast filter response
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 50)
    return () => clearTimeout(t)
  }, [search])

  const fetchLeads = useCallback(async () => {
    if (!token) return
    const reqId = ++requestIdRef.current
    setLoading(true)
    setLoadError(null)
    try {
      const params: Parameters<typeof leadsApi.list>[0] = {
        per_page: LEADS_PAGE_SIZE,
        page,
        search: searchDebounced.trim() || undefined,
        stage_id: stageFilter !== "All" ? stages.find((x) => x.name === stageFilter)?.id : undefined,
        source_id: !isBD && sourceFilter !== "All" ? sources.find((x) => x.name === sourceFilter)?.id : undefined,
        assigned_to: !isBD && activeView !== "unassigned" && assignedFilter !== "All" ? bdUsers.find((x) => x.name === assignedFilter)?.id : undefined,
        city_id: locationFilter !== "All" ? locationsRef.current.find((l) => l.location === locationFilter)?.id : undefined,
        view: activeView !== "all" ? activeView : undefined,
      }
      const res = await leadsApi.list(params)
      let data: ApiLead[] = []
      let total = 0
      let lastPage = 1
      if (Array.isArray(res)) {
        data = res
      } else if (res && typeof res === "object" && "data" in res) {
        const r = res as LeadListResponse
        data = Array.isArray(r.data) ? r.data : []
        total = r.total ?? data.length
        lastPage = r.last_page ?? 1
      }
      if (reqId !== requestIdRef.current) return
      const mapped = data.map((api: ApiLead) => mapApiLeadToLead(api, bdUsers, stages))
      setLeads(mapped)
      setTotalEntries(total)
      setTotalPages(lastPage)
    } catch (err) {
      if (reqId !== requestIdRef.current) return
      const msg = parseApiError(err)
      setLoadError(msg)
      if (!hasLeadsRef.current) setLeads([])
      toast.error(msg)
      if (msg.includes("Session expired")) router.push("/login?redirect=/leads")
    } finally {
      if (reqId === requestIdRef.current) setLoading(false)
    }
  }, [token, isBD, searchDebounced, stageFilter, sourceFilter, assignedFilter, locationFilter, page, activeView, router, stages, sources, bdUsers])

  const fetchLeadsRef = useRef(fetchLeads)
  fetchLeadsRef.current = fetchLeads

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    leadsApi.locations().then(setLocations).catch((err) => {
      setLocations([])
      toast.error(parseApiError(err))
    })
  }, [token])

  useEffect(() => {
    if (!token) return
    fetchLeadsRef.current()
  }, [token, isBD, listsLoaded, page, searchDebounced, stageFilter, sourceFilter, assignedFilter, locationFilter, activeView])

  const STAGES = useMemo(() => ["All", ...stages.map((s) => s.name)], [stages])
  const SOURCES = useMemo(() => ["All", ...sources.map((s) => s.name)], [sources])
  const ASSIGNED_OPTIONS = useMemo(() => ["All", ...bdUsers.map((u) => u.name)], [bdUsers])
  const LOCATIONS = useMemo(
    () => ["All", ...locations.map((l) => l.location).sort()],
    [locations]
  )
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [formSheetOpen, setFormSheetOpen] = useState(false)
  const [formMode, setFormMode] = useState<"add" | "edit">("add")
  const [formLead, setFormLead] = useState<Lead | null>(null)
  const [formSaveError, setFormSaveError] = useState<string>("")
  const [reminderSheetOpen, setReminderSheetOpen] = useState(false)
  const [taskSheetOpen, setTaskSheetOpen] = useState(false)
  const [reminderTaskLead, setReminderTaskLead] = useState<Lead | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [importSheetOpen, setImportSheetOpen] = useState(false)

  useEffect(() => {
    const stage = searchParams.get("stage")
    if (stage && (stage === "All" || stages.some((s) => s.name === stage))) setStageFilter(stage)
  }, [searchParams, stages])

  useEffect(() => {
    if (viewParam && LEAD_VIEWS.some((v) => v.value === viewParam)) setActiveView(viewParam)
  }, [viewParam])

  useEffect(() => {
    if (isBD && activeView === "unassigned") {
      setActiveView("all")
      router.replace("/leads", { scroll: false })
    }
  }, [isBD, activeView, router])

  useEffect(() => {
    if (searchParams.get("action") === "add") {
      setFormMode("add")
      setFormLead(null)
      setFormSaveError("")
      setFormSheetOpen(true)
      router.replace("/leads", { scroll: false })
    }
  }, [searchParams, router])

  const handleViewChange = (value: string) => {
    const v = value as (typeof LEAD_VIEWS)[number]["value"]
    setActiveView(v)
    const url = v === "all" ? "/leads" : `/leads?view=${v}`
    router.replace(url, { scroll: false })
  }

  const paginatedLeads = leads

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      const ids = new Set(selected)
      paginatedLeads.forEach((l) => ids.add(l.id))
      setSelected([...ids])
    } else {
      const pageIds = new Set(paginatedLeads.map((l) => l.id))
      setSelected((prev) => prev.filter((id) => !pageIds.has(id)))
    }
  }
  const toggleSelect = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleBulkDelete = async () => {
    if (selected.length === 0) return
    if (!confirm(`Delete ${selected.length} selected lead(s)? This cannot be undone.`)) return
    const toDelete = [...selected]
    setDeleting(true)
    setLeads((prev) => prev.filter((l) => !toDelete.includes(l.id)))
    setSelected([])
    try {
      await Promise.all(toDelete.map((id) => leadsApi.delete(id)))
      toast.success(`Deleted ${toDelete.length} lead(s)`)
      fetchLeads()
    } catch (err) {
      const msg = parseApiError(err)
      toast.error(msg)
      fetchLeads()
    } finally {
      setDeleting(false)
    }
  }

  const handleBulkEdit = () => {
    // TODO: Open bulk edit dialog (e.g. change stage for all selected)
    alert(`Bulk edit ${selected.length} leads - connect to API`)
  }

  useEffect(() => {
    setPage(1)
  }, [search, stageFilter, sourceFilter, assignedFilter, locationFilter, activeView])

  const clearFilters = () => {
    setSearch("")
    setStageFilter("All")
    setSourceFilter("All")
    setAssignedFilter("All")
    setLocationFilter("All")
    setPage(1)
  }

  const openLeadSheet = (lead: Lead) => {
    setSelectedLead(lead)
    setSheetOpen(true)
  }

  const handleSheetSave = async (leadId: number, data: { callStatus: string; callStatusId?: number; remark: string; newStage: string; newStageId?: number; nextFollowupDate: string; nextFollowupTime: string; tags: string }) => {
    try {
      await leadsApi.addConversation(leadId, {
        call_status: data.callStatus || undefined,
        call_status_id: data.callStatusId,
        remark: data.remark || undefined,
        new_stage: data.newStage || undefined,
        new_stage_id: data.newStageId,
        next_followup_date: data.nextFollowupDate || undefined,
        next_followup_time: data.nextFollowupTime || undefined,
        tags: data.tags || undefined,
      })
      toast.success("Call summary saved successfully")
      setSheetOpen(false)
      setSelectedLead(null)
      await fetchLeads()
    } catch (err) {
      const msg = parseApiError(err)
      toast.error(msg)
      throw err
    }
  }

  const searchLeadsByPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, "")
    return leads.find((l) => l.contact.replace(/\D/g, "").includes(digits) || digits.includes(l.contact.replace(/\D/g, ""))) ?? null
  }

  const handleFormSave = async (data: { library: string; owner: string; contact: string; stage: string; stageId?: number; source: string; sourceId?: number; assignedTo: string; state?: string; city?: string; cityId?: number; location?: string; tags: string[] }, leadId?: number) => {
    const tags = Array.isArray(data.tags) ? data.tags : (data.tags ? String(data.tags).split(",").map((t) => t.trim()).filter(Boolean) : [])
    const assignedToId = data.assignedTo === "-" ? null : (() => {
      const n = parseInt(data.assignedTo, 10)
      return Number.isNaN(n) ? null : n
    })()
    const stageId = data.stageId ?? stages.find((s) => s.name === data.stage)?.id
    const sourceId = data.sourceId ?? sources.find((s) => s.name === data.source)?.id
    const payload = {
      library: data.library,
      owner: data.owner,
      contact: data.contact,
      stage: data.stage,
      stage_id: stageId ?? undefined,
      source: data.source,
      source_id: sourceId ?? undefined,
      assigned_to: assignedToId,
      city_id: data.cityId ?? undefined,
      state: data.cityId ? undefined : (data.state || undefined),
      city: data.cityId ? undefined : (data.city || undefined),
      tags,
    }
    try {
      if (leadId) {
        await leadsApi.update(leadId, payload)
        toast.success("Lead updated successfully")
        setFormSaveError("")
        setFormLead(null)
        fetchLeads()
        return true
      } else {
        await leadsApi.create(payload)
        toast.success("Lead added successfully")
        setFormSaveError("")
        setFormLead(null)
        setPage(1)
        fetchLeads()
        return true
      }
    } catch (err) {
      const msg = parseApiError(err)
      setFormSaveError(msg)
      toast.error(msg)
      return false
    }
  }

  const openAddLead = () => {
    setFormMode("add")
    setFormLead(null)
    setFormSaveError("")
    setFormSheetOpen(true)
  }

  const openEditLead = (lead: Lead) => {
    setFormMode("edit")
    setFormLead(lead)
    setFormSaveError("")
    setFormSheetOpen(true)
  }

  const handleLeadFound = (lead: Lead) => {
    setSelectedLead(lead)
    setSheetOpen(true)
  }

  const telLink = (contact: string) => {
    const digits = contact?.replace(/\D/g, "")
    return digits?.length ? `tel:${contact.replace(/\s/g, "")}` : undefined
  }

  const whatsappLink = (contact: string) => {
    let digits = contact?.replace(/\D/g, "") || ""
    if (digits.startsWith("0")) digits = "91" + digits.slice(1)
    else if (digits.length === 10) digits = "91" + digits
    return digits.length >= 10 ? `https://wa.me/${digits}` : undefined
  }

  return (
    <div className="min-w-0 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold sm:text-xl">Leads</h1>
          <p className="text-xs text-muted-foreground sm:text-sm">Manage and track your leads</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setImportSheetOpen(true)}>
            <Upload className="mr-2 size-4" />
            Import
          </Button>
          <Button onClick={openAddLead} size="sm">
            <Plus className="mr-2 size-4" />
            Add Lead
          </Button>
        </div>
      </div>

      <DataTableCard
        searchPlaceholder="Search by Library, Owner, Contact..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={
          <>
            <Select value={stageFilter} onValueChange={(v) => setStageFilter(v ?? "All")}>
              <SelectTrigger className="w-full min-w-0 md:w-[180px]">
                <span className="shrink-0 text-muted-foreground">Stage:</span>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                {STAGES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!isBD && (
              <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v ?? "All")}>
                <SelectTrigger className="w-full min-w-0 md:w-[180px]">
                  <span className="shrink-0 text-muted-foreground">Source:</span>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  {SOURCES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {!isBD && (
              <Select value={assignedFilter} onValueChange={(v) => setAssignedFilter(v ?? "All")}>
                <SelectTrigger className="w-full min-w-0 md:w-[180px]">
                  <span className="shrink-0 text-muted-foreground">Assigned BD:</span>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  {ASSIGNED_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={locationFilter} onValueChange={(v) => setLocationFilter(v ?? "All")}>
              <SelectTrigger className="w-full min-w-0 md:w-[200px]">
                <span className="shrink-0 text-muted-foreground">Location:</span>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                {LOCATIONS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
        onClearFilters={clearFilters}
        collapseFiltersOnMobile
        selectedCount={selected.length}
        totalCount={totalEntries}
        tabs={
          <div className="no-scrollbar flex overflow-x-auto border-b">
            {LEAD_VIEWS.filter((v) => !isBD || v.value !== "unassigned").map((v) => (
              <button
                key={v.value}
                type="button"
                onClick={() => handleViewChange(v.value)}
                className={`shrink-0 px-2.5 py-2 text-sm font-medium transition-colors sm:px-3 ${
                  activeView === v.value
                    ? "border-b-2 border-primary text-foreground bg-background"
                    : "text-muted-foreground hover:text-foreground bg-muted/30"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        }
        pagination={{
          page,
          totalPages: Math.max(1, totalPages),
          totalEntries,
          pageSize: LEADS_PAGE_SIZE,
          onPrevious: () => setPage((p) => Math.max(1, p - 1)),
          onNext: () => setPage((p) => Math.min(Math.max(1, totalPages), p + 1)),
        }}
        bulkActions={
          <>
            <Button variant="outline" size="sm" onClick={handleBulkEdit}>
              <Pencil className="mr-1.5 size-4" />
              Bulk Edit
            </Button>
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={handleBulkDelete} disabled={deleting}>
              <Trash2 className="mr-1.5 size-4" />
              {deleting ? "Deleting..." : "Bulk Delete"}
            </Button>
          </>
        }
      >
        {isInitialLoad ? (
          <>
            <div className="md:hidden">
              <TableSkeleton rows={5} cols={4} mobileCards />
            </div>
            <div className="hidden md:block">
              <TableSkeleton rows={8} cols={9} />
            </div>
          </>
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <p className="text-sm text-destructive">{loadError}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => {
                setLoadError(null)
                setLoading(true)
                if (token) {
                  fetchLeads()
                } else {
                  setLoading(false)
                }
              }}
            >
              Retry
            </Button>
          </div>
        ) : leads.length === 0 ? (
          <EmptyState
            title="No leads found"
            description="Start building your pipeline by adding leads or importing them from a CSV file. Try adjusting filters if you're searching."
            action={
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setImportSheetOpen(true)}>
                  <Upload className="mr-2 size-4" />
                  Import
                </Button>
                <Button size="sm" onClick={openAddLead}>
                  <Plus className="mr-2 size-4" />
                  Add Lead
                </Button>
              </div>
            }
            illustration="folder"
          />
        ) : (
        <div className="relative min-h-[200px]">
        {isPageLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/60 backdrop-blur-[1px]">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        )}
        {/* Mobile: Card list with library name, dial, fill info */}
        <div className="space-y-1.5 p-3 md:hidden">
          {paginatedLeads.map((lead) => (
            <div
              key={lead.id}
              className="flex flex-col gap-2 rounded-lg border bg-card p-3 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">{lead.lastCall || "—"}</span>
                    {(() => {
                      const color = getStageColor(lead)
                      return color ? (
                        <span
                          className="inline-flex h-5 shrink-0 items-center justify-center rounded-full border border-transparent px-2 py-0.5 text-xs font-medium text-gray-800"
                          style={{ backgroundColor: color }}
                        >
                          {lead.stage}
                        </span>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          {lead.stage}
                        </Badge>
                      )
                    })()}
                  </div>
                  <p className="mt-1 truncate font-semibold uppercase text-foreground">{lead.library}</p>
                  <p className="text-xs text-muted-foreground">{lead.owner}</p>
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-1"><Phone className="size-3.5" />{lead.contact}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3" />{lead.location || "—"}</div>
                {lead.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {lead.tags.map((t) => (
                      <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                    ))}
                  </div>
                )}
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Last: {lead.lastCall}</span>
                  <span>Next: {lead.nextFollowup}</span>
                </div>
                <div className="flex items-center gap-1 text-xs font-medium"><User className="size-3" />{lead.assignedTo}</div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {(() => {
                  const wa = whatsappLink(lead.contact)
                  return wa ? (
                    <a href={wa} target="_blank" rel="noopener noreferrer" className="shrink-0">
                      <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700 hover:bg-green-50">
                        <MessageCircle className="mr-1.5 size-4" />
                        WhatsApp
                      </Button>
                    </a>
                  ) : null
                })()}
                {telLink(lead.contact) ? (
                  <a href={telLink(lead.contact)} className="flex-1 min-w-0">
                    <Button variant="outline" size="sm" className="w-full">
                      <Phone className="mr-2 size-4 shrink-0" />
                      <span className="truncate">{lead.contact}</span>
                    </Button>
                  </a>
                ) : null}
                <Button
                  variant="default"
                  size="sm"
                  className="shrink-0"
                  onClick={() => openLeadSheet(lead)}
                >
                  <FileEdit className="mr-2 size-4" />
                  Fill info
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: Table */}
        <Table className="hidden md:table">
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={paginatedLeads.length > 0 && paginatedLeads.every((l) => selected.includes(l.id))}
                  onCheckedChange={(c) => toggleSelectAll(!!c)}
                />
              </TableHead>
              <TableHead>Stage</TableHead>
              <TableHead className="whitespace-nowrap">Library / Owner</TableHead>
              <TableHead className="whitespace-nowrap">Contact / Location</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead className="whitespace-nowrap">Call Status</TableHead>
              <TableHead className="whitespace-nowrap">Next Follow-up</TableHead>
              <TableHead className="whitespace-nowrap">Assigned BD</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
              {paginatedLeads.map((lead) => (
              <TableRow key={lead.id} onMouseEnter={() => router.prefetch(`/leads/${lead.id}`)}>
                <TableCell>
                  <Checkbox
                    checked={selected.includes(lead.id)}
                    onCheckedChange={() => toggleSelect(lead.id)}
                  />
                </TableCell>
                <TableCell>
                  {(() => {
                    const color = getStageColor(lead)
                    return color ? (
                      <span
                        className="inline-flex h-5 shrink-0 items-center justify-center rounded-full border border-transparent px-2 py-0.5 text-xs font-medium text-gray-800"
                        style={{ backgroundColor: color }}
                      >
                        {lead.stage}
                      </span>
                    ) : (
                      <Badge variant="secondary">{lead.stage}</Badge>
                    )
                  })()}
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium uppercase">{lead.library}</div>
                    <div className="text-xs text-muted-foreground">{lead.owner}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div>{lead.contact}</div>
                    <div className="text-xs text-muted-foreground">{lead.location || "—"}</div>
                  </div>
                </TableCell>
                <TableCell>
                  {lead.tags.length > 0 ? (
                    lead.tags.map((t) => (
                      <Badge key={t} variant="outline" className="mr-1 text-xs">{t}</Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">{lead.lastCall || "—"}</TableCell>
                <TableCell>{lead.nextFollowup || "—"}</TableCell>
                <TableCell className="font-medium">{lead.assignedTo}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => openLeadSheet(lead)}
                      title="Fill info"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <FileEdit className="size-4" />
                    </Button>
                    {(() => {
                      const wa = whatsappLink(lead.contact)
                      return wa ? (
                        <a href={wa} target="_blank" rel="noopener noreferrer" title="WhatsApp">
                          <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-green-600">
                            <MessageCircle className="size-4" />
                          </Button>
                        </a>
                      ) : null
                    })()}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-fit min-w-max">
                        <DropdownMenuItem onClick={() => router.push(`/leads/${lead.id}`)}>
                          <Eye className="mr-2 size-4" />
                          View Lead
                        </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditLead(lead)}>
                        <Pencil className="mr-2 size-4" />
                        Edit Lead
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setReminderTaskLead(lead); setReminderSheetOpen(true); }}>
                        <Bell className="mr-2 size-4" />
                        Add Reminder
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setReminderTaskLead(lead); setTaskSheetOpen(true); }}>
                        <ClipboardList className="mr-2 size-4" />
                        Create Task
                      </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
        )}
      </DataTableCard>

      <LeadDetailSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        lead={selectedLead}
        onSave={handleSheetSave}
      />

      <LeadFormSheet
        open={formSheetOpen}
        onOpenChange={(open) => {
          setFormSheetOpen(open)
          if (!open) setFormSaveError("")
        }}
        mode={formMode}
        lead={formLead}
        onSave={handleFormSave}
        onLeadFound={handleLeadFound}
        searchLeadsByPhone={searchLeadsByPhone}
        tagOptions={[...new Set(leads.flatMap((l) => l.tags))]}
        apiError={formSaveError}
        stageOptionsProp={stages.map((s) => ({ id: s.id, name: s.name }))}
        sourceOptionsProp={sources.map((s) => ({ id: s.id, name: s.name }))}
      />

      <AddReminderSheet
        open={reminderSheetOpen}
        onOpenChange={(open) => { setReminderSheetOpen(open); if (!open) setReminderTaskLead(null); }}
        lead={reminderTaskLead}
      />

      <CreateTaskSheet
        open={taskSheetOpen}
        onOpenChange={(open) => { setTaskSheetOpen(open); if (!open) setReminderTaskLead(null); }}
        lead={reminderTaskLead}
      />

      <ImportLeadSheet
        open={importSheetOpen}
        onOpenChange={setImportSheetOpen}
        onImportComplete={fetchLeads}
      />
    </div>
  )
}
