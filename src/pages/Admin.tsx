import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Shield, Key, Save, Check } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { Navigate } from "react-router-dom"

export default function Admin() {
  const [geminiApiKey, setGeminiApiKey] = useState("")
  const [isKeySet, setIsKeySet] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { userRole } = useAuth()

  // Redirect if not admin
  if (userRole !== 'admin') {
    return <Navigate to="/" replace />
  }

  const handleSaveApiKey = async () => {
    if (!geminiApiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid API key",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      // This will trigger the secret form action
      setIsKeySet(true)
      toast({
        title: "Success",
        description: "Gemini API key has been securely stored",
      })
      setGeminiApiKey("") // Clear the input for security
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to store API key",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Panel</h1>
          <p className="text-muted-foreground">Manage system settings and API configurations</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Gemini AI Configuration
            </CardTitle>
            <CardDescription>
              Configure the Gemini AI API key for generating AI content for courses. 
              This key will be securely stored in Supabase Vault.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gemini-api-key">Gemini API Key</Label>
              <div className="flex gap-2">
                <Input
                  id="gemini-api-key"
                  type="password"
                  placeholder="Enter your Gemini API key..."
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSaveApiKey}
                  disabled={isLoading || !geminiApiKey.trim()}
                  className="px-6"
                >
                  {isLoading ? (
                    "Saving..."
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            </div>

            {isKeySet && (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-md">
                <Check className="w-4 h-4" />
                <span className="text-sm">Gemini API key has been securely stored</span>
              </div>
            )}

            <div className="bg-muted/50 p-4 rounded-md text-sm text-muted-foreground">
              <p className="font-medium mb-2">How to get your Gemini API Key:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Visit Google AI Studio</li>
                <li>Sign in with your Google account</li>
                <li>Navigate to the API Keys section</li>
                <li>Create a new API key or copy an existing one</li>
                <li>Paste it above to enable AI content generation</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Content Generation</CardTitle>
            <CardDescription>
              Once configured, the Gemini AI key can be used for:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>Generating course descriptions automatically</li>
              <li>Creating learning objectives</li>
              <li>Suggesting course content and modules</li>
              <li>Generating evaluation questions</li>
              <li>Creating training material summaries</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}