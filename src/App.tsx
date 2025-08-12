import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TrainingLayout } from "@/components/TrainingLayout";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import Plans from "./pages/Plans";
import Sessions from "./pages/Sessions";
import Scorecards from "./pages/Scorecards";
import Evaluations from "./pages/Evaluations";
import Costs from "./pages/Costs";
import Alerts from "./pages/Alerts";
import UserManagement from "./pages/UserManagement";
import TranslationManagement from "./pages/TranslationManagement";
import TrainingRequests from "./pages/TrainingRequests";
import Admin from "./pages/Admin";
import GeminiConfig from "./pages/GeminiConfig";
import Workflows from "./pages/Workflows";
import MyTasks from "./pages/MyTasks";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import AdminRoles from "./pages/AdminRoles";
import AdminAuditLogs from "./pages/AdminAuditLogs";
import OrganizationSettings from "./pages/OrganizationSettings";
import EmailTemplates from "./pages/EmailTemplates";
import WorkflowObservability from "./pages/WorkflowObservability";
import { ThemeProvider } from "next-themes";
import { GlobalErrorBoundary } from "@/components/GlobalErrorBoundary";
 
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <GlobalErrorBoundary>
      <AuthProvider>
        <LanguageProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<ProtectedRoute><TrainingLayout><Dashboard /></TrainingLayout></ProtectedRoute>} />
              <Route path="/courses" element={<ProtectedRoute><TrainingLayout><Courses /></TrainingLayout></ProtectedRoute>} />
              <Route path="/plans" element={<ProtectedRoute><TrainingLayout><Plans /></TrainingLayout></ProtectedRoute>} />
              <Route path="/sessions" element={<ProtectedRoute><TrainingLayout><Sessions /></TrainingLayout></ProtectedRoute>} />
              <Route path="/scorecards" element={<ProtectedRoute><TrainingLayout><Scorecards /></TrainingLayout></ProtectedRoute>} />
              <Route path="/evaluations" element={<ProtectedRoute><TrainingLayout><Evaluations /></TrainingLayout></ProtectedRoute>} />
              <Route path="/costs" element={<ProtectedRoute><TrainingLayout><Costs /></TrainingLayout></ProtectedRoute>} />
              <Route path="/alerts" element={<ProtectedRoute><TrainingLayout><Alerts /></TrainingLayout></ProtectedRoute>} />
              <Route path="/users" element={<ProtectedRoute><TrainingLayout><UserManagement /></TrainingLayout></ProtectedRoute>} />
              <Route path="/translations" element={<ProtectedRoute><TrainingLayout><TranslationManagement /></TrainingLayout></ProtectedRoute>} />
              <Route path="/training-requests" element={<ProtectedRoute><TrainingLayout><TrainingRequests /></TrainingLayout></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><TrainingLayout><AdminLayout><Admin /></AdminLayout></TrainingLayout></ProtectedRoute>} />
              <Route path="/workflows" element={<ProtectedRoute><TrainingLayout><Workflows /></TrainingLayout></ProtectedRoute>} />
              <Route path="/my-tasks" element={<ProtectedRoute><TrainingLayout><MyTasks /></TrainingLayout></ProtectedRoute>} />
              <Route path="/admin/gemini-config" element={<ProtectedRoute><TrainingLayout><AdminLayout><GeminiConfig /></AdminLayout></TrainingLayout></ProtectedRoute>} />
              <Route path="/admin/roles" element={<ProtectedRoute><TrainingLayout><AdminLayout><AdminRoles /></AdminLayout></TrainingLayout></ProtectedRoute>} />
              <Route path="/admin/audit-logs" element={<ProtectedRoute><TrainingLayout><AdminLayout><AdminAuditLogs /></AdminLayout></TrainingLayout></ProtectedRoute>} />
              <Route path="/admin/org-settings" element={<ProtectedRoute><TrainingLayout><AdminLayout><OrganizationSettings /></AdminLayout></TrainingLayout></ProtectedRoute>} />
              <Route path="/admin/email-templates" element={<ProtectedRoute><TrainingLayout><AdminLayout><EmailTemplates /></AdminLayout></TrainingLayout></ProtectedRoute>} />
              <Route path="/admin/workflow-observability" element={<ProtectedRoute><TrainingLayout><AdminLayout><WorkflowObservability /></AdminLayout></TrainingLayout></ProtectedRoute>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
          </ThemeProvider>
      </LanguageProvider>
    </AuthProvider>
    </GlobalErrorBoundary>
  </QueryClientProvider>
);

export default App;
