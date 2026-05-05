const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://52.64.40.205:4003/api';

console.log("base url is ", process.env.NEXT_PUBLIC_API_URL);

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_token');
}

async function request(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  get: (path: string) => request(path),
  post: (path: string, body: unknown) =>
    request(path, { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) }),
  put: (path: string, body: unknown) =>
    request(path, { method: 'PUT', body: body instanceof FormData ? body : JSON.stringify(body) }),
  patch: (path: string, body?: unknown) =>
    request(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: (path: string) => request(path, { method: 'DELETE' }),
};

export const UPLOADS = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5001';
