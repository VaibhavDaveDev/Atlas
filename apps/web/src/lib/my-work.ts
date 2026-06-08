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
