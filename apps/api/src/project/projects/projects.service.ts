import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../common/services/prisma.service";
import { CustomLoggerService } from "../../common/services/custom-logger.service";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";
import {
  AssignProjectMemberDto,
  UpdateProjectMemberDto,
} from "./dto/project-member.dto";
import {
  Project,
  ProjectRole,
  Employee,
  TimeLog,
  ProjectMember,
} from "@atlas/database";

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: CustomLoggerService,
  ) {}

  async findEmployeeByUserId(
    workspaceId: string,
    userId: string,
  ): Promise<Employee> {
    const employee = await this.prisma.employee.findFirst({
      where: { userId, workspaceId },
    });
    if (!employee) {
      throw new NotFoundException("Employee profile not found for this user");
    }
    return employee;
  }

  async findAllForEmployee(
    workspaceId: string,
    userId: string,
  ): Promise<Project[]> {
    const employee = await this.findEmployeeByUserId(workspaceId, userId);

    return this.prisma.project.findMany({
      where: {
        workspaceId,
        members: {
          some: {
            employeeId: employee.id,
          },
        },
      },
      include: {
        milestones: true,
        members: {
          include: {
            employee: true,
          },
        },
        _count: {
          select: { tasks: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async assignMember(
    workspaceId: string,
    projectId: string,
    dto: AssignProjectMemberDto,
  ): Promise<ProjectMember> {
    const project = await this.findOne(workspaceId, projectId);

    return this.prisma.projectMember.upsert({
      where: {
        projectId_employeeId: {
          projectId,
          employeeId: dto.employeeId,
        },
      },
      update: {
        role: dto.role,
      },
      create: {
        projectId,
        employeeId: dto.employeeId,
        role: dto.role,
      },
    });
  }

  async updateMemberRole(
    workspaceId: string,
    projectId: string,
    employeeId: string,
    dto: UpdateProjectMemberDto,
  ): Promise<ProjectMember> {
    return this.prisma.projectMember.update({
      where: {
        projectId_employeeId: {
          projectId,
          employeeId,
        },
      },
      data: {
        role: dto.role,
      },
    });
  }

  async removeMember(
    workspaceId: string,
    projectId: string,
    employeeId: string,
  ): Promise<ProjectMember> {
    return this.prisma.projectMember.delete({
      where: {
        projectId_employeeId: {
          projectId,
          employeeId,
        },
      },
    });
  }

  async getTimeLogs(
    workspaceId: string,
    projectId: string,
  ): Promise<TimeLog[]> {
    return this.prisma.timeLog.findMany({
      where: {
        workspaceId,
        task: {
          projectId,
        },
      },
      include: {
        employee: true,
        task: {
          select: {
            title: true,
            taskNumber: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });
  }

  async create(
    workspaceId: string,
    createProjectDto: CreateProjectDto,
    userId: string,
  ): Promise<Project> {
    this.logger.log(
      `Creating project: ${createProjectDto.projectName}`,
      "ProjectsService",
    );

    // Check if project code already exists in workspace
    const existing = await this.prisma.project.findUnique({
      where: {
        workspaceId_projectCode: {
          workspaceId,
          projectCode: createProjectDto.projectCode,
        },
      },
    });

    if (existing) {
      throw new BadRequestException("Project code already exists");
    }

    return this.prisma.project.create({
      data: {
        ...createProjectDto,
        workspaceId,
        createdBy: userId,
      },
    });
  }

  async findAll(workspaceId: string): Promise<Project[]> {
    return this.prisma.project.findMany({
      where: { workspaceId },
      include: {
        milestones: true,
        tasks: {
          select: { status: true },
        },
        _count: {
          select: { tasks: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(workspaceId: string, id: string): Promise<Project> {
    const project = await this.prisma.project.findFirst({
      where: { 
        id, 
        workspaceId,
      },
      include: {
        milestones: true,
        members: {
          include: {
            employee: {
              include: {
                designation: true,
              },
            },
          },
        },
        tasks: {
          include: {
            assignments: {
              include: {
                employee: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return project;
  }

  async update(
    workspaceId: string,
    id: string,
    updateProjectDto: UpdateProjectDto,
  ): Promise<Project> {
    this.logger.log(`Updating project: ${id}`, "ProjectsService");

    const project = await this.findOne(workspaceId, id);

    // If project code is being changed, check for uniqueness
    if (
      updateProjectDto.projectCode &&
      updateProjectDto.projectCode !== project.projectCode
    ) {
      const existing = await this.prisma.project.findUnique({
        where: {
          workspaceId_projectCode: {
            workspaceId,
            projectCode: updateProjectDto.projectCode,
          },
        },
      });

      if (existing) {
        throw new BadRequestException("Project code already exists");
      }
    }

    return this.prisma.project.update({
      where: { id },
      data: updateProjectDto,
    });
  }

  async remove(workspaceId: string, id: string): Promise<Project> {
    this.logger.warn(`Removing project: ${id}`, "ProjectsService");

    // Check if it has tasks
    const tasksCount = await this.prisma.task.count({
      where: { projectId: id },
    });

    if (tasksCount > 0) {
      throw new BadRequestException(
        "Cannot delete project with existing tasks",
      );
    }

    return this.prisma.project.delete({
      where: { id },
    });
  }

  async recalculateActualCost(
    workspaceId: string,
    id: string,
  ): Promise<Project> {
    const taskAssignments = await this.prisma.taskAssignment.findMany({
      where: {
        task: {
          projectId: id,
          workspaceId,
        },
      },
    });

    // For now, let's assume a flat rate of 50 per hour if we don't have employee rates
    const totalWorkedHours = taskAssignments.reduce(
      (sum, assignment) => sum + assignment.workedHours,
      0,
    );
    const calculatedCost = totalWorkedHours * 50;

    return this.prisma.project.update({
      where: { id },
      data: {
        actualCost: calculatedCost,
      },
    });
  }
}
