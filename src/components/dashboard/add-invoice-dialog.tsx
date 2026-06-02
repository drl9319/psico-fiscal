"use client"

import * as React from "react"
import { Plus } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { apiClient } from "@/lib/api-client"

interface AddInvoiceDialogProps {
  type: "customer" | "supplier"
  onSuccess: () => void
}

interface FormData {
  accounting_date: string
  name: string
  nif: string
  invoice_number: string
  amount: string
  tax: string
  total: string
  retencion: string
  address: string
}

const emptyForm: FormData = {
  accounting_date: format(new Date(), "yyyy-MM-dd"),
  name: "",
  nif: "",
  invoice_number: "",
  amount: "",
  tax: "",
  total: "",
  retencion: "0",
  address: "",
}

export function AddInvoiceDialog({ type, onSuccess }: AddInvoiceDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [formData, setFormData] = React.useState<FormData>({ ...emptyForm })
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const isCustomer = type === "customer"

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const amount = parseFloat(formData.amount)
      const tax = parseFloat(formData.tax)
      const total = parseFloat(formData.total)
      const retencion = parseFloat(formData.retencion) || 0

      if (isNaN(amount) || isNaN(tax) || isNaN(total)) {
        throw new Error("Los valores numéricos no son válidos")
      }

      const payload = isCustomer
        ? {
            accounting_date: formData.accounting_date,
            customer_name: formData.name,
            customer_id: formData.nif,
            customer_address: formData.address || null,
            invoice_number: formData.invoice_number,
            amount: amount,
            tax: tax,
            total: total,
            retencion: retencion,
            is_credit_note: total < 0,
          }
        : {
            accounting_date: formData.accounting_date,
            supplier_name: formData.name,
            supplier_id: formData.nif,
            supplier_address: formData.address || null,
            invoice_number: formData.invoice_number,
            amount: amount,
            tax: tax,
            total: total,
            retencion: retencion,
            is_credit_note: total < 0,
          }

      const endpoint = isCustomer
        ? "/create_customer_invoice"
        : "/create_supplier_invoice"

      const response = await apiClient(endpoint, {
        method: "POST",
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => null)
        throw new Error(
          errData?.detail || `Error al crear la factura (HTTP ${response.status})`
        )
      }

      // Reset form and close dialog
      setFormData({ ...emptyForm })
      setOpen(false)
      onSuccess()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido"
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      // Reset form when closing
      setFormData({ ...emptyForm })
      setError(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Añadir Factura Manual
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              Añadir Factura Manual — {isCustomer ? "Cliente" : "Proveedor"}
            </DialogTitle>
            <DialogDescription>
              Introduce los datos de la factura manual que no está en Excel ni PDF.
              Todos los campos marcados con * son obligatorios.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid gap-4 py-4">
            {/* Date */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="accounting_date" className="text-right">
                Fecha Contable *
              </Label>
              <Input
                id="accounting_date"
                type="date"
                value={formData.accounting_date}
                onChange={(e) => handleChange("accounting_date", e.target.value)}
                className="col-span-3"
                required
              />
            </div>

            {/* Name */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                {isCustomer ? "Cliente *" : "Proveedor *"}
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder={isCustomer ? "Nombre del cliente" : "Nombre del proveedor"}
                className="col-span-3"
                required
              />
            </div>

            {/* NIF */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nif" className="text-right">
                NIF *
              </Label>
              <Input
                id="nif"
                value={formData.nif}
                onChange={(e) => handleChange("nif", e.target.value)}
                placeholder="12345678A"
                className="col-span-3"
                required
              />
            </div>

            {/* Address */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="text-right">
                Dirección
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Dirección (opcional)"
                className="col-span-3"
              />
            </div>

            {/* Invoice Number */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="invoice_number" className="text-right">
                Nº Factura *
              </Label>
              <Input
                id="invoice_number"
                value={formData.invoice_number}
                onChange={(e) => handleChange("invoice_number", e.target.value)}
                placeholder="2024-001"
                className="col-span-3"
                required
              />
            </div>

            {/* Amount (Base Imponible) */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Base Imponible *
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => handleChange("amount", e.target.value)}
                placeholder="0.00"
                className="col-span-3"
                required
              />
            </div>

            {/* Tax (IVA) */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tax" className="text-right">
                IVA *
              </Label>
              <Input
                id="tax"
                type="number"
                step="0.01"
                value={formData.tax}
                onChange={(e) => handleChange("tax", e.target.value)}
                placeholder="0.00"
                className="col-span-3"
                required
              />
            </div>

            {/* Retención (IRPF) */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="retencion" className="text-right">
                IRPF
              </Label>
              <Input
                id="retencion"
                type="number"
                step="0.01"
                value={formData.retencion}
                onChange={(e) => handleChange("retencion", e.target.value)}
                placeholder="0.00"
                className="col-span-3"
              />
            </div>

            {/* Total */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="total" className="text-right">
                Total *
              </Label>
              <Input
                id="total"
                type="number"
                step="0.01"
                value={formData.total}
                onChange={(e) => handleChange("total", e.target.value)}
                placeholder="0.00"
                className="col-span-3"
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Guardar Factura"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
