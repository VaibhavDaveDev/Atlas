import { tokenStorage, refreshToken as refreshAuthToken } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_BASE = `${API_URL}/api/v1`;

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  let token = tokenStorage.getAccessToken();
  if (!token) throw new Error('No authentication token found');

  const getHeaders = (t: string) => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${t}`,
    ...options.headers,
  });

  const headers = getHeaders(token);

  let response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    const currentRefreshToken = tokenStorage.getRefreshToken();
    if (currentRefreshToken) {
      try {
        const refreshResponse = await refreshAuthToken(currentRefreshToken);
        if (refreshResponse?.data?.accessToken) {
          tokenStorage.setAccessToken(refreshResponse.data.accessToken);
          token = refreshResponse.data.accessToken;
          // Retry request
          response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers: getHeaders(token as string),
          });
        }
      } catch (e) {
        // Refresh failed, fall through to error handling
      }
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `API request failed with status ${response.status}`);
  }

  return response.json();
}

export async function getNotifications() {
  return fetchWithAuth('/notifications');
}

export async function getUnreadCount() {
  return fetchWithAuth('/notifications/unread-count');
}

export async function markAsRead(id: string) {
  return fetchWithAuth(`/notifications/${id}/read`, {
    method: 'PATCH',
  });
}

export async function markAllAsRead() {
  return fetchWithAuth('/notifications/read-all', {
    method: 'PATCH',
  });
}
