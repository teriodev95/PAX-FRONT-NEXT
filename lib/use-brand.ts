"use client"

import { useAuth } from "@/lib/auth-context"
import { getBrandByEmpresa } from "@/lib/brand-config"

export function useBrand() {
  const { user } = useAuth()
  return getBrandByEmpresa(user?.empresa)
}
