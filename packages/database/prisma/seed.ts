import { PrismaClient } from '../index'; // Use the exported client
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Hash a default password
  const defaultPassword = 'Password123!';
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  // 1. Create a primary Workspace
  console.log('Creating "Atlas Technologies" workspace...');
  const workspace = await prisma.workspace.upsert({
    where: { subdomain: 'atlas-tech' },
    update: {
      status: 'ACTIVE',
    },
    create: {
      name: 'Atlas Technologies',
      subdomain: 'atlas-tech',
      status: 'ACTIVE',
    },
  });

  // 2. Create the Owner (Admin) User
  console.log('Creating Admin User (admin@atlas.com)...');
  const admin = await prisma.authUser.upsert({
    where: { email: 'admin@atlas.com' },
    update: {},
    create: {
      email: 'admin@atlas.com',
      username: 'admin',
      password: passwordHash,
      verified: true,
    },
  });

  // Link admin to workspace
  await prisma.workspaceMember.upsert({
    where: {
      workspaceId_userId: { workspaceId: workspace.id, userId: admin.id },
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      userId: admin.id,
      role: 'OWNER',
    },
  });

  // 3. Create a regular HR Manager
  console.log('Creating HR Manager User (hr@atlas.com)...');
  const hrManager = await prisma.authUser.upsert({
    where: { email: 'hr@atlas.com' },
    update: {},
    create: {
      email: 'hr@atlas.com',
      username: 'hr_manager',
      password: passwordHash,
      verified: true,
    },
  });

  await prisma.workspaceMember.upsert({
    where: {
      workspaceId_userId: { workspaceId: workspace.id, userId: hrManager.id },
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      userId: hrManager.id,
      role: 'ADMIN', // Giving HR full workspace access
    },
  });

  // 4. Create standard employee user
  console.log('Creating Standard User (employee@atlas.com)...');
  const employeeUser = await prisma.authUser.upsert({
    where: { email: 'employee@atlas.com' },
    update: {},
    create: {
      email: 'employee@atlas.com',
      username: 'john_doe',
      password: passwordHash,
      verified: true,
    },
  });

  await prisma.workspaceMember.upsert({
    where: {
      workspaceId_userId: { workspaceId: workspace.id, userId: employeeUser.id },
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      userId: employeeUser.id,
      role: 'USER',
    },
  });

  await prisma.employee.upsert({
    where: { employeeNumber: 'EMP-001' },
    update: {},
    create: {
      workspaceId: workspace.id,
      userId: employeeUser.id,
      employeeNumber: 'EMP-001',
      firstName: 'John',
      lastName: 'Doe',
      fullName: 'John Doe',
      email: 'employee@atlas.com',
      dateOfJoining: new Date(),
      status: 'ACTIVE',
      baseSalary: 50000,
    },
  });

  console.log('✅ Seeding completed successfully!');
  console.log('----------------------------------------------------');
  console.log('Login Credentials:');
  console.log(`Admin: admin@atlas.com / ${defaultPassword}`);
  console.log(`HR: hr@atlas.com / ${defaultPassword}`);
  console.log(`Employee: employee@atlas.com / ${defaultPassword}`);
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
