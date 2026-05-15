import { PrismaClient, SalaryComponentType } from '@atlas/database';

const prismaClient = new PrismaClient();

export async function seedIndiaStatutory(workspaceId: string, prisma: PrismaClient = prismaClient) {
  console.log(`🌱 Seeding Indian Statutory masters for workspace: ${workspaceId}`);

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Salary Components
      const components = [
        { name: 'Basic Salary', abbr: 'BS', type: SalaryComponentType.EARNING, componentType: 'Base', isTaxable: true },
        { name: 'House Rent Allowance', abbr: 'HRA', type: SalaryComponentType.EARNING, componentType: 'HRA', isTaxable: true },
        { name: 'Conveyance Allowance', abbr: 'CA', type: SalaryComponentType.EARNING, componentType: 'Conveyance', isTaxable: true },
        { name: 'Medical Allowance', abbr: 'MA', type: SalaryComponentType.EARNING, componentType: 'Medical', isTaxable: true },
        { name: 'Special Allowance', abbr: 'SA', type: SalaryComponentType.EARNING, componentType: 'Allowance', isTaxable: true },
        { name: 'Provident Fund', abbr: 'PF', type: SalaryComponentType.DEDUCTION, componentType: 'Provident Fund', isTaxable: false },
        { name: 'Professional Tax', abbr: 'PT', type: SalaryComponentType.DEDUCTION, componentType: 'Professional Tax', isTaxable: false },
        { name: 'Employee State Insurance', abbr: 'ESI', type: SalaryComponentType.DEDUCTION, componentType: 'ESI', isTaxable: false },
        { name: 'Income Tax', abbr: 'IT', type: SalaryComponentType.DEDUCTION, componentType: 'Income Tax', isTaxable: false },
      ];

      for (const comp of components) {
        await tx.salaryComponent.upsert({
          where: { workspaceId_abbr: { workspaceId, abbr: comp.abbr } },
          update: comp,
          create: { ...comp, workspaceId },
        });
      }

      // 2. Income Tax Slab (FY 2024-25 - New Regime)
      const taxSlab = await tx.incomeTaxSlab.upsert({
        where: {
          workspaceId_name: {
            workspaceId,
            name: 'Income Tax New Regime FY 2024-25',
          },
        },
        update: {},
        create: {
          workspaceId,
          name: 'Income Tax New Regime FY 2024-25',
          effectiveFrom: new Date('2024-04-01'),
          marginalReliefLimit: 700000,
        },
      });

      // Clear existing lines to avoid duplicates
      await tx.taxSlabLine.deleteMany({
        where: { taxSlabId: taxSlab.id },
      });

      const slabs = [
        { fromAmount: 0, toAmount: 300000, taxRate: 0 },
        { fromAmount: 300000, toAmount: 600000, taxRate: 0.05 },
        { fromAmount: 600000, toAmount: 900000, taxRate: 0.10 },
        { fromAmount: 900000, toAmount: 1200000, taxRate: 0.15 },
        { fromAmount: 1200000, toAmount: 1500000, taxRate: 0.20 },
        { fromAmount: 1500000, toAmount: null, taxRate: 0.30 },
      ];

      for (const s of slabs) {
        await tx.taxSlabLine.create({
          data: {
            taxSlabId: taxSlab.id,
            fromAmount: s.fromAmount,
            toAmount: s.toAmount,
            taxRate: s.taxRate,
          },
        });
      }
    });

    console.log('✅ India statutory seeding completed!');
  } catch (error) {
    console.error(`❌ Error seeding India statutory for ${workspaceId}:`, error);
    throw error;
  } finally {
    if (prisma === prismaClient) {
      await prisma.$disconnect();
    }
  }
}
