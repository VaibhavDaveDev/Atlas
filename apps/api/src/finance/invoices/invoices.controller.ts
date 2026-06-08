import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  Patch,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiCookieAuth } from "@nestjs/swagger";
import { InvoicesService } from "./invoices.service";
import { CreateInvoiceDto } from "./dto/create-invoice.dto";
import { AuthGuard } from "../../common/guards/auth.guard";
import { WorkspaceGuard } from "../../auth/guards/workspace.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { PermissionGuard } from "../../auth/guards/permission.guard";
import { RequirePermission } from "../../auth/decorators/require-permission.decorator";
import type { Request } from "express";

@ApiTags("finance-invoices")
@Controller("finance/invoices")
@UseGuards(AuthGuard, WorkspaceGuard, RolesGuard, PermissionGuard)
@ApiCookieAuth("better-auth-cookie")
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @RequirePermission({
    resource: "finance_invoices",
    action: "create",
    scope: "all",
  })
  @ApiOperation({ summary: "Create a new invoice" })
  async create(
    @Body() createDto: CreateInvoiceDto,
    @Req() req: Request,
  ): Promise<any> {
    const workspaceId = (req as any).user.workspaceId;
    const userId = (req as any).user.id;
    return this.invoicesService.create(workspaceId, userId, createDto);
  }

  @Patch(":id/post")
  @RequirePermission({
    resource: "finance_invoices",
    action: "update",
    scope: "all",
  })
  @ApiOperation({ summary: "Post an invoice to General Ledger" })
  async postInvoice(
    @Param("id") id: string,
    @Req() req: Request,
  ): Promise<any> {
    const workspaceId = (req as any).user.workspaceId;
    const userId = (req as any).user.id;
    return this.invoicesService.postInvoice(workspaceId, userId, id);
  }

  @Get()
  @RequirePermission({
    resource: "finance_invoices",
    action: "read",
    scope: "all",
  })
  @ApiOperation({ summary: "Get all invoices" })
  async findAll(@Req() req: Request): Promise<any[]> {
    const workspaceId = (req as any).user.workspaceId;
    return this.invoicesService.findAll(workspaceId);
  }

  @Get(":id")
  @RequirePermission({
    resource: "finance_invoices",
    action: "read",
    scope: "all",
  })
  @ApiOperation({ summary: "Get invoice by ID" })
  async findOne(@Param("id") id: string, @Req() req: Request): Promise<any> {
    const workspaceId = (req as any).user.workspaceId;
    return this.invoicesService.findOne(workspaceId, id);
  }
}
