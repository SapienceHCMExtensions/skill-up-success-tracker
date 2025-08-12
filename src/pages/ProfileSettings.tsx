import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useLanguage } from "@/contexts/LanguageContext"
import { ThemeToggle } from "@/components/ThemeToggle"
import { LanguageSelector } from "@/components/language/LanguageSelector"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

const pages = [
  { label: "Dashboard", value: "/" },
  { label: "Courses", value: "/courses" },
  { label: "Sessions", value: "/sessions" },
  { label: "Training Requests", value: "/training-requests" },
  { label: "Plans", value: "/plans" },
  { label: "Costs", value: "/costs" },
  { label: "Evaluations", value: "/evaluations" },
  { label: "My Tasks", value: "/my-tasks" },
]

const ProfileSettings = () => {
  const { employeeProfile, user } = useAuth() as any
  const { t } = useLanguage()
  const { toast } = useToast()
  const [preferredRoute, setPreferredRoute] = useState<string>(
    typeof window !== 'undefined' ? localStorage.getItem('preferred_start_route') || '/' : '/'
  )

  useEffect(() => {
    const title = "Profile Settings | Personalize your account"
    const description = "Manage your profile settings: theme, language, and account details."
    document.title = title

    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (!meta) {
      meta = document.createElement("meta")
      meta.setAttribute("name", "description")
      document.head.appendChild(meta)
    }
    meta.setAttribute("content", description)

    const href = `${window.location.origin}/profile`
    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!link) {
      link = document.createElement("link")
      link.setAttribute("rel", "canonical")
      document.head.appendChild(link)
    }
    link.setAttribute("href", href)
  }, [])

  const displayName = employeeProfile?.name || user?.email || "User"

  const handlePreferredChange = (value: string) => {
    setPreferredRoute(value)
    localStorage.setItem('preferred_start_route', value)
    toast({ title: 'Preference saved', description: `Start on ${pages.find(p => p.value === value)?.label}` })
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Profile Settings</h1>
        <p className="text-muted-foreground mt-1">Personalize your experience and account preferences.</p>
      </header>

      <main>
        <section aria-labelledby="appearance-settings" className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle id="appearance-settings">Appearance</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Theme</span>
              <ThemeToggle />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Language</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Interface language</span>
              <LanguageSelector />
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="preferences" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle id="preferences">Preferences</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-medium text-foreground">Preferred start page</div>
                <p className="text-xs text-muted-foreground">Choose the page you land on after sign-in.</p>
              </div>
              <Select value={preferredRoute} onValueChange={handlePreferredChange}>
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Select a page" />
                </SelectTrigger>
                <SelectContent>
                  {pages.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="account-details" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle id="account-details">Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="text-foreground font-medium">{displayName}</span>
              </div>
              {user?.email && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="text-foreground font-medium">{user.email}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  )
}

export default ProfileSettings
