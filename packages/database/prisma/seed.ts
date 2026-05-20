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

  // 1.5 Create default Roles for the workspace
  console.log('Creating default Roles...');
  const ownerRole = await prisma.role.upsert({
    where: { workspaceId_name: { workspaceId: workspace.id, name: 'OWNER' } },
    update: {},
    create: { workspaceId: workspace.id, name: 'OWNER', description: 'Workspace Owner' },
  });

  const adminRole = await prisma.role.upsert({
    where: { workspaceId_name: { workspaceId: workspace.id, name: 'ADMIN' } },
    update: {},
    create: { workspaceId: workspace.id, name: 'ADMIN', description: 'Workspace Admin' },
  });

  const userRole = await prisma.role.upsert({
    where: { workspaceId_name: { workspaceId: workspace.id, name: 'USER' } },
    update: {},
    create: { workspaceId: workspace.id, name: 'USER', description: 'Standard User' },
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
      roleId: ownerRole.id,
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
      roleId: adminRole.id, // Giving HR full workspace access
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
      roleId: userRole.id,
    },
  });

  await prisma.employee.upsert({
    where: { 
      workspaceId_employeeNumber: {
        workspaceId: workspace.id,
        employeeNumber: 'EMP-001'
      }
    },
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

  // 6. Seed System Permissions (Global)
  console.log('Seeding Global Permissions...');
  const resources = [
    'leads', 'deals', 'contacts', 'products',
    'employees', 'departments', 'designations', 'attendance', 'leave', 'payroll',
    'accounts', 'invoices', 'payments', 'vendors',
    'projects', 'tasks',
    'workspace', 'roles', 'settings'
  ];
  
  const actions = ['create', 'read', 'update', 'delete', 'manage'];
  const scopes = ['own', 'department', 'all'];

  let permissionCount = 0;
  for (const resource of resources) {
    for (const action of actions) {
      for (const scope of scopes) {
        // Skip some non-sensical combinations
        if (['workspace', 'settings', 'roles'].includes(resource) && scope !== 'all') continue;
        
        const existing = await prisma.permission.findFirst({
          where: {
            workspaceId: null,
            resource,
            action,
            scope
          }
        });

        if (!existing) {
          await prisma.permission.create({
            data: {
              workspaceId: null,
              resource,
              action,
              scope,
              description: `${action.charAt(0).toUpperCase() + action.slice(1)} ${resource} with ${scope} scope`
            }
          });
          permissionCount++;
        }
      }
    }
  }
  console.log(`✅ Seeded ${permissionCount} global permissions`);

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
