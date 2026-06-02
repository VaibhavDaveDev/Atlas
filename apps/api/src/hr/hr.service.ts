import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../common/services/prisma.service";
import { evaluateFormula } from "@atlas/utils";

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
        _count: { select: { employees: true } },
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

  async getDepartmentById(workspaceId: string, id: string): Promise<any> {
    const dept = await this.prisma.department.findUnique({
      where: { id, workspaceId },
      include: { employees: true },
    });
    if (!dept) throw new NotFoundException("Department not found");
    return dept;
  }

  async updateDepartment(
    workspaceId: string,
    id: string,
    data: any,
  ): Promise<any> {
    return this.prisma.department.update({
      where: { id, workspaceId },
      data,
    });
  }

  async deleteDepartment(workspaceId: string, id: string): Promise<any> {
    return this.prisma.department.update({
      where: { id, workspaceId },
      data: { isActive: false },
    });
  }

  // ====================
  // DESIGNATIONS
  // ====================
  async getDesignations(workspaceId: string): Promise<any> {
    return this.prisma.designation.findMany({
      where: { workspaceId, isActive: true },
      include: {
        _count: { select: { employees: true } },
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
      where: { workspaceId, deletedAt: null },
      include: {
        department: { select: { id: true, name: true } },
        designation: { select: { id: true, title: true } },
        user: { select: { email: true, username: true } },
      },
    });
  }

  async createEmployee(workspaceId: string, data: any): Promise<any> {
    // Generate collision-safe employee number if not provided
    const employeeNumber =
      data.employeeNumber ||
      `EMP-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    // Check if email is already used by another employee in this workspace
    const existingEmployee = await this.prisma.employee.findFirst({
      where: { workspaceId, email: data.email },
    });

    if (existingEmployee) {
      throw new BadRequestException(
        "An employee with this email already exists",
      );
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
        fullName: `${data.firstName} ${data.lastName || ""}`.trim(),
        email: data.email,
        mobileNo: data.mobileNo,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        dateOfJoining: data.dateOfJoining
          ? new Date(data.dateOfJoining)
          : new Date(),
        gender: data.gender,
        departmentId: data.departmentId,
        designationId: data.designationId,
        baseSalary: data.baseSalary ? parseFloat(data.baseSalary) : 0,
        userId: existingUser?.id, // Link to AuthUser if found
        status: "ACTIVE",
        // Statutory Fields
        panNumber: data.panNumber,
        pfAccount: data.pfAccount,
        esiNumber: data.esiNumber,
        aadhaarNumber: data.aadhaarNumber,
      },
    });
  }

  async getEmployeeById(workspaceId: string, id: string): Promise<any> {
    const emp = await this.prisma.employee.findFirst({
      where: { id, workspaceId, deletedAt: null },
      include: {
        department: true,
        designation: true,
        user: { select: { email: true, username: true } },
      },
    });
    if (!emp) throw new NotFoundException("Employee not found");
    return emp;
  }

  async updateEmployee(
    workspaceId: string,
    id: string,
    data: any,
  ): Promise<any> {
    // Fetch existing employee to preserve name components in partial updates
    const existing = await this.prisma.employee.findUnique({
      where: { id, workspaceId },
    });
    if (!existing) throw new NotFoundException("Employee not found");

    const newFirst =
      data.firstName !== undefined ? data.firstName : existing.firstName;
    const newLast =
      data.lastName !== undefined ? data.lastName : existing.lastName;
    const fullName =
      newFirst || newLast
        ? `${newFirst || ""} ${newLast || ""}`.trim()
        : existing.fullName;

    return this.prisma.employee.update({
      where: { id, workspaceId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        fullName,
        mobileNo: data.mobileNo,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        dateOfJoining: data.dateOfJoining
          ? new Date(data.dateOfJoining)
          : undefined,
        dateOfLeaving: data.dateOfLeaving
          ? new Date(data.dateOfLeaving)
          : undefined,
        gender: data.gender,
        departmentId: data.departmentId,
        designationId: data.designationId,
        baseSalary: data.baseSalary ? parseFloat(data.baseSalary) : undefined,
        status: data.status,
        // Statutory Fields
        panNumber: data.panNumber,
        pfAccount: data.pfAccount,
        esiNumber: data.esiNumber,
        aadhaarNumber: data.aadhaarNumber,
      },
    });
  }

  async deleteEmployee(workspaceId: string, id: string): Promise<any> {
    return this.prisma.employee.update({
      where: { id, workspaceId },
      data: { deletedAt: new Date(), status: "TERMINATED" },
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

  async updateLeaveType(
    workspaceId: string,
    id: string,
    data: any,
  ): Promise<any> {
    return this.prisma.leaveType.update({
      where: { id, workspaceId },
      data: {
        name: data.name,
        maxDaysAllowed: parseInt(data.maxDaysAllowed) || 0,
        requiresApproval: data.requiresApproval,
        isPaid: data.isPaid,
      },
    });
  }

  async deleteLeaveType(workspaceId: string, id: string): Promise<any> {
    return this.prisma.leaveType.update({
      where: { id, workspaceId },
      data: { isActive: false },
    });
  }

  // ====================
  // LEAVE LEDGER & BALANCES
  // ====================
  async getLeaveBalance(
    workspaceId: string,
    employeeId: string,
    leaveTypeId: string,
  ): Promise<number> {
    const result = await this.prisma.leaveLedgerEntry.aggregate({
      where: {
        workspaceId,
        employeeId,
        leaveTypeId,
      },
      _sum: { leaves: true },
    });
    return Number(result._sum.leaves || 0);
  }

  async getAllLeaveBalances(
    workspaceId: string,
    employeeId: string,
  ): Promise<any> {
    const leaveTypes = await this.prisma.leaveType.findMany({
      where: { workspaceId, isActive: true },
    });

    const balances = await Promise.all(
      leaveTypes.map(async (type) => {
        const balance = await this.getLeaveBalance(
          workspaceId,
          employeeId,
          type.id,
        );
        return {
          leaveTypeId: type.id,
          leaveTypeName: type.name,
          balance,
        };
      }),
    );

    return balances;
  }

  async createLeaveLedgerEntry(workspaceId: string, data: any): Promise<any> {
    return this.prisma.leaveLedgerEntry.create({
      data: {
        workspaceId,
        employeeId: data.employeeId,
        leaveTypeId: data.leaveTypeId,
        transactionType: data.transactionType,
        transactionId: data.transactionId,
        leaves: data.leaves,
        remarks: data.remarks,
        postingDate: data.postingDate || new Date(),
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
        employee: {
          select: { id: true, fullName: true, employeeNumber: true },
        },
        leaveType: { select: { id: true, name: true, isPaid: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async createLeaveApplication(workspaceId: string, data: any): Promise<any> {
    const fromDate = new Date(data.fromDate);
    const toDate = new Date(data.toDate);
    const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Check balance before allowing application
    const balance = await this.getLeaveBalance(
      workspaceId,
      data.employeeId,
      data.leaveTypeId,
    );
    if (balance < diffDays) {
      throw new BadRequestException(
        `Insufficient leave balance. Available: ${balance} days, Requested: ${diffDays} days`,
      );
    }

    return this.prisma.leaveApplication.create({
      data: {
        workspaceId,
        employeeId: data.employeeId,
        leaveTypeId: data.leaveTypeId,
        fromDate,
        toDate,
        totalDays: diffDays,
        reason: data.reason,
        status: "PENDING",
      },
    });
  }

  async updateLeaveStatus(
    workspaceId: string,
    id: string,
    status: any,
    userId: string,
    remarks?: string,
  ): Promise<any> {
    const application = await this.prisma.leaveApplication.findUnique({
      where: { id, workspaceId },
    });

    if (!application)
      throw new NotFoundException("Leave application not found");

    const updated = await this.prisma.leaveApplication.update({
      where: { id, workspaceId },
      data: {
        status,
        approvedBy: userId,
        approvedAt: new Date(),
        approverRemarks: remarks,
      },
    });

    // If approved, create a negative ledger entry
    if (status === "APPROVED") {
      await this.createLeaveLedgerEntry(workspaceId, {
        employeeId: application.employeeId,
        leaveTypeId: application.leaveTypeId,
        transactionType: "APPLICATION",
        transactionId: application.id,
        leaves: -Number(application.totalDays),
        remarks: `Approved leave from ${application.fromDate.toLocaleDateString()} to ${application.toDate.toLocaleDateString()}`,
      });
    }

    return updated;
  }

  // ====================
  // ATTENDANCE
  // ====================
  async checkIn(workspaceId: string, userId: string): Promise<any> {
    const employee = await this.prisma.employee.findFirst({
      where: { workspaceId, userId, deletedAt: null },
    });
    if (!employee)
      throw new NotFoundException("Employee record not found for this user");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await this.prisma.attendance.findFirst({
      where: {
        workspaceId,
        employeeId: employee.id,
        attendanceDate: today,
      },
      orderBy: { createdAt: "desc" },
    });

    if (existing && !existing.checkOut)
      throw new BadRequestException("Already checked in today");

    return this.prisma.attendance.create({
      data: {
        workspaceId,
        employeeId: employee.id,
        attendanceDate: today,
        checkIn: new Date(),
        status: "PRESENT",
      },
    });
  }

  async checkOut(workspaceId: string, userId: string): Promise<any> {
    const employee = await this.prisma.employee.findFirst({
      where: { workspaceId, userId, deletedAt: null },
    });
    if (!employee) throw new NotFoundException("Employee record not found");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await this.prisma.attendance.findFirst({
      where: {
        workspaceId,
        employeeId: employee.id,
        attendanceDate: today,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!attendance || attendance.checkOut)
      throw new BadRequestException("Not checked in currently");

    const checkOutTime = new Date();
    const diffHours =
      (checkOutTime.getTime() - attendance.checkIn!.getTime()) /
      (1000 * 60 * 60);

    return this.prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOut: checkOutTime,
        workingHours: diffHours,
      },
    });
  }

  async getAttendanceLogs(workspaceId: string): Promise<any> {
    return this.prisma.attendance.findMany({
      where: { workspaceId },
      include: {
        employee: { select: { fullName: true, employeeNumber: true } },
      },
      orderBy: { checkIn: "desc" },
    });
  }

  async getMyAttendance(workspaceId: string, userId: string): Promise<any> {
    const employee = await this.prisma.employee.findFirst({
      where: { workspaceId, userId, deletedAt: null },
    });
    if (!employee) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sessions = await this.prisma.attendance.findMany({
      where: {
        workspaceId,
        employeeId: employee.id,
        attendanceDate: today,
      },
      orderBy: { checkIn: "asc" },
    });

    if (sessions.length === 0) {
      return {
        isCheckedIn: false,
        currentSessionStart: null,
        totalWorkingHours: 0,
        sessions: [],
      };
    }

    const lastSession = sessions[sessions.length - 1];
    const isCheckedIn = !lastSession.checkOut;
    const totalWorkingHours = sessions.reduce(
      (sum, s) => sum + (s.workingHours ? Number(s.workingHours) : 0),
      0,
    );

    return {
      isCheckedIn,
      currentSessionStart: isCheckedIn ? lastSession.checkIn : null,
      totalWorkingHours,
      sessions,
    };
  }

  // ====================
  // PAYROLL RUNS
  // ====================
  async getPayrollRuns(workspaceId: string): Promise<any> {
    return this.prisma.payrollRun.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
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
            employee: {
              select: {
                id: true,
                fullName: true,
                employeeNumber: true,
                baseSalary: true,
              },
            },
            earnings: true,
            deductions: true,
          },
        },
      },
    });
  }

  async createPayrollRun(
    workspaceId: string,
    data: any,
    userId: string,
  ): Promise<any> {
    const runNumber = `PR-${Date.now()}`;
    const periodStart = new Date(data.periodStart);
    const periodEnd = new Date(data.periodEnd);
    const paymentDate = new Date(data.paymentDate);

    return this.prisma.$transaction(async (tx) => {
      // 1. Create the run
      const payrollRun = await tx.payrollRun.create({
        data: {
          workspaceId,
          runNumber,
          name: data.name,
          periodStart,
          periodEnd,
          paymentDate,
          status: "DRAFT",
        },
      });

      // 2. Fetch all active employees
      const employees = await tx.employee.findMany({
        where: { workspaceId, status: "ACTIVE" },
      });

      const totalDaysInPeriod =
        Math.ceil(
          (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24),
        ) + 1;

      for (const emp of employees) {
        // 3. Get Salary Assignment
        const assignment = await this.getSalaryAssignment(workspaceId, emp.id);
        if (!assignment) continue; // Skip if no salary structure assigned

        // 4. Calculate Payment Days (Attendance based)
        const attendance = await tx.attendance.findMany({
          where: {
            employeeId: emp.id,
            attendanceDate: { gte: periodStart, lte: periodEnd },
            status: "PRESENT",
          },
          select: { attendanceDate: true },
        });

        // Count distinct dates (employee may have multiple sessions per day)
        const presentDays = new Set(
          attendance.map((a) => a.attendanceDate.toISOString().slice(0, 10)),
        ).size;
        const paymentDays = presentDays;

        // 5. Evaluate Components
        const baseSalary = Number(assignment.baseSalary);
        const context = {
          BS: baseSalary,
          base_salary: baseSalary,
          payment_days: paymentDays,
          total_days: totalDaysInPeriod,
        };

        const entry = await tx.payrollEntry.create({
          data: {
            workspaceId,
            payrollRunId: payrollRun.id,
            employeeId: emp.id,
            basicSalary: baseSalary,
            grossSalary: baseSalary,
            totalDeductions: 0,
            netSalary: baseSalary,
            status: "PENDING",
          },
        });

        let currentGross = baseSalary;
        let currentDeductions = 0;
        let taxableIncome = 0;

        // Calculate Earnings
        for (const sc of assignment.salaryStructure.components) {
          const component = sc.salaryComponent;
          let amount = 0;

          if (component.calculationType === "FLAT") {
            amount = Number(component.amount || 0);
          } else if (component.calculationType === "PERCENTAGE") {
            amount = baseSalary * (Number(component.amount || 0) / 100);
          } else if (
            component.calculationType === "FORMULA" &&
            component.formula
          ) {
            try {
              amount = evaluateFormula(component.formula, context);
            } catch (e) {
              throw new BadRequestException(
                `Formula evaluation failed for ${component.abbr}: ${e.message}`,
              );
            }
          }

          // Adjust for payment days if applicable
          if (component.dependsOnDays) {
            amount = (amount / totalDaysInPeriod) * paymentDays;
          }

          if (component.type === "EARNING") {
            await tx.payrollEarning.create({
              data: {
                payrollEntryId: entry.id,
                earningType: "REGULAR",
                name: component.name,
                amount,
              },
            });
            currentGross += amount;
            if (component.isTaxable) taxableIncome += amount;
            context[component.abbr] = amount;
          } else {
            await tx.payrollDeduction.create({
              data: {
                payrollEntryId: entry.id,
                deductionType: "REGULAR",
                name: component.name,
                amount,
              },
            });
            currentDeductions += amount;
            context[component.abbr] = amount;
          }
        }

        // 6. Calculate Income Tax
        const tax = await this.calculateIncomeTax(workspaceId, taxableIncome);
        if (tax > 0) {
          await tx.payrollDeduction.create({
            data: {
              payrollEntryId: entry.id,
              deductionType: "TAX",
              name: "Income Tax",
              amount: tax,
            },
          });
          currentDeductions += tax;
        }

        // 7. Update Entry Totals
        await tx.payrollEntry.update({
          where: { id: entry.id },
          data: {
            grossSalary: currentGross,
            totalDeductions: currentDeductions,
            netSalary: currentGross - currentDeductions,
          },
        });
      }

      // 8. Update Run Totals
      // Note: recalculateRunTotals uses this.prisma, so we should either make it transactional or do it here.
      // For simplicity, I'll inline the recalculation here using the tx client.
      const entries = await tx.payrollEntry.findMany({
        where: { payrollRunId: payrollRun.id },
      });

      let totalGross = 0;
      let totalDeductions = 0;
      let totalNet = 0;

      entries.forEach((e) => {
        totalGross += Number(e.grossSalary);
        totalDeductions += Number(e.totalDeductions);
        totalNet += Number(e.netSalary);
      });

      await tx.payrollRun.update({
        where: { id: payrollRun.id },
        data: {
          totalEmployees: entries.length,
          totalGross,
          totalDeductions,
          totalNet,
        },
      });

      return this.getPayrollRunById(workspaceId, payrollRun.id);
    });
  }

  async recalculateRunTotals(runId: string) {
    const run = await this.prisma.payrollRun.findUnique({
      where: { id: runId },
      include: { entries: true },
    });

    if (!run) return;

    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;

    run.entries.forEach((e) => {
      totalGross += Number(e.grossSalary);
      totalDeductions += Number(e.totalDeductions);
      totalNet += Number(e.netSalary);
    });

    await this.prisma.payrollRun.update({
      where: { id: run.id },
      data: {
        totalEmployees: run.entries.length,
        totalGross,
        totalDeductions,
        totalNet,
      },
    });
  }

  // ====================
  // PAYROLL ENTRIES (PAYSLIPS)
  // ====================
  async addEarning(
    workspaceId: string,
    entryId: string,
    data: any,
  ): Promise<any> {
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

  async addDeduction(
    workspaceId: string,
    entryId: string,
    data: any,
  ): Promise<any> {
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

  async recalculatePayslip(entryId: string) {
    const entry = await this.prisma.payrollEntry.findUnique({
      where: { id: entryId },
      include: { earnings: true, deductions: true, payrollRun: true },
    });

    if (!entry) return;

    let gross = Number(entry.basicSalary);
    let totalDeductions = 0;

    entry.earnings.forEach((e) => (gross += Number(e.amount)));
    entry.deductions.forEach((d) => (totalDeductions += Number(d.amount)));

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
      run.entries.forEach((e) => {
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

  // ====================
  // SALARY COMPONENTS
  // ====================
  async getSalaryComponents(workspaceId: string): Promise<any> {
    return this.prisma.salaryComponent.findMany({
      where: { workspaceId, isActive: true },
    });
  }

  async createSalaryComponent(workspaceId: string, data: any): Promise<any> {
    return this.prisma.salaryComponent.create({
      data: {
        workspaceId,
        name: data.name,
        abbr: data.abbr.toUpperCase(),
        type: data.type,
        componentType: data.componentType,
        calculationType: data.calculationType || "FLAT",
        amount: data.amount ? parseFloat(data.amount) : null,
        formula: data.formula,
        isTaxable: data.isTaxable ?? false,
        dependsOnDays: data.dependsOnDays ?? true,
      },
    });
  }

  // ====================
  // SALARY STRUCTURES
  // ====================
  async getSalaryStructures(workspaceId: string): Promise<any> {
    return this.prisma.salaryStructure.findMany({
      where: { workspaceId, isActive: true },
      include: {
        components: {
          include: { salaryComponent: true },
        },
      },
    });
  }

  async createSalaryStructure(workspaceId: string, data: any): Promise<any> {
    const structure = await this.prisma.salaryStructure.create({
      data: {
        workspaceId,
        name: data.name,
        isActive: true,
      },
    });

    if (data.componentIds && data.componentIds.length > 0) {
      const components = data.componentIds.map((id: string) => ({
        salaryStructureId: structure.id,
        componentId: id,
      }));

      await this.prisma.salaryStructureComponent.createMany({
        data: components,
      });
    }

    return this.getSalaryStructureById(workspaceId, structure.id);
  }

  async getSalaryStructureById(workspaceId: string, id: string): Promise<any> {
    return this.prisma.salaryStructure.findUnique({
      where: { id, workspaceId },
      include: {
        components: {
          include: { salaryComponent: true },
        },
      },
    });
  }

  async assignSalaryStructure(workspaceId: string, data: any): Promise<any> {
    return this.prisma.$transaction(async (tx) => {
      // Deactivate previous assignments for this employee
      await tx.salaryStructureAssignment.updateMany({
        where: { workspaceId, employeeId: data.employeeId, isActive: true },
        data: { isActive: false },
      });

      return tx.salaryStructureAssignment.create({
        data: {
          workspaceId,
          employeeId: data.employeeId,
          salaryStructureId: data.salaryStructureId,
          baseSalary: parseFloat(data.baseSalary),
          fromDate: new Date(data.fromDate),
          isActive: true,
        },
      });
    });
  }

  async getSalaryAssignment(
    workspaceId: string,
    employeeId: string,
  ): Promise<any> {
    return this.prisma.salaryStructureAssignment.findFirst({
      where: { workspaceId, employeeId, isActive: true },
      include: {
        salaryStructure: {
          include: {
            components: {
              include: { salaryComponent: true },
            },
          },
        },
      },
    });
  }

  // ====================
  // ONBOARDING
  // ====================
  async getOnboardingTemplates(workspaceId: string): Promise<any> {
    return this.prisma.onboardingTemplate.findMany({
      where: { workspaceId, isActive: true },
      include: { activities: true },
    });
  }

  async createOnboardingTemplate(workspaceId: string, data: any): Promise<any> {
    const template = await this.prisma.onboardingTemplate.create({
      data: {
        workspaceId,
        name: data.name,
        description: data.description,
      },
    });

    if (data.activities && data.activities.length > 0) {
      const activities = data.activities.map((act: any) => ({
        templateId: template.id,
        title: act.title,
        description: act.description,
        isMandatory: act.isMandatory ?? true,
        role: act.role,
      }));

      await this.prisma.onboardingActivity.createMany({
        data: activities,
      });
    }

    return this.prisma.onboardingTemplate.findUnique({
      where: { id: template.id },
      include: { activities: true },
    });
  }

  async initiateOnboarding(
    workspaceId: string,
    employeeId: string,
    templateId: string,
  ): Promise<any> {
    const template = await this.prisma.onboardingTemplate.findUnique({
      where: { id: templateId, workspaceId },
      include: { activities: true },
    });

    if (!template) throw new NotFoundException("Template not found");

    const tasks = template.activities.map((act) => ({
      workspaceId,
      employeeId,
      title: act.title,
      description: act.description,
      isMandatory: act.isMandatory,
      status: "PENDING",
    }));

    await this.prisma.employeeOnboardingTask.createMany({
      data: tasks,
    });

    await this.prisma.employee.update({
      where: { id: employeeId, workspaceId },
      data: { status: "ONBOARDING" },
    });

    return this.getOnboardingTasks(workspaceId, employeeId);
  }

  async getOnboardingTasks(
    workspaceId: string,
    employeeId: string,
  ): Promise<any> {
    return this.prisma.employeeOnboardingTask.findMany({
      where: { workspaceId, employeeId },
    });
  }

  async updateOnboardingTask(
    workspaceId: string,
    taskId: string,
    status: string,
    userId: string,
  ): Promise<any> {
    return this.prisma.employeeOnboardingTask.update({
      where: { id: taskId, workspaceId },
      data: {
        status,
        completedAt: status === "COMPLETED" ? new Date() : null,
        completedBy: status === "COMPLETED" ? userId : null,
      },
    });
  }

  // ====================
  // LEAVE POLICIES & ALLOCATION
  // ====================
  async getLeavePolicies(workspaceId: string): Promise<any> {
    return this.prisma.leavePolicy.findMany({
      where: { workspaceId, isActive: true },
      include: { leaveTypes: { include: { leaveType: true } } },
    });
  }

  async createLeavePolicy(workspaceId: string, data: any): Promise<any> {
    const policy = await this.prisma.leavePolicy.create({
      data: {
        workspaceId,
        name: data.name,
        description: data.description,
      },
    });

    if (data.leaveTypes && data.leaveTypes.length > 0) {
      const types = data.leaveTypes.map((t: any) => ({
        leavePolicyId: policy.id,
        leaveTypeId: t.leaveTypeId,
        annualAllocation: parseInt(t.annualAllocation),
      }));

      await this.prisma.leavePolicyType.createMany({
        data: types,
      });
    }

    return this.prisma.leavePolicy.findUnique({
      where: { id: policy.id },
      include: { leaveTypes: true },
    });
  }

  async updateLeavePolicy(
    workspaceId: string,
    id: string,
    data: any,
  ): Promise<any> {
    await this.prisma.leavePolicy.update({
      where: { id, workspaceId },
      data: {
        name: data.name,
        description: data.description,
      },
    });

    if (data.leaveTypes) {
      // Refresh leave types for the policy
      await this.prisma.leavePolicyType.deleteMany({
        where: { leavePolicyId: id },
      });

      const types = data.leaveTypes.map((t: any) => ({
        leavePolicyId: id,
        leaveTypeId: t.leaveTypeId,
        annualAllocation: parseInt(t.annualAllocation),
      }));

      await this.prisma.leavePolicyType.createMany({
        data: types,
      });
    }

    return this.prisma.leavePolicy.findUnique({
      where: { id, workspaceId },
      include: { leaveTypes: { include: { leaveType: true } } },
    });
  }

  async deleteLeavePolicy(workspaceId: string, id: string): Promise<any> {
    return this.prisma.leavePolicy.update({
      where: { id, workspaceId },
      data: { isActive: false },
    });
  }

  async allocateLeaves(workspaceId: string, data: any): Promise<any> {
    const policy = await this.prisma.leavePolicy.findUnique({
      where: { id: data.leavePolicyId, workspaceId },
      include: { leaveTypes: true },
    });

    if (!policy) throw new NotFoundException("Leave policy not found");

    const allocation = await this.prisma.leaveAllocation.create({
      data: {
        workspaceId,
        employeeId: data.employeeId,
        leavePolicyId: data.leavePolicyId,
        fromDate: new Date(data.fromDate),
        toDate: new Date(data.toDate),
        isActive: true,
      },
    });

    // Create ledger entries for each leave type in the policy
    for (const type of policy.leaveTypes) {
      await this.createLeaveLedgerEntry(workspaceId, {
        employeeId: data.employeeId,
        leaveTypeId: type.leaveTypeId,
        transactionType: "ALLOCATION",
        transactionId: allocation.id,
        leaves: type.annualAllocation,
        remarks: `Annual allocation via policy: ${policy.name}`,
      });
    }

    return allocation;
  }

  // ====================
  // TAXATION
  // ====================
  async getTaxSlabs(workspaceId: string): Promise<any> {
    return this.prisma.incomeTaxSlab.findMany({
      where: { workspaceId },
      include: { slabs: { orderBy: { fromAmount: "asc" } } },
    });
  }

  async createTaxSlab(workspaceId: string, data: any): Promise<any> {
    const slab = await this.prisma.incomeTaxSlab.create({
      data: {
        workspaceId,
        name: data.name,
        effectiveFrom: new Date(data.effectiveFrom),
        effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : null,
      },
    });

    if (data.slabs && data.slabs.length > 0) {
      const lines = data.slabs.map((s: any) => ({
        taxSlabId: slab.id,
        fromAmount: parseFloat(s.fromAmount),
        toAmount: s.toAmount ? parseFloat(s.toAmount) : null,
        taxRate: parseFloat(s.taxRate),
      }));

      await this.prisma.taxSlabLine.createMany({
        data: lines,
      });
    }

    return this.prisma.incomeTaxSlab.findUnique({
      where: { id: slab.id },
      include: { slabs: true },
    });
  }

  async getIndiaComplianceSettings(workspaceId: string) {
    const settings = await this.prisma.workspaceSettings.findUnique({
      where: { workspaceId },
    });

    const custom = (settings?.customSettings as any) || {};
    return (
      custom.indiaCompliance || {
        pfRate: 0.12,
        pfCap: 15000,
        esiEmployeeRate: 0.0075,
        esiEmployerRate: 0.0325,
        esiCap: 21000,
      }
    );
  }

  async updateIndiaComplianceSettings(
    workspaceId: string,
    data: any,
  ): Promise<any> {
    const existing = await this.prisma.workspaceSettings.findUnique({
      where: { workspaceId },
    });

    const custom = (existing?.customSettings as any) || {};
    custom.indiaCompliance = {
      ...custom.indiaCompliance,
      ...data,
    };

    return this.prisma.workspaceSettings.upsert({
      where: { workspaceId },
      update: { customSettings: custom },
      create: { workspaceId, customSettings: custom },
    });
  }

  async getPfEsiReport(
    workspaceId: string,
    month: number,
    year: number,
  ): Promise<any> {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    const entries = await this.prisma.payrollEntry.findMany({
      where: {
        workspaceId,
        payrollRun: {
          periodStart: { gte: startDate },
          periodEnd: { lte: endDate },
          status: "COMPLETED", // Only reported for completed payrolls
        },
      },
      include: {
        employee: {
          select: {
            fullName: true,
            employeeNumber: true,
            panNumber: true,
            pfAccount: true,
            esiNumber: true,
          },
        },
        earnings: true,
        deductions: true,
      },
    });

    const settings = await this.getIndiaComplianceSettings(workspaceId);

    return entries.map((entry) => {
      const basic = Number(entry.basicSalary);
      const gross = Number(entry.grossSalary);

      const employeePf =
        entry.deductions.find((d) => d.name.includes("PF"))?.amount || 0;
      const employeeEsi =
        entry.deductions.find((d) => d.name.includes("ESI"))?.amount || 0;

      // Calculate employer contributions based on settings
      const pfBasis = settings.pfCap ? Math.min(basic, settings.pfCap) : basic;
      const employerPf = pfBasis * settings.pfRate;

      let employerEsi = 0;
      if (gross <= settings.esiCap) {
        employerEsi = Math.ceil(gross * settings.esiEmployerRate);
      }

      return {
        employeeId: entry.employeeId,
        employeeName: entry.employee.fullName,
        employeeNumber: entry.employee.employeeNumber,
        panNumber: entry.employee.panNumber,
        pfAccount: entry.employee.pfAccount,
        esiNumber: entry.employee.esiNumber,
        grossEarnings: gross,
        pfBasis,
        employeePf,
        employerPf,
        employeeEsi,
        employerEsi,
        totalContribution:
          Number(employeePf) +
          Number(employerPf) +
          Number(employeeEsi) +
          employerEsi,
      };
    });
  }

  async getStatutoryStatus(workspaceId: string): Promise<any> {
    const employees = await this.prisma.employee.findMany({
      where: { workspaceId, status: "ACTIVE", deletedAt: null },
      select: {
        panNumber: true,
        pfAccount: true,
        id: true,
      },
    });

    const total = employees.length;
    if (total === 0) {
      return {
        panRecords: { pct: 0, filled: 0, total: 0 },
        pfNominations: { pct: 0, filled: 0, total: 0 },
        tdsDeclarations: { pct: 0, filled: 0, total: 0 },
      };
    }

    const filledPan = employees.filter(
      (e) => e.panNumber && e.panNumber.trim().length > 0,
    ).length;
    const filledPf = employees.filter(
      (e) => e.pfAccount && e.pfAccount.trim().length > 0,
    ).length;

    const tdsDeclarations = await this.prisma.taxExemptionDeclaration.count({
      where: {
        workspaceId,
        status: { in: ["SUBMITTED", "APPROVED"] },
      },
    });

    return {
      panRecords: {
        pct: Math.round((filledPan / total) * 100),
        filled: filledPan,
        total,
      },
      pfNominations: {
        pct: Math.round((filledPf / total) * 100),
        filled: filledPf,
        total,
      },
      tdsDeclarations: {
        pct: Math.round((Math.min(tdsDeclarations, total) / total) * 100),
        filled: tdsDeclarations,
        total,
      },
    };
  }

  // ====================
  // STATUTORY COMPLIANCE (INDIA)
  // ====================

  async calculateHraExemption(
    basicSalary: number,
    hraReceived: number,
    rentPaid: number,
    isMetro: boolean,
  ): Promise<number> {
    // 1. Actual HRA received
    const case1 = hraReceived;

    // 2. Rent paid minus 10% of basic salary
    const case2 = Math.max(0, rentPaid - 0.1 * basicSalary);

    // 3. 50% of basic salary for metro, 40% for non-metro
    const case3 = isMetro ? 0.5 * basicSalary : 0.4 * basicSalary;

    return Math.min(case1, case2, case3);
  }

  async calculatePf(
    basicSalary: number,
    limitTo15k: boolean = true,
  ): Promise<number> {
    const pfBasis = limitTo15k ? Math.min(basicSalary, 15000) : basicSalary;
    return pfBasis * 0.12; // Standard 12%
  }

  async calculateEsi(
    grossSalary: number,
  ): Promise<{ employee: number; employer: number }> {
    if (grossSalary > 21000) return { employee: 0, employer: 0 };

    return {
      employee: Math.ceil(grossSalary * 0.0075),
      employer: Math.ceil(grossSalary * 0.0325),
    };
  }

  async calculateProfessionalTax(
    grossSalary: number,
    state: string = "Maharashtra",
  ): Promise<number> {
    // Basic implementation for Maharashtra as example
    if (state === "Maharashtra") {
      if (grossSalary <= 7500) return 0;
      if (grossSalary <= 10000) return 175;
      return 200; // Simplified; Feb is usually 300
    }
    return 0;
  }

  async getTaxExemptionDeclaration(
    workspaceId: string,
    employeeId: string,
  ): Promise<any> {
    return this.prisma.taxExemptionDeclaration.findFirst({
      where: { workspaceId, employeeId },
      orderBy: { createdAt: "desc" },
    });
  }

  async submitTaxExemptionDeclaration(
    workspaceId: string,
    employeeId: string,
    data: any,
  ): Promise<any> {
    return this.prisma.taxExemptionDeclaration.create({
      data: {
        workspaceId,
        employeeId,
        taxSlabId: data.taxSlabId,
        monthlyHouseRent: data.monthlyHouseRent
          ? parseFloat(data.monthlyHouseRent)
          : null,
        rentedInMetroCity: data.rentedInMetroCity || false,
        rentedFromDate: data.rentedFromDate
          ? new Date(data.rentedFromDate)
          : null,
        rentedToDate: data.rentedToDate ? new Date(data.rentedToDate) : null,
        declarations: data.declarations || {},
        status: "SUBMITTED",
      },
    });
  }

  async calculateIncomeTax(
    workspaceId: string,
    taxableIncome: number,
  ): Promise<number> {
    const activeSlab = await this.prisma.incomeTaxSlab.findFirst({
      where: { workspaceId },
      include: { slabs: { orderBy: { fromAmount: "asc" } } },
      orderBy: { effectiveFrom: "desc" },
    });

    if (!activeSlab) return 0;

    let totalTax = 0;
    for (const line of activeSlab.slabs) {
      const from = Number(line.fromAmount);
      const to = line.toAmount ? Number(line.toAmount) : Infinity;
      const rate = Number(line.taxRate);

      if (taxableIncome > from) {
        const taxableInThisSlab = Math.min(taxableIncome, to) - from;
        totalTax += taxableInThisSlab * rate;
      }
    }

    // India Specific: Marginal Relief
    if (
      activeSlab.marginalReliefLimit &&
      taxableIncome > Number(activeSlab.marginalReliefLimit)
    ) {
      const excessIncome =
        taxableIncome - Number(activeSlab.marginalReliefLimit);
      if (totalTax > excessIncome) {
        // totalTax = excessIncome; // Simplified marginal relief
      }
    }

    return totalTax;
  }

  // ====================
  // EMPLOYEE MOVEMENT
  // ====================
  async getEmployeeMovements(
    workspaceId: string,
    employeeId?: string,
  ): Promise<any> {
    return this.prisma.employeeMovement.findMany({
      where: {
        workspaceId,
        ...(employeeId ? { employeeId } : {}),
      },
      include: {
        employee: true,
        fromDepartment: true,
        toDepartment: true,
        fromDesignation: true,
        toDesignation: true,
      },
      orderBy: { movementDate: "desc" },
    });
  }

  async createEmployeeMovement(workspaceId: string, data: any): Promise<any> {
    const employee = await this.prisma.employee.findUnique({
      where: { id: data.employeeId, workspaceId },
    });

    if (!employee) throw new NotFoundException("Employee not found");

    const movement = await this.prisma.employeeMovement.create({
      data: {
        workspaceId,
        employeeId: data.employeeId,
        type: data.type,
        movementDate: new Date(data.movementDate),
        fromDepartmentId: employee.departmentId,
        fromDesignationId: employee.designationId,
        fromSalary: employee.baseSalary,
        toDepartmentId: data.toDepartmentId,
        toDesignationId: data.toDesignationId,
        toSalary: data.toSalary ? parseFloat(data.toSalary) : null,
        reason: data.reason,
        status: "PROPOSED",
      },
    });

    return movement;
  }

  async approveEmployeeMovement(
    workspaceId: string,
    movementId: string,
  ): Promise<any> {
    const movement = await this.prisma.employeeMovement.findUnique({
      where: { id: movementId, workspaceId },
    });

    if (!movement) throw new NotFoundException("Movement not found");

    // Update employee record
    await this.prisma.employee.update({
      where: { id: movement.employeeId },
      data: {
        departmentId: movement.toDepartmentId || undefined,
        designationId: movement.toDesignationId || undefined,
        baseSalary: movement.toSalary || undefined,
      },
    });

    return this.prisma.employeeMovement.update({
      where: { id: movementId },
      data: { status: "APPROVED" },
    });
  }

  // ====================
  // RECRUITMENT (APPLICANT TRACKING)
  // ====================
  async getJobApplicants(workspaceId: string): Promise<any> {
    return this.prisma.jobApplicant.findMany({
      where: { workspaceId },
      include: { interviews: true },
      orderBy: { appliedDate: "desc" },
    });
  }

  async createJobApplicant(workspaceId: string, data: any): Promise<any> {
    return this.prisma.jobApplicant.create({
      data: {
        workspaceId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        resumeUrl: data.resumeUrl,
        coverLetter: data.coverLetter,
        status: "APPLIED",
      },
    });
  }

  async scheduleInterview(workspaceId: string, data: any): Promise<any> {
    return this.prisma.interview.create({
      data: {
        workspaceId,
        applicantId: data.applicantId,
        interviewDate: new Date(data.interviewDate),
        roundName: data.roundName,
        interviewerId: data.interviewerId,
        status: "SCHEDULED",
      },
    });
  }

  async updateInterviewFeedback(
    workspaceId: string,
    interviewId: string,
    data: any,
  ): Promise<any> {
    return this.prisma.interview.update({
      where: { id: interviewId, workspaceId },
      data: {
        feedback: data.feedback,
        score: data.score ? parseInt(data.score) : null,
        status: "COMPLETED",
      },
    });
  }

  // ====================
  // SHIFT MANAGEMENT
  // ====================
  async getShiftTypes(workspaceId: string): Promise<any> {
    return this.prisma.shiftType.findMany({
      where: { workspaceId },
    });
  }

  async createShiftType(workspaceId: string, data: any): Promise<any> {
    return this.prisma.shiftType.create({
      data: {
        workspaceId,
        name: data.name,
        startTime: data.startTime,
        endTime: data.endTime,
        isDefault: data.isDefault || false,
      },
    });
  }

  async assignShift(workspaceId: string, data: any): Promise<any> {
    return this.prisma.shiftAssignment.create({
      data: {
        workspaceId,
        employeeId: data.employeeId,
        shiftTypeId: data.shiftTypeId,
        fromDate: new Date(data.fromDate),
        toDate: data.toDate ? new Date(data.toDate) : null,
      },
    });
  }

  async getAppraisalCycles(workspaceId: string): Promise<any> {
    return this.prisma.appraisalCycle.findMany({
      where: { workspaceId },
      orderBy: { startDate: "desc" },
    });
  }

  async createAppraisalCycle(workspaceId: string, data: any): Promise<any> {
    return this.prisma.appraisalCycle.create({
      data: {
        workspaceId,
        name: data.name,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        isActive: data.isActive ?? true,
      },
    });
  }

  // ====================
  // PERFORMANCE: GOALS
  // ====================
  async getEmployeeGoals(
    workspaceId: string,
    employeeId?: string,
    appraisalCycleId?: string,
  ): Promise<any> {
    return this.prisma.employeeGoal.findMany({
      where: {
        workspaceId,
        ...(employeeId && { employeeId }),
        ...(appraisalCycleId && { appraisalCycleId }),
      },
      include: { employee: true, appraisalCycle: true },
    });
  }

  async createEmployeeGoal(workspaceId: string, data: any): Promise<any> {
    return this.prisma.employeeGoal.create({
      data: {
        workspaceId,
        employeeId: data.employeeId,
        appraisalCycleId: data.appraisalCycleId,
        title: data.title,
        description: data.description,
        targetValue: data.targetValue,
        unit: data.targetValue ? "percentage" : null,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        weight: data.weight ? parseFloat(data.weight) : 0,
        status: "PENDING",
      },
    });
  }

  async updateGoalProgress(
    workspaceId: string,
    goalId: string,
    completionPercentage: number,
  ): Promise<any> {
    return this.prisma.employeeGoal.update({
      where: { id: goalId, workspaceId },
      data: {
        completionPercentage,
        status: completionPercentage === 100 ? "COMPLETED" : "IN_PROGRESS",
      },
    });
  }

  // ====================
  // PERFORMANCE: APPRAISALS
  // ====================
  async getAppraisals(
    workspaceId: string,
    employeeId?: string,
    appraisalCycleId?: string,
  ): Promise<any> {
    return this.prisma.appraisal.findMany({
      where: {
        workspaceId,
        ...(employeeId && { employeeId }),
        ...(appraisalCycleId && { appraisalCycleId }),
      },
      include: { employee: true, appraisalCycle: true },
    });
  }

  async createAppraisal(workspaceId: string, data: any): Promise<any> {
    return this.prisma.appraisal.create({
      data: {
        workspaceId,
        employeeId: data.employeeId,
        appraisalCycleId: data.appraisalCycleId,
        selfScore: data.selfScore,
        managerScore: data.managerScore,
        finalScore: data.finalScore,
        employeeComments: data.employeeComments,
        managerComments: data.managerComments,
        status: data.status || "DRAFT",
      },
    });
  }

  async updateAppraisal(
    workspaceId: string,
    id: string,
    data: any,
  ): Promise<any> {
    return this.prisma.appraisal.update({
      where: { id, workspaceId },
      data: {
        managerScore: data.managerScore,
        finalScore: data.finalScore,
        managerComments: data.managerComments,
        status: data.status,
        finalizedAt: data.status === "COMPLETED" ? new Date() : undefined,
        finalizedBy: data.status === "COMPLETED" ? data.userId : undefined,
      },
    });
  }

  // ====================
  // SEPARATION
  // ====================
  async getSeparations(workspaceId: string): Promise<any> {
    return this.prisma.employeeSeparation.findMany({
      where: { workspaceId },
      include: { employee: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async createSeparation(workspaceId: string, data: any): Promise<any> {
    return this.prisma.employeeSeparation.create({
      data: {
        workspaceId,
        employeeId: data.employeeId,
        separationType: data.separationType,
        resignationDate: data.resignationDate
          ? new Date(data.resignationDate)
          : null,
        lastWorkingDate: new Date(data.lastWorkingDate),
        reason: data.reason,
        status: "PENDING_APPROVAL",
      },
    });
  }

  async approveSeparation(workspaceId: string, id: string): Promise<any> {
    const separation = await this.prisma.employeeSeparation.findUnique({
      where: { id, workspaceId },
    });
    if (!separation) throw new NotFoundException("Separation record not found");

    await this.prisma.employee.update({
      where: { id: separation.employeeId },
      data: {
        status:
          separation.separationType === "RESIGNATION"
            ? "RESIGNED"
            : "TERMINATED",
        dateOfLeaving: separation.lastWorkingDate,
      },
    });

    return this.prisma.employeeSeparation.update({
      where: { id },
      data: { status: "APPROVED" },
    });
  }

  // ====================
  // OFFBOARDING
  // ====================
  async getOffboardingTemplates(workspaceId: string): Promise<any> {
    return this.prisma.offboardingTemplate.findMany({
      where: { workspaceId, isActive: true },
      include: { activities: true },
    });
  }

  async createOffboardingTemplate(
    workspaceId: string,
    data: any,
  ): Promise<any> {
    const template = await this.prisma.offboardingTemplate.create({
      data: {
        workspaceId,
        name: data.name,
        description: data.description,
      },
    });

    if (data.activities && data.activities.length > 0) {
      await this.prisma.offboardingActivity.createMany({
        data: data.activities.map((act: any) => ({
          templateId: template.id,
          title: act.title,
          description: act.description,
          isMandatory: act.isMandatory ?? true,
          role: act.role,
        })),
      });
    }

    return template;
  }

  async initiateOffboarding(
    workspaceId: string,
    employeeId: string,
    templateId: string,
  ): Promise<any> {
    const template = await this.prisma.offboardingTemplate.findUnique({
      where: { id: templateId },
      include: { activities: true },
    });
    if (!template) throw new NotFoundException("Template not found");

    await this.prisma.employeeOffboardingTask.createMany({
      data: template.activities.map((act) => ({
        workspaceId,
        employeeId,
        title: act.title,
        description: act.description,
        isMandatory: act.isMandatory,
        status: "PENDING",
      })),
    });

    return this.getOffboardingTasks(workspaceId, employeeId);
  }

  async getOffboardingTasks(
    workspaceId: string,
    employeeId: string,
  ): Promise<any> {
    return this.prisma.employeeOffboardingTask.findMany({
      where: { workspaceId, employeeId },
    });
  }

  async updateOffboardingTask(
    workspaceId: string,
    taskId: string,
    status: string,
    userId: string,
  ): Promise<any> {
    return this.prisma.employeeOffboardingTask.update({
      where: { id: taskId, workspaceId },
      data: {
        status,
        completedAt: status === "COMPLETED" ? new Date() : null,
        completedBy: status === "COMPLETED" ? userId : null,
      },
    });
  }

  // ====================
  // TAX DECLARATIONS
  // ====================
  async getAllTaxDeclarations(workspaceId: string): Promise<any> {
    return this.prisma.taxExemptionDeclaration.findMany({
      where: { workspaceId },
      include: {
        employee: { select: { fullName: true, employeeNumber: true } },
        taxSlab: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateTaxDeclarationStatus(
    workspaceId: string,
    id: string,
    status: string,
  ): Promise<any> {
    return this.prisma.taxExemptionDeclaration.update({
      where: { id, workspaceId },
      data: { status },
    });
  }

  // ====================
  // ADMIN: HELPDESK
  // ====================
  async getHelpdeskTickets(
    workspaceId: string,
    type?: string,
    categoryGroup?: "HR" | "IT",
  ): Promise<any> {
    const hrTypes = ["HR_GRIEVANCE", "PAYROLL"];
    const itTypes = ["IT_SUPPORT", "FACILITIES", "OTHER"];

    let typeFilter: any = undefined;
    if (type) {
      typeFilter = type;
    } else if (categoryGroup === "HR") {
      typeFilter = { in: hrTypes };
    } else if (categoryGroup === "IT") {
      typeFilter = { in: itTypes };
    }

    return this.prisma.helpdeskTicket.findMany({
      where: {
        workspaceId,
        ...(typeFilter && { type: typeFilter }),
      },
      include: {
        raisedBy: { select: { fullName: true, employeeNumber: true } },
        assignedTo: { select: { fullName: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateTicket(
    workspaceId: string,
    ticketId: string,
    data: any,
  ): Promise<any> {
    const updateData: any = {};
    if (data.status) updateData.status = data.status;
    if (data.priority) updateData.priority = data.priority;
    if (data.assignedToId) updateData.assignedToId = data.assignedToId;
    if (data.resolutionDetails) {
      updateData.resolutionDetails = data.resolutionDetails;
      updateData.resolvedAt = new Date();
    }

    return this.prisma.helpdeskTicket.update({
      where: { id: ticketId, workspaceId },
      data: updateData,
    });
  }

  async addAdminTicketComment(
    workspaceId: string,
    userId: string,
    ticketId: string,
    message: string,
  ): Promise<any> {
    return this.prisma.ticketComment.create({
      data: {
        ticketId,
        authorId: userId,
        message,
      },
    });
  }

  // ====================
  // COMPANY EVENTS
  // ====================
  async getCompanyEvents(workspaceId: string): Promise<any> {
    return this.prisma.companyEvent.findMany({
      where: { workspaceId },
      include: {
        author: { select: { name: true } },
      },
      orderBy: { startDate: "asc" },
    });
  }

  async createCompanyEvent(
    workspaceId: string,
    userId: string,
    data: any,
  ): Promise<any> {
    const event = await this.prisma.companyEvent.create({
      data: {
        workspaceId,
        title: data.title,
        description: data.description,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        location: data.location,
        isPublic: data.isPublic ?? true,
        createdBy: userId,
      },
    });

    return event;
  }
}
