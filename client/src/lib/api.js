const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export function getToken() { return localStorage.getItem('litrova_token'); }
export function setSession(token, user) {
  localStorage.setItem('litrova_token', token);
  localStorage.setItem('litrova_user', JSON.stringify(user));
}
export function clearSession() {
  localStorage.removeItem('litrova_token');
  localStorage.removeItem('litrova_user');
}
export function getUser() {
  try { return JSON.parse(localStorage.getItem('litrova_user') || 'null'); } catch { return null; }
}
export async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (getToken()) headers.Authorization = `Bearer ${getToken()}`;
  if (options.body && !(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Request failed');
  return data;
}
