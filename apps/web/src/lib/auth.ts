/**
 * Auth utilities and API client
 */

export const getApiURL = () => {
  let url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `http://${url}`;
  }
  return url.replace(/\/$/, '');
};

export const API_URL = getApiURL();
export const API_BASE = `${API_URL}/api/v1`;

export interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  verified: boolean;
  image?: string | null;
  notificationRetentionDays?: number;
}

export interface Workspace {
  workspaceId: string;
  workspaceName: string;
  subdomain: string;
  status: string;
  role: string;
  department: string | null;
  joinedAt?: string;
  isAuditEnabled: boolean;
  mfaEnforced: boolean;
  memberCount?: number;
  settings?: {
    countryCode?: string;
    weekendHolidays?: number[];
    baseCurrency?: string;
  };
}

export interface SelectWorkspaceResponse {
  statusCode: number;
  message: string;
  data: {
    accessToken: string;
    workspace: Workspace;
  };
}

import { authClient } from './auth-client';

/**
 * Refresh access token
 * Compatibility function for legacy services, now using Better Auth session
 */
export async function refreshToken(refreshToken?: string) {
  const { data: session, error } = await authClient.getSession();
  
  if (error) {
    throw new Error(error.message || 'Failed to refresh session');
  }

  return {
    data: {
      accessToken: 'session-managed-by-better-auth',
      user: session?.user,
      expiresIn: 3600
    }
  };
}

/**
 * Select workspace
 */
export async function selectWorkspace(
  workspaceId: string,
): Promise<SelectWorkspaceResponse> {
  // Use the Better Auth session token stored during login (same pattern as
  // all other authenticated calls — the AuthGuard bearer plugin validates it).
  const token = tokenStorage.getAccessToken();

  const response = await fetch(`${API_BASE}/legacy-auth/select-workspace`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ workspaceId }),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to select workspace');
  }

  return response.json();
}

/**
 * Get current user
 */
export async function getCurrentUser(accessToken: string) {
  const response = await fetch(`${API_BASE}/legacy-auth/me`, {
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to get current user');
  }

  return response.json();
}

/**
 * Get pending workspace invites for the logged-in user
 */
export async function getPendingInvites() {
  const token = tokenStorage.getAccessToken();

  const response = await fetch(`${API_BASE}/workspaces/invites/pending`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch invites');
  }

  return response.json();
}

/**
 * Get the current user's workspaces (re-fetch from server)
 */
export async function getMyWorkspaces(): Promise<{ data: Workspace[] }> {
  const token = tokenStorage.getAccessToken();
  
  const response = await fetch(`${API_BASE}/legacy-auth/workspaces`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    // Better Auth handles sessions via cookies in the browser
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch workspaces');
  }

  return response.json();
}

/**
 * Check if a user is already a member of a workspace
 */
export async function checkWorkspaceMember(workspaceId: string, email: string) {
  const token = tokenStorage.getAccessToken();

  const response = await fetch(`${API_BASE}/workspaces/${workspaceId}/members/check/${email}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to check member');
  }

  return response.json();
}

/**
 * Accept a workspace invite
 */
export async function acceptInvite(inviteToken: string) {
  const token = tokenStorage.getAccessToken();

  const response = await fetch(`${API_BASE}/workspaces/invites/${inviteToken}/accept`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to accept invite');
  }

  return response.json();
}

/**
 * Request a password reset code via email
 */
export interface AuthResponse<T = any> {
  statusCode: number;
  message: string;
  data: T;
}

/**
 * Token storage utilities
 */

export const tokenStorage = {
  getAccessToken: () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  },
  
  setAccessToken: (token: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('accessToken', token);
  },

  getBetterAuthToken: () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('betterAuthToken');
  },

  setBetterAuthToken: (token: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('betterAuthToken', token);
  },
  
  getRefreshToken: () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refreshToken');
  },
  
  setRefreshToken: (token: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('refreshToken', token);
  },
  
  getUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    try {
      const user = localStorage.getItem('user');
      return user && user !== 'undefined' ? JSON.parse(user) : null;
    } catch (e) {
      localStorage.removeItem('user');
      return null;
    }
  },
  
  setUser: (user: User | null) => {
    if (typeof window === 'undefined') return;
    if (!user) {
      localStorage.removeItem('user');
      return;
    }
    localStorage.setItem('user', JSON.stringify(user));
  },
  
  getWorkspace: (): Workspace | null => {
    if (typeof window === 'undefined') return null;
    try {
      const workspace = localStorage.getItem('workspace');
      return workspace && workspace !== 'undefined' ? JSON.parse(workspace) : null;
    } catch (e) {
      localStorage.removeItem('workspace');
      return null;
    }
  },
  
  setWorkspace: (workspace: Workspace | null) => {
    if (typeof window === 'undefined') return;
    if (!workspace) {
      localStorage.removeItem('workspace');
      return;
    }
    localStorage.setItem('workspace', JSON.stringify(workspace));
  },
  
  clear: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('betterAuthToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('workspace');
    localStorage.removeItem('workspaces');
  },

  getWorkspaces: (): Workspace[] => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem('workspaces');
      return raw && raw !== 'undefined' ? (JSON.parse(raw) as Workspace[]) : [];
    } catch {
      localStorage.removeItem('workspaces');
      return [];
    }
  },

  setWorkspaces: (workspaces: Workspace[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('workspaces', JSON.stringify(workspaces));
  },
};
