import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Req,
  UseGuards,
  Param,
} from "@nestjs/common";
import { ApiOperation, ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { SelfServiceService } from "./self-service.service";
import { AuthGuard } from "../common/guards/auth.guard";
import { WorkspaceGuard } from "../auth/guards/workspace.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { PermissionGuard } from "../auth/guards/permission.guard";
import { RequirePermission } from "../auth/decorators/require-permission.decorator";
import type { Request } from "express";

@ApiTags("Self Service")
@ApiBearerAuth("JWT-auth")
@Controller("self-service")
@UseGuards(AuthGuard, WorkspaceGuard, RolesGuard, PermissionGuard)
export class SelfServiceController {
  constructor(private readonly selfServiceService: SelfServiceService) {}

  @Get("profile/me")
  @RequirePermission({ resource: "employees", action: "read", scope: "own" })
  @ApiOperation({ summary: "Get my employee profile" })
  async getMyProfile(@Req() req: Request): Promise<any> {
    const user = (req as any).user;
    return await this.selfServiceService.getMyProfile(
      user.workspaceId,
      user.userId,
    );
  }

  @Put("profile/me")
  @RequirePermission({ resource: "employees", action: "update", scope: "own" })
  @ApiOperation({ summary: "Update my employee profile" })
  async updateMyProfile(@Body() body: any, @Req() req: Request): Promise<any> {
    const user = (req as any).user;
    return await this.selfServiceService.updateMyProfile(
      user.workspaceId,
      user.userId,
      body,
    );
  }

  @Get("attendance/me")
  @RequirePermission({ resource: "attendance", action: "read", scope: "own" })
  @ApiOperation({ summary: "Get current user attendance" })
  async getMyAttendance(@Req() req: Request): Promise<any> {
    const user = (req as any).user;
    return await this.selfServiceService.getMyAttendance(
      user.workspaceId,
      user.userId,
    );
  }

  @Get("attendance/history")
  @RequirePermission({ resource: "attendance", action: "read", scope: "own" })
  @ApiOperation({ summary: "Get current user attendance history" })
  async getMyAttendanceHistory(@Req() req: Request): Promise<any> {
    const user = (req as any).user;
    const month = req.query.month
      ? parseInt(req.query.month as string, 10)
      : undefined;
    const year = req.query.year
      ? parseInt(req.query.year as string, 10)
      : undefined;
    return await this.selfServiceService.getMyAttendanceHistory(
      user.workspaceId,
      user.userId,
      month,
      year,
    );
  }

  @Post("attendance/check-in")
  @RequirePermission({ resource: "attendance", action: "create", scope: "own" })
  @ApiOperation({ summary: "Check in for today" })
  async checkIn(@Req() req: Request): Promise<any> {
    const user = (req as any).user;
    return await this.selfServiceService.checkIn(user.workspaceId, user.userId);
  }

  @Post("attendance/check-out")
  @RequirePermission({ resource: "attendance", action: "update", scope: "own" })
  @ApiOperation({ summary: "Check out for today" })
  async checkOut(@Req() req: Request): Promise<any> {
    const user = (req as any).user;
    return await this.selfServiceService.checkOut(
      user.workspaceId,
      user.userId,
    );
  }

  @Get("leaves/me")
  @RequirePermission({ resource: "leave", action: "read", scope: "own" })
  @ApiOperation({ summary: "Get my leave applications" })
  async getMyLeaves(@Req() req: Request): Promise<any> {
    const user = (req as any).user;
    return await this.selfServiceService.getMyLeaves(
      user.workspaceId,
      user.userId,
    );
  }

  @Get("leaves/balances")
  @RequirePermission({ resource: "leave", action: "read", scope: "own" })
  @ApiOperation({ summary: "Get my leave balances" })
  async getMyLeaveBalances(@Req() req: Request): Promise<any> {
    const user = (req as any).user;
    return await this.selfServiceService.getMyLeaveBalances(
      user.workspaceId,
      user.userId,
    );
  }

  @Post("leaves/apply")
  @RequirePermission({ resource: "leave", action: "create", scope: "own" })
  @ApiOperation({ summary: "Apply for leave" })
  async applyLeave(@Body() body: any, @Req() req: Request): Promise<any> {
    const user = (req as any).user;
    return await this.selfServiceService.applyLeave(
      user.workspaceId,
      user.userId,
      body,
    );
  }

  @Put("leaves/cancel/:id")
  @RequirePermission({ resource: "leave", action: "update", scope: "own" })
  @ApiOperation({ summary: "Cancel a pending leave" })
  async cancelLeave(
    @Req() req: Request,
    @Param("id") leaveId: string,
  ): Promise<any> {
    const user = (req as any).user;
    return await this.selfServiceService.cancelLeave(
      user.workspaceId,
      user.userId,
      leaveId,
    );
  }

  @Get("leave-types")
  @RequirePermission({ resource: "leave", action: "read", scope: "own" })
  @ApiOperation({ summary: "Get active leave types" })
  async getLeaveTypes(@Req() req: Request): Promise<any> {
    const user = (req as any).user;
    return await this.selfServiceService.getLeaveTypes(user.workspaceId);
  }

  @Get("payslips/me")
  @RequirePermission({ resource: "payroll", action: "read", scope: "own" })
  @ApiOperation({ summary: "Get my payslips" })
  async getMyPayslips(@Req() req: Request): Promise<any> {
    const user = (req as any).user;
    return await this.selfServiceService.getMyPayslips(
      user.workspaceId,
      user.userId,
    );
  }

  @Get("calendar")
  @RequirePermission({ resource: "attendance", action: "read", scope: "own" })
  @ApiOperation({ summary: "Get my calendar (holidays, events, leaves)" })
  async getCalendar(@Req() req: Request): Promise<any> {
    const user = (req as any).user;
    const month = req.query.month
      ? parseInt(req.query.month as string, 10)
      : new Date().getMonth() + 1;
    const year = req.query.year
      ? parseInt(req.query.year as string, 10)
      : new Date().getFullYear();
    return await this.selfServiceService.getCalendar(
      user.workspaceId,
      user.userId,
      month,
      year,
    );
  }

  @Get("appraisals/current")
  @RequirePermission({ resource: "appraisals", action: "read", scope: "own" })
  @ApiOperation({ summary: "Get my current appraisal and goals" })
  async getCurrentAppraisal(@Req() req: Request): Promise<any> {
    const user = (req as any).user;
    return await this.selfServiceService.getCurrentAppraisal(
      user.workspaceId,
      user.userId,
    );
  }

  @Post("appraisals/:id/submit")
  @RequirePermission({ resource: "appraisals", action: "update", scope: "own" })
  @ApiOperation({ summary: "Submit my self-appraisal" })
  async submitSelfAppraisal(
    @Param("id") appraisalId: string,
    @Body() body: any,
    @Req() req: Request,
  ): Promise<any> {
    const user = (req as any).user;
    return await this.selfServiceService.submitSelfAppraisal(
      user.workspaceId,
      user.userId,
      appraisalId,
      body,
    );
  }

  @Get("tax-declarations/me")
  @RequirePermission({ resource: "payroll", action: "read", scope: "own" })
  @ApiOperation({ summary: "Get my tax declarations" })
  async getMyTaxDeclarations(@Req() req: Request): Promise<any> {
    const user = (req as any).user;
    return await this.selfServiceService.getMyTaxDeclarations(
      user.workspaceId,
      user.userId,
    );
  }

  @Post("tax-declarations/submit")
  @RequirePermission({ resource: "payroll", action: "create", scope: "own" })
  @ApiOperation({ summary: "Submit a new tax declaration" })
  async submitTaxDeclaration(
    @Body() body: any,
    @Req() req: Request,
  ): Promise<any> {
    const user = (req as any).user;
    return await this.selfServiceService.submitTaxDeclaration(
      user.workspaceId,
      user.userId,
      body,
    );
  }

  @Put("tax-declarations/cancel/:id")
  @RequirePermission({ resource: "payroll", action: "update", scope: "own" })
  @ApiOperation({ summary: "Cancel a tax declaration" })
  async cancelTaxDeclaration(
    @Param("id") declarationId: string,
    @Req() req: Request,
  ): Promise<any> {
    const user = (req as any).user;
    return await this.selfServiceService.cancelTaxDeclaration(
      user.workspaceId,
      user.userId,
      declarationId,
    );
  }

  @Get("tickets")
  @RequirePermission({ resource: "helpdesk", action: "read", scope: "own" })
  @ApiOperation({ summary: "Get my helpdesk tickets" })
  async getMyTickets(@Req() req: Request): Promise<any> {
    const user = (req as any).user;
    return await this.selfServiceService.getMyTickets(
      user.workspaceId,
      user.userId,
    );
  }

  @Post("tickets")
  @RequirePermission({ resource: "helpdesk", action: "create", scope: "own" })
  @ApiOperation({ summary: "Raise a new helpdesk ticket" })
  async createTicket(@Body() body: any, @Req() req: Request): Promise<any> {
    const user = (req as any).user;
    return await this.selfServiceService.createTicket(
      user.workspaceId,
      user.userId,
      body,
    );
  }

  @Get("tickets/:id")
  @RequirePermission({ resource: "helpdesk", action: "read", scope: "own" })
  @ApiOperation({ summary: "Get ticket details and comments" })
  async getTicketDetails(
    @Param("id") ticketId: string,
    @Req() req: Request,
  ): Promise<any> {
    const user = (req as any).user;
    return await this.selfServiceService.getTicketDetails(
      user.workspaceId,
      user.userId,
      ticketId,
    );
  }

  @Post("tickets/:id/comments")
  @RequirePermission({ resource: "helpdesk", action: "update", scope: "own" })
  @ApiOperation({ summary: "Add a comment to a ticket" })
  async addTicketComment(
    @Param("id") ticketId: string,
    @Body("message") message: string,
    @Req() req: Request,
  ): Promise<any> {
    const user = (req as any).user;
    return await this.selfServiceService.addTicketComment(
      user.workspaceId,
      user.userId,
      ticketId,
      message,
    );
  }

  @Put("tickets/:id/cancel")
  @RequirePermission({ resource: "helpdesk", action: "update", scope: "own" })
  @ApiOperation({ summary: "Cancel a ticket" })
  async cancelTicket(
    @Param("id") ticketId: string,
    @Req() req: Request,
  ): Promise<any> {
    const user = (req as any).user;
    return await this.selfServiceService.cancelTicket(
      user.workspaceId,
      user.userId,
      ticketId,
    );
  }
}
