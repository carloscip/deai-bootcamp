"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export interface ApiSettings {
  useCustomEndpoint: boolean
  customApiUrl: string
  apiKey: string
}

interface SettingsContextType {
  apiSettings: ApiSettings
  updateApiSettings: (settings: Partial<ApiSettings>) => void
}

const defaultSettings: ApiSettings = {
  useCustomEndpoint: false,
  customApiUrl: "",
  apiKey: "",
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [apiSettings, setApiSettings] = useState<ApiSettings>(defaultSettings)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem("apiSettings")
      if (savedSettings) {
        setApiSettings(JSON.parse(savedSettings))
      }
    } catch (error) {
      console.error("Error loading settings:", error)
      // If there's an error, use default settings
      setApiSettings(defaultSettings)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Save settings to localStorage whenever they change
  const updateApiSettings = (newSettings: Partial<ApiSettings>) => {
    try {
      const updatedSettings = { ...apiSettings, ...newSettings }
      setApiSettings(updatedSettings)
      localStorage.setItem("apiSettings", JSON.stringify(updatedSettings))
    } catch (error) {
      console.error("Error saving settings:", error)
    }
  }

  // Don't render children until settings are loaded
  if (!isLoaded) {
    return null
  }

  return <SettingsContext.Provider value={{ apiSettings, updateApiSettings }}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider")
  }
  return context
}

