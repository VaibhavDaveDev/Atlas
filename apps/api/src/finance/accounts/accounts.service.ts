import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../common/services/prisma.service";
import { CustomLoggerService } from "../../common/services/custom-logger.service";
import { CreateAccountDto } from "./dto/create-account.dto";
import { UpdateAccountDto } from "./dto/update-account.dto";
import { Account } from "@atlas/database";

@Injectable()
export class AccountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: CustomLoggerService,
  ) {}

  async create(
    workspaceId: string,
    createAccountDto: CreateAccountDto,
  ): Promise<Account> {
    this.logger.log(
      `Creating account: ${createAccountDto.accountName}`,
      "AccountsService",
    );

    // Check if account number already exists in workspace
    const existing = await this.prisma.account.findUnique({
      where: {
        workspaceId_accountNumber: {
          workspaceId,
          accountNumber: createAccountDto.accountNumber,
        },
      },
    });

    if (existing) {
      throw new BadRequestException("Account number already exists");
    }

    return this.prisma.account.create({
      data: {
        ...createAccountDto,
        workspaceId,
      },
    });
  }

  async findAll(workspaceId: string): Promise<Account[]> {
    return this.prisma.account.findMany({
      where: { workspaceId },
      include: {
        parentAccount: true,
      },
      orderBy: { accountNumber: "asc" },
    });
  }

  async findOne(workspaceId: string, id: string): Promise<Account> {
    const account = await this.prisma.account.findFirst({
      where: { id, workspaceId },
      include: {
        parentAccount: true,
        childAccounts: true,
      },
    });

    if (!account) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }

    return account;
  }

  async update(
    workspaceId: string,
    id: string,
    updateAccountDto: UpdateAccountDto,
  ): Promise<Account> {
    this.logger.log(`Updating account: ${id}`, "AccountsService");

    const account = await this.findOne(workspaceId, id);

    // If account number is being changed, check for uniqueness
    if (
      updateAccountDto.accountNumber &&
      updateAccountDto.accountNumber !== account.accountNumber
    ) {
      const existing = await this.prisma.account.findUnique({
        where: {
          workspaceId_accountNumber: {
            workspaceId,
            accountNumber: updateAccountDto.accountNumber,
          },
        },
      });

      if (existing) {
        throw new BadRequestException("Account number already exists");
      }
    }

    return this.prisma.account.update({
      where: { id },
      data: updateAccountDto,
    });
  }

  async remove(workspaceId: string, id: string): Promise<Account> {
    this.logger.warn(`Removing account: ${id}`, "AccountsService");

    // Check if it has child accounts
    const childAccounts = await this.prisma.account.count({
      where: { parentAccountId: id },
    });

    if (childAccounts > 0) {
      throw new BadRequestException(
        "Cannot delete account with child accounts",
      );
    }

    // Check if it has journal entries
    const journalEntries = await this.prisma.journalEntryLine.count({
      where: { accountId: id },
    });

    if (journalEntries > 0) {
      throw new BadRequestException(
        "Cannot delete account with existing journal entries",
      );
    }

    return this.prisma.account.delete({
      where: { id },
    });
  }

  async initializeChartOfAccounts(
    workspaceId: string,
    baseCurrency: string,
  ): Promise<string> {
    this.logger.log(
      `Initializing COA for workspace: ${workspaceId}`,
      "AccountsService",
    );

    const defaultAccounts = [
      {
        accountNumber: "1000",
        accountName: "Cash",
        accountType: "ASSET" as any,
        currencyCode: baseCurrency,
      },
      {
        accountNumber: "1100",
        accountName: "Main Bank",
        accountType: "ASSET" as any,
        currencyCode: baseCurrency,
      },
      {
        accountNumber: "1300",
        accountName: "Accounts Receivable",
        accountType: "ASSET" as any,
        currencyCode: baseCurrency,
      },
      {
        accountNumber: "2100",
        accountName: "Accounts Payable",
        accountType: "LIABILITY" as any,
        currencyCode: baseCurrency,
      },
      {
        accountNumber: "3000",
        accountName: "Retained Earnings",
        accountType: "EQUITY" as any,
        currencyCode: baseCurrency,
      },
      {
        accountNumber: "4100",
        accountName: "Sales Revenue",
        accountType: "INCOME" as any,
        currencyCode: baseCurrency,
      },
      {
        accountNumber: "5100",
        accountName: "Cost of Goods Sold",
        accountType: "EXPENSE" as any,
        currencyCode: baseCurrency,
      },
      {
        accountNumber: "5800",
        accountName: "Exchange Gain/Loss",
        accountType: "EXPENSE" as any,
        currencyCode: baseCurrency,
      },
    ];

    let exchangeGainLossId = "";

    await this.prisma.$transaction(async (tx) => {
      for (const acc of defaultAccounts) {
        const created = await tx.account.upsert({
          where: {
            workspaceId_accountNumber: {
              workspaceId,
              accountNumber: acc.accountNumber,
            },
          },
          update: {},
          create: {
            ...acc,
            workspaceId,
          },
        });
        if (acc.accountNumber === "5800") {
          exchangeGainLossId = created.id;
        }
      }
    });

    return exchangeGainLossId;
  }
}
