"use client"

import { Calculator, FileText, Info } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface AEATData {
  modelo130: {
    casilla01: number
    casilla02: number
    casilla03: number
  }
  modelo303: {
    sales: {
      casilla01: number
      casilla07: number
    }
    expenses: {
      casilla28: number
      casilla30: number
      casilla31: number
    }
  }
}

interface AEATModelsProps {
  data: AEATData
}

export function AEATModels({ data }: AEATModelsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(amount)
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Asistente AEAT</h2>
          <Badge variant="secondary" className="text-xs">
            Trimestral
          </Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base">Modelo 130</CardTitle>
                </div>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-xs">
                      Pago fraccionado IRPF para profesionales en estimación
                      directa
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <CardDescription className="text-xs">
                Pago Fraccionado IRPF - Actividades Profesionales
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2">
                <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-xs font-semibold text-primary">
                      01
                    </span>
                    <span className="text-sm">Ingresos</span>
                  </div>
                  <span className="font-mono text-sm font-medium">
                    {formatCurrency(data.modelo130.casilla01)}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-xs font-semibold text-primary">
                      02
                    </span>
                    <span className="text-sm">Gastos</span>
                  </div>
                  <span className="font-mono text-sm font-medium text-destructive">
                    {formatCurrency(data.modelo130.casilla02)}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-primary/5 px-3 py-2 border border-primary/20">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded bg-primary text-xs font-semibold text-primary-foreground">
                      03
                    </span>
                    <span className="text-sm font-medium">
                      Rendimiento Neto
                    </span>
                  </div>
                  <span className="font-mono text-sm font-bold text-primary">
                    {formatCurrency(data.modelo130.casilla03)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-accent">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-accent" />
                  <CardTitle className="text-base">Modelo 303</CardTitle>
                </div>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-xs">
                      Autoliquidación trimestral del IVA
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <CardDescription className="text-xs">
                Autoliquidación IVA - Régimen General
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  <span className="h-px flex-1 bg-border"></span>
                  Ventas (IVA Repercutido)
                  <span className="h-px flex-1 bg-border"></span>
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded bg-accent/10 text-xs font-semibold text-accent">
                        01
                      </span>
                      <span className="text-sm">Base Imponible</span>
                    </div>
                    <span className="font-mono text-sm font-medium">
                      {formatCurrency(data.modelo303.sales.casilla01)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded bg-accent/10 text-xs font-semibold text-accent">
                        07
                      </span>
                      <span className="text-sm">Cuota IVA</span>
                    </div>
                    <span className="font-mono text-sm font-medium">
                      {formatCurrency(data.modelo303.sales.casilla07)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  <span className="h-px flex-1 bg-border"></span>
                  Compras (IVA Soportado)
                  <span className="h-px flex-1 bg-border"></span>
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded bg-accent/10 text-xs font-semibold text-accent">
                        28
                      </span>
                      <span className="text-sm">Base Imponible</span>
                    </div>
                    <span className="font-mono text-sm font-medium">
                      {formatCurrency(data.modelo303.expenses.casilla28)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded bg-accent/10 text-xs font-semibold text-accent">
                        30
                      </span>
                      <span className="text-sm">Cuota IVA</span>
                    </div>
                    <span className="font-mono text-sm font-medium">
                      {formatCurrency(data.modelo303.expenses.casilla30)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-accent/5 px-3 py-2 border border-accent/20">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded bg-accent text-xs font-semibold text-accent-foreground">
                        31
                      </span>
                      <span className="text-sm font-medium">Cuota Deducible</span>
                    </div>
                    <span className="font-mono text-sm font-bold text-accent">
                      {formatCurrency(data.modelo303.expenses.casilla31)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  )
}

