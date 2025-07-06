import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { TrainingSidebar } from "@/components/TrainingSidebar"

interface TrainingLayoutProps {
  children: React.ReactNode
}

export function TrainingLayout({ children }: TrainingLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-dashboard">
        <TrainingSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b bg-card shadow-sm flex items-center px-6">
            <SidebarTrigger className="mr-4" />
            <div className="flex items-center justify-between w-full">
              <div>
                <h1 className="text-xl font-semibold text-foreground">Training Management System</h1>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  Welcome, Training Manager
                </div>
              </div>
            </div>
          </header>
          
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}