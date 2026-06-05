import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../common/services/prisma.service";
import { CustomLoggerService } from "../../common/services/custom-logger.service";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { CreateTimeLogDto } from "./dto/create-time-log.dto";
import { Task, TaskAssignment, Employee, TimeLog } from "@atlas/database";

@Injectable()
export class TasksService {
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
  ): Promise<Task[]> {
    const employee = await this.findEmployeeByUserId(workspaceId, userId);

    const tasks = await this.prisma.task.findMany({
      where: {
        workspaceId,
        assignments: {
          some: {
            employeeId: employee.id,
          },
        },
      },
      include: {
        project: {
          include: {
            members: {
              where: {
                employeeId: employee.id,
              },
            },
          },
        },
        assignments: {
          include: {
            employee: true,
          },
        },
      },
      orderBy: { dueDate: "asc" },
    });

    return tasks;
  }

  async logTime(
    workspaceId: string,
    taskId: string,
    userId: string,
    dto: CreateTimeLogDto,
  ): Promise<TimeLog> {
    const employee = await this.findEmployeeByUserId(workspaceId, userId);

    // Verify task exists and employee is assigned
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, workspaceId },
    });

    if (!task) {
      throw new NotFoundException("Task not found");
    }

    const assignment = await this.prisma.taskAssignment.findFirst({
      where: { taskId, employeeId: employee.id },
    });

    if (!assignment) {
      throw new BadRequestException("You are not assigned to this task");
    }

    const timeLog = await this.prisma.timeLog.create({
      data: {
        workspaceId,
        taskId,
        employeeId: employee.id,
        hours: dto.hours,
        description: dto.description,
        date: new Date(dto.date),
      },
    });

    // Update assignment worked hours
    const totalHours = await this.prisma.timeLog.aggregate({
      where: { taskId, employeeId: employee.id },
      _sum: { hours: true },
    });

    await this.prisma.taskAssignment.update({
      where: { taskId_employeeId: { taskId, employeeId: employee.id } },
      data: { workedHours: totalHours._sum.hours?.toNumber() || 0 },
    });

    // Recalculate task total hours
    const taskTotal = await this.prisma.taskAssignment.aggregate({
      where: { taskId },
      _sum: { workedHours: true },
    });

    await this.prisma.task.update({
      where: { id: taskId },
      data: { actualHours: taskTotal._sum.workedHours || 0 },
    });

    // Recalculate project cost
    await this.recalculateProjectCost(workspaceId, task.projectId);

    return timeLog;
  }

  async create(
    workspaceId: string,
    createTaskDto: CreateTaskDto,
    userId: string,
  ): Promise<Task> {
    this.logger.log(`Creating task: ${createTaskDto.title}`, "TasksService");

    // Verify project exists in workspace
    const project = await this.prisma.project.findFirst({
      where: { id: createTaskDto.projectId, workspaceId },
    });

    if (!project) {
      throw new BadRequestException("Project not found in workspace");
    }

    // Check if task number already exists in workspace (if provided)
    if (createTaskDto.taskNumber) {
      const existing = await this.prisma.task.findUnique({
        where: {
          workspaceId_taskNumber: {
            workspaceId,
            taskNumber: createTaskDto.taskNumber,
          },
        },
      });

      if (existing) {
        throw new BadRequestException("Task number already exists");
      }
    }

    const { assigneeId, allocatedHours, ...taskData } = createTaskDto;

    // Auto-generate task number if not provided
    if (!taskData.taskNumber) {
      const taskCount = await this.prisma.task.count({
        where: { projectId: project.id, workspaceId },
      });
      taskData.taskNumber = `${project.projectCode}-${taskCount + 1}`;
    }

    // Double check uniqueness
    const existingTask = await this.prisma.task.findUnique({
      where: {
        workspaceId_taskNumber: {
          workspaceId,
          taskNumber: taskData.taskNumber,
        },
      },
    });

    if (existingTask) {
      taskData.taskNumber += `-${Math.floor(Math.random() * 1000)}`;
    }

    const task = await this.prisma.task.create({
      data: {
        ...taskData,
        taskNumber: taskData.taskNumber,
        workspaceId,
        createdBy: userId,
      },
    });

    if (assigneeId) {
      await this.assign(workspaceId, task.id, assigneeId, allocatedHours || 0);
    }

    return task;
  }

  async findAll(workspaceId: string, projectId?: string): Promise<Task[]> {
    return this.prisma.task.findMany({
      where: {
        workspaceId,
        ...(projectId ? { projectId } : {}),
      },
      include: {
        assignments: {
          include: {
            employee: true,
          },
        },
        dependsOnTask: true,
        project: {
          select: {
            projectName: true,
            projectCode: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(workspaceId: string, id: string): Promise<Task> {
    const task = await this.prisma.task.findFirst({
      where: { id, workspaceId },
      include: {
        assignments: {
          include: {
            employee: true,
          },
        },
        timeLogs: {
          include: {
            employee: true,
          },
          orderBy: { date: "desc" },
          take: 10,
        },
        dependsOnTask: true,
        dependentTasks: true,
      },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return task;
  }

  async update(
    workspaceId: string,
    id: string,
    updateTaskDto: UpdateTaskDto,
    userId: string,
  ): Promise<Task> {
    this.logger.log(`Updating task: ${id}`, "TasksService");

    const task = await this.findOne(workspaceId, id);

    // If task number is being changed, check for uniqueness
    if (
      updateTaskDto.taskNumber &&
      updateTaskDto.taskNumber !== task.taskNumber
    ) {
      const existing = await this.prisma.task.findUnique({
        where: {
          workspaceId_taskNumber: {
            workspaceId,
            taskNumber: updateTaskDto.taskNumber,
          },
        },
      });

      if (existing) {
        throw new BadRequestException("Task number already exists");
      }
    }

    // Dependency check: prevent marking DONE if dependsOnTask is not DONE
    if (updateTaskDto.status === "DONE") {
      const taskWithDeps = await this.prisma.task.findUnique({
        where: { id },
        include: { dependsOnTask: true },
      });

      if (
        taskWithDeps?.dependsOnTask &&
        taskWithDeps.dependsOnTask.status !== "DONE"
      ) {
        throw new BadRequestException(
          `Cannot mark task as DONE because its dependency (${taskWithDeps.dependsOnTask.taskNumber}) is not DONE`,
        );
      }
    }

    return this.prisma.task.update({
      where: { id },
      data: updateTaskDto,
    });
  }

  async remove(workspaceId: string, id: string): Promise<Task> {
    this.logger.warn(`Removing task: ${id}`, "TasksService");

    return this.prisma.task.delete({
      where: { id },
    });
  }

  async getKanban(workspaceId: string, projectId: string): Promise<any> {
    const tasks = await this.prisma.task.findMany({
      where: { workspaceId, projectId },
      include: {
        assignments: {
          include: {
            employee: true,
          },
        },
      },
    });

    // Group by status
    const kanban = {
      TODO: tasks.filter((t) => t.status === "TODO"),
      IN_PROGRESS: tasks.filter((t) => t.status === "IN_PROGRESS"),
      REVIEW: tasks.filter((t) => t.status === "REVIEW"),
      DONE: tasks.filter((t) => t.status === "DONE"),
      CANCELLED: tasks.filter((t) => t.status === "CANCELLED"),
    };

    return kanban;
  }

  async assign(
    workspaceId: string,
    taskId: string,
    employeeId: string,
    allocatedHours: number = 0,
  ): Promise<TaskAssignment> {
    this.logger.log(
      `Assigning employee ${employeeId} to task ${taskId}`,
      "TasksService",
    );

    // Verify task exists in workspace
    const task = await this.findOne(workspaceId, taskId);

    // Verify employee exists in workspace
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, workspaceId },
    });

    if (!employee) {
      throw new BadRequestException("Employee not found in workspace");
    }

    return this.prisma.taskAssignment.upsert({
      where: {
        taskId_employeeId: {
          taskId,
          employeeId,
        },
      },
      update: {
        allocatedHours,
      },
      create: {
        taskId,
        employeeId,
        allocatedHours,
      },
    });
  }

  async unassign(
    workspaceId: string,
    taskId: string,
    employeeId: string,
  ): Promise<TaskAssignment> {
    this.logger.log(
      `Unassigning employee ${employeeId} from task ${taskId}`,
      "TasksService",
    );

    // Verify task exists in workspace
    await this.findOne(workspaceId, taskId);

    return this.prisma.taskAssignment.delete({
      where: {
        taskId_employeeId: {
          taskId,
          employeeId,
        },
      },
    });
  }

  async updateWorkedHours(
    workspaceId: string,
    taskId: string,
    employeeId: string,
    workedHours: number,
  ): Promise<TaskAssignment> {
    const task = await this.findOne(workspaceId, taskId);

    const assignment = await this.prisma.taskAssignment.update({
      where: {
        taskId_employeeId: {
          taskId,
          employeeId,
        },
      },
      data: {
        workedHours,
      },
    });

    // Update task's actual hours
    const allAssignments = await this.prisma.taskAssignment.findMany({
      where: { taskId },
    });
    const totalTaskHours = allAssignments.reduce(
      (sum, a) => sum + a.workedHours,
      0,
    );

    await this.prisma.task.update({
      where: { id: taskId },
      data: { actualHours: totalTaskHours },
    });

    // Update project's actual cost
    await this.recalculateProjectCost(workspaceId, task.projectId);

    return assignment;
  }

  private async recalculateProjectCost(workspaceId: string, projectId: string) {
    const taskAssignments = await this.prisma.taskAssignment.findMany({
      where: {
        task: {
          projectId,
          workspaceId,
        },
      },
    });

    const totalWorkedHours = taskAssignments.reduce(
      (sum, assignment) => sum + assignment.workedHours,
      0,
    );
    // Assume a flat rate of 50 for now
    const calculatedCost = totalWorkedHours * 50;

    await this.prisma.project.update({
      where: { id: projectId },
      data: {
        actualCost: calculatedCost,
      },
    });
  }
}
