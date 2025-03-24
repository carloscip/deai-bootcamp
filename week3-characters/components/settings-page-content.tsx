"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSettings } from "@/lib/settings-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Save, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { Footer } from "@/components/footer"

export function SettingsPageContent() {
  const { apiSettings, updateApiSettings } = useSettings()
  const { toast } = useToast()

  const [formState, setFormState] = useState({
    useCustomEndpoint: false,
    customApiUrl: "",
    apiKey: "",
  })
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Load current settings into form state
  useEffect(() => {
    setFormState(apiSettings)
  }, [apiSettings])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateApiSettings(formState)

    // Show success state
    setSaveSuccess(true)

    // Show toast notification
    toast({
      title: "Settings saved",
      description: formState.useCustomEndpoint
        ? `Now using custom API at ${formState.customApiUrl}`
        : "Now using default OpenAI API",
      variant: "default",
      icon: <CheckCircle className="h-4 w-4 text-green-500" />,
    })

    // Reset success state after 2 seconds
    setTimeout(() => {
      setSaveSuccess(false)
    }, 2000)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="container py-8 flex-1">
        <div className="mb-8">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">API Settings</h1>

          <Card>
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
              <CardDescription>
                Configure the API endpoint for story generation. You can use the default OpenAI API or a custom
                endpoint.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="custom-endpoint">Use Custom API Endpoint</Label>
                    <p className="text-sm text-muted-foreground">
                      Toggle to use a custom API endpoint instead of OpenAI
                    </p>
                  </div>
                  <Switch
                    id="custom-endpoint"
                    checked={formState.useCustomEndpoint}
                    onCheckedChange={(checked) => setFormState({ ...formState, useCustomEndpoint: checked })}
                  />
                </div>

                {formState.useCustomEndpoint && (
                  <div className="space-y-2">
                    <Label htmlFor="api-url">Custom API URL</Label>
                    <Input
                      id="api-url"
                      placeholder="https://your-api-endpoint.com/v1"
                      value={formState.customApiUrl}
                      onChange={(e) => setFormState({ ...formState, customApiUrl: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      For text-generation-webui, use: http://your-server:port/v1
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="api-key">API Key</Label>
                  <Input
                    id="api-key"
                    type="password"
                    placeholder="Enter your API key"
                    value={formState.apiKey}
                    onChange={(e) => setFormState({ ...formState, apiKey: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formState.useCustomEndpoint
                      ? "Enter the API key for your custom endpoint (if required)"
                      : "Your OpenAI API key"}
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div>
                  {saveSuccess && (
                    <div className="flex items-center text-sm text-green-600">
                      <CheckCircle className="mr-1 h-4 w-4" />
                      Settings saved successfully
                    </div>
                  )}
                </div>
                <Button type="submit">
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </Button>
              </CardFooter>
            </form>
          </Card>

          {formState.useCustomEndpoint && (
            <div className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle>Using text-generation-webui</CardTitle>
                  <CardDescription>
                    How to properly configure text-generation-webui for use with this app
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    To use text-generation-webui with this app, you need to start it with the correct API parameters:
                  </p>
                  <div className="bg-muted p-3 rounded-md overflow-x-auto">
                    <code>python server.py --api --extensions openai</code>
                  </div>
                  <p>Then, in the settings above, set your Custom API URL to:</p>
                  <div className="bg-muted p-3 rounded-md overflow-x-auto">
                    <code>http://your-server-address:port/v1</code>
                  </div>
                  <p>
                    For example, if running locally: <code>http://localhost:5000/v1</code>
                  </p>
                  <p>
                    If running on Google Colab notebook{" "}
                    <code>
                      https://colab.research.google.com/github/Borov666/text-generation-webui/blob/main/Colab-TextGen-GPU.ipynb
                    </code>
                    , use the OpenAI-compatible API URL ending with <code>trycloudflare.com</code> (I added --extensions
                    openai as a flag though I am not sure if required) followed by <code>/v1</code>
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}

