import { InvoiceRecord } from "@/components/dashboard/data-table"

export const customerInvoices: InvoiceRecord[] = [
  {
    id: "1",
    date: new Date("2024-01-15"),
    invoiceNumber: "2024-001",
    entityName: "María García López",
    baseImponible: 80.0,
    ivaPercent: 0,
    irpfPercent: 15,
    total: 68.0,
    category: "Sanitario",
    nif: "12345678A", // Added NIF field
  },
  {
    id: "2",
    date: new Date("2024-01-18"),
    invoiceNumber: "2024-002",
    entityName: "Carlos Rodríguez Martín",
    baseImponible: 160.0,
    ivaPercent: 0,
    irpfPercent: 15,
    total: 136.0,
    category: "Sanitario",
    nif: "12345678B", // Added NIF field
  },
  {
    id: "3",
    date: new Date("2024-01-22"),
    invoiceNumber: "2024-003",
    entityName: "Ana Fernández Ruiz",
    baseImponible: 80.0,
    ivaPercent: 0,
    irpfPercent: 15,
    total: 68.0,
    category: "Sanitario",
    nif: "12345678C", // Added NIF field
  },
  {
    id: "4",
    date: new Date("2024-02-01"),
    invoiceNumber: "2024-004",
    entityName: "Empresa Formación SL",
    baseImponible: 500.0,
    ivaPercent: 21,
    irpfPercent: 15,
    total: 530.0,
    category: "Formación",
    nif: "12345678D", // Added NIF field
  },
  {
    id: "5",
    date: new Date("2024-02-05"),
    invoiceNumber: "2024-005",
    entityName: "Laura Sánchez Pérez",
    baseImponible: 240.0,
    ivaPercent: 0,
    irpfPercent: 15,
    total: 204.0,
    category: "Sanitario",
    nif: "12345678E", // Added NIF field
  },
  {
    id: "6",
    date: new Date("2024-02-12"),
    invoiceNumber: "2024-006",
    entityName: "Pedro Jiménez García",
    baseImponible: 80.0,
    ivaPercent: 0,
    irpfPercent: 15,
    total: 68.0,
    category: "Sanitario",
    nif: "12345678F", // Added NIF field
  },
  {
    id: "7",
    date: new Date("2024-02-20"),
    invoiceNumber: "2024-007",
    entityName: "Centro Educativo ABC",
    baseImponible: 800.0,
    ivaPercent: 21,
    irpfPercent: 15,
    total: 848.0,
    category: "Formación",
    nif: "12345678G", // Added NIF field
  },
  {
    id: "8",
    date: new Date("2024-03-01"),
    invoiceNumber: "2024-008",
    entityName: "Elena Martín González",
    baseImponible: 160.0,
    ivaPercent: 0,
    irpfPercent: 15,
    total: 136.0,
    category: "Sanitario",
    nif: "12345678H", // Added NIF field
  },
  {
    id: "9",
    date: new Date("2024-03-08"),
    invoiceNumber: "2024-009",
    entityName: "Roberto Díaz Hernández",
    baseImponible: 320.0,
    ivaPercent: 0,
    irpfPercent: 15,
    total: 272.0,
    category: "Sanitario",
    nif: "12345678I", // Added NIF field
  },
  {
    id: "10",
    date: new Date("2024-03-15"),
    invoiceNumber: "2024-010",
    entityName: "Instituto Salud Mental",
    baseImponible: 1200.0,
    ivaPercent: 21,
    irpfPercent: 15,
    total: 1272.0,
    category: "Formación",
    nif: "12345678J", // Added NIF field
  },
  {
    id: "11",
    date: new Date("2024-03-22"),
    invoiceNumber: "2024-011",
    entityName: "Sofía López Muñoz",
    baseImponible: 80.0,
    ivaPercent: 0,
    irpfPercent: 15,
    total: 68.0,
    category: "Sanitario",
    nif: "12345678K", // Added NIF field
  },
  {
    id: "12",
    date: new Date("2024-03-28"),
    invoiceNumber: "2024-012",
    entityName: "Miguel Ángel Torres",
    baseImponible: 160.0,
    ivaPercent: 0,
    irpfPercent: 15,
    total: 136.0,
    category: "Sanitario",
    nif: "12345678L", // Added NIF field
  },
]

export const supplierInvoices: InvoiceRecord[] = [
  {
    id: "s1",
    date: new Date("2024-01-05"),
    invoiceNumber: "A-2024-001",
    entityName: "Inmobiliaria Centro SL",
    baseImponible: 600.0,
    ivaPercent: 21,
    irpfPercent: 0,
    total: 726.0,
    category: "Alquiler",
  },
  {
    id: "s2",
    date: new Date("2024-01-10"),
    invoiceNumber: "B-4521",
    entityName: "Papelería Profesional",
    baseImponible: 85.0,
    ivaPercent: 21,
    irpfPercent: 0,
    total: 102.85,
    category: "Material Oficina",
  },
  {
    id: "s3",
    date: new Date("2024-01-15"),
    invoiceNumber: "E-2024-0123",
    entityName: "Iberdrola",
    baseImponible: 65.0,
    ivaPercent: 21,
    irpfPercent: 0,
    total: 78.65,
    category: "Suministros",
  },
  {
    id: "s4",
    date: new Date("2024-01-20"),
    invoiceNumber: "SW-9087",
    entityName: "Adobe Systems",
    baseImponible: 24.99,
    ivaPercent: 21,
    irpfPercent: 0,
    total: 30.24,
    category: "Software",
  },
  {
    id: "s5",
    date: new Date("2024-02-01"),
    invoiceNumber: "A-2024-002",
    entityName: "Inmobiliaria Centro SL",
    baseImponible: 600.0,
    ivaPercent: 21,
    irpfPercent: 0,
    total: 726.0,
    category: "Alquiler",
  },
  {
    id: "s6",
    date: new Date("2024-02-08"),
    invoiceNumber: "F-2024-456",
    entityName: "Colegio Oficial Psicólogos",
    baseImponible: 150.0,
    ivaPercent: 0,
    irpfPercent: 0,
    total: 150.0,
    category: "Formación",
  },
  {
    id: "s7",
    date: new Date("2024-02-15"),
    invoiceNumber: "E-2024-0456",
    entityName: "Iberdrola",
    baseImponible: 58.0,
    ivaPercent: 21,
    irpfPercent: 0,
    total: 70.18,
    category: "Suministros",
  },
  {
    id: "s8",
    date: new Date("2024-02-20"),
    invoiceNumber: "SEG-2024-089",
    entityName: "Mapfre Seguros",
    baseImponible: 45.0,
    ivaPercent: 0,
    irpfPercent: 0,
    total: 45.0,
    category: "Seguros",
  },
  {
    id: "s9",
    date: new Date("2024-03-01"),
    invoiceNumber: "A-2024-003",
    entityName: "Inmobiliaria Centro SL",
    baseImponible: 600.0,
    ivaPercent: 21,
    irpfPercent: 0,
    total: 726.0,
    category: "Alquiler",
  },
  {
    id: "s10",
    date: new Date("2024-03-10"),
    invoiceNumber: "SW-9456",
    entityName: "Microsoft 365",
    baseImponible: 12.99,
    ivaPercent: 21,
    irpfPercent: 0,
    total: 15.72,
    category: "Software",
  },
  {
    id: "s11",
    date: new Date("2024-03-15"),
    invoiceNumber: "E-2024-0789",
    entityName: "Iberdrola",
    baseImponible: 72.0,
    ivaPercent: 21,
    irpfPercent: 0,
    total: 87.12,
    category: "Suministros",
  },
  {
    id: "s12",
    date: new Date("2024-03-25"),
    invoiceNumber: "B-5123",
    entityName: "Papelería Profesional",
    baseImponible: 42.0,
    ivaPercent: 21,
    irpfPercent: 0,
    total: 50.82,
    category: "Material Oficina",
  },
]

export function calculateKPIs() {
  const totalIngresos = customerInvoices.reduce(
    (sum, inv) => sum + inv.baseImponible,
    0
  )
  const totalGastos = supplierInvoices.reduce(
    (sum, inv) => sum + inv.baseImponible,
    0
  )
  const irpfRetenido = customerInvoices.reduce(
    (sum, inv) => sum + (inv.baseImponible * inv.irpfPercent) / 100,
    0
  )

  return {
    totalIngresos,
    totalGastos,
    irpfRetenido,
  }
}

export function calculateAEATData() {
  const ingresos = customerInvoices.reduce((sum, inv) => sum + inv.baseImponible, 0)
  const gastos = supplierInvoices.reduce((sum, inv) => sum + inv.baseImponible, 0)
  const rendimiento = ingresos - gastos

  const salesWithIVA = customerInvoices.filter((inv) => inv.ivaPercent > 0)
  const salesBaseImponible = salesWithIVA.reduce(
    (sum, inv) => sum + inv.baseImponible,
    0
  )
  const salesIVA = salesWithIVA.reduce(
    (sum, inv) => sum + (inv.baseImponible * inv.ivaPercent) / 100,
    0
  )

  const expensesWithIVA = supplierInvoices.filter((inv) => inv.ivaPercent > 0)
  const expensesBaseImponible = expensesWithIVA.reduce(
    (sum, inv) => sum + inv.baseImponible,
    0
  )
  const expensesIVA = expensesWithIVA.reduce(
    (sum, inv) => sum + (inv.baseImponible * inv.ivaPercent) / 100,
    0
  )

  const casilla04 = rendimiento * 0.20
  const casilla07 = casilla04
  const casilla06 = 0
  const casilla19 = casilla07 - casilla06

  return {
    modelo130: {
      casilla01: ingresos,
      casilla02: gastos,
      casilla03: rendimiento,
      casilla04: casilla04,
      casilla05: 0,
      casilla06: casilla06,
      casilla07: casilla07,
      casilla19: casilla19,
    },
    modelo303: {
      sales: {
        casilla01: salesBaseImponible,
        casilla07: salesIVA,
      },
      expenses: {
        casilla28: expensesBaseImponible,
        casilla30: expensesIVA,
        casilla31: expensesIVA,
      },
    },
  }
}

