import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Upload from "./pages/Upload";
import Profile from "./pages/Profile";
import ProjectDetail from "./pages/ProjectDetail";
import Analytics from "./pages/Analytics";
import Freelance from "./pages/Freelance";
import Purchases from "./pages/Purchases";
import Settings from "./pages/Settings";
import HirerDashboard from "./pages/HirerDashboard";
import EditAvailability from "./pages/EditAvailability";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/freelance" element={<Freelance />} />
          <Route path="/purchases" element={<Purchases />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/hirer-dashboard" element={<HirerDashboard />} />
          <Route path="/edit-availability" element={<EditAvailability />} />
          <Route path="/project/:id" element={<ProjectDetail />} />
          <Route path="/:username" element={<Profile />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
