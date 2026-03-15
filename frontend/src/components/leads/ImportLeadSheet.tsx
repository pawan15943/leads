"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, XCircle, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { leadsApi } from "@/lib/api"
import { parseApiError } from "@/lib/errors"
import { toast } from "sonner"

const SAMPLE_CSV_URL = "/sample-leads-import.csv"

export type ImportResult = {
  total_records: number
  success_records: number
  failed_records: number
  import_id: number
}

type ImportLeadSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportComplete?: () => void
}

export function ImportLeadSheet({ open, onOpenChange, onImportComplete }: ImportLeadSheetProps) {
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const reset = useCallback(() => {
    setFile(null)
    setResult(null)
    setDragOver(false)
  }, [])

  const handleClose = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) reset()
      onOpenChange(nextOpen)
    },
    [onOpenChange, reset]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const f = e.dataTransfer.files[0]
      if (f && (f.name.endsWith(".csv") || f.type === "text/csv")) {
        setFile(f)
        setResult(null)
      } else {
        toast.error("Please upload a CSV file")
      }
    },
    []
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOver(false)
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      setFile(f)
      setResult(null)
    }
    e.target.value = ""
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!file) return
    setSubmitting(true)
    setResult(null)
    try {
      const res = await leadsApi.import(file)
      const total = res.total_records
      const succeeded = res.success_records
      const failed = res.failed_records
      if (total === 0) {
        toast.info("No valid rows found in the CSV. Check the file format.")
      } else if (failed === 0) {
        toast.success(`Successfully imported ${succeeded} lead(s)`)
        setFile(null)
        onImportComplete?.()
        handleClose(false)
      } else {
        setResult(res)
        toast.warning(`${succeeded} imported, ${failed} failed. Check the result below.`)
        onImportComplete?.()
      }
    } catch (err) {
      const msg = parseApiError(err)
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }, [file, onImportComplete, handleClose])

  const handleDownloadSample = useCallback(() => {
    const a = document.createElement("a")
    a.href = SAMPLE_CSV_URL
    a.download = "sample-leads-import.csv"
    a.click()
  }, [])

  const [isDesktop, setIsDesktop] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)")
    setIsDesktop(mq.matches)
    const h = () => setIsDesktop(mq.matches)
    mq.addEventListener("change", h)
    return () => mq.removeEventListener("change", h)
  }, [])

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        className={cn(
          "overflow-hidden flex flex-col p-0 gap-0",
          isDesktop ? "w-full max-w-xl sm:max-w-2xl h-full max-h-none" : "h-[90vh] max-h-[90vh]"
        )}
        showCloseButton
      >
        <div className="flex h-full flex-col overflow-hidden">
          <SheetHeader className="shrink-0 border-b px-6 pb-4 pt-5">
            <SheetTitle className="text-lg font-semibold">Import Leads</SheetTitle>
            <SheetDescription className="text-sm">
              Upload a CSV file with lead data. Use the sample file to see the expected format with all master names.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto overscroll-contain px-6 pb-6">
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Sample File</Label>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleDownloadSample}
                >
                  <Download className="mr-2 size-4" />
                  Download Sample CSV
                </Button>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">CSV File</Label>
                <div
                  className={cn(
                    "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 transition-colors",
                    dragOver ? "border-primary bg-primary/5" : "border-input hover:border-muted-foreground/50",
                    file && "border-primary/50 bg-primary/5"
                  )}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="sr-only"
                    id="import-file-input"
                    onChange={handleFileChange}
                  />
                  {file ? (
                    <>
                      <FileSpreadsheet className="size-10 text-primary" />
                      <p className="text-sm font-medium truncate max-w-full">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setFile(null)}
                        disabled={submitting}
                      >
                        Remove
                      </Button>
                    </>
                  ) : (
                    <>
                      <Upload className="size-10 text-muted-foreground" />
                      <p className="text-sm font-medium">Drop CSV here or click to browse</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Select File
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {result && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Import Result</Label>
                  <div className="rounded-lg border border-input bg-muted/30 p-4">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1.5 text-green-600">
                        <CheckCircle2 className="size-4" />
                        {result.success_records} succeeded
                      </span>
                      <span className="flex items-center gap-1.5 text-destructive">
                        <XCircle className="size-4" />
                        {result.failed_records} failed
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Total: {result.total_records} rows processed
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="shrink-0 border-t bg-background px-6 py-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => handleClose(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={!file || submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 size-4" />
                    Import
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
