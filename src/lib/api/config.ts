// API Configuration
export const API_BASE_URL = 'http://localhost:8081';

// Check if API is available
let apiAvailable: boolean | null = null;

export async function isApiAvailable(): Promise<boolean> {
  if (apiAvailable !== null) return apiAvailable;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    const response = await fetch(`${API_BASE_URL}/categories`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    apiAvailable = response.ok;
    return apiAvailable;
  } catch {
    apiAvailable = false;
    return false;
  }
}

// Reset API availability check (for retry)
export function resetApiAvailability() {
  apiAvailable = null;
}

// Helper for making API requests
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = new Headers(options.headers);

  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.text().catch(() => 'Unknown error');
    throw new Error(`API Error ${response.status}: ${error}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  return text ? JSON.parse(text) : (undefined as T);
}
