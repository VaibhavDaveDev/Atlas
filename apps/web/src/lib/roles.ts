import { tokenStorage, API_URL } from './auth';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${tokenStorage.getAccessToken()}`,
});

export interface Role {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    members: number;
  };
}

export interface Permission {
  id: string;
  workspaceId: string | null;
  resource: string;
  action: string;
  scope: string;
  description: string | null;
}

export const roleApi = {
  getRoles: async (workspaceId: string): Promise<Role[]> => {
    const res = await fetch(`${API_URL}/api/v1/workspaces/${workspaceId}/roles`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch roles');
    const json = await res.json();
    return json.data || [];
  },

  createRole: async (workspaceId: string, data: { name: string; description?: string }): Promise<Role> => {
    const res = await fetch(`${API_URL}/api/v1/workspaces/${workspaceId}/roles`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Failed to create role');
    }
    return json.data;
  },

  getRole: async (workspaceId: string, roleId: string): Promise<Role & { permissions: { permission: Permission }[] }> => {
    const res = await fetch(`${API_URL}/api/v1/workspaces/${workspaceId}/roles/${roleId}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch role details');
    const json = await res.json();
    return json.data;
  },

  deleteRole: async (workspaceId: string, roleId: string): Promise<void> => {
    const res = await fetch(`${API_URL}/api/v1/workspaces/${workspaceId}/roles/${roleId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to delete role');
    }
  },

  getAllPermissions: async (workspaceId: string): Promise<Permission[]> => {
    const res = await fetch(`${API_URL}/api/v1/workspaces/${workspaceId}/roles/permissions/all`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch permissions');
    const json = await res.json();
    return json.data || [];
  },

  updateRolePermissions: async (workspaceId: string, roleId: string, permissionIds: string[]): Promise<void> => {
    const res = await fetch(`${API_URL}/api/v1/workspaces/${workspaceId}/roles/${roleId}/permissions`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ permissionIds }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to update permissions');
    }
  },
};
