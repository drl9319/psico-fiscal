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
  date: Date
  invoiceNumber: string
  entityName: string
  baseImponible: number
  ivaPercent: number
  irpfPercent: number
  total: number
  category: string
}

interface DataTableProps {
  data: InvoiceRecord[]
  type: "customer" | "supplier"
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

export function DataTable({ data, type }: DataTableProps) {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>()
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all")
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 10

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(amount)
  }

  const filteredData = React.useMemo(() => {
    return data.filter((record) => {
      const matchesSearch =
        searchTerm === "" ||
        record.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesDateRange =
        !dateRange?.from ||
        !dateRange?.to ||
        (record.date >= dateRange.from && record.date <= dateRange.to)

      const matchesCategory =
        categoryFilter === "all" || record.category === categoryFilter

      return matchesSearch && matchesDateRange && matchesCategory
    })
  }, [data, searchTerm, dateRange, categoryFilter])

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const summary = React.useMemo(() => {
    return filteredData.reduce(
      (acc, record) => ({
        baseImponible: acc.baseImponible + record.baseImponible,
        total: acc.total + record.total,
      }),
      { baseImponible: 0, total: 0 }
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

        <Button variant="outline" size="icon">
          <Download className="h-4 w-4" />
        </Button>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[100px]">Fecha</TableHead>
              <TableHead className="w-[120px]">Nº Factura</TableHead>
              <TableHead>{type === "customer" ? "Cliente" : "Proveedor"}</TableHead>
              <TableHead className="text-right">Base Imponible</TableHead>
              <TableHead className="text-center w-[80px]">IVA %</TableHead>
              <TableHead className="text-center w-[80px]">IRPF %</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-[120px]">Categoría</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="h-24 text-center text-muted-foreground"
                >
                  No se encontraron registros
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-mono text-sm">
                    {format(record.date, "dd/MM/yy", { locale: es })}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {record.invoiceNumber}
                  </TableCell>
                  <TableCell className="font-medium">{record.entityName}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(record.baseImponible)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="font-mono text-xs">
                      {record.ivaPercent}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className="font-mono text-xs text-destructive border-destructive/30"
                    >
                      {record.irpfPercent}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    {formatCurrency(record.total)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`text-xs ${
                        categoryColors[record.category] || categoryColors.Otros
                      }`}
                    >
                      {record.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
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
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
              <span className="text-muted-foreground">Base: </span>
              <span className="font-mono font-medium">
                {formatCurrency(summary.baseImponible)}
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

