import {
  PrismaClient,
  WorkspaceStatus,
  SalaryComponentType,
  EmployeeStatus,
  GlobalRole,
} from "../index";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting unified database seeding...");

  const passwordHash = await bcrypt.hash("Password123!", 10);

  // 1. Create the Super Admin (Global Admin)
  console.log("Creating Super Admin User (superadmin@atlas.com)...");
  const superAdmin = await prisma.authUser.upsert({
    where: { email: "superadmin@atlas.com" },
    update: { globalRole: GlobalRole.SUPERADMIN },
    create: {
      email: "superadmin@atlas.com",
      username: "superadmin",
      name: "Global Super Admin",
      password: passwordHash,
      globalRole: GlobalRole.SUPERADMIN,
      verified: true,
    },
  });

  // 2. Create the main Workspace (Amdox Atlas)
  console.log('Creating "Amdox Atlas" workspace...');
  const workspace = await prisma.workspace.upsert({
    where: { subdomain: "amdox" },
    update: {
      status: WorkspaceStatus.ACTIVE,
    },
    create: {
      name: "Amdox Atlas",
      subdomain: "amdox",
      status: WorkspaceStatus.ACTIVE,
    },
  });

  // 3. Create Permissions
  console.log("Creating Permissions...");
  const permissionsData = [
    // --- Admin / HR permissions (scope: all) ---
    { resource: "employees", action: "manage", scope: "all" },
    { resource: "employees", action: "read", scope: "all" },
    { resource: "departments", action: "read", scope: "all" },
    { resource: "departments", action: "create", scope: "all" },
    { resource: "departments", action: "update", scope: "all" },
    { resource: "departments", action: "delete", scope: "all" },
    { resource: "designations", action: "read", scope: "all" },
    { resource: "designations", action: "create", scope: "all" },
    { resource: "leaves", action: "read", scope: "all" },
    { resource: "leaves", action: "manage", scope: "all" },
    { resource: "attendance", action: "read", scope: "all" },
    { resource: "attendance", action: "manage", scope: "all" },
    { resource: "payroll", action: "read", scope: "all" },
    { resource: "payroll", action: "manage", scope: "all" },
    { resource: "helpdesk", action: "read", scope: "all" },
    { resource: "helpdesk", action: "manage", scope: "all" },
    { resource: "CompanyEvent", action: "read", scope: "all" },
    { resource: "CompanyEvent", action: "create", scope: "all" },
    { resource: "CompanyEvent", action: "update", scope: "all" },
    { resource: "CompanyEvent", action: "delete", scope: "all" },
    // --- ESS permissions (scope: own) ---
    { resource: "employees", action: "read", scope: "own" },
    { resource: "employees", action: "update", scope: "own" },
    { resource: "attendance", action: "read", scope: "own" },
    { resource: "attendance", action: "create", scope: "own" },
    { resource: "attendance", action: "update", scope: "own" },
    { resource: "leave", action: "read", scope: "own" },
    { resource: "leave", action: "create", scope: "own" },
    { resource: "leave", action: "update", scope: "own" },
    { resource: "leaves", action: "read", scope: "own" },
    { resource: "leaves", action: "create", scope: "own" },
    { resource: "leaves", action: "update", scope: "own" },
    { resource: "payroll", action: "read", scope: "own" },
    { resource: "payroll", action: "create", scope: "own" },
    { resource: "payroll", action: "update", scope: "own" },
    { resource: "helpdesk", action: "read", scope: "own" },
    { resource: "helpdesk", action: "create", scope: "own" },
    { resource: "helpdesk", action: "update", scope: "own" },
    { resource: "appraisals", action: "read", scope: "own" },
    { resource: "appraisals", action: "update", scope: "own" },
    { resource: "CompanyEvent", action: "read", scope: "all" },
  ];

  for (const p of permissionsData) {
    await prisma.permission.upsert({
      where: {
        workspaceId_resource_action_scope: {
          workspaceId: workspace.id,
          resource: p.resource,
          action: p.action,
          scope: p.scope,
        },
      },
      update: {},
      create: {
        workspaceId: workspace.id,
        resource: p.resource,
        action: p.action,
        scope: p.scope,
      },
    });
  }

  // 4. Create Workspace Roles
  console.log("Creating Workspace Roles...");
  const ownerRole = await prisma.role.upsert({
    where: { workspaceId_name: { workspaceId: workspace.id, name: "OWNER" } },
    update: {},
    create: {
      workspaceId: workspace.id,
      name: "OWNER",
      description: "Workspace Owner with full control",
    },
  });

  const adminRole = await prisma.role.upsert({
    where: { workspaceId_name: { workspaceId: workspace.id, name: "ADMIN" } },
    update: {},
    create: {
      workspaceId: workspace.id,
      name: "ADMIN",
      description: "Workspace Administrator",
    },
  });

  const employeeRole = await prisma.role.upsert({
    where: {
      workspaceId_name: { workspaceId: workspace.id, name: "EMPLOYEE" },
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      name: "EMPLOYEE",
      description: "Standard Employee",
    },
  });

  // 5. Link Permissions to Roles
  console.log("Linking Permissions to Roles...");
  const allPerms = await prisma.permission.findMany({
    where: { workspaceId: workspace.id },
  });

  const adminAllResources = [
    "employees",
    "departments",
    "designations",
    "leaves",
    "attendance",
    "payroll",
    "helpdesk",
    "CompanyEvent",
  ];
  const essResources = [
    "employees",
    "attendance",
    "leave",
    "leaves",
    "payroll",
    "helpdesk",
    "appraisals",
    "CompanyEvent",
  ];

  for (const perm of allPerms) {
    // OWNER gets everything
    await prisma.rolePermission.upsert({
      where: {
        workspaceId_roleId_permissionId: {
          workspaceId: workspace.id,
          roleId: ownerRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        workspaceId: workspace.id,
        roleId: ownerRole.id,
        permissionId: perm.id,
      },
    });

    // ADMIN gets all 'scope: all' for admin resources + ESS 'own'
    const isAdminResource =
      adminAllResources.includes(perm.resource) && perm.scope === "all";
    const isEssOwnPerm =
      essResources.includes(perm.resource) && perm.scope === "own";
    if (isAdminResource || isEssOwnPerm) {
      await prisma.rolePermission.upsert({
        where: {
          workspaceId_roleId_permissionId: {
            workspaceId: workspace.id,
            roleId: adminRole.id,
            permissionId: perm.id,
          },
        },
        update: {},
        create: {
          workspaceId: workspace.id,
          roleId: adminRole.id,
          permissionId: perm.id,
        },
      });
    }

    // EMPLOYEE gets ESS 'own' OR 'all' if explicitly added to essResources (like CompanyEvent)
    const isEmployeePerm =
      essResources.includes(perm.resource) &&
      (perm.scope === "own" || (perm.resource === "CompanyEvent" && perm.scope === "all"));

    if (isEmployeePerm) {
      await prisma.rolePermission.upsert({
        where: {
          workspaceId_roleId_permissionId: {
            workspaceId: workspace.id,
            roleId: employeeRole.id,
            permissionId: perm.id,
          },
        },
        update: {},
        create: {
          workspaceId: workspace.id,
          roleId: employeeRole.id,
          permissionId: perm.id,
        },
      });
    }
  }

  // 6. Create Users and Employee Records
  console.log("Creating Users and Employee Records...");

  const usersToCreate = [
    {
      email: "admin@atlas.com",
      username: "admin",
      name: "System Admin",
      role: ownerRole,
      empNo: "EMP-001",
      firstName: "System",
      lastName: "Admin",
      salary: 120000,
    },
    {
      email: "hr@atlas.com",
      username: "hr_manager",
      name: "HR Manager",
      role: adminRole,
      empNo: "EMP-002",
      firstName: "HR",
      lastName: "Manager",
      salary: 85000,
    },
    {
      email: "employee@atlas.com",
      username: "john_doe",
      name: "John Doe",
      role: employeeRole,
      empNo: "EMP-003",
      firstName: "John",
      lastName: "Doe",
      salary: 50000,
    },
  ];

  for (const u of usersToCreate) {
    const authUser = await prisma.authUser.upsert({
      where: { email: u.email },
      update: {
        password: passwordHash,
      },
      create: {
        email: u.email,
        username: u.username,
        name: u.name,
        password: passwordHash,
        verified: true,
      },
    });

    // Link to workspace
    await prisma.workspaceMember.upsert({
      where: {
        workspaceId_userId: { workspaceId: workspace.id, userId: authUser.id },
      },
      update: { roleId: u.role.id },
      create: {
        workspaceId: workspace.id,
        userId: authUser.id,
        roleId: u.role.id,
      },
    });

    // Create Employee record
    await prisma.employee.upsert({
      where: {
        workspaceId_email: { workspaceId: workspace.id, email: u.email },
      },
      update: { userId: authUser.id },
      create: {
        workspaceId: workspace.id,
        employeeNumber: u.empNo,
        firstName: u.firstName,
        lastName: u.lastName,
        fullName: u.name,
        email: u.email,
        dateOfJoining: new Date("2024-01-01"),
        status: EmployeeStatus.ACTIVE,
        userId: authUser.id,
        baseSalary: u.salary,
      },
    });

    // Create AuthSecurity
    await prisma.authSecurity.upsert({
      where: { authId: authUser.id },
      update: {},
      create: {
        authId: authUser.id,
        failedAttempts: 0,
        lastPasswordChange: new Date(),
      },
    });
  }

  // 7. Salary Components
  console.log("Seeding Salary Components...");
  const components = [
    {
      name: "Basic Salary",
      abbr: "BS",
      type: SalaryComponentType.EARNING,
      isTaxable: true,
    },
    {
      name: "House Rent Allowance",
      abbr: "HRA",
      type: SalaryComponentType.EARNING,
      isTaxable: true,
    },
    {
      name: "Provident Fund",
      abbr: "PF",
      type: SalaryComponentType.DEDUCTION,
      isTaxable: false,
    },
  ];

  for (const comp of components) {
    await prisma.salaryComponent.upsert({
      where: { workspaceId_abbr: { workspaceId: workspace.id, abbr: comp.abbr } },
      update: {},
      create: { ...comp, workspaceId: workspace.id },
    });
  }

  // 8. Leave Types
  console.log("Seeding Leave Types...");
  const leaveTypes = [
    { name: "Privilege Leave", maxDaysAllowed: 18 },
    { name: "Sick Leave", maxDaysAllowed: 12 },
    { name: "Casual Leave", maxDaysAllowed: 12 },
  ];

  for (const lt of leaveTypes) {
    await prisma.leaveType.upsert({
      where: {
        workspaceId_name: { workspaceId: workspace.id, name: lt.name },
      },
      update: {},
      create: {
        workspaceId: workspace.id,
        name: lt.name,
        maxDaysAllowed: lt.maxDaysAllowed,
      },
    });
  }

  console.log("✅ Seeding completed successfully!");
  console.log("----------------------------------------------------");
  console.log("Admin: admin@atlas.com / Password123!");
  console.log("HR: hr@atlas.com / Password123!");
  console.log("Employee: employee@atlas.com / Password123!");
  console.log("----------------------------------------------------");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
