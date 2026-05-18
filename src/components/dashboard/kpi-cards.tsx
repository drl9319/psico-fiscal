"use client"

import { useEffect, useState } from "react"
import { Percent, TrendingDown, TrendingUp } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface InvoiceSummary {
  total_amount: number
  total_tax: number
  total_revenue: number
  invoice_count: number
  start_date: string
  end_date: string
}

interface KPIData {
  totalIngresos: number
  totalGastos: number
  irpfRetenido: number
}

interface KPICardsProps {
  startDate?: string
  endDate?: string
}

export function KPICards({ startDate, endDate }: KPICardsProps) {
  const [data, setData] = useState<KPIData>({
    totalIngresos: 0,
    totalGastos: 0,
    irpfRetenido: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchKPIData = async () => {
      try {
        setLoading(true)
        setError(null)

        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"

        // Default to current month if dates not provided
        const now = new Date()
        const defaultStartDate = startDate || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`
        const defaultEndDate =
          endDate ||
          new Date(now.getFullYear(), now.getMonth() + 1, 0)
            .toISOString()
            .split("T")[0]

        // Fetch customer invoices summary
        const customerRes = await fetch(
          `${apiBaseUrl}/customer_invoices_summary?start_date=${defaultStartDate}&end_date=${defaultEndDate}`
        )
        const customerData: InvoiceSummary = await customerRes.json()

        // Fetch supplier invoices summary
        const supplierRes = await fetch(
          `${apiBaseUrl}/supplier_invoices_summary?start_date=${defaultStartDate}&end_date=${defaultEndDate}`
        )
        const supplierData: InvoiceSummary = await supplierRes.json()

        setData({
          totalIngresos: Number(customerData.total_revenue) || 0,
          totalGastos: Number(supplierData.total_revenue) || 0,
          irpfRetenido: Number(customerData.total_tax) || 0,
        })
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Error al cargar KPIs"
        setError(errorMessage)
        console.error("Error fetching KPI data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchKPIData()
  }, [startDate, endDate])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(amount)
  }

  const kpis = [
    {
      title: "Total Ingresos",
      value: formatCurrency(data.totalIngresos),
      icon: TrendingUp,
      description: "Ventas del período",
      trend: "+12.5%",
      trendUp: true,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Total Gastos",
      value: formatCurrency(data.totalGastos),
      icon: TrendingDown,
      description: "Gastos deducibles",
      trend: "+3.2%",
      trendUp: false,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      title: "IRPF Retenido",
      value: formatCurrency(data.irpfRetenido),
      icon: Percent,
      description: "Retenciones acumuladas",
      trend: "15%",
      trendUp: null,
      color: "text-info",
      bgColor: "bg-info/10",
    },
  ]

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground animate-pulse">
                Cargando...
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
        <p className="font-semibold">Error al cargar KPIs:</p>
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {kpis.map((kpi) => (
        <Card key={kpi.title} className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {kpi.title}
            </CardTitle>
            <div className={`rounded-lg p-2 ${kpi.bgColor}`}>
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpi.value}</div>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-muted-foreground">{kpi.description}</p>
              {kpi.trendUp !== null && (
                <span
                  className={`text-xs font-medium ${
                    kpi.trendUp ? "text-success" : "text-destructive"
                  }`}
                >
                  {kpi.trend}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

