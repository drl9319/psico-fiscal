"use client"

import * as React from "react"
import { DateRange } from "react-day-picker"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { DateRangePicker } from "@/components/dashboard/date-range-picker"
import { KPICards } from "@/components/dashboard/kpi-cards"
import { AEATModels } from "@/components/dashboard/aeat-models"
import { calculateAEATData } from "@/lib/mock-data"

export default function DashboardPage() {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(() => {
  const ahora = new Date();
  const añoActual = ahora.getFullYear();
  const mesActual = ahora.getMonth(); // 0 = Enero, 11 = Diciembre

  // Calculamos en qué trimestre estamos (0, 1, 2 o 3)
  const trimestreActual = Math.floor(mesActual / 3);

  // El mes de inicio siempre será 0 (Ene), 3 (Abr), 6 (Jul) o 9 (Oct)
  const mesInicio = trimestreActual * 3;
  
  // El mes de fin del trimestre será 2 (Mar), 5 (Jun), 8 (Sep) o 11 (Dic)
  const mesFin = mesInicio + 2;

  // Creamos el primer día del trimestre (Ej: 01/04/2026)
  const from = new Date(añoActual, mesInicio, 1);
  
  // Creamos el último día del trimestre poniendo día "0" del mes siguiente (Ej: 0 de Julio = 30 de Junio)
  const to = new Date(añoActual, mesFin + 1, 0);

  return { from, to };
});

  const aeatData = calculateAEATData()

  // Format dates for API calls
  const startDate = dateRange?.from ? dateRange.from.toISOString().split("T")[0] : undefined
  const endDate = dateRange?.to ? dateRange.to.toISOString().split("T")[0] : undefined

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

        <KPICards startDate={startDate} endDate={endDate} />

        <AEATModels data={aeatData} dateRange={dateRange} />
      </div>
    </DashboardLayout>
  )
}
