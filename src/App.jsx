// import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// // Landing page sections
// import Navbar from "./components/Navbar";
// import Hero from "./components/Hero";
// import StatsBar from "./components/StatsBar";
// import Features from "./components/Features";
// import StationShowcase from "./components/StationShowcase";
// import Pricing from "./components/Pricing";
// import Testimonials from "./components/Testimonials";
// import CTA from "./components/CTA";
// import LiveTicker from "./components/LiveTicker";
// import Footer from "./components/Footer";

// // Admin
// import AppLayout from './components/AppLayout';
// import Dashboard from './pages/Dashboard';
// import Stations from './pages/Stations';
// import TagRules from './pages/TagRules';
// import Alarms from './pages/Alarms';
// import Analytics from './pages/Analytics';
// import Billing from './pages/Billing';

// const router = createBrowserRouter([
//   {
//     path: '/',
//     element: (
//       <>
//         <Navbar />
//         <Hero />
//         <StatsBar />
//         <Features />
//         <StationShowcase />
//         <Pricing />
//         <Testimonials />
//         <CTA />
//         <LiveTicker />
//         <Footer />
//       </>
//     ),
//   },
//   {
//     path: '/admin',
//     element: <AppLayout />,
//     children: [
//       { path: 'dashboard', element: <Dashboard /> },
//       { path: 'stations',  element: <Stations /> },
//       { path: 'tags',      element: <TagRules /> },
//       { path: 'alarms',    element: <Alarms /> },
//       { path: 'analytics', element: <Analytics /> },
//       { path: 'billing',   element: <Billing /> },
//     ],
//   },
// ]);

// export default function App() {
//   return <RouterProvider router={router} />;
// }

import { AppRouter } from "./routes";

export default function App() {
  return <AppRouter />;
}