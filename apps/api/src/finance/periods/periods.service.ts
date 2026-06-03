import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../common/services/prisma.service";
import { CustomLoggerService } from "../../common/services/custom-logger.service";

@Injectable()
export class PeriodsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: CustomLoggerService,
  ) {}

  async findAll(workspaceId: string) {
    return this.prisma.fiscalPeriod.findMany({
      where: { workspaceId },
      orderBy: { startDate: "desc" },
    });
  }

  async closePeriod(
    workspaceId: string,
    userId: string,
    data: { name: string; startDate: string; endDate: string },
  ) {
    this.logger.log(`Closing period: ${data.name}`, "PeriodsService");

    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    // 1. Check for unposted items (DRAFT Invoices or Journals)
    const unpostedJournals = await this.prisma.journalEntry.count({
      where: {
        workspaceId,
        status: "DRAFT",
        postingDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const draftInvoices = await this.prisma.invoice.count({
      where: {
        workspaceId,
        status: "DRAFT",
        invoiceDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    if (unpostedJournals > 0 || draftInvoices > 0) {
      throw new BadRequestException(
        `Cannot close period. Found ${unpostedJournals} draft journals and ${draftInvoices} draft invoices.`,
      );
    }

    // 2. Create or update period lock
    return this.prisma.fiscalPeriod.upsert({
      where: {
        workspaceId_startDate_endDate: {
          workspaceId,
          startDate: startDate,
          endDate: endDate,
        },
      },
      update: {
        isLocked: true,
        lockedAt: new Date(),
        lockedBy: userId,
      },
      create: {
        workspaceId,
        name: data.name,
        startDate: startDate,
        endDate: endDate,
        isLocked: true,
        lockedAt: new Date(),
        lockedBy: userId,
      },
    });
  }

  async isPeriodLocked(workspaceId: string, date: Date): Promise<boolean> {
    const period = await this.prisma.fiscalPeriod.findFirst({
      where: {
        workspaceId,
        startDate: { lte: date },
        endDate: { gte: date },
        isLocked: true,
      },
    });
    return !!period;
  }
}
