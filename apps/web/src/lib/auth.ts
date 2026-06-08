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

/**
 * MFA-aware fetch wrapper.
 * Intercepts 401 responses with MFA error bodies and redirects the user
 * to the appropriate flow instead of showing a generic "unauthorized" error.
 */
export async function apiFetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
  const response = await fetch(input, init);

  if (response.status === 401 && typeof window !== 'undefined') {
    // Clone so we can read the body and still return the original response
    const cloned = response.clone();
    try {
      const body = await cloned.json();
      if (body?.message === 'MFA_SETUP_REQUIRED') {
        window.location.href = '/dashboard/settings?reason=mfa_setup_required';
        // Return a never-resolving promise to stop execution while redirect happens
        return new Promise(() => {});
      }
      if (body?.message === 'MFA_VERIFICATION_REQUIRED') {
        window.location.href = '/auth/mfa-challenge';
        return new Promise(() => {});
      }
    } catch {
      // Not JSON or no body — fall through and return original response
    }
  }

  return response;
}

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
 * Select workspace
 */
export async function selectWorkspace(
  workspaceId: string,
): Promise<SelectWorkspaceResponse> {
  const response = await fetch(`${API_BASE}/legacy-auth/select-workspace`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
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
export async function getCurrentUser() {
  const response = await fetch(`${API_BASE}/legacy-auth/me`, {
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
  const response = await fetch(`${API_BASE}/workspaces/invites/pending`, {
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
  console.log('[getMyWorkspaces] Fetching workspaces from:', `${API_BASE}/legacy-auth/workspaces`);
  console.log('[getMyWorkspaces] Document.cookie:', document.cookie);
  
  const response = await fetch(`${API_BASE}/legacy-auth/workspaces`, {
    // Better Auth handles sessions via cookies in the browser
    credentials: 'include',
  });

  console.log('[getMyWorkspaces] Response status:', response.status);

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    console.error('[getMyWorkspaces] Error response:', errorBody);
    throw new Error('Failed to fetch workspaces');
  }

  const result = await response.json();
  console.log('[getMyWorkspaces] Success, workspaces count:', result.data?.length);
  return result;
}

/**
 * Check if a user is already a member of a workspace
 */
export async function checkWorkspaceMember(workspaceId: string, email: string) {
  const response = await fetch(`${API_BASE}/workspaces/${workspaceId}/members/check/${email}`, {
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
  const response = await fetch(`${API_BASE}/workspaces/invites/${inviteToken}/accept`, {
    method: 'POST',
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
 * Token and workspace storage management
 * Refactored to only handle workspace and user state as Better Auth
 * manages sessions via secure cookies.
 */

export const tokenStorage = {
  getBetterAuthToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('betterAuthToken');
  },

  setBetterAuthToken: (token: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('betterAuthToken', token);
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
    localStorage.removeItem('betterAuthToken');
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
