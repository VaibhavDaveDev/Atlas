/**
 * Auth utilities and API client
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_BASE = `${API_URL}/api/v1`;

export interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  verified: boolean;
}

export interface Workspace {
  workspaceId: string;
  workspaceName: string;
  subdomain: string;
  status: string;
  role: string;
  department: string | null;
  joinedAt?: string;
}

export interface LoginResponse {
  statusCode: number;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    user: User;
    workspaces: Workspace[];
    expiresIn: number;
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

/**
 * Login with email and password
 */
export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Login failed');
  }

  return response.json();
}

/**
 * Select workspace
 */
export async function selectWorkspace(
  workspaceId: string,
  accessToken: string
): Promise<SelectWorkspaceResponse> {
  const response = await fetch(`${API_BASE}/auth/select-workspace`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ workspaceId }),
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
  const response = await fetch(`${API_BASE}/auth/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get current user');
  }

  return response.json();
}

/**
 * Refresh access token
 */
export async function refreshToken(refreshToken: string) {
  const response = await fetch(`${API_BASE}/auth/refresh-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  return response.json();
}

/**
 * Logout — only sends the refreshToken; userId is verified from JWT on the server.
 */
export async function logout(refreshToken: string, _userId?: string) {
  const accessToken = tokenStorage.getAccessToken();
  const response = await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    throw new Error('Failed to logout');
  }

  return response.json();
}

/**
 * Get pending workspace invites for the logged-in user
 */
export async function getPendingInvites() {
  const token = tokenStorage.getAccessToken();
  if (!token) throw new Error('No token');

  const response = await fetch(`${API_BASE}/workspaces/invites/pending`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch invites');
  }

  return response.json();
}

/**
 * Accept a workspace invite
 */
export async function acceptInvite(inviteToken: string) {
  const token = tokenStorage.getAccessToken();
  if (!token) throw new Error('No token');

  const response = await fetch(`${API_BASE}/workspaces/invites/${inviteToken}/accept`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
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
 * Request a password reset code via email
 */
export async function forgotPassword(email: string): Promise<AuthResponse<{ message: string; resetSessionId: string }>> {
  const response = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to send reset email');
  }

  return response.json();
}

/**
 * Reset password using the emailed code
 */
export async function resetPassword(
  resetSessionId: string,
  code: string,
  newPassword: string,
): Promise<AuthResponse<{ message: string }>> {
  const response = await fetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resetSessionId, code, newPassword }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to reset password');
  }

  return response.json();
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
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('workspace');
  },
};
