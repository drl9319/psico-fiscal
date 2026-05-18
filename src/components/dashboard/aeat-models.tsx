"use client"

import { useState } from "react"
import { Calculator, FileText, Info, Search, Save } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
    casilla04: number
    casilla05: number
    casilla06: number
    casilla07: number
    casilla19: number
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
  const [ejercicio, setEjercicio] = useState("2026")
  const [periodo, setPeriodo] = useState("01")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  
  // Form state for casillas
  const [casillas, setCasillas] = useState({
    casilla01: data.modelo130.casilla01,
    casilla02: data.modelo130.casilla02,
    casilla03: data.modelo130.casilla03,
    casilla04: data.modelo130.casilla04,
    casilla05: data.modelo130.casilla05,
    casilla06: data.modelo130.casilla06,
    casilla07: data.modelo130.casilla07,
    casilla19: data.modelo130.casilla19,
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(amount)
  }

  const handleConsultarDeclaracion = async () => {
    try {
      setLoading(true)
      setMessage(null)
      
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"
      const response = await fetch(`${apiBaseUrl}/get_modelo_130?ejercicio=${ejercicio}&periodo=${periodo}`)
      
      if (!response.ok) {
        throw new Error(`No se encontró declaración para ${ejercicio} - ${periodo}`)
      }
      
      const retrievedData = await response.json()
      
      // Update form with retrieved data
      setCasillas({
        casilla01: retrievedData.casilla01 || 0,
        casilla02: retrievedData.casilla02 || 0,
        casilla03: retrievedData.casilla03 || 0,
        casilla04: retrievedData.casilla04 || 0,
        casilla05: retrievedData.casilla05 || 0,
        casilla06: retrievedData.casilla06 || 0,
        casilla07: retrievedData.casilla07 || 0,
        casilla19: retrievedData.casilla19 || 0,
      })
      
      setMessage({ type: "success", text: `Declaración cargada para ${ejercicio} - ${periodo}` })
    } catch (error) {
      const errorText = error instanceof Error ? error.message : "Error al consultar"
      setMessage({ type: "error", text: errorText })
    } finally {
      setLoading(false)
    }
  }

  const handleGuardarDeclaracion = async () => {
    try {
      setLoading(true)
      setMessage(null)
      
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"
      
      const payload = {
        ejercicio,
        periodo,
        casilla01: casillas.casilla01,
        casilla02: casillas.casilla02,
        casilla03: casillas.casilla03,
        casilla04: casillas.casilla04,
        casilla05: casillas.casilla05,
        casilla06: casillas.casilla06,
        casilla07: casillas.casilla07,
        casilla19: casillas.casilla19,
      }
      
      const response = await fetch(`${apiBaseUrl}/save_modelo_130`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      
      if (!response.ok) {
        throw new Error("Error al guardar la declaración")
      }
      
      setMessage({ type: "success", text: `Declaración guardada para ${ejercicio} - ${periodo}` })
    } catch (error) {
      const errorText = error instanceof Error ? error.message : "Error al guardar"
      setMessage({ type: "error", text: errorText })
    } finally {
      setLoading(false)
    }
  }

  const handleCasillaChange = (casillaKey: keyof typeof casillas, value: string) => {
    const numValue = parseFloat(value) || 0
    setCasillas(prev => ({
      ...prev,
      [casillaKey]: numValue,
    }))
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
              <div className="space-y-3 rounded-lg border border-border/50 bg-muted/30 p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Ejercicio (EJ: 2026)
                    </label>
                    <Input
                      type="text"
                      value={ejercicio}
                      onChange={(e) => setEjercicio(e.target.value)}
                      placeholder="2026"
                      maxLength={4}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Período (EJ: 2T)
                    </label>
                    <Input
                      type="text"
                      value={periodo}
                      onChange={(e) => setPeriodo(e.target.value)}
                      placeholder="01"
                      maxLength={2}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleConsultarDeclaracion}
                    disabled={loading}
                    className="flex-1"
                  >
                    <Search className="mr-2 h-3.5 w-3.5" />
                    Consultar declaración
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleGuardarDeclaracion}
                    disabled={loading}
                    className="flex-1"
                  >
                    <Save className="mr-2 h-3.5 w-3.5" />
                    Guardar declaración
                  </Button>
                </div>

                {message && (
                  <div
                    className={`rounded-lg p-2.5 text-xs font-medium ${
                      message.type === "success"
                        ? "bg-success/10 text-success"
                        : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {message.text}
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-xs font-semibold text-primary">
                      01
                    </span>
                    <span className="text-sm">Ingresos</span>
                  </div>
                  <Input
                    type="number"
                    value={casillas.casilla01}
                    onChange={(e) => handleCasillaChange("casilla01", e.target.value)}
                    className="h-8 w-24 text-right text-sm"
                    disabled={loading}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-xs font-semibold text-primary">
                      02
                    </span>
                    <span className="text-sm">Gastos</span>
                  </div>
                  <Input
                    type="number"
                    value={casillas.casilla02}
                    onChange={(e) => handleCasillaChange("casilla02", e.target.value)}
                    className="h-8 w-24 text-right text-sm"
                    disabled={loading}
                  />
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
                    {formatCurrency(casillas.casilla03)}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-xs font-semibold text-primary">
                      04
                    </span>
                    <span className="text-sm">20% importe casilla 03</span>
                  </div>
                  <span className="font-mono text-sm font-medium">
                    {formatCurrency(casillas.casilla04)}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-xs font-semibold text-primary">
                      05
                    </span>
                    <span className="text-sm">De trimestres anteriores</span>
                  </div>
                  <Input
                    type="number"
                    value={casillas.casilla05}
                    onChange={(e) => handleCasillaChange("casilla05", e.target.value)}
                    className="h-8 w-24 text-right text-sm"
                    disabled={loading}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-xs font-semibold text-primary">
                      06
                    </span>
                    <span className="text-sm">Retenciones e ingresos a cuenta</span>
                  </div>
                  <Input
                    type="number"
                    value={casillas.casilla06}
                    onChange={(e) => handleCasillaChange("casilla06", e.target.value)}
                    className="h-8 w-24 text-right text-sm"
                    disabled={loading}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg bg-primary/5 px-3 py-2 border border-primary/20">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded bg-primary text-xs font-semibold text-primary-foreground">
                      07
                    </span>
                    <span className="text-sm font-medium">
                      Pago fraccionado previo
                    </span>
                  </div>
                  <span className="font-mono text-sm font-bold text-primary">
                    {formatCurrency(casillas.casilla07)}
                  </span>
                </div>
              </div>
              <div>
               <div className="flex items-center justify-between rounded-lg bg-primary/5 px-3 py-2 border border-primary/20">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded bg-primary text-xs font-semibold text-primary-foreground">
                      19
                    </span>
                    <span className="text-sm font-medium">
                      Resultado de la autoliquidación ( 17 – 18 )
                    </span>
                  </div>
                  <span className="font-mono text-sm font-bold text-primary">
                    {formatCurrency(casillas.casilla19)}
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

