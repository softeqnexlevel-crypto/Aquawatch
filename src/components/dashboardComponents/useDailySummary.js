// components/dashboardComponents/useDailySummary.js
// Loads today's + yesterday's (24hrs ago) run hours and antiscalant dosed from the backend.
import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../config';

const API_ROOT = String(API_BASE_URL || '').replace(/\/api\/?$/, '');

export function useDailySummary(pollMs = 60000) {
  const [data, setData] = useState(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const r = await fetch(`${API_ROOT}/api/daily-summary`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!r.ok) return;
        const j = await r.json();
        if (alive) setData(j);
      } catch (_) { /* keep last value */ }
    };
    load();
    const id = setInterval(load, pollMs);
    return () => { alive = false; clearInterval(id); };
  }, [pollMs]);

  return data; // { today:{day,runHours,antiscalantMl}, yesterday:{...} } or null
}