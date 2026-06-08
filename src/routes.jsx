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

const pageTitles = {
  "/dashboard": "Executive Dashboard",
  "/dashboard/boreholes": "Borehole Management",
  "/dashboard/production": "Production Monitoring",
  "/dashboard/antiscalant": "Antiscalant Dosing",
  "/dashboard/filtration": "Filtration Monitoring",
  "/dashboard/recovery": "System Recovery",
  "/dashboard/maintenance": "Maintenance Management",
  "/dashboard/analytics": "Analytics",
  "/dashboard/reports": "Reports",
  "/dashboard/alerts": "Alerts Center",
  "/dashboard/settings": "Settings",
};

const pathToPage = {
  "/dashboard": "dashboard",
  "/dashboard/boreholes": "boreholes",
  "/dashboard/production": "production",
  "/dashboard/antiscalant": "antiscalant",
  "/dashboard/filtration": "filtration",
  "/dashboard/recovery": "recovery",
  "/dashboard/maintenance": "maintenance",
  "/dashboard/analytics": "analytics",
  "/dashboard/reports": "reports",
  "/dashboard/alerts": "alerts",
  "/dashboard/settings": "settings",
};

const pageToPath = {
  dashboard: "/dashboard",
  boreholes: "/dashboard/boreholes",
  production: "/dashboard/production",
  antiscalant: "/dashboard/antiscalant",
  filtration: "/dashboard/filtration",
  recovery: "/dashboard/recovery",
  maintenance: "/dashboard/maintenance",
  analytics: "/dashboard/analytics",
  reports: "/dashboard/reports",
  alerts: "/dashboard/alerts",
  settings: "/dashboard/settings",
};

function Root() {
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

// Landing page wrapper with dark mode
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
    window.location.href = "/dashboard";
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

// Protected route wrapper
function ProtectedRoute({ children }) {
  const hasVisited = localStorage.getItem("aquaDashboardVisited") === "true";
  
  if (!hasVisited) {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

// Main router
const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPageWrapper />,
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <Root />
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
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}