"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Search, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { useLists } from "@/contexts/ListsContext"
import { RequiredStar } from "@/components/ui/required-star"

export type LeadFormData = {
  library: string
  owner: string
  contact: string
  stage: string
  stageId?: number
  source: string
  sourceId?: number
  assignedTo: string
  state: string
  city: string
  cityId?: number
  tags: string[]
}

export type Lead = {
  id: number
  library: string
  owner: string
  contact: string
  stage: string
  source: string
  assignedTo: string
  lastCall: string
  nextFollowup: string
  tags: string[]
  location: string
}

const FALLBACK_STAGES = ["New", "Contacted", "Interested", "Demo Scheduled"]
const FALLBACK_SOURCES = ["Website", "Referral", "Direct", "Other"]

function TagMultiSelect({
  value,
  onChange,
  options,
  placeholder = "Add tags",
}: {
  value: string[]
  onChange: (tags: string[]) => void
  options: string[]
  placeholder?: string
}) {
  const [input, setInput] = useState("")
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const availableOptions = options.filter((o) => !value.includes(o) && o.toLowerCase().includes(input.toLowerCase()))

  function addTag(tag: string) {
    const t = tag.trim()
    if (t && !value.includes(t)) onChange([...value, t])
    setInput("")
    setOpen(false)
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag))
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <div
        className={cn(
          "flex min-h-10 w-full flex-wrap items-center gap-2 rounded-xl border border-input bg-transparent px-3 py-2 text-sm font-medium transition-all outline-none",
          "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/30"
        )}
      >
        {value.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1 pr-1">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="rounded-full p-0.5 hover:bg-muted-foreground/20"
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              if (input.trim()) addTag(input.trim())
              else if (availableOptions[0]) addTag(availableOptions[0])
            }
          }}
          placeholder={value.length === 0 ? placeholder : ""}
          className="min-w-[80px] flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
        />
      </div>
      {open && (input || availableOptions.length > 0) && (
        <div className="absolute top-full left-0 z-50 mt-1 max-h-40 w-full overflow-auto rounded-lg border bg-popover p-1 shadow-md">
          {input.trim() && !options.includes(input.trim()) && !value.includes(input.trim()) && (
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
              onClick={() => addTag(input.trim())}
            >
              <span className="text-muted-foreground">Add</span>
              <span className="font-medium">&quot;{input.trim()}&quot;</span>
            </button>
          )}
          {availableOptions.map((opt) => (
            <button
              key={opt}
              type="button"
              className="flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
              onClick={() => addTag(opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const getEmptyForm = (
  stageOptions: string[],
  sourceOptions: string[],
  stageId?: number,
  sourceId?: number
): LeadFormData => ({
  library: "",
  owner: "",
  contact: "",
  stage: stageOptions[0] ?? "New",
  stageId,
  source: sourceOptions[0] ?? "Website",
  sourceId,
  assignedTo: "-",
  state: "",
  city: "",
  tags: [],
})

type LeadFormSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "add" | "edit"
  lead?: Lead | null
  onSave: (data: LeadFormData & { location: string }, leadId?: number) => void | Promise<boolean>
  onLeadFound?: (lead: Lead) => void
  searchLeadsByPhone?: (phone: string) => Lead | null
  /** Additional tag options from existing leads */
  tagOptions?: string[]
  /** API error from parent (e.g. save failure) - shown at top of form */
  apiError?: string
  /** Stage options from API (from parent's fetchLists) - used when provided for dynamic dropdown */
  stageOptionsProp?: { id: number; name: string }[]
  /** Source options from API (from parent's fetchLists) - used when provided for dynamic dropdown */
  sourceOptionsProp?: { id: number; name: string }[]
}

export function LeadFormSheet({
  open,
  onOpenChange,
  mode,
  lead = null,
  onSave,
  onLeadFound,
  searchLeadsByPhone,
  tagOptions = [],
  apiError,
  stageOptionsProp,
  sourceOptionsProp,
}: LeadFormSheetProps) {
  const [step, setStep] = useState<"search" | "form">("search")
  const [phoneSearch, setPhoneSearch] = useState("")
  const [searching, setSearching] = useState(false)
  const [formData, setFormData] = useState<LeadFormData>(() => getEmptyForm(FALLBACK_STAGES, FALLBACK_SOURCES))
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [cityOptions, setCityOptions] = useState<{ id: number; name: string }[]>([])
  const [submitting, setSubmitting] = useState(false)
  const hasTransitionedToFormRef = useRef(false)

  const { users: bdUsers, tags: tagsList, stages, sources, states: statesList, loadCities } = useLists()
  const apiTags = useMemo(() => tagsList.map((t) => t.name), [tagsList])
  const stageOptions = useMemo(
    () => (stages.length ? stages.map((s) => s.name) : FALLBACK_STAGES),
    [stages]
  )
  const sourceOptions = useMemo(
    () => (sources.length ? sources.map((s) => s.name) : FALLBACK_SOURCES),
    [sources]
  )
  const stageOptionsWithId = useMemo(
    () => stages.map((s) => ({ id: s.id, name: s.name })),
    [stages]
  )
  const sourceOptionsWithId = useMemo(
    () => sources.map((s) => ({ id: s.id, name: s.name })),
    [sources]
  )
  const stateOptions = useMemo(
    () => statesList.map((s) => ({ id: s.id, name: s.name })),
    [statesList]
  )

  const allTagOptions = [...new Set([...apiTags, ...tagOptions])]
  const baseStageOptions = stageOptionsProp?.length ? stageOptionsProp.map((s) => s.name) : stageOptions
  const baseSourceOptions = sourceOptionsProp?.length ? sourceOptionsProp.map((s) => s.name) : sourceOptions
  const effectiveStageOptions = mode === "edit" && lead?.stage && !baseStageOptions.includes(lead.stage)
    ? [...baseStageOptions, lead.stage]
    : baseStageOptions
  const effectiveSourceOptions = mode === "edit" && lead?.source && !baseSourceOptions.includes(lead.source)
    ? [...baseSourceOptions, lead.source]
    : baseSourceOptions

  useEffect(() => {
    if (!formData.state) {
      setCityOptions([])
      return
    }
    const stateObj = statesList.find((s) => s.name === formData.state)
    if (!stateObj) {
      setCityOptions([])
      return
    }
    loadCities(stateObj.id)
      .then((c) => c.map((x) => ({ id: x.id, name: x.name })))
      .then(setCityOptions)
      .catch(() => setCityOptions([]))
  }, [formData.state, statesList, loadCities])

  useEffect(() => {
    if (!open) {
      hasTransitionedToFormRef.current = false
      return
    }
    if (mode === "edit" && lead) {
      hasTransitionedToFormRef.current = false
      setStep("form")
      const locParts = (lead.location || "").split(", ")
      const stateVal = lead.stateId && stateOptions.length
        ? (stateOptions.find((s) => s.id === lead.stateId)?.name ?? (locParts.length >= 2 ? locParts[1] : ""))
        : (locParts.length >= 2 ? locParts[1] : "")
      const cityVal = locParts[0] || ""
      const assignedUser = bdUsers.find((u) => u.name === lead.assignedTo)
        setFormData({
          library: lead.library,
          owner: lead.owner,
          contact: lead.contact,
          stage: lead.stage,
          stageId: lead.stageId,
          source: lead.source,
          sourceId: lead.sourceId,
          assignedTo: assignedUser ? String(assignedUser.id) : (lead.assignedTo === "-" ? "-" : lead.assignedTo),
          state: stateVal,
          city: cityVal,
          cityId: lead.cityId,
          tags: [...lead.tags],
        })
    } else if (mode === "add") {
      if (!hasTransitionedToFormRef.current) {
        setStep("search")
        setPhoneSearch("")
        const stages = stageOptionsProp?.length ? stageOptionsProp.map((s) => s.name) : stageOptions
        const sources = sourceOptionsProp?.length ? sourceOptionsProp.map((s) => s.name) : sourceOptions
        const firstStage = stageOptionsProp?.[0] ?? stageOptionsWithId[0]
        const firstSource = sourceOptionsProp?.[0] ?? sourceOptionsWithId[0]
        setFormData(getEmptyForm(stages, sources, firstStage?.id, firstSource?.id))
      }
    }
  }, [open, mode, lead, bdUsers, stageOptions, sourceOptions, stageOptionsProp, sourceOptionsProp, stageOptionsWithId, sourceOptionsWithId])

  function handleSearch() {
    const digits = phoneSearch.replace(/\D/g, "").trim()
    if (digits.length !== 10) return
    setSearching(true)
    const formattedPhone = `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`
    // Simulate search - replace with API call
    setTimeout(() => {
      const found = searchLeadsByPhone?.(formattedPhone) ?? searchLeadsByPhone?.(digits)
      setSearching(false)
      if (found) {
        onLeadFound?.(found)
        onOpenChange(false)
      } else {
        hasTransitionedToFormRef.current = true
        const firstStage = stageOptionsProp?.[0] ?? stageOptionsWithId[0]
        const firstSource = sourceOptionsProp?.[0] ?? sourceOptionsWithId[0]
        setFormData((prev) => ({
          ...prev,
          contact: formattedPhone,
          stage: effectiveStageOptions[0] ?? prev.stage,
          stageId: firstStage?.id ?? prev.stageId,
          source: effectiveSourceOptions[0] ?? prev.source,
          sourceId: firstSource?.id ?? prev.sourceId,
        }))
        setStep("form")
      }
    }, 400)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!formData.library?.trim()) errs.library = "Library name is required"
    if (!formData.owner?.trim()) errs.owner = "Owner name is required"
    if (!formData.contact?.trim()) errs.contact = "Contact number is required"
    setFieldErrors(errs)
    if (Object.keys(errs).length > 0) return
    setSubmitting(true)
    try {
      const location = formData.city && formData.state ? `${formData.city}, ${formData.state}` : formData.city || formData.state
      const result = await onSave({ ...formData, location }, mode === "edit" ? lead?.id : undefined)
      if (result !== false) {
        onOpenChange(false)
        const firstStage = stageOptionsProp?.[0]
        const firstSource = sourceOptionsProp?.[0]
        setFormData(getEmptyForm(effectiveStageOptions, effectiveSourceOptions, firstStage?.id, firstSource?.id))
        setFieldErrors({})
        setStep("search")
      }
    } finally {
      setSubmitting(false)
    }
  }

  function handleClose(open: boolean) {
    if (!open) {
      setStep("search")
      setPhoneSearch("")
      const firstStage = stageOptionsProp?.[0]
      const firstSource = sourceOptionsProp?.[0]
      setFormData(getEmptyForm(effectiveStageOptions, effectiveSourceOptions, firstStage?.id, firstSource?.id))
      setFieldErrors({})
    }
    onOpenChange(open)
  }

  const [isDesktop, setIsDesktop] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)")
    setIsDesktop(mq.matches)
    const h = () => setIsDesktop(mq.matches)
    mq.addEventListener("change", h)
    return () => mq.removeEventListener("change", h)
  }, [])

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        className={cn(
          "overflow-hidden flex flex-col p-0 gap-0",
          isDesktop ? "w-full max-w-xl sm:max-w-2xl h-full max-h-none" : "h-[90vh] max-h-[90vh]"
        )}
        showCloseButton={true}
      >
        <div className="flex h-full flex-col overflow-hidden">
          <SheetHeader className="shrink-0 border-b px-6 pb-4 pt-5">
            <SheetTitle className="text-lg font-semibold">{mode === "edit" ? "Edit Lead" : step === "search" ? "Add Lead" : "New Lead"}</SheetTitle>
            <SheetDescription className="text-sm">
              {mode === "edit"
                ? "Update lead details"
                : step === "search"
                  ? "Enter the 10-digit mobile number to check if this lead already exists in your pipeline."
                  : "Fill in the lead details below"}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto overscroll-contain px-6 pb-6">
            {step === "search" && mode === "add" ? (
              <div className="relative mt-8 space-y-6">
                {searching && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/80 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="size-10 animate-spin text-primary" />
                      <p className="text-sm font-medium text-muted-foreground">Searching for lead...</p>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Phone Number</Label>
                  <div className="flex overflow-hidden rounded-xl border border-input bg-background ring-offset-background transition-all focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/30">
                    <span className="flex items-center border-r border-input bg-muted/50 px-4 py-2.5 text-sm font-medium text-muted-foreground">
                      +91
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      placeholder="98765 43210"
                      value={phoneSearch}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "").slice(0, 10)
                        setPhoneSearch(v)
                      }}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      className="flex-1 min-w-0 bg-transparent px-4 py-2.5 text-sm font-medium outline-none placeholder:text-muted-foreground"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter 10-digit Indian mobile number without +91
                  </p>
                </div>
                <div className="space-y-3">
                  <Button
                    className="w-full h-11 rounded-xl bg-primary font-medium shadow-sm transition-all hover:bg-primary/90 hover:shadow"
                    onClick={handleSearch}
                    disabled={phoneSearch.replace(/\D/g, "").length !== 10 || searching}
                  >
                    {searching ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      <Search className="mr-2 size-4" />
                    )}
                    Search Lead
                  </Button>
                  <div className="rounded-lg border border-muted/50 bg-muted/30 px-4 py-3">
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      If a lead with this number exists, it will open. Otherwise, you&apos;ll proceed to fill the new lead form.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <form id="lead-form" onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
                {apiError && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{apiError}</div>
                )}
                <div className="space-y-2">
                  <Label>Library Name <RequiredStar /></Label>
                  <Input
                    placeholder="ABC Library"
                    value={formData.library}
                    onChange={(e) => setFormData((p) => ({ ...p, library: e.target.value }))}
                  />
                  {fieldErrors.library && <p className="text-xs text-destructive">{fieldErrors.library}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Owner Name <RequiredStar /></Label>
                  <Input
                    placeholder="John Doe"
                    value={formData.owner}
                    onChange={(e) => setFormData((p) => ({ ...p, owner: e.target.value }))}
                  />
                  {fieldErrors.owner && <p className="text-xs text-destructive">{fieldErrors.owner}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Contact Number <RequiredStar /></Label>
                  <Input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.contact}
                    onChange={(e) => setFormData((p) => ({ ...p, contact: e.target.value }))}
                  />
                  {fieldErrors.contact && <p className="text-xs text-destructive">{fieldErrors.contact}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Stage</Label>
                  <Select
                    value={formData.stage}
                    onValueChange={(v) => {
                      const stageObj = stageOptionsProp?.find((s) => s.name === v) ?? stageOptionsWithId.find((s) => s.name === v)
                      setFormData((p) => ({ ...p, stage: v, stageId: stageObj?.id }))
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {effectiveStageOptions.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Source</Label>
                  <Select
                    value={formData.source}
                    onValueChange={(v) => {
                      const sourceObj = sourceOptionsProp?.find((s) => s.name === v) ?? sourceOptionsWithId.find((s) => s.name === v)
                      setFormData((p) => ({ ...p, source: v, sourceId: sourceObj?.id }))
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {effectiveSourceOptions.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Select value={formData.state} onValueChange={(v) => setFormData((p) => ({ ...p, state: v, city: "", cityId: undefined }))}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {stateOptions.map((s) => (
                        <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Select
                    value={formData.city}
                    onValueChange={(v) => {
                      const cityObj = cityOptions.find((c) => c.name === v)
                      setFormData((p) => ({ ...p, city: v, cityId: cityObj?.id }))
                    }}
                    disabled={!formData.state}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={formData.state ? "Select city" : "Select state first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {cityOptions.map((c) => (
                        <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Assigned BD</Label>
                  <Select value={formData.assignedTo || "-"} onValueChange={(v) => setFormData((p) => ({ ...p, assignedTo: v }))}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select BD" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="-">Unassigned</SelectItem>
                      {bdUsers.map((u) => (
                        <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tags</Label>
                  <TagMultiSelect
                    value={formData.tags}
                    onChange={(tags) => setFormData((p) => ({ ...p, tags }))}
                    options={allTagOptions}
                    placeholder="Add or select tags"
                  />
                </div>
              </form>
            )}
          </div>

          {step === "form" && (
            <div className="shrink-0 border-t bg-background px-6 py-4">
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => handleClose(false)}>
                  Cancel
                </Button>
                <Button type="submit" form="lead-form" className="flex-1" disabled={submitting}>
                  {submitting ? "Saving..." : mode === "edit" ? "Update Lead" : "Save Lead"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
