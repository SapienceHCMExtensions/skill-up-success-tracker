import { useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useLanguage } from "@/contexts/LanguageContext"
import { ThemeToggle } from "@/components/ThemeToggle"
import { LanguageSelector } from "@/components/language/LanguageSelector"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const ProfileSettings = () => {
  const { employeeProfile, user } = useAuth() as any
  const { t } = useLanguage()

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
