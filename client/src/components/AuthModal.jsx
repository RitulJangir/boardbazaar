import React, { useState } from 'react';
import { X } from 'lucide-react';
import { api, setToken } from '../api';

export default function AuthModal({ onClose, onAuthSuccess }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res =
        mode === 'login'
          ? await api.login({ email: form.email, password: form.password })
          : await api.register(form);
      setToken(res.token);
      onAuthSuccess(res.user);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loginDemo = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.login({ email: 'demo@boardbazaar.in', password: 'Demo@123' });
      setToken(res.token);
      onAuthSuccess(res.user);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-brand-900">
            {mode === 'login' ? 'Log in to BoardBazaar' : 'Create your BoardBazaar account'}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-sm text-slate-600">
          One account lets you both <strong>list billboards as a seller</strong> and <strong>book campaigns as a buyer</strong>.
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'register' && (
            <>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Full Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Arjun Mehta"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Phone *</label>
                  <input
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Company / Agency</label>
                  <input
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    placeholder="Optional"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Email Address *</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@company.in"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Password *</label>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Minimum 6 characters"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-brand-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Log In' : 'Create Account'}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs text-slate-400">
          <div className="h-px flex-1 bg-slate-200" /> OR <div className="h-px flex-1 bg-slate-200" />
        </div>

        <button
          type="button"
          onClick={loginDemo}
          disabled={loading}
          className="w-full rounded-lg border border-brand-500 bg-brand-50 py-2 text-sm font-semibold text-brand-600 hover:bg-blue-100"
        >
          Instant Demo Login (demo@boardbazaar.in)
        </button>

        <p className="mt-4 text-center text-sm text-slate-600">
          {mode === 'login' ? "New to BoardBazaar? " : "Already have an account? "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError('');
            }}
            className="font-semibold text-brand-600 hover:underline"
          >
            {mode === 'login' ? 'Register now' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  );
}
