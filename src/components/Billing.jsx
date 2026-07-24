// frontend/src/pages/settings/BillingSubscription.jsx
import { useState, useEffect, useCallback } from 'react';
import { Check, Search, Filter, Download, Eye } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

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
  const [plans, setPlans] = useState([]);
  const [history, setHistory] = useState([]);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [currentPlanCode, setCurrentPlanCode] = useState('starter'); // TODO: derive from active subscription
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [error, setError] = useState(null);

  const loadPlans = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/billing/plans`);
      if (!res.ok) throw new Error('Failed to load plans');
      setPlans(await res.json());
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/billing/history`, { credentials: 'include' });
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
    if (!plan.paystack_plan_code) {
      // Enterprise / custom — no self-serve checkout
      window.location.href = 'mailto:sales@aquasystemtech.com?subject=Enterprise Plan Inquiry';
      return;
    }

    setLoadingPlan(plan.code);
    setError(null);

    try {
      const userEmail = localStorage.getItem('userEmail') || ''; // adjust to your actual auth/user source
      if (!userEmail) throw new Error('No user email available — user must be logged in');

      const res = await fetch(`${API_BASE}/billing/subscribe/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ planCode: plan.code, email: userEmail }),
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

  return (
    <div className="bg-black text-neutral-100 p-8 min-h-screen">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="text-xl font-semibold">Billing & Subscription</h1>
          <p className="text-neutral-400 text-sm mt-1">
            Keep track of your subscription details, update your billing information, and control your account's payment
          </p>
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
                      {formatKes(billingCycle === 'yearly' ? plan.amount_kes * 10 : plan.amount_kes)}
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
              <tr key={row.id} className="border-b border-neutral-900">
                <td className="py-3">{row.plan_name}</td>
                <td className="py-3">{formatKes(row.amount_kes)}</td>
                <td className="py-3 text-neutral-400">{formatDate(row.purchase_date)}</td>
                <td className="py-3 text-neutral-400">{formatDate(row.period_end)}</td>
                <td className="py-3">
                  <span className={STATUS_STYLES[row.status] || 'text-neutral-400'}>● {row.status}</span>
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-2 text-neutral-400">
                    <Download size={14} className="cursor-pointer hover:text-white" />
                    <Eye size={14} className="cursor-pointer hover:text-white" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}