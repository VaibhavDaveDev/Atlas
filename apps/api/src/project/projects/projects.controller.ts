import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiCookieAuth } from "@nestjs/swagger";
import { ProjectsService } from "./projects.service";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";
import {
  AssignProjectMemberDto,
  UpdateProjectMemberDto,
} from "./dto/project-member.dto";
import { AuthGuard } from "../../common/guards/auth.guard";
import { WorkspaceGuard } from "../../auth/guards/workspace.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { PermissionGuard } from "../../auth/guards/permission.guard";
import { RequirePermission } from "../../auth/decorators/require-permission.decorator";
import { ProjectRoleGuard } from "../../auth/guards/project-role.guard";
import { RequireProjectRole } from "../../auth/decorators/project-role.decorator";
import type { Request } from "express";

@ApiTags("project-management")
@Controller("project/projects")
@UseGuards(AuthGuard, WorkspaceGuard, RolesGuard, PermissionGuard, ProjectRoleGuard)
@ApiCookieAuth("better-auth-cookie")
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get("my-projects")
  @RequirePermission({
    resource: "projects",
    action: "read",
    scope: "own",
  })
  @ApiOperation({ summary: "Get projects where current employee is a member" })
  async getMyProjects(@Req() req: Request): Promise<any[]> {
    const workspaceId = (req as any).user.workspaceId;
    const userId = (req as any).user.id;
    return this.projectsService.findAllForEmployee(workspaceId, userId);
  }

  @Get(":id/time-logs")
  @RequireProjectRole("MANAGER", "LEAD")
  @ApiOperation({ summary: "Get all time logs for a project (PM view)" })
  async getTimeLogs(
    @Param("id") id: string,
    @Req() req: Request,
  ): Promise<any[]> {
    const workspaceId = (req as any).user.workspaceId;
    return this.projectsService.getTimeLogs(workspaceId, id);
  }

  @Post(":id/members")
  @RequireProjectRole("MANAGER", "LEAD")
  @ApiOperation({ summary: "Assign a member to a project with a role" })
  async assignMember(
    @Param("id") id: string,
    @Body() dto: AssignProjectMemberDto,
    @Req() req: Request,
  ) {
    const workspaceId = (req as any).user.workspaceId;
    return this.projectsService.assignMember(workspaceId, id, dto);
  }

  @Patch(":id/members/:employeeId")
  @RequireProjectRole("MANAGER", "LEAD")
  @ApiOperation({ summary: "Update a project member's role" })
  async updateMemberRole(
    @Param("id") id: string,
    @Param("employeeId") employeeId: string,
    @Body() dto: UpdateProjectMemberDto,
    @Req() req: Request,
  ) {
    const workspaceId = (req as any).user.workspaceId;
    return this.projectsService.updateMemberRole(
      workspaceId,
      id,
      employeeId,
      dto,
    );
  }

  @Delete(":id/members/:employeeId")
  @RequireProjectRole("MANAGER", "LEAD")
  @ApiOperation({ summary: "Remove a member from a project" })
  async removeMember(
    @Param("id") id: string,
    @Param("employeeId") employeeId: string,
    @Req() req: Request,
  ) {
    const workspaceId = (req as any).user.workspaceId;
    return this.projectsService.removeMember(workspaceId, id, employeeId);
  }

  @Post()
  @RequirePermission({
    resource: "projects",
    action: "create",
    scope: "all",
  })
  @ApiOperation({ summary: "Create a new project" })
  async create(
    @Body() createProjectDto: CreateProjectDto,
    @Req() req: Request,
  ): Promise<any> {
    const workspaceId = (req as any).user.workspaceId;
    const userId = (req as any).user.id;
    return this.projectsService.create(workspaceId, createProjectDto, userId);
  }

  @Get()
  @RequirePermission({
    resource: "projects",
    action: "read",
    scope: "all",
  })
  @ApiOperation({ summary: "Get all projects" })
  async findAll(@Req() req: Request): Promise<any[]> {
    const workspaceId = (req as any).user.workspaceId;
    return this.projectsService.findAll(workspaceId);
  }

  @Get(":id")
  @RequireProjectRole("MEMBER", "MANAGER", "LEAD")
  @ApiOperation({ summary: "Get project by ID" })
  async findOne(@Param("id") id: string, @Req() req: Request): Promise<any> {
    const workspaceId = (req as any).user.workspaceId;
    return this.projectsService.findOne(workspaceId, id);
  }

  @Put(":id")
  @RequireProjectRole("MANAGER", "LEAD")
  @ApiOperation({ summary: "Update a project" })
  async update(
    @Param("id") id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @Req() req: Request,
  ): Promise<any> {
    const workspaceId = (req as any).user.workspaceId;
    return this.projectsService.update(workspaceId, id, updateProjectDto);
  }

  @Delete(":id")
  @RequirePermission({
    resource: "projects",
    action: "delete",
    scope: "own",
  })
  @ApiOperation({ summary: "Delete a project" })
  async remove(@Param("id") id: string, @Req() req: Request): Promise<any> {
    const workspaceId = (req as any).user.workspaceId;
    return this.projectsService.remove(workspaceId, id);
  }
}
