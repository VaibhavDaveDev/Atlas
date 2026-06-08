import { tokenStorage } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface WorkspaceMember {
  id: string;
  userId: string;
  roleId: string;
  role: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    username: string;
    email: string;
  };
  isActive: boolean;
  joinedAt: string;
}

const getAuthHeaders = (workspaceId?: string) => {
  const workspace = tokenStorage.getWorkspace();
  const wid = workspaceId || (workspace as any)?.workspaceId || (workspace as any)?.id;

  return {
    'Content-Type': 'application/json',
    ...(wid ? { 'x-workspace-id': wid } : {}),
  };
};

export const workspaceApi = {
  getMembers: async (workspaceId: string): Promise<WorkspaceMember[]> => {
    const res = await fetch(`${API_URL}/api/v1/workspaces/${workspaceId}/members`, {
      credentials: 'include',
      headers: getAuthHeaders(workspaceId),
    });
    if (!res.ok) throw new Error('Failed to fetch workspace members');
    const json = await res.json();
    return json.data || json;
  },

  updateMemberRole: async (workspaceId: string, userId: string, roleName: string): Promise<any> => {
    const res = await fetch(`${API_URL}/api/v1/workspaces/${workspaceId}/members/${userId}/role`, {
      method: 'PATCH',
      headers: getAuthHeaders(workspaceId),
      credentials: 'include',
      body: JSON.stringify({ role: roleName }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to update member role');
    return json;
  },

  removeMember: async (workspaceId: string, userId: string): Promise<any> => {
    const res = await fetch(`${API_URL}/api/v1/workspaces/${workspaceId}/members/${userId}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: getAuthHeaders(workspaceId),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to remove member');
    return json;
  },

  getInvites: async (workspaceId: string): Promise<any[]> => {
    const res = await fetch(`${API_URL}/api/v1/workspaces/${workspaceId}/invites`, {
      credentials: 'include',
      headers: getAuthHeaders(workspaceId),
    });
    if (!res.ok) throw new Error('Failed to fetch workspace invites');
    const json = await res.json();
    return json.data || json;
  },

  cancelInvite: async (workspaceId: string, inviteId: string): Promise<any> => {
    const res = await fetch(`${API_URL}/api/v1/workspaces/${workspaceId}/invites/${inviteId}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: getAuthHeaders(workspaceId),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to cancel invite');
    return json;
  },

  getWorkspace: async (workspaceId: string): Promise<any> => {
    const res = await fetch(`${API_URL}/api/v1/workspaces/${workspaceId}`, {
      credentials: 'include',
      headers: getAuthHeaders(workspaceId),
    });
    if (!res.ok) throw new Error('Failed to fetch workspace');
    return await res.json();
  },

  getMyWorkspaces: async (): Promise<any> => {
    const res = await fetch(`${API_URL}/api/v1/workspaces/my`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch workspaces');
    return await res.json();
  },

  updateWorkspace: async (workspaceId: string, data: { name?: string, settings?: any }): Promise<any> => {
    const res = await fetch(`${API_URL}/api/v1/workspaces/${workspaceId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(workspaceId),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update workspace');
    return await res.json();
  },

  getRoles: async (): Promise<any[]> => {
    const workspaceId = tokenStorage.getWorkspace()?.workspaceId;
    const res = await fetch(`${API_URL}/api/v1/workspaces/${workspaceId}/roles`, {
      credentials: 'include',
      headers: getAuthHeaders(workspaceId),
    });
    if (!res.ok) throw new Error('Failed to fetch roles');
    const json = await res.json();
    return json.data || json;
  },

  getAvailableCountries: async (): Promise<any[]> => {
    const res = await fetch(`${API_URL}/api/v1/calendar/countries`, {
      credentials: 'include',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch countries');
    const json = await res.json();
    // TransformInterceptor wraps responses as { success, data: [...] }
    return json.data ?? json;
  },

  updateSettings: async (settings: any): Promise<any> => {
    const workspaceId = tokenStorage.getWorkspace()?.workspaceId;
    const res = await fetch(`${API_URL}/api/v1/workspaces/${workspaceId}/settings`, {
      method: 'PATCH',
      headers: getAuthHeaders(workspaceId),
      credentials: 'include',
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return await res.json();
  },
};
