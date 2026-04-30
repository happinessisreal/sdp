import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "./Sidebar";
import { GlobalErrorBoundary } from "../GlobalErrorBoundary";

export function AppLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-surface-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar could go here if needed, but sidebar is enough for now */}
        <main className="flex-1 overflow-y-auto bg-surface-50 p-6 lg:p-8">
          <GlobalErrorBoundary>
            <Outlet />
          </GlobalErrorBoundary>
        </main>
      </div>
    </div>
  );
}
