import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { GlobalErrorBoundary } from "./components/GlobalErrorBoundary";
import { AppLayout } from "./components/layout/AppLayout";
import { AuthLayout } from "./components/layout/AuthLayout";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Students } from "./pages/Students";

export default function App() {
  return (
    <GlobalErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
            </Route>

            {/* Protected Routes */}
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              
              {/* Placeholders for other routes */}
              <Route path="/students" element={<Students />} />
              <Route path="/teachers" element={<div className="p-4"><h1 className="text-2xl font-bold">Teachers</h1><p className="text-surface-600">Coming soon.</p></div>} />
              <Route path="/classes" element={<div className="p-4"><h1 className="text-2xl font-bold">Classes</h1><p className="text-surface-600">Coming soon.</p></div>} />
              <Route path="/attendance" element={<div className="p-4"><h1 className="text-2xl font-bold">Attendance</h1><p className="text-surface-600">Coming soon.</p></div>} />
              <Route path="/payments" element={<div className="p-4"><h1 className="text-2xl font-bold">Payments</h1><p className="text-surface-600">Coming soon.</p></div>} />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </GlobalErrorBoundary>
  );
}
