import { PrismaClient, WorkspaceStatus, SalaryComponentType, SalaryCalculationType, EmployeeStatus } from '@atlas/database';
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
      status: WorkspaceStatus.ACTIVE,
    },
    create: {
      name: 'Atlas Technologies',
      subdomain: 'atlas-tech',
      status: WorkspaceStatus.ACTIVE,
    },
  });

  // 1.5 Create default Roles
  console.log('Creating default roles...');
  const ownerRole = await prisma.role.upsert({
    where: { workspaceId_name: { workspaceId: workspace.id, name: 'OWNER' } },
    update: {},
    create: { workspaceId: workspace.id, name: 'OWNER', description: 'Full Workspace Access' },
  });
  
  const adminRole = await prisma.role.upsert({
    where: { workspaceId_name: { workspaceId: workspace.id, name: 'ADMIN' } },
    update: {},
    create: { workspaceId: workspace.id, name: 'ADMIN', description: 'Administrative Access' },
  });
  
  const userRole = await prisma.role.upsert({
    where: { workspaceId_name: { workspaceId: workspace.id, name: 'USER' } },
    update: {},
    create: { workspaceId: workspace.id, name: 'USER', description: 'Standard User Access' },
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
  const employee = await prisma.authUser.upsert({
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
      workspaceId_userId: { workspaceId: workspace.id, userId: employee.id },
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      userId: employee.id,
      roleId: userRole.id,
    },
  });

  // 5. Create HR Employee Record for John Doe
  console.log('Creating employee record for John Doe...');
  const johnDoe = await prisma.employee.upsert({
    where: { workspaceId_email: { workspaceId: workspace.id, email: 'employee@atlas.com' } },
    update: {},
    create: {
      workspaceId: workspace.id,
      employeeNumber: 'EMP-001',
      firstName: 'John',
      lastName: 'Doe',
      fullName: 'John Doe',
      email: 'employee@atlas.com',
      dateOfJoining: new Date('2024-01-01'),
      status: EmployeeStatus.ACTIVE,
      userId: employee.id,
      baseSalary: 50000,
    },
  });

  // 6. Create Default Shift
  console.log('Creating default shift...');
  await prisma.shiftType.upsert({
    where: { id: 'default-general-shift' },
    update: {},
    create: {
      id: 'default-general-shift',
      workspaceId: workspace.id,
      name: 'General Shift',
      startTime: '09:00',
      endTime: '18:00',
      isDefault: true,
    },
  });

  // 7. Salary Components
  console.log('Creating Salary Components...');
  const components = [
    { name: 'Basic Salary', abbr: 'BS', type: SalaryComponentType.EARNING, calculationType: SalaryCalculationType.FLAT, isTaxable: true },
    { name: 'House Rent Allowance', abbr: 'HRA', type: SalaryComponentType.EARNING, calculationType: SalaryCalculationType.PERCENTAGE, amount: 40, isTaxable: true },
    { name: 'Provident Fund', abbr: 'PF', type: SalaryComponentType.DEDUCTION, calculationType: SalaryCalculationType.PERCENTAGE, amount: 12, isTaxable: false },
  ];

  for (const comp of components) {
    await prisma.salaryComponent.upsert({
      where: { workspaceId_abbr: { workspaceId: workspace.id, abbr: comp.abbr } },
      update: {},
      create: { ...comp, workspaceId: workspace.id },
    });
  }

  // 8. Seed System Permissions (Global)
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
