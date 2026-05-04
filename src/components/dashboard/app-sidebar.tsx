"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Upload,
  Users,
  Building2,
  Brain,
  FileSpreadsheet,
} from "lucide-react"

import { cn } from "@/lib/utils"

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Centro de Subida",
    href: "/upload",
    icon: Upload,
  },
  {
    name: "Clientes (Ventas)",
    href: "/customers",
    icon: Users,
  },
  {
    name: "Proveedores (Gastos)",
    href: "/suppliers",
    icon: Building2,
  },
]

interface AppSidebarProps {
  className?: string
}

export function AppSidebar({ className }: AppSidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar text-sidebar-foreground",
        className
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
            <Brain className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight">
              PsicoFiscal
            </span>
            <span className="text-xs text-sidebar-muted">Gestor Tributario</span>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          <div className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-sidebar-muted">
            Navegación
          </div>
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/30 px-3 py-2.5">
            <FileSpreadsheet className="h-4 w-4 text-sidebar-primary" />
            <div className="flex flex-col">
              <span className="text-xs font-medium">Modelos AEAT</span>
              <span className="text-xs text-sidebar-muted">130 · 303</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

