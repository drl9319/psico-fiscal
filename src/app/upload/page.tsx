"use client"

import * as React from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { UploadZone, ExtractedInvoice } from "@/components/dashboard/upload-zone"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Sparkles, Zap } from "lucide-react"
import { DataTableInvoiceExtraction, InvoiceRecord } from "@/components/dashboard/data-table-invoice-extraction"
import { DataTableExcel } from "@/components/dashboard/data-table-excel"
import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api-client"

export default function UploadPage() {
  const [allExtractedInvoices, setAllExtractedInvoices] = React.useState<InvoiceRecord[]>([])
  const [extractedExcelData, setExtractedExcelData] = React.useState<InvoiceRecord[]>([])
  const [isSavingAll, setIsSavingAll] = React.useState(false)
  const [saveAllError, setSaveAllError] = React.useState<string | null>(null)
  const [saveAllSuccess, setSaveAllSuccess] = React.useState<boolean>(false)
  const [selectedInvoiceIds, setSelectedInvoiceIds] = React.useState<string[]>([])

  const handleSupplierInvoicesExtracted = React.useCallback((invoices: ExtractedInvoice[]) => {
    // Filter out error invoices for now, or handle them differently
    const successfulInvoices = invoices.filter(inv => inv.status === 'extracted') as InvoiceRecord[]
    setAllExtractedInvoices((prev) => [...prev, ...successfulInvoices])
  }, [])

  const handleCustomerInvoicesExtracted = React.useCallback((invoices: ExtractedInvoice[]) => {
    const successfulInvoices = invoices.filter(inv => inv.status === 'extracted') as InvoiceRecord[]
    setAllExtractedInvoices((prev) => [...prev, ...successfulInvoices])
  }, [])

  const handleExcelDataExtracted = React.useCallback((data: InvoiceRecord[]) => {
    setExtractedExcelData((prev) => [...prev, ...data]);
  }, [])

  const saveAllInvoices = React.useCallback(async () => {
    const invoicesToSave = allExtractedInvoices.filter(invoice => selectedInvoiceIds.includes(invoice.id));
    if (invoicesToSave.length === 0) return

    const formattedInvoices = invoicesToSave.map(invoice => {
      const baseAmount = invoice.amount ?? 0;
      const dateStr = invoice.accounting_date
        ? new Date(invoice.accounting_date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
      return {
        accounting_date: dateStr,
        supplier_name: invoice.supplier_name,
        invoice_number: invoice.invoice_number,
        supplier_id: invoice.supplier_id || "N/A",
        supplier_address: invoice.supplier_address || "N/A",
        amount: baseAmount,
        // Use actual tax IVA amount from extraction (not computed from percentage)
        tax: invoice.tax ?? (baseAmount * (invoice.taxPercent ?? 0) / 100),
        total: invoice.total ?? 0,
        retencion: invoice.retencionAmount ?? (baseAmount * (invoice.retencionPercent ?? 0) / 100),
        category: invoice.category,
        fileName: invoice.fileName,
        status: invoice.status,
      };
    });

    setSaveAllError(null)
    setSaveAllSuccess(false)
    setIsSavingAll(true)

    try {
      const res = await apiClient("/save-multiple-invoices", {
        method: "POST",
        body: JSON.stringify(formattedInvoices),
      })

      const data = (await res.json()) as unknown
      setSaveAllSuccess(true)
      // Remove saved invoices from the table
      setAllExtractedInvoices(prev => prev.filter(invoice => !selectedInvoiceIds.includes(invoice.id)))
      setSelectedInvoiceIds([]) // Clear selection after saving
    } catch (e) {
      setSaveAllError(e instanceof Error ? e.message : "Error desconocido al guardar.")
    } finally {
      setIsSavingAll(false)
    }
  }, [allExtractedInvoices, selectedInvoiceIds])
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
            onInvoicesExtracted={handleSupplierInvoicesExtracted}
          />
          <UploadZone
            title="Facturas de Clientes"
            description="Sube las facturas emitidas a tus pacientes y clientes (Excel, CSV)"
            acceptedTypes={[".xlsx", ".xls", ".csv"]}
            icon="excel"
            onInvoicesExtracted={handleExcelDataExtracted}
            endpoint="/extract-excel"
          />
        </div>

        {allExtractedInvoices.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium">Facturas Extraídas</CardTitle>
              <Button
                onClick={saveAllInvoices}
                disabled={isSavingAll || selectedInvoiceIds.length === 0}
              >
                {isSavingAll
                  ? "Guardando seleccionadas..."
                  : saveAllSuccess
                    ? "Seleccionadas guardadas ✓"
                    : `Guardar ${selectedInvoiceIds.length} seleccionadas en BD`}
              </Button>
            </CardHeader>
            <CardContent>
              {saveAllError && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive mb-4">
                  {saveAllError}
                </div>
              )}
              {saveAllSuccess && (
                <div className="rounded-md border border-green-500/30 bg-green-500/5 px-3 py-2 text-sm text-green-700 mb-4">
                  Todas las facturas guardadas correctamente en la base de datos.
                </div>
              )}
              <DataTableInvoiceExtraction
                data={allExtractedInvoices}
                type="supplier"
                onDataChange={setAllExtractedInvoices}
                onSelectedChange={setSelectedInvoiceIds}
              />
            </CardContent>
          </Card>
        )}

        {extractedExcelData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">Contenido del Excel</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTableExcel
                data={extractedExcelData}
                type="customer"
                onDataChange={setExtractedExcelData}
              />
            </CardContent>
          </Card>
        )}

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

