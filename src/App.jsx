import Navbar from "./components/Navbar";
import LiveTicker from "./components/LiveTicker";
import Hero from "./components/Hero";
import StatsBar from "./components/StatsBar";
import Features from "./components/Features";
import StationShowcase from "./components/StationShowcase";
import Pricing from "./components/Pricing";
import Testimonials from "./components/Testimonials";
import CTA from "./components/CTA";
import Footer from "./components/Footer";


import AppLayout from "./components/AppLayout";

export default function App() {
  return (
    <>
    <AppLayout> 
        <Hero />
      <StatsBar />
      <Features />
      <StationShowcase />
      <Pricing />
      <Testimonials />
      <CTA />
      <LiveTicker />
      <Footer />
      </AppLayout>
      {/* <Navbar />
      <Hero />
      <StatsBar />
      <Features />
      <StationShowcase />
      <Pricing />
      <Testimonials />
      <CTA />
      <LiveTicker />
      <Footer /> */}

    
    </>
  );
}