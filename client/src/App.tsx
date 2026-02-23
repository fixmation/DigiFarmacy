import React, { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { LanguageProvider } from "@/contexts/LanguageContext";

import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import AdminAuth from "./pages/AdminAuth";
import Contact from "./pages/Contact";
import PDPA from "./pages/PDPA";
import DrugInfo from "./pages/DrugInfo";
import HowToUse from "./pages/HowToUse";
import LabBooking from "./pages/LabBooking";
import NotFound from "./pages/NotFound";
import PrescriptionScanner from "./pages/PrescriptionScanner";
import Privacy from "./pages/Privacy";
import TermsOfService from "./pages/TermsOfService";
import VoiceAssistant from "./pages/VoiceAssistant";
import Workflow from "./pages/Workflow";
import Login from "./pages/Login";
import VerifyEmail from "./pages/VerifyEmail";
import CheckoutPage from "./pages/CheckoutPage";
import RoleMiddleware from "./components/auth/RoleMiddleware";
import OpsDashboard from "./pages/OpsDashboard"; // Import the new dashboard

const queryClient = new QueryClient();

// Scroll to top utility
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              {/* Public landing page - shows AuthModal for unauthenticated users */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/admin-auth" element={<AdminAuth />} />
              <Route path="/how-to-use" element={<HowToUse />} />
              <Route path="/pdpa" element={<PDPA />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/contact" element={<Contact />} />

              {/* Protected routes - require pharmacy/lab/admin roles */}
              <Route
                path="/ops-dashboard"
                element={
                  <RoleMiddleware
                    roles={['pharmacy', 'admin', 'developer_admin']}
                  >
                    <OpsDashboard />
                  </RoleMiddleware>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <RoleMiddleware
                    roles={['pharmacy', 'laboratory', 'admin', 'developer_admin']}
                  >
                    <Dashboard />
                  </RoleMiddleware>
                }
              />
              <Route path="/drug-info" element={<RoleMiddleware><DrugInfo /></RoleMiddleware>} />
              <Route path="/lab-booking" element={<RoleMiddleware><LabBooking /></RoleMiddleware>} />
              <Route path="/prescription-scanner" element={<RoleMiddleware><PrescriptionScanner /></RoleMiddleware>} />
              <Route path="/voice-assistant" element={<RoleMiddleware><VoiceAssistant /></RoleMiddleware>} />
              <Route path="/workflow" element={<RoleMiddleware><Workflow /></RoleMiddleware>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;