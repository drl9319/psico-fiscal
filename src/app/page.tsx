"use client"

import * as React from "react"
import { DateRange } from "react-day-picker"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { DateRangePicker } from "@/components/dashboard/date-range-picker"
import { KPICards } from "@/components/dashboard/kpi-cards"
import { AEATModels } from "@/components/dashboard/aeat-models"
import { calculateAEATData, calculateKPIs } from "@/lib/mock-data"

export default function DashboardPage() {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: new Date(2024, 0, 1),
    to: new Date(2024, 2, 31),
  })

  const kpiData = calculateKPIs()
  const aeatData = calculateAEATData()

  return (
    <DashboardLayout
      title="Dashboard"
      description="Resumen fiscal del período seleccionado"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-muted-foreground">
              Período Fiscal
            </h2>
          </div>
          <DateRangePicker date={dateRange} onDateChange={setDateRange} />
        </div>

        <KPICards data={kpiData} />

        <AEATModels data={aeatData} />
      </div>
    </DashboardLayout>
  )
}
