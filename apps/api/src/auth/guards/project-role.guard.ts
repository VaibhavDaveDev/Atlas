import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "../../common/services/prisma.service";
import { PROJECT_ROLE_KEY } from "../decorators/project-role.decorator";
import { ProjectRole } from "@atlas/database";

@Injectable()
export class ProjectRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prismaService: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<ProjectRole[]>(
      PROJECT_ROLE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException("User not authenticated");
    }

    // Workspace Admins/Owners bypass project-specific checks
    if (
      user.globalRole === "SUPERADMIN" ||
      user.workspaceRole === "OWNER" ||
      user.workspaceRole === "ADMIN"
    ) {
      return true;
    }

    const workspaceId = user.workspaceId;
    const userId = user.id;

    // Extract projectId from various possible locations
    let projectId =
      request.params?.projectId ||
      request.body?.projectId ||
      request.query?.projectId;

    // If it's a direct project resource (e.g. GET /projects/:id)
    if (!projectId && request.params.id && request.url.includes("/projects/")) {
      projectId = request.params.id;
    }

    // If it's a task resource (e.g. PUT /tasks/:id)
    if (!projectId && request.params.id && request.url.includes("/tasks/")) {
      const task = await this.prismaService.task.findUnique({
        where: { id: request.params.id, workspaceId },
        select: { projectId: true },
      });
      if (task) {
        projectId = task.projectId;
      }
    }

    if (!projectId) {
      throw new ForbiddenException("Project context could not be determined");
    }

    // Get the employee profile for the user
    const employee = await this.prismaService.employee.findFirst({
      where: { userId, workspaceId, deletedAt: null },
      select: { id: true },
    });

    if (!employee) {
      throw new ForbiddenException("Employee profile not found");
    }

    // Check project membership and role
    const projectMember = await this.prismaService.projectMember.findUnique({
      where: {
        projectId_employeeId: {
          projectId,
          employeeId: employee.id,
        },
      },
    });

    // If they have the required project role, they are good
    if (projectMember && requiredRoles.includes(projectMember.role)) {
      return true;
    }

    // SPECIAL CASE: If it's a task resource and user is the assignee, they might be allowed
    // to update status/log time even if they aren't a LEAD.
    // We only allow this if the required roles include a special 'ASSIGNEE' keyword or similar.
    // For now, let's just check if they are assigned if no specific project role matched.
    if (request.params.id && request.url.includes("/tasks/")) {
      const assignment = await this.prismaService.taskAssignment.findUnique({
        where: {
          taskId_employeeId: {
            taskId: request.params.id,
            employeeId: employee.id,
          },
        },
      });
      if (assignment) {
        return true;
      }
    }

    throw new ForbiddenException(
      `You do not have the required project permissions`,
    );
  }
}
