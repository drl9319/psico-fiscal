"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { DataTable } from "@/components/dashboard/data-table"
import type { InvoiceRecord } from "@/components/dashboard/data-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { customerInvoices } from "@/lib/mock-data"
import { Euro, Receipt, TrendingUp, Users } from "lucide-react"
import { useEffect, useState } from "react"

interface BackendInvoice {
  accounting_date: string; // Cambiado de accounting_date
  customer_name: string;   // Cambiado de customer_name
  customer_id: string;     // Cambiado de customer_id
  customer_address: string;// Cambiado de customer_address
  amount: number;          // Cambiado de base
  tax: number;
  tax_percent: number;
  total: number;
  retencion: number;
  retencion_percent: number;
  invoice_number: string;
}

export default function CustomersPage() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Transform backend response to frontend format
  const transformInvoice = (CustomerInvoiceSchema: BackendInvoice, index: number): InvoiceRecord => {
    
    return {
      id: CustomerInvoiceSchema.id || `inv-${index}`,
      accounting_date: new Date(CustomerInvoiceSchema.accounting_date),
      invoice_number: CustomerInvoiceSchema.invoice_number || `INV-${index + 1}`,
      supplier_name: CustomerInvoiceSchema.customer_name,
      baseImponible: CustomerInvoiceSchema.amount,
      taxAmount: CustomerInvoiceSchema.tax,
      taxPercent: CustomerInvoiceSchema.tax_percent || 0,
      retencionAmount: CustomerInvoiceSchema.retencion,
      retencionPercent: CustomerInvoiceSchema.retencion_percent || 0,
      total: CustomerInvoiceSchema.total,
      category: "Otros", // Ajustar si hay categorías específicas
      fileName: "N/A", // Asignar un valor adecuado si está disponible
      status: "Validado", // Asignar un valor adecuado si está disponible
      customer_id: CustomerInvoiceSchema.customer_id || "N/A",
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`${apiBaseUrl}/get_customer_invoices?limit=50`)
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
  const dataSource = invoices.length > 0 ? invoices : customerInvoices
  const toNumber = (v: unknown) =>
    typeof v === "number" ? v : Number(String(v ?? "0").replace(",", ".")) || 0

  const totalRevenue = dataSource.reduce(
    (sum, inv) => sum + toNumber((inv as any).baseImponible),
    0
  )
  const uniqueClients = new Set(dataSource.map((inv) => inv.supplier_name || inv.customer_name || inv.entityName))
    .size
  const totalInvoices = dataSource.length
  const avgInvoice = totalInvoices > 0 ? totalRevenue / totalInvoices : 0

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(amount)
  }

  const stats = [
    {
      title: "Ingresos Totales",
      value: formatCurrency(totalRevenue),
      icon: Euro,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Clientes Únicos",
      value: uniqueClients.toString(),
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Facturas Emitidas",
      value: totalInvoices.toString(),
      icon: Receipt,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Media por Factura",
      value: formatCurrency(avgInvoice),
      icon: TrendingUp,
      color: "text-info",
      bgColor: "bg-info/10",
    },
  ]

  return (
    <DashboardLayout
      title="Clientes (Ventas)"
      description="Gestión de facturas emitidas y registro de ingresos"
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
            <CardTitle className="text-base">Registro de Facturas</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <p className="text-muted-foreground">Cargando facturas...</p>
              </div>
            ) : (
              <DataTable data={invoices} type="customer" />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

