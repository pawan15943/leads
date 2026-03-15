"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type TableSkeletonProps = {
  rows?: number
  cols?: number
  /** Show mobile card skeletons instead of table */
  mobileCards?: boolean
}

export function TableSkeleton({ rows = 5, cols = 6, mobileCards = false }: TableSkeletonProps) {
  if (mobileCards) {
    return (
      <div className="space-y-1.5 p-3 md:hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-3">
            <div className="flex gap-2">
              <div className="h-4 w-16 animate-pulse rounded bg-muted" />
              <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
            </div>
            <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-muted" />
            <div className="mt-2 flex gap-2">
              <div className="h-8 w-20 animate-pulse rounded bg-muted" />
              <div className="h-8 w-16 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {Array.from({ length: cols }).map((_, i) => (
            <TableHead key={i}>
              <div className="h-4 w-20 animate-pulse rounded bg-muted" />
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <TableRow key={rowIdx}>
            {Array.from({ length: cols }).map((_, colIdx) => (
              <TableCell key={colIdx}>
                <div
                  className="h-4 animate-pulse rounded bg-muted"
                  style={{ width: colIdx === 0 ? "80%" : colIdx === cols - 1 ? "40px" : "60%" }}
                />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
