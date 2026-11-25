const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
const ASSET_BASE = API_BASE.endsWith('/api') ? API_BASE.slice(0, -4) : '';

export function getAssetUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  return `${ASSET_BASE}${url}`;
}

export function getToken() {
  return localStorage.getItem('bb_token') || '';
}

export function setToken(token) {
  if (token) localStorage.setItem('bb_token', token);
  else localStorage.removeItem('bb_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  // Auth
  register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  me: () => request('/auth/me'),

  // Billboards
  getBillboards: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== '' && v !== null && v !== undefined && v !== false) qs.set(k, String(v));
    });
    return request(`/billboards?${qs.toString()}`);
  },
  getMyBillboards: () => request('/billboards/mine/list'),
  createBillboard: (formData) => request('/billboards', { method: 'POST', body: formData }),
  updateBillboard: (id, payload) =>
    request(`/billboards/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteBillboard: (id) => request(`/billboards/${id}`, { method: 'DELETE' }),

  // Bookings
  createBooking: (payload) => request('/bookings', { method: 'POST', body: JSON.stringify(payload) }),
  getBuyerBookings: () => request('/bookings/buyer'),
  getSellerBookings: () => request('/bookings/seller'),
  updateBookingStatus: (id, status) =>
    request(`/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // Favorites
  getFavorites: () => request('/favorites'),
  toggleFavorite: (billboardId) => request(`/favorites/${billboardId}`, { method: 'POST' })
};

export function formatINR(amount) {
  return '₹' + Number(amount || 0).toLocaleString('en-IN');
}
