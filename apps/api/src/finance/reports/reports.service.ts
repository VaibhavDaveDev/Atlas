import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/services/prisma.service";
import { AccountType } from "@atlas/database";

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getBalanceSheet(workspaceId: string): Promise<any> {
    const accounts = await this.prisma.account.findMany({
      where: { workspaceId, isActive: true },
    });

    const assets = accounts.filter((a) => a.accountType === AccountType.ASSET);
    const liabilities = accounts.filter(
      (a) => a.accountType === AccountType.LIABILITY,
    );
    const equity = accounts.filter((a) => a.accountType === AccountType.EQUITY);

    const totalAssets = assets.reduce((sum, a) => sum + Number(a.balance), 0);
    const totalLiabilities = liabilities.reduce(
      (sum, a) => sum + Number(a.balance),
      0,
    );
    const totalEquity = equity.reduce((sum, a) => sum + Number(a.balance), 0);

    return {
      assets: assets.map((a) => ({
        name: a.accountName,
        code: a.accountNumber,
        balance: a.balance,
      })),
      liabilities: liabilities.map((a) => ({
        name: a.accountName,
        code: a.accountNumber,
        balance: a.balance,
      })),
      equity: equity.map((a) => ({
        name: a.accountName,
        code: a.accountNumber,
        balance: a.balance,
      })),
      totals: {
        assets: totalAssets,
        liabilities: totalLiabilities,
        equity: totalEquity,
      },
    };
  }

  async getProfitAndLoss(
    workspaceId: string,
    startDate: string,
    endDate: string,
  ): Promise<any> {
    const lines = await this.prisma.journalEntryLine.findMany({
      where: {
        journalEntry: {
          workspaceId,
          postingDate: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
          status: "POSTED",
        },
        account: {
          accountType: {
            in: [AccountType.INCOME, AccountType.EXPENSE],
          },
        },
      },
      include: {
        account: true,
      },
    });

    const report: Record<
      string,
      { name: string; type: AccountType; amount: number }
    > = {};

    for (const line of lines) {
      const accId = line.account.id;
      if (!report[accId]) {
        report[accId] = {
          name: line.account.accountName,
          type: line.account.accountType,
          amount: 0,
        };
      }

      // For Income, Credit increases balance, Debit decreases.
      // For Expense, Debit increases balance, Credit decreases.
      if (line.account.accountType === AccountType.INCOME) {
        report[accId].amount += Number(line.credit) - Number(line.debit);
      } else {
        report[accId].amount += Number(line.debit) - Number(line.credit);
      }
    }

    const income = Object.values(report).filter(
      (r) => r.type === AccountType.INCOME,
    );
    const expenses = Object.values(report).filter(
      (r) => r.type === AccountType.EXPENSE,
    );

    const totalIncome = income.reduce((sum, i) => sum + i.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    return {
      income,
      expenses,
      totals: {
        income: totalIncome,
        expenses: totalExpenses,
        netProfit: totalIncome - totalExpenses,
      },
    };
  }

  async getDashboardStats(workspaceId: string): Promise<any> {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0,
    );

    const [
      totalAccounts,
      totalRevenue,
      totalExpenses,
      overdueInvoices,
      draftInvoices,
      recentJournals,
      treasuryAccounts,
    ] = await Promise.all([
      this.prisma.account.count({ where: { workspaceId } }),
      this.prisma.journalEntryLine.aggregate({
        where: {
          journalEntry: {
            workspaceId,
            status: "POSTED",
          },
          account: { accountType: AccountType.INCOME },
        },
        _sum: { credit: true, debit: true },
      }),
      this.prisma.journalEntryLine.aggregate({
        where: {
          journalEntry: {
            workspaceId,
            status: "POSTED",
          },
          account: { accountType: AccountType.EXPENSE },
        },
        _sum: { debit: true, credit: true },
      }),
      this.prisma.invoice.count({
        where: {
          workspaceId,
          status: "SENT",
          dueDate: { lt: today },
        },
      }),
      this.prisma.invoice.count({
        where: {
          workspaceId,
          status: "DRAFT",
        },
      }),
      this.prisma.journalEntry.findMany({
        where: { workspaceId },
        orderBy: { postingDate: "desc" },
        take: 5,
      }),
      this.prisma.account.aggregate({
        where: {
          workspaceId,
          isActive: true,
          // Assuming we distinguish bank/cash by name or code convention if AccountType doesn't have it
          // But looking at schema, AccountType is an enum.
          // Let's use AccountType.ASSET and maybe filter by code prefix if possible
          // or just assume for now all assets are treasury if simplified.
          // Better: just sum all accounts of type ASSET that are not groups
          accountType: AccountType.ASSET,
          isGroup: false,
        },
        _sum: { balance: true },
      }),
    ]);

    const rev =
      Number(totalRevenue._sum.credit || 0) -
      Number(totalRevenue._sum.debit || 0);
    const exp =
      Number(totalExpenses._sum.debit || 0) -
      Number(totalExpenses._sum.credit || 0);
    const treasury = Number(treasuryAccounts._sum.balance || 0);

    // Monthly Chart Data (Simplified for last 6 months)
    const months: {
      name: string;
      start: Date;
      end: Date;
      revenue: number;
      expenses: number;
    }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push({
        name: d.toLocaleString("default", { month: "short" }),
        start: new Date(d.getFullYear(), d.getMonth(), 1),
        end: new Date(d.getFullYear(), d.getMonth() + 1, 0),
        revenue: 0,
        expenses: 0,
      });
    }

    // This is a bit heavy for a single query but for now it's fine
    for (const month of months) {
      const stats = await Promise.all([
        this.prisma.journalEntryLine.aggregate({
          where: {
            journalEntry: {
              workspaceId,
              status: "POSTED",
              postingDate: { gte: month.start, lte: month.end },
            },
            account: { accountType: AccountType.INCOME },
          },
          _sum: { credit: true, debit: true },
        }),
        this.prisma.journalEntryLine.aggregate({
          where: {
            journalEntry: {
              workspaceId,
              status: "POSTED",
              postingDate: { gte: month.start, lte: month.end },
            },
            account: { accountType: AccountType.EXPENSE },
          },
          _sum: { debit: true, credit: true },
        }),
      ]);

      month.revenue =
        Number(stats[0]._sum.credit || 0) - Number(stats[0]._sum.debit || 0);
      month.expenses =
        Number(stats[1]._sum.debit || 0) - Number(stats[1]._sum.credit || 0);
    }

    return {
      kpis: {
        totalRevenue: rev,
        netProfit: rev - exp,
        overdueInvoices,
        draftInvoices,
        treasury,
      },
      chartData: months.map((m) => ({
        name: m.name,
        revenue: m.revenue,
        expenses: m.expenses,
        profit: m.revenue - m.expenses,
      })),
      recentActivity: recentJournals.map((j) => ({
        name: j.description || "Journal Entry",
        type: "Journal",
        amount: `$${Number(j.totalDebit).toLocaleString()}`,
        status: j.status,
        date: j.postingDate,
        id: j.id,
      })),
    };
  }

  async getCashFlowStatement(
    workspaceId: string,
    startDate: string,
    endDate: string,
  ): Promise<any> {
    // Direct Method: Categorize cash/bank movements
    // Find all journal entry lines for Cash/Bank accounts (assuming Asset type for now)
    const lines = await this.prisma.journalEntryLine.findMany({
      where: {
        journalEntry: {
          workspaceId,
          postingDate: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
          status: "POSTED",
        },
        account: {
          // In a real ERP, we'd have an is_cash or account_subtype field.
          // For now, let's look for common Cash/Bank account numbers or just Assets that are children of a "Cash" group.
          // Let's assume accounts with 'Cash' or 'Bank' in name for this prototype.
          OR: [
            { accountName: { contains: "Cash", mode: "insensitive" } },
            { accountName: { contains: "Bank", mode: "insensitive" } },
          ],
        },
      },
      include: {
        journalEntry: {
          include: {
            lines: {
              include: {
                account: true,
              },
            },
          },
        },
      },
    });

    let operating = 0;
    let investing = 0;
    let financing = 0;

    for (const line of lines) {
      const netMovement = Number(line.debit) - Number(line.credit);

      // Find the offset lines to categorize
      const offsetLines = line.journalEntry.lines.filter(
        (l) => l.id !== line.id,
      );

      for (const offset of offsetLines) {
        const type = offset.account.accountType;
        if (type === AccountType.INCOME || type === AccountType.EXPENSE) {
          operating += netMovement;
        } else if (
          type === AccountType.ASSET &&
          !offset.account.accountName.toLowerCase().includes("bank") &&
          !offset.account.accountName.toLowerCase().includes("cash")
        ) {
          investing += netMovement;
        } else if (
          type === AccountType.LIABILITY ||
          type === AccountType.EQUITY
        ) {
          financing += netMovement;
        }
      }
    }

    return {
      operating,
      investing,
      financing,
      netCashFlow: operating + investing + financing,
    };
  }
}
