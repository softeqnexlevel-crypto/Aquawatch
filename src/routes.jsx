import { createBrowserRouter, Outlet } from "react-router";
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
  "/": "Executive Dashboard",
  "/boreholes": "Borehole Management",
  "/production": "Production Monitoring",
  "/antiscalant": "Antiscalant Dosing",
  "/filtration": "Filtration Monitoring",
  "/recovery": "System Recovery",
  "/maintenance": "Maintenance Management",
  "/analytics": "Analytics",
  "/reports": "Reports",
  "/alerts": "Alerts Center",
  "/settings": "Settings",
};

const pathToPage = {
  "/": "dashboard",
  "/boreholes": "boreholes",
  "/production": "production",
  "/antiscalant": "antiscalant",
  "/filtration": "filtration",
  "/recovery": "recovery",
  "/maintenance": "maintenance",
  "/analytics": "analytics",
  "/reports": "reports",
  "/alerts": "alerts",
  "/settings": "settings",
};

const pageToPath = {
  dashboard: "/",
  boreholes: "/boreholes",
  production: "/production",
  antiscalant: "/antiscalant",
  filtration: "/filtration",
  recovery: "/recovery",
  maintenance: "/maintenance",
  analytics: "/analytics",
  reports: "/reports",
  alerts: "/alerts",
  settings: "/settings",
};

function Root() {
  const [darkMode, setDarkMode] = useState(true);
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

const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
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
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("aquaDarkMode");
    return saved !== null ? saved === "true" : true;
  });
  const [showDashboard, setShowDashboard] = useState(() => {
    return localStorage.getItem("aquaDashboardVisited") === "true";
  });

  const handleToggleDark = () => {
    setDarkMode((d) => !d);
    localStorage.setItem("aquaDarkMode", !darkMode);
  };

  const handleGetStarted = () => {
    localStorage.setItem("aquaDashboardVisited", "true");
    setShowDashboard(true);
  };

  if (!showDashboard) {
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

  return <RouterProvider router={router} />;
}