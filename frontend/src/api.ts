// API service — all calls go to our backend, never direct to Gemini
import { V2BrandInput, V3BrandInput } from './types';

const BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('howiconic_token');
}

function setToken(token: string) {
  localStorage.setItem('howiconic_token', token);
}

function clearToken() {
  localStorage.removeItem('howiconic_token');
}

async function request(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, { ...options, headers });
  } catch {
    throw new Error('Connection failed. Please check your internet and try again.');
  }

  if (res.status === 401) {
    clearToken();
    window.location.reload();
    throw new Error('Session expired');
  }

  let data: any;
  try {
    data = await res.json();
  } catch {
    throw new Error('Unexpected response from server.');
  }

  if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
  return data;
}

// Auth
export async function register(email: string, password: string, name: string) {
  const data = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });
  setToken(data.token);
  return data.user;
}

export async function login(email: string, password: string) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(data.token);
  return data.user;
}

export async function getMe() {
  return request('/auth/me');
}

export function logout() {
  clearToken();
  window.location.reload();
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

// Brands
export async function listBrands() {
  return request('/brands');
}

export async function createBrand(name: string, brandData: any) {
  return request('/brands', {
    method: 'POST',
    body: JSON.stringify({ name, brand_data: brandData }),
  });
}

export async function getBrand(id: string) {
  return request(`/brands/${id}`);
}

export async function updateBrand(id: string, data: { name?: string; brand_data?: any }) {
  return request(`/brands/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteBrand(id: string) {
  return request(`/brands/${id}`, { method: 'DELETE' });
}

// Generate — v2 pipeline (non-streaming fallback)
export async function generateBrandV2(input: V2BrandInput) {
  return request('/generate/brand', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

// Backward compat
export async function generateBrand(prompt: string, context?: any) {
  return request('/generate/brand', {
    method: 'POST',
    body: JSON.stringify({ prompt, context }),
  });
}

export type SSEEventCallback = (type: string, data: any) => void;

// streamGenerateBrand — POST to SSE endpoint, delivers events as they arrive
export async function streamGenerateBrand(input: V2BrandInput, onEvent: SSEEventCallback): Promise<void> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${BASE}/generate/brand/stream`, {
      method: 'POST',
      headers,
      body: JSON.stringify(input),
    });
  } catch {
    throw new Error('Connection failed. Please check your internet and try again.');
  }

  if (res.status === 401) {
    clearToken();
    window.location.reload();
    throw new Error('Session expired');
  }

  if (!res.ok) {
    let error = 'Generation stream failed';
    try {
      const d = await res.json();
      error = d.error || error;
    } catch {}
    throw new Error(error);
  }

  if (!res.body) {
    throw new Error('Streaming not supported by this browser');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Parse complete SSE events from buffer
      const parts = buffer.split('\n\n');
      buffer = parts.pop() || ''; // Incomplete event stays in buffer

      for (const part of parts) {
        const lines = part.split('\n');
        let eventType = 'message';
        let data = '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            data = line.slice(6).trim();
          }
        }

        if (data) {
          try {
            const parsed = JSON.parse(data);
            onEvent(eventType, parsed);
          } catch {
            onEvent(eventType, data);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// V3 brand generation — simplified 4-field input
export async function generateBrandV3(input: V3BrandInput) {
  return request('/generate/brand', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

// V3 streaming — sends v3 format, backend auto-routes to v3 pipeline
export async function streamGenerateBrandV3(input: V3BrandInput, onEvent: SSEEventCallback): Promise<void> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${BASE}/generate/brand/stream`, {
      method: 'POST',
      headers,
      body: JSON.stringify(input),
    });
  } catch {
    throw new Error('Connection failed. Please check your internet and try again.');
  }

  if (res.status === 401) {
    clearToken();
    window.location.reload();
    throw new Error('Session expired');
  }

  if (!res.ok) {
    let error = 'Generation stream failed';
    try {
      const d = await res.json();
      error = d.error || error;
    } catch {}
    throw new Error(error);
  }

  if (!res.body) {
    throw new Error('Streaming not supported by this browser');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const parts = buffer.split('\n\n');
      buffer = parts.pop() || '';

      for (const part of parts) {
        const lines = part.split('\n');
        let eventType = 'message';
        let data = '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            data = line.slice(6).trim();
          }
        }

        if (data) {
          try {
            const parsed = JSON.parse(data);
            onEvent(eventType, parsed);
          } catch {
            onEvent(eventType, data);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// Refine an existing brand with user feedback
export async function refineBrand(brandId: string, currentBrand: any, feedback: string) {
  return request('/generate/refine', {
    method: 'POST',
    body: JSON.stringify({ brand_id: brandId, current_brand: currentBrand, feedback }),
  });
}

// Get usage data for the current user
export async function getUserUsage() {
  return request('/user/usage');
}

export async function generateAudit(input: string, brandData?: any) {
  return request('/generate/audit', {
    method: 'POST',
    body: JSON.stringify({ input, brand_data: brandData }),
  });
}

export async function generateMockup(type: string, brandData: any) {
  return request('/generate/mockup', {
    method: 'POST',
    body: JSON.stringify({ type, brand_data: brandData }),
  });
}

export async function generateLogo(templateId?: string, params?: any) {
  return request('/generate/logo', {
    method: 'POST',
    body: JSON.stringify({ template_id: templateId || 'auto', params: params || {} }),
  });
}
