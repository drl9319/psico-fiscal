"use client"

import { useState, useEffect } from "react"
import { Calculator, FileText, Info, Search, Save, Settings } from "lucide-react"
import { apiClient } from "@/lib/api-client"

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
import { DateRange } from "react-day-picker"

interface Casillas130 {
  casilla01: number
  casilla02: number
  casilla03: number
  casilla04: number
  casilla05: number
  casilla06: number
  casilla07: number
  casilla19: number
}

interface Casillas303 {
  casilla150: number
  casilla152: number
  casilla14: number
  casilla15: number
  casilla28: number
  casilla29: number
  casilla40: number
  casilla41: number
}

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
  dateRange: DateRange | undefined
  year: number
  quarter: string
}

export function AEATModels({ data, dateRange, year, quarter }: AEATModelsProps & { year: number; quarter: string }) {
  const [ejercicio, setEjercicio] = useState(year ? year.toString() : new Date().getFullYear().toString())
  const [periodo, setPeriodo] = useState(quarter)

  // ── Modelo 130 state ──
  const [loading130, setLoading130] = useState(false)
  const [message130, setMessage130] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const [casillas130, setCasillas130] = useState<Casillas130>({
    casilla01: data.modelo130.casilla01,
    casilla02: data.modelo130.casilla02,
    casilla03: data.modelo130.casilla03,
    casilla04: data.modelo130.casilla04,
    casilla05: data.modelo130.casilla05,
    casilla06: data.modelo130.casilla06,
    casilla07: data.modelo130.casilla07,
    casilla19: data.modelo130.casilla19,
  })

  // ── Modelo 303 state ──
  const [loading303, setLoading303] = useState(false)
  const [message303, setMessage303] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const [casillas303, setCasillas303] = useState<Casillas303>({
    casilla150: 0,
    casilla152: 0,
    casilla14: 0,
    casilla15: 0,
    casilla28: 0,
    casilla29: 0,
    casilla40: 0,
    casilla41: 0,
  })

  // Reset when year/quarter changes
  useEffect(() => {
    if (year !== undefined && year !== null) {
      setEjercicio(year.toString())
    }
    if (quarter) {
      setPeriodo(quarter)
    }

    setCasillas130({
      casilla01: 0,
      casilla02: 0,
      casilla03: 0,
      casilla04: 0,
      casilla05: 0,
      casilla06: 0,
      casilla07: 0,
      casilla19: 0,
    })

    setCasillas303({
      casilla150: 0,
      casilla152: 0,
      casilla14: 0,
      casilla15: 0,
      casilla28: 0,
      casilla29: 0,
      casilla40: 0,
      casilla41: 0,
    })
  }, [year, quarter])

  useEffect(() => {
    console.log("Updated casillas130:", casillas130)
  }, [casillas130])

  useEffect(() => {
    console.log("Updated casillas303:", casillas303)
  }, [casillas303])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(amount)
  }

  // ══════════════════════════════════════════
  // Modelo 130 handlers
  // ══════════════════════════════════════════

  const handle130ConsultarDeclaracion = async () => {
    try {
      setLoading130(true)
      setMessage130(null)

      const response = await apiClient(`/get_modelo_130?ejercicio=${ejercicio}&periodo=${periodo}`)

      if (!response.ok) {
        throw new Error(`No se encontró declaración para ${ejercicio} - ${periodo}`)
      }

      const retrievedData = await response.json()

      setCasillas130({
        casilla01: retrievedData.Casilla01 || 0,
        casilla02: retrievedData.Casilla02 || 0,
        casilla03: retrievedData.Casilla03 || 0,
        casilla04: retrievedData.Casilla04 || 0,
        casilla05: retrievedData.Casilla05 || 0,
        casilla06: retrievedData.Casilla06 || 0,
        casilla07: retrievedData.Casilla07 || 0,
        casilla19: retrievedData.Casilla19 || 0,
      })

      setMessage130({ type: "success", text: `Declaración cargada para ${ejercicio} - ${periodo}` })
    } catch (error) {
      const errorText = error instanceof Error ? error.message : "Error al consultar"
      setMessage130({ type: "error", text: errorText })
    } finally {
      setLoading130(false)
    }
  }

  const handle130GuardarDeclaracion = async () => {
    try {
      setLoading130(true)
      setMessage130(null)

      const payload = {
        ejercicio,
        periodo,
        Casilla01: casillas130.casilla01,
        Casilla02: casillas130.casilla02,
        Casilla03: casillas130.casilla03,
        Casilla04: casillas130.casilla04,
        Casilla05: casillas130.casilla05,
        Casilla06: casillas130.casilla06,
        Casilla07: casillas130.casilla07,
        Casilla19: casillas130.casilla19,
      }

      const response = await apiClient("/save_modelo_130", {
        method: "POST",
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error("Error al guardar la declaración")
      }

      setMessage130({ type: "success", text: `Declaración guardada para ${ejercicio} - ${periodo}` })
    } catch (error) {
      const errorText = error instanceof Error ? error.message : "Error al guardar"
      setMessage130({ type: "error", text: errorText })
    } finally {
      setLoading130(false)
    }
  }

  const handle130CasillaChange = (casillaKey: keyof Casillas130, value: string) => {
    const numValue = parseFloat(value) || 0
    setCasillas130(prev => {
      const updated = { ...prev, [casillaKey]: numValue }

      if (casillaKey === "casilla01" || casillaKey === "casilla02") {
        const rendimientoNeto = updated.casilla01 - updated.casilla02
        const veintePorCiento = rendimientoNeto * 0.20
        // Casilla07 = Casilla04 (20%) - Casilla05 (De trimestres anteriores)
        const pagoFraccionado = veintePorCiento - updated.casilla05
        const resultadoAutoliquidacion = pagoFraccionado - updated.casilla06

        return {
          ...updated,
          casilla03: rendimientoNeto,
          casilla04: veintePorCiento,
          casilla07: pagoFraccionado,
          casilla19: resultadoAutoliquidacion,
        }
      }

      // When "05 De trimestres anteriores" changes, recalculate 07 and 19
      if (casillaKey === "casilla05") {
        const pagoFraccionado = updated.casilla04 - numValue
        const resultadoAutoliquidacion = pagoFraccionado - updated.casilla06

        return {
          ...updated,
          casilla07: pagoFraccionado,
          casilla19: resultadoAutoliquidacion,
        }
      }

      if (casillaKey === "casilla06") {
        return {
          ...updated,
          casilla19: updated.casilla07 - numValue,
        }
      }

      return updated
    })
  }

  const handle130CalcularModelo = async () => {
    try {
      setLoading130(true)
      setMessage130(null)

      const startDate = dateRange?.from ? dateRange.from.toISOString().split("T")[0] : undefined
      const endDate = dateRange?.to ? dateRange.to.toISOString().split("T")[0] : undefined

      if (!startDate || !endDate) {
        throw new Error("Rango de fechas inválido.")
      }

      const response = await apiClient(
        `/calculate_modelo_130?start_date=${startDate}&end_date=${endDate}`
      )

      if (!response.ok) {
        throw new Error("Error al calcular la declaración")
      }

      const calculatedData = await response.json()

      setCasillas130({
        casilla01: calculatedData.Casilla01 || 0,
        casilla02: calculatedData.Casilla02 || 0,
        casilla03: calculatedData.Casilla03 || 0,
        casilla04: calculatedData.Casilla04 || 0,
        casilla05: calculatedData.Casilla05 || 0,
        casilla06: calculatedData.Casilla06 || 0,
        casilla07: calculatedData.Casilla07 || 0,
        casilla19: calculatedData.Casilla19 || 0,
      })

      setMessage130({ type: "success", text: `Modelo 130 calculado para el rango seleccionado.` })
    } catch (error) {
      const errorText = error instanceof Error ? error.message : "Error al calcular"
      setMessage130({ type: "error", text: errorText })
    } finally {
      setLoading130(false)
    }
  }

  // ══════════════════════════════════════════
  // Modelo 303 handlers
  // ══════════════════════════════════════════

  const handle303ConsultarDeclaracion = async () => {
    try {
      setLoading303(true)
      setMessage303(null)

      const response = await apiClient(`/get_modelo_303?ejercicio=${ejercicio}&periodo=${periodo}`)

      if (!response.ok) {
        throw new Error(`No se encontró declaración 303 para ${ejercicio} - ${periodo}`)
      }

      const retrievedData = await response.json()

      setCasillas303({
        casilla150: retrievedData.casilla150 || 0,
        casilla152: retrievedData.casilla152 || 0,
        casilla14: retrievedData.casilla14 || 0,
        casilla15: retrievedData.casilla15 || 0,
        casilla28: retrievedData.casilla28 || 0,
        casilla29: retrievedData.casilla29 || 0,
        casilla40: retrievedData.casilla40 || 0,
        casilla41: retrievedData.casilla41 || 0,
      })

      setMessage303({ type: "success", text: `Modelo 303 cargado para ${ejercicio} - ${periodo}` })
    } catch (error) {
      const errorText = error instanceof Error ? error.message : "Error al consultar"
      setMessage303({ type: "error", text: errorText })
    } finally {
      setLoading303(false)
    }
  }

  const handle303CalcularModelo = async () => {
    try {
      setLoading303(true)
      setMessage303(null)

      const startDate = dateRange?.from ? dateRange.from.toISOString().split("T")[0] : undefined
      const endDate = dateRange?.to ? dateRange.to.toISOString().split("T")[0] : undefined

      if (!startDate || !endDate) {
        throw new Error("Rango de fechas inválido.")
      }

      const response = await apiClient(
        `/calculate_modelo_303?start_date=${startDate}&end_date=${endDate}`
      )

      if (!response.ok) {
        throw new Error("Error al calcular el modelo 303")
      }

      const calculatedData = await response.json()

      setCasillas303({
        casilla150: calculatedData.casilla150 || 0,
        casilla152: calculatedData.casilla152 || 0,
        casilla14: calculatedData.casilla14 || 0,
        casilla15: calculatedData.casilla15 || 0,
        casilla28: calculatedData.casilla28 || 0,
        casilla29: calculatedData.casilla29 || 0,
        casilla40: calculatedData.casilla40 || 0,
        casilla41: calculatedData.casilla41 || 0,
      })

      setMessage303({ type: "success", text: `Modelo 303 calculado para el rango seleccionado.` })
    } catch (error) {
      const errorText = error instanceof Error ? error.message : "Error al calcular"
      setMessage303({ type: "error", text: errorText })
    } finally {
      setLoading303(false)
    }
  }

  const handle303GuardarDeclaracion = async () => {
    try {
      setLoading303(true)
      setMessage303(null)

      const payload = {
        ejercicio,
        periodo,
        casilla150: casillas303.casilla150,
        casilla152: casillas303.casilla152,
        casilla14: casillas303.casilla14,
        casilla15: casillas303.casilla15,
        casilla28: casillas303.casilla28,
        casilla29: casillas303.casilla29,
        casilla40: casillas303.casilla40,
        casilla41: casillas303.casilla41,
      }

      const response = await apiClient("/save_modelo_303", {
        method: "POST",
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error("Error al guardar el modelo 303")
      }

      setMessage303({ type: "success", text: `Modelo 303 guardado para ${ejercicio} - ${periodo}` })
    } catch (error) {
      const errorText = error instanceof Error ? error.message : "Error al guardar"
      setMessage303({ type: "error", text: errorText })
    } finally {
      setLoading303(false)
    }
  }

  const handle303CasillaChange = (casillaKey: keyof Casillas303, value: string) => {
    const numValue = parseFloat(value) || 0
    setCasillas303(prev => ({ ...prev, [casillaKey]: numValue }))
  }

  const getQuarterDates = (year: string, quarter: string) => {
    let startMonth, endMonth
    switch (quarter) {
      case "01":
      case "1T":
        startMonth = 0
        endMonth = 2
        break
      case "02":
      case "2T":
        startMonth = 3
        endMonth = 5
        break
      case "03":
      case "3T":
        startMonth = 6
        endMonth = 8
        break
      case "04":
      case "4T":
        startMonth = 9
        endMonth = 11
        break
      default:
        throw new Error("Periodo inválido. Use 01, 02, 03, 04 o 1T, 2T, 3T, 4T.")
    }

    const startDate = new Date(parseInt(year), startMonth, 1)
    const endDate = new Date(parseInt(year), endMonth + 1, 0)

    return {
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
    }
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

        <div className="space-y-8">
          {/* ════════════════════════════════════════
              Modelo 130
              ════════════════════════════════════════ */}
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
                    onClick={handle130ConsultarDeclaracion}
                    disabled={loading130}
                    className="flex-1"
                  >
                    <Search className="mr-2 h-3.5 w-3.5" />
                    Consultar declaración
                  </Button>
                  <Button
                    size="sm"
                    onClick={handle130CalcularModelo}
                    disabled={loading130}
                    className="flex-1"
                  >
                    <Settings className="mr-2 h-3.5 w-3.5" />
                    Calcular modelo
                  </Button>
                  <Button
                    size="sm"
                    onClick={handle130GuardarDeclaracion}
                    disabled={loading130}
                    className="flex-1"
                  >
                    <Save className="mr-2 h-3.5 w-3.5" />
                    Guardar declaración
                  </Button>
                </div>

                {message130 && (
                  <div
                    className={`rounded-lg p-2.5 text-xs font-medium ${
                      message130.type === "success"
                        ? "bg-success/10 text-success"
                        : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {message130.text}
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
                    value={casillas130.casilla01}
                    onChange={(e) => handle130CasillaChange("casilla01", e.target.value)}
                    className="h-8 w-24 text-right text-sm"
                    disabled={loading130}
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
                    value={casillas130.casilla02}
                    onChange={(e) => handle130CasillaChange("casilla02", e.target.value)}
                    className="h-8 w-24 text-right text-sm"
                    disabled={loading130}
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
                    {formatCurrency(casillas130.casilla03)}
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
                    {formatCurrency(casillas130.casilla04)}
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
                    value={casillas130.casilla05}
                    onChange={(e) => handle130CasillaChange("casilla05", e.target.value)}
                    className="h-8 w-24 text-right text-sm"
                    disabled={loading130}
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
                    value={casillas130.casilla06}
                    onChange={(e) => handle130CasillaChange("casilla06", e.target.value)}
                    className="h-8 w-24 text-right text-sm"
                    disabled={loading130}
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
                    {formatCurrency(casillas130.casilla07)}
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
                    {formatCurrency(casillas130.casilla19)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ════════════════════════════════════════
              Modelo 303
              ════════════════════════════════════════ */}
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
              {/* Header / buttons */}
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
                    onClick={handle303ConsultarDeclaracion}
                    disabled={loading303}
                    className="flex-1"
                  >
                    <Search className="mr-2 h-3.5 w-3.5" />
                    Consultar declaración
                  </Button>
                  <Button
                    size="sm"
                    onClick={handle303CalcularModelo}
                    disabled={loading303}
                    className="flex-1"
                  >
                    <Settings className="mr-2 h-3.5 w-3.5" />
                    Calcular modelo
                  </Button>
                  <Button
                    size="sm"
                    onClick={handle303GuardarDeclaracion}
                    disabled={loading303}
                    className="flex-1"
                  >
                    <Save className="mr-2 h-3.5 w-3.5" />
                    Guardar declaración
                  </Button>
                </div>

                {message303 && (
                  <div
                    className={`rounded-lg p-2.5 text-xs font-medium ${
                      message303.type === "success"
                        ? "bg-success/10 text-success"
                        : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {message303.text}
                  </div>
                )}
              </div>

              {/* ── IVA DEVENGADO ── */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  <span className="h-px flex-1 bg-border"></span>
                  IVA DEVENGADO
                  <span className="h-px flex-1 bg-border"></span>
                </div>

                {/* General 0% */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded bg-accent/10 text-xs font-semibold text-accent">
                        150
                      </span>
                      <span className="text-sm">General 0% - Base</span>
                    </div>
                    <Input
                      type="number"
                      value={casillas303.casilla150}
                      onChange={(e) => handle303CasillaChange("casilla150", e.target.value)}
                      className="h-8 w-20 text-right text-sm"
                      disabled={loading303}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded bg-accent/10 text-xs font-semibold text-accent">
                        152
                      </span>
                      <span className="text-sm">General 0% - Cuota</span>
                    </div>
                    <Input
                      type="number"
                      value={casillas303.casilla152}
                      onChange={(e) => handle303CasillaChange("casilla152", e.target.value)}
                      className="h-8 w-20 text-right text-sm"
                      disabled={loading303}
                    />
                  </div>
                </div>

                {/* Modificación bases */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded bg-accent/10 text-xs font-semibold text-accent">
                        14
                      </span>
                      <span className="text-sm">Modificación bases - Base</span>
                    </div>
                    <Input
                      type="number"
                      value={casillas303.casilla14}
                      onChange={(e) => handle303CasillaChange("casilla14", e.target.value)}
                      className="h-8 w-20 text-right text-sm"
                      disabled={loading303}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded bg-accent/10 text-xs font-semibold text-accent">
                        15
                      </span>
                      <span className="text-sm">Modificación bases - Cuota</span>
                    </div>
                    <Input
                      type="number"
                      value={casillas303.casilla15}
                      onChange={(e) => handle303CasillaChange("casilla15", e.target.value)}
                      className="h-8 w-20 text-right text-sm"
                      disabled={loading303}
                    />
                  </div>
                </div>
              </div>

              {/* ── IVA DEDUCIBLE ── */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  <span className="h-px flex-1 bg-border"></span>
                  IVA DEDUCIBLE
                  <span className="h-px flex-1 bg-border"></span>
                </div>

                {/* Interiores corrientes */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded bg-accent/10 text-xs font-semibold text-accent">
                        28
                      </span>
                      <span className="text-sm">Interiores corrientes - Base</span>
                    </div>
                    <Input
                      type="number"
                      value={casillas303.casilla28}
                      onChange={(e) => handle303CasillaChange("casilla28", e.target.value)}
                      className="h-8 w-20 text-right text-sm"
                      disabled={loading303}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded bg-accent/10 text-xs font-semibold text-accent">
                        29
                      </span>
                      <span className="text-sm">Interiores corrientes - Cuota</span>
                    </div>
                    <Input
                      type="number"
                      value={casillas303.casilla29}
                      onChange={(e) => handle303CasillaChange("casilla29", e.target.value)}
                      className="h-8 w-20 text-right text-sm"
                      disabled={loading303}
                    />
                  </div>
                </div>

                {/* Modificación bases */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded bg-accent/10 text-xs font-semibold text-accent">
                        40
                      </span>
                      <span className="text-sm">Modificación bases - Base</span>
                    </div>
                    <Input
                      type="number"
                      value={casillas303.casilla40}
                      onChange={(e) => handle303CasillaChange("casilla40", e.target.value)}
                      className="h-8 w-20 text-right text-sm"
                      disabled={loading303}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded bg-accent/10 text-xs font-semibold text-accent">
                        41
                      </span>
                      <span className="text-sm">Modificación bases - Cuota</span>
                    </div>
                    <Input
                      type="number"
                      value={casillas303.casilla41}
                      onChange={(e) => handle303CasillaChange("casilla41", e.target.value)}
                      className="h-8 w-20 text-right text-sm"
                      disabled={loading303}
                    />
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
