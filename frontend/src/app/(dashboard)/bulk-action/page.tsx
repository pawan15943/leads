"use client"

import { useState } from "react"
import { Search, RotateCcw, Layers, UserPlus, TrendingUp, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

// Mock data - document fields only: Library Name, Owner, Contact, Seats, Branches, Interested For, Subscription Type, Demo Type
const mockLeads = [
  { id: 1, libraryName: "ABC Library", ownerName: "John Doe", contactNumber: "+91 98765 43210", totalSeats: 50, noOfBranches: 2, interestedFor: "Library Software", subscriptionType: "Annual", demoType: "Online", stage: "New", source: "Website", assignedTo: "BD User 1", tags: ["Hot"], updated: "2/24/2026", created: "2/16/2026" },
  { id: 2, libraryName: "XYZ Academy", ownerName: "Jane Smith", contactNumber: "+91 98765 43211", totalSeats: 120, noOfBranches: 3, interestedFor: "Catalog Management", subscriptionType: "Monthly", demoType: "In-person", stage: "Contacted", source: "Referral", assignedTo: "BD User 2", tags: [], updated: "2/24/2026", created: "2/20/2026" },
  { id: 3, libraryName: "City Central Library", ownerName: "Raj Kumar", contactNumber: "+91 98765 43212", totalSeats: 80, noOfBranches: 1, interestedFor: "Library Software", subscriptionType: "Annual", demoType: "Online", stage: "New", source: "Website", assignedTo: "-", tags: [], updated: "2/23/2026", created: "2/22/2026" },
]

const filters = ["Source", "Stage", "Tags"]

export default function BulkActionPage() {
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<number[]>([])
  const [perPage, setPerPage] = useState("25")

  const toggleSelect = (id: number) => {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  }
  const toggleSelectAll = () => {
    setSelected(selected.length === mockLeads.length ? [] : mockLeads.map((l) => l.id))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Layers className="size-6" />
        </div>
        <div>
          <h1 className="text-lg font-semibold sm:text-xl">Bulk Action</h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Select leads and perform bulk updates: Re-assign to BD, Change Stage, Update Tags.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-72">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by library, owner, contact"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            {filters.map((f) => (
              <Select key={f}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder={f} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                </SelectContent>
              </Select>
            ))}
            <Button variant="outline" size="sm">
              <RotateCcw className="mr-1 size-4" />
              Reset filter
            </Button>
          </div>
          <Select value={perPage} onValueChange={(v) => v && setPerPage(v)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 per page</SelectItem>
              <SelectItem value="25">25 per page</SelectItem>
              <SelectItem value="50">50 per page</SelectItem>
              <SelectItem value="100">100 per page</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selected.length === mockLeads.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-16">#</TableHead>
                <TableHead>Library Name</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Seats</TableHead>
                <TableHead>Branches</TableHead>
                <TableHead>Interested For</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Assigned BD</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockLeads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>
                    <Checkbox
                      checked={selected.includes(lead.id)}
                      onCheckedChange={() => toggleSelect(lead.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{lead.id}</TableCell>
                  <TableCell className="font-medium">{lead.libraryName}</TableCell>
                  <TableCell>{lead.ownerName}</TableCell>
                  <TableCell>{lead.contactNumber}</TableCell>
                  <TableCell>{lead.totalSeats}</TableCell>
                  <TableCell>{lead.noOfBranches}</TableCell>
                  <TableCell>{lead.interestedFor}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{lead.stage}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">{lead.source}</Badge>
                  </TableCell>
                  <TableCell>{lead.assignedTo}</TableCell>
                  <TableCell>{lead.tags.length ? lead.tags.join(", ") : "-"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{lead.updated}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{lead.created}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {selected.length > 0 && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
              <span className="text-sm font-medium">{selected.length} selected</span>
              <Button size="sm">
                <UserPlus className="mr-1.5 size-4" />
                Re-assign to BD
              </Button>
              <Button size="sm" variant="outline">
                <TrendingUp className="mr-1.5 size-4" />
                Change Stage
              </Button>
              <Button size="sm" variant="outline">
                <Tag className="mr-1.5 size-4" />
                Update Tags
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
