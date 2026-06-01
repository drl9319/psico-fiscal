"use client"

import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
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

import { DateRangePicker } from "./date-range-picker"

export interface InvoiceRecord {
  id: string
  accounting_date: Date // Changed from 'date' to 'accounting_date'
  invoice_number: string
  supplier_name: string // Changed from 'entityName' to 'supplier_name'
  supplier_id: string | null // Added supplier_id
  supplier_address: string | null // Added supplier_address
  baseImponible: number // Changed from 'amount' to 'baseImponible'
  taxAmount: number // Changed from 'taxPercent' to 'taxAmount'
  taxPercent: number // Kept taxPercent for display purposes
  retencionAmount: number // Changed from 'retencionPercent' to 'retencionAmount'
  retencionPercent: number // Kept retencionPercent for display purposes
  total: number
  category: string
  fileName: string // Added fileName
  status: string // Added status
  _isEditing?: boolean
  _isSelected?: boolean
  _isValid?: boolean
  _originalData?: InvoiceRecord // To store original data for rollback
  customer_id: string // Added NIF field
  is_credit_note?: boolean
}

interface DataTableProps {
  data: InvoiceRecord[]
  type: "customer" | "supplier"
  onDataChange?: (data: InvoiceRecord[]) => void
  onSelectedChange?: (selectedIds: string[]) => void
  onEdit?: (record: InvoiceRecord) => Promise<boolean>
  onDelete?: (id: string) => Promise<boolean>
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

export function DataTable({ data, type, onDataChange, onSelectedChange, onEdit, onDelete }: DataTableProps) {
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

  const filteredData = React.useMemo(() => {
    return editedData.filter((record) => {
      const matchesSearch =
        searchTerm === "" ||
        record.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())

      // Normalize record date to a Date object for comparison
      const recordDate = record.accounting_date ? new Date(record.accounting_date) : null

      const matchesDateRange =
        !dateRange?.from ||
        !dateRange?.to ||
        (recordDate instanceof Date && !isNaN(recordDate.getTime()) && recordDate >= dateRange.from! && recordDate <= dateRange.to!)

      const matchesCategory =
        categoryFilter === "all" || record.category === categoryFilter

      const matchesCreditNote =
        creditNoteFilter === "all" ||
        (creditNoteFilter === "yes" && record.is_credit_note === true) ||
        (creditNoteFilter === "no" && (record.is_credit_note === false || record.is_credit_note === undefined))

      return matchesSearch && matchesDateRange && matchesCategory && matchesCreditNote
    })
  }, [editedData, searchTerm, dateRange, categoryFilter, creditNoteFilter])

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleEditClick = React.useCallback((id: string) => {
    setEditedData((prev) =>
      prev.map((record) =>
        record.id === id
          ? { ...record, _isEditing: true, _originalData: { ...record } }
          : record
      )
    )
  }, [])

  const handleSaveClick = React.useCallback(
    async (id: string) => {
      const record = editedData.find((r) => r.id === id)
      if (!record) return

      // Call the API if onEdit is provided
      if (onEdit) {
        const success = await onEdit(record)
        if (!success) return // Keep editing mode if save failed
      }

      setEditedData((prev) =>
        prev.map((record) => (record.id === id ? { ...record, _isEditing: false } : record))
      )
      onDataChange?.(editedData.map((record) => (record.id === id ? { ...record, _isEditing: false } : record)))
    },
    [editedData, onDataChange, onEdit]
  )

  const handleDeleteClick = React.useCallback(
    async (id: string) => {
      if (!window.confirm("¿Estás seguro de que deseas eliminar este registro?")) return

      // Call the API if onDelete is provided
      if (onDelete) {
        const success = await onDelete(id)
        if (!success) return
      }

      // Remove from local state
      setEditedData((prev) => prev.filter((record) => record.id !== id))
      onDataChange?.(editedData.filter((record) => record.id !== id))
    },
    [editedData, onDataChange, onDelete]
  )

  const handleCancelClick = React.useCallback((id: string) => {
    setEditedData((prev) =>
      prev.map((record) =>
        record.id === id && record._originalData
          ? { ...record._originalData, _isEditing: false }
          : record
      )
    )
  }, [])

  const handleInputChange = React.useCallback(
    (id: string, field: keyof InvoiceRecord, value: any) => {
      setEditedData((prev) =>
        prev.map((record) => (record.id === id ? { ...record, [field]: value } : record))
      )
    },
    []
  )

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
        if (isSelected) {
          newSelection.add(record.id)
        } else {
          newSelection.delete(record.id)
        }
      })
      return newSelection
    })
  }, [paginatedData])

  const summary = React.useMemo(() => {
    return filteredData.reduce(
      (acc, record) => ({
        baseImponible: acc.baseImponible + Number(record.baseImponible || 0),
        taxAmount: acc.taxAmount + Number(record.taxAmount || 0),
        retencionAmount: acc.retencionAmount + Number(record.retencionAmount || 0),
        total: acc.total + Number(record.total || 0),
      }),
      { baseImponible: 0, taxAmount: 0, retencionAmount: 0, total: 0 }
    )
  }, [filteredData])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={
              type === "customer"
                ? "Buscar cliente o factura..."
                : "Buscar proveedor o factura..."
            }
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
                <TableCell
                  colSpan={11}
                  className="h-24 text-center text-muted-foreground"
                >
                  No se encontraron registros
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((record, idx) => (
                <TableRow key={`${record.id ?? idx}-${record.invoice_number}`} className={record._isValid === false ? "bg-destructive/5" : undefined}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedRows.has(record.id)}
                      onChange={(e) => handleSelectRow(record.id, e.target.checked)}
                      className="form-checkbox"
                    />
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
                        value={format(record.accounting_date, "yyyy-MM-dd")}
                        onChange={(e) =>
                          handleInputChange(record.id, "accounting_date", new Date(e.target.value))
                        }
                      />
                        ) : (
                       (() => {
                         if (!record.accounting_date) return "Sin fecha";
                         const dateObj = new Date(record.accounting_date);
                         if (!isNaN(dateObj.getTime())) {
                           return format(dateObj, "dd/MM/yy", { locale: es });
                         }
                         return "Fecha inválida";
                      })()
                     )}
                   </TableCell>
                  <TableCell className="font-mono text-sm">
                    {record._isEditing ? (
                      <Input
                        value={record.invoice_number}
                        onChange={(e) =>
                          handleInputChange(record.id, "invoice_number", e.target.value)
                        }
                      />
                    ) : (
                      record.invoice_number
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {record._isEditing ? (
                      <Input
                        value={record.supplier_name}
                        onChange={(e) =>
                          handleInputChange(record.id, "supplier_name", e.target.value)
                        }
                      />
                    ) : (
                      record.supplier_name
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {record._isEditing ? (
                      <Input
                        value={record.customer_id}
                        onChange={(e) =>
                          handleInputChange(record.id, "customer_id", e.target.value)
                        }
                      />
                    ) : (
                      record.customer_id
                    )}
                  </TableCell>
                  
                  <TableCell className="text-right font-mono">
                    {record._isEditing ? (
                      <Input
                        type="number"
                        value={record.baseImponible}
                        onChange={(e) =>
                          handleInputChange(record.id, "baseImponible", parseFloat(e.target.value))
                        }
                      />
                    ) : (
                      formatCurrency(record.baseImponible)
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {record._isEditing ? (
                      <Input
                        type="number"
                        value={record.taxAmount}
                        onChange={(e) =>
                          handleInputChange(record.id, "taxAmount", parseFloat(e.target.value))
                        }
                      />
                    ) : (
                      <span className="font-mono text-sm">
                        {formatCurrency(record.taxAmount)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {record._isEditing ? (
                      <Input
                        type="number"
                        value={record.retencionAmount}
                        onChange={(e) =>
                          handleInputChange(record.id, "retencionAmount", parseFloat(e.target.value))
                        }
                      />
                    ) : (
                      <span className="font-mono text-sm text-destructive">
                        {formatCurrency(record.retencionAmount)} ({record.retencionPercent}%)
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    {record._isEditing ? (
                      <Input
                        type="number"
                        value={record.total}
                        onChange={(e) =>
                          handleInputChange(record.id, "total", parseFloat(e.target.value))
                        }
                      />
                    ) : (
                      formatCurrency(record.total)
                    )}
                  </TableCell>
                  <TableCell>
                    {record._isEditing ? (
                      <Select
                        value={record.category}
                        onValueChange={(value) =>
                          handleInputChange(record.id, "category", value)
                        }
                      >
                        <SelectTrigger className="w-[100px]">
                          <SelectValue placeholder="Categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge
                        className={`text-xs ${
                          categoryColors[record.category] || categoryColors.Otros
                        }`}
                      >
                        {record.category}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {record._isEditing ? (
                      <div className="flex items-center gap-2 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => handleSaveClick(record.id)}>
                          Guardar
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleCancelClick(record.id)}>
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver detalle
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditClick(record.id)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteClick(record.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
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
            <span className="text-muted-foreground">
              {filteredData.length} registros
            </span>
            <span>
              <span className="text-muted-foreground">Base Imponible: </span>
              <span className="font-mono font-medium">
                {formatCurrency(summary.baseImponible)}
              </span>
            </span>
            <span>
              <span className="text-muted-foreground">IVA: </span>
              <span className="font-mono font-medium">
                {formatCurrency(summary.taxAmount)}
              </span>
            </span>
            <span>
              <span className="text-muted-foreground">IRPF: </span>
              <span className="font-mono font-medium text-destructive">
                {formatCurrency(summary.retencionAmount)}
              </span>
            </span>
            <span>
              <span className="text-muted-foreground">Total: </span>
              <span className="font-mono font-semibold text-primary">
                {formatCurrency(summary.total)}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages || 1}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

