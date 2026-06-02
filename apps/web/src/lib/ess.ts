import { tokenStorage } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_BASE = `${API_URL}/api/v1`;

const getAuthHeaders = () => {
  const token = tokenStorage.getAccessToken();
  const workspace = tokenStorage.getWorkspace();
  
  // Extract workspaceId robustly
  const workspaceId = (workspace as any)?.workspaceId || (workspace as any)?.id;

  if (!workspaceId && token) {
    console.warn('Workspace ID missing from storage while token is present. Requests might fail.');
  }

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(workspaceId ? { 'x-workspace-id': workspaceId } : {}),
  };
};

async function fetchESS(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  });
  
  const json = await res.json();
  
  if (!res.ok) {
    throw new Error(json.message || `API request failed with status ${res.status}`);
  }
  
  return json.data;
}

export async function getMyProfile() {
  return fetchESS('/self-service/profile/me');
}

export async function updateMyProfile(data: any) {
  return fetchESS('/self-service/profile/me', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function getMyAttendance() {
  return fetchESS('/self-service/attendance/me');
}

export async function getMyAttendanceHistory(month?: number, year?: number) {
  let url = '/self-service/attendance/history';
  if (month && year) {
    url += `?month=${month}&year=${year}`;
  }
  return fetchESS(url);
}

export async function checkIn() {
  return fetchESS('/self-service/attendance/check-in', {
    method: 'POST',
  });
}

export async function checkOut() {
  return fetchESS('/self-service/attendance/check-out', {
    method: 'POST',
  });
}

export async function getMyLeaves() {
  return fetchESS('/self-service/leaves/me');
}

export async function getMyLeaveBalances() {
  return fetchESS('/self-service/leaves/balances');
}

export async function applyLeave(data: { leaveTypeId: string, fromDate: string, toDate: string, reason: string }) {
  return fetchESS('/self-service/leaves/apply', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function cancelLeave(id: string) {
  return fetchESS(`/self-service/leaves/cancel/${id}`, {
    method: 'PUT',
  });
}

export async function getEssLeaveTypes() {
  return fetchESS('/self-service/leave-types');
}

export async function getMyPayslips() {
  return fetchESS('/self-service/payslips/me');
}

export async function getCalendar(month: number, year: number) {
  return fetchESS(`/self-service/calendar?month=${month}&year=${year}`);
}

export async function getCurrentAppraisal() {
  return fetchESS('/self-service/appraisals/current');
}

export async function submitSelfAppraisal(appraisalId: string, data: any) {
  return fetchESS(`/self-service/appraisals/${appraisalId}/submit`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getMyTaxDeclarations() {
  return fetchESS('/self-service/tax-declarations/me');
}

export async function submitTaxDeclaration(data: any) {
  return fetchESS('/self-service/tax-declarations/submit', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getMyTickets() {
  return fetchESS('/self-service/tickets');
}

export async function createTicket(data: any) {
  return fetchESS('/self-service/tickets', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getTicketDetails(id: string) {
  return fetchESS(`/self-service/tickets/${id}`);
}

export async function addTicketComment(id: string, message: string) {
  return fetchESS(`/self-service/tickets/${id}/comments`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}

export async function cancelTicket(id: string) {
  return fetchESS(`/self-service/tickets/${id}/cancel`, {
    method: 'PUT',
  });
}

export async function cancelTaxDeclaration(id: string) {
  return fetchESS(`/self-service/tax-declarations/cancel/${id}`, {
    method: 'PUT',
  });
}

export async function syncCalendar() {
  return fetchESS('/calendar/sync');
}
