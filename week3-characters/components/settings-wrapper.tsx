"use client"

import type { ReactNode } from "react"
import { SettingsProvider } from "@/lib/settings-context"

export function SettingsWrapper({ children }: { children: ReactNode }) {
  return <SettingsProvider>{children}</SettingsProvider>
}

