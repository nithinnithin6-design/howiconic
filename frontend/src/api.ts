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

export async function patchBrand(id: string | number, data: { name?: string; brand_data?: any }) {
  return request(`/brands/${id}`, {
    method: 'PATCH',
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

// ─── V4 EDUCATION API ─────────────────────────────────────────────────────────

export async function getFieldHint(field: string): Promise<{ content: string; source: string }> {
  try {
    return await request(`/education/hint?field=${encodeURIComponent(field)}`);
  } catch {
    // Fallback hints if API unavailable
    const fallbacks: Record<string, { content: string; source: string }> = {
      brand_idea: { content: 'Great brands are built on a belief, not a product. What does this brand stand for?', source: 'Brand Strategy' },
      product: { content: 'Be specific — "premium compression activewear" beats "clothing". Detail helps the AI architect better.', source: 'HowIconic Engine' },
      audience: { content: 'The tighter your audience definition, the stronger your brand. Who is NOT your customer?', source: 'Positioning 101' },
      vibe: { content: 'Vibe sets the emotional frequency. Bold attracts attention; Clean signals trust; Warm builds loyalty.', source: 'Design Psychology' },
    };
    return fallbacks[field] || { content: 'Define this clearly — it shapes every design decision.', source: 'HowIconic' };
  }
}

export async function getLoadingTip(): Promise<{ content: string; source: string }> {
  try {
    return await request('/education/tip?context=loading_tip');
  } catch {
    const tips = [
      { content: '85% of purchasing decisions are influenced by color. Your color system is being chosen with scientific intent.', source: 'Color Research Institute' },
      { content: 'Coined brand names like Kodak and Spotify are legally stronger — they own their entire category.', source: 'Trademark Law' },
      { content: 'Brands with a clear archetype generate 2x more revenue than those without.', source: 'Jung & Brand Archetypes' },
      { content: 'The average person sees 10,000 brand impressions per day. Distinctiveness is survival.', source: 'Media Research' },
      { content: 'Typography carries 40% of a brand\'s personality signal. Font choice is not decoration.', source: 'Typography Research' },
      { content: 'Brands with consistent visual identity are 3.5x more visible than those without.', source: 'Lucidpress, 2019' },
    ];
    return tips[Math.floor(Math.random() * tips.length)];
  }
}

// ─── V4 ARCHITECTURE API ──────────────────────────────────────────────────────

export async function createSubBrand(parentId: number, input: any): Promise<any> {
  return request(`/brands/${parentId}/sub-brand`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function getBrandArchitecture(brandId: number | string): Promise<any> {
  return request(`/brands/${brandId}/architecture`);
}

// ─── V4 VAULT API ─────────────────────────────────────────────────────────────

export async function getBrandAssets(brandId: number): Promise<any[]> {
  try {
    return await request(`/brands/${brandId}/assets`);
  } catch {
    return [];
  }
}

export async function shareBrand(brandId: number): Promise<{ token: string; url: string }> {
  return request(`/brands/${brandId}/share`, { method: 'POST' });
}

export async function getSharedKit(token: string): Promise<any> {
  return request(`/brands/shared/${token}`);
}

// ─── DESIGN PRODUCTIONS API ───────────────────────────────────────────────────

export async function listProductions(brandId: number | string): Promise<any[]> {
  try {
    return await request(`/brands/${brandId}/productions`);
  } catch {
    return [];
  }
}

export async function createProduction(brandId: number | string, data: {
  production_type: string;
  template_id?: string;
  content?: any;
}): Promise<any> {
  return request(`/brands/${brandId}/productions`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ─── GUIDED CO-CREATION ─────────────────────────────────────────────────────

export async function guidedStart(brandIdea: string, product: string, audience: string, vibe: string) {
  return request('/brands/guided/start', {
    method: 'POST',
    body: JSON.stringify({ brand_idea: brandIdea, product, audience, vibe }),
  });
}

export async function guidedStep(brandId: number, step: number, selectedIndex: number, wishlisted: number[] = [], edits: any = {}) {
  return request(`/brands/${brandId}/guided/step`, {
    method: 'POST',
    body: JSON.stringify({ step, selected_index: selectedIndex, wishlisted, edits }),
  });
}

export async function guidedState(brandId: number) {
  return request(`/brands/${brandId}/guided/state`);
}

export async function guidedBack(brandId: number, toStep: number) {
  return request(`/brands/${brandId}/guided/back`, {
    method: 'POST',
    body: JSON.stringify({ to_step: toStep }),
  });
}

// ─── AI GUIDE ─────────────────────────────────────────────────────────────────

export async function guideMessage(data: {
  step: number;
  step_name: string;
  inputs?: any;
  selections?: any;
  options?: any;
  action: 'welcome' | 'entering_step' | 'selected_option' | 'going_back';
  selected_idx?: number;
}) {
  return request('/guide/message', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
