"use client"

import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  AlertTriangle,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Download,
  Edit,
  Eye,
  Filter,
  MoreHorizontal,
  Search,
  Trash2,
} from "lucide-react"
import { DateRange } from "react-day-picker"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { DateRangePicker } from "./date-range-picker"

export interface InvoiceRecord {
  id: string
  accounting_date: Date | string | null
  invoice_number: string
  supplier_name: string
  supplier_id: string | null
  supplier_address: string | null
  amount: number | null
  tax: number | null
  taxPercent: number | null
  retencionAmount: number | null
  retencionPercent: number | null
  total: number | null
  category: string
  fileName: string
  status: string
  _isEditing?: boolean
  _isSelected?: boolean
  _isValid?: boolean
  _originalData?: InvoiceRecord
  customer_id: string
  is_duplicate?: boolean
  duplicate_source?: string
  is_credit_note?: boolean
}

interface DataTableProps {
  data: InvoiceRecord[]
  type: "customer" | "supplier"
  onDataChange?: (data: InvoiceRecord[]) => void
  onSelectedChange?: (selectedIds: string[]) => void
}

const categories = [
  "Sanitario",
  "Formación",
  "Alquiler",
  "Material Oficina",
  "Suministros",
  "Software",
  "Seguros",
  "Otros",
]

const categoryColors: Record<string, string> = {
  Sanitario: "bg-primary/10 text-primary",
  Formación: "bg-accent/10 text-accent",
  Alquiler: "bg-warning/10 text-warning",
  "Material Oficina": "bg-info/10 text-info",
  Suministros: "bg-chart-3/10 text-chart-3",
  Software: "bg-chart-4/10 text-chart-4",
  Seguros: "bg-chart-5/10 text-chart-5",
  Otros: "bg-muted text-muted-foreground",
}

function safeNumber(n: any) {
  const v = Number(n)
  return Number.isFinite(v) ? v : 0
}

export function DataTableInvoiceExtraction({ data, type, onDataChange, onSelectedChange }: DataTableProps) {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>()
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all")
  const [creditNoteFilter, setCreditNoteFilter] = React.useState<string>("all")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [editedData, setEditedData] = React.useState<InvoiceRecord[]>(data)
  const [selectedRows, setSelectedRows] = React.useState<Set<string>>(new Set())
  const itemsPerPage = 10

  React.useEffect(() => {
    setEditedData(data)
  }, [data])

  React.useEffect(() => {
    onSelectedChange?.(Array.from(selectedRows))
  }, [selectedRows, onSelectedChange])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(amount)
  }

  // helpers that compute fallback values when fields are null/undefined
  const getBase = (r: InvoiceRecord) => safeNumber(r.amount)
  const getTax = (r: InvoiceRecord) => {
    const explicit = safeNumber(r.tax)
    // Allow negative values (credit notes / abonos)
    if (explicit !== 0) return explicit
    const pct = safeNumber(r.taxPercent)
    // Allow negative percentage (credit notes / abonos)
    return pct !== 0 ? (getBase(r) * pct) / 100 : 0
  }
  const getRetencion = (r: InvoiceRecord) => {
    const explicit = safeNumber(r.retencionAmount)
    // Allow negative values (credit notes / abonos)
    if (explicit !== 0) return explicit
    const pct = safeNumber(r.retencionPercent)
    // Allow negative percentage (credit notes / abonos)
    return pct !== 0 ? (getBase(r) * pct) / 100 : 0
  }
  const getTotal = (r: InvoiceRecord) => {
    const explicit = safeNumber(r.total)
    // Allow negative values (credit notes / abonos)
    if (explicit !== 0) return explicit
    return getBase(r) + getTax(r) - getRetencion(r)
  }

  const filteredData = React.useMemo(() => {
    return editedData.filter((record) => {
      const matchesSearch =
        searchTerm === "" ||
        (record.supplier_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (record.invoice_number || "").toLowerCase().includes(searchTerm.toLowerCase())

      const recordDate = record.accounting_date ? new Date(record.accounting_date) : undefined

      const matchesDateRange =
        !dateRange?.from ||
        !dateRange?.to ||
        (recordDate && dateRange.from && dateRange.to && recordDate >= dateRange.from && recordDate <= dateRange.to)

      const matchesCategory = categoryFilter === "all" || record.category === categoryFilter

      const matchesCreditNote =
        creditNoteFilter === "all" ||
        (creditNoteFilter === "yes" && record.is_credit_note === true) ||
        (creditNoteFilter === "no" && (record.is_credit_note === false || record.is_credit_note === undefined))

      return matchesSearch && matchesDateRange && matchesCategory && matchesCreditNote
    })
  }, [editedData, searchTerm, dateRange, categoryFilter, creditNoteFilter])

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleEditClick = React.useCallback((id: string) => {
    setEditedData((prev) => prev.map((record) => (record.id === id ? { ...record, _isEditing: true, _originalData: { ...record } } : record)))
  }, [])

  const handleSaveClick = React.useCallback((id: string) => {
    setEditedData((prev) => prev.map((record) => (record.id === id ? { ...record, _isEditing: false } : record)))
    onDataChange?.(editedData.map((record) => (record.id === id ? { ...record, _isEditing: false } : record)))
  }, [editedData, onDataChange])

  const handleCancelClick = React.useCallback((id: string) => {
    setEditedData((prev) => prev.map((record) => (record.id === id && record._originalData ? { ...record._originalData, _isEditing: false } : record)))
  }, [])

  const handleInputChange = React.useCallback((id: string, field: keyof InvoiceRecord, value: any) => {
    setEditedData((prev) => prev.map((record) => (record.id === id ? { ...record, [field]: value } : record)))
  }, [])

  const handleSelectRow = React.useCallback((id: string, isSelected: boolean) => {
    setSelectedRows((prev) => {
      const newSelection = new Set(prev)
      if (isSelected) {
        newSelection.add(id)
      } else {
        newSelection.delete(id)
      }
      return newSelection
    })
  }, [])

  const handleSelectAll = React.useCallback((isSelected: boolean) => {
    setSelectedRows((prev) => {
      const newSelection = new Set(prev)
      paginatedData.forEach((record) => {
        if (isSelected) newSelection.add(record.id)
        else newSelection.delete(record.id)
      })
      return newSelection
    })
  }, [paginatedData])

  const summary = React.useMemo(() => {
    return filteredData.reduce(
      (acc, record) => ({
        amount: acc.amount + getBase(record),
        tax: acc.tax + getTax(record),
        retencionAmount: acc.retencionAmount + getRetencion(record),
        total: acc.total + getTotal(record),
      }),
      { amount: 0, tax: 0, retencionAmount: 0, total: 0 }
    )
  }, [filteredData])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={type === "customer" ? "Buscar cliente o factura..." : "Buscar proveedor o factura..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <DateRangePicker date={dateRange} onDateChange={setDateRange} />

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[160px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={creditNoteFilter} onValueChange={setCreditNoteFilter}>
          <SelectTrigger className="w-[140px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="no">Facturas</SelectItem>
            <SelectItem value="yes">Abonos</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="icon">
          <Download className="h-4 w-4" />
        </Button>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[50px]">
                <input
                  type="checkbox"
                  checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="form-checkbox"
                />
              </TableHead>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead className="w-[80px]">Tipo</TableHead>
              <TableHead className="w-[100px]">Fecha Contable</TableHead>
              <TableHead className="w-[120px]">Nº Factura</TableHead>
              <TableHead>{type === "customer" ? "Cliente" : "Proveedor"}</TableHead>
              <TableHead>NIF</TableHead>
              <TableHead className="text-right">Base Imponible</TableHead>
              <TableHead className="text-right w-[100px]">IVA</TableHead>
              <TableHead className="text-right w-[100px]">IRPF</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-[120px]">Categoría</TableHead>
              <TableHead className="w-[100px] text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={13} className="h-24 text-center text-muted-foreground">
                  No se encontraron registros
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((record) => (
                <TableRow key={record.id} className={
                  record._isValid === false
                    ? "bg-destructive/5"
                    : record.is_duplicate
                      ? "bg-amber-50 dark:bg-amber-950/10"
                      : undefined
                }>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedRows.has(record.id)}
                      onChange={(e) => handleSelectRow(record.id, e.target.checked)}
                      className="form-checkbox"
                    />
                  </TableCell>
                  <TableCell className="w-[40px] px-1">
                    {record.is_duplicate ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <AlertTriangle className="h-4 w-4 text-amber-500 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="text-xs max-w-[220px]">
                            <p className="font-semibold text-amber-600">Factura duplicada</p>
                            <p className="text-muted-foreground">
                              Nº {record.invoice_number} ya existe en{' '}
                              {record.duplicate_source === 'customer_invoices'
                                ? 'facturas de clientes'
                                : 'facturas de proveedores'}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-center">
                    {record.is_credit_note ? (
                      <Badge variant="destructive" className="text-xs">Abono</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Factura</Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {record._isEditing ? (
                      <Input
                        type="date"
                        value={record.accounting_date ? format(new Date(record.accounting_date), "yyyy-MM-dd") : ""}
                        onChange={(e) => handleInputChange(record.id, "accounting_date", e.target.value ? new Date(e.target.value) : null)}
                      />
                    ) : (
                      (() => {
                        if (!record.accounting_date) return "Sin fecha"
                        const dateObj = new Date(record.accounting_date)
                        if (!isNaN(dateObj.getTime())) return format(dateObj, "dd/MM/yy", { locale: es })
                        return "Fecha inválida"
                      })()
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {record._isEditing ? (
                      <Input value={record.invoice_number} onChange={(e) => handleInputChange(record.id, "invoice_number", e.target.value)} />
                    ) : (
                      record.invoice_number
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {record._isEditing ? (
                      <Input value={record.supplier_name} onChange={(e) => handleInputChange(record.id, "supplier_name", e.target.value)} />
                    ) : (
                      record.supplier_name
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {record._isEditing ? (
                      <Input value={record.customer_id} onChange={(e) => handleInputChange(record.id, "customer_id", e.target.value)} />
                    ) : (
                      record.customer_id
                    )}
                  </TableCell>

                  <TableCell className="text-right font-mono">
                    {record._isEditing ? (
                      <Input type="number" value={String(getBase(record))} onChange={(e) => handleInputChange(record.id, "amount", parseFloat(e.target.value) || 0)} />
                    ) : (
                      formatCurrency(getBase(record))
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {record._isEditing ? (
                      <Input type="number" value={String(getTax(record))} onChange={(e) => handleInputChange(record.id, "tax", parseFloat(e.target.value) || 0)} />
                    ) : (
                      <span className="font-mono text-sm">{formatCurrency(getTax(record))}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {record._isEditing ? (
                      <Input type="number" value={String(getRetencion(record))} onChange={(e) => handleInputChange(record.id, "retencionAmount", parseFloat(e.target.value) || 0)} />
                    ) : (
                      <span className="font-mono text-sm text-destructive">{formatCurrency(getRetencion(record))} ({safeNumber(record.retencionPercent)}%)</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    {record._isEditing ? (
                      <Input type="number" value={String(getTotal(record))} onChange={(e) => handleInputChange(record.id, "total", parseFloat(e.target.value) || 0)} />
                    ) : (
                      formatCurrency(getTotal(record))
                    )}
                  </TableCell>
                  <TableCell>
                    {record._isEditing ? (
                      <Select value={record.category} onValueChange={(value) => handleInputChange(record.id, "category", value)}>
                        <SelectTrigger className="w-[100px]">
                          <SelectValue placeholder="Categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className={`text-xs ${categoryColors[record.category] || categoryColors.Otros}`}>{record.category}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {record._isEditing ? (
                      <div className="flex items-center gap-2 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => handleSaveClick(record.id)}>Guardar</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleCancelClick(record.id)}>Cancelar</Button>
                      </div>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem><Eye className="mr-2 h-4 w-4" />Ver detalle</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditClick(record.id)}><Edit className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Eliminar</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between border-t bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-6 text-sm">
            <span className="text-muted-foreground">{filteredData.length} registros</span>
            <span><span className="text-muted-foreground">Base Imponible: </span><span className="font-mono font-medium">{formatCurrency(summary.amount)}</span></span>
            <span><span className="text-muted-foreground">IVA: </span><span className="font-mono font-medium">{formatCurrency(summary.tax)}</span></span>
            <span><span className="text-muted-foreground">IRPF: </span><span className="font-mono font-medium text-destructive">{formatCurrency(summary.retencionAmount)}</span></span>
            <span><span className="text-muted-foreground">Total: </span><span className="font-mono font-semibold text-primary">{formatCurrency(summary.total)}</span></span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Página {currentPage} de {totalPages || 1}</span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}><ChevronsLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}><ChevronRight className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || totalPages === 0}><ChevronsRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DataTableInvoiceExtraction
