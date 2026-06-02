import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { RoleService } from "./role.service";
import { AuthGuard } from "../common/guards/auth.guard";
import { WorkspaceGuard } from "../auth/guards/workspace.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { PermissionGuard } from "../auth/guards/permission.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { RequirePermission } from "../auth/decorators/require-permission.decorator";
import { CreateRoleDto } from "./dto/create-role.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";
import { UpdateRolePermissionsDto } from "./dto/update-role-permissions.dto";
import { UpdateUserPermissionsDto } from "./dto/update-user-permissions.dto";
import type { Request } from "express";

@ApiTags("roles")
@Controller("workspaces/:workspaceId/roles")
@UseGuards(AuthGuard, WorkspaceGuard, RolesGuard, PermissionGuard)
@ApiBearerAuth("JWT-auth")
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  // ─────────────────────────────────────────────
  // ROLE CRUD
  // ─────────────────────────────────────────────

  @Get()
  @RequirePermission({ resource: "roles", action: "read", scope: "all" })
  @ApiOperation({ summary: "List all custom roles in the workspace" })
  @ApiParam({ name: "workspaceId", description: "Workspace ID" })
  async findAll(@Param("workspaceId") workspaceId: string) {
    return this.roleService.findAllRoles(workspaceId);
  }

  @Post()
  @RequirePermission({ resource: "roles", action: "create", scope: "all" })
  @ApiOperation({ summary: "Create a new custom role" })
  @ApiParam({ name: "workspaceId", description: "Workspace ID" })
  async createRole(
    @Param("workspaceId") workspaceId: string,
    @Body() dto: CreateRoleDto,
  ) {
    return this.roleService.createRole(workspaceId, dto);
  }

  @Get(":roleId")
  @RequirePermission({ resource: "roles", action: "read", scope: "all" })
  @ApiOperation({ summary: "Get a specific role with its permissions" })
  @ApiParam({ name: "workspaceId", description: "Workspace ID" })
  @ApiParam({ name: "roleId", description: "Role ID" })
  async getRole(
    @Param("workspaceId") workspaceId: string,
    @Param("roleId") roleId: string,
  ) {
    return this.roleService.getRole(workspaceId, roleId);
  }

  @Patch(":roleId")
  @RequirePermission({ resource: "roles", action: "update", scope: "all" })
  @ApiOperation({ summary: "Update a custom role" })
  @ApiParam({ name: "workspaceId", description: "Workspace ID" })
  @ApiParam({ name: "roleId", description: "Role ID" })
  async updateRole(
    @Param("workspaceId") workspaceId: string,
    @Param("roleId") roleId: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.roleService.updateRole(workspaceId, roleId, dto);
  }

  @Delete(":roleId")
  @RequirePermission({ resource: "roles", action: "delete", scope: "all" })
  @ApiOperation({ summary: "Delete a custom role" })
  @ApiParam({ name: "workspaceId", description: "Workspace ID" })
  @ApiParam({ name: "roleId", description: "Role ID" })
  async deleteRole(
    @Param("workspaceId") workspaceId: string,
    @Param("roleId") roleId: string,
  ) {
    return this.roleService.deleteRole(workspaceId, roleId);
  }

  // ─────────────────────────────────────────────
  // PERMISSIONS
  // ─────────────────────────────────────────────

  @Get("permissions/all")
  @RequirePermission({ resource: "roles", action: "read", scope: "all" })
  @ApiOperation({
    summary: "Get all available system permissions (matrix data)",
  })
  @ApiParam({ name: "workspaceId", description: "Workspace ID" })
  async getAllPermissions(@Param("workspaceId") workspaceId: string) {
    return this.roleService.findAllPermissions(workspaceId);
  }

  @Patch(":roleId/permissions")
  @RequirePermission({ resource: "roles", action: "manage", scope: "all" })
  @ApiOperation({ summary: "Assign permissions to a specific role" })
  @ApiParam({ name: "workspaceId", description: "Workspace ID" })
  @ApiParam({ name: "roleId", description: "Role ID" })
  async updateRolePermissions(
    @Param("workspaceId") workspaceId: string,
    @Param("roleId") roleId: string,
    @Body() dto: UpdateRolePermissionsDto,
  ) {
    return this.roleService.updateRolePermissions(
      workspaceId,
      roleId,
      dto.permissionIds,
    );
  }

  // ─────────────────────────────────────────────
  // CUSTOM USER PERMISSIONS
  // ─────────────────────────────────────────────

  @Get("users/:userId/permissions")
  @RequirePermission({ resource: "roles", action: "read", scope: "all" })
  @ApiOperation({
    summary: "Get custom permissions assigned to a specific user",
  })
  @ApiParam({ name: "workspaceId", description: "Workspace ID" })
  @ApiParam({ name: "userId", description: "User ID" })
  async getUserPermissions(
    @Param("workspaceId") workspaceId: string,
    @Param("userId") userId: string,
  ) {
    return this.roleService.getUserPermissions(workspaceId, userId);
  }

  @Get("users/:userId/permissions/effective")
  @RequirePermission({ resource: "roles", action: "read", scope: "all" })
  @ApiOperation({
    summary: "Get effective permissions (Role + Custom) for a specific user",
  })
  @ApiParam({ name: "workspaceId", description: "Workspace ID" })
  @ApiParam({ name: "userId", description: "User ID" })
  async getEffectivePermissions(
    @Param("workspaceId") workspaceId: string,
    @Param("userId") userId: string,
  ) {
    return this.roleService.getEffectiveUserPermissions(workspaceId, userId);
  }

  @Patch("users/:userId/permissions")
  @RequirePermission({ resource: "roles", action: "manage", scope: "all" })
  @ApiOperation({ summary: "Assign custom permissions to a specific user" })
  @ApiParam({ name: "workspaceId", description: "Workspace ID" })
  @ApiParam({ name: "userId", description: "User ID" })
  async updateUserPermissions(
    @Param("workspaceId") workspaceId: string,
    @Param("userId") targetUserId: string,
    @Body() dto: UpdateUserPermissionsDto,
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    return this.roleService.updateUserPermissions(
      workspaceId,
      targetUserId,
      user.userId,
      dto.permissionIds,
    );
  }
}
