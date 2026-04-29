import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Hash a default password
  const defaultPassword = 'Password123!';
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  // 1. Create a primary Workspace
  console.log('Creating "Atlas Technologies" workspace...');
  const workspace = await prisma.workspace.upsert({
    where: { slug: 'atlas-tech' },
    update: {},
    create: {
      name: 'Atlas Technologies',
      slug: 'atlas-tech',
      subscriptionTier: 'ENTERPRISE',
      maxUsers: 100,
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
      passwordHash,
      isEmailVerified: true,
      lastLoginAt: new Date(),
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
      passwordHash,
      isEmailVerified: true,
      lastLoginAt: new Date(),
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
  const employee = await prisma.authUser.upsert({
    where: { email: 'employee@atlas.com' },
    update: {},
    create: {
      email: 'employee@atlas.com',
      username: 'john_doe',
      passwordHash,
      isEmailVerified: true,
    },
  });

  await prisma.workspaceMember.upsert({
    where: {
      workspaceId_userId: { workspaceId: workspace.id, userId: employee.id },
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      userId: employee.id,
      role: 'USER',
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
