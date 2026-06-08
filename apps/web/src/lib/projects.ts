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

  const result = await response.json();
  return result;
}

// Projects
export async function getProjects() {
  return await fetchWithAuth('/project/projects');
}

export async function getProject(id: string) {
  return await fetchWithAuth(`/project/projects/${id}`);
}

export async function createProject(data: any) {
  return await fetchWithAuth('/project/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateProject(id: string, data: any) {
  return await fetchWithAuth(`/project/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteProject(id: string) {
  return await fetchWithAuth(`/project/projects/${id}`, {
    method: 'DELETE',
  });
}

export async function getProjectTimeLogs(id: string) {
  return await fetchWithAuth(`/project/projects/${id}/time-logs`);
}

export async function assignProjectMember(id: string, data: { employeeId: string; role: string }) {
  return await fetchWithAuth(`/project/projects/${id}/members`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function removeProjectMember(projectId: string, employeeId: string) {
  return await fetchWithAuth(`/project/projects/${projectId}/members/${employeeId}`, {
    method: 'DELETE',
  });
}

// Tasks
export async function getTasks(projectId?: string) {
  const url = projectId ? `/project/tasks?projectId=${projectId}` : '/project/tasks';
  return await fetchWithAuth(url);
}

export async function getTask(id: string) {
  return await fetchWithAuth(`/project/tasks/${id}`);
}

export async function getKanban(projectId: string) {
  return await fetchWithAuth(`/project/tasks/kanban?projectId=${projectId}`);
}

export async function createTask(data: any) {
  return await fetchWithAuth('/project/tasks', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTask(id: string, data: any) {
  return await fetchWithAuth(`/project/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteTask(id: string) {
  return await fetchWithAuth(`/project/tasks/${id}`, {
    method: 'DELETE',
  });
}

export async function assignTask(taskId: string, employeeId: string, allocatedHours: number) {
  return await fetchWithAuth(`/project/tasks/${taskId}/assign`, {
    method: 'POST',
    body: JSON.stringify({ employeeId, allocatedHours }),
  });
}

export async function unassignTask(taskId: string, employeeId: string) {
  return await fetchWithAuth(`/project/tasks/${taskId}/assign/${employeeId}`, {
    method: 'DELETE',
  });
}

export async function updateWorkedHours(taskId: string, employeeId: string, workedHours: number) {
  return await fetchWithAuth(`/project/tasks/${taskId}/worked-hours`, {
    method: 'PUT',
    body: JSON.stringify({ employeeId, workedHours }),
  });
}

// Milestones
export async function getMilestones(projectId?: string) {
  const url = projectId ? `/project/milestones?projectId=${projectId}` : '/project/milestones';
  return await fetchWithAuth(url);
}

export async function getMilestone(id: string) {
  return await fetchWithAuth(`/project/milestones/${id}`);
}

export async function createMilestone(data: any) {
  return await fetchWithAuth('/project/milestones', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateMilestone(id: string, data: any) {
  return await fetchWithAuth(`/project/milestones/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteMilestone(id: string) {
  return await fetchWithAuth(`/project/milestones/${id}`, {
    method: 'DELETE',
  });
}
