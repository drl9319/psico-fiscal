"use client"

import * as React from "react"
import { DateRange } from "react-day-picker"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { DateRangePicker } from "@/components/dashboard/date-range-picker"
import { KPICards } from "@/components/dashboard/kpi-cards"
import { AEATModels } from "@/components/dashboard/aeat-models"
import { calculateAEATData } from "@/lib/mock-data"

export default function DashboardPage() {
  const [year, setYear] = React.useState(new Date().getFullYear());
  const [quarter, setQuarter] = React.useState("Q1");
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

  const aeatData = calculateAEATData();

  // Update date range based on year and quarter
  React.useEffect(() => {
    const calculateQuarterDates = (year: number, quarter: string): DateRange => {
      let startMonth, endMonth;
      switch (quarter) {
        case "Q1":
          startMonth = 0; // January
          endMonth = 2; // March
          break;
        case "Q2":
          startMonth = 3; // April
          endMonth = 5; // June
          break;
        case "Q3":
          startMonth = 6; // July
          endMonth = 8; // September
          break;
        case "Q4":
          startMonth = 9; // October
          endMonth = 11; // December
          break;
        default:
          throw new Error("Invalid quarter");
      }

      const from = new Date(year, startMonth, 1);
      const to = new Date(year, endMonth + 1, 0);
      return { from, to };
    };

    setDateRange(calculateQuarterDates(year, quarter));
  }, [year, quarter]);

  // Format dates for API calls
  const startDate = dateRange?.from ? dateRange.from.toISOString().split("T")[0] : undefined;
  const endDate = dateRange?.to ? dateRange.to.toISOString().split("T")[0] : undefined;

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
          <div className="flex items-center gap-4">
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="border rounded px-2 py-1"
            >
              {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <select
              value={quarter}
              onChange={(e) => setQuarter(e.target.value)}
              className="border rounded px-2 py-1"
            >
              <option value="Q1">Q1</option>
              <option value="Q2">Q2</option>
              <option value="Q3">Q3</option>
              <option value="Q4">Q4</option>
            </select>
          </div>
        </div>

        <KPICards startDate={startDate} endDate={endDate} />

        <AEATModels data={aeatData} dateRange={dateRange} year={year} quarter={quarter} />
      </div>
    </DashboardLayout>
  );
}
