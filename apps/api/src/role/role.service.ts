import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../common/services/prisma.service";
import { CreateRoleDto } from "./dto/create-role.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";

@Injectable()
export class RoleService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllRoles(workspaceId: string) {
    return this.prisma.role.findMany({
      where: { workspaceId },
      include: {
        _count: {
          select: { members: { where: { isActive: true } } },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async getRole(workspaceId: string, roleId: string) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });

    if (!role || role.workspaceId !== workspaceId) {
      throw new NotFoundException("Role not found");
    }

    return role;
  }

  async createRole(workspaceId: string, dto: CreateRoleDto) {
    const existing = await this.prisma.role.findUnique({
      where: { workspaceId_name: { workspaceId, name: dto.name } },
    });

    if (existing) {
      throw new BadRequestException(
        `Role '${dto.name}' already exists in this workspace`,
      );
    }

    return this.prisma.role.create({
      data: {
        workspaceId,
        name: dto.name,
        description: dto.description,
      },
    });
  }

  async updateRole(workspaceId: string, roleId: string, dto: UpdateRoleDto) {
    const role = await this.getRole(workspaceId, roleId);

    // Check name collision if name is being changed
    if (dto.name && dto.name !== role.name) {
      const existing = await this.prisma.role.findUnique({
        where: { workspaceId_name: { workspaceId, name: dto.name } },
      });

      if (existing && existing.id !== roleId) {
        throw new BadRequestException(
          `Role '${dto.name}' already exists in this workspace`,
        );
      }
    }

    return this.prisma.role.update({
      where: { id: roleId },
      data: {
        name: dto.name,
        description: dto.description,
      },
    });
  }

  async deleteRole(workspaceId: string, roleId: string) {
    const role = await this.getRole(workspaceId, roleId);

    // Protect system default roles
    if (["OWNER", "ADMIN", "USER"].includes(role.name)) {
      throw new BadRequestException("Cannot delete system default roles");
    }

    // Check if role has active members
    const memberCount = await this.prisma.workspaceMember.count({
      where: { workspaceId, roleId, isActive: true },
    });

    if (memberCount > 0) {
      throw new BadRequestException(
        `Cannot delete role with active members. Please reassign ${memberCount} members first.`,
      );
    }

    await this.prisma.role.delete({
      where: { id: roleId },
    });

    return { success: true, message: "Role deleted successfully" };
  }

  // ─────────────────────────────────────────────
  // PERMISSIONS
  // ─────────────────────────────────────────────

  async findAllPermissions(workspaceId: string) {
    // Returns global permissions (workspaceId = null) and workspace-specific permissions
    return this.prisma.permission.findMany({
      where: {
        OR: [{ workspaceId: null }, { workspaceId }],
      },
      orderBy: [{ resource: "asc" }, { action: "asc" }],
    });
  }

  async updateRolePermissions(
    workspaceId: string,
    roleId: string,
    permissionIds: string[],
  ) {
    await this.getRole(workspaceId, roleId); // Verify role exists

    // Verify all permissionIds are valid
    if (permissionIds.length > 0) {
      const validPermissions = await this.prisma.permission.count({
        where: {
          id: { in: permissionIds },
          OR: [{ workspaceId: null }, { workspaceId }],
        },
      });

      if (validPermissions !== permissionIds.length) {
        throw new BadRequestException(
          "One or more invalid permission IDs provided",
        );
      }
    }

    // In a transaction: delete existing and create new
    return this.prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({
        where: { workspaceId, roleId },
      });

      if (permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map((permId) => ({
            workspaceId,
            roleId,
            permissionId: permId,
          })),
        });
      }

      return {
        success: true,
        message: "Role permissions updated successfully",
      };
    });
  }

  // ─────────────────────────────────────────────
  // CUSTOM USER PERMISSIONS
  // ─────────────────────────────────────────────

  async getUserPermissions(workspaceId: string, userId: string) {
    return this.prisma.userPermission.findMany({
      where: { workspaceId, userId },
      include: { permission: true },
    });
  }

  /**
   * Get combined permissions for a user (Role + Custom Overrides)
   */
  async getEffectiveUserPermissions(workspaceId: string, userId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      include: {
        role: { include: { permissions: { include: { permission: true } } } },
      },
    });

    if (!member) {
      throw new NotFoundException("User is not a member of this workspace");
    }

    const customPermissions = await this.prisma.userPermission.findMany({
      where: { workspaceId, userId },
      include: { permission: true },
    });

    // Combine them
    const rolePermissions = member.role.permissions.map((rp) => rp.permission);
    const userSpecificPermissions = customPermissions.map(
      (up) => up.permission,
    );

    return {
      role: {
        id: member.role.id,
        name: member.role.name,
        permissions: rolePermissions,
      },
      custom: userSpecificPermissions,
      // Map of all permissions for easy UI ticking
      effective: [...rolePermissions, ...userSpecificPermissions],
    };
  }

  async updateUserPermissions(
    workspaceId: string,
    targetUserId: string,
    grantedById: string,
    permissionIds: string[],
  ) {
    // Verify target user is in workspace
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
    });

    if (!member) {
      throw new NotFoundException("User is not a member of this workspace");
    }

    // Verify all permissionIds are valid
    if (permissionIds.length > 0) {
      const validPermissions = await this.prisma.permission.count({
        where: {
          id: { in: permissionIds },
          OR: [{ workspaceId: null }, { workspaceId }],
        },
      });

      if (validPermissions !== permissionIds.length) {
        throw new BadRequestException(
          "One or more invalid permission IDs provided",
        );
      }
    }

    // In a transaction: delete existing and create new
    return this.prisma.$transaction(async (tx) => {
      await tx.userPermission.deleteMany({
        where: { workspaceId, userId: targetUserId },
      });

      if (permissionIds.length > 0) {
        await tx.userPermission.createMany({
          data: permissionIds.map((permId) => ({
            workspaceId,
            userId: targetUserId,
            permissionId: permId,
            grantedBy: grantedById,
          })),
        });
      }

      return {
        success: true,
        message: "User custom permissions updated successfully",
      };
    });
  }
}
