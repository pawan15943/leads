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
import { Plus, Pencil, Trash2, MoreHorizontal, ArrowLeft } from "lucide-react"
import { permissionsApi, listsApi, type Permission, type CreatePermissionInput } from "@/lib/api"
import { RequiredStar } from "@/components/ui/required-star"
import { DeleteSuccessModal } from "@/components/ui/delete-success-modal"


export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [allPermissions, setAllPermissions] = useState<{ module: string | null }[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [moduleFilter, setModuleFilter] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [selected, setSelected] = useState<number[]>([])
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 10
  const [form, setForm] = useState<CreatePermissionInput>({
    name: "",
    slug: "",
    module: "",
  })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [deleteSuccessOpen, setDeleteSuccessOpen] = useState(false)

  const fetchPermissions = async () => {
    try {
      setLoading(true)
      const res = await permissionsApi.list({
        search: search || undefined,
        module: moduleFilter !== "all" ? moduleFilter : undefined,
      })
      setPermissions(res.data)
    } catch {
      setPermissions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPermissions()
  }, [search, moduleFilter])

  useEffect(() => {
    setPage(1)
  }, [search, moduleFilter])

  useEffect(() => {
    listsApi.permissions().then((list) => setAllPermissions(list)).catch(() => setAllPermissions([]))
  }, [])

  const resetForm = () => {
    setForm({ name: "", slug: "", module: "" })
    setEditingPermission(null)
    setError("")
    setFieldErrors({})
    setDialogOpen(false)
  }

  const handleAdd = () => {
    resetForm()
    setDialogOpen(true)
  }

  const handleEdit = (perm: Permission) => {
    setEditingPermission(perm)
    setForm({
      name: perm.name,
      slug: perm.slug,
      module: perm.module || "",
    })
    setError("")
    setDialogOpen(true)
  }

  const uniqueModules = [...new Set(allPermissions.map((p) => p.module || "Other").filter(Boolean))].sort()
  const totalPages = Math.max(1, Math.ceil(permissions.length / PAGE_SIZE))
  const paginatedPermissions = permissions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selected.length} selected permission(s)?`)) return
    try {
      for (const id of selected) await permissionsApi.delete(id)
      setSelected([])
      fetchPermissions()
      setDeleteSuccessOpen(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete")
    }
  }

  const handleBulkEdit = () => {
    alert(`Bulk edit ${selected.length} permissions - connect to API`)
  }

  const handleDelete = async (perm: Permission) => {
    if (!confirm(`Delete permission "${perm.name}"?`)) return
    try {
      await permissionsApi.delete(perm.id)
      fetchPermissions()
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
    if (!form.slug?.trim()) errs.slug = "Slug is required"
    setFieldErrors(errs)
    if (Object.keys(errs).length > 0) return
    setSubmitting(true)
    try {
      if (editingPermission) {
        await permissionsApi.update(editingPermission.id, {
          name: form.name,
          slug: form.slug,
          module: form.module || undefined,
        })
      } else {
        await permissionsApi.create({
          name: form.name,
          slug: form.slug,
          module: form.module || undefined,
        })
      }
      resetForm()
      fetchPermissions()
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
        <Link
          href="/users"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          <ArrowLeft className="size-4" />
          Back to Users
        </Link>
      </div>
      <div>
        <h1 className="text-lg font-semibold tracking-tight sm:text-xl">Permissions</h1>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">Manage system permissions for role assignment</p>
      </div>

      {error && !dialogOpen && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-center justify-between">
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={() => setError("")}>Dismiss</Button>
        </div>
      )}

      <DataTableCard
        searchPlaceholder="Search by Name, Slug..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={
          <Select value={moduleFilter} onValueChange={(value) => setModuleFilter(value || "all")}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Module" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modules</SelectItem>
              {uniqueModules.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        onClearFilters={() => { setSearch(""); setModuleFilter("all"); setPage(1); }}
        selectedCount={selected.length}
        totalCount={permissions.length}
        pagination={{
          page,
          totalPages,
          totalEntries: permissions.length,
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
            Add Permission
          </Button>
        }
      >
        {loading ? (
          <div className="py-12 text-center text-muted-foreground">Loading...</div>
        ) : permissions.length === 0 ? (
          <EmptyState
            title="No permissions yet"
            description="Define granular permissions for your system. Create permissions and assign them to roles to control access."
            action={
              <Button size="sm" onClick={handleAdd}>
                <Plus className="mr-2 size-4" />
                Add Permission
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
                    checked={paginatedPermissions.length > 0 && paginatedPermissions.every((p) => selected.includes(p.id))}
                    onCheckedChange={(c) =>
                      setSelected(c ? [...new Set([...selected, ...paginatedPermissions.map((p) => p.id)])] : selected.filter((id) => !paginatedPermissions.some((p) => p.id === id)))
                    }
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Module</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPermissions.map((perm) => (
                <TableRow key={perm.id}>
                  <TableCell>
                    <Checkbox
                      checked={selected.includes(perm.id)}
                      onCheckedChange={() =>
                        setSelected((prev) =>
                          prev.includes(perm.id)
                            ? prev.filter((x) => x !== perm.id)
                            : [...prev, perm.id]
                        )
                      }
                    />
                  </TableCell>
                  <TableCell className="font-medium">{perm.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {perm.slug}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {perm.module || "—"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(perm)}>
                          <Pencil className="mr-2 size-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(perm)}
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

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPermission ? "Edit Permission" : "Add Permission"}</DialogTitle>
            <DialogDescription>
              {editingPermission ? "Update permission details" : "Create a new permission"}
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
                onChange={(e) => {
                  setForm((p) => ({
                    ...p,
                    name: e.target.value,
                    slug: editingPermission ? p.slug : e.target.value.toLowerCase().replace(/\s+/g, "-"),
                  }))
                }}
              />
              {fieldErrors.name && <p className="text-xs text-destructive">{fieldErrors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug <RequiredStar /></Label>
              <Input
                id="slug"
                value={form.slug}
                onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                placeholder="e.g. leads.view"
              />
              {fieldErrors.slug && <p className="text-xs text-destructive">{fieldErrors.slug}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="module">Module</Label>
              <Input
                id="module"
                value={form.module}
                onChange={(e) => setForm((p) => ({ ...p, module: e.target.value }))}
                placeholder="e.g. Leads, Users"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : editingPermission ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteSuccessModal open={deleteSuccessOpen} onOpenChange={setDeleteSuccessOpen} />
    </div>
  )
}
