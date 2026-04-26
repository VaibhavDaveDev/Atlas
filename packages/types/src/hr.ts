// HR Module Types

export interface EmployeeCreateInput {
  firstName: string;
  lastName?: string;
  email: string;
  departmentId?: string;
  designationId?: string;
  dateOfJoining: Date;
}

export interface LeaveApplicationInput {
  employeeId: string;
  leaveTypeId: string;
  fromDate: Date;
  toDate: Date;
  reason: string;
}

export interface AttendanceInput {
  employeeId: string;
  attendanceDate: Date;
  checkIn?: Date;
  checkOut?: Date;
  status: string;
}
