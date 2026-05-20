import { useState, useEffect } from "react";
import "../index.css";   // ← Import your CSS

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`navbar ${scrolled ? "navbar-scrolled" : ""}`}>
      {/* Logo */}
      <div className="navbar-logo">
        <div className="logo-icon">
          <i className="ti ti-droplet"></i>
        </div>
        <span className="logo-text">AquaWatch</span>
      </div>

      {/* Links */}
      <div className="navbar-links">
        <a href="#features">Features</a>
        <a href="#stations">Stations</a>
        <a href="#pricing">Pricing</a>
        <a href="#">Solutions</a>
        <a href="#">Resources</a>
      </div>

      {/* Actions */}
      <div className="navbar-actions">
        <a href="#" className="signin-link">Sign in</a>
        <button className="start-btn">Start free</button>
      </div>
    </nav>
  );
}