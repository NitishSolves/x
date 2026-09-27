/**
 * CampusMove Frontend API Client
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export function getStoredToken() {
  return localStorage.getItem('campusmove_token');
}

export function setStoredToken(token) {
  if (token) {
    localStorage.setItem('campusmove_token', token);
  } else {
    localStorage.removeItem('campusmove_token');
  }
}

async function request(endpoint, options = {}) {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  auth: {
    login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
    getMe: () => request('/auth/me'),
  },
  colleges: {
    getAll: () => request('/colleges'),
    getBySlug: (slug) => request(`/colleges/${slug}`),
    create: (payload) => request('/colleges', { method: 'POST', body: JSON.stringify(payload) }),
  },
  buses: {
    getAll: () => request('/buses'),
    create: (payload) => request('/buses', { method: 'POST', body: JSON.stringify(payload) }),
    update: (id, payload) => request(`/buses/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    delete: (id) => request(`/buses/${id}`, { method: 'DELETE' }),
  },
  routes: {
    getAll: () => request('/routes'),
    getById: (id) => request(`/routes/${id}`),
    create: (payload) => request('/routes', { method: 'POST', body: JSON.stringify(payload) }),
    update: (id, payload) => request(`/routes/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    delete: (id) => request(`/routes/${id}`, { method: 'DELETE' }),
    createStop: (routeId, payload) => request(`/routes/${routeId}/stops`, { method: 'POST', body: JSON.stringify(payload) }),
  },
  stops: {
    update: (id, payload) => request(`/stops/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    delete: (id) => request(`/stops/${id}`, { method: 'DELETE' }),
  },
  drivers: {
    getAll: () => request('/drivers'),
    create: (payload) => request('/drivers', { method: 'POST', body: JSON.stringify(payload) }),
    update: (id, payload) => request(`/drivers/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  },
  trips: {
    getActive: () => request('/trips/active'),
    getById: (id) => request(`/trips/${id}`),
    start: (payload) => request('/trips/start', { method: 'POST', body: JSON.stringify(payload) }),
    end: (id) => request(`/trips/${id}/end`, { method: 'POST' }),
    postTelemetry: (payload) => request('/trips/telemetry', { method: 'POST', body: JSON.stringify(payload) }),
    updateOccupancy: (id, payload) => request(`/trips/${id}/occupancy`, { method: 'POST', body: JSON.stringify(payload) }),
    checkinStop: (id, payload) => request(`/trips/${id}/checkin`, { method: 'POST', body: JSON.stringify(payload) }),
  },
  alerts: {
    getAll: () => request('/alerts'),
    create: (payload) => request('/alerts', { method: 'POST', body: JSON.stringify(payload) }),
    resolve: (id) => request(`/alerts/${id}/resolve`, { method: 'PUT' }),
  },
  analytics: {
    getDashboard: () => request('/analytics/dashboard'),
  },
};
