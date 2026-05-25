"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { DataTable } from "@/components/dashboard/data-table"
import type { InvoiceRecord } from "@/components/dashboard/data-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supplierInvoices } from "@/lib/mock-data"
import { Building2, Percent, Receipt, TrendingDown } from "lucide-react"
import { useEffect, useState } from "react"

interface BackendInvoice {
  accounting_date: string
  supplier_name: string
  supplier_id: string
  supplier_address: string
  amount: number
  tax: number
  tax_percent: number
  total: number
  retencion: number
  retencion_percent: number
  invoice_number: string
}

export default function SuppliersPage() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Transform backend response to frontend format
  const transformInvoice = (supplierInvoice: BackendInvoice, index: number): InvoiceRecord => {
    return {
      id: supplierInvoice.id || `inv-${index}`,
      accounting_date: new Date(supplierInvoice.accounting_date),
      invoice_number: supplierInvoice.invoice_number || `INV-${index + 1}`,
      supplier_name: supplierInvoice.supplier_name,
      supplier_id: supplierInvoice.supplier_id,
      supplier_address: supplierInvoice.supplier_address,
      baseImponible: supplierInvoice.amount,
      taxAmount: supplierInvoice.tax,
      taxPercent: supplierInvoice.tax_percent || 0,
      retencionAmount: supplierInvoice.retencion,
      retencionPercent: supplierInvoice.retencion_percent || 0,
      total: supplierInvoice.total,
      category: "Otros",
      fileName: "N/A",
      status: "Validado",
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`${apiBaseUrl}/get_supplier_invoices?limit=50`)
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      
      const data: BackendInvoice[] = await response.json()
      const transformedInvoices = data.map(transformInvoice)
      setInvoices(transformedInvoices)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al cargar facturas"
      setError(errorMessage)
      console.error("Error fetching invoices:", err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch data on component mount
  useEffect(() => {
    fetchData()
  }, [apiBaseUrl])

  // Calculate stats from fetched data or mock data (fallback)
  const dataSource = invoices.length > 0 ? invoices : supplierInvoices

  const toNumber = (v: unknown) =>
    typeof v === "number" ? v : Number(String(v ?? "0").replace(",", ".")) || 0
  const totalExpenses = dataSource.reduce(
    (sum, inv) => sum + toNumber((inv as any).baseImponible),
    0
  )

  const uniqueSuppliers = new Set(dataSource.map((inv) => inv.supplier_name))
    .size
  const totalInvoices = dataSource.length
  const totalIVADeductible = dataSource.reduce(
    (sum, inv) => sum + toNumber((inv as any).taxAmount),
    0
  )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(amount)
  }

  const stats = [
    {
      title: "Gastos Totales",
      value: formatCurrency(totalExpenses),
      icon: TrendingDown,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      title: "Facturas de proveedores",
      value: uniqueSuppliers.toString(),
      icon: Building2,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Facturas Recibidas",
      value: totalInvoices.toString(),
      icon: Receipt,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "IVA Deducible",
      value: formatCurrency(totalIVADeductible),
      icon: Percent,
      color: "text-success",
      bgColor: "bg-success/10",
    },
  ]

  return (
    <DashboardLayout
      title="Proveedores (Gastos)"
      description="Gestión de facturas recibidas y gastos deducibles"
    >
      <div className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
            <p className="font-semibold">Error al cargar datos:</p>
            <p>{error}</p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className={`rounded-lg p-2.5 ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.title}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Registro de Gastos</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <p className="text-muted-foreground">Cargando facturas...</p>
              </div>
            ) : (
              <DataTable data={dataSource} type="supplier" />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

