import { Test, TestingModule } from "@nestjs/testing";
import { HrService } from "./hr.service";
import { PrismaService } from "../common/services/prisma.service";
import { WorkspaceService } from "../workspace/workspace.service";

describe("HrService - Payroll Calculations", () => {
  let service: HrService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HrService,
        {
          provide: PrismaService,
          useValue: {
            leaveApplication: {
              create: vi.fn(),
            },
            employee: {
              findFirst: vi.fn(),
            },
            attendance: {
              findFirst: vi.fn(),
              create: vi.fn(),
              update: vi.fn(),
            },
          },
        },
        {
          provide: WorkspaceService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<HrService>(HrService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe("Statutory Calculations (India)", () => {
    it("should calculate PF at 12% with 15k cap by default", async () => {
      const basic = 20000;
      const pf = await service.calculatePf(basic);
      expect(pf).toBe(15000 * 0.12); // 1800
    });

    it("should calculate PF at 12% without cap if specified", async () => {
      const basic = 20000;
      const pf = await service.calculatePf(basic, false);
      expect(pf).toBe(20000 * 0.12); // 2400
    });

    it("should calculate ESI at 0.75% for gross <= 21k", async () => {
      const gross = 15000;
      const esi = await service.calculateEsi(gross);
      expect(esi.employee).toBe(Math.ceil(15000 * 0.0075)); // 113
    });

    it("should calculate 0 ESI for gross > 21k", async () => {
      const gross = 22000;
      const esi = await service.calculateEsi(gross);
      expect(esi.employee).toBe(0);
    });

    it("should calculate professional tax for Maharashtra", async () => {
      // <= 7500 -> 0
      expect(await service.calculateProfessionalTax(7000, "Maharashtra")).toBe(
        0,
      );
      // 7501-10000 -> 175
      expect(await service.calculateProfessionalTax(8000, "Maharashtra")).toBe(
        175,
      );
      // > 10000 -> 200
      expect(await service.calculateProfessionalTax(15000, "Maharashtra")).toBe(
        200,
      );
    });

    it("should calculate HRA exemption correctly", async () => {
      const basic = 50000;
      const hraReceived = 20000;
      const rentPaid = 15000;
      const isMetro = true;

      // Case 1: HRA Received = 20000
      // Case 2: Rent - 10% Basic = 15000 - 5000 = 10000
      // Case 3: 50% Basic (Metro) = 25000
      // Min should be 10000
      const exemption = await service.calculateHraExemption(
        basic,
        hraReceived,
        rentPaid,
        isMetro,
      );
      expect(exemption).toBe(10000);
    });
  });

  describe("Leave Management", () => {
    it("should create leave application if balance is sufficient", async () => {
      // Mock getLeaveBalance to return 10
      vi.spyOn(service, "getLeaveBalance").mockResolvedValue(10);
      prisma.leaveApplication.create = vi
        .fn()
        .mockResolvedValue({ id: "app1" });

      const result = await service.createLeaveApplication("workspace1", {
        employeeId: "emp1",
        leaveTypeId: "lt1",
        fromDate: new Date("2025-01-01"),
        toDate: new Date("2025-01-02"),
        reason: "Sick",
      });

      expect(prisma.leaveApplication.create).toHaveBeenCalled();
      expect(result.id).toBe("app1");
    });

    it("should throw error if leave balance is insufficient", async () => {
      // Mock getLeaveBalance to return 1
      vi.spyOn(service, "getLeaveBalance").mockResolvedValue(1);

      await expect(
        service.createLeaveApplication("workspace1", {
          employeeId: "emp1",
          leaveTypeId: "lt1",
          fromDate: new Date("2025-01-01"),
          toDate: new Date("2025-01-05"), // 5 days > 1 balance
          reason: "Vacation",
        }),
      ).rejects.toThrow("Insufficient leave balance");
    });
  });

  describe("Attendance", () => {
    it("should allow check-in if not checked in today", async () => {
      prisma.employee.findFirst = vi.fn().mockResolvedValue({ id: "emp1" });
      prisma.attendance.findFirst = vi.fn().mockResolvedValue(null);
      prisma.attendance.create = vi.fn().mockResolvedValue({ id: "att1" });

      const result = await service.checkIn("workspace1", "user1");
      expect(prisma.attendance.create).toHaveBeenCalled();
      expect(result.id).toBe("att1");
    });

    it("should prevent double check-in", async () => {
      prisma.employee.findFirst = vi.fn().mockResolvedValue({ id: "emp1" });
      // Return an existing attendance record without checkOut
      prisma.attendance.findFirst = vi
        .fn()
        .mockResolvedValue({ id: "att1", checkIn: new Date(), checkOut: null });

      await expect(service.checkIn("workspace1", "user1")).rejects.toThrow(
        "Already checked in today",
      );
    });

    it("should allow check-out and calculate working hours", async () => {
      prisma.employee.findFirst = vi.fn().mockResolvedValue({ id: "emp1" });

      const checkInTime = new Date(Date.now() - 4 * 60 * 60 * 1000); // 4 hours ago
      prisma.attendance.findFirst = vi.fn().mockResolvedValue({
        id: "att1",
        checkIn: checkInTime,
        checkOut: null,
      });

      prisma.attendance.update = vi.fn().mockImplementation(({ data }) => data);

      const result = await service.checkOut("workspace1", "user1");
      expect(prisma.attendance.update).toHaveBeenCalled();

      // Should be roughly 4 hours
      expect(Number(result.workingHours)).toBeGreaterThan(3.9);
      expect(Number(result.workingHours)).toBeLessThan(4.1);
    });
  });
});
