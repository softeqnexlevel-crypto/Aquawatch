export default function Billing() {
  return (
    <div className="p-6 space-y-8">
      <h1 className="text-4xl font-bold text-white">Billing & Subscription</h1>

      {/* Current Plan */}
      <div className="bg-[#0E1626] border border-slate-700 rounded-3xl p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <p className="text-teal-400 font-semibold text-lg">CURRENT PLAN</p>
            <p className="text-5xl font-bold text-white mt-2">Enterprise</p>
            <p className="text-slate-400 mt-1">$299 / month • Billed monthly</p>
          </div>
          <div className="text-right">
            <span className="inline-block bg-green-500/20 text-green-400 px-5 py-2 rounded-2xl text-sm font-medium">
              Active
            </span>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-slate-400 text-sm">Next Billing</p>
            <p className="text-white text-2xl font-semibold mt-1">July 15, 2026</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Stations Active</p>
            <p className="text-white text-2xl font-semibold mt-1">24 / 50</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Amount Due</p>
            <p className="text-3xl font-bold text-white">$299.00</p>
          </div>
        </div>
      </div>

      {/* Payment Section */}
      <div className="bg-[#0E1626] border border-slate-700 rounded-3xl p-8">
        <h2 className="text-2xl font-semibold mb-6">Make a Payment</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Pay Now */}
          <div>
            <h3 className="font-semibold mb-4 text-lg">Pay Now ($299)</h3>
            
            <div className="space-y-4">
              {/* M-Pesa - Prioritized for Kenya */}
              <button className="w-full flex items-center gap-4 bg-green-600 hover:bg-green-500 transition p-5 rounded-2xl">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl font-bold text-green-600">MP</div>
                <div className="text-left">
                  <p className="font-semibold text-white">Pay with M-Pesa</p>
                  <p className="text-green-100 text-sm">Instant • Kenya</p>
                </div>
              </button>

              {/* Card Payment */}
              <button className="w-full flex items-center gap-4 bg-slate-800 hover:bg-slate-700 transition p-5 rounded-2xl border border-slate-600">
                <div className="text-3xl">💳</div>
                <div className="text-left">
                  <p className="font-semibold text-white">Credit / Debit Card</p>
                  <p className="text-slate-400 text-sm">Visa, Mastercard, Amex</p>
                </div>
              </button>

              {/* Bank Transfer */}
              <button className="w-full flex items-center gap-4 bg-slate-800 hover:bg-slate-700 transition p-5 rounded-2xl border border-slate-600">
                <div className="text-3xl">🏦</div>
                <div className="text-left">
                  <p className="font-semibold text-white">Bank Transfer</p>
                  <p className="text-slate-400 text-sm">Manual • 1-2 business days</p>
                </div>
              </button>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-700">
            <h4 className="font-medium mb-4">Payment Summary</h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Enterprise Plan</span>
                <span className="text-white">$299.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">VAT (16%)</span>
                <span className="text-white">$47.84</span>
              </div>
              <div className="h-px bg-slate-700 my-3"></div>
              <div className="flex justify-between text-lg font-semibold">
                <span>Total Due</span>
                <span className="text-teal-400">$346.84</span>
              </div>
            </div>

            <button 
              className="mt-8 w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-semibold text-lg transition"
              onClick={() => alert("Payment flow would open here (Stripe / Flutterwave / Pesapal integration)")}
            >
              Proceed to Secure Payment
            </button>
          </div>
        </div>
      </div>

      {/* Invoice History */}
      <div className="bg-[#0E1626] border border-slate-700 rounded-3xl p-8">
        <h2 className="text-2xl font-semibold mb-6">Invoice History</h2>
        
        <div className="space-y-4">
          {[
            { date: "May 15, 2026", amount: "$346.84", status: "Paid" },
            { date: "April 15, 2026", amount: "$346.84", status: "Paid" },
            { date: "March 15, 2026", amount: "$346.84", status: "Paid" },
          ].map((invoice, i) => (
            <div key={i} className="flex items-center justify-between bg-slate-900/50 p-5 rounded-2xl hover:bg-slate-800/70 transition">
              <div>
                <p className="font-medium">{invoice.date}</p>
                <p className="text-slate-400 text-sm">Invoice #INV-2026-{1000 + i}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-white">{invoice.amount}</p>
                <span className="text-green-400 text-sm font-medium">{invoice.status}</span>
              </div>
              <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                Download PDF
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}