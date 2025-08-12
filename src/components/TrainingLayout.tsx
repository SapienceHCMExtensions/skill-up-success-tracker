import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { TrainingSidebar } from "@/components/TrainingSidebar"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { LogOut, Shield } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"
import { LanguageSelector } from "@/components/language/LanguageSelector"
import { Link } from "react-router-dom"
import { ThemeToggle } from "@/components/ThemeToggle"

interface TrainingLayoutProps {
  children: React.ReactNode
}

export function TrainingLayout({ children }: TrainingLayoutProps) {
  const { employeeProfile, signOut, userRole } = useAuth();
  const { t, isRTL } = useLanguage();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-dashboard">
        <TrainingSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b bg-card shadow-sm flex items-center px-6">
            <SidebarTrigger className={isRTL ? "ml-4" : "mr-4"} />
            <div className="flex items-center justify-between w-full">
              <div>
                <h1 className="text-xl font-semibold text-foreground">{t('app.title')}</h1>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  {t('common.welcome')}, {employeeProfile?.name || 'User'} ({userRole})
                </div>
                <ThemeToggle />
                <LanguageSelector />
                {userRole === 'admin' && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/admin">
                      <Shield className="h-4 w-4 mr-2" />
                      Admin
                    </Link>
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={signOut}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </header>
          
          <main className="flex-1 p-6 animate-fade-in">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}