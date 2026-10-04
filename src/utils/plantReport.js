// utils/plantReport.js
// Builds the client-style plant report (header, production KPI strip,
// "Live Sensor Values" table) as a print-ready HTML page.
// The page opens in a new tab and the browser's print dialog saves it as PDF.

import { format } from 'date-fns';
import { rawToPercent } from '../components/dashboardComponents/feedTankCalibration';

// ───────────────────────── Branding (edit here) ─────────────────────────
export const REPORT_BRANDING = {
  title: 'RiftValley Osmotics - RO Plant Report PDF',
  shortName: 'RVO',
  version: 'V15.1',
  plant: 'Naivasha',
};

// ───────────────────────── Alarm limits (edit here) ─────────────────────────
// Same values the dashboard uses. Keep in sync with Dashboard.jsx.
const MEMBRANE_DP_LIMIT_BAR = 2.0;
const FILTER_DP_LIMIT_BAR = 0.40;
const CARTRIDGE_DP_LIMIT_BAR = 1.0;   // assumption: not defined in the dashboard
const PRESSURE_LIMIT_BAR = 14;        // start of the dashboard's critical pressure band
const EC_LIMIT_US = 150;
const RECOVERY_LOW_PCT = 50;
const TANK_EMPTY_PCT = 2;

// ───────────────────────── Sensor catalog ─────────────────────────
// key    : tag the dashboard reads via getValue()
// topic  : MQTT topic shown in the report
// groups : which report categories include this row (Operations = full report)
// high/low: ALARM limits (low ignores 0 unless lowIncludesZero)
export const REPORT_TAGS = [
  { key: 'RO5-FEEDFlow',           label: 'Feed Flow',         topic: 'plant/ro1/feed_flow',      unit: 'm³/h', groups: ['Production', 'Performance'] },
  { key: 'RO5-Permeateflow',       label: 'Product Flow',      topic: 'plant/ro1/prod_flow',      unit: 'm³/h', groups: ['Production', 'Performance', 'Quality', 'Chemical'] },
  { key: 'RO5-ConcetrateFlow',     label: 'Reject Flow',       topic: 'plant/ro1/reject_flow',    unit: 'm³/h', groups: ['Production', 'Performance'] },
  { key: 'RO5-PureWaterEc',        label: 'Product EC',        topic: 'plant/ro1/ec_product',     unit: 'µS/cm', groups: ['Quality', 'Performance'], high: EC_LIMIT_US },
  { key: 'RO5-MediaFilterDeltaP',  label: 'Media Filter ΔP',   topic: 'plant/filters/media_dp',   unit: 'bar',  groups: ['Maintenance', 'Performance'], high: FILTER_DP_LIMIT_BAR },
  // TAG KEY ASSUMED — the dashboard has no cartridge filter tag. Shows "No data" until it exists.
  { key: 'RO5-CartridgeDeltaP',    label: 'Cartridge ΔP',      topic: 'plant/filters/cart_dp',    unit: 'bar',  groups: ['Maintenance', 'Performance'], high: CARTRIDGE_DP_LIMIT_BAR },
  { key: 'RO5-ROPressure',         label: 'RO Feed Pressure',  topic: 'plant/ro1/feed_pressure',  unit: 'bar',  groups: ['Performance', 'Maintenance'], high: PRESSURE_LIMIT_BAR },
  { key: 'RO5-Stage1Delta',        label: '1st Stage ΔP',      topic: 'plant/ro1/stage1_dp',      unit: 'bar',  groups: ['Performance', 'Maintenance'], high: MEMBRANE_DP_LIMIT_BAR },
  { key: 'RO5-Stage2Delta',        label: '2nd Stage ΔP',      topic: 'plant/ro1/stage2_dp',      unit: 'bar',  groups: ['Performance', 'Maintenance'], high: MEMBRANE_DP_LIMIT_BAR },
  { key: 'FEED_TANK_LEVEL',        label: 'Feed Tank Level',   topic: 'plant/tanks/feed_level',   unit: '%',    groups: ['Production'], low: TANK_EMPTY_PCT, lowIncludesZero: true },

  // Rows below are not in the client's screenshot; TOPICS ARE ASSUMED — confirm them.
  { key: 'RO5-InterstagePress',    label: 'Interstage Pressure',    topic: 'plant/ro1/interstage_pressure',   unit: 'bar', groups: ['Performance'], high: PRESSURE_LIMIT_BAR },
  { key: 'RO5-ConcetratePress',    label: 'Concentrate Pressure',   topic: 'plant/ro1/concentrate_pressure',  unit: 'bar', groups: ['Performance'], high: PRESSURE_LIMIT_BAR },
  { key: 'RO5-MediaFilterInPress', label: 'Filter Inlet Pressure',  topic: 'plant/filters/media_in_pressure', unit: 'bar', groups: ['Maintenance'], high: PRESSURE_LIMIT_BAR },
  { key: 'RO5-MediaFilterOutPress',label: 'Filter Outlet Pressure', topic: 'plant/filters/media_out_pressure',unit: 'bar', groups: ['Maintenance'], high: PRESSURE_LIMIT_BAR },
  { key: 'RO5-SystemRecovery',     label: 'System Recovery',        topic: 'plant/ro1/recovery',              unit: '%',   groups: ['Performance', 'Quality', 'Production', 'Chemical'], low: RECOVERY_LOW_PCT },
  { key: 'RO5-AntiscalantDaily',   label: 'Antiscalant Daily',      topic: 'plant/dosing/antiscalant_daily',  unit: 'ml',  groups: ['Chemical'] },
  { key: 'RO5-SystemRunhrs',       label: 'System Run Hours',       topic: 'plant/ro1/run_hours',             unit: 'hrs', groups: ['Maintenance'] },
];

// ───────────────────────── Helpers ─────────────────────────
export const DECIMALS = 2;

// Reads from sensorData (not getValue): DataContext.getValue returns 0 for a
// missing tag, which would hide "No data" and show a fake 0.00 reading.
function readNumber(sensorData, key) {
  const raw = sensorData?.[key]?.value;
  if (raw === undefined || raw === null || raw === '') return null;
  const n = typeof raw === 'number' ? raw : parseFloat(raw);
  return Number.isFinite(n) ? n : null;
}

// Feed tank uses the calibrated raw signal, exactly like the dashboard.
function readTagValue(sensorData, tag) {
  if (tag.key === 'FEED_TANK_LEVEL') {
    const raw = readNumber(sensorData, 'RO5-FeedTankLevelRaw');
    return raw !== null ? rawToPercent(raw) : readNumber(sensorData, 'RO5-FeedTankLevel');
  }
  return readNumber(sensorData, tag.key);
}

function statusFor(tag, v) {
  if (v === null) return 'No data';
  if (tag.high !== undefined && v >= tag.high) return 'ALARM';
  if (tag.low !== undefined) {
    const isLow = tag.lowIncludesZero ? v <= tag.low : v > 0 && v < tag.low;
    if (isLow) return 'ALARM';
  }
  return 'Normal';
}

function lastUpdateOf(tag, getHistory, fallback) {
  const histKey = tag.key === 'FEED_TANK_LEVEL' ? 'RO5-FeedTankLevelRaw' : tag.key;
  const h = getHistory?.(histKey);
  const t = Array.isArray(h) && h.length ? h[h.length - 1].time : fallback;
  if (!t) return '—';
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? '—' : format(d, 'HH:mm:ss');
}

// Rows for one report. "Operations" (or an unknown category) = every sensor.
export function buildSensorRows({ sensorData, getHistory, lastUpdate, category = 'Operations' }) {
  const tags = category === 'Operations' || !REPORT_TAGS.some((t) => t.groups.includes(category))
    ? REPORT_TAGS
    : REPORT_TAGS.filter((t) => t.groups.includes(category));

  return tags.map((tag) => {
    const v = readTagValue(sensorData, tag);
    return {
      label: tag.label,
      topic: tag.topic,
      value: v === null ? '—' : v.toFixed(DECIMALS),
      unit: tag.unit,
      type: 'float',
      status: statusFor(tag, v),
      time: lastUpdateOf(tag, getHistory, lastUpdate),
    };
  });
}

// Production strip. `summary` is the /api/production-summary response.
// Missing figures show "—" instead of a made-up number.
export function buildKpis({ summary, sensorData }) {
  const vol = (v) => (Number.isFinite(Number(v)) && v !== null && v !== undefined ? `${Number(v).toFixed(1)} m³` : '—');
  const recovery = readNumber(sensorData, 'RO5-SystemRecovery');
  return [
    { value: vol(summary?.permeate?.daily), label: 'Daily Production' },
    { value: vol(summary?.permeate?.weekly), label: 'Weekly Production' },
    { value: vol(summary?.permeate?.monthly), label: 'Monthly Production' },
    // Efficiency formula not confirmed with the client — PLC system recovery for now.
    { value: recovery !== null ? `${recovery.toFixed(1)}%` : '—', label: 'Efficiency' },
  ];
}

const esc = (s) =>
  String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ───────────────────────── HTML template ─────────────────────────
export function buildReportHtml({ branding = REPORT_BRANDING, generatedAt = new Date(), userName, reportName, kpis, rows }) {
  const generated = format(generatedAt, 'dd/MM/yyyy, HH:mm:ss');

  const kpiHtml = kpis
    .map((k) => `<div class="kpi"><div class="kpi-v">${esc(k.value)}</div><div class="kpi-l">${esc(k.label)}</div></div>`)
    .join('');

  const rowHtml = rows
    .map((r) => {
      const cls = r.status === 'ALARM' ? 'alarm' : r.status === 'No data' ? 'nodata' : '';
      return `<tr>
        <td>${esc(r.label)}</td><td>${esc(r.topic)}</td><td>${esc(r.value)}</td><td>${esc(r.unit)}</td>
        <td>${esc(r.type)}</td><td class="${cls}">${esc(r.status)}</td><td>${esc(r.time)}</td>
      </tr>`;
    })
    .join('');

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${esc(reportName)} - ${format(generatedAt, 'yyyy-MM-dd')}</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  @page { size: A4 landscape; margin: 12mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 0; padding: 24px 32px; background: #fff;
         -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .top { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
  h1 { font-size: 28px; margin: 24px 0 10px; font-weight: 700; }
  .meta { font-size: 13px; color: #222; padding-bottom: 12px; }
  .brand { text-align: right; font-weight: 700; line-height: 1.25; margin-top: 4px; }
  .brand small { display: block; font-weight: 400; font-size: 14px; }
  .rule { border: 0; border-top: 2px solid #111; margin: 0 0 18px; }
  .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 22px; }
  .kpi { background: #f1f3f5; border: 1px solid #e3e6ea; border-radius: 6px; padding: 12px 8px; text-align: center; }
  .kpi-v { font-size: 17px; font-weight: 700; }
  .kpi-l { font-size: 14px; margin-top: 2px; }
  h2 { font-size: 22px; margin: 0 0 10px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  thead { display: table-header-group; }
  th { background: #0f172a; color: #fff; text-align: left; padding: 8px 8px; font-weight: 700; border: 1px solid #0f172a; }
  td { padding: 8px 8px; border: 1px solid #c9cdd2; }
  tr { page-break-inside: avoid; }
  .alarm { color: #dc2626; font-weight: 700; }
  .nodata { color: #6b7280; }
  .actions { margin-bottom: 16px; }
  .actions button { padding: 8px 16px; font-size: 13px; cursor: pointer; border: 1px solid #0f172a; background: #0f172a; color: #fff; border-radius: 4px; }
  .foot { margin-top: 18px; font-size: 10px; color: #6b7280; }
  @media print { .actions { display: none; } body { padding: 0; } }
  @media (max-width: 700px) {
    body { padding: 14px; } h1 { font-size: 20px; }
    .kpis { grid-template-columns: repeat(2, 1fr); }
    .wrap { overflow-x: auto; }
  }
</style>
</head>
<body>
  <div class="actions"><button onclick="window.print()">Print / Save as PDF</button></div>
  <div class="top">
    <div>
      <h1>${esc(branding.title)}</h1>
      <div class="meta">Generated: ${esc(generated)} | User: ${esc(userName)} | Plant: ${esc(branding.plant)} | Report: ${esc(reportName)}</div>
    </div>
    <div class="brand">${esc(branding.shortName)}<small>${esc(branding.version)}</small></div>
  </div>
  <hr class="rule">
  <div class="kpis">${kpiHtml}</div>
  <h2>Live Sensor Values</h2>
  <div class="wrap">
    <table>
      <thead><tr><th>Tag Name</th><th>Topic</th><th>Value</th><th>Unit</th><th>Type</th><th>Status</th><th>Last Update</th></tr></thead>
      <tbody>${rowHtml}</tbody>
    </table>
  </div>
  <div class="foot">Values are a snapshot at the time of generation.</div>
</body>
</html>`;
}

// ───────────────────────── Opening / printing ─────────────────────────

// MUST be called synchronously inside the click handler, or browsers block the popup.
export function openReportWindow() {
  const win = window.open('', '_blank');
  if (win) {
    win.document.write('<p style="font-family:Arial,sans-serif;padding:24px">Generating report…</p>');
  }
  return win;
}

// Writes the report into the window and opens the print dialog.
// If the popup was blocked, the report is downloaded as an .html file instead.
export function presentReport(win, html, filename) {
  if (!win || win.closed) {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.replace(/\.pdf$/i, '') + '.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return false;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 500);
  return true;
}