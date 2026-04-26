import { PrismaClient } from '.prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data (optional - comment out if you want to keep existing data)
  console.log('🧹 Cleaning existing data...');
  await prisma.userPermission.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.workspaceMember.deleteMany();
  await prisma.workspaceSettings.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.authSecurity.deleteMany();
  await prisma.authUser.deleteMany();

  // 1. Create Super Admin
  console.log('👤 Creating Super Admin...');
  const hashedPassword = await bcrypt.hash('Admin@123', 10);
  
  const superAdmin = await prisma.authUser.create({
    data: {
      email: 'admin@atlas-erp.com',
      password: hashedPassword,
      username: 'superadmin',
      globalRole: 'SUPERADMIN',
      verified: true,
      status: 'ACTIVE',
      profile: {
        create: {
          firstName: 'Super',
          lastName: 'Admin',
          timezone: 'UTC',
          language: 'en',
        },
      },
      security: {
        create: {
          mfaEnabled: false,
        },
      },
    },
  });

  // 2. Create Sample Workspace
  console.log('🏢 Creating sample workspace...');
  const workspace = await prisma.workspace.create({
    data: {
      name: 'Acme Corporation',
      subdomain: 'acme',
      status: 'ACTIVE',
      settings: {
        create: {
          baseCurrency: 'USD',
          dateFormat: 'YYYY-MM-DD',
          timeFormat: 'HH:mm:ss',
          fiscalYearStart: '01-01',
        },
      },
    },
  });

  // 3. Create Sample Users
  console.log('👥 Creating sample users...');
  
  // Owner
  const owner = await prisma.authUser.create({
    data: {
      email: 'owner@acme.com',
      password: hashedPassword,
      username: 'john_owner',
      globalRole: 'USER',
      verified: true,
      status: 'ACTIVE',
      profile: {
        create: {
          firstName: 'John',
          lastName: 'Owner',
          timezone: 'America/New_York',
          language: 'en',
        },
      },
      security: {
        create: {
          mfaEnabled: false,
        },
      },
    },
  });

  // Admin
  const admin = await prisma.authUser.create({
    data: {
      email: 'admin@acme.com',
      password: hashedPassword,
      username: 'jane_admin',
      globalRole: 'USER',
      verified: true,
      status: 'ACTIVE',
      profile: {
        create: {
          firstName: 'Jane',
          lastName: 'Admin',
          timezone: 'America/New_York',
          language: 'en',
        },
      },
      security: {
        create: {
          mfaEnabled: false,
        },
      },
    },
  });

  // Sales Manager
  const salesManager = await prisma.authUser.create({
    data: {
      email: 'sales.manager@acme.com',
      password: hashedPassword,
      username: 'bob_sales',
      globalRole: 'USER',
      verified: true,
      status: 'ACTIVE',
      profile: {
        create: {
          firstName: 'Bob',
          lastName: 'Sales',
          timezone: 'America/New_York',
          language: 'en',
        },
      },
      security: {
        create: {
          mfaEnabled: false,
        },
      },
    },
  });

  // Sales Rep
  const salesRep = await prisma.authUser.create({
    data: {
      email: 'sales.rep@acme.com',
      password: hashedPassword,
      username: 'alice_rep',
      globalRole: 'USER',
      verified: true,
      status: 'ACTIVE',
      profile: {
        create: {
          firstName: 'Alice',
          lastName: 'Rep',
          timezone: 'America/New_York',
          language: 'en',
        },
      },
      security: {
        create: {
          mfaEnabled: false,
        },
      },
    },
  });

  // 4. Add Users to Workspace
  console.log('🔗 Adding users to workspace...');
  
  await prisma.workspaceMember.createMany({
    data: [
      {
        workspaceId: workspace.id,
        userId: owner.id,
        role: 'OWNER',
        isActive: true,
      },
      {
        workspaceId: workspace.id,
        userId: admin.id,
        role: 'ADMIN',
        isActive: true,
      },
      {
        workspaceId: workspace.id,
        userId: salesManager.id,
        role: 'MANAGER',
        department: 'Sales',
        isActive: true,
      },
      {
        workspaceId: workspace.id,
        userId: salesRep.id,
        role: 'USER',
        department: 'Sales',
        isActive: true,
      },
    ],
  });

  // 5. Create Permissions
  console.log('🔐 Creating permissions...');
  
  const permissions = await prisma.permission.createMany({
    data: [
      // Lead permissions
      { workspaceId: workspace.id, resource: 'leads', action: 'create', scope: 'own', description: 'Create own leads' },
      { workspaceId: workspace.id, resource: 'leads', action: 'read', scope: 'own', description: 'Read own leads' },
      { workspaceId: workspace.id, resource: 'leads', action: 'read', scope: 'department', description: 'Read department leads' },
      { workspaceId: workspace.id, resource: 'leads', action: 'read', scope: 'all', description: 'Read all leads' },
      { workspaceId: workspace.id, resource: 'leads', action: 'update', scope: 'own', description: 'Update own leads' },
      { workspaceId: workspace.id, resource: 'leads', action: 'update', scope: 'all', description: 'Update all leads' },
      { workspaceId: workspace.id, resource: 'leads', action: 'delete', scope: 'all', description: 'Delete leads' },
      
      // Deal permissions
      { workspaceId: workspace.id, resource: 'deals', action: 'create', scope: 'own', description: 'Create own deals' },
      { workspaceId: workspace.id, resource: 'deals', action: 'read', scope: 'department', description: 'Read department deals' },
      { workspaceId: workspace.id, resource: 'deals', action: 'read', scope: 'all', description: 'Read all deals' },
      { workspaceId: workspace.id, resource: 'deals', action: 'update', scope: 'own', description: 'Update own deals' },
      { workspaceId: workspace.id, resource: 'deals', action: 'update', scope: 'all', description: 'Update all deals' },
      { workspaceId: workspace.id, resource: 'deals', action: 'approve', scope: 'department', description: 'Approve department deals' },
      { workspaceId: workspace.id, resource: 'deals', action: 'approve', scope: 'all', description: 'Approve all deals' },
      
      // Employee permissions
      { workspaceId: workspace.id, resource: 'employees', action: 'read', scope: 'all', description: 'Read all employees' },
      { workspaceId: workspace.id, resource: 'employees', action: 'create', scope: 'all', description: 'Create employees' },
      { workspaceId: workspace.id, resource: 'employees', action: 'update', scope: 'all', description: 'Update employees' },
    ],
  });

  // Get created permissions
  const allPermissions = await prisma.permission.findMany({
    where: { workspaceId: workspace.id },
  });

  // 6. Assign Role Permissions
  console.log('🎭 Assigning role permissions...');
  
  // ADMIN gets full access
  const adminPermissions = allPermissions.filter(p => 
    p.scope === 'all' || p.action === 'delete'
  );
  
  await prisma.rolePermission.createMany({
    data: adminPermissions.map(p => ({
      workspaceId: workspace.id,
      role: 'ADMIN',
      permissionId: p.id,
    })),
  });

  // MANAGER gets department access
  const managerPermissions = allPermissions.filter(p => 
    p.scope === 'department' || (p.resource === 'leads' && p.scope === 'own')
  );
  
  await prisma.rolePermission.createMany({
    data: managerPermissions.map(p => ({
      workspaceId: workspace.id,
      role: 'MANAGER',
      permissionId: p.id,
    })),
  });

  // USER gets own access
  const userPermissions = allPermissions.filter(p => 
    p.scope === 'own' && p.action !== 'delete'
  );
  
  await prisma.rolePermission.createMany({
    data: userPermissions.map(p => ({
      workspaceId: workspace.id,
      role: 'USER',
      permissionId: p.id,
    })),
  });

  // 7. Create Sample CRM Data
  console.log('📊 Creating sample CRM data...');
  
  // Create Organizations
  const org1 = await prisma.organization.create({
    data: {
      workspaceId: workspace.id,
      name: 'Tech Solutions Inc',
      website: 'https://techsolutions.com',
      industry: 'Technology',
      noOfEmployees: '51-200',
      annualRevenue: 5000000,
      createdBy: salesRep.id,
    },
  });

  const org2 = await prisma.organization.create({
    data: {
      workspaceId: workspace.id,
      name: 'Global Retail Corp',
      website: 'https://globalretail.com',
      industry: 'Retail',
      noOfEmployees: '201-500',
      annualRevenue: 15000000,
      createdBy: salesRep.id,
    },
  });

  // Create Leads
  await prisma.lead.createMany({
    data: [
      {
        workspaceId: workspace.id,
        leadNumber: 'LEAD-2026-00001',
        firstName: 'Michael',
        lastName: 'Johnson',
        fullName: 'Michael Johnson',
        email: 'michael.johnson@techsolutions.com',
        mobileNo: '+1-555-0101',
        jobTitle: 'CTO',
        organizationId: org1.id,
        leadOwnerId: salesRep.id,
        converted: false,
        createdBy: salesRep.id,
      },
      {
        workspaceId: workspace.id,
        leadNumber: 'LEAD-2026-00002',
        firstName: 'Sarah',
        lastName: 'Williams',
        fullName: 'Sarah Williams',
        email: 'sarah.williams@globalretail.com',
        mobileNo: '+1-555-0102',
        jobTitle: 'VP of Operations',
        organizationId: org2.id,
        leadOwnerId: salesRep.id,
        converted: false,
        createdBy: salesRep.id,
      },
    ],
  });

  // Create Contacts
  await prisma.contact.createMany({
    data: [
      {
        workspaceId: workspace.id,
        firstName: 'David',
        lastName: 'Brown',
        fullName: 'David Brown',
        email: 'david.brown@techsolutions.com',
        mobileNo: '+1-555-0201',
        jobTitle: 'IT Manager',
        organizationId: org1.id,
        createdBy: salesRep.id,
      },
      {
        workspaceId: workspace.id,
        firstName: 'Emma',
        lastName: 'Davis',
        fullName: 'Emma Davis',
        email: 'emma.davis@globalretail.com',
        mobileNo: '+1-555-0202',
        jobTitle: 'Procurement Manager',
        organizationId: org2.id,
        createdBy: salesRep.id,
      },
    ],
  });

  console.log('✅ Database seeded successfully!');
  console.log('\n📋 Sample Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Super Admin:');
  console.log('  Email: admin@atlas-erp.com');
  console.log('  Password: Admin@123');
  console.log('  Role: SUPERADMIN (Full system access)');
  console.log('\nWorkspace Owner:');
  console.log('  Email: owner@acme.com');
  console.log('  Password: Admin@123');
  console.log('  Role: OWNER (Full workspace access)');
  console.log('\nWorkspace Admin:');
  console.log('  Email: admin@acme.com');
  console.log('  Password: Admin@123');
  console.log('  Role: ADMIN');
  console.log('\nSales Manager:');
  console.log('  Email: sales.manager@acme.com');
  console.log('  Password: Admin@123');
  console.log('  Role: MANAGER (Sales Department)');
  console.log('\nSales Rep:');
  console.log('  Email: sales.rep@acme.com');
  console.log('  Password: Admin@123');
  console.log('  Role: USER (Sales Department)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
