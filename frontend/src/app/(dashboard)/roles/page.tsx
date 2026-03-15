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
import { rolesApi, listsApi, type Role, type CreateRoleInput } from "@/lib/api"
import { RequiredStar } from "@/components/ui/required-star"
import { DeleteSuccessModal } from "@/components/ui/delete-success-modal"


export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<{ id: number; name: string; slug: string; module: string | null }[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [slugFilter, setSlugFilter] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [selected, setSelected] = useState<number[]>([])
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 10
  const [form, setForm] = useState<CreateRoleInput & { permission_ids: number[] }>({
    name: "",
    slug: "",
    description: "",
    permission_ids: [],
  })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [deleteSuccessOpen, setDeleteSuccessOpen] = useState(false)

  const fetchRoles = async () => {
    try {
      setLoading(true)
      const res = await rolesApi.list({ search: search || undefined })
      setRoles(res.data)
    } catch {
      setRoles([])
    } finally {
      setLoading(false)
    }
  }

  const fetchPermissions = async () => {
    try {
      const list = await listsApi.permissions()
      setPermissions(list)
    } catch {
      setPermissions([])
    }
  }

  useEffect(() => {
    fetchRoles()
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [search, slugFilter])

  useEffect(() => {
    fetchPermissions()
  }, [])

  const resetForm = () => {
    setForm({ name: "", slug: "", description: "", permission_ids: [] })
    setEditingRole(null)
    setError("")
    setFieldErrors({})
    setDialogOpen(false)
  }

  const handleAdd = () => {
    resetForm()
    setDialogOpen(true)
  }

  const handleEdit = async (role: Role) => {
    try {
      const full = await rolesApi.get(role.id)
      setEditingRole(full)
      setForm({
        name: full.name,
        slug: full.slug,
        description: full.description || "",
        permission_ids: full.permissions?.map((p) => p.id) ?? [],
      })
      setError("")
      setDialogOpen(true)
    } catch {
      setError("Failed to load role")
    }
  }

  const filteredRoles = slugFilter === "all" ? roles : roles.filter((r) => r.slug === slugFilter)
  const totalPages = Math.max(1, Math.ceil(filteredRoles.length / PAGE_SIZE))
  const paginatedRoles = filteredRoles.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selected.length} selected role(s)?`)) return
    try {
      for (const id of selected) await rolesApi.delete(id)
      setSelected([])
      fetchRoles()
      setDeleteSuccessOpen(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot delete role with assigned users")
    }
  }

  const handleBulkEdit = () => {
    alert(`Bulk edit ${selected.length} roles - connect to API`)
  }

  const handleDelete = async (role: Role) => {
    if (!confirm(`Delete role "${role.name}"?`)) return
    try {
      await rolesApi.delete(role.id)
      fetchRoles()
      setDeleteSuccessOpen(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot delete role with assigned users")
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
      if (editingRole) {
        await rolesApi.update(editingRole.id, {
          name: form.name,
          slug: form.slug,
          description: form.description || undefined,
          permission_ids: form.permission_ids,
        })
      } else {
        await rolesApi.create({
          name: form.name,
          slug: form.slug,
          description: form.description || undefined,
          permission_ids: form.permission_ids,
        })
      }
      resetForm()
      fetchRoles()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operation failed")
      setFieldErrors({})
    } finally {
      setSubmitting(false)
    }
  }

  const togglePermission = (id: number) => {
    setForm((p) => ({
      ...p,
      permission_ids: p.permission_ids.includes(id)
        ? p.permission_ids.filter((x) => x !== id)
        : [...p.permission_ids, id],
    }))
  }

  const permissionsByModule = permissions.reduce<Record<string, typeof permissions>>((acc, p) => {
    const m = p.module || "Other"
    if (!acc[m]) acc[m] = []
    acc[m].push(p)
    return acc
  }, {})

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
        <h1 className="text-lg font-semibold tracking-tight sm:text-xl">Roles</h1>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">Manage roles and assign permissions</p>
      </div>

      {error && !dialogOpen && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-center justify-between">
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={() => setError("")}>Dismiss</Button>
        </div>
      )}

      <DataTableCard
        searchPlaceholder="Search roles..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={
          <Select value={slugFilter} onValueChange={(v) => setSlugFilter(v ?? "all")}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {roles.map((r) => (
                <SelectItem key={r.id} value={r.slug}>{r.slug}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        onClearFilters={() => { setSearch(""); setSlugFilter("all"); setPage(1); }}
        selectedCount={selected.length}
        totalCount={filteredRoles.length}
        pagination={{
          page,
          totalPages,
          totalEntries: filteredRoles.length,
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
            Add Role
          </Button>
        }
      >
        {loading ? (
          <div className="py-12 text-center text-muted-foreground">Loading...</div>
        ) : filteredRoles.length === 0 ? (
          <EmptyState
            title="No roles yet"
            description="Create roles to organize permissions and assign them to users. Define what each role can access in your system."
            action={
              <Button size="sm" onClick={handleAdd}>
                <Plus className="mr-2 size-4" />
                Add Role
              </Button>
            }
            illustration="users"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={paginatedRoles.length > 0 && paginatedRoles.every((r) => selected.includes(r.id))}
                    onCheckedChange={(c) =>
                      setSelected(c ? [...new Set([...selected, ...paginatedRoles.map((r) => r.id)])] : selected.filter((id) => !paginatedRoles.some((r) => r.id === id)))
                    }
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Users</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRoles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>
                    <Checkbox
                      checked={selected.includes(role.id)}
                      onCheckedChange={() =>
                        setSelected((prev) =>
                          prev.includes(role.id)
                            ? prev.filter((x) => x !== role.id)
                            : [...prev, role.id]
                        )
                      }
                    />
                  </TableCell>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {role.slug}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">
                    {role.description || "—"}
                  </TableCell>
                  <TableCell>{role.users_count ?? 0}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(role)}>
                          <Pencil className="mr-2 size-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(role)}
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingRole ? "Edit Role" : "Add Role"}</DialogTitle>
            <DialogDescription>
              {editingRole ? "Update role and permissions" : "Create a new role"}
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
                    slug: editingRole ? p.slug : e.target.value.toLowerCase().replace(/\s+/g, "-"),
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
                placeholder="e.g. bd-user"
              />
              {fieldErrors.slug && <p className="text-xs text-destructive">{fieldErrors.slug}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="max-h-48 overflow-y-auto rounded-lg border p-3 space-y-3">
                {Object.entries(permissionsByModule).map(([module, perms]) => (
                  <div key={module}>
                    <p className="text-xs font-medium text-muted-foreground mb-2">{module}</p>
                    <div className="flex flex-wrap gap-2">
                      {perms.map((p) => (
                        <label
                          key={p.id}
                          className="flex items-center gap-2 rounded-md border px-2 py-1.5 text-sm cursor-pointer hover:bg-muted/50"
                        >
                          <Checkbox
                            checked={form.permission_ids.includes(p.id)}
                            onCheckedChange={() => togglePermission(p.id)}
                          />
                          {p.name}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                {permissions.length === 0 && (
                  <p className="text-sm text-muted-foreground">No permissions. Create some first.</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : editingRole ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteSuccessModal open={deleteSuccessOpen} onOpenChange={setDeleteSuccessOpen} />
    </div>
  )
}
