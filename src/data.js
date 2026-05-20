export const TICKER = [
  { label: "Intake A pH", val: "7.24", unit: "", color: "#00D4A0" },
  { label: "Reservoir Cl", val: "0.31", unit: "mg/L", color: "#00D4A0" },
  { label: "Plant 1 Turb", val: "4.21", unit: "NTU", color: "#FFAA33" },
  { label: "Distribution P", val: "3.10", unit: "bar", color: "#00D4A0" },
  { label: "DO Level", val: "8.20", unit: "mg/L", color: "#00D4A0" },
  { label: "Reservoir pH", val: "8.92", unit: "", color: "#FF4D4D" },
  { label: "Treatment Cl", val: "0.08", unit: "mg/L", color: "#FF4D4D" },
  { label: "Node 4 Temp", val: "22.1", unit: "°C", color: "#00D4A0" },
];

export const FEATURES = [
  { icon: "ti-wave-square", title: "Real-time sensor monitoring", desc: "Stream pH, chlorine, turbidity, pressure and DO readings from unlimited sensor nodes. Sub-30s refresh rates with full audit trail.", accent: "#00D4A0" },
  { icon: "ti-alert-octagon", title: "Intelligent alarm engine", desc: "Multi-level alerting: critical, warning, info. Auto-escalation, acknowledgement workflows, and on-call rotation built in.", accent: "#FF4D4D" },
  { icon: "ti-chart-bar", title: "Analytics & compliance", desc: "WHO-standard compliance scoring, trend charts, anomaly detection and one-click PDF reports for regulatory submissions.", accent: "#1A6FFF" },
  { icon: "ti-building-factory", title: "Multi-station management", desc: "Manage city-wide networks with map view, station health cards, threshold config per node, and per-station data retention.", accent: "#FFAA33" },
  { icon: "ti-api", title: "Developer REST API", desc: "Full REST API with webhook support. Push sensor data from any IoT device. SDKs for Python, Node.js, and Go.", accent: "#3B8BFF" },
  { icon: "ti-shield-check", title: "Regulatory-grade security", desc: "SOC2-ready audit logs, role-based access, encrypted at rest and in transit. Single Sign-On via Google Workspace.", accent: "#00D4A0" },
];

export const PLANS = [
  { name: "Free", price: "$0", period: "/mo", features: ["3 monitoring stations", "10 sensor tags", "Email alarms", "7-day data retention"], cta: "Start free", highlight: false },
  { name: "Pro", price: "$49", period: "/mo", features: ["15 stations", "100 sensor tags", "Email, SMS & push", "12-month retention", "Compliance reports", "REST API access"], cta: "Start 14-day trial", highlight: true },
  { name: "Enterprise", price: "Custom", period: "", features: ["Unlimited stations", "Unlimited tags", "All channels + escalation", "Unlimited retention", "White-label UI", "SLA & dedicated support"], cta: "Contact sales", highlight: false },
];

export const STATS = [
  { val: "99.97%", label: "Uptime SLA" },
  { val: "< 30s", label: "Sensor refresh" },
  { val: "2,400+", label: "Stations monitored" },
  { val: "WHO", label: "Standards aligned" },
];

export const TESTIMONIALS = [
  { name: "Amara Osei", role: "Chief Water Engineer, Accra Water", text: "AquaWatch cut our compliance reporting time from two days to 20 minutes. The chlorine alarm saved a district last April.", avatar: "AO" },
  { name: "Dr. Wanjiru Kamau", role: "Operations Director, Nairobi City Water", text: "We monitor 340 nodes across the county. The map view and bulk alarm acknowledge are indispensable for our team.", avatar: "WK" },
  { name: "Samuel Adeyemi", role: "IT Lead, Lagos State Water Corporation", text: "The REST API let us integrate with our SCADA in a weekend. Documentation is excellent.", avatar: "SA" },
];