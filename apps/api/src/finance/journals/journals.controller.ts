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
import { JournalsService } from "./journals.service";
import { CreateJournalEntryDto } from "./dto/create-journal-entry.dto";
import { AuthGuard } from "../../common/guards/auth.guard";
import { WorkspaceGuard } from "../../auth/guards/workspace.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { PermissionGuard } from "../../auth/guards/permission.guard";
import { RequirePermission } from "../../auth/decorators/require-permission.decorator";
import type { Request } from "express";

@ApiTags("finance-journals")
@Controller("finance/journals")
@UseGuards(AuthGuard, WorkspaceGuard, RolesGuard, PermissionGuard)
@ApiCookieAuth("better-auth-cookie")
export class JournalsController {
  constructor(private readonly journalsService: JournalsService) {}

  @Post()
  @RequirePermission({
    resource: "finance_journals",
    action: "create",
    scope: "all",
  })
  @ApiOperation({ summary: "Create a new journal entry" })
  async create(
    @Body() createDto: CreateJournalEntryDto,
    @Req() req: Request,
  ): Promise<any> {
    const workspaceId = (req as any).user.workspaceId;
    const userId = (req as any).user.id;
    return this.journalsService.create(workspaceId, userId, createDto);
  }

  @Get()
  @RequirePermission({
    resource: "finance_journals",
    action: "read",
    scope: "all",
  })
  @ApiOperation({ summary: "Get all journal entries" })
  async findAll(@Req() req: Request): Promise<any[]> {
    const workspaceId = (req as any).user.workspaceId;
    return this.journalsService.findAll(workspaceId);
  }

  @Get(":id")
  @RequirePermission({
    resource: "finance_journals",
    action: "read",
    scope: "all",
  })
  @ApiOperation({ summary: "Get journal entry by ID" })
  async findOne(@Param("id") id: string, @Req() req: Request): Promise<any> {
    const workspaceId = (req as any).user.workspaceId;
    return this.journalsService.findOne(workspaceId, id);
  }

  @Delete(":id")
  @RequirePermission({
    resource: "finance_journals",
    action: "delete",
    scope: "all",
  })
  @ApiOperation({ summary: "Delete a journal entry (with balance reversal)" })
  async remove(@Param("id") id: string, @Req() req: Request): Promise<any> {
    const workspaceId = (req as any).user.workspaceId;
    return this.journalsService.remove(workspaceId, id);
  }
}
