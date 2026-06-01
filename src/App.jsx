import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// 1. Landing Page Section Imports
import Hero from "./components/Hero";
import StatsBar from "./components/StatsBar";
import Features from "./components/Features";
import StationShowcase from "./components/StationShowcase";
import Pricing from "./components/Pricing";
import Testimonials from "./components/Testimonials";
import CTA from "./components/CTA";
import LiveTicker from "./components/LiveTicker";
import Footer from "./components/Footer";

// 2. Internal App Infrastructure Layout
import AppLayout from './components/AppLayout';

// 3. Functional Workspace View Pages
import Dashboard from './pages/Dashboard';
import Stations from './pages/Stations';
import TagRules from './pages/TagRules';
import Alarms from './pages/Alarms';
import Analytics from './pages/Analytics';
import Billing from './pages/Billing';

// Complete Unified System Router Tree
const router = createBrowserRouter([
  {
    path: '/',
    // Keeps your public landing page isolated, clean, and full-width
    element: (
      <> 
     
        <Hero />
        <StatsBar />
        <Features />
        <StationShowcase />
        <Pricing />
        <Testimonials />
        <CTA />
        <LiveTicker />
        <Footer />
      </>
    ), 
  },
  {
    path: '/admin',
    element: <AppLayout />, // Contains your Sidebar + Header + <Outlet />
    children: [
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'stations', element: <Stations /> },
      { path: 'tags', element: <TagRules /> },
      { path: 'alarms', element: <Alarms /> },
      { path: 'analytics', element: <Analytics /> },
      { path: 'billing', element: <Billing /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}