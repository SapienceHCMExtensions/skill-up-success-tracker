import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TrainingLayout } from "@/components/TrainingLayout";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import Plans from "./pages/Plans";
import Scorecards from "./pages/Scorecards";
import Evaluations from "./pages/Evaluations";
import Costs from "./pages/Costs";
import Alerts from "./pages/Alerts";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<TrainingLayout><Dashboard /></TrainingLayout>} />
          <Route path="/courses" element={<TrainingLayout><Courses /></TrainingLayout>} />
          <Route path="/plans" element={<TrainingLayout><Plans /></TrainingLayout>} />
          <Route path="/scorecards" element={<TrainingLayout><Scorecards /></TrainingLayout>} />
          <Route path="/evaluations" element={<TrainingLayout><Evaluations /></TrainingLayout>} />
          <Route path="/costs" element={<TrainingLayout><Costs /></TrainingLayout>} />
          <Route path="/alerts" element={<TrainingLayout><Alerts /></TrainingLayout>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
