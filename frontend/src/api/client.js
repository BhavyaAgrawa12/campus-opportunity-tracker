const API_BASE = '/api';

export function getAuthToken() {
  return localStorage.getItem('cot_token');
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('cot_token', token);
  } else {
    localStorage.removeItem('cot_token');
  }
}

async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  if (!response.ok) {
    let errorDetail = 'Request failed';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errorDetail;
    } catch {
      // response wasn't JSON
    }
    const err = new Error(errorDetail);
    err.status = response.status;
    throw err;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  // Auth
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (payload) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMe: () => request('/auth/me'),
  updateProfile: (payload) =>
    request('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  // Opportunities
  getOpportunities: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach((v) => query.append(key, v));
        } else {
          query.append(key, value);
        }
      }
    });
    const qs = query.toString();
    return request(`/opportunities${qs ? `?${qs}` : ''}`);
  },

  getOpportunity: (id) => request(`/opportunities/${id}`),
  createOpportunity: (payload) =>
    request('/opportunities', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteOpportunity: (id) => request(`/opportunities/${id}`, { method: 'DELETE' }),
  getMetrics: () => request('/opportunities/metrics'),

  // Saved Opportunities
  getSaved: () => request('/saved'),
  saveOpportunity: (opportunityId) =>
    request('/saved', {
      method: 'POST',
      body: JSON.stringify({ opportunity_id: opportunityId }),
    }),
  unsaveOpportunity: (opportunityId) =>
    request(`/saved/${opportunityId}`, { method: 'DELETE' }),

  // Applications Tracker
  getApplications: () => request('/applications'),
  createApplication: (payload) =>
    request('/applications', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateApplication: (id, payload) =>
    request(`/applications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deleteApplication: (id) =>
    request(`/applications/${id}`, { method: 'DELETE' }),

  // 24-hr Scraper & Sync (both names supported)
  getScraperStatus: () => request('/scrapers/status'),
  triggerScrape: () => request('/scrapers/refresh', { method: 'POST' }),
  triggerScraperSync: () => request('/scrapers/refresh', { method: 'POST' }),
  getScraperLogs: () => request('/scrapers/logs'),
  getSources: () => request('/scrapers'),
  toggleScraperSource: (sourceName) =>
    request(`/scrapers/${sourceName}/toggle`, { method: 'PATCH' }),

  // Email Mailbox Integration (both names supported)
  getEmailAccounts: () => request('/email/accounts'),
  createEmailAccount: (payload) =>
    request('/email/accounts', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteEmailAccount: (id) =>
    request(`/email/accounts/${id}`, { method: 'DELETE' }),
  syncEmailAccount: (id) =>
    request(`/email/accounts/${id}/sync`, { method: 'POST' }),
  syncDemoEmail: () => request('/email/sync-demo', { method: 'POST' }),
  syncDemoEmails: () => request('/email/sync-demo', { method: 'POST' }),
  ingestRawEmail: (payload) =>
    request('/email/ingest-raw', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Notifications
  getNotifications: () => request('/notifications'),
};
