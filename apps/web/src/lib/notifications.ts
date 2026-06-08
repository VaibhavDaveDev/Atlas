import { tokenStorage } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_BASE = `${API_URL}/api/v1`;

const getAuthHeaders = () => {
  const workspace = tokenStorage.getWorkspace();
  const workspaceId = (workspace as any)?.workspaceId || (workspace as any)?.id;

  return {
    'Content-Type': 'application/json',
    ...(workspaceId ? { 'x-workspace-id': workspaceId } : {}),
  };
};

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const headers = {
    ...getAuthHeaders(),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // Send Better Auth cookies
  });

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
