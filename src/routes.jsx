// routes.jsx - FULLY RESPONSIVE WITH DARK MODE

import { createBrowserRouter, Outlet, Navigate, useLocation, useNavigate, RouterProvider } from "react-router";
import { useState, useEffect } from "react";
import { DataProvider } from "./contexts/DataContext";
import { ScrollContainer } from "./components/ScrollContainer";

// Components
import { Sidebar } from "./components/Sidebar";
import { TopNav } from "./components/TopNav";
import { Dashboard } from "./components/Dashboard";
import { FeedTankManagement } from "./components/BoreholeManagement";
import { ProductionMonitoring } from "./components/ProductionMonitoring";
import { AntiscalantDosing } from "./components/AntiscalantDosing";
import { FiltrationMonitoring } from "./components/FiltrationMonitoring";
import { SystemRecovery } from "./components/SystemRecovery";
import { MaintenanceManagement } from "./components/MaintanceManagement";
import { Analytics } from "./components/Analytics";
import { Reports } from "./components/Reports";
import { AlertsCenter } from "./components/AlertsCenter";
import { Settings } from "./components/Settings";
import Login from "./components/Login";
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

// ==================== DARK MODE PROVIDER ====================
function useDarkMode() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("aquaDarkMode");
    return saved !== null ? saved === "true" : true;
  });

  useEffect(() => {
    // Apply dark mode class to document
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem("aquaDarkMode", darkMode);
  }, [darkMode]);

  const toggleDark = () => setDarkMode(prev => !prev);

  return { darkMode, toggleDark };
}

// ==================== LAYOUT ====================
function DashboardLayout() {
  const { darkMode, toggleDark } = useDarkMode();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const activeAlerts = alerts.filter((a) => a.status === "Active").length;
  const currentPage = pathToPage[location.pathname] || "dashboard";
  const title = pageTitles[location.pathname] || "AquaSystemTech";

  const handleNavigate = (page) => {
    const path = pageToPath[page];
    if (path) navigate(path);
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
        position: "relative",
      }}
    >
      {/* Sidebar - hidden on mobile when not open */}
      <div style={{ 
        flexShrink: 0,
        zIndex: 50,
      }}>
        <Sidebar
          activePage={currentPage}
          onNavigate={handleNavigate}
          alertCount={activeAlerts}
        />
      </div>

      {/* Main content */}
      <div style={{ 
        flex: 1, 
        display: "flex", 
        flexDirection: "column", 
        overflow: "hidden",
        minWidth: 0, // Prevents overflow
      }}>
        <TopNav
          darkMode={darkMode}
          onToggleDark={toggleDark}
          alertCount={activeAlerts}
          title={title}
        />
        
        <ScrollContainer>
          <DataProvider>
            <div style={{ 
              padding: isMobile ? '8px' : '16px',
              height: '100%',
              overflow: 'auto',
            }}>
              <Outlet />
            </div>
          </DataProvider>
        </ScrollContainer>
      </div>
    </div>
  );
}

// ==================== PROTECTED ROUTE ====================
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// ==================== LOGIN PAGE WRAPPER ====================
function LoginPageWrapper() {
  const navigate = useNavigate();
  const { darkMode } = useDarkMode();

  const handleLoginSuccess = (user) => {
    navigate("/app");
  };

  return (
    <div className={darkMode ? "dark" : ""} style={{ 
      minHeight: "100vh", 
      background: "var(--background)" 
    }}>
      <Login 
        onLoginSuccess={handleLoginSuccess}
        isModal={false}
      />
    </div>
  );
}

// ==================== ROUTER ====================
const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPageWrapper />,
  },
  {
    path: "/",
    element: <Navigate to="/login" replace />,
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
      { path: "tanklevel", Component: FeedTankManagement },
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