import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DashboardSkeleton } from "@/components/DashboardSkeletons";

// Lazy loading de páginas para code splitting
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Auth = lazy(() => import("./pages/Auth"));
const Admin = lazy(() => import("./pages/Admin"));
const RiskTerminal = lazy(() => import("./pages/RiskTerminal"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Profile = lazy(() => import("./pages/Profile"));
const NotFound = lazy(() => import("./pages/NotFound"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Loading component para lazy loaded routes
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
      <p className="text-muted-foreground">Carregando...</p>
    </div>
  </div>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/privacy" element={<PrivacyPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <ErrorBoundary>
                          <Suspense fallback={<DashboardSkeleton />}>
                            <Dashboard />
                          </Suspense>
                        </ErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <ErrorBoundary>
                          <Suspense fallback={<PageLoader />}>
                            <Profile />
                          </Suspense>
                        </ErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute requireAdmin>
                        <ErrorBoundary>
                          <Suspense fallback={<PageLoader />}>
                            <Admin />
                          </Suspense>
                        </ErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/risk-terminal"
                    element={
                      <ProtectedRoute>
                        <ErrorBoundary>
                          <Suspense fallback={<PageLoader />}>
                            <RiskTerminal />
                          </Suspense>
                        </ErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/analytics"
                    element={
                      <ProtectedRoute>
                        <ErrorBoundary>
                          <Suspense fallback={<PageLoader />}>
                            <Analytics />
                          </Suspense>
                        </ErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
