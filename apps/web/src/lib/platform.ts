import { tokenStorage, API_BASE } from './auth';

const getAuthHeaders = () => {
  const workspace = tokenStorage.getWorkspace();
  const workspaceId = (workspace as any)?.workspaceId || (workspace as any)?.id;

  return {
    'Content-Type': 'application/json',
    ...(workspaceId ? { 'x-workspace-id': workspaceId } : {}),
  };
};

async function platformFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
    credentials: 'include',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Request failed: ${res.status}`);
  }

  return res.json();
}

export interface PlatformWorkspace {
  id: string;
  name: string;
  subdomain: string;
  status: string;
  memberCount: number;
  createdAt: string;
  isAuditEnabled: boolean;
  settings: {
    baseCurrency?: string;
    countryCode?: string;
    financeSetupCompleted?: boolean;
  } | null;
}

/**
 * List all workspaces across the platform — Platform Owner only
 */
export async function listAllWorkspaces(): Promise<PlatformWorkspace[]> {
  const data = await platformFetch('/workspaces/platform/all');
  return Array.isArray(data) ? data : data.data || [];
}

/**
 * Create a new workspace and optionally invite an IT Admin — Platform Owner only
 */
export async function createPlatformWorkspace(body: {
  name: string;
  subdomain: string;
  adminEmail?: string;
}): Promise<{ success: boolean; workspace: PlatformWorkspace; inviteSent: boolean }> {
  return platformFetch('/workspaces/platform/create', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
