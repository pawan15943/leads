"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
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
import { DataTableCard } from "@/components/ui/data-table-card"
import { EmptyState } from "@/components/ui/empty-state"
import { Plus, Pencil, Trash2, MoreHorizontal, ArrowLeft, Loader2 } from "lucide-react"
import { RequiredStar } from "@/components/ui/required-star"
import { DeleteSuccessModal } from "@/components/ui/delete-success-modal"
import { toast } from "sonner"

export type MasterField = {
  key: string
  label: string
  type?: "text" | "number" | "checkbox"
  placeholder?: string
  required?: boolean
}

export type MasterCrudConfig = {
  title: string
  description: string
  fields: MasterField[]
  idKey?: string
  /** Field key for status filter (e.g. is_active, status, is_closed). When set, shows Status dropdown with All/Active/Inactive */
  statusFilterField?: string
}

export type MasterCrudApi = {
  list: () => Promise<{ data: MasterRecord[] }>
  create: (data: Record<string, unknown>) => Promise<MasterRecord>
  update: (id: number, data: Record<string, unknown>) => Promise<MasterRecord>
  delete: (id: number) => Promise<void>
}

type MasterRecord = Record<string, string | number | boolean>

type MasterCrudPageProps = {
  config: MasterCrudConfig
  initialData?: MasterRecord[]
  api?: MasterCrudApi
}

export function MasterCrudPage({ config, initialData = [], api }: MasterCrudPageProps) {
  const [items, setItems] = useState<MasterRecord[]>(initialData)
  const [loading, setLoading] = useState(!!api)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<MasterRecord>({})
  const [search, setSearch] = useState("")
  const [filterValue, setFilterValue] = useState<string>("all")
  const [selected, setSelected] = useState<number[]>([])
  const [page, setPage] = useState(1)
  const [deleteSuccessOpen, setDeleteSuccessOpen] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const PAGE_SIZE = 10

  const idKey = config.idKey ?? "id"
  const statusFilterField = config.statusFilterField

  const fetchItems = useCallback(async () => {
    if (!api) return
    setLoading(true)
    try {
      const res = await api.list()
      const data = Array.isArray(res.data) ? res.data : (res as { data?: unknown }).data
      setItems(Array.isArray(data) ? data : [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [api])

  useEffect(() => {
    if (api) fetchItems()
  }, [api, fetchItems])

  const firstFieldKey = config.fields[0]?.key
  const filterOptions = useMemo(() => {
    if (!firstFieldKey || statusFilterField) return []
    const values = [...new Set(items.map((i) => String(i[firstFieldKey] ?? "")).filter(Boolean))]
    return values.sort()
  }, [items, firstFieldKey, statusFilterField])

  const filteredItems = useMemo(() => {
    let result = items
    if (statusFilterField) {
      const isClosedField = statusFilterField === "is_closed"
      if (statusFilter === "active") {
        result = result.filter((item) => {
          const v = item[statusFilterField]
          if (isClosedField) return v === false || v === undefined
          return v === true || v === "active" || v === "1"
        })
      } else if (statusFilter === "inactive") {
        result = result.filter((item) => {
          const v = item[statusFilterField]
          if (isClosedField) return v === true
          return v === false || v === "inactive" || v === "0" || v === "closed"
        })
      }
    } else if (filterValue !== "all" && firstFieldKey) {
      result = result.filter((item) => String(item[firstFieldKey] ?? "") === filterValue)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((item) =>
        config.fields.some((f) =>
          String(item[f.key] ?? "").toLowerCase().includes(q)
        )
      )
    }
    return result
  }, [items, filterValue, firstFieldKey, statusFilter, statusFilterField, search, config.fields])

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE))
  const paginatedItems = filteredItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [search, filterValue, statusFilter])

  const resetForm = () => {
    setFormData({})
    setEditingId(null)
    setFieldErrors({})
    setDialogOpen(false)
  }

  const handleAdd = () => {
    setFormData({})
    setEditingId(null)
    setDialogOpen(true)
  }

  const handleEdit = (item: MasterRecord) => {
    setFormData({ ...item })
    setEditingId(Number(item[idKey]))
    setDialogOpen(true)
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selected.length} selected item(s)?`)) return
    if (api) {
      try {
        await Promise.all(selected.map((id) => api.delete(id)))
        await fetchItems()
        setSelected([])
        setDeleteSuccessOpen(true)
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to delete")
      }
    } else {
      setItems((prev) => prev.filter((i) => !selected.includes(Number(i[idKey]))))
      setSelected([])
      setDeleteSuccessOpen(true)
    }
  }

  const handleBulkEdit = () => {
    alert(`Bulk edit ${selected.length} items - connect to API`)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this item?")) return
    if (api) {
      try {
        await api.delete(id)
        await fetchItems()
        setDeleteSuccessOpen(true)
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to delete")
      }
    } else {
      setItems((prev) => prev.filter((i) => Number(i[idKey]) !== id))
      setDeleteSuccessOpen(true)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    config.fields.filter((f) => f.key !== idKey && f.required).forEach((f) => {
      const val = formData[f.key]
      if (val === undefined || val === null || (typeof val === "string" && !val.trim())) errs[f.key] = `${f.label} is required`
    })
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs)
      return
    }
    setFieldErrors({})
    const payload: Record<string, unknown> = {}
    config.fields.filter((f) => f.key !== idKey).forEach((f) => {
      const val = formData[f.key]
      if (val !== undefined && val !== null && (typeof val !== "string" || val.trim() !== "")) {
        payload[f.key] = f.type === "number" ? Number(val) : f.type === "checkbox" ? Boolean(val) : val
      }
    })
    if (api) {
      setSubmitting(true)
      try {
        if (editingId !== null) {
          await api.update(editingId, payload)
        } else {
          await api.create(payload)
        }
        await fetchItems()
        toast.success(editingId !== null ? "Updated successfully" : "Created successfully")
        resetForm()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save")
      } finally {
        setSubmitting(false)
      }
    } else {
      if (editingId !== null) {
        setItems((prev) =>
          prev.map((i) =>
            Number(i[idKey]) === editingId ? { ...i, ...formData } : i
          )
        )
      } else {
        const newId = items.length > 0 ? Math.max(...items.map((i) => Number(i[idKey]))) + 1 : 1
        setItems((prev) => [...prev, { [idKey]: newId, ...formData }])
      }
      resetForm()
    }
  }

  const updateField = (key: string, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Link
          href="/master-data"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          <ArrowLeft className="size-4" />
          Back to Master Data
        </Link>
      </div>
      <div>
        <h1 className="text-lg font-semibold tracking-tight sm:text-xl">{config.title}</h1>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{config.description}</p>
      </div>

      <DataTableCard
        searchPlaceholder={`Search ${config.title.toLowerCase()}...`}
        searchValue={search}
        onSearchChange={setSearch}
        filters={
          statusFilterField ? (
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v ?? "all")}
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
          ) : firstFieldKey && filterOptions.length > 0 ? (
            <Select value={filterValue} onValueChange={(v) => v && setFilterValue(v)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder={config.fields[0]?.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {filterOptions.map((v) => (
                  <SelectItem key={v} value={v}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null
        }
        onClearFilters={() => { setSearch(""); setFilterValue("all"); setStatusFilter("all"); setPage(1); }}
        selectedCount={selected.length}
        totalCount={filteredItems.length}
        pagination={{
          page,
          totalPages,
          totalEntries: filteredItems.length,
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
            Add New
          </Button>
        }
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">Loading...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyState
            title={`No ${config.title.toLowerCase()} yet`}
            description={config.description}
            action={
              <Button size="sm" onClick={handleAdd}>
                <Plus className="mr-2 size-4" />
                Add New
              </Button>
            }
            illustration="default"
          />
        ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    paginatedItems.length > 0 &&
                    paginatedItems.every((i) => selected.includes(Number(i[idKey])))
                  }
                  onCheckedChange={(c) =>
                    setSelected(
                      c
                        ? [...new Set([...selected, ...paginatedItems.map((i) => Number(i[idKey]))])]
                        : selected.filter((id) => !paginatedItems.some((i) => Number(i[idKey]) === id))
                    )
                  }
                />
              </TableHead>
              {config.fields.map((f) => (
                <TableHead key={f.key}>{f.label}</TableHead>
              ))}
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.map((item) => (
                <TableRow key={String(item[idKey])}>
                  <TableCell>
                    <Checkbox
                      checked={selected.includes(Number(item[idKey]))}
                      onCheckedChange={() =>
                        setSelected((prev) => {
                          const id = Number(item[idKey])
                          return prev.includes(id)
                            ? prev.filter((x) => x !== id)
                            : [...prev, id]
                        })
                      }
                    />
                  </TableCell>
                  {config.fields.map((f) => (
                      <TableCell key={f.key}>
                        {f.type === "checkbox"
                          ? item[f.key]
                            ? "Yes"
                            : "No"
                          : String(item[f.key] ?? "-")}
                      </TableCell>
                  ))}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(item)}>
                          <Pencil className="mr-2 size-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(Number(item[idKey]))}
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
            <DialogTitle>{editingId !== null ? "Edit" : "Add"} {config.title}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {config.fields.filter((f) => f.key !== idKey).map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>
                  {field.label}
                  {field.required && <RequiredStar />}
                </Label>
                {field.type === "checkbox" ? (
                  <input
                    id={field.key}
                    type="checkbox"
                    checked={Boolean(formData[field.key])}
                    onChange={(e) => updateField(field.key, e.target.checked)}
                    className="rounded border-input"
                  />
                ) : (
                  <Input
                    id={field.key}
                    type={field.type ?? "text"}
                    placeholder={field.placeholder}
                    value={String(formData[field.key] ?? "")}
                    onChange={(e) => {
                      updateField(field.key, field.type === "number" ? Number(e.target.value) : e.target.value)
                      setFieldErrors((prev) => ({ ...prev, [field.key]: "" }))
                    }}
                  />
                )}
                {fieldErrors[field.key] && <p className="text-xs text-destructive">{fieldErrors[field.key]}</p>}
              </div>
            ))}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    {editingId !== null ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  editingId !== null ? "Update" : "Create"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteSuccessModal
        open={deleteSuccessOpen}
        onOpenChange={setDeleteSuccessOpen}
        title="Deleted successfully"
        message={`The ${config.title.toLowerCase()} has been deleted.`}
      />
    </div>
  )
}
