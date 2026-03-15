"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RequiredStar } from "@/components/ui/required-star"
import { Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react"

const SAMPLE_COLUMNS = [
  { name: "Library Name", required: false, example: "ABC Library" },
  { name: "Owner", required: false, example: "John Doe" },
  { name: "Contact", required: true, example: "+919876543210" },
  { name: "Alternate Contact", required: false, example: "+919876543211" },
  { name: "Email", required: false, example: "john@example.com" },
  { name: "Seats", required: false, example: "50" },
  { name: "Branches", required: false, example: "2" },
  { name: "Interested For", required: false, example: "Library Software" },
  { name: "Subscription Type", required: false, example: "Annual" },
  { name: "Demo Type", required: false, example: "Online" },
  { name: "Lead Source", required: false, example: "Website" },
  { name: "City ID", required: false, example: "1 (from Master Data → Cities)" },
]

export default function ImportLeadsPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ success: number; failed: number; errors?: string[] } | null>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped && (dropped.name.endsWith(".csv") || dropped.name.endsWith(".xlsx") || dropped.name.endsWith(".xls"))) {
      setFile(dropped)
      setResult(null)
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      setFile(selected)
      setResult(null)
    }
  }

  const handleImport = async () => {
    if (!file) return
    setImporting(true)
    setResult(null)
    try {
      // TODO: Connect to API for actual import
      await new Promise((r) => setTimeout(r, 1500))
      setResult({ success: 3, failed: 0 })
      setFile(null)
    } catch {
      setResult({ success: 0, failed: 1, errors: ["Import failed. Please check your file format."] })
    } finally {
      setImporting(false)
    }
  }

  const handleClose = () => {
    setModalOpen(false)
    setFile(null)
    setResult(null)
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold sm:text-xl">Import Leads</h1>
        <p className="text-xs text-muted-foreground mt-0.5 sm:text-sm">
          Bulk import leads from CSV or Excel. Simple, fast, and error-free.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-muted/30 py-20 px-6">
        <div className="flex size-20 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-6">
          <FileSpreadsheet className="size-10" />
        </div>
        <h2 className="text-base font-semibold mb-1 sm:text-lg">Import your leads in minutes</h2>
        <p className="text-muted-foreground text-center max-w-md mb-8">
          Download our sample file, fill in your lead data, and upload. We&apos;ll validate everything before importing.
        </p>
        <Button size="lg" onClick={() => setModalOpen(true)} className="h-12 px-8 text-base">
          <Upload className="mr-2 size-5" />
          Import Leads
        </Button>
      </div>

      <Dialog open={modalOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">Import Leads</DialogTitle>
            <DialogDescription>
              Upload a CSV or Excel file with your lead data. Use the sample file to ensure correct format.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Download Sample */}
            <div className="rounded-xl border bg-muted/30 p-4">
              <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Download className="size-4 text-primary" />
                Step 1: Download sample file
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Get the template with correct column headers and example data.
              </p>
              <a
                href="/sample-leads-import.csv"
                download="sample-leads-import.csv"
                className="inline-flex items-center gap-2 rounded-lg border border-input bg-background px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
              >
                <Download className="size-4" />
                Download Sample CSV
              </a>
            </div>

            {/* Upload */}
            <div className="rounded-xl border bg-muted/30 p-4">
              <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Upload className="size-4 text-primary" />
                Step 2: Upload your file
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Drag and drop or click to select. Supports .csv, .xlsx, .xls
              </p>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-10 px-4 transition-colors ${
                  isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/40"
                }`}
              >
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
                {file ? (
                  <div className="flex flex-col items-center gap-2">
                    <FileSpreadsheet className="size-10 text-primary" />
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setFile(null)
                      }}
                    >
                      Remove file
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="size-10 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">Drop your file here</p>
                    <p className="text-xs text-muted-foreground">or click to browse</p>
                  </>
                )}
              </div>
            </div>

            {/* Guidelines */}
            <div className="rounded-xl border bg-muted/30 p-4">
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <CheckCircle2 className="size-4 text-primary" />
                Guidelines for error-free import
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-primary font-medium">•</span>
                  <span><strong className="text-foreground">Contact</strong> is required — every lead must have a valid phone number</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-medium">•</span>
                  <span>Use <strong className="text-foreground">+91</strong> prefix for Indian numbers (e.g. +919876543210)</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-medium">•</span>
                  <span>Keep column headers exactly as in the sample — <strong className="text-foreground">Library Name</strong>, <strong className="text-foreground">Owner</strong>, <strong className="text-foreground">Contact</strong>, etc.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-medium">•</span>
                  <span><strong className="text-foreground">City ID</strong> — use IDs from <Link href="/master-data/cities" className="text-primary underline hover:no-underline">Master Data → Cities</Link></span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-medium">•</span>
                  <span>Duplicates (same contact) are skipped automatically</span>
                </li>
              </ul>
            </div>

            {/* Column reference */}
            <div className="rounded-xl border p-4">
              <h3 className="text-sm font-medium mb-3">Column reference</h3>
              <div className="max-h-40 overflow-y-auto space-y-1.5 text-xs">
                {SAMPLE_COLUMNS.map((col) => (
                  <div key={col.name} className="flex justify-between gap-4 py-1 border-b border-border/50 last:border-0">
                    <span className="font-medium">{col.name} {col.required && <RequiredStar />}</span>
                    <span className="text-muted-foreground truncate">{col.example}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Result */}
            {result && (
              <div className={`rounded-xl border p-4 ${result.failed > 0 ? "border-destructive/50 bg-destructive/5" : "border-primary/30 bg-primary/5"}`}>
                {result.failed > 0 ? (
                  <>
                    <div className="flex items-center gap-2 text-destructive font-medium mb-2">
                      <AlertCircle className="size-4" />
                      Import completed with errors
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {result.success} imported, {result.failed} failed.
                    </p>
                    {result.errors?.map((err, i) => (
                      <p key={i} className="text-sm text-destructive mt-1">{err}</p>
                    ))}
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-primary font-medium mb-2">
                      <CheckCircle2 className="size-4" />
                      Import successful
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {result.success} lead{result.success !== 1 ? "s" : ""} imported successfully.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={!file || importing}>
              {importing ? (
                <>Importing...</>
              ) : (
                <>
                  {file ? `Import ${file.name}` : "Select a file first"}
                  <ArrowRight className="ml-2 size-4" />
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick tips */}
      <div className="rounded-xl border p-6">
        <h3 className="font-medium mb-4">Quick tips</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary text-sm font-medium">1</div>
            <div>
              <p className="font-medium text-sm">Download the sample</p>
              <p className="text-sm text-muted-foreground">Use it as a template — column names must match exactly.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary text-sm font-medium">2</div>
            <div>
              <p className="font-medium text-sm">Fill in your data</p>
              <p className="text-sm text-muted-foreground">Contact is required. City ID from Master Data → Cities.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary text-sm font-medium">3</div>
            <div>
              <p className="font-medium text-sm">Upload & validate</p>
              <p className="text-sm text-muted-foreground">We check for duplicates and format before importing.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary text-sm font-medium">4</div>
            <div>
              <p className="font-medium text-sm">Done</p>
              <p className="text-sm text-muted-foreground">Leads appear in your list. Assign and follow up.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
