'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as authApi from '@/lib/auth';
import type { User, Workspace } from '@/lib/auth';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  workspace: Workspace | null;
  workspaces: Workspace[];
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  selectWorkspace: (workspaceId: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
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
    // Check attendance status first - only if workspace is properly selected
    if (workspace && workspace.workspaceId) {
      try {
        const { getMyAttendance } = await import('@/lib/hr');
        const res = await getMyAttendance();

        // API returns { success: true, data: { isCheckedIn: boolean, ... } }
        // or sometimes just { isCheckedIn: boolean, ... }
        const attendanceData = res?.data ?? res;
        
        if (attendanceData && attendanceData.isCheckedIn) {
          // Ask the user via a sonner toast; wait for their choice before continuing
          const confirmed = await new Promise<boolean>((resolve) => {
            toast.warning("You're still checked in!", {
              description: "You haven't checked out today. Log out anyway?",
              duration: Infinity, // keep it until user acts
              action: {
                label: 'Logout Anyway',
                onClick: () => {
                  resolve(true);
                  toast.dismiss();
                },
              },
              cancel: {
                label: 'Cancel',
                onClick: () => {
                  resolve(false);
                  toast.dismiss();
                },
              },
              onDismiss: () => resolve(false),
            });
          });

          if (!confirmed) return; // User chose Cancel — abort logout
        }
      } catch (err) {
        // Silently skip attendance check on auth / workspace errors
        const errorMessage = err instanceof Error ? err.message : String(err);
        if (
          !errorMessage.includes('No workspace selected') &&
          !errorMessage.includes('status 401') &&
          !errorMessage.includes('Unauthorized') &&
          !errorMessage.includes('No token found') &&
          !errorMessage.includes('No authentication token found')
        ) {
          console.error('Failed to check attendance before logout', err);
        }
      }
    }

    // Proceed with logout
    try {
      const refreshToken = authApi.tokenStorage.getRefreshToken();
      const userId = user?.id;
      if (refreshToken && userId) {
        await authApi.logout(refreshToken, userId);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      authApi.tokenStorage.clear();
      setUser(null);
      setWorkspace(null);
      setWorkspaces([]);
      router.push('/login');
    }
  };

  const updateUser = (data: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...data };
      authApi.tokenStorage.setUser(updated);
      return updated;
    });
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
    updateUser,
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
