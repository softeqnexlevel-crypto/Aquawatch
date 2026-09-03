// frontend/src/pages/settings/BillingSubscription.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Check, Search, Filter, Download, Eye, X, Smartphone, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config';

const API_BASE = `${API_BASE_URL}/api/billing`;

const STATUS_STYLES = {
  success: 'text-emerald-400',
  processing: 'text-amber-400',
  failed: 'text-red-400',
  cancelled: 'text-neutral-400',
};

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 90000;
const CANCELLED_RESULT_CODE = 1032;

const STANDARD_FEATURES = [
  '30 days data history',
  'Up to 1m monthly emails',
  'Up to 4 active sending domains',
  '2 platform users',
  'Email support',
];

const TRIAL_FEATURES = [
  '7 days data history',
  'Up to 2k monthly emails',
  'Up to 2 active sending domains',
  '1 platform user',
  'No support',
];

function formatKes(amount) {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(amount);
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-KE', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function normalizeMsisdn(raw) {
  const digits = String(raw).replace(/\D/g, '');
  if (digits.startsWith('254') && digits.length === 12) return digits;
  if (digits.startsWith('0') && digits.length === 10) return `254${digits.slice(1)}`;
  if ((digits.startsWith('7') || digits.startsWith('1')) && digits.length === 9) return `254${digits}`;
  return null;
}

export default function Billing() {
  const { user, subscriptionStatus, daysRemaining } = useAuth();

  const [plan, setPlan] = useState(null);
  const [history, setHistory] = useState([]);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [error, setError] = useState(null);
  const [expandedRowId, setExpandedRowId] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneError, setPhoneError] = useState(null);
  const [stkStage, setStkStage] = useState('idle');
  const [stkMessage, setStkMessage] = useState('');
  const pollTimerRef = useRef(null);
  const pollDeadlineRef = useRef(null);

  const isActive = subscriptionStatus === 'active';
  const displayAmount = plan ? (billingCycle === 'yearly' ? plan.amountKes * 10 : plan.amountKes) : 25000;

  const loadPlan = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/plans`);
      if (!res.ok) throw new Error('Failed to load plan');
      const plans = await res.json();
      setPlan(plans[0] || null);
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
      if (!res.ok) {
        // If table doesn't exist, show empty
        if (res.status === 500) {
          setHistory([]);
          return;
        }
        throw new Error('Failed to load billing history');
      }
      setHistory(await res.json());
    } catch (err) {
      if (!err.message.includes('Failed to load billing history')) {
        console.error('Error loading history:', err);
      }
    }
  }, []);

  useEffect(() => {
    loadPlan();
    loadHistory();
  }, [loadPlan, loadHistory]);

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, []);

  function openPhoneModal() {
    setError(null);
    setPhoneError(null);
    setStkStage('idle');
    setStkMessage('');
    // Strip 254 prefix for display
    const userPhone = user?.phone || '';
    setPhoneInput(userPhone.replace(/^254/, ''));
    setShowModal(true);
  }

  function closeModal() {
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    setShowModal(false);
    setStkStage('idle');
    setStkMessage('');
  }

  async function pollStkStatus(checkoutRequestId) {
    const token = localStorage.getItem('accessToken');

    if (Date.now() > pollDeadlineRef.current) {
      setStkStage('timeout');
      setStkMessage('Still waiting on M-Pesa. If you approved the prompt, check Billing History in a moment — it can take a bit longer to confirm.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/subscribe/mpesa/status/${checkoutRequestId}`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();

      if (data.ResultCode === 0 || data.ResultCode === '0') {
        setStkStage('success');
        setStkMessage('Payment confirmed. Your subscription is now active.');
        await loadHistory();
        return;
      }

      if (Number(data.ResultCode) === CANCELLED_RESULT_CODE) {
        setStkStage('failed');
        setStkMessage('Payment was cancelled on your phone. You can try again.');
        await loadHistory();
        return;
      }

      pollTimerRef.current = setTimeout(() => pollStkStatus(checkoutRequestId), POLL_INTERVAL_MS);
    } catch {
      pollTimerRef.current = setTimeout(() => pollStkStatus(checkoutRequestId), POLL_INTERVAL_MS);
    }
  }

  async function handleConfirmPhone() {
    const fullPhone = phoneInput.startsWith('254') ? phoneInput : `254${phoneInput}`;
    const msisdn = normalizeMsisdn(fullPhone);
    if (!msisdn) {
      setPhoneError('Enter a valid Safaricom number, e.g. 700000000');
      return;
    }

    setPhoneError(null);
    setStkStage('requesting');
    setStkMessage('Sending the payment request to your phone…');

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE}/subscribe/mpesa/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ phone: msisdn }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start M-Pesa payment');

      setStkStage('awaiting_pin');
      setStkMessage(data.customerMessage || 'Check your phone and enter your M-Pesa PIN to complete payment.');

      pollDeadlineRef.current = Date.now() + POLL_TIMEOUT_MS;
      pollTimerRef.current = setTimeout(() => pollStkStatus(data.checkoutRequestId), POLL_INTERVAL_MS);
    } catch (err) {
      setStkStage('failed');
      setStkMessage(err.message);
    }
  }

  function downloadReceipt(row) {
    const lines = [
      'Aqua Systemtech — Billing Receipt',
      '='.repeat(34),
      `Plan: ${row.planName}`,
      `Amount: ${formatKes(row.amountKes)}`,
      `Purchase Date: ${formatDate(row.purchaseDate)}`,
      `Period End: ${formatDate(row.periodEnd)}`,
      `Status: ${row.status}`,
      `M-Pesa Receipt: ${row.mpesaReceiptNumber || '—'}`,
    ].join('\n');

    const blob = new Blob([lines], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${row.mpesaReceiptNumber || row.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="bg-black text-neutral-100 p-8 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Upgrade your plan</h1>
        <p className="text-neutral-400 text-sm mt-1 max-w-2xl">
          Our award-winning cloud-based application enables organizations to utilize fast automated business email protection by quickly configuring SPF, DKIM and DMARC for all legitimate email sources in weeks, not months.
        </p>
        {subscriptionStatus === 'trial' && (
          <p className="text-amber-400 text-sm mt-3">
            You're on a free trial — {daysRemaining} day{daysRemaining === 1 ? '' : 's'} remaining.
          </p>
        )}
        {subscriptionStatus === 'expired' && (
          <p className="text-red-400 text-sm mt-3">
            Your trial has ended. Upgrade below to restore full access.
          </p>
        )}
      </div>

      {error && (
        <div className="mt-4 bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Plan Cards - Three column layout matching the image */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {/* LITE - Free */}
        <div className="rounded-2xl p-6 border border-neutral-800 bg-neutral-950/40 hover:border-neutral-700 transition-colors">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white">Lite</h3>
            <p className="text-neutral-400 text-xs mt-1">For micro organizations and personal use</p>
          </div>

          <div className="mb-4">
            <span className="text-3xl font-bold text-white">Free</span>
            <span className="text-neutral-400 text-sm ml-2">Per month / Billed annually</span>
          </div>

          <button
            disabled
            className="w-full py-2.5 rounded-lg text-sm font-medium mb-6 bg-neutral-800 text-neutral-400 cursor-default"
          >
            {subscriptionStatus === 'trial' ? 'Current Plan' : 'Trial Used'}
          </button>

          <div className="mb-3">
            <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Core features</h4>
            <ul className="space-y-2.5">
              {TRIAL_FEATURES.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-neutral-300">
                  <Check size={16} className="text-neutral-500 mt-0.5 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* EXPRESS - Paid */}
        <div className="rounded-2xl p-6 border border-neutral-700 bg-neutral-950 hover:border-neutral-600 transition-colors relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="text-[10px] font-semibold px-3 py-1 rounded-full bg-emerald-500 text-white uppercase tracking-wider">
              Popular
            </span>
          </div>
          
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white">Express</h3>
            <p className="text-neutral-400 text-xs mt-1">For small organizations with simple email infrastructure</p>
          </div>

          <div className="mb-4">
            <span className="text-3xl font-bold text-white">From $9</span>
            <span className="text-neutral-400 text-sm ml-2">Per month / Billed annually</span>
          </div>

          <button
            onClick={openPhoneModal}
            disabled={isActive}
            className={`w-full py-2.5 rounded-lg text-sm font-medium transition mb-6 ${
              isActive
                ? 'bg-neutral-800 text-neutral-400 cursor-default'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isActive ? 'Current Plan' : 'Upgrade Plan'}
          </button>

          <div className="mb-3">
            <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Core features</h4>
            <ul className="space-y-2.5">
              {STANDARD_FEATURES.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-neutral-300">
                  <Check size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ENTERPRISE - Custom */}
        <div className="rounded-2xl p-6 border border-neutral-800 bg-neutral-950/40 hover:border-neutral-700 transition-colors">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white">Enterprise</h3>
            <p className="text-neutral-400 text-xs mt-1">Custom plans for enterprise scale</p>
          </div>

          <div className="mb-4">
            <span className="text-3xl font-bold text-white">Custom</span>
            <span className="text-neutral-400 text-sm ml-2">Per month / Billed annually</span>
          </div>

          <button
            className="w-full py-2.5 rounded-lg text-sm font-medium mb-6 bg-neutral-800 hover:bg-neutral-700 text-white transition"
          >
            Contact us
          </button>

          <div className="mb-3">
            <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Core features</h4>
            <ul className="space-y-2.5">
              <li className="flex items-start gap-2 text-sm text-neutral-300">
                <Check size={16} className="text-neutral-500 mt-0.5 shrink-0" />
                <span>Contact us</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Billing History */}
      <div className="bg-neutral-950/40 border border-neutral-800 rounded-2xl mt-10 p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="font-semibold text-lg">Billing History</h3>
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
                        <span>M-Pesa Receipt</span><span className="text-neutral-200">{row.mpesaReceiptNumber || '—'}</span>
                        <span>Checkout Request ID</span><span className="text-neutral-200">{row.mpesaCheckoutRequestId || '—'}</span>
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

      {/* M-Pesa STK Push Modal - Exact match to the image */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-neutral-800 rounded-2xl w-full max-w-md p-6 relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-neutral-500 hover:text-white"
              aria-label="Close"
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-1">Pay with M-Pesa</h2>
              <p className="text-neutral-400 text-sm">
                {plan?.name || 'AquaWatch Subscription'} — {formatKes(displayAmount || 25000)}
                /{billingCycle === 'yearly' ? 'year' : 'month'}
              </p>
            </div>

            {(stkStage === 'idle' || stkStage === 'failed') && (
              <>
                {/* Phone Input */}
                <div className="mb-4">
                  <label className="block text-sm text-neutral-300 mb-2">
                    M-Pesa phone number
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm font-medium">
                      +254
                    </span>
                    <input
                      type="tel"
                      value={phoneInput}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setPhoneInput(val);
                      }}
                      placeholder="700000000"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg pl-14 pr-3 py-3 text-sm text-neutral-100 focus:outline-none focus:border-emerald-600 transition-colors"
                    />
                  </div>
                  {phoneError && (
                    <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {phoneError}
                    </p>
                  )}
                  {stkStage === 'failed' && (
                    <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {stkMessage}
                    </p>
                  )}
                </div>

                {/* Pay Button */}
                <button
                  onClick={handleConfirmPhone}
                  className="w-full py-3.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                >
                  Pay {formatKes(displayAmount || 25000)}
                </button>

                {/* Security Note */}
                <p className="text-neutral-500 text-xs text-center mt-4">
                  You will receive a prompt on your phone to enter your M-Pesa PIN
                </p>
              </>
            )}

            {stkStage === 'requesting' && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                <p className="text-neutral-300">{stkMessage}</p>
              </div>
            )}

            {stkStage === 'awaiting_pin' && (
              <div className="text-center py-8">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
                  <Smartphone size={24} className="absolute inset-0 m-auto text-emerald-500" />
                </div>
                <p className="text-neutral-300 mb-2">{stkMessage}</p>
                <p className="text-neutral-500 text-sm">Waiting for confirmation…</p>
              </div>
            )}

            {stkStage === 'success' && (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                  <Check size={32} className="text-emerald-500" />
                </div>
                <p className="text-neutral-200 text-lg font-semibold mb-2">Payment Successful!</p>
                <p className="text-neutral-400 text-sm mb-6">{stkMessage}</p>
                <button
                  onClick={closeModal}
                  className="w-full py-3 rounded-xl text-sm font-medium bg-white text-black hover:bg-neutral-200 transition"
                >
                  Done
                </button>
              </div>
            )}

            {stkStage === 'timeout' && (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle size={32} className="text-amber-500" />
                </div>
                <p className="text-amber-400 mb-4">{stkMessage}</p>
                <button
                  onClick={closeModal}
                  className="w-full py-3 rounded-xl text-sm font-medium bg-neutral-800 text-neutral-200 hover:bg-neutral-700 transition"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}