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
import { RequiredStar } from "@/components/ui/required-star"
import { DeleteSuccessModal } from "@/components/ui/delete-success-modal"
import { Plus, Pencil, Trash2, MoreHorizontal, Shield, Key } from "lucide-react"
import { usersApi, listsApi, type User, type CreateUserInput } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"


export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<{ id: number; name: string; slug: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [deleteSuccessOpen, setDeleteSuccessOpen] = useState(false)
  const [selected, setSelected] = useState<number[]>([])
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 10
  const [form, setForm] = useState<CreateUserInput & { password_confirmation?: string }>({
    name: "",
    email: "",
    phone: "",
    password: "",
    password_confirmation: "",
    role_id: null,
    status: "active",
  })

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await usersApi.list({
        search: search || undefined,
        role_id: roleFilter !== "all" ? Number(roleFilter) : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      })
      setUsers(res.data)
    } catch (err) {
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const fetchRoles = async () => {
    try {
      const list = await listsApi.roles()
      setRoles(list)
    } catch {
      setRoles([])
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [search, roleFilter, statusFilter])

  useEffect(() => {
    setPage(1)
  }, [search, roleFilter, statusFilter])

  useEffect(() => {
    fetchRoles()
  }, [])

  const resetForm = () => {
    setForm({
      name: "",
      email: "",
      phone: "",
      password: "",
      password_confirmation: "",
      role_id: null,
      status: "active",
    })
    setEditingUser(null)
    setError("")
    setFieldErrors({})
    setDialogOpen(false)
  }

  const handleAdd = () => {
    resetForm()
    setDialogOpen(true)
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      password: "",
      password_confirmation: "",
      role_id: user.role_id,
      status: user.status,
    })
    setError("")
    setFieldErrors({})
    setDialogOpen(true)
  }

  const handleDelete = async (user: User) => {
    if (user.id === currentUser?.id) {
      setError("Cannot delete your own account")
      return
    }
    if (!confirm(`Delete user "${user.name}"?`)) return
    try {
      await usersApi.delete(user.id)
      fetchUsers()
      setDeleteSuccessOpen(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete")
    }
  }

  const handleBulkDelete = async () => {
    const toDelete = selected.filter((id) => id !== currentUser?.id)
    if (toDelete.length === 0) {
      setError("Cannot delete your own account")
      return
    }
    if (!confirm(`Delete ${selected.length} selected user(s)?`)) return
    try {
      for (const id of toDelete) await usersApi.delete(id)
      setSelected([])
      fetchUsers()
      setDeleteSuccessOpen(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete")
    }
  }

  const handleBulkEdit = () => {
    alert(`Bulk edit ${selected.length} users - connect to API`)
  }

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {}
    if (!form.name?.trim()) errs.name = "Name is required"
    if (!form.email?.trim()) errs.email = "Email is required"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Enter a valid email"
    if (!editingUser) {
      if (!form.password) errs.password = "Password is required"
      else if (form.password !== form.password_confirmation) errs.password_confirmation = "Passwords must match"
    } else if (form.password && form.password !== form.password_confirmation) {
      errs.password_confirmation = "Passwords must match"
    }
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setFieldErrors({})
    if (!validateForm()) return
    setSubmitting(true)
    try {
      if (editingUser) {
        const payload: Record<string, unknown> = {
          name: form.name,
          email: form.email,
          phone: form.phone || null,
          role_id: form.role_id,
          status: form.status,
        }
        if (form.password) {
          payload.password = form.password
          payload.password_confirmation = form.password_confirmation ?? ""
        }
        await usersApi.update(editingUser.id, payload)
      } else {
        await usersApi.create({
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          password: form.password,
          password_confirmation: form.password_confirmation!,
          role_id: form.role_id ?? undefined,
          status: form.status,
        })
      }
      resetForm()
      fetchUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operation failed")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight sm:text-xl">Users</h1>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">Manage user accounts and access</p>
      </div>

      {!dialogOpen && error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive flex justify-between items-center">
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} className="underline">Dismiss</button>
        </div>
      )}

      <DataTableCard
        searchPlaceholder="Search by Name, Email..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={
          <>
            <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v ?? "all")}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {roles.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
        onClearFilters={() => { setSearch(""); setRoleFilter("all"); setStatusFilter("all"); setPage(1); }}
        selectedCount={selected.length}
        totalCount={users.length}
        pagination={{
          page,
          totalPages: Math.max(1, Math.ceil(users.length / PAGE_SIZE)),
          totalEntries: users.length,
          pageSize: PAGE_SIZE,
          onPrevious: () => setPage((p) => Math.max(1, p - 1)),
          onNext: () => setPage((p) => Math.min(Math.max(1, Math.ceil(users.length / PAGE_SIZE)), p + 1)),
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
          <div className="flex items-center gap-2">
            <Link href="/roles">
              <Button variant="outline" size="sm">
                <Shield className="mr-2 size-4" />
                Roles
              </Button>
            </Link>
            <Link href="/permissions">
              <Button variant="outline" size="sm">
                <Key className="mr-2 size-4" />
                Permissions
              </Button>
            </Link>
            <Button onClick={handleAdd} size="sm">
              <Plus className="mr-2 size-4" />
              Add User
            </Button>
          </div>
        }
      >
        {loading ? (
          <div className="py-12 text-center text-muted-foreground">Loading...</div>
        ) : users.length === 0 ? (
          <EmptyState
            title="No users yet"
            description="Create user accounts to give your team access to the system. Assign roles and permissions to control what each user can do."
            action={
              <Button size="sm" onClick={handleAdd}>
                <Plus className="mr-2 size-4" />
                Add User
              </Button>
            }
            illustration="users"
          />
        ) : (
          (() => {
            const paginatedUsers = users.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
            return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={paginatedUsers.length > 0 && paginatedUsers.every((u) => selected.includes(u.id))}
                    onCheckedChange={(c) =>
                      setSelected(c ? [...new Set([...selected, ...paginatedUsers.map((u) => u.id)])] : selected.filter((id) => !paginatedUsers.some((u) => u.id === id)))
                    }
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Checkbox
                      checked={selected.includes(user.id)}
                      onCheckedChange={() =>
                        setSelected((prev) =>
                          prev.includes(user.id)
                            ? prev.filter((x) => x !== user.id)
                            : [...prev, user.id]
                        )
                      }
                    />
                  </TableCell>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.phone || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal">
                      {user.role?.name ?? "—"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.status === "active" ? "default" : "outline"}>
                      {user.status}
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
                        <DropdownMenuItem onClick={() => handleEdit(user)}>
                          <Pencil className="mr-2 size-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(user)}
                          disabled={user.id === currentUser?.id}
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
            )
          })()
        )}
      </DataTableCard>

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Edit User" : "Add User"}</DialogTitle>
            <DialogDescription>
              {editingUser ? "Update user details" : "Create a new user account"}
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
                onChange={(e) => { setForm((p) => ({ ...p, name: e.target.value })); setFieldErrors((e) => ({ ...e, name: "" })) }}
              />
              {fieldErrors.name && <p className="text-xs text-destructive">{fieldErrors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email <RequiredStar /></Label>
              <Input
                id="email"
                value={form.email}
                onChange={(e) => { setForm((p) => ({ ...p, email: e.target.value })); setFieldErrors((e) => ({ ...e, email: "" })) }}
                disabled={!!editingUser}
              />
              {editingUser && <p className="text-xs text-muted-foreground">Email cannot be changed</p>}
              {fieldErrors.email && <p className="text-xs text-destructive">{fieldErrors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                Password {!editingUser && <RequiredStar />} {editingUser && "(leave blank to keep)"}
              </Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => { setForm((p) => ({ ...p, password: e.target.value })); setFieldErrors((e) => ({ ...e, password: "", password_confirmation: "" })) }}
                placeholder={editingUser ? "••••••••" : undefined}
              />
              {fieldErrors.password && <p className="text-xs text-destructive">{fieldErrors.password}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password_confirmation">
                Confirm Password {!editingUser && <RequiredStar />} {editingUser && "(leave blank to keep)"}
              </Label>
              <Input
                id="password_confirmation"
                type="password"
                value={form.password_confirmation}
                onChange={(e) => { setForm((p) => ({ ...p, password_confirmation: e.target.value })); setFieldErrors((e) => ({ ...e, password_confirmation: "" })) }}
                placeholder={editingUser ? "••••••••" : undefined}
              />
              {fieldErrors.password_confirmation && <p className="text-xs text-destructive">{fieldErrors.password_confirmation}</p>}
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={form.role_id ? String(form.role_id) : "none"}
                onValueChange={(v) => setForm((p) => ({ ...p, role_id: v === "none" ? null : Number(v) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No role</SelectItem>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((p) => ({ ...p, status: v || "active" }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : editingUser ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteSuccessModal
        open={deleteSuccessOpen}
        onOpenChange={setDeleteSuccessOpen}
        title="Deleted successfully"
        message="The user has been deleted."
      />
    </div>
  )
}
