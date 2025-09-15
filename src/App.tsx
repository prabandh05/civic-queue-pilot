import "./App.css";
import { Toaster } from "@/components/ui/toaster";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Index } from "./pages/Index";
import { CitizenDashboard } from "./pages/CitizenDashboard";
import { OfficerDashboard } from "./pages/OfficerDashboard";
import { NotFound } from "./pages/NotFound";
import { LiveQueueDisplay } from "./components/queue/LiveQueueDisplay";
import { useAuth } from "./hooks/use-auth";
import { Loader2 } from "lucide-react";

// Protected Route Component
const ProtectedRoute = ({ children, requireRole }: { children: React.ReactNode; requireRole?: 'citizen' | 'officer' | 'admin' }) => {
  const { isAuthenticated, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (requireRole && profile?.role !== requireRole && profile?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background text-foreground">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/display" element={<LiveQueueDisplay />} />
          <Route 
            path="/citizen" 
            element={
              <ProtectedRoute requireRole="citizen">
                <CitizenDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/officer" 
            element={
              <ProtectedRoute requireRole="officer">
                <OfficerDashboard />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </div>
    </Router>
  );
}

export default App;