import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { CustomLoggerService } from '../../common/services/custom-logger.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { Account } from '@atlas/database';

@Injectable()
export class AccountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: CustomLoggerService,
  ) {}

  async create(workspaceId: string, createAccountDto: CreateAccountDto): Promise<Account> {
    this.logger.log(`Creating account: ${createAccountDto.accountName}`, 'AccountsService');

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
      throw new BadRequestException('Account number already exists');
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
      orderBy: { accountNumber: 'asc' },
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

  async update(workspaceId: string, id: string, updateAccountDto: UpdateAccountDto): Promise<Account> {
    this.logger.log(`Updating account: ${id}`, 'AccountsService');

    const account = await this.findOne(workspaceId, id);

    // If account number is being changed, check for uniqueness
    if (updateAccountDto.accountNumber && updateAccountDto.accountNumber !== account.accountNumber) {
      const existing = await this.prisma.account.findUnique({
        where: {
          workspaceId_accountNumber: {
            workspaceId,
            accountNumber: updateAccountDto.accountNumber as string,
          },
        },
      });

      if (existing) {
        throw new BadRequestException('Account number already exists');
      }
    }

    return this.prisma.account.update({
      where: { id },
      data: updateAccountDto,
    });
  }

  async remove(workspaceId: string, id: string): Promise<Account> {
    this.logger.warn(`Removing account: ${id}`, 'AccountsService');
    
    // Check if it has child accounts
    const childAccounts = await this.prisma.account.count({
      where: { parentAccountId: id },
    });

    if (childAccounts > 0) {
      throw new BadRequestException('Cannot delete account with child accounts');
    }

    // Check if it has journal entries
    const journalEntries = await this.prisma.journalEntryLine.count({
      where: { accountId: id },
    });

    if (journalEntries > 0) {
      throw new BadRequestException('Cannot delete account with existing journal entries');
    }

    return this.prisma.account.delete({
      where: { id },
    });
  }
}
