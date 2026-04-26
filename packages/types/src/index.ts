// Re-export Prisma types
export * from '@atlas/database';

// Common types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface QueryParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

// User types
export interface UserSession {
  id: string;
  email: string;
  username?: string;
  globalRole: string;
  workspaces: WorkspaceAccess[];
}

export interface WorkspaceAccess {
  workspaceId: string;
  workspaceName: string;
  role: string;
  department?: string;
}

// Export module-specific types
export * from './crm';
export * from './hr';
export * from './finance';
