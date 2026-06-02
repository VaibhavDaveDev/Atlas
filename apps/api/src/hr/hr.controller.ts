import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  UseGuards,
  Req,
  Param,
  Query,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { HrService } from "./hr.service";
import { AuthGuard } from "../common/guards/auth.guard";
import { WorkspaceGuard } from "../auth/guards/workspace.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { PermissionGuard } from "../auth/guards/permission.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { RequirePermission } from "../auth/decorators/require-permission.decorator";
import type { Request } from "express";

@ApiTags("hr")
@Controller("hr")
@UseGuards(AuthGuard, WorkspaceGuard, RolesGuard, PermissionGuard)
@ApiBearerAuth("JWT-auth")
export class HrController {
  constructor(private readonly hrService: HrService) {}

  // ====================
  // DEPARTMENTS
  // ====================
  @Get("departments")
  @RequirePermission({ resource: "departments", action: "read", scope: "all" })
  async getDepartments(@Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.getDepartments(user.workspaceId);
  }

  @Post("departments")
  @RequirePermission({
    resource: "departments",
    action: "create",
    scope: "all",
  })
  async createDepartment(@Body() body: any, @Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.createDepartment(user.workspaceId, body);
  }

  @Get("departments/:id")
  @RequirePermission({ resource: "departments", action: "read", scope: "all" })
  async getDepartmentById(@Param("id") id: string, @Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.getDepartmentById(user.workspaceId, id);
  }

  @Put("departments/:id")
  @RequirePermission({
    resource: "departments",
    action: "update",
    scope: "all",
  })
  async updateDepartment(
    @Param("id") id: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    return await this.hrService.updateDepartment(user.workspaceId, id, body);
  }

  @Delete("departments/:id")
  @RequirePermission({
    resource: "departments",
    action: "delete",
    scope: "all",
  })
  async deleteDepartment(@Param("id") id: string, @Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.deleteDepartment(user.workspaceId, id);
  }

  // ====================
  // DESIGNATIONS
  // ====================
  @Get("designations")
  @RequirePermission({ resource: "designations", action: "read", scope: "all" })
  async getDesignations(@Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.getDesignations(user.workspaceId);
  }

  @Post("designations")
  @RequirePermission({
    resource: "designations",
    action: "create",
    scope: "all",
  })
  async createDesignation(@Body() body: any, @Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.createDesignation(user.workspaceId, body);
  }

  // ====================
  // EMPLOYEES
  // ====================
  @Get("employees")
  @RequirePermission({ resource: "employees", action: "read", scope: "all" })
  async getEmployees(@Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.getEmployees(user.workspaceId);
  }

  @Post("employees")
  @RequirePermission({ resource: "employees", action: "create", scope: "all" })
  async createEmployee(@Body() body: any, @Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.createEmployee(user.workspaceId, body);
  }

  @Get("employees/:id")
  @RequirePermission({ resource: "employees", action: "read", scope: "all" })
  async getEmployeeById(@Param("id") id: string, @Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.getEmployeeById(user.workspaceId, id);
  }

  @Put("employees/:id")
  @RequirePermission({ resource: "employees", action: "update", scope: "all" })
  async updateEmployee(
    @Param("id") id: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    return await this.hrService.updateEmployee(user.workspaceId, id, body);
  }

  @Delete("employees/:id")
  @RequirePermission({ resource: "employees", action: "delete", scope: "all" })
  async deleteEmployee(@Param("id") id: string, @Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.deleteEmployee(user.workspaceId, id);
  }

  // ====================
  // LEAVES
  // ====================
  @Get("leaves/types")
  @RequirePermission({ resource: "leaves", action: "read", scope: "all" })
  async getLeaveTypes(@Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.getLeaveTypes(user.workspaceId);
  }

  @Post("leaves/types")
  @RequirePermission({ resource: "leaves", action: "manage", scope: "all" })
  async createLeaveType(@Body() body: any, @Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.createLeaveType(user.workspaceId, body);
  }

  @Put("leaves/types/:id")
  @RequirePermission({ resource: "leaves", action: "manage", scope: "all" })
  async updateLeaveType(
    @Param("id") id: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    return await this.hrService.updateLeaveType(user.workspaceId, id, body);
  }

  @Delete("leaves/types/:id")
  @RequirePermission({ resource: "leaves", action: "manage", scope: "all" })
  async deleteLeaveType(@Param("id") id: string, @Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.deleteLeaveType(user.workspaceId, id);
  }

  @Get("leaves/applications")
  @RequirePermission({ resource: "leaves", action: "read", scope: "all" })
  async getLeaveApplications(@Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.getLeaveApplications(user.workspaceId);
  }

  @Post("leaves/applications")
  @RequirePermission({ resource: "leaves", action: "manage", scope: "all" })
  async createLeaveApplication(@Body() body: any, @Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.createLeaveApplication(user.workspaceId, body);
  }

  @Post("leaves/applications/:id/status")
  @RequirePermission({ resource: "leaves", action: "manage", scope: "all" })
  async updateLeaveStatus(
    @Param("id") id: string,
    @Body() body: { status: string; remarks?: string },
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    return await this.hrService.updateLeaveStatus(
      user.workspaceId,
      id,
      body.status,
      user.userId,
      body.remarks,
    );
  }

  @Get("leaves/balances/:employeeId")
  @RequirePermission({ resource: "leaves", action: "read", scope: "all" })
  async getLeaveBalances(
    @Param("employeeId") employeeId: string,
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    return await this.hrService.getAllLeaveBalances(
      user.workspaceId,
      employeeId,
    );
  }

  @Get("leaves/policies")
  @RequirePermission({ resource: "leaves", action: "read", scope: "all" })
  async getLeavePolicies(@Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.getLeavePolicies(user.workspaceId);
  }

  @Post("leaves/policies")
  @RequirePermission({ resource: "leaves", action: "manage", scope: "all" })
  async createLeavePolicy(@Body() body: any, @Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.createLeavePolicy(user.workspaceId, body);
  }

  @Put("leaves/policies/:id")
  @RequirePermission({ resource: "leaves", action: "manage", scope: "all" })
  async updateLeavePolicy(
    @Param("id") id: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    return await this.hrService.updateLeavePolicy(user.workspaceId, id, body);
  }

  @Delete("leaves/policies/:id")
  @RequirePermission({ resource: "leaves", action: "manage", scope: "all" })
  async deleteLeavePolicy(@Param("id") id: string, @Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.deleteLeavePolicy(user.workspaceId, id);
  }

  @Post("leaves/allocate")
  @RequirePermission({ resource: "leaves", action: "manage", scope: "all" })
  async allocateLeaves(@Body() body: any, @Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.allocateLeaves(user.workspaceId, body);
  }

  // ====================
  // PAYROLL CONFIGURATION
  // ====================
  @Get("payroll/salary-components")
  @RequirePermission({ resource: "payroll", action: "read", scope: "all" })
  async getSalaryComponents(@Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.getSalaryComponents(user.workspaceId);
  }

  @Post("payroll/salary-components")
  @RequirePermission({ resource: "payroll", action: "manage", scope: "all" })
  async createSalaryComponent(@Body() body: any, @Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.createSalaryComponent(user.workspaceId, body);
  }

  @Get("payroll/salary-structures")
  @RequirePermission({ resource: "payroll", action: "read", scope: "all" })
  async getSalaryStructures(@Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.getSalaryStructures(user.workspaceId);
  }

  @Post("payroll/salary-structures")
  @RequirePermission({ resource: "payroll", action: "manage", scope: "all" })
  async createSalaryStructure(@Body() body: any, @Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.createSalaryStructure(user.workspaceId, body);
  }

  @Post("payroll/salary-structures/assign")
  @RequirePermission({ resource: "payroll", action: "manage", scope: "all" })
  async assignSalaryStructure(@Body() body: any, @Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.assignSalaryStructure(user.workspaceId, body);
  }

  @Get("payroll/salary-assignments/:employeeId")
  @RequirePermission({ resource: "payroll", action: "read", scope: "all" })
  async getSalaryAssignment(
    @Param("employeeId") employeeId: string,
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    return await this.hrService.getSalaryAssignment(
      user.workspaceId,
      employeeId,
    );
  }

  @Get("payroll/tax-slabs")
  @RequirePermission({ resource: "payroll", action: "read", scope: "all" })
  async getTaxSlabs(@Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.getTaxSlabs(user.workspaceId);
  }

  @Post("payroll/tax-slabs")
  @RequirePermission({ resource: "payroll", action: "manage", scope: "all" })
  async createTaxSlab(@Body() body: any, @Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.createTaxSlab(user.workspaceId, body);
  }

  // ====================
  // PAYROLL RUNS
  // ====================
  @Get("payroll/runs")
  @RequirePermission({ resource: "payroll", action: "read", scope: "all" })
  async getPayrollRuns(@Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.getPayrollRuns(user.workspaceId);
  }

  @Get("payroll/runs/:id")
  @RequirePermission({ resource: "payroll", action: "read", scope: "all" })
  async getPayrollRunById(@Param("id") id: string, @Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.getPayrollRunById(user.workspaceId, id);
  }

  @Post("payroll/runs")
  @RequirePermission({ resource: "payroll", action: "manage", scope: "all" })
  async createPayrollRun(@Body() body: any, @Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.createPayrollRun(
      user.workspaceId,
      body,
      user.userId,
    );
  }

  @Post("payroll/entries/:entryId/earnings")
  @RequirePermission({ resource: "payroll", action: "manage", scope: "all" })
  async addPayrollEarning(
    @Param("entryId") entryId: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    return await this.hrService.addEarning(user.workspaceId, entryId, body);
  }

  @Post("payroll/entries/:entryId/deductions")
  @RequirePermission({ resource: "payroll", action: "manage", scope: "all" })
  async addPayrollDeduction(
    @Param("entryId") entryId: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    return await this.hrService.addDeduction(user.workspaceId, entryId, body);
  }

  // ====================
  // ONBOARDING
  // ====================
  @Get("onboarding/templates")
  @RequirePermission({ resource: "employees", action: "read", scope: "all" })
  async getOnboardingTemplates(@Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.getOnboardingTemplates(user.workspaceId);
  }

  @Post("onboarding/templates")
  @RequirePermission({ resource: "employees", action: "manage", scope: "all" })
  async createOnboardingTemplate(@Body() body: any, @Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.createOnboardingTemplate(
      user.workspaceId,
      body,
    );
  }

  @Post("onboarding/initiate")
  @RequirePermission({ resource: "employees", action: "manage", scope: "all" })
  async initiateOnboarding(@Body() body: any, @Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.initiateOnboarding(
      user.workspaceId,
      body.employeeId,
      body.templateId,
    );
  }

  @Get("onboarding/tasks/:employeeId")
  @RequirePermission({ resource: "employees", action: "read", scope: "all" })
  async getOnboardingTasks(
    @Param("employeeId") employeeId: string,
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    return await this.hrService.getOnboardingTasks(
      user.workspaceId,
      employeeId,
    );
  }

  @Post("onboarding/tasks/:taskId/status")
  @RequirePermission({ resource: "employees", action: "manage", scope: "all" })
  async updateOnboardingTask(
    @Param("taskId") taskId: string,
    @Body("status") status: string,
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    return await this.hrService.updateOnboardingTask(
      user.workspaceId,
      taskId,
      status,
      user.userId,
    );
  }

  // ====================
  // ATTENDANCE
  // ====================
  @Post("attendance/check-in")
  @RequirePermission({ resource: "attendance", action: "create", scope: "own" })
  async checkIn(@Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.checkIn(user.workspaceId, user.userId);
  }

  @Post("attendance/check-out")
  @RequirePermission({ resource: "attendance", action: "update", scope: "own" })
  async checkOut(@Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.checkOut(user.workspaceId, user.userId);
  }

  @Get("attendance")
  @RequirePermission({ resource: "attendance", action: "read", scope: "all" })
  async getAttendanceLogs(@Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.getAttendanceLogs(user.workspaceId);
  }

  @Get("attendance/me")
  @RequirePermission({ resource: "attendance", action: "read", scope: "own" })
  async getMyAttendance(@Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.getMyAttendance(user.workspaceId, user.userId);
  }

  // ====================
  // INDIA STATUTORY
  // ====================
  @Get("compliance/india/settings")
  @RequirePermission({ resource: "payroll", action: "read", scope: "all" })
  async getIndiaComplianceSettings(@Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.getIndiaComplianceSettings(user.workspaceId);
  }

  @Put("compliance/india/settings")
  @RequirePermission({ resource: "payroll", action: "manage", scope: "all" })
  async updateIndiaComplianceSettings(@Body() body: any, @Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.updateIndiaComplianceSettings(
      user.workspaceId,
      body,
    );
  }

  @Get("compliance/india/report/pf-esi")
  @RequirePermission({ resource: "payroll", action: "read", scope: "all" })
  async getPfEsiReport(
    @Query("month") month: string,
    @Query("year") year: string,
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    return await this.hrService.getPfEsiReport(
      user.workspaceId,
      parseInt(month),
      parseInt(year),
    );
  }

  @Get("compliance/india/declarations/:employeeId")
  @RequirePermission({ resource: "payroll", action: "read", scope: "all" })
  async getTaxExemptionDeclaration(
    @Param("employeeId") employeeId: string,
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    return await this.hrService.getTaxExemptionDeclaration(
      user.workspaceId,
      employeeId,
    );
  }

  @Post("compliance/india/declarations")
  @RequirePermission({ resource: "payroll", action: "manage", scope: "all" })
  async submitTaxExemptionDeclaration(@Body() body: any, @Req() req: Request) {
    const user = (req as any).user;
    // Assuming body contains employeeId
    return await this.hrService.submitTaxExemptionDeclaration(
      user.workspaceId,
      body.employeeId,
      body,
    );
  }

  @Get("compliance/india/declarations")
  @RequirePermission({ resource: "payroll", action: "read", scope: "all" })
  async getAllTaxDeclarations(@Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.getAllTaxDeclarations(user.workspaceId);
  }

  @Patch("compliance/india/declarations/:id/status")
  @RequirePermission({ resource: "payroll", action: "manage", scope: "all" })
  async updateTaxDeclarationStatus(
    @Param("id") id: string,
    @Body("status") status: string,
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    return await this.hrService.updateTaxDeclarationStatus(
      user.workspaceId,
      id,
      status,
    );
  }

  @Get("compliance/india/statutory-status")
  @RequirePermission({ resource: "payroll", action: "read", scope: "all" })
  async getStatutoryStatus(@Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.getStatutoryStatus(user.workspaceId);
  }

  // ====================
  // ADMIN: HELPDESK
  // ====================
  @Get("tickets")
  @RequirePermission({ resource: "helpdesk", action: "read", scope: "all" })
  async getHelpdeskTickets(
    @Req() req: Request,
    @Query("type") type?: string,
    @Query("categoryGroup") categoryGroup?: "HR" | "IT",
  ): Promise<any> {
    const user = (req as any).user;
    return await this.hrService.getHelpdeskTickets(
      user.workspaceId,
      type,
      categoryGroup,
    );
  }

  @Patch("tickets/:id/status")
  @RequirePermission({ resource: "helpdesk", action: "manage", scope: "all" })
  async updateTicketStatus(
    @Param("id") id: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    return await this.hrService.updateTicket(user.workspaceId, id, body);
  }

  @Post("tickets/:id/comments")
  @RequirePermission({ resource: "helpdesk", action: "manage", scope: "all" })
  async addAdminTicketComment(
    @Param("id") id: string,
    @Body("message") message: string,
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    return await this.hrService.addAdminTicketComment(
      user.workspaceId,
      user.userId,
      id,
      message,
    );
  }

  // ====================
  // EVENTS & HOLIDAYS
  // ====================
  @Get("events")
  @RequirePermission({ resource: "CompanyEvent", action: "read", scope: "all" })
  async getCompanyEvents(@Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.getCompanyEvents(user.workspaceId);
  }

  @Post("events")
  @RequirePermission({
    resource: "CompanyEvent",
    action: "create",
    scope: "all",
  })
  async createCompanyEvent(@Body() body: any, @Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.createCompanyEvent(
      user.workspaceId,
      user.userId,
      body,
    );
  }

  @Patch("events/:id")
  @RequirePermission({
    resource: "CompanyEvent",
    action: "update",
    scope: "all",
  })
  async updateCompanyEvent(
    @Param("id") id: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    // Add logic here if/when implemented in HrService
    return {};
  }

  @Delete("events/:id")
  @RequirePermission({
    resource: "CompanyEvent",
    action: "delete",
    scope: "all",
  })
  async deleteCompanyEvent(@Param("id") id: string, @Req() req: Request) {
    // Add logic here if/when implemented in HrService
    return {};
  }

  // ====================
  // MOVEMENTS
  // ====================
  @Get("movements")
  @RequirePermission({ resource: "employees", action: "read", scope: "all" })
  async getEmployeeMovements(@Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.getEmployeeMovements(user.workspaceId);
  }

  @Post("movements")
  @RequirePermission({ resource: "employees", action: "manage", scope: "all" })
  async createEmployeeMovement(@Body() body: any, @Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.createEmployeeMovement(user.workspaceId, body);
  }

  @Post("movements/:id/approve")
  @RequirePermission({ resource: "employees", action: "manage", scope: "all" })
  async approveEmployeeMovement(@Param("id") id: string, @Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.approveEmployeeMovement(user.workspaceId, id);
  }

  // ====================
  // SEPARATIONS & OFFBOARDING
  // ====================
  @Get("separations")
  @RequirePermission({ resource: "employees", action: "read", scope: "all" })
  async getSeparations(@Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.getSeparations(user.workspaceId);
  }

  @Post("separations")
  @RequirePermission({ resource: "employees", action: "manage", scope: "all" })
  async createSeparation(@Body() body: any, @Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.createSeparation(user.workspaceId, body);
  }

  @Post("separations/:id/approve")
  @RequirePermission({ resource: "employees", action: "manage", scope: "all" })
  async approveSeparation(@Param("id") id: string, @Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.approveSeparation(user.workspaceId, id);
  }

  @Post("offboarding/initiate")
  @RequirePermission({ resource: "employees", action: "manage", scope: "all" })
  async initiateOffboarding(@Body() body: any, @Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.initiateOffboarding(
      user.workspaceId,
      body.employeeId,
      body.templateId,
    );
  }

  @Get("offboarding/templates")
  @RequirePermission({ resource: "employees", action: "read", scope: "all" })
  async getOffboardingTemplates(@Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.getOffboardingTemplates(user.workspaceId);
  }

  @Get("offboarding/tasks/:employeeId")
  @RequirePermission({ resource: "employees", action: "read", scope: "all" })
  async getOffboardingTasks(
    @Param("employeeId") employeeId: string,
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    return await this.hrService.getOffboardingTasks(
      user.workspaceId,
      employeeId,
    );
  }

  @Post("offboarding/tasks/:taskId/status")
  @RequirePermission({ resource: "employees", action: "manage", scope: "all" })
  async updateOffboardingTask(
    @Param("taskId") taskId: string,
    @Body("status") status: string,
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    return await this.hrService.updateOffboardingTask(
      user.workspaceId,
      taskId,
      status,
      user.userId,
    );
  }

  // ====================
  // PERFORMANCE
  // ====================
  @Get("performance/cycles")
  @RequirePermission({ resource: "employees", action: "read", scope: "all" })
  async getAppraisalCycles(@Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.getAppraisalCycles(user.workspaceId);
  }

  @Post("performance/cycles")
  @RequirePermission({ resource: "employees", action: "manage", scope: "all" })
  async createAppraisalCycle(@Body() body: any, @Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.createAppraisalCycle(user.workspaceId, body);
  }

  @Get("performance/goals")
  @RequirePermission({ resource: "employees", action: "read", scope: "all" })
  async getEmployeeGoals(
    @Req() req: Request,
    @Query("employeeId") employeeId?: string,
    @Query("cycleId") cycleId?: string,
  ) {
    const user = (req as any).user;
    return await this.hrService.getEmployeeGoals(
      user.workspaceId,
      employeeId,
      cycleId,
    );
  }

  @Post("performance/goals")
  @RequirePermission({ resource: "employees", action: "manage", scope: "all" })
  async createEmployeeGoal(@Body() body: any, @Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.createEmployeeGoal(user.workspaceId, body);
  }

  @Get("performance/appraisals")
  @RequirePermission({ resource: "employees", action: "read", scope: "all" })
  async getAppraisals(
    @Req() req: Request,
    @Query("employeeId") employeeId?: string,
    @Query("cycleId") cycleId?: string,
  ) {
    const user = (req as any).user;
    return await this.hrService.getAppraisals(
      user.workspaceId,
      employeeId,
      cycleId,
    );
  }

  // ====================
  // RECRUITMENT
  // ====================
  @Get("applicants")
  @RequirePermission({ resource: "employees", action: "read", scope: "all" })
  async getJobApplicants(@Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.getJobApplicants(user.workspaceId);
  }

  // ====================
  // SHIFT MANAGEMENT
  // ====================
  @Get("shifts")
  @RequirePermission({ resource: "attendance", action: "read", scope: "all" })
  async getShiftTypes(@Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.getShiftTypes(user.workspaceId);
  }

  @Post("shifts")
  @RequirePermission({ resource: "attendance", action: "manage", scope: "all" })
  async createShiftType(@Body() body: any, @Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.createShiftType(user.workspaceId, body);
  }

  @Post("shifts/assign")
  @RequirePermission({ resource: "attendance", action: "manage", scope: "all" })
  async assignShift(@Body() body: any, @Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.assignShift(user.workspaceId, body);
  }
}
