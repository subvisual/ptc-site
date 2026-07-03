export interface ApiCommunity {
  id: string;
  notionId: string;
  name: string;
  slug: string;
  region: string;
  topics: string[];
  members: string;
  founded: number | null;
  description: string;
  communityPage: string;
  logoUrl: string;
  status: string;
  approved: boolean;
}

export interface ApiLeader {
  notionId: string;
  name: string;
  email: string;
  role: string;
  communityIds: string[];
  approved: boolean;
}

export interface ApiEvent {
  id: string;
  notionId: string;
  name: string;
  description: string;
  venue: string;
  date: string | null;
  region: string;
  format: string;
  topics: string[];
  eventUrl: string;
  price: string;
  approved: boolean;
  communityIds: string[];
}

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(path, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? res.statusText);
  }
  return res.json();
}

export const api = {
  // Communities
  getCommunities: (all = false) =>
    apiFetch<ApiCommunity[]>(`/api/communities${all ? '?all=true' : ''}`),
  getCommunity: (id: string) =>
    apiFetch<ApiCommunity>(`/api/communities/${id}`),
  updateCommunity: (id: string, data: Partial<ApiCommunity>) =>
    apiFetch<ApiCommunity>(`/api/communities/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  createCommunity: (data: Partial<ApiCommunity>) =>
    apiFetch<ApiCommunity>('/api/communities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  submitCommunity: (data: {
    name: string; description?: string; communityPage?: string;
    region?: string; topics?: string[]; founded?: number;
  }) =>
    apiFetch<{ ok: boolean; id: string }>('/api/communities/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  submitLeader: (data: { name: string; email: string; role?: string; communityId: string }) =>
    apiFetch<{ ok: boolean }>('/api/communities/submit-leader', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  deleteCommunity: (id: string) =>
    apiFetch(`/api/communities/${id}`, { method: 'DELETE' }),
  getLeaders: (pending = false) =>
    apiFetch<ApiLeader[]>(`/api/communities/leaders${pending ? '?pending=true' : ''}`),
  updateLeader: (id: string, approved: boolean) =>
    apiFetch<ApiLeader>(`/api/communities/leaders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved }),
    }),

  // Events
  getEvents: (opts: { all?: boolean; past?: boolean } = {}) => {
    const params = new URLSearchParams();
    if (opts.all) params.set('all', 'true');
    if (opts.past) params.set('past', 'true');
    const qs = params.toString();
    return apiFetch<ApiEvent[]>(`/api/events${qs ? '?' + qs : ''}`);
  },
  getEvent: (id: string) =>
    apiFetch<ApiEvent>(`/api/events/${id}`),
  updateEvent: (id: string, data: Partial<ApiEvent>) =>
    apiFetch<ApiEvent>(`/api/events/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  createEvent: (data: Partial<ApiEvent>) =>
    apiFetch<ApiEvent>('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  deleteEvent: (id: string) =>
    apiFetch(`/api/events/${id}`, { method: 'DELETE' }),

  // Auth
  login: (password: string) =>
    apiFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    }),
  logout: () => apiFetch('/api/auth/logout', { method: 'POST' }),
  session: () => apiFetch<{ authenticated: boolean }>('/api/auth/session'),

  // Portal (community dashboard)
  portalSession: () =>
    apiFetch<{ authenticated: boolean; communityIds?: string[]; email?: string }>('/api/portal/session'),
  portalLogout: () => apiFetch('/api/portal/logout', { method: 'POST' }),
  sendMagicLink: (email: string) =>
    apiFetch<{ ok: boolean; communities: string[] }>('/api/portal/magic-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }),

  // Config
  getConfig: () => apiFetch<Record<string, any>>('/api/config'),
  updateConfig: (data: Record<string, any>) =>
    apiFetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
};
