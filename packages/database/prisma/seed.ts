import {
  PrismaClient,
  WorkspaceStatus,
  SalaryComponentType,
  EmployeeStatus,
  GlobalRole,
  AccountType,
  ProjectRole,
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

  await prisma.authAccount.upsert({
    where: {
      providerId_accountId: {
        providerId: "credential",
        accountId: superAdmin.email,
      },
    },
    update: {
      password: passwordHash,
    },
    create: {
      userId: superAdmin.id,
      providerId: "credential",
      accountId: superAdmin.email,
      password: passwordHash,
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

    // --- Finance permissions (scope: all) ---
    { resource: "finance_accounts", action: "read", scope: "all" },
    { resource: "finance_accounts", action: "create", scope: "all" },
    { resource: "finance_accounts", action: "update", scope: "all" },
    { resource: "finance_accounts", action: "delete", scope: "all" },
    { resource: "finance_journals", action: "read", scope: "all" },
    { resource: "finance_journals", action: "create", scope: "all" },
    { resource: "finance_journals", action: "delete", scope: "all" },
    { resource: "finance_invoices", action: "read", scope: "all" },
    { resource: "finance_invoices", action: "create", scope: "all" },
    { resource: "finance_invoices", action: "update", scope: "all" },
    { resource: "finance_invoices", action: "delete", scope: "all" },
    { resource: "finance_payments", action: "read", scope: "all" },
    { resource: "finance_payments", action: "create", scope: "all" },
    { resource: "finance_payments", action: "delete", scope: "all" },

    // --- Project permissions (scope: all) ---
    { resource: "projects", action: "read", scope: "all" },
    { resource: "projects", action: "create", scope: "all" },
    { resource: "projects", action: "update", scope: "all" },
    { resource: "projects", action: "delete", scope: "all" },

    // --- ESS / Employee permissions (scope: own) ---
    { resource: "employees", action: "read", scope: "own" },
    { resource: "employees", action: "update", scope: "own" },
    { resource: "attendance", action: "read", scope: "own" },
    { resource: "attendance", action: "create", scope: "own" },
    { resource: "attendance", action: "update", scope: "own" },
    { resource: "leave", action: "read", scope: "own" },
    { resource: "leave", action: "create", scope: "own" },
    { resource: "leave", action: "update", scope: "own" },
    { resource: "leaves", action: "read", scope: "own" },

    // --- Employee Project Access ---
    { resource: "projects", action: "read", scope: "own" },
    { resource: "projects", action: "update", scope: "own" },

    // --- Employee ESS Additional Access ---
    { resource: "payroll", action: "read", scope: "own" },
    { resource: "payroll", action: "create", scope: "own" },
    { resource: "payroll", action: "update", scope: "own" },
    { resource: "appraisals", action: "read", scope: "own" },
    { resource: "appraisals", action: "update", scope: "own" },
    { resource: "helpdesk", action: "read", scope: "own" },
    { resource: "helpdesk", action: "create", scope: "own" },
    { resource: "helpdesk", action: "update", scope: "own" },
  ];

  for (const perm of permissionsData) {
    const existing = await prisma.permission.findFirst({
      where: {
        workspaceId: null,
        resource: perm.resource,
        action: perm.action,
        scope: perm.scope,
      }
    });

    if (!existing) {
      await prisma.permission.create({
        data: {
          ...perm,
          workspaceId: null,
        },
      });
    }
  }

  // 4. Create Roles and Assign Permissions
  console.log("Creating Roles...");
  const roles = [
    { name: "OWNER", description: "Workspace Owner - Full Access" },
    { name: "ADMIN", description: "Administrator - Full Access" },
    { name: "HR", description: "HR Manager - People & Payroll" },
    { name: "FINANCE", description: "Finance Manager - Accounts" },
    { name: "USER", description: "Standard Employee - Self Service" },
  ];

  for (const roleData of roles) {
    const role = await prisma.role.upsert({
      where: {
        workspaceId_name: { workspaceId: workspace.id, name: roleData.name },
      },
      update: {},
      create: {
        ...roleData,
        workspaceId: workspace.id,
      },
    });

    console.log(`Assigning permissions to role: ${role.name}...`);
    // Assign Permissions to Roles
    const allPerms = await prisma.permission.findMany({
      where: { workspaceId: null }
    });

    for (const p of allPerms) {
      let shouldAssign = false;

      if (role.name === "OWNER" || role.name === "ADMIN") {
        shouldAssign = true;
      } else if (role.name === "USER") {
        // User gets all "own" permissions
        if (p.scope === "own") shouldAssign = true;

        // IMPORTANT: Also allow user to CREATE projects if they are Team Leads? 
        // No, creation is usually a Manager action. But Leads might need 'update' on projects.
        // We already have projects:read:own and projects:update:own.
      } else if (role.name === "HR") {
        if (["employees", "departments", "designations", "leaves", "attendance", "payroll", "helpdesk"].includes(p.resource)) {
          shouldAssign = true;
        }
      } else if (role.name === "FINANCE") {
        if (p.resource.startsWith("finance_")) {
          shouldAssign = true;
        }
      }

      if (shouldAssign) {
        await prisma.rolePermission.upsert({
          where: {
            workspaceId_roleId_permissionId: {
              workspaceId: workspace.id,
              roleId: role.id,
              permissionId: p.id,
            },
          },
          update: {},
          create: {
            workspaceId: workspace.id,
            roleId: role.id,
            permissionId: p.id,
          },
        });
      }
    }
  }

  // 5. Create Admin User
  console.log("Creating Workspace Admin (admin@atlas.com)...");
  const adminRole = await prisma.role.findFirst({
    where: { workspaceId: workspace.id, name: "OWNER" },
  });
  const adminUser = await prisma.authUser.upsert({
    where: { email: "admin@atlas.com" },
    update: {},
    create: {
      email: "admin@atlas.com",
      username: "admin",
      name: "Amdox Admin",
      password: passwordHash,
      verified: true,
    },
  });

  await prisma.authAccount.upsert({
    where: {
      providerId_accountId: {
        providerId: "credential",
        accountId: adminUser.email,
      },
    },
    update: {
      password: passwordHash,
    },
    create: {
      userId: adminUser.id,
      providerId: "credential",
      accountId: adminUser.email,
      password: passwordHash,
    },
  });

  await prisma.workspaceMember.upsert({
    where: {
      workspaceId_userId: { workspaceId: workspace.id, userId: adminUser.id },
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      userId: adminUser.id,
      roleId: adminRole!.id,
      isActive: true,
    },
  });

  // 6. Create Departments & Designations
  console.log("Creating Departments & Designations...");
  const depts = ["Engineering", "Human Resources", "Finance", "Sales", "IT"];
  for (const name of depts) {
    await prisma.department.upsert({
      where: { workspaceId_name: { workspaceId: workspace.id, name } },
      update: {},
      create: { name, code: name.substring(0, 3).toUpperCase(), workspaceId: workspace.id },
    });
  }

  const engDept = await prisma.department.findFirst({ where: { name: "Engineering", workspaceId: workspace.id } });

  const titles = ["Software Engineer", "HR Manager", "Accountant", "CTO", "Project Manager"];
  for (const title of titles) {
    await prisma.designation.upsert({
      where: { workspaceId_title: { workspaceId: workspace.id, title } },
      update: {},
      create: { title, level: 1, workspaceId: workspace.id },
    });
  }

  const sdeDesig = await prisma.designation.findFirst({ where: { title: "Software Engineer", workspaceId: workspace.id } });
  const pmDesig = await prisma.designation.findFirst({ where: { title: "Project Manager", workspaceId: workspace.id } });

  // Create Employee record for the Admin
  console.log("Creating Employee record for Admin...");
  await prisma.employee.upsert({
    where: { workspaceId_email: { workspaceId: workspace.id, email: "admin@atlas.com" } },
    update: {},
    create: {
      workspaceId: workspace.id,
      userId: adminUser.id,
      employeeNumber: "ADMIN001",
      firstName: "Amdox",
      lastName: "Admin",
      fullName: "Amdox Admin",
      email: "admin@atlas.com",
      departmentId: engDept!.id,
      designationId: pmDesig!.id,
      status: EmployeeStatus.ACTIVE,
      dateOfJoining: new Date("2024-01-01"),
    },
  });

  // 7. Create Employees
  console.log("Creating Employees...");
  const employeesToCreate = [
    { email: "employee@atlas.com", name: "John Doe", username: "jdoe", num: "EMP001", desig: sdeDesig },
    { email: "jane@atlas.com", name: "Jane Smith", username: "jsmith", num: "EMP002", desig: sdeDesig },
    { email: "mike@atlas.com", name: "Mike Ross", username: "mross", num: "EMP003", desig: sdeDesig },
    { email: "harvey@atlas.com", name: "Harvey Specter", username: "hspecter", num: "EMP004", desig: pmDesig },
  ];

  const userRole = await prisma.role.findFirst({ where: { workspaceId: workspace.id, name: "USER" } });

  const createdEmployees = [];

  for (const emp of employeesToCreate) {
    const authUser = await prisma.authUser.upsert({
      where: { email: emp.email },
      update: {},
      create: {
        email: emp.email,
        username: emp.username,
        name: emp.name,
        password: passwordHash,
        verified: true,
      },
    });

    await prisma.authAccount.upsert({
      where: {
        providerId_accountId: {
          providerId: "credential",
          accountId: authUser.email,
        },
      },
      update: {
        password: passwordHash,
      },
      create: {
        userId: authUser.id,
        providerId: "credential",
        accountId: authUser.email,
        password: passwordHash,
      },
    });

    await prisma.workspaceMember.upsert({
      where: { workspaceId_userId: { workspaceId: workspace.id, userId: authUser.id } },
      update: {},
      create: { workspaceId: workspace.id, userId: authUser.id, roleId: userRole!.id, isActive: true },
    });

    const employee = await prisma.employee.upsert({
      where: { workspaceId_email: { workspaceId: workspace.id, email: emp.email } },
      update: {},
      create: {
        workspaceId: workspace.id,
        userId: authUser.id,
        employeeNumber: emp.num,
        firstName: emp.name.split(' ')[0],
        lastName: emp.name.split(' ')[1],
        fullName: emp.name,
        email: emp.email,
        departmentId: engDept!.id,
        designationId: emp.desig!.id,
        status: EmployeeStatus.ACTIVE,
        dateOfJoining: new Date("2024-01-01"),
      },
    });
    createdEmployees.push(employee);
  }

  // 10. Projects
  console.log("Seeding Projects & Members...");
  const projects = [
    {
      projectCode: "PRJ-001",
      projectName: "ERP Implementation",
      description: "Implementing the new Atlas ERP suite.",
      startDate: new Date("2024-06-01"),
      budgetAmount: 50000,
    },
    {
      projectCode: "PRJ-002",
      projectName: "Cloud Migration",
      description: "Moving on-premise servers to AWS.",
      startDate: new Date("2024-07-15"),
      budgetAmount: 25000,
    },
  ];

  const john = createdEmployees.find(e => e.email === "employee@atlas.com");
  const jane = createdEmployees.find(e => e.email === "jane@atlas.com");

  for (const prj of projects) {
    const createdProject = await prisma.project.upsert({
      where: { workspaceId_projectCode: { workspaceId: workspace.id, projectCode: prj.projectCode } },
      update: {},
      create: { ...prj, workspaceId: workspace.id, createdBy: superAdmin.id },
    });

    // Add John and Jane as Members/Leads
    if (john) {
      await prisma.projectMember.upsert({
        where: { projectId_employeeId: { projectId: createdProject.id, employeeId: john.id } },
        update: {},
        create: { projectId: createdProject.id, employeeId: john.id, role: ProjectRole.LEAD },
      });
    }

    if (jane && prj.projectCode === "PRJ-001") {
      await prisma.projectMember.upsert({
        where: { projectId_employeeId: { projectId: createdProject.id, employeeId: jane.id } },
        update: {},
        create: { projectId: createdProject.id, employeeId: jane.id, role: ProjectRole.MEMBER },
      });
    }

    // Add tasks
    if (prj.projectCode === "PRJ-001") {
      const task = await prisma.task.upsert({
        where: { workspaceId_taskNumber: { workspaceId: workspace.id, taskNumber: "PRJ-001-1" } },
        update: {},
        create: {
          workspaceId: workspace.id,
          projectId: createdProject.id,
          taskNumber: "PRJ-001-1",
          title: "Setup Database",
          status: "IN_PROGRESS",
          priority: "HIGH",
          createdBy: superAdmin.id,
        },
      });

      if (john) {
        await prisma.taskAssignment.upsert({
          where: { taskId_employeeId: { taskId: task.id, employeeId: john.id } },
          update: {},
          create: { taskId: task.id, employeeId: john.id, allocatedHours: 10 },
        });

        // Use create instead of upsert for time logs as they don't have unique index on ID alone without workspaceId
        await prisma.timeLog.create({
          data: {
            workspaceId: workspace.id,
            taskId: task.id,
            employeeId: john.id,
            hours: 4,
            description: "Initial setup of Prisma schema.",
            date: new Date(),
          }
        });
      }
    }
  }

  console.log("✅ Seeding completed successfully!");
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