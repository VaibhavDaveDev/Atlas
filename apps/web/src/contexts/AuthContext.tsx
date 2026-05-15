'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as authApi from '@/lib/auth';
import type { User, Workspace } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  workspace: Workspace | null;
  workspaces: Workspace[];
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  selectWorkspace: (workspaceId: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = () => {
      const storedUser = authApi.tokenStorage.getUser();
      const storedWorkspace = authApi.tokenStorage.getWorkspace();
      const storedWorkspaces = authApi.tokenStorage.getWorkspaces();
      const accessToken = authApi.tokenStorage.getAccessToken();

      if (storedUser && accessToken) {
        setUser(storedUser);
        setWorkspace(storedWorkspace);
        setWorkspaces(storedWorkspaces);
      }
      
      setIsLoading(false);
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password);
      
      // Store tokens, user, and workspaces list
      authApi.tokenStorage.setAccessToken(response.data.accessToken);
      authApi.tokenStorage.setRefreshToken(response.data.refreshToken);
      authApi.tokenStorage.setUser(response.data.user);
      authApi.tokenStorage.setWorkspaces(response.data.workspaces);
      
      setUser(response.data.user);
      setWorkspaces(response.data.workspaces);
      
      // Always navigate to select-workspace.
      // The page itself handles: auto-select if 1 workspace + no pending invites,
      // or shows the full picker if there are multiple workspaces or pending invites.
      router.push('/select-workspace');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const selectWorkspace = async (workspaceId: string) => {
    try {
      const accessToken = authApi.tokenStorage.getAccessToken();
      if (!accessToken) {
        throw new Error('No access token found');
      }

      const response = await authApi.selectWorkspace(workspaceId, accessToken);
      
      // Update access token with workspace context
      authApi.tokenStorage.setAccessToken(response.data.accessToken);
      authApi.tokenStorage.setWorkspace(response.data.workspace);
      
      setWorkspace(response.data.workspace);
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Select workspace error:', error);
      throw error;
    }
  };

  const logout = async () => {
    let shouldProceed = true;

    try {
      // Check attendance status first - only if workspace is properly selected
      if (workspace && workspace.workspaceId) {
        try {
          const { getMyAttendance } = await import('@/lib/hr');
          const res = await getMyAttendance();
          if (res?.data && res.data.checkIn && !res.data.checkOut) {
            const confirmLogout = window.confirm(
              "You haven't checked out today! Do you want to continue logging out without checking out? Click 'Cancel' to stay and check out."
            );
            if (!confirmLogout) {
              shouldProceed = false;
              return; // Cancel logout
            }
          }
        } catch (err) {
          // Ignore "no workspace" or "unauthorized" errors during logout check
          // as they just mean we can't check attendance, which is fine for logout
          const errorMessage = err instanceof Error ? err.message : String(err);
          if (!errorMessage.includes('No workspace selected') && 
              !errorMessage.includes('status 401') &&
              !errorMessage.includes('Unauthorized') &&
              !errorMessage.includes('No token found')) {
            console.error('Failed to check attendance before logout', err);
          }
        }
      }

      const refreshToken = authApi.tokenStorage.getRefreshToken();
      const userId = user?.id;
      
      if (refreshToken && userId) {
        await authApi.logout(refreshToken, userId);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Only clear local storage if logout wasn't canceled
      if (shouldProceed) {
        authApi.tokenStorage.clear();
        setUser(null);
        setWorkspace(null);
        setWorkspaces([]);
        router.push('/login');
      }
    }
  };

  const value = {
    user,
    workspace,
    workspaces,
    isLoading,
    isAuthenticated: !!user,
    login,
    selectWorkspace,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
