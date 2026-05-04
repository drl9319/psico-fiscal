"use client"

import * as React from "react"
import { FileSpreadsheet, FileText, UploadCloud } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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

  const acceptAttr = acceptedTypes.join(",")
  const Icon = icon === "pdf" ? FileText : FileSpreadsheet

  const onFiles = React.useCallback((next: FileList | null) => {
    if (!next || next.length === 0) return
    setFiles((prev) => [...prev, ...Array.from(next)])
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
              <p className="text-sm font-medium">Arrastra y suelta aquí</p>
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
      </CardContent>
    </Card>
  )
}

