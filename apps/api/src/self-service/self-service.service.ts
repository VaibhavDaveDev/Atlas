import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../common/services/prisma.service";

@Injectable()
export class SelfServiceService {
  constructor(private readonly prisma: PrismaService) {}

  private async getEmployee(workspaceId: string, userId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { workspaceId, userId, deletedAt: null },
      include: {
        department: { select: { name: true } },
        designation: { select: { title: true } },
        reportingTo: { select: { fullName: true } },
        shiftAssignments: {
          include: { shiftType: true },
        },
      },
    });
    if (!employee) {
      throw new NotFoundException("Employee record not found for this user");
    }
    return employee;
  }

  async checkIn(workspaceId: string, userId: string): Promise<any> {
    const employee = await this.getEmployee(workspaceId, userId);

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

    if (existing && !existing.checkOut) {
      throw new BadRequestException("Already checked in today");
    }

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
    const employee = await this.getEmployee(workspaceId, userId);

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

    if (!attendance || attendance.checkOut) {
      throw new BadRequestException("Not checked in currently");
    }

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

  async getMyAttendance(workspaceId: string, userId: string): Promise<any> {
    const employee = await this.prisma.employee.findFirst({
      where: { workspaceId, userId, deletedAt: null },
      include: {
        shiftAssignments: {
          include: { shiftType: true },
        },
      },
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
        activeShift: employee.shiftAssignments?.[0] || null,
      };
    }

    const lastSession = sessions[sessions.length - 1];
    const totalHours = sessions.reduce(
      (sum, s) => sum + Number(s.workingHours || 0),
      0,
    );

    return {
      isCheckedIn: !lastSession.checkOut,
      currentSessionStart: lastSession.checkIn,
      totalWorkingHours: totalHours,
      sessions,
      activeShift: employee.shiftAssignments?.[0] || null,
    };
  }

  async getMyAttendanceHistory(
    workspaceId: string,
    userId: string,
    month?: number,
    year?: number,
  ): Promise<any> {
    const employee = await this.getEmployee(workspaceId, userId);

    const whereClause: any = {
      workspaceId,
      employeeId: employee.id,
    };

    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      whereClause.attendanceDate = {
        gte: startDate,
        lte: endDate,
      };
    }

    return this.prisma.attendance.findMany({
      where: whereClause,
      orderBy: { attendanceDate: "desc" },
      take: month && year ? undefined : 50, // Limit to recent 50 records if no month/year filter
    });
  }

  async getMyProfile(workspaceId: string, userId: string): Promise<any> {
    return this.getEmployee(workspaceId, userId);
  }

  async updateMyProfile(
    workspaceId: string,
    userId: string,
    data: any,
  ): Promise<any> {
    const employee = await this.getEmployee(workspaceId, userId);

    // Filter editable fields
    const updateData: any = {};
    if (data.mobileNo !== undefined) updateData.mobileNo = data.mobileNo;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.emergencyContact !== undefined)
      updateData.emergencyContact = data.emergencyContact;
    if (data.bankDetails !== undefined)
      updateData.bankDetails = data.bankDetails;
    if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;
    if (data.panNumber !== undefined) updateData.panNumber = data.panNumber;
    if (data.pfAccount !== undefined) updateData.pfAccount = data.pfAccount;
    if (data.esiNumber !== undefined) updateData.esiNumber = data.esiNumber;
    if (data.aadhaarNumber !== undefined)
      updateData.aadhaarNumber = data.aadhaarNumber;
    if (data.gender !== undefined) updateData.gender = data.gender;
    if (data.maritalStatus !== undefined)
      updateData.maritalStatus = data.maritalStatus;
    if (data.dateOfBirth !== undefined)
      updateData.dateOfBirth = data.dateOfBirth
        ? new Date(data.dateOfBirth)
        : null;

    return this.prisma.employee.update({
      where: { id: employee.id },
      data: updateData,
    });
  }

  async getMyLeaves(workspaceId: string, userId: string): Promise<any> {
    const employee = await this.getEmployee(workspaceId, userId);

    return this.prisma.leaveApplication.findMany({
      where: { workspaceId, employeeId: employee.id },
      include: { leaveType: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async getMyLeaveBalances(workspaceId: string, userId: string): Promise<any> {
    const employee = await this.getEmployee(workspaceId, userId);

    const ledgerEntries = await this.prisma.leaveLedgerEntry.findMany({
      where: { workspaceId, employeeId: employee.id },
      include: { leaveType: true },
    });

    const balances = ledgerEntries.reduce((acc: any, entry) => {
      const typeId = entry.leaveTypeId;
      if (!acc[typeId]) {
        acc[typeId] = {
          leaveType: entry.leaveType.name,
          balance: 0,
        };
      }
      acc[typeId].balance += Number(entry.leaves);
      return acc;
    }, {});

    return Object.values(balances);
  }

  async applyLeave(
    workspaceId: string,
    userId: string,
    data: any,
  ): Promise<any> {
    const employee = await this.getEmployee(workspaceId, userId);

    // Validate dates
    const fromDate = new Date(data.fromDate);
    const toDate = new Date(data.toDate);
    if (fromDate > toDate) {
      throw new BadRequestException("From date cannot be after to date");
    }

    // Calculate total days (simplified)
    const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Check if leave type exists
    const leaveType = await this.prisma.leaveType.findUnique({
      where: { id: data.leaveTypeId, workspaceId },
    });
    if (!leaveType) {
      throw new NotFoundException("Leave type not found");
    }

    return this.prisma.leaveApplication.create({
      data: {
        workspaceId,
        employeeId: employee.id,
        leaveTypeId: data.leaveTypeId,
        fromDate,
        toDate,
        totalDays,
        reason: data.reason,
        status: "PENDING",
      },
    });
  }

  async cancelLeave(
    workspaceId: string,
    userId: string,
    leaveId: string,
  ): Promise<any> {
    const employee = await this.getEmployee(workspaceId, userId);
    const leave = await this.prisma.leaveApplication.findFirst({
      where: { id: leaveId, workspaceId, employeeId: employee.id },
    });

    if (!leave) {
      throw new NotFoundException("Leave application not found");
    }
    if (leave.status !== "PENDING") {
      throw new BadRequestException("Only pending leaves can be cancelled");
    }

    return this.prisma.leaveApplication.update({
      where: { id: leaveId },
      data: { status: "CANCELLED" },
    });
  }

  async getLeaveTypes(workspaceId: string): Promise<any> {
    return this.prisma.leaveType.findMany({
      where: { workspaceId, isActive: true },
    });
  }

  async getMyPayslips(workspaceId: string, userId: string): Promise<any> {
    const employee = await this.getEmployee(workspaceId, userId);

    return this.prisma.payrollEntry.findMany({
      where: { workspaceId, employeeId: employee.id, status: "PAID" },
      include: { payrollRun: true },
      orderBy: { payrollRun: { periodStart: "desc" } },
    });
  }

  async getCalendar(
    workspaceId: string,
    userId: string,
    month: number,
    year: number,
  ): Promise<any> {
    const employee = await this.getEmployee(workspaceId, userId);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const [holidays, events, leaves, settings] = await Promise.all([
      this.prisma.holiday.findMany({
        where: {
          workspaceId,
          date: { gte: startDate, lte: endDate },
        },
      }),
      this.prisma.companyEvent.findMany({
        where: {
          workspaceId,
          OR: [
            { startDate: { gte: startDate, lte: endDate } },
            { endDate: { gte: startDate, lte: endDate } },
          ],
        },
      }),
      this.prisma.leaveApplication.findMany({
        where: {
          workspaceId,
          employeeId: employee.id,
          status: "APPROVED",
          OR: [
            { fromDate: { gte: startDate, lte: endDate } },
            { toDate: { gte: startDate, lte: endDate } },
          ],
        },
      }),
      this.prisma.workspaceSettings.findUnique({
        where: { workspaceId },
      }),
    ]);

    // Add weekend holidays if configured
    const weekendHolidays = (settings?.weekendHolidays as number[]) || []; // Default empty
    const allHolidays = [...holidays];

    if (weekendHolidays.length > 0) {
      // Loop through all days in the month range
      const current = new Date(startDate);
      while (current <= endDate) {
        const dayOfWeek = current.getDay();
        if (weekendHolidays.includes(dayOfWeek)) {
          // Use local date string for consistent matching
          const year = current.getFullYear();
          const month = String(current.getMonth() + 1).padStart(2, "0");
          const day = String(current.getDate()).padStart(2, "0");
          const dateStr = `${year}-${month}-${day}`;

          const alreadyExists = holidays.some((h) => {
            const hDate = new Date(h.date);
            const hYear = hDate.getFullYear();
            const hMonth = String(hDate.getMonth() + 1).padStart(2, "0");
            const hDay = String(hDate.getDate()).padStart(2, "0");
            return `${hYear}-${hMonth}-${hDay}` === dateStr;
          });

          if (!alreadyExists) {
            allHolidays.push({
              id: `weekend-${dateStr}`,
              workspaceId,
              name:
                dayOfWeek === 0
                  ? "Sunday"
                  : dayOfWeek === 6
                    ? "Saturday"
                    : "Weekend",
              date: new Date(current),
              description: "Weekly Holiday",
              isOptional: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
        }
        current.setDate(current.getDate() + 1);
      }
    }

    return { holidays: allHolidays, events, leaves };
  }

  async getCurrentAppraisal(workspaceId: string, userId: string): Promise<any> {
    const employee = await this.getEmployee(workspaceId, userId);

    const activeCycle = await this.prisma.appraisalCycle.findFirst({
      where: { workspaceId, isActive: true },
    });

    if (!activeCycle) {
      return null;
    }

    const [appraisal, goals] = await Promise.all([
      this.prisma.appraisal.findFirst({
        where: {
          workspaceId,
          employeeId: employee.id,
          appraisalCycleId: activeCycle.id,
        },
      }),
      this.prisma.employeeGoal.findMany({
        where: {
          workspaceId,
          employeeId: employee.id,
          appraisalCycleId: activeCycle.id,
        },
      }),
    ]);

    return {
      cycle: activeCycle,
      appraisal,
      goals,
    };
  }

  async submitSelfAppraisal(
    workspaceId: string,
    userId: string,
    appraisalId: string,
    data: any,
  ): Promise<any> {
    const employee = await this.getEmployee(workspaceId, userId);

    const appraisal = await this.prisma.appraisal.findFirst({
      where: { id: appraisalId, workspaceId, employeeId: employee.id },
    });

    if (!appraisal) {
      throw new NotFoundException("Appraisal record not found");
    }

    if (appraisal.status !== "DRAFT") {
      throw new BadRequestException("Appraisal already submitted");
    }

    // Update goals with self-ratings and remarks
    if (data.goals && Array.isArray(data.goals)) {
      for (const goalUpdate of data.goals) {
        await this.prisma.employeeGoal.update({
          where: { id: goalUpdate.id, employeeId: employee.id },
          data: {
            selfRating: goalUpdate.selfRating,
            employeeRemarks: goalUpdate.employeeRemarks,
          },
        });
      }
    }

    // Update main appraisal record
    return this.prisma.appraisal.update({
      where: { id: appraisalId },
      data: {
        selfScore: data.selfScore,
        employeeComments: data.employeeComments,
        status: "SELF_SUBMITTED",
      },
    });
  }

  async getMyTaxDeclarations(
    workspaceId: string,
    userId: string,
  ): Promise<any> {
    const employee = await this.getEmployee(workspaceId, userId);

    return this.prisma.taxExemptionDeclaration.findMany({
      where: { workspaceId, employeeId: employee.id },
      include: { taxSlab: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async submitTaxDeclaration(
    workspaceId: string,
    userId: string,
    data: any,
  ): Promise<any> {
    const employee = await this.getEmployee(workspaceId, userId);

    const activeSlab = await this.prisma.incomeTaxSlab.findFirst({
      where: { workspaceId, id: data.taxSlabId },
    });
    if (!activeSlab) {
      throw new NotFoundException("Income tax slab not found");
    }

    return this.prisma.taxExemptionDeclaration.create({
      data: {
        workspaceId,
        employeeId: employee.id,
        taxSlabId: data.taxSlabId,
        monthlyHouseRent: data.monthlyHouseRent,
        rentedInMetroCity: data.rentedInMetroCity,
        rentedFromDate: data.rentedFromDate
          ? new Date(data.rentedFromDate)
          : null,
        rentedToDate: data.rentedToDate ? new Date(data.rentedToDate) : null,
        declarations: data.declarations,
        status: "SUBMITTED",
      },
    });
  }

  async cancelTaxDeclaration(
    workspaceId: string,
    userId: string,
    declarationId: string,
  ): Promise<any> {
    const employee = await this.getEmployee(workspaceId, userId);

    const declaration = await this.prisma.taxExemptionDeclaration.findFirst({
      where: { id: declarationId, workspaceId, employeeId: employee.id },
    });

    if (!declaration) {
      throw new NotFoundException("Declaration not found");
    }

    if (declaration.status !== "SUBMITTED" && declaration.status !== "DRAFT") {
      throw new BadRequestException(
        "Only pending or draft declarations can be cancelled",
      );
    }

    return this.prisma.taxExemptionDeclaration.update({
      where: { id: declarationId },
      data: { status: "CANCELLED" },
    });
  }

  async getMyTickets(workspaceId: string, userId: string): Promise<any> {
    const employee = await this.getEmployee(workspaceId, userId);

    return this.prisma.helpdeskTicket.findMany({
      where: { workspaceId, raisedById: employee.id },
      orderBy: { createdAt: "desc" },
    });
  }

  async createTicket(
    workspaceId: string,
    userId: string,
    data: any,
  ): Promise<any> {
    const employee = await this.getEmployee(workspaceId, userId);

    // Generate a simple ticket number (e.g., TKT-12345)
    const ticketCount = await this.prisma.helpdeskTicket.count({
      where: { workspaceId },
    });
    const ticketNumber = `TKT-${1000 + ticketCount + 1}`;

    return this.prisma.helpdeskTicket.create({
      data: {
        workspaceId,
        ticketNumber,
        subject: data.subject,
        description: data.description,
        type: data.type,
        priority: data.priority,
        raisedById: employee.id,
        status: "OPEN",
      },
    });
  }

  async getTicketDetails(
    workspaceId: string,
    userId: string,
    ticketId: string,
  ): Promise<any> {
    const employee = await this.getEmployee(workspaceId, userId);

    const ticket = await this.prisma.helpdeskTicket.findFirst({
      where: { id: ticketId, workspaceId, raisedById: employee.id },
      include: {
        comments: {
          include: { author: { select: { name: true, image: true } } },
          orderBy: { createdAt: "asc" },
        },
        assignedTo: { select: { fullName: true, avatarUrl: true } },
      },
    });

    if (!ticket) {
      throw new NotFoundException("Ticket not found");
    }

    return ticket;
  }

  async addTicketComment(
    workspaceId: string,
    userId: string,
    ticketId: string,
    message: string,
  ): Promise<any> {
    const employee = await this.getEmployee(workspaceId, userId);

    const ticket = await this.prisma.helpdeskTicket.findFirst({
      where: { id: ticketId, workspaceId, raisedById: employee.id },
    });

    if (!ticket) {
      throw new NotFoundException("Ticket not found");
    }

    return this.prisma.ticketComment.create({
      data: {
        ticketId,
        authorId: userId,
        message,
      },
    });
  }

  async cancelTicket(
    workspaceId: string,
    userId: string,
    ticketId: string,
  ): Promise<any> {
    const employee = await this.getEmployee(workspaceId, userId);

    const ticket = await this.prisma.helpdeskTicket.findFirst({
      where: { id: ticketId, workspaceId, raisedById: employee.id },
    });

    if (!ticket) {
      throw new NotFoundException("Ticket not found");
    }

    if (ticket.status !== "OPEN") {
      throw new BadRequestException("Only open tickets can be cancelled");
    }

    return this.prisma.helpdeskTicket.update({
      where: { id: ticketId },
      data: { status: "CANCELLED" },
    });
  }
}
