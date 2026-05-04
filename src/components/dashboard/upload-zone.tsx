"use client"

import * as React from "react"
import { FileSpreadsheet, FileText, UploadCloud } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type UploadZoneIcon = "pdf" | "excel"

interface UploadZoneProps {
  title: string
  description: string
  acceptedTypes: string[]
  icon: UploadZoneIcon
}

export function UploadZone({
  title,
  description,
  acceptedTypes,
  icon,
}: UploadZoneProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const [files, setFiles] = React.useState<File[]>([])
  const [isExtracting, setIsExtracting] = React.useState(false)
  const [extractError, setExtractError] = React.useState<string | null>(null)
  const [invoiceJson, setInvoiceJson] = React.useState<Record<string, unknown> | null>(
    null
  )

  const acceptAttr = acceptedTypes.join(",")
  const Icon = icon === "pdf" ? FileText : FileSpreadsheet
  const isPdfMode = icon === "pdf"
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"

  const onFiles = React.useCallback((next: FileList | null) => {
    if (!next || next.length === 0) return
    setFiles((prev) => [...prev, ...Array.from(next)])
  }, [])

  const extractFromLatestPdf = React.useCallback(async () => {
    setExtractError(null)
    setInvoiceJson(null)

    const latest = [...files].reverse().find((f) => f.type === "application/pdf")
    if (!latest) {
      setExtractError("No hay ningún PDF seleccionado.")
      return
    }

    setIsExtracting(true)
    try {
      const form = new FormData()
      form.append("file", latest, latest.name)

      const res = await fetch(`${apiBaseUrl}/extract-invoice`, {
        method: "POST",
        body: form,
      })

      const data = (await res.json()) as unknown
      if (!res.ok) {
        const detail =
          typeof data === "object" && data && "detail" in data
            ? String((data as { detail?: unknown }).detail)
            : "Error desconocido extrayendo la factura."
        throw new Error(detail)
      }

      if (!data || typeof data !== "object") {
        throw new Error("La API devolvió un JSON inválido.")
      }

      setInvoiceJson(data as Record<string, unknown>)
    } catch (e) {
      setExtractError(e instanceof Error ? e.message : "Error desconocido.")
    } finally {
      setIsExtracting(false)
    }
  }, [apiBaseUrl, files])

  const clearResults = React.useCallback(() => {
    setExtractError(null)
    setInvoiceJson(null)
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
                onClick={extractFromLatestPdf}
                disabled={files.length === 0 || isExtracting}
              >
                {isExtracting ? "Extrayendo..." : "Extraer datos"}
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

        {isPdfMode && (extractError || invoiceJson) && (
          <div className="rounded-lg border bg-card">
            <div className="flex items-center justify-between gap-3 border-b px-4 py-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Resultado extracción
                </span>
                {extractError ? (
                  <Badge variant="destructive">Error</Badge>
                ) : (
                  <Badge variant="secondary">OK</Badge>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={clearResults}>
                Limpiar
              </Button>
            </div>

            <div className="space-y-4 px-4 py-4">
              {extractError && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {extractError}
                </div>
              )}

              {invoiceJson && (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-md border bg-background px-3 py-2">
                      <div className="text-xs text-muted-foreground">Proveedor</div>
                      <div className="text-sm font-medium">
                        {String(invoiceJson.proveedor ?? "")}
                      </div>
                    </div>
                    <div className="rounded-md border bg-background px-3 py-2">
                      <div className="text-xs text-muted-foreground">Fecha</div>
                      <div className="text-sm font-medium">
                        {String(invoiceJson.fecha_contabilizacion ?? "")}
                      </div>
                    </div>
                    <div className="rounded-md border bg-background px-3 py-2">
                      <div className="text-xs text-muted-foreground">DNI</div>
                      <div className="text-sm font-medium">
                        {String(invoiceJson.dni ?? "")}
                      </div>
                    </div>
                    <div className="rounded-md border bg-background px-3 py-2">
                      <div className="text-xs text-muted-foreground">Dirección</div>
                      <div className="text-sm font-medium">
                        {String(invoiceJson.direccion ?? "")}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-md border bg-background px-3 py-2">
                      <div className="text-xs text-muted-foreground">Base</div>
                      <div className="text-lg font-semibold tabular-nums">
                        {Number(invoiceJson.base ?? 0).toFixed(2)}
                      </div>
                    </div>
                    <div className="rounded-md border bg-background px-3 py-2">
                      <div className="text-xs text-muted-foreground">Impuesto</div>
                      <div className="text-lg font-semibold tabular-nums">
                        {Number(invoiceJson.impuesto ?? 0).toFixed(2)}
                      </div>
                    </div>
                    <div className="rounded-md border bg-background px-3 py-2">
                      <div className="text-xs text-muted-foreground">Total</div>
                      <div className="text-lg font-semibold tabular-nums">
                        {Number(invoiceJson.total ?? 0).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border bg-background">
                    <div className="border-b px-3 py-2 text-xs font-medium text-muted-foreground">
                      JSON completo
                    </div>
                    <pre className="max-h-64 overflow-auto px-3 py-3 text-xs leading-relaxed">
                      {JSON.stringify(invoiceJson, null, 2)}
                    </pre>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

