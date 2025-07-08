import { 
  BookOpen, 
  Calendar, 
  Users, 
  BarChart3, 
  DollarSign, 
  Bell,
  GraduationCap,
  Settings,
  Clock
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

const navigationItems = [
  { title: "Dashboard", url: "/", icon: BarChart3 },
  { title: "Course Catalog", url: "/courses", icon: BookOpen },
  { title: "Training Plans", url: "/plans", icon: Calendar },
  { title: "Training Sessions", url: "/sessions", icon: Clock },
  { title: "Employee Scorecards", url: "/scorecards", icon: Users },
  { title: "Evaluations", url: "/evaluations", icon: GraduationCap },
  { title: "Cost Management", url: "/costs", icon: DollarSign },
  { title: "Certificate Alerts", url: "/alerts", icon: Bell },
  { title: "User Management", url: "/users", icon: Settings },
]

export function TrainingSidebar() {
  const location = useLocation()
  const currentPath = location.pathname

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
    <Sidebar collapsible="icon">
      <SidebarContent className="bg-card border-r">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-md flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div className="group-data-[collapsible=icon]:hidden">
              <div className="font-semibold text-sm">TMS</div>
              <div className="text-xs text-muted-foreground">Training System</div>
            </div>
          </div>
        </div>

        <SidebarGroup className="px-2">
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground mb-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-10">
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/"}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all ${getNavClass(item.url)}`}
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
      </SidebarContent>
    </Sidebar>
  )
}