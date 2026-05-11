"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { DataTable } from "@/components/dashboard/data-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supplierInvoices } from "@/lib/mock-data"
import { Building2, Percent, Receipt, TrendingDown } from "lucide-react"

export default function SuppliersPage() {
  const totalExpenses = supplierInvoices.reduce(
    (sum, inv) => sum + inv.baseImponible,
    0
  )
  const uniqueSuppliers = new Set(supplierInvoices.map((inv) => inv.entityName))
    .size
  const totalInvoices = supplierInvoices.length
  const totalIVADeductible = supplierInvoices.reduce(
    (sum, inv) => sum + (inv.baseImponible * inv.ivaPercent) / 100,
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
      title: "customer_namees",
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
      title="customer_namees (Gastos)"
      description="Gestión de facturas recibidas y gastos deducibles"
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
            <CardTitle className="text-base">Registro de Gastos</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable data={supplierInvoices} type="supplier" />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

