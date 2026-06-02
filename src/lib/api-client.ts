/**
 * Authenticated API client that automatically attaches the Supabase
 * access token to every request.
 *
 * Usage:
 *   import { apiClient } from "@/lib/api-client"
 *
 *   const data = await apiClient("/customer_invoices_summary?...")
 *
 * For POST/PUT with a body:
 *   const result = await apiClient("/save-invoice", {
 *     method: "POST",
 *     body: JSON.stringify(payload),
 *   })
 */

import { createClient } from "@/lib/supabase-client"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"

interface ApiOptions extends Omit<RequestInit, "headers"> {
  headers?: Record<string, string>
}

export async function apiClient(
  endpoint: string,
  options: ApiOptions = {}
): Promise<Response> {
  const supabase = createClient()

  // Get the current session's access token
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Only set Content-Type for JSON payloads — skip for FormData (file uploads)
  // so the browser sets the correct multipart boundary automatically.
  const isFormData = options.body instanceof FormData
  const headers: Record<string, string> = {
    ...(!isFormData && { "Content-Type": "application/json" }),
    ...options.headers,
  }

  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    const detail =
      body && typeof body === "object" && "detail" in body
        ? String((body as { detail: unknown }).detail)
        : `HTTP ${res.status}`
    throw new Error(detail)
  }

  return res
}
