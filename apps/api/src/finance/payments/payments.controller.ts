import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiCookieAuth } from "@nestjs/swagger";
import { PaymentsService } from "./payments.service";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { AuthGuard } from "../../common/guards/auth.guard";
import { WorkspaceGuard } from "../../auth/guards/workspace.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { PermissionGuard } from "../../auth/guards/permission.guard";
import { RequirePermission } from "../../auth/decorators/require-permission.decorator";
import type { Request } from "express";

@ApiTags("finance-payments")
@Controller("finance/payments")
@UseGuards(AuthGuard, WorkspaceGuard, RolesGuard, PermissionGuard)
@ApiCookieAuth("better-auth-cookie")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @RequirePermission({
    resource: "finance_payments",
    action: "create",
    scope: "all",
  })
  @ApiOperation({ summary: "Create a new payment" })
  async create(
    @Body() createDto: CreatePaymentDto,
    @Req() req: Request,
  ): Promise<any> {
    const workspaceId = (req as any).user.workspaceId;
    const userId = (req as any).user.id;
    return this.paymentsService.create(workspaceId, userId, createDto);
  }

  @Get()
  @RequirePermission({
    resource: "finance_payments",
    action: "read",
    scope: "all",
  })
  @ApiOperation({ summary: "Get all payments" })
  async findAll(@Req() req: Request): Promise<any[]> {
    const workspaceId = (req as any).user.workspaceId;
    return this.paymentsService.findAll(workspaceId);
  }

  @Get(":id")
  @RequirePermission({
    resource: "finance_payments",
    action: "read",
    scope: "all",
  })
  @ApiOperation({ summary: "Get payment by ID" })
  async findOne(@Param("id") id: string, @Req() req: Request): Promise<any> {
    const workspaceId = (req as any).user.workspaceId;
    return this.paymentsService.findOne(workspaceId, id);
  }

  @Post(":id/reconcile")
  @RequirePermission({
    resource: "finance_payments",
    action: "update",
    scope: "all",
  })
  @ApiOperation({ summary: "Reconcile a payment" })
  async reconcile(@Param("id") id: string, @Req() req: Request): Promise<any> {
    const workspaceId = (req as any).user.workspaceId;
    return this.paymentsService.reconcile(workspaceId, id);
  }
}
