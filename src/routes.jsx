import { createBrowserRouter, Outlet, Navigate } from "react-router";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { RouterProvider } from "react-router";

import { Sidebar } from "./components/Sidebar";
import { TopNav } from "./components/TopNav";
import { Dashboard } from "./components/Dashboard";
import { BoreholeManagement } from "./components/BoreholeManagement";
import { ProductionMonitoring } from "./components/ProductionMonitoring";
import { AntiscalantDosing } from "./components/AntiscalantDosing";
import { FiltrationMonitoring } from "./components/FiltrationMonitoring";
import { SystemRecovery } from "./components/SystemRecovery";
import { MaintenanceManagement } from "./components/MaintanceManagement";
import { Analytics } from "./components/Analytics";
import { Reports } from "./components/Reports";
import { AlertsCenter } from "./components/AlertsCenter";
import { Settings } from "./components/Settings";
import LandingPage from "./components/LandingPage";

import { alerts } from "./data/mockData";

// Dashboard page titles (now under /app)
const pageTitles = {
  "/app": "Executive Dashboard",
  "/app/boreholes": "Borehole Management",
  "/app/production": "Production Monitoring",
  "/app/antiscalant": "Antiscalant Dosing",
  "/app/filtration": "Filtration Monitoring",
  "/app/recovery": "System Recovery",
  "/app/maintenance": "Maintenance Management",
  "/app/analytics": "Analytics",
  "/app/reports": "Reports",
  "/app/alerts": "Alerts Center",
  "/app/settings": "Settings",
};

const pathToPage = {
  "/app": "dashboard",
  "/app/boreholes": "boreholes",
  "/app/production": "production",
  "/app/antiscalant": "antiscalant",
  "/app/filtration": "filtration",
  "/app/recovery": "recovery",
  "/app/maintenance": "maintenance",
  "/app/analytics": "analytics",
  "/app/reports": "reports",
  "/app/alerts": "alerts",
  "/app/settings": "settings",
};

const pageToPath = {
  dashboard: "/app",
  boreholes: "/app/boreholes",
  production: "/app/production",
  antiscalant: "/app/antiscalant",
  filtration: "/app/filtration",
  recovery: "/app/recovery",
  maintenance: "/app/maintenance",
  analytics: "/app/analytics",
  reports: "/app/reports",
  alerts: "/app/alerts",
  settings: "/app/settings",
};

// Dashboard Layout Component
function DashboardLayout() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("aquaDarkMode");
    return saved !== null ? saved === "true" : true;
  });
  const [, forceUpdate] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => forceUpdate((n) => n + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeAlerts = alerts.filter((a) => a.status === "Active").length;
  const currentPage = pathToPage[location.pathname] || "dashboard";
  const title = pageTitles[location.pathname] || "AquaOps";

  const handleNavigate = (page) => {
    navigate(pageToPath[page]);
  };

  const handleToggleDark = () => {
    setDarkMode((d) => !d);
    localStorage.setItem("aquaDarkMode", !darkMode);
  };

  return (
    <div
      className={darkMode ? "dark" : ""}
      style={{
        width: "100%",
        height: "100vh",
        display: "flex",
        overflow: "hidden",
        background: "var(--background)",
        fontFamily: "var(--font-sans)",
      }}
    >
      <Sidebar 
        activePage={currentPage} 
        onNavigate={handleNavigate} 
        alertCount={activeAlerts} 
      />

      <div style={{ 
        flex: 1, 
        display: "flex", 
        flexDirection: "column", 
        overflow: "hidden", 
        minWidth: 0 
      }}>
        <TopNav
          darkMode={darkMode}
          onToggleDark={handleToggleDark}
          alertCount={activeAlerts}
          title={title}
        />
        <main style={{ flex: 1, overflow: "hidden" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// Protected Route wrapper - redirects to landing if not visited
function ProtectedRoute({ children }) {
  const hasVisited = localStorage.getItem("aquaDashboardVisited") === "true";
  
  if (!hasVisited) {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

// Main Router - Landing at "/", Dashboard at "/app"
const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPageWrapper />,
  },
  {
    path: "/app",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, Component: Dashboard },
      { path: "boreholes", Component: BoreholeManagement },
      { path: "production", Component: ProductionMonitoring },
      { path: "antiscalant", Component: AntiscalantDosing },
      { path: "filtration", Component: FiltrationMonitoring },
      { path: "recovery", Component: SystemRecovery },
      { path: "maintenance", Component: MaintenanceManagement },
      { path: "analytics", Component: Analytics },
      { path: "reports", Component: Reports },
      { path: "alerts", Component: AlertsCenter },
      { path: "settings", Component: Settings },
    ],
  },
  // Redirect any unknown dashboard paths to /app
  {
    path: "/dashboard/*",
    element: <Navigate to="/app" replace />,
  },
]);

// Landing Page Wrapper with dark mode support
function LandingPageWrapper() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("aquaDarkMode");
    return saved !== null ? saved === "true" : true;
  });

  const handleToggleDark = () => {
    setDarkMode((d) => !d);
    localStorage.setItem("aquaDarkMode", !darkMode);
  };

  const handleGetStarted = () => {
    localStorage.setItem("aquaDashboardVisited", "true");
    // Navigate to dashboard
    window.location.href = "/app";
  };

  return (
    <div className={darkMode ? "dark" : ""}>
      <LandingPage 
        onGetStarted={handleGetStarted}
        darkMode={darkMode}
        onToggleDark={handleToggleDark}
      />
    </div>
  );
}

export function AppRouter() {
  return <RouterProvider router={router} />;
}