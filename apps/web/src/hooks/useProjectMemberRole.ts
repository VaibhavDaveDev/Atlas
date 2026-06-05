'use client';

import { useState, useEffect, useMemo } from 'react';
import { tokenStorage } from '@/lib/auth';
import { getProject } from '@/lib/projects';

export type ProjectRole = 'MANAGER' | 'LEAD' | 'MEMBER';

export function useProjectMemberRole(projectId?: string) {
  const [role, setRole] = useState<ProjectRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [isWorkspaceAdmin, setIsWorkspaceAdmin] = useState(false);

  useEffect(() => {
    const user = tokenStorage.getUser();
    const workspace = tokenStorage.getWorkspace();
    
    if (workspace?.role === 'ADMIN' || workspace?.role === 'OWNER') {
      setIsWorkspaceAdmin(true);
    }
  }, []);

  useEffect(() => {
    const fetchRole = async () => {
      if (!projectId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await getProject(projectId);
        const project = res.data || res;
        const employee = tokenStorage.getUser(); // This is the user, we need to match with project members
        
        // In our system, the employee profile is linked to the user
        // The project members list contains employee objects
        const member = project.members?.find((m: any) => m.employee.userId === employee?.id);
        
        if (member) {
          setRole(member.role);
        }
      } catch (error) {
        console.error('Failed to fetch project member role', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [projectId]);

  const canManageTasks = useMemo(() => {
    if (isWorkspaceAdmin) return true;
    return role === 'MANAGER' || role === 'LEAD';
  }, [isWorkspaceAdmin, role]);

  return {
    role,
    isWorkspaceAdmin,
    canManageTasks,
    loading
  };
}
