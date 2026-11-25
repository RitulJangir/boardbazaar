import React, { useState } from 'react';
import { X, MapPin, Phone, Maximize2, Eye, Sun, ShieldCheck, Calendar } from 'lucide-react';
import BillboardThumb from './BillboardThumb';
import { api, formatINR } from '../api';

export default function BillboardDetailModal({ board, user, onClose, onRequireAuth, onBooked }) {
  const [showPhone, setShowPhone] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [companyName, setCompanyName] = useState(user?.company || '');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [months, setMonths] = useState(board.min_months || 1);
  const [includePrinting, setIncludePrinting] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const rentSubtotal = board.monthly_price * Number(months);
  const printingTotal = includePrinting && board.category !== 'Digital LED' ? (board.printing_cost || 0) : 0;
  const gstAmount = Math.round((rentSubtotal + printingTotal) * 0.18);
  const grandTotal = rentSubtotal + printingTotal + gstAmount;

  const handleBook = async (e) => {
    e.preventDefault();
    if (!user) {
      onRequireAuth();
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { booking } = await api.createBooking({
        billboard_id: board.id,
        campaign_name: campaignName,
        company_name: companyName,
        start_date: startDate,
        months: Number(months),
        include_printing: includePrinting,
        notes
      });
      onBooked(booking);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
          <div>
            <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-600">
              {board.category}
            </span>
            <h2 className="mt-1 text-lg font-bold text-slate-900">{board.title}</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-5">
          {/* Left details */}
          <div className="space-y-4 lg:col-span-3">
            <div className="overflow-hidden rounded-xl border">
              <BillboardThumb board={board} className="h-64 w-full" />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <MapPin className="h-4 w-4 text-brand-600" />
              <span className="font-medium text-slate-900">{board.locality}, {board.city}</span>
              {board.landmark && <span>• {board.landmark}</span>}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl bg-slate-50 p-3 border">
                <div className="flex items-center gap-1 text-xs text-slate-500"><Maximize2 className="h-3.5 w-3.5" /> Size</div>
                <div className="mt-1 text-sm font-bold">{board.width_ft} × {board.height_ft} ft</div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 border">
                <div className="flex items-center gap-1 text-xs text-slate-500"><Sun className="h-3.5 w-3.5" /> Lighting</div>
                <div className="mt-1 text-sm font-bold">{board.lighting}</div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 border">
                <div className="flex items-center gap-1 text-xs text-slate-500"><Eye className="h-3.5 w-3.5" /> Impressions</div>
                <div className="mt-1 text-sm font-bold">{Math.round(board.daily_impressions / 1000)}k / day</div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 border">
                <div className="flex items-center gap-1 text-xs text-slate-500"><ShieldCheck className="h-3.5 w-3.5" /> Traffic</div>
                <div className="mt-1 text-sm font-bold">{board.traffic}</div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900">About this Site</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                {board.description || 'Prime outdoor advertising site with verified municipal permissions and unobstructed traffic sightlines.'}
              </p>
            </div>

            <div className="flex items-center justify-between rounded-xl border bg-slate-50 p-4">
              <div>
                <div className="text-xs text-slate-500">Media Owner / Seller</div>
                <div className="font-semibold text-slate-900">{board.seller_name}</div>
              </div>
              <button
                type="button"
                onClick={() => setShowPhone(!showPhone)}
                className="flex items-center gap-2 rounded-lg border border-brand-900 px-3.5 py-2 text-xs font-semibold text-brand-900 hover:bg-brand-900 hover:text-white"
              >
                <Phone className="h-3.5 w-3.5" />
                {showPhone ? board.seller_phone : 'Show Seller Phone'}
              </button>
            </div>
          </div>

          {/* Right booking calculator */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 lg:col-span-2">
            <div className="mb-3 flex items-baseline justify-between border-b pb-3">
              <div>
                <div className="text-2xl font-extrabold text-brand-900">{formatINR(board.monthly_price)}</div>
                <div className="text-xs text-slate-500">per month + 18% GST</div>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${board.available ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {board.available ? 'Available' : 'Booked'}
              </span>
            </div>

            {error && (
              <div className="mb-3 rounded-lg bg-red-50 p-2.5 text-xs text-red-700 border border-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleBook} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Campaign Name *</label>
                <input
                  required
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="e.g., Festive Launch 2026"
                  className="w-full rounded-lg border bg-white px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Brand / Company</label>
                <input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Your brand name"
                  className="w-full rounded-lg border bg-white px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-lg border bg-white px-2.5 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Duration</label>
                  <select
                    value={months}
                    onChange={(e) => setMonths(Number(e.target.value))}
                    className="w-full rounded-lg border bg-white px-2.5 py-2 text-sm"
                  >
                    {[1, 2, 3, 6, 9, 12].filter((m) => m >= (board.min_months || 1)).map((m) => (
                      <option key={m} value={m}>{m} {m === 1 ? 'Month' : 'Months'}</option>
                    ))}
                  </select>
                </div>
              </div>

              {board.category !== 'Digital LED' && board.printing_cost > 0 && (
                <label className="flex cursor-pointer items-center justify-between rounded-lg border bg-white p-2.5 text-xs">
                  <span className="flex items-center gap-2 font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={includePrinting}
                      onChange={(e) => setIncludePrinting(e.target.checked)}
                    />
                    Include Flex Printing & Mounting
                  </span>
                  <span className="font-semibold text-slate-900">{formatINR(board.printing_cost)}</span>
                </label>
              )}

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Notes (optional)</label>
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Creative specs or installation timing"
                  className="w-full rounded-lg border bg-white px-3 py-2 text-sm"
                />
              </div>

              <div className="space-y-1.5 rounded-lg border bg-white p-3 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Media Rent ({months} mo)</span>
                  <span>{formatINR(rentSubtotal)}</span>
                </div>
                {printingTotal > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Printing & Mounting</span>
                    <span>{formatINR(printingTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>GST (18%)</span>
                  <span>{formatINR(gstAmount)}</span>
                </div>
                <div className="flex justify-between border-t pt-1.5 text-sm font-bold text-brand-900">
                  <span>Total Payable</span>
                  <span>{formatINR(grandTotal)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={!board.available || loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-500 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                <Calendar className="h-4 w-4" />
                {!board.available ? 'Currently Booked' : loading ? 'Confirming...' : user ? 'Confirm Rental Booking' : 'Log in to Book'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
