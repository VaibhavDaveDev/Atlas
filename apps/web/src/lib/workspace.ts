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

export const workspaceApi = {
  getMembers: async (workspaceId: string): Promise<WorkspaceMember[]> => {
    const res = await fetch(`${API_URL}/api/v1/workspaces/${workspaceId}/members`, {
      headers: {
        'Authorization': `Bearer ${tokenStorage.getAccessToken()}`,
      },
    });
    if (!res.ok) throw new Error('Failed to fetch workspace members');
    const json = await res.json();
    return json.data || json;
  },

  updateMemberRole: async (workspaceId: string, userId: string, roleName: string): Promise<any> => {
    const res = await fetch(`${API_URL}/api/v1/workspaces/${workspaceId}/members/${userId}/role`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenStorage.getAccessToken()}`,
      },
      body: JSON.stringify({ role: roleName }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to update member role');
    return json;
  },

  removeMember: async (workspaceId: string, userId: string): Promise<any> => {
    const res = await fetch(`${API_URL}/api/v1/workspaces/${workspaceId}/members/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${tokenStorage.getAccessToken()}`,
      },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to remove member');
    return json;
  },

  getInvites: async (workspaceId: string): Promise<any[]> => {
    const res = await fetch(`${API_URL}/api/v1/workspaces/${workspaceId}/invites`, {
      headers: {
        'Authorization': `Bearer ${tokenStorage.getAccessToken()}`,
      },
    });
    if (!res.ok) throw new Error('Failed to fetch workspace invites');
    const json = await res.json();
    return json.data || json;
  },

  cancelInvite: async (workspaceId: string, inviteId: string): Promise<any> => {
    const res = await fetch(`${API_URL}/api/v1/workspaces/${workspaceId}/invites/${inviteId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${tokenStorage.getAccessToken()}`,
      },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to cancel invite');
    return json;
  },
};

