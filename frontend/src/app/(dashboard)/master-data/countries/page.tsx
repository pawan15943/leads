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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { DataTableCard } from "@/components/ui/data-table-card"
import { EmptyState } from "@/components/ui/empty-state"
import { Plus, Pencil, Trash2, MoreHorizontal, ArrowLeft, Loader2 } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { countriesApi, type Country } from "@/lib/api"
import { toast } from "sonner"
import { RequiredStar } from "@/components/ui/required-star"
import { DeleteSuccessModal } from "@/components/ui/delete-success-modal"


export default function CountriesPage() {
  const [countries, setCountries] = useState<Country[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [activeFilter, setActiveFilter] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Country | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [selected, setSelected] = useState<number[]>([])
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 10
  const [form, setForm] = useState({ name: "", code: "", phone_code: "", is_active: true })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [deleteSuccessOpen, setDeleteSuccessOpen] = useState(false)

  const fetchCountries = async () => {
    try {
      setLoading(true)
      const res = await countriesApi.list({ search: search || undefined })
      setCountries(res.data)
    } catch {
      setCountries([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCountries()
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [search, activeFilter])

  const resetForm = () => {
    setForm({ name: "", code: "", phone_code: "", is_active: true })
    setEditing(null)
    setError("")
    setFieldErrors({})
    setDialogOpen(false)
  }

  const handleAdd = () => {
    resetForm()
    setDialogOpen(true)
  }

  const handleEdit = (c: Country) => {
    setEditing(c)
    setForm({
      name: c.name,
      code: c.code || "",
      phone_code: c.phone_code || "",
      is_active: c.is_active,
    })
    setError("")
    setDialogOpen(true)
  }

  const filteredCountries = (activeFilter === "all"
    ? countries
    : countries.filter((c) => (activeFilter === "active" ? c.is_active : !c.is_active))
  ).filter((c) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      String(c.name).toLowerCase().includes(q) ||
      String(c.code || "").toLowerCase().includes(q)
    )
  })

  const totalPages = Math.max(1, Math.ceil(filteredCountries.length / PAGE_SIZE))
  const paginatedCountries = filteredCountries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selected.length} selected country(ies)?`)) return
    try {
      for (const id of selected) await countriesApi.delete(id)
      setSelected([])
      fetchCountries()
      setDeleteSuccessOpen(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete")
    }
  }

  const handleBulkEdit = () => {
    alert(`Bulk edit ${selected.length} countries - connect to API`)
  }

  const handleDelete = async (c: Country) => {
    if (!confirm(`Delete country "${c.name}"?`)) return
    try {
      await countriesApi.delete(c.id)
      fetchCountries()
      setDeleteSuccessOpen(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    const errs: Record<string, string> = {}
    if (!form.name?.trim()) errs.name = "Name is required"
    setFieldErrors(errs)
    if (Object.keys(errs).length > 0) return
    setSubmitting(true)
    try {
      if (editing) {
        await countriesApi.update(editing.id, {
          name: form.name,
          code: form.code || undefined,
          phone_code: form.phone_code || undefined,
          is_active: form.is_active,
        })
      } else {
        await countriesApi.create({
          name: form.name,
          code: form.code || undefined,
          phone_code: form.phone_code || undefined,
          is_active: form.is_active,
        })
      }
      toast.success(editing ? "Country updated" : "Country created")
      resetForm()
      fetchCountries()
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
        <h1 className="text-lg font-semibold tracking-tight sm:text-xl">Countries</h1>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">Manage countries for lead location</p>
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
          <Select
            value={activeFilter}
            onValueChange={(v) => setActiveFilter(v ?? "all")}
            items={{ all: "All", active: "Active", inactive: "Inactive" }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        }
        onClearFilters={() => { setSearch(""); setActiveFilter("all"); setPage(1); }}
        selectedCount={selected.length}
        totalCount={filteredCountries.length}
        pagination={{
          page,
          totalPages,
          totalEntries: filteredCountries.length,
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
          <Button onClick={handleAdd} size="sm">
            <Plus className="mr-2 size-4" />
            Add Country
          </Button>
        }
      >
        {loading ? (
          <div className="py-12 text-center text-muted-foreground">Loading...</div>
        ) : filteredCountries.length === 0 ? (
          <EmptyState
            title="No countries yet"
            description="Add countries to use in lead locations. You can set country code and phone code for each entry."
            action={
              <Button size="sm" onClick={handleAdd}>
                <Plus className="mr-2 size-4" />
                Add Country
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
                    checked={paginatedCountries.length > 0 && paginatedCountries.every((x) => selected.includes(x.id))}
                    onCheckedChange={(c) =>
                      setSelected(c ? [...new Set([...selected, ...paginatedCountries.map((x) => x.id)])] : selected.filter((id) => !paginatedCountries.some((x) => x.id === id)))
                    }
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Phone Code</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCountries.map((c) => (
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
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {c.code || "—"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.phone_code || "—"}</TableCell>
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
              ))}
            </TableBody>
          </Table>
        )}
      </DataTableCard>

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && !submitting && resetForm()}>
        <DialogContent className="sm:max-w-md animate-in fade-in-0 zoom-in-95 duration-200">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Country" : "Add Country"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update country details" : "Create a new country"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            )}
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
              <Label htmlFor="code">Code (e.g. IN, US)</Label>
              <Input
                id="code"
                value={form.code}
                onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                placeholder="IN"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone_code">Phone Code</Label>
              <Input
                id="phone_code"
                value={form.phone_code}
                onChange={(e) => setForm((p) => ({ ...p, phone_code: e.target.value }))}
                placeholder="+91"
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
