"use client"

import { ReactNode, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Search, Filter } from "lucide-react"

type DataTableCardProps = {
  /** Search input - shown when provided */
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  /** Filter dropdowns and controls */
  filters?: ReactNode
  /** Clear filters callback - shows Clear Filters button when provided */
  onClearFilters?: () => void
  /** Header actions (e.g. Add button) */
  headerActions?: ReactNode
  /** Bulk actions - shown when selectedCount > 0 */
  selectedCount?: number
  totalCount?: number
  bulkActions?: ReactNode
  /** Pagination - footer shows "Showing X to Y of Z entries" + page controls */
  pagination?: {
    page: number
    totalPages: number
    totalEntries: number
    pageSize?: number
    onPrevious: () => void
    onNext: () => void
  }
  /** Optional tabs above table */
  tabs?: ReactNode
  /** On mobile, show filter icon that toggles filter panel */
  collapseFiltersOnMobile?: boolean
  children: ReactNode
}

export function DataTableCard({
  searchPlaceholder,
  searchValue = "",
  onSearchChange,
  filters,
  onClearFilters,
  headerActions,
  selectedCount = 0,
  totalCount = 0,
  bulkActions,
  pagination,
  tabs,
  collapseFiltersOnMobile = false,
  children,
}: DataTableCardProps) {
  const [filterOpen, setFilterOpen] = useState(false)
  const hasSearch = searchPlaceholder != null
  const hasFilters = filters != null || hasSearch
  const pageSize = pagination?.pageSize ?? 10
  const startEntry = pagination && pagination.totalEntries > 0
    ? (pagination.page - 1) * pageSize + 1
    : 0
  const endEntry = pagination
    ? Math.min(pagination.page * pageSize, pagination.totalEntries)
    : totalCount

  return (
    <Card className="overflow-hidden py-0">
      <CardContent className="p-0">
        {/* Search + Filters bar */}
        {(hasSearch || filters || headerActions || onClearFilters) && (
          <div className="border-b px-3 py-2 sm:px-3 sm:py-2">
            <div className="flex flex-wrap items-center gap-3">
              {hasSearch && (
                <div className="relative w-full min-w-0 flex-1 sm:min-w-[180px] sm:max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder={searchPlaceholder}
                    value={searchValue}
                    onChange={(e) => onSearchChange?.(e.target.value)}
                    className="pl-9 h-10"
                  />
                </div>
              )}
              {filters && !collapseFiltersOnMobile && (
                <div className="flex flex-wrap items-center gap-2">
                  <Filter className="size-4 text-muted-foreground shrink-0" />
                  {filters}
                </div>
              )}
              {collapseFiltersOnMobile && (
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 shrink-0 md:hidden"
                  onClick={() => setFilterOpen((o) => !o)}
                  aria-expanded={filterOpen}
                  aria-label="Toggle filters"
                >
                  <Filter className="size-4 text-muted-foreground" />
                </Button>
              )}
              {filters && collapseFiltersOnMobile && (
                <div className="hidden flex-wrap items-center gap-2 md:flex">
                  <Filter className="size-4 text-muted-foreground shrink-0" />
                  {filters}
                </div>
              )}
              {onClearFilters && !collapseFiltersOnMobile && (
                <Button variant="ghost" size="sm" onClick={onClearFilters}>
                  Clear Filters
                </Button>
              )}
              {onClearFilters && collapseFiltersOnMobile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearFilters}
                  className="hidden md:inline-flex"
                >
                  Clear Filters
                </Button>
              )}
              <div className="ml-auto flex items-center gap-2">{headerActions}</div>
            </div>
            {/* Mobile filter panel - shown when filter icon clicked */}
            {collapseFiltersOnMobile && filterOpen && filters && (
              <div className="mt-3 space-y-2 rounded-lg border bg-muted/30 p-3 md:hidden">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Filter className="size-4 text-muted-foreground" />
                    Filters
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => setFilterOpen(false)}>
                    Close
                  </Button>
                </div>
                <div className="flex flex-col gap-3 [&>*]:w-full [&_button]:w-full">{filters}</div>
                {onClearFilters && (
                  <Button variant="outline" size="sm" className="w-full" onClick={() => { onClearFilters(); setFilterOpen(false); }}>
                    Clear Filters
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        {tabs}

        {/* Table - header row gets light grey background */}
        <div className="min-w-0 overflow-x-auto [&_thead_tr]:bg-muted/50">{children}</div>

        {/* Footer: Showing X to Y of Z entries + Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t px-3 py-2 text-xs text-muted-foreground sm:px-3 sm:text-sm">
          <div className="flex items-center gap-3">
            {selectedCount > 0 && (
              <>
                <span>{selectedCount} of {totalCount} row(s) selected.</span>
                {bulkActions}
              </>
            )}
            {selectedCount === 0 && pagination && (
              <span>
                {pagination.totalEntries === 0
                  ? "No entries"
                  : `Showing ${startEntry} to ${endEntry} of ${pagination.totalEntries} entries`}
              </span>
            )}
            {selectedCount === 0 && !pagination && totalCount > 0 && (
              <span>Showing {totalCount} entries</span>
            )}
          </div>
          {pagination && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={pagination.page <= 1}
                onClick={pagination.onPrevious}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="min-w-[100px] text-center">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={pagination.page >= pagination.totalPages}
                onClick={pagination.onNext}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
