"use client"

import { Percent, TrendingDown, TrendingUp } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface KPIData {
  totalIngresos: number
  totalGastos: number
  irpfRetenido: number
}

interface KPICardsProps {
  data: KPIData
}

export function KPICards({ data }: KPICardsProps) {
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

