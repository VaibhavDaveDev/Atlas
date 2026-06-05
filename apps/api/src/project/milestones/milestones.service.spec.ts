import { Test, TestingModule } from "@nestjs/testing";
import { MilestonesService } from "./milestones.service";
import { PrismaService } from "../../common/services/prisma.service";
import { CustomLoggerService } from "../../common/services/custom-logger.service";
import { BadRequestException, NotFoundException } from "@nestjs/common";

describe("MilestonesService", () => {
  let service: MilestonesService;
  let prisma: PrismaService;

  const mockPrisma = {
    milestone: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    project: {
      findFirst: vi.fn(),
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
        MilestonesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CustomLoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<MilestonesService>(MilestonesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should create a milestone", async () => {
    const dto: any = {
      projectId: "prj-1",
      name: "Alpha Release",
      targetDate: new Date(),
    };

    mockPrisma.project.findFirst.mockResolvedValue({ id: "prj-1" });
    mockPrisma.milestone.create.mockResolvedValue({ id: "ms-1", ...dto });

    const result = await service.create("ws-1", dto);
    expect(result).toBeDefined();
    expect(result.name).toBe("Alpha Release");
    expect(mockPrisma.milestone.create).toHaveBeenCalled();
  });

  it("should throw error if project not found", async () => {
    mockPrisma.project.findFirst.mockResolvedValue(null);

    await expect(service.create("ws-1", { projectId: "invalid" } as any)).rejects.toThrow(
      BadRequestException,
    );
  });

  it("should find one milestone", async () => {
    mockPrisma.milestone.findFirst.mockResolvedValue({ id: "ms-1", name: "Alpha" });

    const result = await service.findOne("ws-1", "ms-1");
    expect(result.name).toBe("Alpha");
  });

  it("should throw NotFoundException if milestone not found", async () => {
    mockPrisma.milestone.findFirst.mockResolvedValue(null);

    await expect(service.findOne("ws-1", "ms-1")).rejects.toThrow(
      NotFoundException,
    );
  });
});
