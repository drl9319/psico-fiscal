"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { DataTable } from "@/components/dashboard/data-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { customerInvoices } from "@/lib/mock-data"
import { Euro, Receipt, TrendingUp, Users } from "lucide-react"

export default function CustomersPage() {
  const totalRevenue = customerInvoices.reduce(
    (sum, inv) => sum + inv.baseImponible,
    0
  )
  const uniqueClients = new Set(customerInvoices.map((inv) => inv.entityName))
    .size
  const totalInvoices = customerInvoices.length
  const avgInvoice = totalRevenue / totalInvoices

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
            <DataTable data={customerInvoices} type="customer" />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

