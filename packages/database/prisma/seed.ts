import {
  PrismaClient,
  WorkspaceStatus,
  EmployeeStatus,
  GlobalRole,
  ProjectRole,
} from "../index";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ─── Credentials ────────────────────────────────────────────────────────────
// These are the ONLY place passwords are defined. Do NOT commit this file with actual passwords.
const CREDENTIALS = {
  superAdmin: { email: "admin@atlas.com", password: "Password123!" },
  john: { email: "employee@atlas.com", password: "Password123!" },
  jane: { email: "jane@atlas.com", password: "Password123!" },
  mike: { email: "mike@atlas.com", password: "Password123!" },
  harvey: { email: "harvey@atlas.com", password: "Password123!" },
};

async function main() {
  console.log("🌱 Starting unified database seeding...");

  // Pre-hash all passwords
  const hashes = {
    superAdmin: await bcrypt.hash(CREDENTIALS.superAdmin.password, 12),
    john: await bcrypt.hash(CREDENTIALS.john.password, 12),
    jane: await bcrypt.hash(CREDENTIALS.jane.password, 12),
    mike: await bcrypt.hash(CREDENTIALS.mike.password, 12),
    harvey: await bcrypt.hash(CREDENTIALS.harvey.password, 12),
  };

  // ── 1. Super Admin (global role + workspace OWNER) ─────────────────────────
  console.log(`Creating Super Admin (${CREDENTIALS.superAdmin.email})...`);
  const superAdmin = await prisma.authUser.upsert({
    where: { email: CREDENTIALS.superAdmin.email },
    update: {
      globalRole: GlobalRole.SUPERADMIN,
      password: hashes.superAdmin,
      verified: true,
    },
    create: {
      email: CREDENTIALS.superAdmin.email,
      username: "atlas_owner",
      name: "Atlas Workspace Owner",
      password: hashes.superAdmin,
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
    update: { password: hashes.superAdmin },
    create: {
      userId: superAdmin.id,
      providerId: "credential",
      accountId: superAdmin.email,
      password: hashes.superAdmin,
    },
  });

  // ── 2. Workspace ───────────────────────────────────────────────────────────
  console.log('Creating "Amdox Atlas" workspace...');
  const workspace = await prisma.workspace.upsert({
    where: { subdomain: "amdox" },
    update: { status: WorkspaceStatus.ACTIVE },
    create: {
      name: "Amdox Atlas",
      subdomain: "amdox",
      status: WorkspaceStatus.ACTIVE,
    },
  });

  // ── 3. Permissions ─────────────────────────────────────────────────────────
  console.log("Creating Permissions...");
  const permissionsData = [
    // Admin / HR (scope: all)
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
    // Finance (scope: all)
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
    // Projects (scope: all)
    { resource: "projects", action: "read", scope: "all" },
    { resource: "projects", action: "create", scope: "all" },
    { resource: "projects", action: "update", scope: "all" },
    { resource: "projects", action: "delete", scope: "all" },
    // ESS / Employee (scope: own)
    { resource: "employees", action: "read", scope: "own" },
    { resource: "employees", action: "update", scope: "own" },
    { resource: "attendance", action: "read", scope: "own" },
    { resource: "attendance", action: "create", scope: "own" },
    { resource: "attendance", action: "update", scope: "own" },
    { resource: "leave", action: "read", scope: "own" },
    { resource: "leave", action: "create", scope: "own" },
    { resource: "leave", action: "update", scope: "own" },
    { resource: "leaves", action: "read", scope: "own" },
    { resource: "projects", action: "read", scope: "own" },
    { resource: "projects", action: "update", scope: "own" },
    { resource: "payroll", action: "read", scope: "own" },
    { resource: "appraisals", action: "read", scope: "own" },
    { resource: "appraisals", action: "update", scope: "own" },
    { resource: "helpdesk", action: "read", scope: "own" },
    { resource: "helpdesk", action: "create", scope: "own" },
    { resource: "helpdesk", action: "update", scope: "own" },

    // Workspace administration (scope: all)
    { resource: "workspace", action: "read", scope: "all" },
    { resource: "workspace", action: "update", scope: "all" },
    { resource: "workspace", action: "manage", scope: "all" },
  ];

  for (const perm of permissionsData) {
    const existing = await prisma.permission.findFirst({
      where: { workspaceId: null, resource: perm.resource, action: perm.action, scope: perm.scope },
    });
    if (!existing) {
      await prisma.permission.create({ data: { ...perm, workspaceId: null } });
    }
  }

  // ── 4. Roles + Permission Assignments ─────────────────────────────────────
  console.log("Creating Roles...");
  const roleDefinitions = [
    { name: "OWNER", description: "Workspace Owner - Full Access" },
    { name: "ADMIN", description: "Administrator - Full Access" },
    { name: "HR", description: "HR Manager - People & Payroll" },
    { name: "FINANCE", description: "Finance Manager - Accounts" },
    { name: "USER", description: "Standard Employee - Self Service" },
  ];

  const allPerms = await prisma.permission.findMany({ where: { workspaceId: null } });

  for (const roleData of roleDefinitions) {
    const role = await prisma.role.upsert({
      where: { workspaceId_name: { workspaceId: workspace.id, name: roleData.name } },
      update: {},
      create: { ...roleData, workspaceId: workspace.id },
    });

    console.log(`  Assigning permissions → ${role.name}`);

    for (const p of allPerms) {
      let shouldAssign = false;

      if (role.name === "OWNER" || role.name === "ADMIN") {
        // Full access to everything
        shouldAssign = true;
      } else if (role.name === "HR") {
        // HR manages people, payroll, leaves, attendance, helpdesk
        shouldAssign = ["employees", "departments", "designations", "leaves", "leave",
          "attendance", "payroll", "helpdesk", "CompanyEvent"].includes(p.resource);
      } else if (role.name === "FINANCE") {
        // Finance manages all finance_* resources
        shouldAssign = p.resource.startsWith("finance_");
      } else if (role.name === "USER") {
        // Standard employees get their own-scope permissions only
        shouldAssign = p.scope === "own";
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
          create: { workspaceId: workspace.id, roleId: role.id, permissionId: p.id },
        });
      }
    }
  }

  // ── 5. Departments & Designations ──────────────────────────────────────────
  console.log("Creating Departments & Designations...");
  const deptNames = ["Engineering", "Human Resources", "Finance", "Sales", "IT"];
  for (const name of deptNames) {
    await prisma.department.upsert({
      where: { workspaceId_name: { workspaceId: workspace.id, name } },
      update: {},
      create: { name, code: name.substring(0, 3).toUpperCase(), workspaceId: workspace.id },
    });
  }

  const engDept = await prisma.department.findFirstOrThrow({
    where: { name: "Engineering", workspaceId: workspace.id },
  });

  const titleList = ["Software Engineer", "HR Manager", "Accountant", "CTO", "Project Manager"];
  for (const title of titleList) {
    await prisma.designation.upsert({
      where: { workspaceId_title: { workspaceId: workspace.id, title } },
      update: {},
      create: { title, level: 1, workspaceId: workspace.id },
    });
  }

  const sdeDesig = await prisma.designation.findFirstOrThrow({
    where: { title: "Software Engineer", workspaceId: workspace.id },
  });
  const pmDesig = await prisma.designation.findFirstOrThrow({
    where: { title: "Project Manager", workspaceId: workspace.id },
  });
  const ctoDesig = await prisma.designation.findFirstOrThrow({
    where: { title: "CTO", workspaceId: workspace.id },
  });

  // ── 6. Super Admin → Workspace OWNER membership + Employee record ──────────
  // The owner is both a SUPERADMIN (global) and the workspace OWNER (local).
  const ownerRole = await prisma.role.findFirstOrThrow({
    where: { workspaceId: workspace.id, name: "OWNER" },
  });

  await prisma.workspaceMember.upsert({
    where: { workspaceId_userId: { workspaceId: workspace.id, userId: superAdmin.id } },
    update: {},
    create: {
      workspaceId: workspace.id,
      userId: superAdmin.id,
      roleId: ownerRole.id,
      isActive: true,
    },
  });

  await prisma.employee.upsert({
    where: { workspaceId_email: { workspaceId: workspace.id, email: superAdmin.email } },
    update: {},
    create: {
      workspaceId: workspace.id,
      userId: superAdmin.id,
      employeeNumber: "OWNER001",
      firstName: "Atlas",
      lastName: "Owner",
      fullName: "Atlas Workspace Owner",
      email: superAdmin.email,
      departmentId: engDept.id,
      designationId: ctoDesig.id,
      status: EmployeeStatus.ACTIVE,
      dateOfJoining: new Date("2024-01-01"),
    },
  });

  // ── 7. Sample Employees ────────────────────────────────────────────────────
  console.log("Creating Sample Employees...");

  const userRole = await prisma.role.findFirstOrThrow({
    where: { workspaceId: workspace.id, name: "USER" },
  });

  const employeesToCreate = [
    { cred: CREDENTIALS.john, hash: hashes.john, name: "John Doe", username: "jdoe", num: "EMP001", desig: sdeDesig },
    { cred: CREDENTIALS.jane, hash: hashes.jane, name: "Jane Smith", username: "jsmith", num: "EMP002", desig: sdeDesig },
    { cred: CREDENTIALS.mike, hash: hashes.mike, name: "Mike Ross", username: "mross", num: "EMP003", desig: sdeDesig },
    { cred: CREDENTIALS.harvey, hash: hashes.harvey, name: "Harvey Specter", username: "hspecter", num: "EMP004", desig: pmDesig },
  ];

  const createdEmployees: Awaited<ReturnType<typeof prisma.employee.upsert>>[] = [];

  for (const emp of employeesToCreate) {
    const authUser = await prisma.authUser.upsert({
      where: { email: emp.cred.email },
      update: { password: emp.hash },
      create: {
        email: emp.cred.email,
        username: emp.username,
        name: emp.name,
        password: emp.hash,
        verified: true,
      },
    });

    await prisma.authAccount.upsert({
      where: {
        providerId_accountId: { providerId: "credential", accountId: authUser.email },
      },
      update: { password: emp.hash },
      create: {
        userId: authUser.id,
        providerId: "credential",
        accountId: authUser.email,
        password: emp.hash,
      },
    });

    await prisma.workspaceMember.upsert({
      where: { workspaceId_userId: { workspaceId: workspace.id, userId: authUser.id } },
      update: {},
      create: { workspaceId: workspace.id, userId: authUser.id, roleId: userRole.id, isActive: true },
    });

    const employee = await prisma.employee.upsert({
      where: { workspaceId_email: { workspaceId: workspace.id, email: emp.cred.email } },
      update: {},
      create: {
        workspaceId: workspace.id,
        userId: authUser.id,
        employeeNumber: emp.num,
        firstName: emp.name.split(" ")[0],
        lastName: emp.name.split(" ")[1],
        fullName: emp.name,
        email: emp.cred.email,
        departmentId: engDept.id,
        designationId: emp.desig.id,
        status: EmployeeStatus.ACTIVE,
        dateOfJoining: new Date("2024-01-01"),
      },
    });

    createdEmployees.push(employee);
  }

  // ── 8. Projects ────────────────────────────────────────────────────────────
  console.log("Seeding Projects & Members...");

  const john = createdEmployees.find(e => e.email === CREDENTIALS.john.email);
  const jane = createdEmployees.find(e => e.email === CREDENTIALS.jane.email);

  const projectsData = [
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
      description: "Moving on-premise servers to Cloudflare & Render.",
      startDate: new Date("2024-07-15"),
      budgetAmount: 25000,
    },
  ];

  for (const prj of projectsData) {
    const createdProject = await prisma.project.upsert({
      where: { workspaceId_projectCode: { workspaceId: workspace.id, projectCode: prj.projectCode } },
      update: {},
      create: { ...prj, workspaceId: workspace.id, createdBy: superAdmin.id },
    });

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

    // Seed a sample task + time log for PRJ-001 (guarded against duplicates)
    if (prj.projectCode === "PRJ-001" && john) {
      const task = await prisma.task.upsert({
        where: { workspaceId_taskNumber: { workspaceId: workspace.id, taskNumber: "PRJ-001-1" } },
        update: {},
        create: {
          workspaceId: workspace.id,
          projectId: createdProject.id,
          taskNumber: "PRJ-001-1",
          title: "Setup Database Schema",
          status: "IN_PROGRESS",
          priority: "HIGH",
          createdBy: superAdmin.id,
        },
      });

      await prisma.taskAssignment.upsert({
        where: { taskId_employeeId: { taskId: task.id, employeeId: john.id } },
        update: {},
        create: { taskId: task.id, employeeId: john.id, allocatedHours: 10 },
      });

      // Guard: only create the time log if none exists for this task+employee
      const existingLog = await prisma.timeLog.findFirst({
        where: { taskId: task.id, employeeId: john.id },
      });
      if (!existingLog) {
        await prisma.timeLog.create({
          data: {
            workspaceId: workspace.id,
            taskId: task.id,
            employeeId: john.id,
            hours: 4,
            description: "Initial setup of Prisma schema.",
            date: new Date("2024-06-05"),
          },
        });
      }
    }
  }

  console.log("\n✅ Seeding completed successfully!");
  console.log("\n📋 Account Summary:");
  console.log(`  🔑 Owner/SuperAdmin : ${CREDENTIALS.superAdmin.email}`);
  console.log(`  👤 John Doe         : ${CREDENTIALS.john.email}`);
  console.log(`  👤 Jane Smith       : ${CREDENTIALS.jane.email}`);
  console.log(`  👤 Mike Ross        : ${CREDENTIALS.mike.email}`);
  console.log(`  👤 Harvey Specter   : ${CREDENTIALS.harvey.email}`);
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