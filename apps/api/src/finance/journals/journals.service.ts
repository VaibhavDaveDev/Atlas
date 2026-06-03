import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../common/services/prisma.service";
import { CustomLoggerService } from "../../common/services/custom-logger.service";
import { CreateJournalEntryDto } from "./dto/create-journal-entry.dto";
import { Account, JournalEntry } from "@atlas/database";
import { PeriodsService } from "../periods/periods.service";

@Injectable()
export class JournalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: CustomLoggerService,
    private readonly periodsService: PeriodsService,
  ) {}

  async create(
    workspaceId: string,
    userId: string,
    createDto: CreateJournalEntryDto,
  ): Promise<JournalEntry> {
    this.logger.log(
      `Creating journal entry: ${createDto.entryNumber}`,
      "JournalsService",
    );

    // 1. Check Period Lock
    if (
      await this.periodsService.isPeriodLocked(
        workspaceId,
        new Date(createDto.postingDate),
      )
    ) {
      throw new BadRequestException(
        "Cannot create journal entry in a locked fiscal period.",
      );
    }

    // 2. Validate Double Entry (Total Debit == Total Credit)
    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of createDto.lines) {
      totalDebit += line.debit;
      totalCredit += line.credit;
    }

    // Use a small epsilon for floating point comparison if not using Decimals throughout
    if (Math.abs(totalDebit - totalCredit) > 0.000001) {
      throw new BadRequestException(
        `Journal entry is not balanced. Total Debit: ${totalDebit}, Total Credit: ${totalCredit}`,
      );
    }

    // 2. Check for duplicate entry number
    const existing = await this.prisma.journalEntry.findUnique({
      where: {
        workspaceId_entryNumber: {
          workspaceId,
          entryNumber: createDto.entryNumber,
        },
      },
    });

    if (existing) {
      throw new BadRequestException("Journal entry number already exists");
    }

    // 3. Create entry and lines in a transaction
    return this.prisma.$transaction(async (tx) => {
      const entry = await tx.journalEntry.create({
        data: {
          workspaceId,
          entryNumber: createDto.entryNumber,
          postingDate: new Date(createDto.postingDate),
          description: createDto.description,
          referenceType: createDto.referenceType,
          referenceId: createDto.referenceId,
          currencyCode: createDto.currencyCode,
          exchangeRate: createDto.exchangeRate,
          totalDebit,
          totalCredit,
          createdBy: userId,
          status: "POSTED", // Default to POSTED for now, can add DRAFT support later
          lines: {
            create: createDto.lines.map((line) => ({
              accountId: line.accountId,
              debit: line.debit,
              credit: line.credit,
              description: line.description,
            })),
          },
        },
        include: {
          lines: true,
        },
      });

      // 4. Update Account Balances
      for (const line of createDto.lines) {
        await tx.account.update({
          where: { id: line.accountId },
          data: {
            balance: {
              increment: line.debit - line.credit, // This depends on AccountType (Debit vs Credit nature), but for GL we just use Net
            },
          },
        });
      }

      return entry;
    });
  }

  async findAll(workspaceId: string): Promise<any[]> {
    return this.prisma.journalEntry.findMany({
      where: { workspaceId },
      include: {
        lines: {
          include: {
            account: true,
          },
        },
      },
      orderBy: { postingDate: "desc" },
    });
  }

  async findOne(workspaceId: string, id: string): Promise<any> {
    const entry = await this.prisma.journalEntry.findFirst({
      where: { id, workspaceId },
      include: {
        lines: {
          include: {
            account: true,
          },
        },
      },
    });

    if (!entry) {
      throw new NotFoundException(`Journal entry with ID ${id} not found`);
    }

    return entry;
  }

  // NOTE: Journals are usually immutable once posted.
  // For now, we only allow deletion if we reverse the balances.
  async remove(workspaceId: string, id: string): Promise<any> {
    this.logger.warn(`Removing journal entry: ${id}`, "JournalsService");

    const entry = await this.findOne(workspaceId, id);

    // 1. Check Period Lock
    if (
      await this.periodsService.isPeriodLocked(
        workspaceId,
        new Date(entry.postingDate),
      )
    ) {
      throw new BadRequestException(
        "Cannot delete journal entry from a locked fiscal period.",
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Reverse account balances
      for (const line of entry.lines) {
        await tx.account.update({
          where: { id: line.accountId },
          data: {
            balance: {
              decrement: Number(line.debit) - Number(line.credit),
            },
          },
        });
      }

      // 2. Delete entry (cascades to lines)
      return tx.journalEntry.delete({
        where: { id },
      });
    });
  }
}
