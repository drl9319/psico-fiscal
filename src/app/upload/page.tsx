"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { UploadZone } from "@/components/dashboard/upload-zone"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Sparkles, Zap } from "lucide-react"

export default function UploadPage() {
  return (
    <DashboardLayout
      title="Centro de Subida"
      description="Sube facturas y registros para procesamiento automático con IA"
    >
      <div className="space-y-6">
        <Card className="bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 border-primary/20">
          <CardContent className="flex items-center gap-6 py-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Procesamiento Inteligente con IA</h3>
              <p className="text-sm text-muted-foreground">
                Extracción automática de datos, categorización y verificación de
                errores
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary" className="gap-1">
                <Zap className="h-3 w-3" />
                OCR Avanzado
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <Shield className="h-3 w-3" />
                Validación AEAT
              </Badge>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <UploadZone
            title="Facturas de proveedores"
            description="Sube las facturas recibidas de tus proveedores (PDF)"
            acceptedTypes={[".pdf"]}
            icon="pdf"
          />
          <UploadZone
            title="Facturas de Clientes"
            description="Sube las facturas emitidas a tus pacientes y clientes (Excel, CSV)"
            acceptedTypes={[".xlsx", ".xls", ".csv"]}
            icon="excel"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Estadísticas de Procesamiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">142</div>
                <div className="text-xs text-muted-foreground">
                  Facturas procesadas
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success">98.5%</div>
                <div className="text-xs text-muted-foreground">
                  Precisión de extracción
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">2.3s</div>
                <div className="text-xs text-muted-foreground">
                  Tiempo medio proceso
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-warning">3</div>
                <div className="text-xs text-muted-foreground">
                  Errores detectados
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

