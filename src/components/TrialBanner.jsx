// components/TrialBanner.jsx
import React from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router';

// Shows nothing for active paying subscribers. Shows a low-key countdown
// during the trial, and an insistent (but not blocking) banner once
// expired — actual write-action blocking happens separately in each
// component (see Dashboard.jsx Refresh button, AlertsCenter Acknowledge/
// Clear buttons) since a banner alone doesn't stop anyone from clicking.
export function TrialBanner() {
  const { subscriptionStatus, daysRemaining } = useAuth();
  const navigate = useNavigate();

  if (subscriptionStatus === 'active') return null;

  if (subscriptionStatus === 'trial') {
    // Only start nagging in the last week — no need to bother someone
    // on day 2 of a 30-day trial.
    if (daysRemaining === null || daysRemaining > 7) return null;

    return (
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 12, padding: '8px 16px',
          background: 'rgba(234,179,8,0.1)', borderBottom: '1px solid rgba(234,179,8,0.25)',
          fontSize: 12, color: '#eab308',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={14} />
          <span>
            {daysRemaining === 0
              ? 'Your trial ends today.'
              : `Your trial ends in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}.`}
          </span>
        </div>
        <button
          onClick={() => navigate('/app/billing')}
          style={{
            fontSize: 11, fontWeight: 600, color: '#020810', background: '#eab308',
            border: 'none', borderRadius: 4, padding: '4px 12px', cursor: 'pointer',
          }}
        >
          Upgrade Now
        </button>
      </div>
    );
  }

  if (subscriptionStatus === 'expired') {
    return (
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 12, padding: '8px 16px',
          background: 'rgba(239,68,68,0.1)', borderBottom: '1px solid rgba(239,68,68,0.3)',
          fontSize: 12, color: '#ef4444',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={14} />
          <span>Your trial has ended. You're in view-only mode — some actions are disabled until you upgrade.</span>
        </div>
        <button
          onClick={() => navigate('/app/billing')}
          style={{
            fontSize: 11, fontWeight: 700, color: 'white', background: '#ef4444',
            border: 'none', borderRadius: 4, padding: '4px 12px', cursor: 'pointer',
          }}
        >
          Upgrade Now
        </button>
      </div>
    );
  }

  return null;
}

export default TrialBanner;