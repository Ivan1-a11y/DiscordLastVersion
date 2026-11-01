export const API_BASE = '/api';

let memoryToken: string | null = null;

export function getAuthToken(): string | null {
  if (memoryToken) return memoryToken;
  try {
    const token = localStorage.getItem('accord_token');
    if (!token || token === 'null' || token === 'undefined') {
      return null;
    }
    memoryToken = token;
    return token;
  } catch {
    return memoryToken;
  }
}

export function setAuthToken(token: string | null) {
  memoryToken = token;
  try {
    if (token) {
      localStorage.setItem('accord_token', token);
    } else {
      localStorage.removeItem('accord_token');
    }
  } catch {
    // Ignore storage restriction errors in sandboxed iframes
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      // Clear invalid/expired token
      setAuthToken(null);
    }
    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}
