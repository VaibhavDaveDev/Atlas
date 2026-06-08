'use client';

import React, { useEffect, useState } from 'react';
import { AbilityProvider as CaslAbilityProvider, Can, useAbility as useCaslAbility } from '@casl/react';
import { Ability, AbilityBuilder } from '@casl/ability';
import { createPrismaAbility, PrismaQuery } from '@casl/prisma';
import { useAuth } from './AuthContext';
import { tokenStorage } from '../lib/auth';

// Define the ability type (should ideally be shared with backend)
export type Action = 'manage' | 'create' | 'read' | 'update' | 'delete' | 'approve';
export type AppAbility = Ability<[Action, any], PrismaQuery>;

// Export Can and useAbility for convenience
export { Can };
export const useAbility = () => useCaslAbility<AppAbility>();

export const AbilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, workspace } = useAuth();
  const [ability, setAbility] = useState<AppAbility>(
    new AbilityBuilder<AppAbility>(createPrismaAbility).build()
  );

  useEffect(() => {
    const updateAbility = async () => {
      const { can, build } = new AbilityBuilder<AppAbility>(createPrismaAbility);

      const workspaceId = workspace?.workspaceId;
      if (!user) {
        setAbility(build());
        return;
      }

      try {
        // Fetch permissions from API
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const response = await fetch(`${API_URL}/api/v1/auth/permissions`, {
          headers: {
            ...(workspaceId ? { 'x-workspace-id': workspaceId } : {}),
          },
          credentials: 'include',
        });

        if (response.ok) {
          const result = await response.json();
          const permissions = Array.isArray(result.data) ? result.data : [];

          // Map permissions to CASL rules
          if (user.role === 'SUPERADMIN') {
            can('manage', 'all');
          } else if (workspace?.role === 'OWNER' || workspace?.role === 'ADMIN') {
            // OWNER and ADMIN roles get full manage access; specific DB permissions
            // still apply server-side — this just unlocks the UI.
            can('manage', 'all');
          } else {
            permissions.forEach((perm: any) => {
              const action = perm.action as Action;
              const subject = mapResourceToSubject(perm.resource);
              if (!subject) return;
              can(action, subject);
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch permissions:', error);
      }

      setAbility(build());
    };

    updateAbility();
  }, [user, workspace]);

  return (
    <CaslAbilityProvider value={ability}>
      {children}
    </CaslAbilityProvider>
  );
};

// Helper to map resource strings to subjects (sync with backend)
function mapResourceToSubject(resource: string): string | null {
  const map: Record<string, string> = {
    'users': 'User',
    'roles': 'Role',
    'permissions': 'Permission',
    'attendance': 'Attendance',
    'payroll': 'PayrollRun',
    'leads': 'Lead',
    'deals': 'Deal',
    'departments': 'Department',
    'employees': 'Employee',
    'leave': 'LeaveApplication',
    'projects': 'Project',
    'tasks': 'Task',
    'invoices': 'Invoice',
    'payments': 'Payment',
    'vendors': 'Vendor',
    'purchase-orders': 'PurchaseOrder',
    'inventory': 'Warehouse',
    'products': 'Product'
  };
  return map[resource.toLowerCase()] || null;
}
