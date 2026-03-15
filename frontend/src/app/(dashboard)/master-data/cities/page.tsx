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
import { citiesApi, listsApi, type City } from "@/lib/api"
import { toast } from "sonner"
import { RequiredStar } from "@/components/ui/required-star"
import { DeleteSuccessModal } from "@/components/ui/delete-success-modal"


export default function CitiesPage() {
  const [cities, setCities] = useState<City[]>([])
  const [countries, setCountries] = useState<{ id: number; name: string; code: string | null }[]>([])
  const [states, setStates] = useState<{ id: number; name: string; code: string | null; country_id: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [stateFilter, setStateFilter] = useState<string>("all")
  const [countryFilter, setCountryFilter] = useState<string>("all")
  const [activeFilter, setActiveFilter] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<City | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [selected, setSelected] = useState<number[]>([])
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 10
  const [form, setForm] = useState({ name: "", state_id: 0, is_active: true })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [deleteSuccessOpen, setDeleteSuccessOpen] = useState(false)

  const fetchCities = async () => {
    try {
      setLoading(true)
      const res = await citiesApi.list({
        search: search || undefined,
        state_id: stateFilter !== "all" ? Number(stateFilter) : undefined,
        country_id: countryFilter !== "all" ? Number(countryFilter) : undefined,
        per_page: 1000,
      })
      setCities(res.data)
    } catch {
      setCities([])
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

  const fetchStates = async (countryId?: number) => {
    try {
      const list = await listsApi.states(countryId)
      setStates(list)
    } catch {
      setStates([])
    }
  }

  useEffect(() => {
    fetchCities()
  }, [search, stateFilter, countryFilter])

  useEffect(() => {
    setPage(1)
  }, [search, stateFilter, countryFilter, activeFilter])

  useEffect(() => {
    fetchCountries()
  }, [])

  useEffect(() => {
    fetchStates(countryFilter !== "all" ? Number(countryFilter) : undefined)
  }, [countryFilter])

  const resetForm = () => {
    setForm({ name: "", state_id: states[0]?.id ?? 0, is_active: true })
    setEditing(null)
    setError("")
    setFieldErrors({})
    setDialogOpen(false)
  }

  const handleAdd = () => {
    setForm({ name: "", state_id: states[0]?.id ?? 0, is_active: true })
    setEditing(null)
    setError("")
    setDialogOpen(true)
  }

  const handleEdit = (c: City) => {
    setEditing(c)
    setForm({
      name: c.name,
      state_id: c.state_id,
      is_active: c.is_active,
    })
    setError("")
    setDialogOpen(true)
  }

  const filteredCities = cities.filter((c) => {
    if (search.trim()) {
      const q = search.toLowerCase()
      if (!String(c.name).toLowerCase().includes(q)) return false
    }
    if (activeFilter !== "all") {
      if (activeFilter === "active" && !c.is_active) return false
      if (activeFilter === "inactive" && c.is_active) return false
    }
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filteredCities.length / PAGE_SIZE))
  const paginatedCities = filteredCities.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selected.length} selected city(ies)?`)) return
    try {
      for (const id of selected) await citiesApi.delete(id)
      setSelected([])
      fetchCities()
      setDeleteSuccessOpen(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete")
    }
  }

  const handleBulkEdit = () => {
    alert(`Bulk edit ${selected.length} cities - connect to API`)
  }

  const handleDelete = async (c: City) => {
    if (!confirm(`Delete city "${c.name}"?`)) return
    try {
      await citiesApi.delete(c.id)
      fetchCities()
      setDeleteSuccessOpen(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    const errs: Record<string, string> = {}
    if (!form.state_id) errs.state_id = "Please select a state"
    if (!form.name?.trim()) errs.name = "Name is required"
    setFieldErrors(errs)
    if (Object.keys(errs).length > 0) return
    setSubmitting(true)
    try {
      if (editing) {
        await citiesApi.update(editing.id, {
          name: form.name,
          state_id: form.state_id,
          is_active: form.is_active,
        })
      } else {
        await citiesApi.create({
          name: form.name,
          state_id: form.state_id,
          is_active: form.is_active,
        })
      }
      toast.success(editing ? "City updated" : "City created")
      resetForm()
      fetchCities()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operation failed")
      setFieldErrors({})
    } finally {
      setSubmitting(false)
    }
  }

  const getLocationDisplay = (city: City) => {
    const stateName = city.state?.name ?? "—"
    const countryName = city.state?.country?.name ?? "—"
    return { stateName, countryName }
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
        <h1 className="text-lg font-semibold tracking-tight sm:text-xl">Cities</h1>
        <p className="text-muted-foreground mt-1">Manage cities for lead location</p>
      </div>

      {error && !dialogOpen && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-center justify-between">
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={() => setError("")}>Dismiss</Button>
        </div>
      )}

      <DataTableCard
        searchPlaceholder="Search by Name..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={
          <>
            <Select value={countryFilter} onValueChange={(v) => { setCountryFilter(v ?? "all"); setStateFilter("all"); }}>
              <SelectTrigger className="w-[140px]">
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
            <Select value={stateFilter} onValueChange={(v) => setStateFilter(v ?? "all")}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {states.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
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
        onClearFilters={() => { setSearch(""); setCountryFilter("all"); setStateFilter("all"); setActiveFilter("all"); setPage(1); }}
        selectedCount={selected.length}
        totalCount={filteredCities.length}
        pagination={{
          page,
          totalPages,
          totalEntries: filteredCities.length,
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
          <Button onClick={handleAdd} size="sm" disabled={states.length === 0}>
            <Plus className="mr-2 size-4" />
            Add City
          </Button>
        }
      >
        {loading ? (
          <div className="py-12 text-center text-muted-foreground">Loading...</div>
        ) : filteredCities.length === 0 ? (
          <EmptyState
            title="No cities yet"
            description="Add cities to complete your location hierarchy. Cities are linked to states for accurate lead addressing."
            action={
              <Button size="sm" onClick={handleAdd} disabled={states.length === 0}>
                <Plus className="mr-2 size-4" />
                Add City
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
                    checked={paginatedCities.length > 0 && paginatedCities.every((x) => selected.includes(x.id))}
                    onCheckedChange={(c) =>
                      setSelected(c ? [...new Set([...selected, ...paginatedCities.map((x) => x.id)])] : selected.filter((id) => !paginatedCities.some((x) => x.id === id)))
                    }
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCities.map((c) => {
                const { stateName, countryName } = getLocationDisplay(c)
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Checkbox
                        checked={selected.includes(c.id)}
                        onCheckedChange={() =>
                          setSelected((prev) =>
                            prev.includes(c.id) ? prev.filter((x) => x !== c.id) : [...prev, c.id]
                          )
                        }
                      />
                    </TableCell>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{stateName}</TableCell>
                    <TableCell>{countryName}</TableCell>
                    <TableCell>
                      <Badge variant={c.is_active ? "default" : "outline"}>
                        {c.is_active ? "Yes" : "No"}
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
                          <DropdownMenuItem onClick={() => handleEdit(c)}>
                            <Pencil className="mr-2 size-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDelete(c)}
                          >
                            <Trash2 className="mr-2 size-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </DataTableCard>

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && !submitting && resetForm()}>
        <DialogContent className="sm:max-w-md animate-in fade-in-0 zoom-in-95 duration-200">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit City" : "Add City"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update city details" : "Create a new city"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            )}
            <div className="space-y-2">
              <Label>State <RequiredStar /></Label>
              <Select
                value={form.state_id ? String(form.state_id) : ""}
                onValueChange={(v) => setForm((p) => ({ ...p, state_id: Number(v) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {states.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.state_id && <p className="text-xs text-destructive">{fieldErrors.state_id}</p>}
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
