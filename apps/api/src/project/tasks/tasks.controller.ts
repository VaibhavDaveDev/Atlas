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
  ApiCookieAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { TasksService } from "./tasks.service";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { CreateTimeLogDto } from "./dto/create-time-log.dto";
import { AuthGuard } from "../../common/guards/auth.guard";
import { WorkspaceGuard } from "../../auth/guards/workspace.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { PermissionGuard } from "../../auth/guards/permission.guard";
import { RequirePermission } from "../../auth/decorators/require-permission.decorator";
import { ProjectRoleGuard } from "../../auth/guards/project-role.guard";
import { RequireProjectRole } from "../../auth/decorators/project-role.decorator";
import type { Request } from "express";

@ApiTags("project-management")
@Controller("project/tasks")
@UseGuards(AuthGuard, WorkspaceGuard, RolesGuard, PermissionGuard, ProjectRoleGuard)
@ApiCookieAuth("better-auth-cookie")
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get("my-tasks")
  @RequirePermission({
    resource: "projects",
    action: "read",
    scope: "own",
  })
  @ApiOperation({ summary: "Get tasks assigned to current employee" })
  async getMyTasks(@Req() req: Request): Promise<any[]> {
    const workspaceId = (req as any).user.workspaceId;
    const userId = (req as any).user.id;
    return this.tasksService.findAllForEmployee(workspaceId, userId);
  }

  @Post(":id/time-log")
  @RequireProjectRole("MEMBER", "MANAGER", "LEAD")
  @ApiOperation({ summary: "Log time for a task" })
  async logTime(
    @Param("id") id: string,
    @Body() createTimeLogDto: CreateTimeLogDto,
    @Req() req: Request,
  ): Promise<any> {
    const workspaceId = (req as any).user.workspaceId;
    const userId = (req as any).user.id;
    return this.tasksService.logTime(workspaceId, id, userId, createTimeLogDto);
  }

  @Post()
  @RequireProjectRole("MANAGER", "LEAD")
  @ApiOperation({ summary: "Create a new task" })
  async create(
    @Body() createTaskDto: CreateTaskDto,
    @Req() req: Request,
  ): Promise<any> {
    const workspaceId = (req as any).user.workspaceId;
    const userId = (req as any).user.id;
    return this.tasksService.create(workspaceId, createTaskDto, userId);
  }

  @Get()
  @RequirePermission({
    resource: "projects",
    action: "read",
    scope: "own",
  })
  @ApiOperation({ summary: "Get all tasks" })
  @ApiQuery({ name: "projectId", required: false })
  async findAll(
    @Query("projectId") projectId: string,
    @Req() req: Request,
  ): Promise<any[]> {
    const workspaceId = (req as any).user.workspaceId;
    return this.tasksService.findAll(workspaceId, projectId);
  }

  @Get("kanban")
  @RequireProjectRole("MEMBER", "MANAGER", "LEAD")
  @ApiOperation({ summary: "Get tasks grouped for Kanban" })
  @ApiQuery({ name: "projectId", required: true })
  async getKanban(
    @Query("projectId") projectId: string,
    @Req() req: Request,
  ): Promise<any> {
    const workspaceId = (req as any).user.workspaceId;
    return this.tasksService.getKanban(workspaceId, projectId);
  }

  @Get(":id")
  @RequireProjectRole("MEMBER", "MANAGER", "LEAD")
  @ApiOperation({ summary: "Get task by ID" })
  async findOne(@Param("id") id: string, @Req() req: Request): Promise<any> {
    const workspaceId = (req as any).user.workspaceId;
    return this.tasksService.findOne(workspaceId, id);
  }

  @Put(":id")
  @RequireProjectRole("MANAGER", "LEAD")
  @ApiOperation({ summary: "Update a task" })
  async update(
    @Param("id") id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Req() req: Request,
  ): Promise<any> {
    const workspaceId = (req as any).user.workspaceId;
    const userId = (req as any).user.id;
    return this.tasksService.update(workspaceId, id, updateTaskDto, userId);
  }

  @Delete(":id")
  @RequireProjectRole("MANAGER", "LEAD")
  @ApiOperation({ summary: "Delete a task" })
  async remove(@Param("id") id: string, @Req() req: Request): Promise<any> {
    const workspaceId = (req as any).user.workspaceId;
    return this.tasksService.remove(workspaceId, id);
  }

  @Post(":id/assign")
  @RequireProjectRole("MANAGER", "LEAD")
  @ApiOperation({ summary: "Assign employee to task" })
  async assign(
    @Param("id") id: string,
    @Body("employeeId") employeeId: string,
    @Body("allocatedHours") allocatedHours: number,
    @Req() req: Request,
  ): Promise<any> {
    const workspaceId = (req as any).user.workspaceId;
    return this.tasksService.assign(
      workspaceId,
      id,
      employeeId,
      allocatedHours,
    );
  }

  @Delete(":id/assign/:employeeId")
  @RequireProjectRole("MANAGER", "LEAD")
  @ApiOperation({ summary: "Unassign employee from task" })
  async unassign(
    @Param("id") id: string,
    @Param("employeeId") employeeId: string,
    @Req() req: Request,
  ): Promise<any> {
    const workspaceId = (req as any).user.workspaceId;
    return this.tasksService.unassign(workspaceId, id, employeeId);
  }

  @Put(":id/worked-hours")
  @RequireProjectRole("MANAGER", "LEAD")
  @ApiOperation({ summary: "Update worked hours for a task assignment" })
  async updateWorkedHours(
    @Param("id") id: string,
    @Body("employeeId") employeeId: string,
    @Body("workedHours") workedHours: number,
    @Req() req: Request,
  ): Promise<any> {
    const workspaceId = (req as any).user.workspaceId;
    return this.tasksService.updateWorkedHours(
      workspaceId,
      id,
      employeeId,
      workedHours,
    );
  }
}

