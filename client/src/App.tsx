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
import LabBooking from "./pages/LabBooking";
import PDPA from "./pages/PDPA";
import TermsOfService from "./pages/TermsOfService";
import HowToUse from "./pages/HowToUse";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import PrescriptionScanner from "./pages/PrescriptionScanner";
import VoiceAssistant from "./pages/VoiceAssistant";
import DrugInfo from "./pages/DrugInfo";
import Privacy from "./pages/Privacy";
import Workflow from "./pages/Workflow";

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
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin-auth" element={<AdminAuth />} />
            <Route path="/lab-booking" element={<LabBooking />} />
            <Route path="/pharmacies" element={<Index />} />
            <Route path="/prescription-scanner" element={<PrescriptionScanner />} />
            <Route path="/voice-assistant" element={<VoiceAssistant />} />
            <Route path="/drug-info" element={<DrugInfo />} />
            <Route path="/drug-information" element={<DrugInfo />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/pdpa" element={<PDPA />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/how-to-use" element={<HowToUse />} />
            <Route path="/workflow" element={<Workflow />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;