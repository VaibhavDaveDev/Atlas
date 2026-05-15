import { tokenStorage, refreshToken as refreshAuthToken } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_BASE = `${API_URL}/api/v1`;

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  let token = tokenStorage.getAccessToken();
  if (!token) throw new Error('No authentication token found');

  const getHeaders = (t: string) => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${t}`,
    ...options.headers,
  });

  let response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: getHeaders(token),
  });

  if (response.status === 401) {
    const currentRefreshToken = tokenStorage.getRefreshToken();
    if (currentRefreshToken) {
      try {
        const refreshResponse = await refreshAuthToken(currentRefreshToken);
        if (refreshResponse?.data?.accessToken) {
          tokenStorage.setAccessToken(refreshResponse.data.accessToken);
          token = refreshResponse.data.accessToken;
          // Retry request
          response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers: getHeaders(token),
          });
        }
      } catch (e) {
        // Refresh failed, fall through to error handling
      }
    }
  }

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

export async function getDepartmentById(id: string) {
  return fetchWithAuth(`/hr/departments/${id}`);
}

export async function updateDepartment(id: string, data: any) {
  return fetchWithAuth(`/hr/departments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteDepartment(id: string) {
  return fetchWithAuth(`/hr/departments/${id}`, {
    method: 'DELETE',
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

export async function getEmployeeById(id: string) {
  return fetchWithAuth(`/hr/employees/${id}`);
}

export async function updateEmployee(id: string, data: any) {
  return fetchWithAuth(`/hr/employees/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteEmployee(id: string) {
  return fetchWithAuth(`/hr/employees/${id}`, {
    method: 'DELETE',
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

export async function updateLeaveType(id: string, data: any) {
  return fetchWithAuth(`/hr/leaves/types/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteLeaveType(id: string) {
  return fetchWithAuth(`/hr/leaves/types/${id}`, {
    method: 'DELETE',
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

export async function getLeaveBalances(employeeId: string) {
  return fetchWithAuth(`/hr/leaves/balances/${employeeId}`);
}

export async function getLeavePolicies() {
  return fetchWithAuth('/hr/leaves/policies');
}

export async function createLeavePolicy(data: any) {
  return fetchWithAuth('/hr/leaves/policies', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateLeavePolicy(id: string, data: any) {
  return fetchWithAuth(`/hr/leaves/policies/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteLeavePolicy(id: string) {
  return fetchWithAuth(`/hr/leaves/policies/${id}`, {
    method: 'DELETE',
  });
}

export async function allocateLeaves(data: { employeeId: string; leavePolicyId: string; fromDate: string; toDate: string }) {
  return fetchWithAuth('/hr/leaves/allocate', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ====================
// PAYROLL CONFIGURATION
// ====================
export async function getSalaryComponents() {
  return fetchWithAuth('/hr/payroll/salary-components');
}

export async function createSalaryComponent(data: any) {
  return fetchWithAuth('/hr/payroll/salary-components', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getSalaryStructures() {
  return fetchWithAuth('/hr/payroll/salary-structures');
}

export async function createSalaryStructure(data: any) {
  return fetchWithAuth('/hr/payroll/salary-structures', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function assignSalaryStructure(data: any) {
  return fetchWithAuth('/hr/payroll/salary-structures/assign', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getSalaryAssignment(employeeId: string) {
  return fetchWithAuth(`/hr/payroll/salary-assignments/${employeeId}`);
}

export async function getTaxSlabs() {
  return fetchWithAuth('/hr/payroll/tax-slabs');
}

export async function createTaxSlab(data: any) {
  return fetchWithAuth('/hr/payroll/tax-slabs', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ====================
// ONBOARDING
// ====================
export async function getOnboardingTemplates() {
  return fetchWithAuth('/hr/onboarding/templates');
}

export async function createOnboardingTemplate(data: any) {
  return fetchWithAuth('/hr/onboarding/templates', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function initiateOnboarding(data: { employeeId: string; templateId: string }) {
  return fetchWithAuth('/hr/onboarding/initiate', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getOnboardingTasks(employeeId: string) {
  return fetchWithAuth(`/hr/onboarding/tasks/${employeeId}`);
}

export async function updateOnboardingTask(taskId: string, status: string) {
  return fetchWithAuth(`/hr/onboarding/tasks/${taskId}/status`, {
    method: 'POST',
    body: JSON.stringify({ status }),
  });
}

// ====================
// PAYROLL RUNS
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

// ====================
// ATTENDANCE
// ====================
export async function checkIn() {
  return fetchWithAuth('/hr/attendance/check-in', {
    method: 'POST',
  });
}

export async function checkOut() {
  return fetchWithAuth('/hr/attendance/check-out', {
    method: 'POST',
  });
}

export async function getAttendanceLogs() {
  return fetchWithAuth('/hr/attendance');
}

export async function getMyAttendance() {
  return fetchWithAuth('/hr/attendance/me');
}

// ====================
// INDIA STATUTORY
// ====================
export async function getIndiaComplianceSettings() {
  return fetchWithAuth('/hr/compliance/india/settings');
}

export async function updateIndiaComplianceSettings(data: any) {
  return fetchWithAuth('/hr/compliance/india/settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function getPfEsiReport(month: number, year: number) {
  return fetchWithAuth(`/hr/compliance/india/report/pf-esi?month=${month}&year=${year}`);
}

export async function getTaxExemptionDeclaration(employeeId: string) {
  return fetchWithAuth(`/hr/compliance/india/declarations/${employeeId}`);
}

export async function submitTaxExemptionDeclaration(data: any) {
  return fetchWithAuth('/hr/compliance/india/declarations', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getStatutoryStatus() {
  return fetchWithAuth('/hr/compliance/india/statutory-status');
}
