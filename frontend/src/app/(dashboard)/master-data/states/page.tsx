"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
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
import { Badge } from "@/components/ui/badge"
import { DataTableCard } from "@/components/ui/data-table-card"
import { EmptyState } from "@/components/ui/empty-state"
import { Plus, Pencil, Trash2, MoreHorizontal, ArrowLeft, Loader2 } from "lucide-react"
import { statesApi, listsApi, type State } from "@/lib/api"
import { toast } from "sonner"
import { RequiredStar } from "@/components/ui/required-star"
import { DeleteSuccessModal } from "@/components/ui/delete-success-modal"


export default function StatesPage() {
  const [states, setStates] = useState<State[]>([])
  const [countries, setCountries] = useState<{ id: number; name: string; code: string | null }[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [countryFilter, setCountryFilter] = useState<string>("all")
  const [activeFilter, setActiveFilter] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<State | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [selected, setSelected] = useState<number[]>([])
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 10
  const [form, setForm] = useState({ name: "", code: "", country_id: 0, is_active: true })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [deleteSuccessOpen, setDeleteSuccessOpen] = useState(false)

  const fetchStates = async () => {
    try {
      setLoading(true)
      const res = await statesApi.list({
        search: search || undefined,
        country_id: countryFilter !== "all" ? Number(countryFilter) : undefined,
      })
      setStates(res.data)
    } catch {
      setStates([])
    } finally {
      setLoading(false)
    }
  }

  const fetchCountries = async () => {
    try {
      const list = await listsApi.countries()
      setCountries(list)
    } catch {
      setCountries([])
    }
  }

  useEffect(() => {
    fetchStates()
  }, [search, countryFilter])

  useEffect(() => {
    setPage(1)
  }, [search, countryFilter, activeFilter])

  useEffect(() => {
    fetchCountries()
  }, [])

  const resetForm = () => {
    setForm({ name: "", code: "", country_id: countries[0]?.id ?? 0, is_active: true })
    setEditing(null)
    setError("")
    setFieldErrors({})
    setDialogOpen(false)
  }

  const handleAdd = () => {
    setForm({ name: "", code: "", country_id: countries[0]?.id ?? 0, is_active: true })
    setEditing(null)
    setError("")
    setDialogOpen(true)
  }

  const handleEdit = (s: State) => {
    setEditing(s)
    setForm({
      name: s.name,
      code: s.code || "",
      country_id: s.country_id,
      is_active: s.is_active,
    })
    setError("")
    setDialogOpen(true)
  }

  const filteredStates = states.filter((s) => {
    if (search.trim()) {
      const q = search.toLowerCase()
      if (!String(s.name).toLowerCase().includes(q) && !String(s.code || "").toLowerCase().includes(q)) return false
    }
    if (activeFilter !== "all") {
      if (activeFilter === "active" && !s.is_active) return false
      if (activeFilter === "inactive" && s.is_active) return false
    }
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filteredStates.length / PAGE_SIZE))
  const paginatedStates = filteredStates.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selected.length} selected state(s)?`)) return
    try {
      for (const id of selected) await statesApi.delete(id)
      setSelected([])
      fetchStates()
      setDeleteSuccessOpen(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete")
    }
  }

  const handleBulkEdit = () => {
    alert(`Bulk edit ${selected.length} states - connect to API`)
  }

  const handleDelete = async (s: State) => {
    if (!confirm(`Delete state "${s.name}"?`)) return
    try {
      await statesApi.delete(s.id)
      fetchStates()
      setDeleteSuccessOpen(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    const errs: Record<string, string> = {}
    if (!form.country_id) errs.country_id = "Please select a country"
    if (!form.name?.trim()) errs.name = "Name is required"
    setFieldErrors(errs)
    if (Object.keys(errs).length > 0) return
    setSubmitting(true)
    try {
      if (editing) {
        await statesApi.update(editing.id, {
          name: form.name,
          code: form.code || undefined,
          country_id: form.country_id,
          is_active: form.is_active,
        })
      } else {
        await statesApi.create({
          name: form.name,
          code: form.code || undefined,
          country_id: form.country_id,
          is_active: form.is_active,
        })
      }
      toast.success(editing ? "State updated" : "State created")
      resetForm()
      fetchStates()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operation failed")
      setFieldErrors({})
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/master-data" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
          <ArrowLeft className="size-4" />
          Back to Master Data
        </Link>
      </div>
      <div>
        <h1 className="text-lg font-semibold tracking-tight sm:text-xl">States</h1>
        <p className="text-muted-foreground mt-1">Manage states/provinces for lead location</p>
      </div>

      {error && !dialogOpen && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-center justify-between">
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={() => setError("")}>Dismiss</Button>
        </div>
      )}

      <DataTableCard
        searchPlaceholder="Search by Name, Code..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={
          <>
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {countries.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={activeFilter}
              onValueChange={(v) => setActiveFilter(v ?? "all")}
              items={{ all: "All", active: "Active", inactive: "Inactive" }}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
        onClearFilters={() => { setSearch(""); setCountryFilter("all"); setActiveFilter("all"); setPage(1); }}
        selectedCount={selected.length}
        totalCount={filteredStates.length}
        pagination={{
          page,
          totalPages,
          totalEntries: filteredStates.length,
          pageSize: PAGE_SIZE,
          onPrevious: () => setPage((p) => Math.max(1, p - 1)),
          onNext: () => setPage((p) => Math.min(totalPages, p + 1)),
        }}
        bulkActions={
          <>
            <Button variant="outline" size="sm" onClick={handleBulkEdit}>
              <Pencil className="mr-1.5 size-4" />
              Bulk Edit
            </Button>
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={handleBulkDelete}>
              <Trash2 className="mr-1.5 size-4" />
              Bulk Delete
            </Button>
          </>
        }
        headerActions={
          <Button onClick={handleAdd} size="sm" disabled={countries.length === 0}>
            <Plus className="mr-2 size-4" />
            Add State
          </Button>
        }
      >
        {loading ? (
          <div className="py-12 text-center text-muted-foreground">Loading...</div>
        ) : filteredStates.length === 0 ? (
          <EmptyState
            title="No states yet"
            description="Add states or provinces for your countries. States help organize lead locations by region."
            action={
              <Button size="sm" onClick={handleAdd} disabled={countries.length === 0}>
                <Plus className="mr-2 size-4" />
                Add State
              </Button>
            }
            illustration="folder"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={paginatedStates.length > 0 && paginatedStates.every((x) => selected.includes(x.id))}
                    onCheckedChange={(c) =>
                      setSelected(c ? [...new Set([...selected, ...paginatedStates.map((x) => x.id)])] : selected.filter((id) => !paginatedStates.some((x) => x.id === id)))
                    }
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedStates.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <Checkbox
                      checked={selected.includes(s.id)}
                      onCheckedChange={() =>
                        setSelected((prev) =>
                          prev.includes(s.id) ? prev.filter((x) => x !== s.id) : [...prev, s.id]
                        )
                      }
                    />
                  </TableCell>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {s.code || "—"}
                    </Badge>
                  </TableCell>
                  <TableCell>{s.country?.name ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={s.is_active ? "default" : "outline"}>
                      {s.is_active ? "Yes" : "No"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(s)}>
                          <Pencil className="mr-2 size-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(s)}
                        >
                          <Trash2 className="mr-2 size-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DataTableCard>

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && !submitting && resetForm()}>
        <DialogContent className="sm:max-w-md animate-in fade-in-0 zoom-in-95 duration-200">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit State" : "Add State"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update state details" : "Create a new state"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            )}
            <div className="space-y-2">
              <Label>Country <RequiredStar /></Label>
              <Select
                value={form.country_id ? String(form.country_id) : ""}
                onValueChange={(v) => setForm((p) => ({ ...p, country_id: Number(v) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.country_id && <p className="text-xs text-destructive">{fieldErrors.country_id}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name <RequiredStar /></Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
              {fieldErrors.name && <p className="text-xs text-destructive">{fieldErrors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Code (e.g. RJ, MH)</Label>
              <Input
                id="code"
                value={form.code}
                onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                placeholder="RJ"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="is_active"
                checked={form.is_active}
                onCheckedChange={(c) => setForm((p) => ({ ...p, is_active: !!c }))}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    {editing ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  editing ? "Update" : "Create"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteSuccessModal open={deleteSuccessOpen} onOpenChange={setDeleteSuccessOpen} />
    </div>
  )
}
