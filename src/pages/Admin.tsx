import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, Key, Languages, Users } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { Navigate, Link } from "react-router-dom"

export default function Admin() {
  const { userRole } = useAuth()

  // Redirect if not admin
  if (userRole !== 'admin') {
    return <Navigate to="/" replace />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin</h1>
          <p className="text-muted-foreground">Manage system settings and configurations</p>
        </div>
      </div>

      <div className="grid gap-6 max-w-md">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-6 h-6 text-primary" />
              Gemini AI Configuration
            </CardTitle>
            <CardDescription>
              Configure AI API keys for generating course content and descriptions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to="/admin/gemini-config">
                Configure AI Settings
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Languages className="w-6 h-6 text-primary" />
              Translations
            </CardTitle>
            <CardDescription>
              Manage application translations and language settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to="/translations">
                Manage Translations
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              User Management
            </CardTitle>
            <CardDescription>
              Manage users, roles, and employee information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to="/users">
                Manage Users
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}