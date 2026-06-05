import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { MilestonesService } from "./milestones.service";
import { CreateMilestoneDto } from "./dto/create-milestone.dto";
import { UpdateMilestoneDto } from "./dto/update-milestone.dto";
import { AuthGuard } from "../../common/guards/auth.guard";
import { WorkspaceGuard } from "../../auth/guards/workspace.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { PermissionGuard } from "../../auth/guards/permission.guard";
import { ProjectRoleGuard } from "../../auth/guards/project-role.guard";
import { RequireProjectRole } from "../../auth/decorators/project-role.decorator";
import type { Request } from "express";

@ApiTags("project-management")
@Controller("project/milestones")
@UseGuards(AuthGuard, WorkspaceGuard, RolesGuard, PermissionGuard, ProjectRoleGuard)
@ApiBearerAuth("JWT-auth")
export class MilestonesController {
  constructor(private readonly milestonesService: MilestonesService) {}

  @Post()
  @RequireProjectRole("MANAGER", "LEAD")
  @ApiOperation({ summary: "Create a new milestone" })
  async create(
    @Body() createMilestoneDto: CreateMilestoneDto,
    @Req() req: Request,
  ): Promise<any> {
    const workspaceId = (req as any).user.workspaceId;
    return this.milestonesService.create(workspaceId, createMilestoneDto);
  }

  @Get()
  @RequireProjectRole("MEMBER", "MANAGER", "LEAD")
  @ApiOperation({ summary: "Get all milestones" })
  @ApiQuery({ name: "projectId", required: false })
  async findAll(
    @Query("projectId") projectId: string,
    @Req() req: Request,
  ): Promise<any[]> {
    const workspaceId = (req as any).user.workspaceId;
    return this.milestonesService.findAll(workspaceId, projectId);
  }

  @Get(":id")
  @RequireProjectRole("MEMBER", "MANAGER", "LEAD")
  @ApiOperation({ summary: "Get milestone by ID" })
  async findOne(@Param("id") id: string, @Req() req: Request): Promise<any> {
    const workspaceId = (req as any).user.workspaceId;
    return this.milestonesService.findOne(workspaceId, id);
  }

  @Put(":id")
  @RequireProjectRole("MANAGER", "LEAD")
  @ApiOperation({ summary: "Update a milestone" })
  async update(
    @Param("id") id: string,
    @Body() updateMilestoneDto: UpdateMilestoneDto,
    @Req() req: Request,
  ): Promise<any> {
    const workspaceId = (req as any).user.workspaceId;
    return this.milestonesService.update(workspaceId, id, updateMilestoneDto);
  }

  @Delete(":id")
  @RequireProjectRole("MANAGER", "LEAD")
  @ApiOperation({ summary: "Delete a milestone" })
  async remove(@Param("id") id: string, @Req() req: Request): Promise<any> {
    const workspaceId = (req as any).user.workspaceId;
    return this.milestonesService.remove(workspaceId, id);
  }
}
