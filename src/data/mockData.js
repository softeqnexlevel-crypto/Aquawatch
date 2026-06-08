export const boreholes = [
  { id: "BH-001", name: "Northfield Primary", location: "Northfield Zone A", status: "Active", flowRate: 45, dailyProd: 1080, monthlyProd: 32400, runtimeHours: 24, lastMaintenance: "2026-05-12", nextMaintenance: "2026-06-15", lat: -1.2921, lng: 36.8219, health: 94 },
  { id: "BH-002", name: "Eastgate Deep", location: "Eastgate Zone B", status: "Active", flowRate: 38, dailyProd: 912, monthlyProd: 27360, runtimeHours: 24, lastMaintenance: "2026-05-20", nextMaintenance: "2026-06-25", lat: -1.2850, lng: 36.8340, health: 88 },
  { id: "BH-003", name: "Riverside Station", location: "Riverside Zone C", status: "Maintenance", flowRate: 0, dailyProd: 0, monthlyProd: 18200, runtimeHours: 0, lastMaintenance: "2026-06-01", nextMaintenance: "2026-06-08", lat: -1.3010, lng: 36.8100, health: 42 },
  { id: "BH-004", name: "Western Ridge", location: "Western Zone D", status: "Active", flowRate: 52, dailyProd: 1248, monthlyProd: 37440, runtimeHours: 24, lastMaintenance: "2026-04-28", nextMaintenance: "2026-06-28", lat: -1.2780, lng: 36.8050, health: 97 },
  { id: "BH-005", name: "Central Basin", location: "Central Zone E", status: "Active", flowRate: 41, dailyProd: 984, monthlyProd: 29520, runtimeHours: 22.5, lastMaintenance: "2026-05-15", nextMaintenance: "2026-06-20", lat: -1.2950, lng: 36.8180, health: 91 },
  { id: "BH-006", name: "Southfield Reserve", location: "Southfield Zone F", status: "Standby", flowRate: 0, dailyProd: 0, monthlyProd: 14800, runtimeHours: 0, lastMaintenance: "2026-05-30", nextMaintenance: "2026-07-01", lat: -1.3100, lng: 36.8220, health: 78 },
];

export const hourlyProduction = Array.from({ length: 24 }, (_, i) => ({
  hour: `${String(i).padStart(2, "0")}:00`,
  flow: 170 + Math.round(Math.sin((i - 6) * 0.3) * 30 + Math.random() * 10 - 5),
  target: 175,
}));

export const dailyProduction = [
  { day: "Mon", actual: 4032, target: 4200 },
  { day: "Tue", actual: 4218, target: 4200 },
  { day: "Wed", actual: 3960, target: 4200 },
  { day: "Thu", actual: 4350, target: 4200 },
  { day: "Fri", actual: 4180, target: 4200 },
  { day: "Sat", actual: 3820, target: 4200 },
  { day: "Sun", actual: 4080, target: 4200 },
];

export const monthlyProduction = [
  { month: "Jan", actual: 128400, target: 130200 },
  { month: "Feb", actual: 116800, target: 118000 },
  { month: "Mar", actual: 131200, target: 130200 },
  { month: "Apr", actual: 127600, target: 130200 },
  { month: "May", actual: 133400, target: 130200 },
  { month: "Jun", actual: 88200, target: 130200 },
];

export const antiscalantMonthly = [
  { month: "Jan", consumption: 186, dosing: 2.4 },
  { month: "Feb", consumption: 168, dosing: 2.3 },
  { month: "Mar", consumption: 192, dosing: 2.5 },
  { month: "Apr", consumption: 175, dosing: 2.3 },
  { month: "May", consumption: 198, dosing: 2.6 },
  { month: "Jun", consumption: 132, dosing: 2.4 },
];

export const antiscalantHourly = Array.from({ length: 24 }, (_, i) => ({
  hour: `${String(i).padStart(2, "0")}:00`,
  rate: 2.3 + Math.round(Math.random() * 6) * 0.05,
}));

export const filterPressureData = Array.from({ length: 48 }, (_, i) => ({
  time: `${String(Math.floor(i / 2)).padStart(2, "0")}:${i % 2 === 0 ? "00" : "30"}`,
  filter1: 0.28 + (i * 0.008) + Math.random() * 0.02,
  filter2: 0.22 + (i * 0.006) + Math.random() * 0.02,
}));

export const recoveryTrend = [
  { month: "Jan", recovery: 76.2, target: 78 },
  { month: "Feb", recovery: 77.8, target: 78 },
  { month: "Mar", recovery: 78.4, target: 78 },
  { month: "Apr", recovery: 77.1, target: 78 },
  { month: "May", recovery: 79.2, target: 78 },
  { month: "Jun", recovery: 78.6, target: 78 },
];

export const recoveryHourly = Array.from({ length: 24 }, (_, i) => ({
  hour: `${String(i).padStart(2, "0")}:00`,
  recovery: 76 + Math.round(Math.sin(i * 0.4) * 3 + Math.random() * 2),
  target: 78,
}));

export const maintenanceWorkOrders = [
  { id: "WO-2024", equipment: "BH-003 Pump Assembly", assetId: "PMP-003", type: "Corrective", technician: "Peter Ochieng", status: "In Progress", dueDate: "2026-06-08", priority: "High" },
  { id: "WO-2023", equipment: "Filter 1 Media", assetId: "FLT-001", type: "Preventive", technician: "Grace Wanjiku", status: "Scheduled", dueDate: "2026-06-12", priority: "Medium" },
  { id: "WO-2022", equipment: "Chemical Dosing Pump", assetId: "DPM-001", type: "Calibration", technician: "James Kimani", status: "Scheduled", dueDate: "2026-06-14", priority: "Low" },
  { id: "WO-2021", equipment: "BH-001 Level Sensor", assetId: "SEN-001", type: "Inspection", technician: "Mary Achieng", status: "Overdue", dueDate: "2026-06-02", priority: "Critical" },
  { id: "WO-2020", equipment: "Pressure Transmitter PT-04", assetId: "PT-004", type: "Replacement", technician: "Peter Ochieng", status: "Completed", dueDate: "2026-06-01", priority: "High" },
  { id: "WO-2019", equipment: "BH-004 Motor Bearings", assetId: "MTR-004", type: "Preventive", technician: "Grace Wanjiku", status: "Completed", dueDate: "2026-05-28", priority: "Medium" },
];

export const maintenanceHoursMonthly = [
  { month: "Jan", corrective: 18, preventive: 24, inspection: 8 },
  { month: "Feb", corrective: 12, preventive: 22, inspection: 6 },
  { month: "Mar", corrective: 22, preventive: 26, inspection: 9 },
  { month: "Apr", corrective: 8, preventive: 20, inspection: 7 },
  { month: "May", corrective: 14, preventive: 24, inspection: 8 },
  { month: "Jun", corrective: 6, preventive: 10, inspection: 4 },
];

export const alerts = [
  { id: "ALT-001", type: "High Differential Pressure", equipment: "Filter 1", severity: "Critical", time: "10:42", date: "2026-06-06", status: "Active", value: "0.68 bar", threshold: "0.60 bar" },
  { id: "ALT-002", type: "Maintenance Overdue", equipment: "BH-001 Level Sensor", severity: "High", time: "08:00", date: "2026-06-06", status: "Active", value: "4 days overdue", threshold: "0 days" },
  { id: "ALT-003", type: "Borehole Offline", equipment: "BH-003 Riverside Station", severity: "High", time: "06:15", date: "2026-06-06", status: "Active", value: "0 m³/hr", threshold: "20 m³/hr" },
  { id: "ALT-004", type: "Low Chemical Inventory", equipment: "Antiscalant Tank A", severity: "Medium", time: "07:30", date: "2026-06-06", status: "Active", value: "18%", threshold: "20%" },
  { id: "ALT-005", type: "Low Recovery Rate", equipment: "System", severity: "Medium", time: "09:00", date: "2026-06-06", status: "Acknowledged", value: "75.8%", threshold: "76%" },
  { id: "ALT-006", type: "Production Below Target", equipment: "BH-002 Eastgate Deep", severity: "Low", time: "11:00", date: "2026-06-06", status: "Acknowledged", value: "38 m³/hr", threshold: "40 m³/hr" },
];

export const downtimeCauses = [
  { name: "Mechanical Failure", value: 35, color: "#ef4444" },
  { name: "Scheduled Maintenance", value: 28, color: "#0ea5e9" },
  { name: "Electrical Fault", value: 18, color: "#eab308" },
  { name: "Sensor Fault", value: 12, color: "#f97316" },
  { name: "Other", value: 7, color: "#6366f1" },
];

export const operatingDistribution = [
  { name: "Production", value: 82, color: "#22c55e" },
  { name: "Standby", value: 10, color: "#0ea5e9" },
  { name: "Maintenance", value: 5, color: "#eab308" },
  { name: "Downtime", value: 3, color: "#ef4444" },
];
