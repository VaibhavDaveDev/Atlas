import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class WorkspaceService {
  private readonly logger = new Logger(WorkspaceService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates a new invite for a workspace
   */
  async createInvite(workspaceId: string, email: string, role: string, invitedById: string) {
    const workspace = await this.prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspace) throw new NotFoundException('Workspace not found');

    // Check if user is already a member
    const existingUser = await this.prisma.authUser.findUnique({ where: { email } });
    if (existingUser) {
      const existingMember = await this.prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: existingUser.id } },
      });
      if (existingMember) throw new BadRequestException('User is already a member of this workspace');
    }

    // Generate a secure token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // Check if there is already a pending invite, update it if so
    const existingInvite = await this.prisma.workspaceInvite.findFirst({
      where: { workspaceId, email },
    });

    if (existingInvite) {
      return this.prisma.workspaceInvite.update({
        where: { id: existingInvite.id },
        data: { token, expiresAt, status: 'PENDING', role: role as any, invitedById },
      });
    }

    return this.prisma.workspaceInvite.create({
      data: {
        workspaceId,
        email,
        role: role as any,
        token,
        status: 'PENDING',
        invitedById,
        expiresAt,
      },
    });
  }

  /**
   * Get pending invites for a specific email
   */
  async getPendingInvitesByEmail(email: string) {
    return this.prisma.workspaceInvite.findMany({
      where: { email, status: 'PENDING', expiresAt: { gt: new Date() } },
      include: {
        workspace: { select: { name: true, subdomain: true } },
        invitedBy: { select: { email: true, username: true } },
      },
    });
  }

  /**
   * Accept an invite
   */
  async acceptInvite(token: string, userId: string, userEmail: string) {
    const invite = await this.prisma.workspaceInvite.findUnique({ where: { token } });
    if (!invite) throw new NotFoundException('Invite not found or invalid');
    if (invite.status !== 'PENDING' || invite.expiresAt < new Date()) {
      throw new BadRequestException('Invite has expired or already been processed');
    }
    
    // Ensure the invite matches the logged in user's email
    if (invite.email.toLowerCase() !== userEmail.toLowerCase()) {
      throw new BadRequestException('This invite is not for your email address');
    }

    // Add to workspace
    await this.prisma.$transaction(async (tx) => {
      await tx.workspaceMember.create({
        data: {
          workspaceId: invite.workspaceId,
          userId,
          role: invite.role,
        },
      });

      await tx.workspaceInvite.update({
        where: { id: invite.id },
        data: { status: 'ACCEPTED' },
      });
    });

    return { success: true, message: 'Invite accepted' };
  }
}
