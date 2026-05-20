'use client';

import { useState, useEffect, useMemo, use } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Save, Loader2, ShieldCheck, Info, Users, AlertTriangle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { roleApi, Role, Permission } from '@/lib/roles';
import { workspaceApi, WorkspaceMember } from '@/lib/workspace';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

// Type for the un-wrapped Next.js params
type PageProps = {
  params: Promise<{ id: string }>;
};

export default function RolePermissionsPage({ params }: PageProps) {
  // Use React.use to unwrap the Promise-based params in Next.js 15
  const resolvedParams = use(params);
  const roleId = resolvedParams.id;
  
  const { workspace } = useAuth();
  const router = useRouter();
  
  const [role, setRole] = useState<Role | null>(null);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<Set<string>>(new Set());
  const [roleMembers, setRoleMembers] = useState<WorkspaceMember[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (workspace?.workspaceId) {
      loadData();
    }
  }, [workspace, roleId]);

  const loadData = async () => {
    if (!workspace) return;
    setIsLoading(true);
    try {
      const [roleData, permissionsData, allMembers] = await Promise.all([
        roleApi.getRole(workspace.workspaceId, roleId),
        roleApi.getAllPermissions(workspace.workspaceId),
        workspaceApi.getMembers(workspace.workspaceId)
      ]);
      
      setRole(roleData);
      setAllPermissions(permissionsData);
      
      // Filter members who have this role
      setRoleMembers(allMembers.filter(m => m.roleId === roleId));
      
      // Initialize selected set
      const initialSelected = new Set(roleData.permissions.map((rp: any) => rp.permission.id));
      setSelectedPermissionIds(initialSelected);
    } catch (error) {
      toast.error('Failed to load role permissions');
      router.push('/dashboard/workspace/roles');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!workspace) return;
    setIsSaving(true);
    try {
      await roleApi.updateRolePermissions(
        workspace.workspaceId, 
        roleId, 
        Array.from(selectedPermissionIds)
      );
      toast.success('Permissions saved successfully');
      setShowConfirm(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save permissions');
    } finally {
      setIsSaving(false);
    }
  };

  const togglePermission = (permissionId: string) => {
    const next = new Set(selectedPermissionIds);
    if (next.has(permissionId)) {
      next.delete(permissionId);
    } else {
      next.add(permissionId);
    }
    setSelectedPermissionIds(next);
  };

  // Group permissions by resource, then action
  const groupedPermissions = useMemo(() => {
    const grouped: Record<string, Record<string, Permission[]>> = {};
    
    allPermissions.forEach(p => {
      if (!grouped[p.resource]) grouped[p.resource] = {};
      if (!grouped[p.resource][p.action]) grouped[p.resource][p.action] = [];
      grouped[p.resource][p.action].push(p);
    });

    return grouped;
  }, [allPermissions]);

  const resources = Object.keys(groupedPermissions).sort();

  // Get list of selected permissions for confirmation
  const selectedPermissionsList = useMemo(() => {
    return allPermissions.filter(p => selectedPermissionIds.has(p.id));
  }, [allPermissions, selectedPermissionIds]);

  if (isLoading) {
    return (
      <AppShell>
        <div className="p-6 max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-10 w-[200px]" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/workspace/roles')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Edit Role: {role?.name}</h1>
            <p className="text-muted-foreground">{role?.description || 'Configure access control for this role.'}</p>
          </div>
          <div className="ml-auto">
            <Button onClick={() => setShowConfirm(true)} disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>

        <Tabs defaultValue="permissions" className="w-full space-y-6">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="permissions" className="px-6">Permissions</TabsTrigger>
            <TabsTrigger value="members" className="px-6">Assigned Members ({roleMembers.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="permissions" className="space-y-6 mt-0">
            <Card className="border-border">
              <CardHeader className="bg-muted/30 border-b border-border pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" /> Permission Matrix
                </CardTitle>
                <CardDescription>
                  Assign granular access scopes across different system modules.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Tabs defaultValue={resources[0]} className="w-full">
                  <div className="border-b border-border px-4 py-2 bg-card">
                    <TabsList className="bg-muted/50 h-auto flex-wrap justify-start gap-1 p-1">
                      {resources.map(resource => (
                        <TabsTrigger 
                          key={resource} 
                          value={resource}
                          className="capitalize data-[state=active]:bg-background data-[state=active]:shadow-sm"
                        >
                          {resource.replace('_', ' ')}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>

                  {resources.map(resource => (
                    <TabsContent key={resource} value={resource} className="p-6 m-0 border-none outline-none">
                      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {Object.entries(groupedPermissions[resource]).map(([action, scopes]) => (
                          <div key={action} className="space-y-4 bg-muted/20 p-4 rounded-xl border border-border/50">
                            <div className="flex items-center justify-between border-b border-border/50 pb-2">
                              <h4 className="font-semibold capitalize text-sm">{action}</h4>
                              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">Action</span>
                            </div>
                            <div className="space-y-3 pt-1">
                              {scopes.map(perm => (
                                <div key={perm.id} className="flex items-start space-x-3 group">
                                  <Checkbox 
                                    id={perm.id} 
                                    checked={selectedPermissionIds.has(perm.id)}
                                    onCheckedChange={() => togglePermission(perm.id)}
                                    className="mt-0.5 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                                  />
                                  <div className="grid gap-1.5 leading-none">
                                    <label
                                      htmlFor={perm.id}
                                      className="text-sm font-medium leading-none cursor-pointer group-hover:text-primary transition-colors capitalize"
                                    >
                                      {perm.scope === 'own' ? 'Own Records Only' : perm.scope === 'department' ? 'Department Level' : 'All Records'}
                                    </label>
                                    {perm.description && (
                                      <p className="text-[11px] text-muted-foreground flex items-start gap-1">
                                        <Info className="h-3 w-3 mt-px shrink-0" />
                                        {perm.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="members" className="mt-0">
            <Card className="border-border">
              <CardHeader className="bg-muted/30 border-b border-border pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" /> Members with this Role
                </CardTitle>
                <CardDescription>
                  Users currently assigned to the {role?.name} role.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {roleMembers.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground">
                    <p>No members are currently assigned to this role.</p>
                    <Button 
                      variant="link" 
                      className="mt-2"
                      onClick={() => router.push('/dashboard/workspace/members')}
                    >
                      Go to Members page to assign roles
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="pl-6">User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right pr-6">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roleMembers.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell className="pl-6">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs uppercase bg-primary/10 text-primary">
                                  {member.user.username.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{member.user.username}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {member.user.email}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {new Date(member.joinedAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <Badge variant="secondary" className="text-[10px] bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20">
                              Active
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" /> Confirm Permissions
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to update the permissions for the <span className="font-bold text-foreground">{role?.name}</span> role?
              This will affect <span className="font-bold text-foreground">{roleMembers.length}</span> assigned members.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" /> Selected Permissions ({selectedPermissionsList.length})
            </h4>
            <ScrollArea className="h-[250px] rounded-md border border-border p-4 bg-muted/30">
              <div className="space-y-4">
                {resources.map(resource => {
                  const perms = selectedPermissionsList.filter(p => p.resource === resource);
                  if (perms.length === 0) return null;
                  return (
                    <div key={resource} className="space-y-2">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-1">
                        {resource.replace('_', ' ')}
                      </h5>
                      <div className="grid gap-1">
                        {perms.map(p => (
                          <div key={p.id} className="text-sm flex items-center justify-between py-1">
                            <span className="capitalize font-medium">{p.action}</span>
                            <Badge variant="outline" className="text-[10px] capitalize bg-background font-normal">
                              {p.scope === 'own' ? 'Own' : p.scope === 'department' ? 'Dept' : 'All'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Confirm & Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
