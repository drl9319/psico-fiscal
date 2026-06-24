"use client"

import * as React from "react"
import { FileSpreadsheet, FileText, UploadCloud } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { InvoiceRecord } from "@/components/dashboard/data-table-invoice-extraction"
import { apiClient } from "@/lib/api-client"

type UploadZoneIcon = "pdf" | "excel"

export type ExtractedInvoice = InvoiceRecord & {
  id: string
  fileName: string
  status: 'pending' | 'extracting' | 'extracted' | 'error'
  errorMessage?: string
  customer_id?: string
  // Excel-specific fields
  subtotal?: number
  subtotal_discounted?: number
  tax_base_zero?: number
  tax_amount_zero?: number
}

interface UploadZoneProps {
  title: string
  description: string
  acceptedTypes: string[]
  icon: UploadZoneIcon
  onInvoicesExtracted: (invoices: ExtractedInvoice[]) => void
  endpoint?: string
}

export function UploadZone({
  title,
  description,
  acceptedTypes,
  icon,
  onInvoicesExtracted,
  endpoint,
}: UploadZoneProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const [files, setFiles] = React.useState<File[]>([])
  const [extractedInvoices, setExtractedInvoices] = React.useState<ExtractedInvoice[]>([])
  const [isProcessingAll, setIsProcessingAll] = React.useState(false)

  const acceptAttr = acceptedTypes.join(",")
  const Icon = icon === "pdf" ? FileText : FileSpreadsheet
  const isPdfMode = icon === "pdf"
  const onFiles = React.useCallback((next: FileList | null) => {
    if (!next || next.length === 0) return
    setFiles((prev) => [...prev, ...Array.from(next)])
  }, [])

  const handleProcessFiles = React.useCallback(async () => {
    setIsProcessingAll(true)
    const filesToProcess = files.filter((f) => acceptedTypes.includes(f.type) || f.name.endsWith('.xlsx') || f.name.endsWith('.pdf'))
    const allResults: ExtractedInvoice[] = []

    for (const file of filesToProcess) {
      const id = `${file.name}-${file.size}`
      
      setExtractedInvoices((prev) => [
        ...prev,
        {
          id,
          fileName: file.name,
          status: 'extracting' as const,
          accounting_date: new Date(),
          supplier_name: "",
          supplier_id: "",
          supplier_address: "",
          amount: 0,
          tax: 0,
          taxPercent: 0,
          retencionAmount: 0,
          retencionPercent: 0,
          total: 0,
          invoice_number: "",
          category: "Otros",
          customer_id: "",
        },
      ])

      try {
        const form = new FormData()
        form.append("file", file, file.name)

        const res = await apiClient(`${endpoint || "/extract-invoice"}`, {
          method: "POST",
          body: form,
        })

        const data = await res.json()
        
        if (!res.ok) throw new Error(data.detail || "Error en la petición")

        const extractedData = Array.isArray(data) ? data : [data]

        extractedData.forEach((item: Record<string, unknown>, index) => {
          // Helper: parse numeric value, supporting negative numbers (credit notes / abonos)
          const toNum = (val: unknown): number => {
            if (val === null || val === undefined) return 0
            const n = Number(val)
            return Number.isFinite(n) ? n : 0
          }
          const record: ExtractedInvoice = {
            id: `${id}-${index}`,
            fileName: file.name,
            status: 'extracted' as const,
            accounting_date: item.accounting_date ? new Date(item.accounting_date as string) : new Date(),
            invoice_number: (item.invoice_number as string) || 'N/A',
            supplier_name: (item.supplier_name as string) || (item.customer_name as string) || 'Desconocido',
            supplier_id: (item.supplier_id as string) || (item.customer_id as string) || 'N/A',
            supplier_address: (item.supplier_address as string) || 'N/A',
            amount: toNum(item.amount),
            // Backend returns actual tax IVA amount (not a percentage)
            tax: toNum(item.tax),
            taxPercent: toNum(item.taxPercent),
            // Backend returns actual retencion amount (not a percentage)
            retencionAmount: toNum(item.retencion),
            retencionPercent: toNum(item.retencionPercent),
            total: toNum(item.total),
            // is_credit_note is derived from the total amount: negative total = credit note
            is_credit_note: toNum(item.total) < 0,
            category: (item.category as string) || "Otros",
            customer_id: (item.customer_id as string) || 'N/A',
            // Excel-specific fields preserved for DataTableExcel
            subtotal: item.subtotal !== undefined ? Number(item.subtotal) : undefined,
            subtotal_discounted: item.subtotal_discounted !== undefined ? Number(item.subtotal_discounted) : undefined,
            tax_base_zero: item.tax_base_zero !== undefined ? Number(item.tax_base_zero) : undefined,
            tax_amount_zero: item.tax_amount_zero !== undefined ? Number(item.tax_amount_zero) : undefined,
          }
          allResults.push(record)
        })

        setExtractedInvoices(prev =>
          prev.map(inv => inv.id === id ? allResults.find(r => r.id.startsWith(id))! : inv)
        )

      } catch (e) {
        const errorRecord: ExtractedInvoice = {
          id,
          fileName: file.name,
          status: 'error' as const,
          errorMessage: e instanceof Error ? e.message : "Error desconocido",
          accounting_date: new Date(),
          supplier_name: "",
          supplier_id: "",
          supplier_address: "",
          amount: 0,
          tax: 0,
          taxPercent: 0,
          retencionAmount: 0,
          retencionPercent: 0,
          total: 0,
          invoice_number: "",
          category: "Otros",
          customer_id: "",
        }
        allResults.push(errorRecord)
        setExtractedInvoices(prev => prev.map(inv => inv.id === id ? errorRecord : inv))
      }
    }

    // --- Duplicate check: query backend for invoices that already exist in DB ---
    const successfulResults = allResults.filter(
      (r) => r.status === 'extracted' && r.invoice_number && r.invoice_number !== 'N/A'
    )
    if (successfulResults.length > 0) {
      const invoiceNumbers = successfulResults.map((r) => r.invoice_number)
      try {
        const dupRes = await apiClient("/check-duplicate-invoices", {
          method: "POST",
          body: JSON.stringify({ invoice_numbers: invoiceNumbers }),
        })
        if (dupRes.ok) {
          const dupData = await dupRes.json()
          const duplicatesMap: Record<string, { is_duplicate: boolean; source_table?: string }> =
            dupData.duplicates || {}
          // Mark each record with duplicate info
          for (const record of allResults) {
            if (record.status === 'extracted' && record.invoice_number) {
              const dupInfo = duplicatesMap[record.invoice_number]
              if (dupInfo?.is_duplicate) {
                record.is_duplicate = true
                record.duplicate_source = dupInfo.source_table
              }
            }
          }
        }
      } catch (e) {
        console.warn("Duplicate check failed:", e)
        // Non-blocking: continue even if duplicate check fails
      }
    }

    onInvoicesExtracted(allResults)
    setIsProcessingAll(false)
    setFiles([])
  }, [files, endpoint, acceptedTypes, onInvoicesExtracted])

  const clearResults = () => {
    setFiles([])
    setExtractedInvoices([])
  }

  return (
    <Card className={cn("transition-colors", isDragging && "border-primary/50 bg-primary/5")}>
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
        <div 
          className="flex items-center justify-between gap-3 rounded-lg border border-dashed bg-background px-4 py-4"
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); onFiles(e.dataTransfer.files); }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
              <UploadCloud className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Arrastra y suelta archivos</p>
              <p className="text-xs text-muted-foreground">Tipos: {acceptedTypes.join(" · ")}</p>
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
            <Button variant="outline" onClick={() => inputRef.current?.click()}>
              Seleccionar
            </Button>
            <Button 
              onClick={handleProcessFiles} 
              disabled={files.length === 0 || isProcessingAll}
            >
              {isProcessingAll ? "Procesando..." : isPdfMode ? "Extraer datos" : "Leer Excel"}
            </Button>
          </div>
        </div>

        {extractedInvoices.length > 0 && (
          <div className="rounded-lg border bg-card">
            <div className="flex items-center justify-between border-b px-4 py-2">
              <span className="text-xs font-medium text-muted-foreground">Resultados</span>
              <Button variant="ghost" size="sm" onClick={clearResults}>Limpiar</Button>
            </div>
            <div className="max-h-60 overflow-auto p-4 space-y-2">
              {extractedInvoices.map((inv) => (
                <div key={inv.id} className={cn("rounded-md border p-2 text-sm", inv.status === 'error' && "bg-destructive/5 border-destructive/20")}>
                  <div className="flex justify-between">
                    <span className="font-medium">{inv.fileName}</span>
                    <Badge variant={inv.status === 'error' ? "destructive" : "secondary"}>
                      {inv.status}
                    </Badge>
                  </div>
                  {inv.errorMessage && <p className="text-xs text-destructive mt-1">{inv.errorMessage}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}