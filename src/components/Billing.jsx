// frontend/src/pages/settings/BillingSubscription.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Check, Search, Filter, Download, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config';


const API_BASE = `${API_BASE_URL}/api/billing`;

const STATUS_STYLES = {
  success: 'text-emerald-400',
  processing: 'text-amber-400',
  failed: 'text-red-400',
};

function formatKes(amount) {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(amount);
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-KE', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export default function Billing() {
  // ✅ Pull the logged-in user's email straight from AuthContext instead
  // of localStorage.getItem('userEmail') — nothing in AuthContext ever
  // set that key (only accessToken/refreshToken are stored), so checkout
  // was always failing with "No user email available."
  const { user, subscriptionStatus, daysRemaining, planCode: activePlanCode } = useAuth();

  const [plans, setPlans] = useState([]);
  const [history, setHistory] = useState([]);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [error, setError] = useState(null);
  const [expandedRowId, setExpandedRowId] = useState(null);

  // ✅ Derived from the real subscription, not hardcoded. While on trial
  // (no active paid plan yet), nothing is marked "current" so all plans
  // show their normal "Upgrade Plan" button.
  const currentPlanCode = subscriptionStatus === 'active' ? activePlanCode : null;

  const loadPlans = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/plans`);
      if (!res.ok) throw new Error('Failed to load plans');
      setPlans(await res.json());
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE}/history`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to load billing history');
      setHistory(await res.json());
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    loadPlans();
    loadHistory();
  }, [loadPlans, loadHistory]);

  async function handleUpgrade(plan) {
    if (!plan.paystack_plan_code && !plan.paystackPlanCode) {
      // Enterprise / custom — no self-serve checkout
      window.location.href = 'mailto:sales@aquasystemtech.com?subject=Enterprise Plan Inquiry';
      return;
    }

    setLoadingPlan(plan.code);
    setError(null);

    try {
      if (!user?.email) throw new Error('No user email available — please log in again');

      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE}/subscribe/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ planCode: plan.code, email: user.email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start checkout');

      // Redirect flow — simplest integration. For an in-page popup instead,
      // swap this for Paystack Inline JS using data.reference + the public key.
      window.location.href = data.authorizationUrl;
    } catch (err) {
      setError(err.message);
      setLoadingPlan(null);
    }
  }

  const badgeFor = (code) =>
    code === 'starter' ? { label: 'FREE', className: 'bg-neutral-700 text-neutral-200' }
    : code === 'growth' ? { label: 'PRO', className: 'bg-orange-500 text-white' }
    : { label: 'ADVANCE', className: 'bg-emerald-500 text-white' };

  // ✅ No backend receipt/PDF generation exists yet, so this builds a
  // simple plain-text receipt client-side from the row's own data rather
  // than leaving the button doing nothing. Swap this out if a real
  // receipt endpoint gets built later.
  function downloadReceipt(row) {
    const lines = [
      'Aqua Systemtech — Billing Receipt',
      '='.repeat(34),
      `Plan: ${row.planName}`,
      `Amount: ${formatKes(row.amountKes)}`,
      `Purchase Date: ${formatDate(row.purchaseDate)}`,
      `Period End: ${formatDate(row.periodEnd)}`,
      `Status: ${row.status}`,
      `Reference: ${row.paystackReference || '—'}`,
    ].join('\n');

    const blob = new Blob([lines], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${row.paystackReference || row.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="bg-black text-neutral-100 p-8 min-h-screen">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="text-xl font-semibold">Billing & Subscription</h1>
          <p className="text-neutral-400 text-sm mt-1">
            Keep track of your subscription details, update your billing information, and control your account's payment
          </p>
          {subscriptionStatus === 'trial' && (
            <p className="text-amber-400 text-sm mt-2">
              You're on a free trial — {daysRemaining} day{daysRemaining === 1 ? '' : 's'} remaining.
            </p>
          )}
          {subscriptionStatus === 'expired' && (
            <p className="text-red-400 text-sm mt-2">
              Your trial has ended. Upgrade below to restore full access.
            </p>
          )}
        </div>
        <div className="flex items-center bg-neutral-900 rounded-full p-1 border border-neutral-800">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              billingCycle === 'monthly' ? 'bg-white text-black' : 'text-neutral-400'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              billingCycle === 'yearly' ? 'bg-white text-black' : 'text-neutral-400'
            }`}
          >
            Yearly
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8">
        {plans.map((plan) => {
          const badge = badgeFor(plan.code);
          const isCurrent = plan.code === currentPlanCode;
          const isEnterprise = plan.code === 'enterprise';
          const isDark = plan.code === 'growth';

          return (
            <div
              key={plan.code}
              className={`rounded-2xl p-6 border ${
                isDark ? 'bg-neutral-950 border-neutral-700' : 'bg-neutral-950/40 border-neutral-800'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-base">{plan.name}</h3>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${badge.className}`}>
                  {badge.label}
                </span>
              </div>

              <div className="mb-5">
                {isEnterprise ? (
                  <span className="text-3xl font-bold">Custom</span>
                ) : (
                  <>
                    <span className="text-3xl font-bold">
                      {formatKes(billingCycle === 'yearly' ? plan.amountKes * 10 : plan.amountKes)}
                    </span>
                    <span className="text-neutral-400 text-sm"> /{billingCycle === 'yearly' ? 'year' : 'month'}</span>
                  </>
                )}
              </div>

              <button
                onClick={() => handleUpgrade(plan)}
                disabled={isCurrent || loadingPlan === plan.code}
                className={`w-full py-2.5 rounded-lg text-sm font-medium transition mb-6 ${
                  isCurrent
                    ? 'bg-neutral-800 text-neutral-400 cursor-default'
                    : isDark
                    ? 'bg-white text-black hover:bg-neutral-200'
                    : isEnterprise
                    ? 'bg-neutral-900 text-white border border-neutral-700 hover:bg-neutral-800'
                    : 'bg-neutral-800 text-neutral-300'
                }`}
              >
                {isCurrent ? 'Current Plan' : loadingPlan === plan.code ? 'Redirecting…' : isEnterprise ? 'Contact Us' : 'Upgrade Plan'}
              </button>

              <ul className="space-y-2.5">
                {(plan.features || []).map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-neutral-300">
                    <Check size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="bg-neutral-950/40 border border-neutral-800 rounded-2xl mt-8 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Billing History</h3>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-sm text-neutral-400">
              <Search size={14} /> Search...
            </div>
            <button className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-sm text-neutral-300">
              <Filter size={14} /> Filter
            </button>
            <button className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-sm text-neutral-300">
              <Download size={14} /> Export
            </button>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-neutral-500 border-b border-neutral-800">
              <th className="py-2 font-medium">Plan Name</th>
              <th className="py-2 font-medium">Amount</th>
              <th className="py-2 font-medium">Purchase Date</th>
              <th className="py-2 font-medium">End Date</th>
              <th className="py-2 font-medium">Status</th>
              <th className="py-2 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-neutral-500">
                  No billing history yet
                </td>
              </tr>
            )}
            {history.map((row) => (
              <React.Fragment key={row.id}>
                <tr className="border-b border-neutral-900">
                  <td className="py-3">{row.planName}</td>
                  <td className="py-3">{formatKes(row.amountKes)}</td>
                  <td className="py-3 text-neutral-400">{formatDate(row.purchaseDate)}</td>
                  <td className="py-3 text-neutral-400">{formatDate(row.periodEnd)}</td>
                  <td className="py-3">
                    <span className={STATUS_STYLES[row.status] || 'text-neutral-400'}>● {row.status}</span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2 text-neutral-400">
                      <Download
                        size={14}
                        className="cursor-pointer hover:text-white"
                        onClick={() => downloadReceipt(row)}
                        title="Download receipt"
                      />
                      <Eye
                        size={14}
                        className="cursor-pointer hover:text-white"
                        onClick={() => setExpandedRowId(expandedRowId === row.id ? null : row.id)}
                        title="View details"
                      />
                    </div>
                  </td>
                </tr>
                {expandedRowId === row.id && (
                  <tr className="border-b border-neutral-900 bg-neutral-950/60">
                    <td colSpan={6} className="py-3 px-2 text-xs text-neutral-400">
                      <div className="grid grid-cols-2 gap-y-1 gap-x-6 max-w-md">
                        <span>Paystack Reference</span><span className="text-neutral-200">{row.paystackReference || '—'}</span>
                        <span>Plan Code</span><span className="text-neutral-200">{row.planCode}</span>
                        <span>Record ID</span><span className="text-neutral-200">{row.id}</span>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}