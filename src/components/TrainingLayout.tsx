import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { TrainingSidebar } from "@/components/TrainingSidebar"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { LogOut, Shield, Settings, User2, Building2 } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"
import { LanguageSelector } from "@/components/language/LanguageSelector"
import { Link } from "react-router-dom"
import { ThemeToggle } from "@/components/ThemeToggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface TrainingLayoutProps {
  children: React.ReactNode
}

export function TrainingLayout({ children }: TrainingLayoutProps) {
  const { employeeProfile, signOut, userRole } = useAuth();
  const { t, isRTL } = useLanguage();
  const displayName = employeeProfile?.name || 'User'
  const initials = displayName.split(' ').map((p) => p[0] ?? '').join('').slice(0, 2).toUpperCase()

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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="p-0">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={employeeProfile?.avatar_url || undefined} alt={`${displayName} avatar`} />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-medium">{displayName}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="flex items-center gap-2">
                        <User2 className="h-4 w-4" />
                        <span>Profile settings</span>
                      </Link>
                    </DropdownMenuItem>
                    {userRole === 'admin' && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin/org-settings" className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          <span>Organization settings</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                      <LogOut className="h-4 w-4 mr-2" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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