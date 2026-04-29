import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';

@Injectable()
export class HrService {
  constructor(private readonly prisma: PrismaService) {}

  // ====================
  // DEPARTMENTS
  // ====================
  async getDepartments(workspaceId: string): Promise<any> {
    return this.prisma.department.findMany({
      where: { workspaceId, isActive: true },
      include: {
        _count: { select: { employees: true } }
      },
    });
  }

  async createDepartment(workspaceId: string, data: any): Promise<any> {
    return this.prisma.department.create({
      data: {
        workspaceId,
        name: data.name,
        code: data.code,
        managerId: data.managerId,
      },
    });
  }

  // ====================
  // DESIGNATIONS
  // ====================
  async getDesignations(workspaceId: string): Promise<any> {
    return this.prisma.designation.findMany({
      where: { workspaceId, isActive: true },
      include: {
        _count: { select: { employees: true } }
      },
    });
  }

  async createDesignation(workspaceId: string, data: any): Promise<any> {
    return this.prisma.designation.create({
      data: {
        workspaceId,
        title: data.title,
        description: data.description,
        level: data.level || 1,
      },
    });
  }

  // ====================
  // EMPLOYEES
  // ====================
  async getEmployees(workspaceId: string): Promise<any> {
    return this.prisma.employee.findMany({
      where: { workspaceId },
      include: {
        department: { select: { id: true, name: true } },
        designation: { select: { id: true, title: true } },
        user: { select: { email: true, username: true } },
      },
    });
  }

  async createEmployee(workspaceId: string, data: any): Promise<any> {
    // Generate employee number if not provided
    const employeeNumber = data.employeeNumber || `EMP-${Date.now().toString().slice(-6)}`;

    // Check if email is already used by another employee
    const existingEmployee = await this.prisma.employee.findUnique({
      where: { email: data.email },
    });

    if (existingEmployee) {
      throw new BadRequestException('An employee with this email already exists');
    }

    // Try to link with existing auth user if they accepted an invite
    const existingUser = await this.prisma.authUser.findUnique({
      where: { email: data.email },
    });

    return this.prisma.employee.create({
      data: {
        workspaceId,
        employeeNumber,
        firstName: data.firstName,
        lastName: data.lastName,
        fullName: `${data.firstName} ${data.lastName || ''}`.trim(),
        email: data.email,
        mobileNo: data.mobileNo,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        dateOfJoining: data.dateOfJoining ? new Date(data.dateOfJoining) : new Date(),
        gender: data.gender,
        departmentId: data.departmentId,
        designationId: data.designationId,
        baseSalary: data.baseSalary ? parseFloat(data.baseSalary) : 0,
        userId: existingUser?.id, // Link to AuthUser if found
        status: 'ACTIVE',
      },
    });
  }

  // ====================
  // LEAVE TYPES
  // ====================
  async getLeaveTypes(workspaceId: string): Promise<any> {
    return this.prisma.leaveType.findMany({
      where: { workspaceId, isActive: true },
    });
  }

  async createLeaveType(workspaceId: string, data: any): Promise<any> {
    return this.prisma.leaveType.create({
      data: {
        workspaceId,
        name: data.name,
        maxDaysAllowed: parseInt(data.maxDaysAllowed) || 0,
        requiresApproval: data.requiresApproval ?? true,
        isPaid: data.isPaid ?? true,
      },
    });
  }

  // ====================
  // LEAVE APPLICATIONS
  // ====================
  async getLeaveApplications(workspaceId: string): Promise<any> {
    return this.prisma.leaveApplication.findMany({
      where: { workspaceId },
      include: {
        employee: { select: { id: true, fullName: true, employeeNumber: true } },
        leaveType: { select: { id: true, name: true, isPaid: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createLeaveApplication(workspaceId: string, data: any): Promise<any> {
    const fromDate = new Date(data.fromDate);
    const toDate = new Date(data.toDate);
    const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    return this.prisma.leaveApplication.create({
      data: {
        workspaceId,
        employeeId: data.employeeId,
        leaveTypeId: data.leaveTypeId,
        fromDate,
        toDate,
        totalDays: diffDays,
        reason: data.reason,
        status: 'PENDING',
      },
    });
  }

  async updateLeaveStatus(workspaceId: string, id: string, status: any, userId: string, remarks?: string): Promise<any> {
    return this.prisma.leaveApplication.update({
      where: { id, workspaceId },
      data: {
        status,
        approvedBy: userId,
        approvedAt: new Date(),
        approverRemarks: remarks,
      },
    });
  }

  // ====================
  // PAYROLL RUNS
  // ====================
  async getPayrollRuns(workspaceId: string): Promise<any> {
    return this.prisma.payrollRun.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { entries: true } },
      },
    });
  }

  async getPayrollRunById(workspaceId: string, runId: string): Promise<any> {
    return this.prisma.payrollRun.findUnique({
      where: { id: runId, workspaceId },
      include: {
        entries: {
          include: {
            employee: { select: { id: true, fullName: true, employeeNumber: true, baseSalary: true } },
            earnings: true,
            deductions: true,
          },
        },
      },
    });
  }

  async createPayrollRun(workspaceId: string, data: any, userId: string): Promise<any> {
    const runNumber = `PR-${Date.now()}`;
    const periodStart = new Date(data.periodStart);
    const periodEnd = new Date(data.periodEnd);
    const paymentDate = new Date(data.paymentDate);

    // 1. Create the run
    const payrollRun = await this.prisma.payrollRun.create({
      data: {
        workspaceId,
        runNumber,
        name: data.name,
        periodStart,
        periodEnd,
        paymentDate,
        status: 'DRAFT',
      },
    });

    // 2. Fetch all active employees
    const employees = await this.prisma.employee.findMany({
      where: { workspaceId, status: 'ACTIVE' },
    });

    // 3. Generate empty/draft payslips based on base salary
    let totalGross = 0;
    
    if (employees.length > 0) {
      const entriesToCreate = employees.map(emp => {
        const salary = emp.baseSalary ? Number(emp.baseSalary) : 0;
        totalGross += salary;
        return {
          workspaceId,
          payrollRunId: payrollRun.id,
          employeeId: emp.id,
          basicSalary: salary,
          grossSalary: salary, // Will change if earnings added
          totalDeductions: 0,
          netSalary: salary,
          status: 'PENDING' as any,
        };
      });

      await this.prisma.payrollEntry.createMany({
        data: entriesToCreate,
      });

      // Update run totals
      await this.prisma.payrollRun.update({
        where: { id: payrollRun.id },
        data: {
          totalEmployees: employees.length,
          totalGross,
          totalNet: totalGross,
        },
      });
    }

    return payrollRun;
  }

  // ====================
  // PAYROLL ENTRIES (PAYSLIPS)
  // ====================
  async addEarning(workspaceId: string, entryId: string, data: any): Promise<any> {
    const amount = parseFloat(data.amount);
    const res = await this.prisma.payrollEarning.create({
      data: {
        payrollEntryId: entryId,
        earningType: data.earningType,
        name: data.name,
        amount,
        remarks: data.remarks,
      },
    });
    await this.recalculatePayslip(entryId);
    return res;
  }

  async addDeduction(workspaceId: string, entryId: string, data: any): Promise<any> {
    const amount = parseFloat(data.amount);
    const res = await this.prisma.payrollDeduction.create({
      data: {
        payrollEntryId: entryId,
        deductionType: data.deductionType,
        name: data.name,
        amount,
        remarks: data.remarks,
      },
    });
    await this.recalculatePayslip(entryId);
    return res;
  }

  private async recalculatePayslip(entryId: string) {
    const entry = await this.prisma.payrollEntry.findUnique({
      where: { id: entryId },
      include: { earnings: true, deductions: true, payrollRun: true },
    });

    if (!entry) return;

    let gross = Number(entry.basicSalary);
    let totalDeductions = 0;

    entry.earnings.forEach(e => gross += Number(e.amount));
    entry.deductions.forEach(d => totalDeductions += Number(d.amount));
    
    const net = gross - totalDeductions;

    await this.prisma.payrollEntry.update({
      where: { id: entryId },
      data: {
        grossSalary: gross,
        totalDeductions,
        netSalary: net,
      },
    });

    // Also recalculate run totals
    const run = await this.prisma.payrollRun.findUnique({
      where: { id: entry.payrollRunId },
      include: { entries: true },
    });

    if (run) {
      let runGross = 0;
      let runDeductions = 0;
      let runNet = 0;
      run.entries.forEach(e => {
        runGross += Number(e.grossSalary);
        runDeductions += Number(e.totalDeductions);
        runNet += Number(e.netSalary);
      });
      await this.prisma.payrollRun.update({
        where: { id: run.id },
        data: {
          totalGross: runGross,
          totalDeductions: runDeductions,
          totalNet: runNet,
        },
      });
    }
  }
}
