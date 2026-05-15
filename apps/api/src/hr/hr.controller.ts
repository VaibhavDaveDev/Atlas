import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  UseGuards,
  Req,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { HrService } from './hr.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { WorkspaceGuard } from '../auth/guards/workspace.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import type { Request } from 'express';

@ApiTags('hr')
@Controller('hr')
@UseGuards(AuthGuard, WorkspaceGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class HrController {
  constructor(private readonly hrService: HrService) {}

  @Get('departments')
  @ApiOperation({ summary: 'Get workspace departments' })
  async getDepartments(@Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.getDepartments(user.workspaceId);
  }

  @Post('departments')
  @ApiOperation({ summary: 'Create a new department' })
  async createDepartment(@Body() body: any, @Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.createDepartment(user.workspaceId, body);
  }

  @Get('departments/:id')
  @ApiOperation({ summary: 'Get department by id' })
  async getDepartmentById(@Param('id') id: string, @Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.getDepartmentById(user.workspaceId, id);
  }

  @Put('departments/:id')
  @ApiOperation({ summary: 'Update a department' })
  async updateDepartment(@Param('id') id: string, @Body() body: any, @Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.updateDepartment(user.workspaceId, id, body);
  }

  @Delete('departments/:id')
  @Roles('OWNER', 'ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Delete a department' })
  async deleteDepartment(@Param('id') id: string, @Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.deleteDepartment(user.workspaceId, id);
  }

  @Get('designations')
  @ApiOperation({ summary: 'Get workspace designations' })
  async getDesignations(@Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.getDesignations(user.workspaceId);
  }

  @Post('designations')
  @ApiOperation({ summary: 'Create a new designation' })
  async createDesignation(@Body() body: any, @Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.createDesignation(user.workspaceId, body);
  }

  @Get('employees')
  @ApiOperation({ summary: 'Get workspace employees' })
  async getEmployees(@Req() req: Request): Promise<any> {
    const user = (req as any).user;
    return await this.hrService.getEmployees(user.workspaceId);
  }

  @Post('employees')
  @ApiOperation({ summary: 'Create a new employee' })
  async createEmployee(@Body() body: any, @Req() req: Request): Promise<any> {
    const user = (req as any).user;
    return await this.hrService.createEmployee(user.workspaceId, body);
  }

  @Get('employees/:id')
  @ApiOperation({ summary: 'Get employee by id' })
  async getEmployeeById(@Param('id') id: string, @Req() req: Request): Promise<any> {
    const user = (req as any).user;
    return await this.hrService.getEmployeeById(user.workspaceId, id);
  }

  @Put('employees/:id')
  @ApiOperation({ summary: 'Update an employee' })
  async updateEmployee(@Param('id') id: string, @Body() body: any, @Req() req: Request): Promise<any> {
    const user = (req as any).user;
    return await this.hrService.updateEmployee(user.workspaceId, id, body);
  }

  @Delete('employees/:id')
  @Roles('OWNER', 'ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Delete an employee' })
  async deleteEmployee(@Param('id') id: string, @Req() req: Request): Promise<any> {
    const user = (req as any).user;
    return await this.hrService.deleteEmployee(user.workspaceId, id);
  }

  // ====================
  // ATTENDANCE
  // ====================
  @Get('attendance')
  @ApiOperation({ summary: 'Get attendance logs' })
  async getAttendanceLogs(@Req() req: Request): Promise<any> {
    const user = (req as any).user;
    return await this.hrService.getAttendanceLogs(user.workspaceId);
  }

  @Get('attendance/me')
  @ApiOperation({ summary: 'Get current user attendance' })
  async getMyAttendance(@Req() req: Request): Promise<any> {
    const user = (req as any).user;
    return await this.hrService.getMyAttendance(user.workspaceId, user.userId);
  }

  @Post('attendance/check-in')
  @ApiOperation({ summary: 'Check in for today' })
  async checkIn(@Req() req: Request): Promise<any> {
    const user = (req as any).user;
    return await this.hrService.checkIn(user.workspaceId, user.userId);
  }

  @Post('attendance/check-out')
  @ApiOperation({ summary: 'Check out for today' })
  async checkOut(@Req() req: Request): Promise<any> {
    const user = (req as any).user;
    return await this.hrService.checkOut(user.workspaceId, user.userId);
  }

  // ====================
  // LEAVE TYPES
  // ====================
  @Get('leaves/types')
  @ApiOperation({ summary: 'Get leave types' })
  async getLeaveTypes(@Req() req: Request): Promise<any> {
    const user = (req as any).user;
    return await this.hrService.getLeaveTypes(user.workspaceId);
  }

  @Post('leaves/types')
  @ApiOperation({ summary: 'Create leave type' })
  async createLeaveType(@Body() body: any, @Req() req: Request): Promise<any> {
    const user = (req as any).user;
    return await this.hrService.createLeaveType(user.workspaceId, body);
  }

  @Put('leaves/types/:id')
  @ApiOperation({ summary: 'Update leave type' })
  async updateLeaveType(@Param('id') id: string, @Body() body: any, @Req() req: Request): Promise<any> {
    const user = (req as any).user;
    return await this.hrService.updateLeaveType(user.workspaceId, id, body);
  }

  @Delete('leaves/types/:id')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Delete leave type' })
  async deleteLeaveType(@Param('id') id: string, @Req() req: Request): Promise<any> {
    const user = (req as any).user;
    return await this.hrService.deleteLeaveType(user.workspaceId, id);
  }

  // ====================
  // LEAVE APPLICATIONS
  // ====================
  @Get('leaves/applications')
  @ApiOperation({ summary: 'Get leave applications' })
  async getLeaveApplications(@Req() req: Request): Promise<any> {
    const user = (req as any).user;
    return await this.hrService.getLeaveApplications(user.workspaceId);
  }

  @Post('leaves/applications')
  @ApiOperation({ summary: 'Apply for leave' })
  async createLeaveApplication(@Body() body: any, @Req() req: Request): Promise<any> {
    const user = (req as any).user;
    return await this.hrService.createLeaveApplication(user.workspaceId, body);
  }

  @Post('leaves/applications/:id/status')
  @ApiOperation({ summary: 'Approve or reject leave' })
  async updateLeaveStatus(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { status: string; remarks?: string }
  ): Promise<any> {
    const user = (req as any).user;
    return await this.hrService.updateLeaveStatus(
      user.workspaceId,
      id,
      body.status,
      user.userId,
      body.remarks
    );
  }

  @Get('leaves/balances/:employeeId')
  @ApiOperation({ summary: 'Get employee leave balances' })
  async getLeaveBalances(@Param('employeeId') employeeId: string, @Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.getAllLeaveBalances(user.workspaceId, employeeId);
  }

  // ====================
  // SALARY COMPONENTS
  // ====================
  @Get('payroll/salary-components')
  @ApiOperation({ summary: 'Get salary components' })
  async getSalaryComponents(@Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.getSalaryComponents(user.workspaceId);
  }

  @Post('payroll/salary-components')
  @ApiOperation({ summary: 'Create salary component' })
  async createSalaryComponent(@Body() body: any, @Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.createSalaryComponent(user.workspaceId, body);
  }

  // ====================
  // SALARY STRUCTURES
  // ====================
  @Get('payroll/salary-structures')
  @ApiOperation({ summary: 'Get salary structures' })
  async getSalaryStructures(@Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.getSalaryStructures(user.workspaceId);
  }

  @Post('payroll/salary-structures')
  @ApiOperation({ summary: 'Create salary structure' })
  async createSalaryStructure(@Body() body: any, @Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.createSalaryStructure(user.workspaceId, body);
  }

  @Post('payroll/salary-structures/assign')
  @ApiOperation({ summary: 'Assign salary structure to employee' })
  async assignSalaryStructure(@Body() body: any, @Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.assignSalaryStructure(user.workspaceId, body);
  }

  @Get('payroll/salary-assignments/:employeeId')
  @ApiOperation({ summary: 'Get employee salary assignment' })
  async getSalaryAssignment(@Param('employeeId') employeeId: string, @Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.getSalaryAssignment(user.workspaceId, employeeId);
  }

  // ====================
  // LEAVE POLICIES & ALLOCATION
  // ====================
  @Get('leaves/policies')
  @ApiOperation({ summary: 'Get leave policies' })
  async getLeavePolicies(@Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.getLeavePolicies(user.workspaceId);
  }

  @Post('leaves/policies')
  @ApiOperation({ summary: 'Create leave policy' })
  async createLeavePolicy(@Body() body: any, @Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.createLeavePolicy(user.workspaceId, body);
  }

  @Put('leaves/policies/:id')
  @ApiOperation({ summary: 'Update leave policy' })
  async updateLeavePolicy(@Param('id') id: string, @Body() body: any, @Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.updateLeavePolicy(user.workspaceId, id, body);
  }

  @Delete('leaves/policies/:id')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Delete leave policy' })
  async deleteLeavePolicy(@Param('id') id: string, @Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.deleteLeavePolicy(user.workspaceId, id);
  }

  @Post('leaves/allocate')
  @ApiOperation({ summary: 'Allocate leaves based on policy' })
  async allocateLeaves(@Body() body: any, @Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.allocateLeaves(user.workspaceId, body);
  }

  // ====================
  // TAXATION
  // ====================
  @Get('payroll/tax-slabs')
  @ApiOperation({ summary: 'Get income tax slabs' })
  async getTaxSlabs(@Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.getTaxSlabs(user.workspaceId);
  }

  @Post('payroll/tax-slabs')
  @ApiOperation({ summary: 'Create income tax slab' })
  async createTaxSlab(@Body() body: any, @Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.createTaxSlab(user.workspaceId, body);
  }

  // ====================
  // ONBOARDING
  // ====================
  @Get('onboarding/templates')
  @ApiOperation({ summary: 'Get onboarding templates' })
  async getOnboardingTemplates(@Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.getOnboardingTemplates(user.workspaceId);
  }

  @Post('onboarding/templates')
  @ApiOperation({ summary: 'Create onboarding template' })
  async createOnboardingTemplate(@Body() body: any, @Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.createOnboardingTemplate(user.workspaceId, body);
  }

  @Post('onboarding/initiate')
  @ApiOperation({ summary: 'Initiate onboarding for employee' })
  async initiateOnboarding(@Body() body: { employeeId: string; templateId: string }, @Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.initiateOnboarding(user.workspaceId, body.employeeId, body.templateId);
  }

  @Get('onboarding/tasks/:employeeId')
  @ApiOperation({ summary: 'Get onboarding tasks for employee' })
  async getOnboardingTasks(@Param('employeeId') employeeId: string, @Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.getOnboardingTasks(user.workspaceId, employeeId);
  }

  @Post('onboarding/tasks/:taskId/status')
  @ApiOperation({ summary: 'Update onboarding task status' })
  async updateOnboardingTask(
    @Param('taskId') taskId: string,
    @Body() body: { status: string },
    @Req() req: Request
  ) {
    const user = (req as any).user;
    return await this.hrService.updateOnboardingTask(user.workspaceId, taskId, body.status, user.userId);
  }

  // ====================
  // PAYROLL RUNS
  // ====================
  @Get('payroll/runs')
  @ApiOperation({ summary: 'Get payroll runs' })
  async getPayrollRuns(@Req() req: Request): Promise<any> {
    const user = (req as any).user;
    return await this.hrService.getPayrollRuns(user.workspaceId);
  }

  @Post('payroll/runs')
  @ApiOperation({ summary: 'Create a payroll run' })
  async createPayrollRun(@Body() body: any, @Req() req: Request): Promise<any> {
    const user = (req as any).user;
    return await this.hrService.createPayrollRun(user.workspaceId, body, user.userId);
  }

  @Get('payroll/runs/:id')
  @ApiOperation({ summary: 'Get payroll run by id' })
  async getPayrollRunById(@Param('id') id: string, @Req() req: Request): Promise<any> {
    const user = (req as any).user;
    return await this.hrService.getPayrollRunById(user.workspaceId, id);
  }

  // ====================
  // PAYROLL ENTRIES
  // ====================
  @Post('payroll/entries/:entryId/earnings')
  @ApiOperation({ summary: 'Add earning to payslip' })
  async addEarning(@Param('entryId') entryId: string, @Body() body: any, @Req() req: Request): Promise<any> {
    const user = (req as any).user;
    return await this.hrService.addEarning(user.workspaceId, entryId, body);
  }

  @Post('payroll/entries/:entryId/deductions')
  @ApiOperation({ summary: 'Add deduction to payslip' })
  async addDeduction(@Param('entryId') entryId: string, @Body() body: any, @Req() req: Request): Promise<any> {
    const user = (req as any).user;
    return await this.hrService.addDeduction(user.workspaceId, entryId, body);
  }

  // ====================
  // INDIA COMPLIANCE
  // ====================
  @Get('compliance/india/settings')
  @ApiOperation({ summary: 'Get India compliance settings' })
  async getIndiaComplianceSettings(@Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.getIndiaComplianceSettings(user.workspaceId);
  }

  @Put('compliance/india/settings')
  @ApiOperation({ summary: 'Update India compliance settings' })
  async updateIndiaComplianceSettings(@Body() body: any, @Req() req: Request): Promise<any> {
    const user = (req as any).user;
    return await this.hrService.updateIndiaComplianceSettings(user.workspaceId, body);
  }

  @Get('compliance/india/statutory-status')
  @ApiOperation({ summary: 'Get statutory compliance status (PAN, PF, TDS) as real percentages from employee data' })
  async getStatutoryStatus(@Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.getStatutoryStatus(user.workspaceId);
  }

  @Get('compliance/india/report/pf-esi')
  @ApiOperation({ summary: 'Get PF/ESI report' })
  async getPfEsiReport(
    @Req() req: Request,
    @Param('month') month: number,
    @Param('year') year: number
  ): Promise<any> {
    const user = (req as any).user;
    // Use query params instead if not provided in path
    const m = month ?? (req.query.month ? parseInt(req.query.month as string) : new Date().getMonth());
    const y = year ?? (req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear());
    return await this.hrService.getPfEsiReport(user.workspaceId, m, y);
  }

  @Get('compliance/india/declarations/:employeeId')
  @ApiOperation({ summary: 'Get employee tax exemption declaration' })
  async getTaxExemptionDeclaration(@Param('employeeId') employeeId: string, @Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.getTaxExemptionDeclaration(user.workspaceId, employeeId);
  }

  @Post('compliance/india/declarations')
  @ApiOperation({ summary: 'Submit tax exemption declaration' })
  async submitTaxExemptionDeclaration(@Body() body: any, @Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.submitTaxExemptionDeclaration(user.workspaceId, user.userId, body);
  }

  // ====================
  // EMPLOYEE MOVEMENT
  // ====================
  @Get('movements')
  @ApiOperation({ summary: 'Get employee movements' })
  async getEmployeeMovements(@Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.getEmployeeMovements(user.workspaceId);
  }

  @Post('movements')
  @ApiOperation({ summary: 'Propose employee movement' })
  async createEmployeeMovement(@Body() body: any, @Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.createEmployeeMovement(user.workspaceId, body);
  }

  @Post('movements/:id/approve')
  @ApiOperation({ summary: 'Approve employee movement' })
  async approveEmployeeMovement(@Param('id') id: string, @Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.approveEmployeeMovement(user.workspaceId, id);
  }

  // ====================
  // RECRUITMENT
  // ====================
  @Get('applicants')
  @ApiOperation({ summary: 'Get job applicants' })
  async getJobApplicants(@Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.getJobApplicants(user.workspaceId);
  }

  @Post('applicants')
  @ApiOperation({ summary: 'Create job applicant' })
  async createJobApplicant(@Body() body: any, @Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.createJobApplicant(user.workspaceId, body);
  }

  @Post('interviews')
  @ApiOperation({ summary: 'Schedule interview' })
  async scheduleInterview(@Body() body: any, @Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.scheduleInterview(user.workspaceId, body);
  }

  @Put('interviews/:id/feedback')
  @ApiOperation({ summary: 'Update interview feedback' })
  async updateInterviewFeedback(@Param('id') id: string, @Body() body: any, @Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.updateInterviewFeedback(user.workspaceId, id, body);
  }

  // ====================
  // SHIFTS
  // ====================
  @Get('shifts/types')
  @ApiOperation({ summary: 'Get shift types' })
  async getShiftTypes(@Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.getShiftTypes(user.workspaceId);
  }

  @Post('shifts/types')
  @ApiOperation({ summary: 'Create shift type' })
  async createShiftType(@Body() body: any, @Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.createShiftType(user.workspaceId, body);
  }

  @Post('shifts/assign')
  @ApiOperation({ summary: 'Assign shift to employee' })
  async assignShift(@Body() body: any, @Req() req: Request) {
    const user = (req as any).user;
    return await this.hrService.assignShift(user.workspaceId, body);
  }
}
