/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense } from "react";
import { Navigate, createBrowserRouter } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Landing from "@/pages/Landing";
import Resumes from "@/pages/Resumes";
import ResumeDetail from "@/pages/ResumeDetail";
import Versions from "@/pages/Versions";
import History from "@/pages/History";
import Settings from "@/pages/Settings";
import { useAuth } from "@/context/AuthContext";

// Heavy bundles: code-split with React.lazy
const ExportPage = lazy(() => import("@/pages/Export"));
const Insights = lazy(() => import("@/pages/Insights"));

function PageLoadingFallback({ label = "Loading page..." }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex-1 min-h-[360px] flex flex-col items-center justify-center gap-3 text-[var(--ink-muted)] animate-in fade-in duration-200"
    >
      <Loader2 size={24} className="animate-spin text-[var(--accent)]" aria-hidden="true" />
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}

function ProtectedShell() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--ink-muted)] text-sm"
      >
        <div className="flex flex-col items-center gap-2">
          <Loader2 size={22} className="animate-spin text-[var(--accent)]" aria-hidden="true" />
          <span>Loading session…</span>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <AppShell />;
}

export const router = createBrowserRouter([
  { path: "/", element: <Landing /> },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  {
    path: "/",
    element: <ProtectedShell />,
    children: [
      { path: "dashboard", element: <Dashboard /> },
      { path: "resumes", element: <Resumes /> },
      { path: "resumes/:id", element: <ResumeDetail /> },
      {
        path: "resumes/:id/export",
        element: (
          <Suspense fallback={<PageLoadingFallback label="Loading PDF exporter…" />}>
            <ExportPage />
          </Suspense>
        ),
      },
      {
        path: "insights",
        element: (
          <Suspense fallback={<PageLoadingFallback label="Loading analytics insights…" />}>
            <Insights />
          </Suspense>
        ),
      },
      { path: "versions", element: <Versions /> },
      { path: "history", element: <History /> },
      { path: "settings", element: <Settings /> },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
