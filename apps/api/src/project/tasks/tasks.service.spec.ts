import { Test, TestingModule } from "@nestjs/testing";
import { TasksService } from "./tasks.service";
import { PrismaService } from "../../common/services/prisma.service";
import { CustomLoggerService } from "../../common/services/custom-logger.service";
import { BadRequestException } from "@nestjs/common";

describe("TasksService", () => {
  let service: TasksService;
  let prisma: PrismaService;

  const mockPrisma = {
    task: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    project: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    employee: {
      findFirst: vi.fn(),
    },
    workspaceMember: {
      findFirst: vi.fn(),
    },
    projectMember: {
      findUnique: vi.fn(),
    },
    taskAssignment: {
      upsert: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      aggregate: vi.fn(),
      findUnique: vi.fn(),
    },
    timeLog: {
      create: vi.fn(),
      aggregate: vi.fn(),
    },
  };

  const mockLogger = {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CustomLoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should create a task", async () => {
    const dto: any = {
      projectId: "prj-1",
      taskNumber: "TSK-001",
      title: "Design Database",
    };

    mockPrisma.employee.findFirst.mockResolvedValue({ id: "emp-1" });
    mockPrisma.workspaceMember.findFirst.mockResolvedValue({ role: { name: "ADMIN" } });
    mockPrisma.task.findUnique.mockResolvedValue(null);
    mockPrisma.project.findFirst.mockResolvedValue({ id: "prj-1" });
    mockPrisma.task.create.mockResolvedValue({ id: "task-1", ...dto });

    const result = await service.create("ws-1", dto, "user-1");
    expect(result).toBeDefined();
    expect(result.taskNumber).toBe("TSK-001");
    expect(mockPrisma.task.create).toHaveBeenCalled();
  });

  it("should throw error if task number exists", async () => {
    const dto: any = {
      projectId: "prj-1",
      taskNumber: "TSK-001",
      title: "Design Database",
    };

    mockPrisma.employee.findFirst.mockResolvedValue({ id: "emp-1" });
    mockPrisma.workspaceMember.findFirst.mockResolvedValue({ role: { name: "ADMIN" } });
    mockPrisma.task.findUnique.mockResolvedValue({ id: "existing" });
    mockPrisma.project.findFirst.mockResolvedValue({ id: "prj-1" });

    await expect(service.create("ws-1", dto, "user-1")).rejects.toThrow(
      BadRequestException,
    );
  });

  it("should group tasks for kanban", async () => {
    const tasks = [
      { id: "1", status: "TODO" },
      { id: "2", status: "IN_PROGRESS" },
      { id: "3", status: "DONE" },
    ];
    mockPrisma.task.findMany.mockResolvedValue(tasks);

    const result = await service.getKanban("ws-1", "prj-1");
    expect(result.TODO).toHaveLength(1);
    expect(result.IN_PROGRESS).toHaveLength(1);
    expect(result.DONE).toHaveLength(1);
    expect(result.REVIEW).toHaveLength(0);
  });

  describe("Employee Task Listing", () => {
    it("should find all tasks for an employee", async () => {
      mockPrisma.employee.findFirst.mockResolvedValue({ id: "emp-1" });
      mockPrisma.task.findMany.mockResolvedValue([{ id: "task-1", title: "My Task" }]);

      const result = await service.findAllForEmployee("ws-1", "user-1");
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("My Task");
    });
  });

  describe("Task Creation", () => {
    it("should create a task and assign to project", async () => {
      const dto = { projectId: "prj-1", title: "New Task", taskNumber: "PRJ-1-1" };
      mockPrisma.employee.findFirst.mockResolvedValue({ id: "emp-1" });
      mockPrisma.workspaceMember.findFirst.mockResolvedValue({ role: { name: "ADMIN" } });
      mockPrisma.project.findFirst.mockResolvedValue({ id: "prj-1", projectCode: "PRJ-1" });
      mockPrisma.task.findUnique.mockResolvedValue(null);
      mockPrisma.task.create.mockResolvedValue({ id: "task-1", ...dto });
      mockPrisma.task.count.mockResolvedValue(0);

      const result = await service.create("ws-1", dto as any, "user-1");
      expect(result.title).toBe("New Task");
      expect(mockPrisma.task.create).toHaveBeenCalled();
    });

    it("should allow creating a task (Service no longer enforces RBAC)", async () => {
      const dto = { projectId: "prj-1", title: "Lead Task" };
      mockPrisma.project.findFirst.mockResolvedValue({ id: "prj-1", projectCode: "PRJ" });
      mockPrisma.task.findUnique.mockResolvedValue(null);
      mockPrisma.task.create.mockResolvedValue({ id: "task-1", ...dto });
      mockPrisma.task.count.mockResolvedValue(0);

      const result = await service.create("ws-1", dto as any, "user-lead");
      expect(result.title).toBe("Lead Task");
      expect(mockPrisma.task.create).toHaveBeenCalled();
    });
  });

  describe("Time Tracking", () => {
    it("should log time and update worked hours", async () => {
      const dto = { hours: 4, description: "Coding", date: "2025-01-01" };
      mockPrisma.employee.findFirst.mockResolvedValue({ id: "emp-1" });
      mockPrisma.task.findFirst.mockResolvedValue({ id: "task-1", projectId: "prj-1" });
      mockPrisma.taskAssignment.findFirst.mockResolvedValue({ id: "ta-1" });
      mockPrisma.timeLog.create = vi.fn().mockResolvedValue({ id: "log-1", ...dto });
      mockPrisma.timeLog.aggregate = vi.fn().mockResolvedValue({ _sum: { hours: { toNumber: () => 4 } } });
      mockPrisma.taskAssignment.aggregate = vi.fn().mockResolvedValue({ _sum: { workedHours: 4 } });
      mockPrisma.taskAssignment.findMany.mockResolvedValue([{ workedHours: 4 }]);

      const result = await service.logTime("ws-1", "task-1", "user-1", dto);
      expect(result.hours).toBe(4);
      expect(mockPrisma.timeLog.create).toHaveBeenCalled();
      expect(mockPrisma.project.update).toHaveBeenCalled(); // Recalculate cost
    });
  });

  describe("Task Assignments", () => {
    it("should assign an employee to a task", async () => {
      mockPrisma.task.findFirst.mockResolvedValue({ id: "task-1" });
      mockPrisma.employee.findFirst.mockResolvedValue({ id: "emp-1" });
      mockPrisma.taskAssignment.upsert.mockResolvedValue({ taskId: "task-1", employeeId: "emp-1" });

      const result = await service.assign("ws-1", "task-1", "emp-1", 10);
      expect(result).toBeDefined();
      expect(mockPrisma.taskAssignment.upsert).toHaveBeenCalled();
    });
  });

  describe("Task Dependencies", () => {
    it("should prevent marking a task DONE if its dependency is not DONE", async () => {
      const taskWithDep = {
        id: "task-2",
        status: "TODO",
        dependsOnTask: { id: "task-1", status: "TODO", taskNumber: "TSK-1" },
      };

      mockPrisma.task.findFirst.mockResolvedValue(taskWithDep);
      mockPrisma.task.findUnique.mockResolvedValue(taskWithDep);

      await expect(
        service.update("ws-1", "task-2", { status: "DONE" }, "user-1"),
      ).rejects.toThrow(/dependency \(TSK-1\) is not DONE/);
    });
  });
});
