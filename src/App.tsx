import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TrainingLayout } from "@/components/TrainingLayout";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import Plans from "./pages/Plans";
import Sessions from "./pages/Sessions";
import Scorecards from "./pages/Scorecards";
import Evaluations from "./pages/Evaluations";
import Costs from "./pages/Costs";
import Alerts from "./pages/Alerts";
import UserManagement from "./pages/UserManagement";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
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
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
