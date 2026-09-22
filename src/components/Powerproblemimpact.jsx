// Put this file next to AlertsCenter.jsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer, ComposedChart, LineChart, Bar, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceArea,
} from 'recharts';
import { Power } from 'lucide-react';
import { format, startOfDay, startOfHour, subDays, subHours, addDays, addHours } from 'date-fns';
import { useAlerts } from '../contexts/AlertsContext';
import { useData } from '../contexts/DataContext';

const RANGES = {
  '24H': { unit: 'hour', count: 24 },
  '7D': { unit: 'day', count: 7 },
  '30D': { unit: 'day', count: 30 },
};

const RED = '#ef4444';
const AMBER = '#f59e0b';
const BLUE = '#0ea5e9';
const MAX_FLOW_POINTS = 400;

const tooltipStyle = {
  background: '#0a1828',
  border: '1px solid rgba(14,165,233,0.2)',
  borderRadius: 8,
  fontSize: 11,
};

// A history event belongs to the Power Problem alarm if its type or alert id says so
function isPowerEvent(ev) {
  return /power/i.test(ev.type || '') || /power/i.test(ev.alertId || '');
}

// Turns triggered/cleared events into outage periods: { start, end, ongoing }
function buildIncidents(history, nowMs) {
  const events = history
    .filter(isPowerEvent)
    .map((ev) => ({ kind: ev.kind, t: new Date(ev.time).getTime() }))
    .filter((ev) => Number.isFinite(ev.t))
    .sort((a, b) => a.t - b.t);

  const incidents = [];
  let open = null;
  for (const ev of events) {
    if (ev.kind === 'triggered') {
      if (!open) open = { start: ev.t };
    } else if ((ev.kind === 'cleared' || ev.kind === 'dismissed') && open) {
      incidents.push({ start: open.start, end: Math.max(ev.t, open.start), ongoing: false });
      open = null;
    }
  }
  if (open) incidents.push({ start: open.start, end: nowMs, ongoing: true });
  return incidents;
}

function formatMinutes(min) {
  if (!Number.isFinite(min) || min <= 0) return '0 min';
  if (min < 60) return `${min.toFixed(0)} min`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

function Stat({ label, value, sub, color }) {
  return (
    <div className="rounded p-3" style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}>
      <div style={{ fontSize: 9, color: 'var(--muted-foreground)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color: color || 'var(--foreground)', lineHeight: 1.2, marginTop: 2 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 9, color: 'var(--muted-foreground)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export function PowerProblemImpact() {
  const { history } = useAlerts();
  const { getHistory } = useData();
  const [range, setRange] = useState('7D');
  const [tick, setTick] = useState(0);

  // Keeps an ongoing outage's length up to date
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const permeateHistory = getHistory('RO5-Permeateflow');

  const view = useMemo(() => {
    const nowMs = Date.now();
    const nowDate = new Date(nowMs);
    const cfg = RANGES[range];
    const allIncidents = buildIncidents(history, nowMs);

    // Time buckets (hours or days) for the downtime bars
    const buckets = Array.from({ length: cfg.count }, (_, i) => {
      const back = cfg.count - 1 - i;
      const start = cfg.unit === 'hour' ? startOfHour(subHours(nowDate, back)) : startOfDay(subDays(nowDate, back));
      const end = cfg.unit === 'hour' ? addHours(start, 1) : addDays(start, 1);
      return {
        start: start.getTime(),
        end: end.getTime(),
        label: format(start, cfg.unit === 'hour' ? 'HH:00' : 'dd MMM'),
        incidents: 0,
        downtimeMin: 0,
      };
    });

    allIncidents.forEach((inc) => {
      buckets.forEach((b) => {
        if (inc.start >= b.start && inc.start < b.end) b.incidents += 1;
        const overlap = Math.min(inc.end, b.end, nowMs) - Math.max(inc.start, b.start);
        if (overlap > 0) b.downtimeMin += overlap / 60000;
      });
    });
    buckets.forEach((b) => { b.downtimeMin = Math.round(b.downtimeMin * 10) / 10; });

    const rangeStart = buckets[0].start;
    const rangeEnd = nowMs;
    const inRange = allIncidents.filter((inc) => inc.end > rangeStart);

    const totalDowntimeMin = inRange.reduce(
      (sum, inc) => sum + (Math.min(inc.end, rangeEnd) - Math.max(inc.start, rangeStart)) / 60000, 0
    );
    const avgMin = inRange.length ? totalDowntimeMin / inRange.length : 0;

    // Permeate flow in range, thinned out so the chart stays fast
    const flowPoints = (permeateHistory || [])
      .map((d) => ({ t: new Date(d.time).getTime(), flow: Number(d.value) }))
      .filter((d) => Number.isFinite(d.t) && Number.isFinite(d.flow) && d.t >= rangeStart && d.t <= rangeEnd)
      .sort((a, b) => a.t - b.t);
    const step = Math.max(1, Math.ceil(flowPoints.length / MAX_FLOW_POINTS));
    const flowSeries = flowPoints.filter((_, i) => i % step === 0);

    // Estimated production lost = downtime x typical flow while running
    const running = flowPoints.filter((p) => p.flow > 1);
    const typicalFlow = running.length ? running.reduce((s, p) => s + p.flow, 0) / running.length : null;
    const lostM3 = typicalFlow !== null ? (totalDowntimeMin / 60) * typicalFlow : null;

    return {
      allCount: allIncidents.length,
      buckets, inRange, rangeStart, rangeEnd,
      totalDowntimeMin, avgMin, flowSeries, typicalFlow, lostM3,
      ongoing: allIncidents.some((i) => i.ongoing),
      hasFlowData: flowSeries.length > 0,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history, permeateHistory, range, tick]);

  const axisTick = { fontSize: 9, fill: '#4d7a9e' };
  const minBand = (view.rangeEnd - view.rangeStart) / 250; // keeps very short outages visible

  // ---- Empty-state copy, now range-aware ----
  const emptyMessage = view.allCount === 0
    ? 'No power problems recorded yet. This fills in automatically each time the Power Problem alarm triggers and clears.'
    : `No power problems in the selected ${range} window. Try widening the range (24H → 7D → 30D).`;

  return (
    <div className="rounded p-3" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between flex-wrap gap-2" style={{ marginBottom: 10 }}>
        <div className="flex items-center gap-2">
          <Power size={14} style={{ color: RED }} />
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Power Problem Impact
            </div>
            <div style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>
              Built from the alert history · {view.allCount} outage{view.allCount === 1 ? '' : 's'} recorded in total
            </div>
          </div>
          {view.ongoing && (
            <span style={{ fontSize: 9, fontWeight: 700, color: RED, background: 'rgba(239,68,68,0.12)', borderRadius: 3, padding: '1px 6px' }}>
              ONGOING
            </span>
          )}
        </div>
        <div className="flex gap-1">
          {Object.keys(RANGES).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              style={{
                padding: '2px 10px', borderRadius: 4, fontSize: 9, fontWeight: 600, cursor: 'pointer',
                background: range === r ? BLUE : 'var(--secondary)',
                color: range === r ? 'white' : 'var(--muted-foreground)',
                border: '1px solid var(--border)',
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Stats grid always renders so the layout is stable across range changes */}
      <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', marginBottom: 12 }}>
        <Stat label="Outages" value={view.inRange.length} sub={`last ${range}`} color={view.inRange.length > 0 ? RED : undefined} />
        <Stat label="Total downtime" value={formatMinutes(view.totalDowntimeMin)} color={view.totalDowntimeMin > 0 ? AMBER : undefined} />
        <Stat label="Average outage" value={view.inRange.length ? formatMinutes(view.avgMin) : '—'} />
        <Stat
          label="Est. production lost"
          value={view.lostM3 !== null && view.lostM3 > 0 ? `${view.lostM3.toFixed(2)} m³` : '—'}
          sub={
            view.typicalFlow !== null
              ? `at ${view.typicalFlow.toFixed(2)} m³/h typical flow`
              : 'needs permeate history'
          }
        />
      </div>

      {view.inRange.length === 0 ? (
        <div
          style={{
            fontSize: 11,
            color: 'var(--muted-foreground)',
            padding: '20px 12px',
            textAlign: 'center',
            border: '1px dashed var(--border)',
            borderRadius: 6,
            background: 'var(--muted)',
          }}
        >
          {emptyMessage}
          <div style={{ marginTop: 6, fontSize: 9, opacity: 0.75 }}>
            Showing range: <span style={{ color: BLUE, fontFamily: 'var(--font-mono)' }}>{range}</span>
          </div>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 10, color: 'var(--muted-foreground)', marginBottom: 4 }}>
            Downtime per {RANGES[range].unit} (bars) and number of outages (line)
          </div>
          <ResponsiveContainer width="100%" height={170}>
            <ComposedChart data={view.buckets} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,165,233,0.06)" vertical={false} />
              <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} interval={range === '30D' ? 4 : range === '24H' ? 2 : 0} />
              <YAxis yAxisId="left" tick={axisTick} axisLine={false} tickLine={false} unit=" m" />
              <YAxis yAxisId="right" orientation="right" tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value, name) => (name === 'Downtime' ? [`${value} min`, name] : [value, name])}
              />
              <Bar yAxisId="left" dataKey="downtimeMin" name="Downtime" fill={RED} radius={[3, 3, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="incidents" name="Outages" stroke={AMBER} strokeWidth={2} dot={{ r: 2 }} />
            </ComposedChart>
          </ResponsiveContainer>

          <div style={{ fontSize: 10, color: 'var(--muted-foreground)', margin: '12px 0 4px' }}>
            Permeate flow (m³/h) with power problems shaded red
          </div>
          {!view.hasFlowData ? (
            <div style={{ fontSize: 10, color: 'var(--muted-foreground)', padding: '12px 0' }}>
              No permeate flow history available for this range.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={170}>
              <LineChart data={view.flowSeries} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,165,233,0.06)" />
                <XAxis
                  dataKey="t" type="number" scale="time"
                  domain={[view.rangeStart, view.rangeEnd]}
                  tickFormatter={(t) => format(new Date(t), range === '24H' ? 'HH:mm' : 'dd MMM')}
                  tick={axisTick} axisLine={false} tickLine={false}
                />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelFormatter={(t) => format(new Date(t), 'dd MMM HH:mm')}
                  formatter={(value) => [`${Number(value).toFixed(2)} m³/h`, 'Permeate']}
                />
                {view.inRange.map((inc, i) => {
                  const x1 = Math.max(inc.start, view.rangeStart);
                  const x2 = Math.min(Math.max(inc.end, x1 + minBand), view.rangeEnd);
                  return <ReferenceArea key={i} x1={x1} x2={x2} fill={RED} fillOpacity={0.22} stroke={RED} strokeOpacity={0.4} />;
                })}
                <Line type="monotone" dataKey="flow" stroke={BLUE} strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </>
      )}
    </div>
  );
}

export default PowerProblemImpact;