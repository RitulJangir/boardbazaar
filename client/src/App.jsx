import React, { useEffect, useState, useCallback } from 'react';
import {
  Search, MapPin, PlusCircle, Heart, SlidersHorizontal,
  Building2, CalendarCheck, LogOut, User, Trash2, CheckCircle2, X
} from 'lucide-react';
import { api, formatINR, getToken, setToken } from './api';
import BillboardThumb from './components/BillboardThumb';
import AuthModal from './components/AuthModal';
import PostBillboardModal from './components/PostBillboardModal';
import BillboardDetailModal from './components/BillboardDetailModal';

const CITIES = ['All India', 'Bengaluru', 'Mumbai', 'Delhi NCR', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata', 'Ahmedabad'];
const CATEGORIES = ['All', 'Hoarding', 'Digital LED', 'Unipole', 'Gantry', 'Bus Shelter', 'Mall Facade'];
const LIGHTING_OPTS = ['All', 'Frontlit', 'Backlit', 'Digital LED', 'Non-lit'];
const TRAFFIC_OPTS = ['All', 'Premium', 'High', 'Medium'];
const BUDGET_PRESETS = [
  { label: 'Under ₹50k', min: '', max: '50000' },
  { label: '₹50k – ₹1.5L', min: '50000', max: '150000' },
  { label: '₹1.5L – ₹3L', min: '150000', max: '300000' },
  { label: '₹3L+', min: '300000', max: '' }
];

export default function App() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('browse'); // browse | saved | rentals | listings
  const [billboards, setBillboards] = useState([]);
  const [facets, setFacets] = useState({ categories: {}, cities: {}, localities: [] });
  const [loading, setLoading] = useState(true);

  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [savedBoards, setSavedBoards] = useState([]);
  const [myBoards, setMyBoards] = useState([]);
  const [buyerBookings, setBuyerBookings] = useState([]);
  const [sellerBookings, setSellerBookings] = useState([]);

  // OLX-style filter state
  const [filters, setFilters] = useState({
    q: '',
    city: 'All India',
    locality: 'All',
    category: 'All',
    lighting: 'All',
    traffic: 'All',
    minPrice: '',
    maxPrice: '',
    availableOnly: false,
    sort: 'newest'
  });

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showPost, setShowPost] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [toast, setToast] = useState('');

  const notify = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3200);
  };

  // Restore user session on load
  useEffect(() => {
    if (!getToken()) return;
    api.me()
      .then((res) => setUser(res.user))
      .catch(() => setToken(''));
  }, []);

  // Fetch billboards whenever filters change
  const fetchBillboards = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getBillboards({
        ...filters,
        city: filters.city === 'All India' ? '' : filters.city,
        locality: filters.locality === 'All' ? '' : filters.locality,
        category: filters.category === 'All' ? '' : filters.category,
        lighting: filters.lighting === 'All' ? '' : filters.lighting,
        traffic: filters.traffic === 'All' ? '' : filters.traffic,
        availableOnly: filters.availableOnly ? 'true' : ''
      });
      setBillboards(data.billboards);
      setFacets(data.facets);
    } catch (err) {
      notify(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timer = setTimeout(fetchBillboards, 180);
    return () => clearTimeout(timer);
  }, [fetchBillboards]);

  // Load user-specific data when signed in
  const refreshUserData = useCallback(async () => {
    if (!user) {
      setFavoriteIds(new Set());
      setSavedBoards([]);
      setMyBoards([]);
      setBuyerBookings([]);
      setSellerBookings([]);
      return;
    }
    try {
      const [favRes, mineRes, buyRes, sellRes] = await Promise.all([
        api.getFavorites(),
        api.getMyBillboards(),
        api.getBuyerBookings(),
        api.getSellerBookings()
      ]);
      setFavoriteIds(new Set(favRes.favoriteIds));
      setSavedBoards(favRes.billboards);
      setMyBoards(mineRes.billboards);
      setBuyerBookings(buyRes.bookings);
      setSellerBookings(sellRes.bookings);
    } catch (err) {
      console.error(err);
    }
  }, [user]);

  useEffect(() => {
    refreshUserData();
  }, [refreshUserData]);

  const handleToggleFavorite = async (e, boardId) => {
    e.stopPropagation();
    if (!user) {
      setShowAuth(true);
      return;
    }
    try {
      const { saved } = await api.toggleFavorite(boardId);
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (saved) next.add(boardId);
        else next.delete(boardId);
        return next;
      });
      refreshUserData();
      notify(saved ? 'Saved to favourites' : 'Removed from favourites');
    } catch (err) {
      notify(err.message);
    }
  };

  const handleToggleAvailability = async (board) => {
    try {
      await api.updateBillboard(board.id, { available: !board.available });
      fetchBillboards();
      refreshUserData();
      notify(`Marked as ${!board.available ? 'Available' : 'Booked'}`);
    } catch (err) {
      notify(err.message);
    }
  };

  const handleDeleteBoard = async (id) => {
    if (!window.confirm('Delete this billboard listing permanently?')) return;
    try {
      await api.deleteBillboard(id);
      fetchBillboards();
      refreshUserData();
      notify('Billboard deleted');
    } catch (err) {
      notify(err.message);
    }
  };

  const handleBookingStatus = async (id, status) => {
    try {
      await api.updateBookingStatus(id, status);
      refreshUserData();
      notify(`Booking marked ${status}`);
    } catch (err) {
      notify(err.message);
    }
  };

  const resetFilters = () => {
    setFilters({
      q: '',
      city: 'All India',
      locality: 'All',
      category: 'All',
      lighting: 'All',
      traffic: 'All',
      minPrice: '',
      maxPrice: '',
      availableOnly: false,
      sort: 'newest'
    });
  };

  const activeFilterCount = [
    filters.city !== 'All India',
    filters.locality !== 'All',
    filters.category !== 'All',
    filters.lighting !== 'All',
    filters.traffic !== 'All',
    filters.minPrice !== '',
    filters.maxPrice !== '',
    filters.availableOnly
  ].filter(Boolean).length;

  const FilterPanel = (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">Filters</h3>
        {activeFilterCount > 0 && (
          <button onClick={resetFilters} className="text-xs font-semibold text-brand-600 hover:underline">
            Clear All ({activeFilterCount})
          </button>
        )}
      </div>

      {/* Categories */}
      <div>
        <div className="mb-2 text-xs font-bold uppercase text-slate-500">Billboard Format</div>
        <div className="space-y-1">
          {CATEGORIES.map((cat) => {
            const count = cat === 'All'
              ? Object.values(facets.categories || {}).reduce((a, b) => a + b, 0)
              : (facets.categories?.[cat] || 0);
            const active = filters.category === cat;
            return (
              <button
                key={cat}
                onClick={() => setFilters({ ...filters, category: cat })}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-sm ${
                  active ? 'bg-brand-900 font-semibold text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-xs ${active ? 'text-slate-200' : 'text-slate-400'}`}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Locality */}
      <div>
        <div className="mb-2 text-xs font-bold uppercase text-slate-500">Locality</div>
        <select
          value={filters.locality}
          onChange={(e) => setFilters({ ...filters, locality: e.target.value })}
          className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm"
        >
          <option value="All">All Localities</option>
          {(facets.localities || []).map((loc) => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>
      </div>

      {/* Budget */}
      <div>
        <div className="mb-2 text-xs font-bold uppercase text-slate-500">Monthly Rent (₹)</div>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Min ₹"
            value={filters.minPrice}
            onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
          />
          <input
            type="number"
            placeholder="Max ₹"
            value={filters.maxPrice}
            onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {BUDGET_PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => setFilters({ ...filters, minPrice: p.min, maxPrice: p.max })}
              className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-brand-500 hover:text-brand-600"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lighting */}
      <div>
        <div className="mb-2 text-xs font-bold uppercase text-slate-500">Lighting</div>
        <div className="flex flex-wrap gap-1.5">
          {LIGHTING_OPTS.map((l) => (
            <button
              key={l}
              onClick={() => setFilters({ ...filters, lighting: l })}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium border ${
                filters.lighting === l
                  ? 'border-brand-900 bg-brand-900 text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Traffic */}
      <div>
        <div className="mb-2 text-xs font-bold uppercase text-slate-500">Traffic Tier</div>
        <div className="flex flex-wrap gap-1.5">
          {TRAFFIC_OPTS.map((t) => (
            <button
              key={t}
              onClick={() => setFilters({ ...filters, traffic: t })}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium border ${
                filters.traffic === t
                  ? 'border-brand-900 bg-brand-900 text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Availability */}
      <label className="flex cursor-pointer items-center gap-2 rounded-lg border bg-white p-2.5 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          checked={filters.availableOnly}
          onChange={(e) => setFilters({ ...filters, availableOnly: e.target.checked })}
        />
        Available immediately only
      </label>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* OLX-Style Top Header */}
      <header className="sticky top-0 z-30 border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
          <button
            onClick={() => setTab('browse')}
            className="flex items-center gap-2 text-xl font-black tracking-tight text-brand-900"
          >
            <span className="rounded-lg bg-brand-900 px-2 py-0.5 text-white">BB</span>
            <span>BoardBazaar</span>
          </button>

          {/* City Selector */}
          <div className="flex items-center gap-1.5 rounded-lg border-2 border-brand-900 bg-white px-2.5 py-1.5">
            <MapPin className="h-4 w-4 text-brand-900" />
            <select
              value={filters.city}
              onChange={(e) => {
                setFilters({ ...filters, city: e.target.value, locality: 'All' });
                setTab('browse');
              }}
              className="bg-transparent text-sm font-semibold text-slate-800 focus:outline-none"
            >
              {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Search Bar */}
          <div className="flex min-w-[220px] flex-1 items-center rounded-lg border-2 border-brand-900 bg-white pl-3">
            <input
              value={filters.q}
              onChange={(e) => {
                setFilters({ ...filters, q: e.target.value });
                setTab('browse');
              }}
              placeholder="Search hoardings, LED screens, Marathahalli, BKC, NH-48..."
              className="w-full py-1.5 text-sm focus:outline-none"
            />
            <span className="flex h-9 w-10 items-center justify-center bg-brand-900 text-white">
              <Search className="h-4 w-4" />
            </span>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                <span className="hidden items-center gap-1 text-xs font-semibold text-slate-700 md:flex">
                  <User className="h-3.5 w-3.5" /> {user.name.split(' ')[0]}
                </span>
                <button
                  onClick={() => {
                    setToken('');
                    setUser(null);
                    setTab('browse');
                    notify('Logged out');
                  }}
                  title="Log out"
                  className="rounded-lg border p-2 text-slate-600 hover:bg-slate-100"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className="rounded-lg px-3 py-2 text-sm font-bold text-brand-900 hover:bg-slate-100"
              >
                Login
              </button>
            )}

            <button
              onClick={() => (user ? setShowPost(true) : setShowAuth(true))}
              className="flex items-center gap-1.5 rounded-full border-2 border-amber-400 bg-brand-900 px-4 py-2 text-sm font-bold text-white shadow hover:bg-slate-800"
            >
              <PlusCircle className="h-4 w-4 text-amber-300" />
              Post Billboard
            </button>
          </div>
        </div>

        {/* Sub Navigation Bar */}
        <div className="border-t bg-slate-50">
          <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-2 text-sm">
            {[
              { id: 'browse', label: 'Browse All', icon: Building2 },
              { id: 'saved', label: `Saved (${favoriteIds.size})`, icon: Heart },
              { id: 'rentals', label: `My Rentals (${buyerBookings.length})`, icon: CalendarCheck },
              { id: 'listings', label: `Seller Hub (${myBoards.length})`, icon: PlusCircle }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  if (id !== 'browse' && !user) {
                    setShowAuth(true);
                    return;
                  }
                  setTab(id);
                }}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 font-semibold transition ${
                  tab === id
                    ? 'bg-brand-900 text-white'
                    : 'bg-white text-slate-700 border hover:bg-slate-100'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6">
        {tab === 'browse' && (
          <div className="flex gap-6">
            {/* Desktop OLX Filter Sidebar */}
            <aside className="hidden w-64 shrink-0 rounded-2xl border bg-white p-4 shadow-sm lg:block self-start sticky top-36">
              {FilterPanel}
            </aside>

            {/* Results Column */}
            <section className="min-w-0 flex-1">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMobileFiltersOpen(true)}
                    className="flex items-center gap-1.5 rounded-lg border bg-white px-3 py-1.5 text-sm font-semibold lg:hidden"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
                  </button>
                  <p className="text-sm text-slate-600">
                    Showing <strong className="text-slate-900">{billboards.length}</strong> billboards
                    {filters.city !== 'All India' && <> in <strong>{filters.city}</strong></>}
                  </p>
                </div>

                <select
                  value={filters.sort}
                  onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
                  className="rounded-lg border bg-white px-3 py-1.5 text-sm font-medium text-slate-700"
                >
                  <option value="newest">Sort: Featured & Newest</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="size_desc">Size: Largest First</option>
                </select>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div key={n} className="h-80 animate-pulse rounded-2xl border bg-white" />
                  ))}
                </div>
              ) : billboards.length === 0 ? (
                <div className="rounded-2xl border bg-white p-12 text-center">
                  <p className="text-lg font-bold text-slate-800">No billboards match your filters</p>
                  <p className="mt-1 text-sm text-slate-500">Try clearing a filter or searching another city.</p>
                  <button onClick={resetFilters} className="mt-4 rounded-lg bg-brand-900 px-4 py-2 text-sm font-semibold text-white">
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {billboards.map((board) => (
                    <article
                      key={board.id}
                      onClick={() => setSelectedBoard(board)}
                      className="group cursor-pointer overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="relative">
                        <BillboardThumb board={board} className="h-44 w-full" />
                        <button
                          onClick={(e) => handleToggleFavorite(e, board.id)}
                          className="absolute right-3 top-3 rounded-full bg-white/90 p-2 shadow hover:bg-white"
                        >
                          <Heart
                            className={`h-4 w-4 ${
                              favoriteIds.has(board.id) ? 'fill-rose-500 text-rose-500' : 'text-slate-700'
                            }`}
                          />
                        </button>
                        <div className="absolute left-3 top-3 flex gap-1.5">
                          {board.featured && (
                            <span className="rounded bg-amber-400 px-2 py-0.5 text-[11px] font-bold text-slate-900">
                              FEATURED
                            </span>
                          )}
                          <span className={`rounded px-2 py-0.5 text-[11px] font-bold ${board.available ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
                            {board.available ? 'AVAILABLE' : 'BOOKED'}
                          </span>
                        </div>
                      </div>

                      <div className="p-4">
                        <div className="flex items-baseline justify-between">
                          <div className="text-lg font-extrabold text-brand-900">
                            {formatINR(board.monthly_price)}
                            <span className="text-xs font-normal text-slate-500">/mo</span>
                          </div>
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                            {board.width_ft}×{board.height_ft} ft
                          </span>
                        </div>

                        <h3 className="mt-1.5 line-clamp-1 font-bold text-slate-900 group-hover:text-brand-600">
                          {board.title}
                        </h3>

                        <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{board.locality}, {board.city}</span>
                        </div>

                        <div className="mt-3 flex items-center justify-between border-t pt-2.5 text-xs text-slate-500">
                          <span>{board.category} • {board.lighting}</span>
                          <span className="font-semibold text-slate-700">
                            {Math.round(board.daily_impressions / 1000)}k/day
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* SAVED TAB */}
        {tab === 'saved' && (
          <div>
            <h2 className="mb-4 text-xl font-bold text-brand-900">Saved Billboards</h2>
            {savedBoards.length === 0 ? (
              <div className="rounded-2xl border bg-white p-10 text-center text-sm text-slate-500">
                You haven&apos;t saved any billboards yet. Click the heart icon on any listing to bookmark it.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {savedBoards.map((board) => (
                  <div
                    key={board.id}
                    onClick={() => setSelectedBoard(board)}
                    className="cursor-pointer overflow-hidden rounded-2xl border bg-white shadow-sm hover:shadow-md"
                  >
                    <BillboardThumb board={board} className="h-44 w-full" />
                    <div className="p-4">
                      <div className="font-extrabold text-brand-900">{formatINR(board.monthly_price)}/mo</div>
                      <div className="mt-1 font-bold text-slate-900">{board.title}</div>
                      <div className="text-xs text-slate-500">{board.locality}, {board.city}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* BUYER RENTALS TAB */}
        {tab === 'rentals' && (
          <div>
            <h2 className="mb-4 text-xl font-bold text-brand-900">My Campaign Rentals</h2>
            {buyerBookings.length === 0 ? (
              <div className="rounded-2xl border bg-white p-10 text-center text-sm text-slate-500">
                No rentals booked yet. Browse billboards and confirm your first campaign!
              </div>
            ) : (
              <div className="space-y-3">
                {buyerBookings.map((bk) => (
                  <div key={bk.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-white p-4 shadow-sm">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-slate-500">{bk.id}</span>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          bk.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-700' :
                          bk.status === 'Cancelled' ? 'bg-rose-100 text-rose-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>{bk.status}</span>
                      </div>
                      <h3 className="mt-1 font-bold text-slate-900">{bk.campaign_name}</h3>
                      <p className="text-sm text-slate-600">
                        {bk.billboard ? `${bk.billboard.title} (${bk.billboard.city})` : bk.billboard_id}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Starts {bk.start_date} • {bk.months} month(s) • GST incl.: <strong>{formatINR(bk.grand_total)}</strong>
                      </p>
                    </div>
                    {bk.status !== 'Cancelled' && bk.status !== 'Completed' && (
                      <button
                        onClick={() => handleBookingStatus(bk.id, 'Cancelled')}
                        className="rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                      >
                        Cancel Booking
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SELLER HUB TAB */}
        {tab === 'listings' && (
          <div className="space-y-8">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-brand-900">My Listed Billboards</h2>
                <button
                  onClick={() => setShowPost(true)}
                  className="rounded-lg bg-brand-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  + Add New Billboard
                </button>
              </div>
              {myBoards.length === 0 ? (
                <div className="rounded-2xl border bg-white p-10 text-center text-sm text-slate-500">
                  You haven&apos;t posted any billboards yet. Click &ldquo;+ Add New Billboard&rdquo; to start earning rent.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {myBoards.map((board) => (
                    <div key={board.id} className="flex flex-col justify-between rounded-2xl border bg-white p-4 shadow-sm">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-slate-900">{board.title}</h3>
                          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${board.available ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {board.available ? 'Available' : 'Booked'}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {board.locality}, {board.city} • {board.width_ft}×{board.height_ft} ft • {formatINR(board.monthly_price)}/mo
                        </p>
                      </div>
                      <div className="mt-4 flex items-center gap-2 border-t pt-3">
                        <button
                          onClick={() => handleToggleAvailability(board)}
                          className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Mark {board.available ? 'Booked' : 'Available'}
                        </button>
                        <button
                          onClick={() => handleDeleteBoard(board.id)}
                          className="ml-auto flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="mb-4 text-xl font-bold text-brand-900">Incoming Rental Bookings ({sellerBookings.length})</h2>
              {sellerBookings.length === 0 ? (
                <div className="rounded-2xl border bg-white p-8 text-center text-sm text-slate-500">
                  No buyer bookings received yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {sellerBookings.map((bk) => (
                    <div key={bk.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-white p-4 shadow-sm">
                      <div>
                        <div className="text-xs font-semibold text-slate-500">{bk.id} • {bk.status}</div>
                        <div className="font-bold text-slate-900">
                          {bk.campaign_name} ({bk.buyer_name} — {bk.buyer_phone})
                        </div>
                        <div className="text-xs text-slate-600">
                          Board: {bk.billboard?.title || bk.billboard_id} • {bk.months} mo from {bk.start_date} • Total {formatINR(bk.grand_total)}
                        </div>
                      </div>
                      {bk.status !== 'Completed' && bk.status !== 'Cancelled' && (
                        <button
                          onClick={() => handleBookingStatus(bk.id, 'Completed')}
                          className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Mark Completed
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Mobile Filter Drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-slate-900/50" onClick={() => setMobileFiltersOpen(false)} />
          <div className="relative z-10 h-full w-80 max-w-[85vw] overflow-y-auto bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b pb-3">
              <span className="font-bold text-brand-900">Filter Billboards</span>
              <button onClick={() => setMobileFiltersOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            {FilterPanel}
          </div>
        </div>
      )}

      {/* Modals */}
      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onAuthSuccess={(u) => {
            setUser(u);
            notify(`Welcome, ${u.name}!`);
          }}
        />
      )}

      {showPost && (
        <PostBillboardModal
          onClose={() => setShowPost(false)}
          onCreated={() => {
            fetchBillboards();
            refreshUserData();
            notify('Billboard published live!');
          }}
        />
      )}

      {selectedBoard && (
        <BillboardDetailModal
          board={selectedBoard}
          user={user}
          onClose={() => setSelectedBoard(null)}
          onRequireAuth={() => {
            setSelectedBoard(null);
            setShowAuth(true);
          }}
          onBooked={() => {
            refreshUserData();
            setTab('rentals');
            notify('Campaign booking confirmed!');
          }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 rounded-xl bg-brand-900 px-4 py-3 text-sm font-semibold text-white shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
