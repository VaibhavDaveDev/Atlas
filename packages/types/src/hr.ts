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

export interface EmployeeMovementInput {
  employeeId: string;
  type: 'PROMOTION' | 'TRANSFER' | 'RE_DESIGNATION';
  movementDate: Date;
  toDepartmentId?: string;
  toDesignationId?: string;
  toSalary?: number;
  reason?: string;
}

export interface JobApplicantInput {
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  resumeUrl?: string;
  coverLetter?: string;
}

export interface InterviewInput {
  applicantId: string;
  interviewDate: Date;
  roundName: string;
  interviewerId: string;
}

export interface ShiftTypeInput {
  name: string;
  startTime: string;
  endTime: string;
  isDefault?: boolean;
}

