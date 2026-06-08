/**
 * Diagnostic Script: Check Auth Sessions
 * 
 * This script checks the actual state of sessions in your database
 * Run this with: npx tsx check-sessions.ts
 */

import { PrismaClient } from '@atlas/database';

const prisma = new PrismaClient();

async function main() {
  console.log('\n🔍 Checking Auth Sessions in Database...\n');

  // 1. Check all auth sessions
  const allSessions = await prisma.authSession.findMany({
    include: {
      user: {
        select: {
          id: true,
          email: true,
          username: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  console.log(`📊 Total sessions in database: ${allSessions.length}\n`);

  if (allSessions.length === 0) {
    console.log('❌ NO SESSIONS FOUND!');
    console.log('\nThis means:');
    console.log('  1. No users have logged in through Better Auth');
    console.log('  2. Sessions were created but have been deleted');
    console.log('  3. Better Auth is not creating sessions in the database\n');
  } else {
    console.log('✅ Found sessions:\n');
    
    for (const session of allSessions) {
      const now = new Date();
      const isExpired = session.expiresAt < now;
      
      console.log(`Session ID: ${session.id}`);
      console.log(`  User: ${session.user.email} (${session.user.username})`);
      console.log(`  Token: ${session.token.substring(0, 20)}...`);
      console.log(`  Created: ${session.createdAt.toISOString()}`);
      console.log(`  Updated: ${session.updatedAt.toISOString()}`);
      console.log(`  Expires: ${session.expiresAt.toISOString()}`);
      console.log(`  Status: ${isExpired ? '🔴 EXPIRED' : '🟢 ACTIVE'}`);
      console.log(`  IP: ${session.ipAddress || 'N/A'}`);
      console.log(`  User Agent: ${session.userAgent?.substring(0, 50) || 'N/A'}...\n`);
    }
  }

  // 2. Check active sessions (non-expired)
  const activeSessions = await prisma.authSession.findMany({
    where: {
      expiresAt: { gt: new Date() },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          username: true,
        },
      },
    },
  });

  console.log(`\n🟢 Active (non-expired) sessions: ${activeSessions.length}\n`);

  // 3. Check workspace members
  const workspaces = await prisma.workspace.findMany({
    select: {
      id: true,
      name: true,
      subdomain: true,
      _count: {
        select: {
          members: {
            where: { isActive: true },
          },
        },
      },
    },
  });

  console.log(`📁 Workspaces:\n`);
  for (const workspace of workspaces) {
    console.log(`  ${workspace.name} (${workspace.subdomain})`);
    console.log(`    ID: ${workspace.id}`);
    console.log(`    Active members: ${workspace._count.members}\n`);
  }

  // 4. Check workspace-specific sessions
  for (const workspace of workspaces) {
    const members = await prisma.workspaceMember.findMany({
      where: {
        workspaceId: workspace.id,
        isActive: true,
      },
      select: {
        userId: true,
        user: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
      },
    });

    const userIds = members.map(m => m.userId);
    
    const workspaceSessions = await prisma.authSession.findMany({
      where: {
        userId: { in: userIds },
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
      },
    });

    console.log(`🔐 Active sessions for workspace "${workspace.name}":`);
    console.log(`   Members: ${members.length}`);
    console.log(`   Active sessions: ${workspaceSessions.length}`);
    
    if (workspaceSessions.length > 0) {
      for (const sess of workspaceSessions) {
        console.log(`     - ${sess.user.email} (${sess.user.username})`);
      }
    } else {
      console.log(`     ❌ No active sessions for any member`);
    }
    console.log('');
  }

  // 5. Check Better Auth accounts
  const accounts = await prisma.authAccount.findMany({
    where: {
      providerId: 'credential',
    },
    select: {
      accountId: true,
      userId: true,
      user: {
        select: {
          email: true,
          username: true,
          verified: true,
        },
      },
    },
  });

  console.log(`\n👥 Users with credential accounts: ${accounts.length}\n`);
  for (const account of accounts) {
    console.log(`  ${account.user.email} (${account.user.username})`);
    console.log(`    Verified: ${account.user.verified ? '✅' : '❌'}`);
    console.log(`    User ID: ${account.userId}`);
    console.log('');
  }

  // 6. Recommendations
  console.log('\n💡 Diagnostic Summary:\n');
  
  if (allSessions.length === 0) {
    console.log('❌ ISSUE CONFIRMED: No sessions in database');
    console.log('\nPossible causes:');
    console.log('  1. Better Auth is not creating sessions (check Better Auth config)');
    console.log('  2. Sessions are being created but immediately deleted');
    console.log('  3. Login is failing before session creation');
    console.log('  4. Session model mapping issue in Better Auth adapter');
    console.log('\nNext steps:');
    console.log('  1. Try logging in through the UI');
    console.log('  2. Check browser DevTools Network tab for /sign-in/email response');
    console.log('  3. Check API logs for session creation');
    console.log('  4. Run this script again after login attempt');
  } else if (activeSessions.length === 0) {
    console.log('⚠️  Sessions exist but all are expired');
    console.log('\nNext steps:');
    console.log('  1. Log in again to create fresh sessions');
    console.log('  2. Check session expiry configuration in Better Auth');
  } else {
    console.log('✅ Sessions are working!');
    console.log(`   Found ${activeSessions.length} active session(s)`);
    console.log('\nIf admin dashboard shows empty:');
    console.log('  1. Check workspace ID in the URL');
    console.log('  2. Verify users are members of that workspace');
    console.log('  3. Check API endpoint is being called correctly');
  }
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
