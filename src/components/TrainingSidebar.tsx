import { 
  BookOpen, 
  Calendar, 
  Users, 
  BarChart3, 
  DollarSign, 
  Bell,
  GraduationCap,
  Settings,
  Clock,
  Languages,
  FileText,
  Shield,
  Workflow
} from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useLanguage } from "@/contexts/LanguageContext"
import { useAuth } from "@/hooks/useAuth"

const navigationItems = [
  { title: "nav.dashboard", url: "/", icon: BarChart3 },
  { title: "nav.courses", url: "/courses", icon: BookOpen },
  { title: "nav.plans", url: "/plans", icon: Calendar },
  { title: "nav.sessions", url: "/sessions", icon: Clock },
  { title: "Training Requests", url: "/training-requests", icon: FileText },
  { title: "nav.scorecards", url: "/scorecards", icon: Users },
  { title: "nav.evaluations", url: "/evaluations", icon: GraduationCap },
  { title: "nav.costs", url: "/costs", icon: DollarSign },
  { title: "nav.alerts", url: "/alerts", icon: Bell },
]

const adminItems = [
  { title: "Workflows", url: "/workflows", icon: Workflow, adminOnly: true },
]

export function TrainingSidebar() {
  const location = useLocation()
  const currentPath = location.pathname
  const { t, isRTL } = useLanguage()
  const { userRole } = useAuth()

  const isActive = (path: string) => {
    if (path === "/") {
      return currentPath === "/"
    }
    return currentPath.startsWith(path)
  }

  const getNavClass = (path: string) =>
    isActive(path) 
      ? "bg-primary text-primary-foreground font-medium shadow-primary" 
      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"

  return (
    <Sidebar collapsible="icon" side={isRTL ? "right" : "left"}>
      <SidebarContent className="bg-card border-r">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-md flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div className="group-data-[collapsible=icon]:hidden">
              <div className="font-semibold text-sm">TMS</div>
              <div className="text-xs text-muted-foreground">{t('app.title')}</div>
            </div>
          </div>
        </div>

        <SidebarGroup className="px-2">
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground mb-2">
            {t('nav.title', 'Navigation')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-10">
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/"}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all ${getNavClass(item.url)} ${isRTL ? 'flex-row-reverse' : ''}`}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm group-data-[collapsible=icon]:hidden">{t(item.title)}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {userRole === 'admin' && (
          <SidebarGroup className="px-2">
            <SidebarGroupLabel className="text-xs font-medium text-muted-foreground mb-2">
              Admin
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="h-10">
                      <NavLink 
                        to={item.url} 
                        className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all ${getNavClass(item.url)} ${isRTL ? 'flex-row-reverse' : ''}`}
                      >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm group-data-[collapsible=icon]:hidden">{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

      </SidebarContent>
    </Sidebar>
  )
}