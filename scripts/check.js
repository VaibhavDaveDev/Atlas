const { PrismaClient } = require('@atlas/database');
const prisma = new PrismaClient();
async function main() {
  const employees = await prisma.employee.findMany({ select: { id: true, deletedAt: true }});
  console.log('EMPLOYEES deletedAt:', employees);
}
main().catch(console.error).finally(()=>prisma.$disconnect());