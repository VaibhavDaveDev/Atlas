import { Test, TestingModule } from "@nestjs/testing";
import { ProjectsService } from "./projects.service";
import { PrismaService } from "../../common/services/prisma.service";
import { CustomLoggerService } from "../../common/services/custom-logger.service";
import { BadRequestException } from "@nestjs/common";

describe("ProjectsService", () => {
  let service: ProjectsService;
  let prisma: PrismaService;

  const mockPrisma = {
    project: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    task: {
      count: vi.fn(),
    },
    taskAssignment: {
      findMany: vi.fn(),
    },
    projectMember: {
      upsert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    employee: {
      findFirst: vi.fn(),
    },
    timeLog: {
      findMany: vi.fn(),
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
        ProjectsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CustomLoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should create a project", async () => {
    const dto: any = {
      projectCode: "PRJ-001",
      projectName: "New ERP",
      startDate: new Date(),
    };

    mockPrisma.project.findUnique.mockResolvedValue(null);
    mockPrisma.project.create.mockResolvedValue({ id: "prj-1", ...dto });

    const result = await service.create("ws-1", dto, "user-1");
    expect(result).toBeDefined();
    expect(result.projectCode).toBe("PRJ-001");
    expect(mockPrisma.project.create).toHaveBeenCalled();
  });

  it("should throw error if project code exists", async () => {
    const dto: any = {
      projectCode: "PRJ-001",
      projectName: "New ERP",
    };

    mockPrisma.project.findUnique.mockResolvedValue({ id: "existing" });

    await expect(service.create("ws-1", dto, "user-1")).rejects.toThrow(
      BadRequestException,
    );
  });

  describe("Member Management", () => {
    it("should assign a member to a project", async () => {
      const dto = { employeeId: "emp-1", role: "LEAD" as const };
      mockPrisma.project.findFirst.mockResolvedValue({ id: "prj-1" });
      mockPrisma.projectMember.upsert = vi.fn().mockResolvedValue({ ...dto, projectId: "prj-1" });

      const result = await service.assignMember("ws-1", "prj-1", dto);
      expect(result.employeeId).toBe("emp-1");
      expect(result.role).toBe("LEAD");
    });

    it("should remove a member from a project", async () => {
      mockPrisma.projectMember.delete = vi.fn().mockResolvedValue({ id: "pm-1" });

      const result = await service.removeMember("ws-1", "prj-1", "emp-1");
      expect(result).toBeDefined();
      expect(mockPrisma.projectMember.delete).toHaveBeenCalled();
    });
  });

  describe("Employee Project Listing", () => {
    it("should find all projects for an employee", async () => {
      mockPrisma.employee.findFirst = vi.fn().mockResolvedValue({ id: "emp-1" });
      mockPrisma.project.findMany.mockResolvedValue([{ id: "prj-1", projectName: "Project A" }]);

      const result = await service.findAllForEmployee("ws-1", "user-1");
      expect(result).toHaveLength(1);
      expect(result[0].projectName).toBe("Project A");
    });
  });
});
