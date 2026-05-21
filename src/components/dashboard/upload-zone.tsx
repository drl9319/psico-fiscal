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
  tax_amount_zero?: number
  customer_id?: string
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
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"

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
          status: 'extracting',
          accounting_date: new Date(),
          supplier_name: "",
          supplier_id: "",
          supplier_address: "",
          amount: 0,
          taxPercent: 0,
          total: 0,
          retencionPercent: 0,
          invoice_number: "",
          category: "Otros",
        },
      ])

      try {
        const form = new FormData()
        form.append("file", file, file.name)

        const res = await fetch(`${apiBaseUrl}${endpoint || "/extract-invoice"}`, {
          method: "POST",
          body: form,
        })

        const data = await res.json()
        
        if (!res.ok) throw new Error(data.detail || "Error en la petición")

        const extractedData = Array.isArray(data) ? data : [data]

        extractedData.forEach((item, index) => {
          const record: ExtractedInvoice = {
            id: `${id}-${index}`,
            fileName: file.name,
            status: 'extracted',
            accounting_date: item.accounting_date ? new Date(item.accounting_date) : new Date(),
            invoice_number: item.invoice_number || 'N/A',
            supplier_name: item.supplier_name || item.customer_name || 'Desconocido',
            supplier_id: item.supplier_id || item.customer_id || 'N/A',
            supplier_address: item.supplier_address || 'N/A',
            amount: Number(item.amount || 0),
            taxPercent: Number(item.taxPercent || 0),
            retencionPercent: Number(item.retencionPercent || 0),
            total: Number(item.total || 0),
            category: item.category || "Otros",
            customer_id: item.customer_id || 'N/A',
            // Campos adicionales que mencionaste del Excel
            subtotal: item.subtotal,
            subtotal_discounted: item.subtotal_discounted,
            tax_base_zero: item.tax_base_zero,
            tax_amount_zero: item.tax_amount_zero,
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
          status: 'error',
          errorMessage: e instanceof Error ? e.message : "Error desconocido",
          accounting_date: new Date(),
          supplier_name: "",
          supplier_id: "",
          supplier_address: "",
          amount: 0,
          taxPercent: 0,
          total: 0,
          retencionPercent: 0,
          invoice_number: "",
          category: "Otros",
        }
        allResults.push(errorRecord)
        setExtractedInvoices(prev => prev.map(inv => inv.id === id ? errorRecord : inv))
      }
    }

    onInvoicesExtracted(allResults)
    setIsProcessingAll(false)
    setFiles([])
  }, [apiBaseUrl, files, endpoint, acceptedTypes, onInvoicesExtracted])

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