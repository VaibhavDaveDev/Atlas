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
        // Refresh failed
      }
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `API request failed with status ${response.status}`);
  }

  const json = await response.json();
  return json.data || json;
}

export const getMyTasks = async () => {
  return await fetchWithAuth('/project/tasks/my-tasks');
};

export const getMyProjects = async () => {
  return await fetchWithAuth('/project/projects/my-projects');
};

export const logTime = async (taskId: string, data: { hours: number; description?: string; date: string }) => {
  return await fetchWithAuth(`/project/tasks/${taskId}/time-log`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateTaskStatus = async (taskId: string, status: string) => {
  return await fetchWithAuth(`/project/tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
};
