import { tokenStorage } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = tokenStorage.getAccessToken();
  if (!token) throw new Error('No authentication token found');

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `API request failed with status ${response.status}`);
  }

  return response.json();
}

// ====================
// DEPARTMENTS
// ====================
export async function getDepartments() {
  return fetchWithAuth('/hr/departments');
}

export async function createDepartment(data: { name: string; code: string; managerId?: string }) {
  return fetchWithAuth('/hr/departments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ====================
// DESIGNATIONS
// ====================
export async function getDesignations() {
  return fetchWithAuth('/hr/designations');
}

export async function createDesignation(data: { title: string; description?: string; level?: number }) {
  return fetchWithAuth('/hr/designations', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ====================
// EMPLOYEES
// ====================
export async function getEmployees() {
  return fetchWithAuth('/hr/employees');
}

export async function createEmployee(data: any) {
  return fetchWithAuth('/hr/employees', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ====================
// LEAVES
// ====================
export async function getLeaveTypes() {
  return fetchWithAuth('/hr/leaves/types');
}

export async function createLeaveType(data: any) {
  return fetchWithAuth('/hr/leaves/types', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getLeaveApplications() {
  return fetchWithAuth('/hr/leaves/applications');
}

export async function createLeaveApplication(data: any) {
  return fetchWithAuth('/hr/leaves/applications', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateLeaveStatus(id: string, status: string, remarks?: string) {
  return fetchWithAuth(`/hr/leaves/applications/${id}/status`, {
    method: 'POST',
    body: JSON.stringify({ status, remarks }),
  });
}

// ====================
// PAYROLL
// ====================
export async function getPayrollRuns() {
  return fetchWithAuth('/hr/payroll/runs');
}

export async function getPayrollRunById(id: string) {
  return fetchWithAuth(`/hr/payroll/runs/${id}`);
}

export async function createPayrollRun(data: any) {
  return fetchWithAuth('/hr/payroll/runs', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function addPayrollEarning(entryId: string, data: any) {
  return fetchWithAuth(`/hr/payroll/entries/${entryId}/earnings`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function addPayrollDeduction(entryId: string, data: any) {
  return fetchWithAuth(`/hr/payroll/entries/${entryId}/deductions`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
