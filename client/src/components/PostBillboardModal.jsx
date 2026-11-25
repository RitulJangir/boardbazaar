import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';
import { api } from '../api';

const CATEGORIES = ['Hoarding', 'Digital LED', 'Unipole', 'Gantry', 'Bus Shelter', 'Mall Facade'];
const CITIES = ['Bengaluru', 'Mumbai', 'Delhi NCR', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata', 'Ahmedabad'];
const LIGHTING = ['Frontlit', 'Backlit', 'Digital LED', 'Non-lit'];
const TRAFFIC = ['Premium', 'High', 'Medium'];

export default function PostBillboardModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    title: '',
    category: 'Hoarding',
    city: 'Bengaluru',
    locality: '',
    landmark: '',
    width_ft: 40,
    height_ft: 20,
    monthly_price: 120000,
    lighting: 'Frontlit',
    traffic: 'High',
    daily_impressions: 100000,
    min_months: 1,
    printing_cost: 12000,
    description: ''
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (file) fd.append('image', file);
      const { billboard } = await api.createBillboard(fd);
      onCreated(billboard);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between border-b pb-3">
          <div>
            <h2 className="text-xl font-bold text-brand-900">List Your Billboard for Rent</h2>
            <p className="text-xs text-slate-500">Reach brands & media agencies directly across India</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Listing Title *</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g., Silk Board Flyover Main Facing Hoarding"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Format *</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">City *</label>
              <select
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                {CITIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Locality / Area *</label>
              <input
                required
                value={form.locality}
                onChange={(e) => setForm({ ...form, locality: e.target.value })}
                placeholder="e.g., Koramangala"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Width (ft) *</label>
              <input
                type="number"
                min="4"
                required
                value={form.width_ft}
                onChange={(e) => setForm({ ...form, width_ft: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Height (ft) *</label>
              <input
                type="number"
                min="4"
                required
                value={form.height_ft}
                onChange={(e) => setForm({ ...form, height_ft: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Monthly Rent (₹) *</label>
              <input
                type="number"
                min="1000"
                step="1000"
                required
                value={form.monthly_price}
                onChange={(e) => setForm({ ...form, monthly_price: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Printing Cost (₹)</label>
              <input
                type="number"
                min="0"
                step="500"
                value={form.printing_cost}
                onChange={(e) => setForm({ ...form, printing_cost: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Lighting</label>
              <select
                value={form.lighting}
                onChange={(e) => setForm({ ...form, lighting: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                {LIGHTING.map((l) => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Traffic Tier</label>
              <select
                value={form.traffic}
                onChange={(e) => setForm({ ...form, traffic: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                {TRAFFIC.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Daily Impressions</label>
              <input
                type="number"
                min="1000"
                step="5000"
                value={form.daily_impressions}
                onChange={(e) => setForm({ ...form, daily_impressions: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Landmark & Facing Direction</label>
            <input
              value={form.landmark}
              onChange={(e) => setForm({ ...form, landmark: e.target.value })}
              placeholder="e.g., Opposite Metro Pillar 42, facing Airport traffic"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Mention sightline distance, permit status, illumination hours..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Billboard Photo (Optional, JPG/PNG up to 5MB)</label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600 hover:border-brand-500">
              <Upload className="h-4 w-4" />
              <span>{file ? file.name : 'Click to upload billboard photo'}</span>
              <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
            </label>
            {preview && (
              <img src={preview} alt="Preview" className="mt-2 h-36 w-full rounded-lg object-cover border" />
            )}
          </div>

          <div className="flex justify-end gap-3 border-t pt-4">
            <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-brand-900 px-6 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {loading ? 'Publishing...' : 'Publish Billboard'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
