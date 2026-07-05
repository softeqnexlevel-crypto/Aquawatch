// routes.jsx (or wherever your router is defined)
import { createBrowserRouter, Outlet, Navigate, useLocation, useNavigate, RouterProvider } from "react-router";
import { useState } from "react";
import { DataProvider } from "./contexts/DataContext"; // ← ADD THIS

// Components
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
import TagRules from './components/TagRules';

// Configuration Pages
import Billing from "./components/Billing";
import { UserManagement } from "./components/UserManagement";

import { alerts } from "./data/mockData";
import { useAuth } from "./contexts/AuthContext";

// ==================== PAGE CONFIG ====================
const pageTitles = {
  "/app": "Executive Dashboard",
  "/app/tanklevel": "Tank Level",
  "/app/tagrules": "Tag Rules",
  "/app/production": "Production Monitoring",
  "/app/antiscalant": "Antiscalant Dosing",
  "/app/filtration": "Filtration Monitoring",
  "/app/recovery": "System Recovery",
  "/app/maintenance": "Maintenance Management",
  "/app/analytics": "Analytics",
  "/app/reports": "Reports",
  "/app/alerts": "Alerts Center",
  "/app/settings": "Settings",
  "/app/billing": "Billing",
  "/app/user": "User Management",
};

const pathToPage = {
  "/app": "dashboard",
  "/app/tanklevel": "boreholes",
  "/app/tagrules": "Tagmanager",
  "/app/production": "production",
  "/app/antiscalant": "antiscalant",
  "/app/filtration": "filtration",
  "/app/recovery": "recovery",
  "/app/maintenance": "maintenance",
  "/app/analytics": "analytics",
  "/app/reports": "reports",
  "/app/alerts": "alerts",
  "/app/settings": "settings",
  "/app/billing": "billing",
  "/app/user": "user",
};

const pageToPath = {
  dashboard: "/app",
  boreholes: "/app/tanklevel",
  Tagmanager: "/app/tagrules",
  production: "/app/production",
  antiscalant: "/app/antiscalant",
  filtration: "/app/filtration",
  recovery: "/app/recovery",
  maintenance: "/app/maintenance",
  analytics: "/app/analytics",
  reports: "/app/reports",
  alerts: "/app/alerts",
  settings: "/app/settings",
  billing: "/app/billing",
  user: "/app/user",
};

// ==================== LAYOUT ====================
function DashboardLayout() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("aquaDarkMode");
    return saved !== null ? saved === "true" : true;
  });

  const location = useLocation();
  const navigate = useNavigate();

  const activeAlerts = alerts.filter((a) => a.status === "Active").length;
  const currentPage = pathToPage[location.pathname] || "dashboard";
  const title = pageTitles[location.pathname] || "AquaOps";

  const handleNavigate = (page) => {
    const path = pageToPath[page];
    if (path) navigate(path);
  };

  const handleToggleDark = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("aquaDarkMode", newMode);
  };

  return (
    <div className={darkMode ? "dark" : ""} style={{ width: "100%", height: "100vh", display: "flex", overflow: "hidden", background: "var(--background)" }}>
      <Sidebar
        activePage={currentPage}
        onNavigate={handleNavigate}
        alertCount={activeAlerts}
      />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TopNav
          darkMode={darkMode}
          onToggleDark={handleToggleDark}
          alertCount={activeAlerts}
          title={title}
        />
        <main style={{ flex: 1, overflow: "auto", padding: "24px" }}>
          {/* WRAP OUTLET WITH DATAPROVIDER */}
          <DataProvider>
            <Outlet />
          </DataProvider>
        </main>
      </div>
    </div>
  );
}

// ==================== PROTECTED ROUTE ====================
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/" replace />;
  }
  return children;
}

// ==================== LANDING PAGE WRAPPER ====================
function LandingPageWrapper() {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("aquaDarkMode");
    return saved !== null ? saved === "true" : true;
  });

  const handleToggleDark = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("aquaDarkMode", newMode);
  };

  const handleGetStarted = () => {
    navigate("/app");
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

// ==================== ROUTER ====================
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
      { path: "tanklevel", Component: BoreholeManagement },
      { path: "tagrules", Component: TagRules },
      { path: "production", Component: ProductionMonitoring },
      { path: "antiscalant", Component: AntiscalantDosing },
      { path: "filtration", Component: FiltrationMonitoring },
      { path: "recovery", Component: SystemRecovery },
      { path: "maintenance", Component: MaintenanceManagement },
      { path: "analytics", Component: Analytics },
      { path: "reports", Component: Reports },
      { path: "alerts", Component: AlertsCenter },
      { path: "settings", Component: Settings },
      { path: "billing", Component: Billing },
      { path: "user", Component: UserManagement },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}