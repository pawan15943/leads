"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { CreateTaskSheet } from "@/components/leads/CreateTaskSheet"
import { MoreHorizontal, User, Phone, Calendar, Plus, Loader2 } from "lucide-react"
import { tasksApi, type ApiTask } from "@/lib/api"
import { toast } from "sonner"

const STATUS_OPTIONS = ["All", "Open (Overdue + Not Overdue)", "Overdue", "Not Overdue", "Completed"]
const ASSIGNED_OPTIONS = ["All", "Assigned To"]

function getStatusBadge(task: ApiTask): string {
  if (task.status === "completed") return "completed"
  const due = task.due_date ? new Date(task.due_date) : null
  if (due && due.getTime() < Date.now()) return "overdue"
  return "pending"
}

function formatDueDate(dateStr: string | null) {
  if (!dateStr) return "-"
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    })
  } catch {
    return dateStr
  }
}

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState<"today" | "all">("all")
  const [statusFilter, setStatusFilter] = useState("Open (Overdue + Not Overdue)")
  const [typeFilter, setTypeFilter] = useState("All")
  const [assignedFilter, setAssignedFilter] = useState("All")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [tasks, setTasks] = useState<ApiTask[]>([])
  const [loading, setLoading] = useState(true)
  const [totalPages, setTotalPages] = useState(1)
  const [totalEntries, setTotalEntries] = useState(0)
  const [createTaskOpen, setCreateTaskOpen] = useState(false)
  const PAGE_SIZE = 10

  const apiStatus = (): string | undefined => {
    if (statusFilter === "All") return undefined
    if (statusFilter === "Open (Overdue + Not Overdue)") return "open"
    if (statusFilter === "Overdue") return "overdue"
    if (statusFilter === "Not Overdue") return "not_overdue"
    if (statusFilter === "Completed") return "completed"
    return undefined
  }

  const fetchTasks = useCallback(() => {
    setLoading(true)
    const params: { search?: string; status?: string; task_type?: string; per_page?: number; page?: number } = {
      per_page: PAGE_SIZE,
      page,
    }
    if (search.trim()) params.search = search.trim()
    if (typeFilter !== "All") params.task_type = typeFilter
    const status = apiStatus()
    if (activeTab === "today") {
      params.status = "today"
    } else if (status) {
      params.status = status
    }
    tasksApi
      .list(params)
      .then((res: { data: ApiTask[]; total: number; current_page: number; last_page: number }) => {
        setTasks(res.data || [])
        setTotalPages(res.last_page || 1)
        setTotalEntries(res.total || 0)
      })
      .catch(() => {
        setTasks([])
        setTotalPages(1)
        setTotalEntries(0)
      })
      .finally(() => setLoading(false))
  }, [activeTab, statusFilter, typeFilter, search, page])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const filteredTasks = tasks.filter((t) => {
    if (assignedFilter !== "All" && assignedFilter !== "Assigned To" && t.assignedTo?.name !== assignedFilter) return false
    return true
  })

  const handleMarkComplete = async (taskId: number) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: "completed" as const } : t)))
    try {
      await tasksApi.update(taskId, { status: "completed" })
      toast.success("Task marked complete")
      fetchTasks()
    } catch {
      toast.error("Failed to update task")
      fetchTasks()
    }
  }

  const clearFilters = () => {
    setSearch("")
    setStatusFilter("Open (Overdue + Not Overdue)")
    setTypeFilter("All")
    setAssignedFilter("All")
    setPage(1)
  }

  return (
    <div className="min-w-0 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold sm:text-xl">Tasks</h1>
          <p className="text-xs text-muted-foreground sm:text-sm">Manage and track all your tasks</p>
        </div>
        <Button onClick={() => setCreateTaskOpen(true)} size="sm" className="shrink-0">
          <Plus className="mr-2 size-4" />
          Create Task
        </Button>
      </div>

      <DataTableCard
        searchPlaceholder="Search by Task Name, Contact, Title"
        searchValue={search}
        onSearchChange={setSearch}
        filters={
          <>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full min-w-0 md:w-[200px]">
                <span className="shrink-0 text-muted-foreground">Status:</span>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full min-w-0 md:w-[140px]">
                <span className="shrink-0 text-muted-foreground">Type:</span>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="Call">Call</SelectItem>
                <SelectItem value="Email">Email</SelectItem>
                <SelectItem value="Meeting">Meeting</SelectItem>
              </SelectContent>
            </Select>
            <Select value={assignedFilter} onValueChange={setAssignedFilter}>
              <SelectTrigger className="w-full min-w-0 md:w-[180px]">
                <span className="shrink-0 text-muted-foreground">Assigned:</span>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                {ASSIGNED_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
        onClearFilters={clearFilters}
        collapseFiltersOnMobile
        totalCount={totalEntries}
        pagination={{
          page,
          totalPages,
          totalEntries,
          pageSize: PAGE_SIZE,
          onPrevious: () => setPage((p) => Math.max(1, p - 1)),
          onNext: () => setPage((p) => Math.min(totalPages, p + 1)),
        }}
        tabs={
          <div className="no-scrollbar flex overflow-x-auto border-b">
            <button
              type="button"
              onClick={() => { setActiveTab("today"); setPage(1) }}
              className={`shrink-0 px-2.5 py-2 text-sm font-medium transition-colors sm:px-3 ${
                activeTab === "today"
                  ? "border-b-2 border-primary text-foreground bg-background"
                  : "text-muted-foreground hover:text-foreground bg-muted/30"
              }`}
            >
              Today&apos;s Tasks
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab("all"); setPage(1) }}
              className={`shrink-0 px-2.5 py-2 text-sm font-medium transition-colors sm:px-3 ${
                activeTab === "all"
                  ? "border-b-2 border-primary text-foreground bg-background"
                  : "text-muted-foreground hover:text-foreground bg-muted/30"
              }`}
            >
              All Tasks
            </button>
          </div>
        }
      >
        {loading ? (
          <>
            <div className="md:hidden">
              <TableSkeleton rows={5} cols={4} mobileCards />
            </div>
            <div className="hidden md:block">
              <TableSkeleton rows={8} cols={7} />
            </div>
          </>
        ) : filteredTasks.length === 0 ? (
          <EmptyState
            title="No tasks yet"
            description="Tasks are created when you add leads or schedule follow-ups. Create a task to stay on top of your pipeline."
            action={
              <Button size="sm" onClick={() => setCreateTaskOpen(true)}>
                <Plus className="mr-2 size-4" />
                Create Task
              </Button>
            }
            illustration="default"
          />
        ) : (
        <>
        {/* Mobile: Card list */}
        <div className="space-y-1.5 p-3 md:hidden">
          {filteredTasks.map((task) => {
            const status = getStatusBadge(task)
            return (
              <div
                key={task.id}
                className="flex flex-col gap-2 rounded-lg border bg-card p-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <Badge variant={status === "overdue" ? "destructive" : "secondary"} className="text-xs">
                      {status}
                    </Badge>
                    <p className="mt-1 truncate font-semibold text-foreground">{task.title}</p>
                    <p className="text-xs text-muted-foreground">{task.lead?.library_name || "—"}</p>
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-1">
                    <Phone className="size-3.5 text-muted-foreground" />
                    {task.task_type || "Call"}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="size-3 text-muted-foreground" />
                    {formatDueDate(task.due_date)}
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium">
                    <User className="size-3 text-muted-foreground" />
                    {task.assignedTo?.name || "—"}
                  </div>
                  {task.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full">
                      <MoreHorizontal className="mr-2 size-4" />
                      Actions
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-full">
                    <DropdownMenuItem
                      disabled={task.status === "completed"}
                      onClick={() => handleMarkComplete(task.id)}
                    >
                      Mark Complete
                    </DropdownMenuItem>
                    {task.lead_id && (
                      <DropdownMenuItem asChild>
                        <a href={`/leads/${task.lead_id}`}>View Lead</a>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )
          })}
        </div>

        {/* Desktop: Table */}
        <Table className="hidden md:table">
          <TableHeader>
            <TableRow>
              <TableHead>Lead Name</TableHead>
              <TableHead>Task Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
              {filteredTasks.map((task) => {
                const status = getStatusBadge(task)
                return (
              <TableRow key={task.id}>
                <TableCell>
                  <div className="font-medium">{task.lead?.library_name || "—"}</div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{task.title}</div>
                    {task.description && (
                      <div className="text-xs text-muted-foreground line-clamp-2">{task.description}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{task.task_type || "Call"}</TableCell>
                <TableCell>{formatDueDate(task.due_date)}</TableCell>
                <TableCell>
                  <Badge variant={status === "overdue" ? "destructive" : "secondary"}>
                    {status}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">{task.assignedTo?.name || "—"}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        disabled={task.status === "completed"}
                        onClick={() => handleMarkComplete(task.id)}
                      >
                        Mark Complete
                      </DropdownMenuItem>
                      {task.lead_id && (
                        <DropdownMenuItem asChild>
                          <a href={`/leads/${task.lead_id}`}>View Lead</a>
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
                )
              })}
          </TableBody>
        </Table>
        </>
        )}
      </DataTableCard>

      <CreateTaskSheet
        open={createTaskOpen}
        onOpenChange={setCreateTaskOpen}
        lead={null}
        onSuccess={fetchTasks}
      />
    </div>
  )
}
