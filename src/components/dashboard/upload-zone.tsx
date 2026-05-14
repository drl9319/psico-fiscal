"use client"

import * as React from "react"
import { FileSpreadsheet, FileText, UploadCloud } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { InvoiceRecord } from "@/components/dashboard/data-table"

type UploadZoneIcon = "pdf" | "excel"

export type ExtractedInvoice = InvoiceRecord & {
  id: string
  fileName: string
  status: 'pending' | 'extracting' | 'extracted' | 'error'
  errorMessage?: string
}

interface UploadZoneProps {
  title: string
  description: string
  acceptedTypes: string[]
  icon: UploadZoneIcon
  onInvoicesExtracted: (invoices: ExtractedInvoice[]) => void
}

export function UploadZone({
  title,
  description,
  acceptedTypes,
  icon,
  onInvoicesExtracted,
}: UploadZoneProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const [files, setFiles] = React.useState<File[]>([])
  const [extractedInvoices, setExtractedInvoices] = React.useState<ExtractedInvoice[]>([])
  const [isProcessingAll, setIsProcessingAll] = React.useState(false)

  const acceptAttr = acceptedTypes.join(",")
  const Icon = icon === "pdf" ? FileText : FileSpreadsheet
  const isPdfMode = icon === "pdf"
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"

  const onFiles = React.useCallback((next: FileList | null) => {
    if (!next || next.length === 0) return
    setFiles((prev) => [...prev, ...Array.from(next)])
  }, [])

  const handleExtractAll = React.useCallback(async () => {
    setIsProcessingAll(true)
    const pdfFiles = files.filter((f) => f.type === "application/pdf")
    const newExtracted: ExtractedInvoice[] = []

    for (const file of pdfFiles) {
      const id = `${file.name}-${file.size}`
      setExtractedInvoices((prev) => [
        ...prev,
        {
          id,
          fileName: file.name,
          status: 'extracting',
          accounting_date: new Date(), // Placeholder
          supplier_name: "", // Placeholder
          supplier_id: "", // Placeholder
          supplier_address: "", // Placeholder
          amount: 0, // Placeholder
          taxPercent: 0, // Placeholder (renamed from tax)
          total: 0, // Placeholder
          retencionPercent: 0.0, // Placeholder (renamed from retencion)
          invoice_number: "", // Required by InvoiceRecord
          category: "Otros", // Required by InvoiceRecord
        },
      ])

      try {
        const form = new FormData()
        form.append("file", file, file.name)

        const res = await fetch(`${apiBaseUrl}/extract-invoice`, {
          method: "POST",
          body: form,
        })

        const data = (await res.json()) as unknown
        if (!res.ok) {
          const detail =
            typeof data === "object" && data && "detail" in data
              ? String((data as { detail?: unknown }).detail)
              : `Error desconocido extrayendo ${file.name}.`
          throw new Error(detail)
        }

        if (!data || typeof data !== "object") {
          throw new Error("La API devolvió un JSON inválido.")
        }

        const invoiceData = data as Record<string, unknown>
        const record: InvoiceRecord = {
          id: id,
          accounting_date: new Date(String(invoiceData.accounting_date)),
          invoice_number: String(invoiceData.invoice_number ?? 'N/A'),
          supplier_name: String(invoiceData.supplier_name),
          supplier_id: String(invoiceData.supplier_id ?? 'N/A'),
          supplier_address: String(invoiceData.supplier_address ?? 'N/A'),
          amount: Number(invoiceData.amount),
          taxPercent: Number(invoiceData.amount && invoiceData.tax ? (Number(invoiceData.tax) / Number(invoiceData.amount)) * 100 : 0),
          retencionPercent: Number(invoiceData.amount && invoiceData.retencion ? (Number(invoiceData.retencion) / Number(invoiceData.amount)) * 100 : 0),
          total: Number(invoiceData.total),
          category: "Otros",
        }

        newExtracted.push({
          ...record,
          id: id,
          fileName: file.name,
          status: 'extracted',
          errorMessage: undefined,
        })
      } catch (e) {
        newExtracted.push({
          id: id,
          fileName: file.name,
          status: 'error',
          errorMessage: e instanceof Error ? e.message : "Error desconocido.",
          // Add placeholder values for InvoiceRecord
          accounting_date: new Date(),
          supplier_name: "",
          supplier_id: "",
          supplier_address: "",
          amount: 0,
          taxPercent: 0,
          total: 0,
          retencionPercent: 0.0,
          invoice_number: "",
          category: "Otros",
        })
      }
      setExtractedInvoices(current => current.map(inv => newExtracted.find(ne => ne.id === inv.id) || inv));
    }
    setIsProcessingAll(false)
    onInvoicesExtracted(newExtracted)
  }, [apiBaseUrl, files, onInvoicesExtracted])

  const clearResults = React.useCallback(() => {
    setFiles([])
    setExtractedInvoices([])
  }, [])

  return (
    <Card
      className={cn(
        "transition-colors",
        isDragging ? "border-primary/50 bg-primary/5" : undefined
      )}
      onDragEnter={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
      }}
      onDragOver={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
      }}
      onDragLeave={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
      }}
      onDrop={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
        onFiles(e.dataTransfer.files)
      }}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-base">{title}</CardTitle>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed bg-background px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
              <UploadCloud className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Arrastra y suelta aquí prueba</p>
              <p className="text-xs text-muted-foreground">
                Tipos: {acceptedTypes.join(" · ")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              accept={acceptAttr}
              multiple
              className="hidden"
              onChange={(e) => onFiles(e.target.files)}
            />
            <Button
              variant="outline"
              onClick={() => inputRef.current?.click()}
            >
              Seleccionar archivo
            </Button>
            {isPdfMode && (
              <Button
                onClick={handleExtractAll}
                disabled={files.length === 0 || isProcessingAll}
              >
                {isProcessingAll ? "Extrayendo..." : "Extraer datos"}
              </Button>
            )}
          </div>
        </div>

        {files.length > 0 && (
          <div className="rounded-lg border bg-card">
            <div className="border-b px-4 py-2 text-xs font-medium text-muted-foreground">
              Archivos ({files.length})
            </div>
            <ul className="max-h-40 overflow-auto px-4 py-2">
              {files.map((f, idx) => (
                <li
                  key={`${f.name}-${f.size}-${idx}`}
                  className="flex items-center justify-between gap-3 py-1 text-sm"
                >
                  <span className="truncate">{f.name}</span>
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">
                    {Math.ceil(f.size / 1024)} KB
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {isPdfMode && extractedInvoices.length > 0 && (
          <div className="rounded-lg border bg-card">
            <div className="flex items-center justify-between gap-3 border-b px-4 py-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Resultado extracción
                </span>
                {extractedInvoices.some(inv => inv.status === 'error') ? (
                  <Badge variant="destructive">Errores</Badge>
                ) : (
                  <Badge variant="secondary">OK</Badge>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={clearResults}>
                Limpiar
              </Button>
            </div>

            <div className="space-y-4 px-4 py-4">
              {extractedInvoices.map((invoice) => (
                <div key={invoice.id} className={cn(
                  "rounded-md border p-3",
                  invoice.status === 'error' ? 'border-destructive/30 bg-destructive/5' : 'bg-background'
                )}>
                  <div className="flex items-center justify-between gap-2 text-sm font-medium">
                    <span>{invoice.fileName}</span>
                    {invoice.status === 'extracting' && <Badge variant="secondary">Extrayendo...</Badge>}
                    {invoice.status === 'extracted' && <Badge variant="secondary">Extraído</Badge>}
                    {invoice.status === 'error' && <Badge variant="destructive">Error</Badge>}
                  </div>
                  {invoice.errorMessage && (
                    <p className="mt-2 text-sm text-destructive">{invoice.errorMessage}</p>
                  )}
                  {invoice.status === 'extracted' && (
                    <pre className="mt-2 max-h-40 overflow-auto text-xs leading-relaxed">
                      {JSON.stringify(invoice, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

