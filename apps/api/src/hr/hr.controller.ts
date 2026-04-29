import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { HrService } from './hr.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { WorkspaceGuard } from '../auth/guards/workspace.guard';
import type { Request } from 'express';

@ApiTags('hr')
@Controller('hr')
@UseGuards(AuthGuard, WorkspaceGuard)
@ApiBearerAuth('JWT-auth')
export class HrController {
  constructor(private readonly hrService: HrService) {}

  @Get('departments')
  @ApiOperation({ summary: 'Get workspace departments' })
  async getDepartments(@Req() req: Request) {
    const user = (req as any).user;
    const data = await this.hrService.getDepartments(user.workspaceId);
    return { success: true, data };
  }

  @Post('departments')
  @ApiOperation({ summary: 'Create a new department' })
  async createDepartment(@Body() body: any, @Req() req: Request) {
    const user = (req as any).user;
    const data = await this.hrService.createDepartment(user.workspaceId, body);
    return { success: true, data };
  }

  @Get('designations')
  @ApiOperation({ summary: 'Get workspace designations' })
  async getDesignations(@Req() req: Request) {
    const user = (req as any).user;
    const data = await this.hrService.getDesignations(user.workspaceId);
    return { success: true, data };
  }

  @Post('designations')
  @ApiOperation({ summary: 'Create a new designation' })
  async createDesignation(@Body() body: any, @Req() req: Request) {
    const user = (req as any).user;
    const data = await this.hrService.createDesignation(user.workspaceId, body);
    return { success: true, data };
  }

  @Get('employees')
  @ApiOperation({ summary: 'Get workspace employees' })
  async getEmployees(@Req() req: Request): Promise<any> {
    const user = (req as any).user;
    const data = await this.hrService.getEmployees(user.workspaceId);
    return { success: true, data };
  }

  @Post('employees')
  @ApiOperation({ summary: 'Create a new employee' })
  async createEmployee(@Body() body: any, @Req() req: Request): Promise<any> {
    const user = (req as any).user;
    const data = await this.hrService.createEmployee(user.workspaceId, body);
    return { success: true, data };
  }

  // ====================
  // LEAVE TYPES
  // ====================
  @Get('leaves/types')
  @ApiOperation({ summary: 'Get leave types' })
  async getLeaveTypes(@Req() req: Request): Promise<any> {
    const user = (req as any).user;
    const data = await this.hrService.getLeaveTypes(user.workspaceId);
    return { success: true, data };
  }

  @Post('leaves/types')
  @ApiOperation({ summary: 'Create leave type' })
  async createLeaveType(@Body() body: any, @Req() req: Request): Promise<any> {
    const user = (req as any).user;
    const data = await this.hrService.createLeaveType(user.workspaceId, body);
    return { success: true, data };
  }

  // ====================
  // LEAVE APPLICATIONS
  // ====================
  @Get('leaves/applications')
  @ApiOperation({ summary: 'Get leave applications' })
  async getLeaveApplications(@Req() req: Request): Promise<any> {
    const user = (req as any).user;
    const data = await this.hrService.getLeaveApplications(user.workspaceId);
    return { success: true, data };
  }

  @Post('leaves/applications')
  @ApiOperation({ summary: 'Apply for leave' })
  async createLeaveApplication(@Body() body: any, @Req() req: Request): Promise<any> {
    const user = (req as any).user;
    const data = await this.hrService.createLeaveApplication(user.workspaceId, body);
    return { success: true, data };
  }

  @Post('leaves/applications/:id/status')
  @ApiOperation({ summary: 'Approve or reject leave' })
  async updateLeaveStatus(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { status: string; remarks?: string }
  ): Promise<any> {
    const user = (req as any).user;
    const data = await this.hrService.updateLeaveStatus(
      user.workspaceId,
      id,
      body.status,
      user.userId,
      body.remarks
    );
    return { success: true, data };
  }

  // ====================
  // PAYROLL RUNS
  // ====================
  @Get('payroll/runs')
  @ApiOperation({ summary: 'Get payroll runs' })
  async getPayrollRuns(@Req() req: Request): Promise<any> {
    const user = (req as any).user;
    const data = await this.hrService.getPayrollRuns(user.workspaceId);
    return { success: true, data };
  }

  @Post('payroll/runs')
  @ApiOperation({ summary: 'Create a payroll run' })
  async createPayrollRun(@Body() body: any, @Req() req: Request): Promise<any> {
    const user = (req as any).user;
    const data = await this.hrService.createPayrollRun(user.workspaceId, body, user.userId);
    return { success: true, data };
  }

  @Get('payroll/runs/:id')
  @ApiOperation({ summary: 'Get payroll run by id' })
  async getPayrollRunById(@Param('id') id: string, @Req() req: Request): Promise<any> {
    const user = (req as any).user;
    const data = await this.hrService.getPayrollRunById(user.workspaceId, id);
    return { success: true, data };
  }

  // ====================
  // PAYROLL ENTRIES
  // ====================
  @Post('payroll/entries/:entryId/earnings')
  @ApiOperation({ summary: 'Add earning to payslip' })
  async addEarning(@Param('entryId') entryId: string, @Body() body: any, @Req() req: Request): Promise<any> {
    const user = (req as any).user;
    const data = await this.hrService.addEarning(user.workspaceId, entryId, body);
    return { success: true, data };
  }

  @Post('payroll/entries/:entryId/deductions')
  @ApiOperation({ summary: 'Add deduction to payslip' })
  async addDeduction(@Param('entryId') entryId: string, @Body() body: any, @Req() req: Request): Promise<any> {
    const user = (req as any).user;
    const data = await this.hrService.addDeduction(user.workspaceId, entryId, body);
    return { success: true, data };
  }
}
