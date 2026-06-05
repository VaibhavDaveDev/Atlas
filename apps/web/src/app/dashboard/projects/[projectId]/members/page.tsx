'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getProject, assignProjectMember, removeProjectMember } from '@/lib/projects';
import { 
  Loader2, 
  Users, 
  Search, 
  Mail, 
  Briefcase,
  MoreVertical,
  ExternalLink,
  UserPlus,
  Trash2,
  Info,
  ShieldCheck
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { AddProjectMemberModal } from '@/components/projects/AddProjectMemberModal';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export default function ProjectMembersPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);

  const fetchProject = async () => {
    try {
      const res = await getProject(projectId);
      setProject(res.data || res);
    } catch (error) {
      console.error('Failed to fetch project members', error);
      toast.error('Failed to load project members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) fetchProject();
  }, [projectId]);

  const handleRoleUpdate = async (employeeId: string, role: string) => {
    try {
      await assignProjectMember(projectId, { employeeId, role });
      toast.success(`Role updated to ${role}`);
      fetchProject();
    } catch (error) {
      toast.error('Failed to update role');
    }
  };

  const handleRemoveMember = async (employeeId: string) => {
    if (!confirm('Are you sure you want to remove this member from the project?')) return;
    try {
      await removeProjectMember(projectId, employeeId);
      toast.success('Member removed');
      fetchProject();
    } catch (error) {
      toast.error('Failed to remove member');
    }
  };

  const filteredMembers = (project?.members || []).filter((m: any) => 
    m.employee.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.employee.employeeNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) return <div className="p-8">Project not found.</div>;

  return (
    <div className="h-full flex flex-col p-4 md:p-8 space-y-8 max-w-[1400px] mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Project Team</h1>
          <p className="text-muted-foreground text-sm">Manage project leads and contributors.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search members..." 
              className="pl-9 h-11 border-[#d3cec6] dark:border-[#27272a] bg-[#fdfcfb] dark:bg-[#09090b] rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button 
            onClick={() => setIsAddMemberModalOpen(true)}
            className="w-full sm:w-auto h-11 rounded-xl font-bold px-6 gap-2 shadow-sm"
          >
            <UserPlus className="h-4 w-4" />
            Add Member
          </Button>
        </div>
      </div>

      {project.members?.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-[#d3cec6] dark:border-[#27272a] rounded-[2.5rem] bg-[#fdfcfb] dark:bg-[#18181b]/30 py-24">
          <div className="h-20 w-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6">
            <Users className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold mb-2">No team members</h2>
          <p className="text-muted-foreground text-center max-w-xs mb-8">
            This project doesn't have any members yet. Add members to start collaborating.
          </p>
          <Button onClick={() => setIsAddMemberModalOpen(true)} variant="outline" className="rounded-xl font-bold h-11 px-8 border-[#d3cec6] dark:border-[#27272a]">
            Add First Member
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredMembers.map((member: any) => (
            <Card key={member.id} className="border-[#d3cec6] dark:border-[#27272a] shadow-sm bg-[#fdfcfb] dark:bg-[#09090b] group hover:border-primary/50 transition-all rounded-[2rem] overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-14 w-14 rounded-2xl bg-[#f5f1ec] dark:bg-[#18181b] border border-[#d3cec6] dark:border-[#27272a] flex items-center justify-center text-lg font-extrabold text-slate-700 dark:text-slate-300 shrink-0">
                      {member.employee.firstName?.[0]}{member.employee.lastName?.[0]}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-base truncate leading-tight">
                        {member.employee.fullName}
                      </h3>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5 truncate">
                        {member.employee.designation?.title || 'Team Member'}
                      </p>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-[#f5f1ec] dark:hover:bg-[#18181b]">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 border-[#d3cec6] dark:border-[#27272a] shadow-2xl">
                      <div className="px-2 py-1.5 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Role Actions</div>
                      <DropdownMenuItem 
                        className="rounded-xl cursor-pointer py-2.5 text-xs font-bold"
                        onClick={() => handleRoleUpdate(member.employeeId, member.role === 'LEAD' ? 'MEMBER' : 'LEAD')}
                      >
                        <ShieldCheck className="h-4 w-4 mr-2 text-primary" />
                        Set as {member.role === 'LEAD' ? 'Member' : 'Team Lead'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="my-2 bg-[#d3cec6]/50 dark:bg-[#27272a]/50" />
                      <DropdownMenuItem 
                        className="rounded-xl cursor-pointer py-2.5 text-xs font-bold text-rose-600 focus:text-rose-600 focus:bg-rose-500/10"
                        onClick={() => handleRemoveMember(member.employeeId)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove from Project
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mt-8 space-y-3">
                  <div className="flex items-center gap-2.5 text-xs font-medium text-muted-foreground bg-white/50 dark:bg-black/20 p-2.5 rounded-xl border border-[#d3cec6]/30 dark:border-[#27272a]/30">
                    <Mail className="h-4 w-4 text-primary/60" />
                    <span className="truncate">{member.employee.email}</span>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn(
                        "text-[9px] font-extrabold uppercase px-2 h-5 rounded-lg",
                        member.role === 'LEAD' ? "bg-amber-500/10 text-amber-600 border-amber-500/20" : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                      )}>
                        {member.role === 'LEAD' ? 'Team Lead' : 'Contributor'}
                      </Badge>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help hover:text-primary transition-colors" />
                          </TooltipTrigger>
                          <TooltipContent className="bg-black text-white border-none rounded-xl p-3 max-w-xs shadow-2xl">
                            <p className="text-[10px] font-bold leading-relaxed">
                              {member.role === 'LEAD' 
                                ? "Team Leads can create tasks, assign members, and manage project progress. Multiple leads can be assigned."
                                : "Contributors can view the project and update their assigned tasks."}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="text-[10px] font-bold text-muted-foreground italic">
                      Joined {new Date(member.joinedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddProjectMemberModal 
        projectId={projectId}
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        onSuccess={fetchProject}
        existingMemberIds={(project.members || []).map((m: any) => m.employeeId)}
      />
    </div>
  );
}
