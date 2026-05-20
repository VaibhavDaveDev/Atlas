'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Plus, MoreHorizontal, Settings, Trash2, Loader2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableBody
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { roleApi, Role } from '@/lib/roles';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export default function RolesDirectoryPage() {
  const { workspace } = useAuth();
  const router = useRouter();
  
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Sheet state
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (workspace?.workspaceId) {
      loadRoles();
    }
  }, [workspace]);

  const loadRoles = async () => {
    if (!workspace) return;
    setIsLoading(true);
    try {
      const data = await roleApi.getRoles(workspace.workspaceId);
      setRoles(data);
    } catch (error) {
      toast.error('Failed to load roles');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace) return;
    
    setIsCreating(true);
    try {
      await roleApi.createRole(workspace.workspaceId, {
        name: newRoleName,
        description: newRoleDesc,
      });
      toast.success('Role created successfully');
      setNewRoleName('');
      setNewRoleDesc('');
      setIsSheetOpen(false);
      loadRoles(); // refresh list
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create role');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!workspace) return;
    if (!confirm('Are you sure you want to delete this role?')) return;
    
    try {
      await roleApi.deleteRole(workspace.workspaceId, roleId);
      toast.success('Role deleted successfully');
      loadRoles();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete role');
    }
  };

  return (
    <AppShell>
      <div className="p-6 max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Roles & Permissions</h1>
            <p className="text-muted-foreground">Manage custom roles and configure granular access control.</p>
          </div>
          
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Create Role
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Create Custom Role</SheetTitle>
                <SheetDescription>
                  Create a new role to assign granular permissions later.
                </SheetDescription>
              </SheetHeader>
              <form onSubmit={handleCreateRole} className="space-y-6 mt-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Role Name</Label>
                    <Input 
                      id="name" 
                      placeholder="e.g. HR Manager" 
                      value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Input 
                      id="description" 
                      placeholder="Manages HR operations" 
                      value={newRoleDesc}
                      onChange={(e) => setNewRoleDesc(e.target.value)}
                    />
                  </div>
                </div>
                <SheetFooter>
                  <SheetClose asChild>
                    <Button variant="outline" type="button">Cancel</Button>
                  </SheetClose>
                  <Button type="submit" disabled={isCreating || !newRoleName}>
                    {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Role
                  </Button>
                </SheetFooter>
              </form>
            </SheetContent>
          </Sheet>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-muted/30">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" /> Available Roles
            </h2>
          </div>
          
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : roles.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No custom roles found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Role Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-center">Active Members</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">
                      {role.name}
                      {['OWNER', 'ADMIN', 'USER'].includes(role.name) && (
                        <Badge variant="secondary" className="ml-2 text-[10px]">System</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {role.description || '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm">{role._count?.members || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem 
                            onClick={() => router.push(`/dashboard/workspace/roles/${role.id}`)}
                            className="cursor-pointer"
                          >
                            <Settings className="mr-2 h-4 w-4" /> Manage Permissions
                          </DropdownMenuItem>
                          {!['OWNER', 'ADMIN', 'USER'].includes(role.name) && (
                            <DropdownMenuItem 
                              className="text-destructive focus:bg-destructive/10 cursor-pointer"
                              onClick={() => handleDeleteRole(role.id)}
                              disabled={!!role._count?.members && role._count.members > 0}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete Role
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
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
