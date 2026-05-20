'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { Users, MoreHorizontal, UserPlus, Mail, Shield, ShieldAlert, ShieldCheck, Loader2, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { workspaceApi, WorkspaceMember } from '@/lib/workspace';
import { roleApi, Role } from '@/lib/roles';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';

export default function MembersDirectoryPage() {
  const { workspace, user: currentUser } = useAuth();
  const router = useRouter();
  
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (workspace?.workspaceId) {
      loadData();
    }
  }, [workspace]);

  const loadData = async () => {
    if (!workspace) return;
    setIsLoading(true);
    try {
      const [membersData, rolesData, invitesData] = await Promise.all([
        workspaceApi.getMembers(workspace.workspaceId),
        roleApi.getRoles(workspace.workspaceId),
        workspaceApi.getInvites(workspace.workspaceId)
      ]);
      setMembers(membersData);
      setRoles(rolesData);
      setInvites(invitesData.filter(i => i.status === 'PENDING'));
    } catch (error) {
      toast.error('Failed to load workspace data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRoleName: string) => {
    if (!workspace) return;
    
    setIsUpdating(userId);
    try {
      await workspaceApi.updateMemberRole(workspace.workspaceId, userId, newRoleName);
      toast.success('Member role updated successfully');
      loadData(); // Refresh list
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update role');
    } finally {
      setIsUpdating(null);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!workspace) return;
    if (!confirm('Are you sure you want to remove this member from the workspace?')) return;
    
    try {
      await workspaceApi.removeMember(workspace.workspaceId, userId);
      toast.success('Member removed successfully');
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove member');
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    if (!workspace) return;
    if (!confirm('Are you sure you want to cancel this invitation?')) return;
    
    try {
      await workspaceApi.cancelInvite(workspace.workspaceId, inviteId);
      toast.success('Invitation cancelled');
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to cancel invitation');
    }
  };

  return (
    <AppShell>
      <div className="p-6 max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Workspace Members</h1>
            <p className="text-muted-foreground">Manage users and their access levels within this workspace.</p>
          </div>
          
          <Button onClick={() => router.push('/dashboard/workspace/settings')}>
            <UserPlus className="mr-2 h-4 w-4" /> Invite Member
          </Button>
        </div>

        {/* Active Members Section */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-muted/30">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" /> Active Members ({members.length})
            </h2>
          </div>
          
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent text-muted-foreground">
                  <TableHead className="pl-6">User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {member.user.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">
                            {member.user.username}
                            {member.userId === currentUser?.id && (
                              <Badge variant="outline" className="ml-2 text-[10px] h-4">You</Badge>
                            )}
                          </div>
                          <div className="text-[11px] text-muted-foreground">Active Member</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {member.user.email}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {member.role.name === 'OWNER' && <ShieldAlert className="h-3.5 w-3.5 text-red-500" />}
                        {member.role.name === 'ADMIN' && <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />}
                        {member.role.name === 'USER' && <Shield className="h-3.5 w-3.5 text-slate-400" />}
                        <span className="text-sm font-medium">{member.role.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0" disabled={isUpdating === member.userId}>
                            {isUpdating === member.userId ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreHorizontal className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuRadioGroup 
                            value={member.role.name} 
                            onValueChange={(val) => handleRoleChange(member.userId, val)}
                          >
                            {roles.map(role => (
                              <DropdownMenuRadioItem 
                                key={role.id} 
                                value={role.name}
                                disabled={member.role.name === 'OWNER' && currentUser?.id !== member.userId}
                              >
                                {role.name}
                              </DropdownMenuRadioItem>
                            ))}
                          </DropdownMenuRadioGroup>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive focus:bg-destructive/10 cursor-pointer"
                            onClick={() => handleRemoveMember(member.userId)}
                            disabled={member.role.name === 'OWNER' || member.userId === currentUser?.id}
                          >
                            Remove Member
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pending Invitations Section */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-muted/30">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" /> Pending Invitations ({invites.length})
            </h2>
          </div>
          
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-12 w-full" />
            </div>
          ) : invites.length === 0 ? (
            <div className="p-12 text-center">
              <Mail className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No pending invitations found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent text-muted-foreground">
                  <TableHead className="pl-6">Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Invited By</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell className="pl-6 font-medium text-sm">
                      {invite.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-medium text-[10px] uppercase">
                        {invite.role?.name || 'USER'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {invite.invitedBy?.username || invite.invitedBy?.email}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(invite.expiresAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="pr-6">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleCancelInvite(invite.id)}
                      >
                        <XCircle className="h-4 w-4 mr-1" /> Cancel
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </AppShell>
  );
}

