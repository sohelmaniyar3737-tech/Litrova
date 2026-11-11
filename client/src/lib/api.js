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

// XMLHttpRequest is used only for uploads because fetch does not expose upload progress.
export function uploadFile(path, formData, onProgress = () => {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}${path}`);
    if (getToken()) xhr.setRequestHeader('Authorization', `Bearer ${getToken()}`);
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    });
    xhr.addEventListener('load', () => {
      let data = {};
      try { data = JSON.parse(xhr.responseText || '{}'); } catch { /* ignore invalid response */ }
      if (xhr.status >= 200 && xhr.status < 300) resolve(data);
      else reject(new Error(data.message || 'Upload failed'));
    });
    xhr.addEventListener('error', () => reject(new Error('Network error while uploading the PDF.')));
    xhr.addEventListener('timeout', () => reject(new Error('PDF upload timed out. Please try again.')));
    xhr.timeout = 120000;
    xhr.send(formData);
  });
}
