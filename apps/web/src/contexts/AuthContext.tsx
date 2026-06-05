'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import * as authApi from '@/lib/auth';
import type { User, Workspace } from '@/lib/auth';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';

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

  // Track whether we've completed the first real session check.
  // This prevents the brief isPending:false + session:null flash (which happens
  // right after navigation) from wiping out the user we just set during login.
  const sessionHydratedRef = useRef(false);
  // Set to true immediately after login() succeeds so we know a real user exists
  // even before useSession() catches up with the new cookie.
  const justLoggedInRef = useRef(false);

  // Load user from Better Auth session on mount
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    console.log('[AuthContext] Session changed:', { 
      hasSession: !!session, 
      isPending, 
      email: session?.user?.email,
      hydratedBefore: sessionHydratedRef.current,
      justLoggedIn: justLoggedInRef.current,
    });
    
    if (isPending) {
      // Still fetching — keep isLoading true, do nothing else
      return;
    }

    if (session?.user) {
      console.log('[AuthContext] Setting user from session');
      justLoggedInRef.current = false;
      const mappedUser: User = {
        id: session.user.id,
        email: session.user.email,
        username: (session.user as any).username || '',
        role: (session.user as any).globalRole || 'USER',
        verified: session.user.emailVerified,
        image: session.user.image,
      };
      
      setUser(prev => (prev?.id === mappedUser.id ? prev : mappedUser));
      
      // Also load workspace from local storage for now
      const storedWorkspace = authApi.tokenStorage.getWorkspace();
      const storedWorkspaces = authApi.tokenStorage.getWorkspaces();
      
      if (storedWorkspace) {
        setWorkspace(prev => (prev?.workspaceId === storedWorkspace.workspaceId ? prev : storedWorkspace));
      }
      if (storedWorkspaces.length > 0) {
        setWorkspaces(prev => (JSON.stringify(prev) === JSON.stringify(storedWorkspaces) ? prev : storedWorkspaces));
      }

      sessionHydratedRef.current = true;
      setIsLoading(false);
    } else {
      // session is null and we're not pending
      if (justLoggedInRef.current) {
        // We just logged in and the session hasn't synced yet.
        // Keep the user state as-is and stay loading to avoid a false redirect.
        console.log('[AuthContext] Post-login session sync pending, holding state...');
        return;
      }

      console.log('[AuthContext] No session found, setting user to null');
      setUser((prev) => {
        if (prev) {
          console.warn('Session invalidated or expired. Logging out...');
        }
        return null;
      });
      setWorkspace(null);
      sessionHydratedRef.current = true;
      setIsLoading(false);
    }
  }, [session, isPending]);

  const login = async (email: string, password: string) => {
    console.log('[AuthContext] login attempt:', email);
    justLoggedInRef.current = true; // Guard against the post-login session sync gap
    try {
      const { data, error } = await authClient.signIn.email(
        { email, password }
      );

      if (error) {
        console.error('[AuthContext] login error:', error);
        throw new Error(error.message || 'Login failed');
      }
      
      console.log('[AuthContext] login success, data received:', !!data);

      // Always call getSession() after sign-in — it's the most reliable way
      // to get the session token that was just created. The token is stored in
      // localStorage so downstream API calls (selectWorkspace, etc.) can use it
      // as a Bearer header via the AuthGuard's bearer plugin.
      const sessionRes = await authClient.getSession();
      const token =
        sessionRes.data?.session?.token ||
        (data as any)?.session?.token ||
        (data as any)?.token;

      if (token) {
        console.log('[AuthContext] Session token stored successfully');
        authApi.tokenStorage.setBetterAuthToken(token);
        authApi.tokenStorage.setAccessToken(token);
      } else {
        console.warn('[AuthContext] No session token found after login — API calls may fail!');
      }
      
      if (data?.user) {
        const mappedUser: User = {
          id: data.user.id,
          email: data.user.email,
          username: (data.user as any).username || '',
          role: (data.user as any).globalRole || 'USER',
          verified: data.user.emailVerified,
          image: data.user.image,
        };
        setUser(mappedUser);
        authApi.tokenStorage.setUser(mappedUser);
      }

      // Fetch workspaces from our API after successful BetterAuth login
      const workspacesRes = await authApi.getMyWorkspaces();
      const workspaces = workspacesRes.data || [];
      
      authApi.tokenStorage.setWorkspaces(workspaces);
      setWorkspaces(workspaces);
      
      router.push('/select-workspace');
    } catch (error) {
      justLoggedInRef.current = false; // Login failed, release the guard
      console.error('Login error:', error);
      throw error;
    }
  };

  const selectWorkspace = async (workspaceId: string) => {
    try {
      // The AuthGuard authenticates via the Better Auth session cookie
      // (set by signIn.email). We just need credentials:'include' which
      // auth.ts already sets — no manual token extraction needed.
      const response = await authApi.selectWorkspace(workspaceId);
      
      authApi.tokenStorage.setAccessToken(response.data.accessToken);
      authApi.tokenStorage.setWorkspace(response.data.workspace);
      
      setWorkspace(response.data.workspace);
      router.push('/dashboard');
    } catch (error) {
      console.error('Select workspace error:', error);
      throw error;
    }
  };

  const logout = async () => {
    // ... attendance check logic ...
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
          !errorMessage.includes('status 404') &&
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
      await authClient.signOut();
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
