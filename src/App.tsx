import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { TokenProvider } from "@/contexts/TokenContext";
import { StudentsProvider } from "@/contexts/StudentsContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import * as React from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import TokenCounter from "./pages/TokenCounter";
import TokenManagement from "./pages/TokenManagement";
import Verification from "./pages/Verification";
import Counter2Students from "./pages/Counter2Students";
import Counter2Verification from "./pages/Counter2Verification";
import Students from "./pages/Students";
import Grades from "./pages/Grades";
import Hostel from "./pages/Hostel";
import HostelInfo from "./pages/HostelInfo";
import HostelDashboard from "./pages/HostelDashboard";
import HostelRooms from "./pages/HostelRooms";
import HostelResidents from "./pages/HostelResidents";
import HostelBeds from "./pages/HostelBeds";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import UserManagement from "./pages/UserManagement";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import PublicSlip from "./pages/PublicSlip";

const queryClient = new QueryClient();

class AppErrorBoundary extends React.Component<React.PropsWithChildren, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.error("App crashed:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="text-xl font-semibold">کچھ خرابی پیش آئی</div>
            <div className="text-sm text-muted-foreground">براہ کرم صفحہ ریفریش کریں</div>
            <button
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-primary-foreground"
              onClick={() => window.location.reload()}
            >
              ریفریش
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppErrorBoundary>
        {(() => {
          const isElectron = Boolean((window as any)?.electron?.isElectron);
          const isFileProtocol = window.location.protocol === "file:";
          const Router = isElectron || isFileProtocol ? HashRouter : BrowserRouter;

          return (
            <Router
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
              <AuthProvider>
                <TokenProvider>
                  <StudentsProvider>
                    <Routes>
                      <Route path="/" element={<Navigate to="/login" replace />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/slip/:tokenNumber" element={<PublicSlip />} />

                      {/* Admin Routes */}
                      <Route
                        path="/dashboard"
                        element={
                          <ProtectedRoute allowedRoles={["admin"]}>
                            <Dashboard />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/students"
                        element={
                          <ProtectedRoute allowedRoles={["admin"]}>
                            <Students />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/grades"
                        element={
                          <ProtectedRoute allowedRoles={["admin"]}>
                            <Grades />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/hostel"
                        element={
                          <ProtectedRoute allowedRoles={["admin"]}>
                            <Hostel />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/hostel/info"
                        element={
                          <ProtectedRoute allowedRoles={["admin"]}>
                            <HostelInfo />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/hostel/dashboard"
                        element={
                          <ProtectedRoute allowedRoles={["admin"]}>
                            <HostelDashboard />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/hostel/rooms"
                        element={
                          <ProtectedRoute allowedRoles={["admin"]}>
                            <HostelRooms />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/hostel/residents"
                        element={
                          <ProtectedRoute allowedRoles={["admin"]}>
                            <HostelResidents />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/hostel/beds"
                        element={
                          <ProtectedRoute allowedRoles={["admin"]}>
                            <HostelBeds />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/reports"
                        element={
                          <ProtectedRoute allowedRoles={["admin"]}>
                            <Reports />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/settings"
                        element={
                          <ProtectedRoute allowedRoles={["admin"]}>
                            <Settings />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/users"
                        element={
                          <ProtectedRoute allowedRoles={["admin"]}>
                            <UserManagement />
                          </ProtectedRoute>
                        }
                      />

                      {/* Counter 2 Verification – Admin + Counter2 */}
                      <Route
                        path="/counter2-verification"
                        element={
                          <ProtectedRoute allowedRoles={["admin", "counter2"]}>
                            <Counter2Verification />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/profile"
                        element={
                          <ProtectedRoute allowedRoles={["admin", "counter1", "counter2"]}>
                            <Profile />
                          </ProtectedRoute>
                        }
                      />

                      {/* Counter 1 Routes */}
                      <Route
                        path="/token-counter"
                        element={
                          <ProtectedRoute allowedRoles={["counter1"]}>
                            <TokenCounter />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/token-management"
                        element={
                          <ProtectedRoute allowedRoles={["counter1"]}>
                            <TokenManagement />
                          </ProtectedRoute>
                        }
                      />

                      {/* Counter 2 Routes */}
                      <Route
                        path="/verification"
                        element={
                          <ProtectedRoute allowedRoles={["counter2"]}>
                            <Verification />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/counter2-students"
                        element={
                          <ProtectedRoute allowedRoles={["counter2"]}>
                            <Counter2Students />
                          </ProtectedRoute>
                        }
                      />

                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </StudentsProvider>
                </TokenProvider>
              </AuthProvider>
            </Router>
          );
        })()}
      </AppErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
