'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  BarChart3,
  Calendar,
  Users,
  TrendingUp,
  Target,
  Info,
  Settings,
  ShieldCheck
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { format, differenceInDays } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { getProject, getProjectTimeLogs, assignProjectMember, removeProjectMember, updateProject } from '@/lib/projects';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { KanbanBoard } from '@/components/projects/kanban/KanbanBoard';
import { AddProjectMemberModal } from '@/components/projects/AddProjectMemberModal';
import { UserPlus, Trash2, Plus, LayoutGrid, CheckCircle } from 'lucide-react';
import { useProjectMemberRole } from '@/hooks/useProjectMemberRole';
import { useProject } from '@/contexts/ProjectContext';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function ProjectOverviewPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { canManageTasks, role, isWorkspaceAdmin } = useProjectMemberRole(projectId);
  const { setCreateTaskModalOpen } = useProject();
  const [project, setProject] = useState<any>(null);
  const [timeLogs, setTimeLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);

  // For Settings tab
  const [editProject, setEditProject] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    try {
      const [projRes, logsRes] = await Promise.all([
        getProject(projectId),
        getProjectTimeLogs(projectId)
      ]);
      const projData = projRes.data || projRes;
      setProject(projData);
      setEditProject({
        projectName: projData.projectName,
        description: projData.description,
        budgetAmount: projData.budgetAmount,
        status: projData.status
      });
      setTimeLogs(logsRes.data || logsRes || []);
    } catch (error) {
      console.error('Failed to fetch project data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) fetchData();
  }, [projectId]);

  const handleRoleUpdate = async (employeeId: string, role: string) => {
    try {
      await assignProjectMember(projectId, { employeeId, role });
      toast.success(`Role updated to ${role}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update role');
    }
  };

  const handleRemoveMember = async (employeeId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    try {
      await removeProjectMember(projectId, employeeId);
      toast.success('Member removed');
      fetchData();
    } catch (error) {
      toast.error('Failed to remove member');
    }
  };

  const handleUpdateProject = async () => {
    try {
      setIsSaving(true);
      await updateProject(projectId, editProject);
      toast.success('Project settings updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update project settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 space-y-8 animate-pulse">
        <div className="h-10 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-slate-100 dark:bg-slate-900 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!project) return <div className="p-4 md:p-8">Project not found.</div>;

  const activeDays = project.startDate ? Math.max(0, differenceInDays(new Date(), new Date(project.startDate))) : 0;
  
  const teamMembersList = project.members || [];
  const teamSize = teamMembersList.length;
  const avatarInitials = teamMembersList.slice(0, 4).map((m: any) => 
    (m.employee.firstName?.[0] || '') + (m.employee.lastName?.[0] || '')
  );

  const milestones = project.milestones || [];

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">{project.projectName}</h1>
            <Badge variant="outline" className="h-6 border-[#d3cec6] dark:border-[#27272a] font-bold text-[10px] uppercase tracking-wider">
              {project.status || 'UNKNOWN'}
            </Badge>
            {role === 'LEAD' && (
              <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold text-[10px] uppercase px-2 py-1 shadow-sm gap-1">
                <ShieldCheck className="h-3 w-3" />
                Project Lead
              </Badge>
            )}
            {isWorkspaceAdmin && (
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold text-[10px] uppercase px-2 py-1 shadow-sm gap-1">
                <ShieldCheck className="h-3 w-3" />
                Workspace Admin
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">{project.description || 'No description provided.'}</p>
        </div>
        
        {canManageTasks && (
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => setCreateTaskModalOpen(true)}
              className="bg-[#111111] dark:bg-[#f4f4f5] text-white dark:text-[#111111] hover:bg-[#111111]/90 font-extrabold rounded-xl h-11 px-6 shadow-lg shadow-black/10 dark:shadow-none transition-all hover:translate-y-[-1px] active:translate-y-[0px] gap-2"
            >
              <Plus className="h-4 w-4" />
              New Task
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="overview" className="space-y-8">
        <div className="border-b border-[#d3cec6]/30 dark:border-[#27272a]/30 pb-1 overflow-x-auto">
          <TabsList className="bg-transparent h-12 p-0 gap-8 justify-start">
            <TabsTrigger value="overview" className="tab-custom">Overview</TabsTrigger>
            <TabsTrigger value="tasks" className="tab-custom">Tasks</TabsTrigger>
            {canManageTasks && (
              <>
                <TabsTrigger value="timesheets" className="tab-custom">Team Timesheets</TabsTrigger>
                <TabsTrigger value="team" className="tab-custom">Manage Team</TabsTrigger>
                <TabsTrigger value="settings" className="tab-custom">Settings</TabsTrigger>
              </>
            )}
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-8 animate-in fade-in duration-300">
          {/* Stats Grid */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Card className="card-custom">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Completion</CardTitle>
                <Target className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono tracking-tighter">{project.progressPercent || 0}%</div>
                <Progress value={project.progressPercent || 0} className="h-1 mt-3 bg-[#f5f1ec] dark:bg-[#18181b]" indicatorClassName="bg-emerald-500" />
              </CardContent>
            </Card>

            <Card className="card-custom">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Actual Cost</CardTitle>
                <BarChart3 className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono tracking-tighter">
                  ${Number(project.actualCost || 0).toLocaleString()}
                </div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">
                  of ${Number(project.budgetAmount || 0).toLocaleString()} budget
                </p>
              </CardContent>
            </Card>

            <Card className="card-custom">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Timeline</CardTitle>
                <Calendar className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-bold truncate">
                  {project.startDate ? format(new Date(project.startDate), 'MMM d') : 'N/A'} - {project.endDate ? format(new Date(project.endDate), 'MMM d, yyyy') : 'Ongoing'}
                </div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">
                  Active for {activeDays} days
                </p>
              </CardContent>
            </Card>

            <Card className="card-custom">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Team Size</CardTitle>
                <Users className="h-4 w-4 text-indigo-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono tracking-tighter">{teamSize}</div>
                <div className="flex -space-x-2 mt-2">
                  {avatarInitials.length > 0 ? avatarInitials.map((initials: string, i: number) => (
                    <div key={i} className="h-6 w-6 rounded-full border-2 border-white dark:border-[#09090b] bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[8px] font-bold">
                      {initials.toUpperCase() || 'U'}
                    </div>
                  )) : (
                    <span className="text-[10px] text-muted-foreground">No members</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Status Breakdown */}
            <Card className="card-custom">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Status Breakdown</CardTitle>
                <CardDescription>Task distribution by status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'Backlog', status: 'TODO', color: 'bg-slate-500' },
                  { label: 'In Progress', status: 'IN_PROGRESS', color: 'bg-blue-500' },
                  { label: 'Review', status: 'REVIEW', color: 'bg-amber-500' },
                  { label: 'Completed', status: 'DONE', color: 'bg-emerald-500' },
                ].map((item) => {
                  const count = (project.tasks || []).filter((t: any) => t.status === item.status).length;
                  const total = (project.tasks || []).length;
                  const pct = total > 0 ? (count / total) * 100 : 0;
                  return (
                    <div key={item.status} className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                        <div className="flex items-center gap-2">
                          <div className={cn("h-2 w-2 rounded-full", item.color)} />
                          <span>{item.label}</span>
                        </div>
                        <span className="text-muted-foreground">{count} ({Math.round(pct)}%)</span>
                      </div>
                      <Progress value={pct} className="h-1 bg-[#f5f1ec] dark:bg-[#18181b]" indicatorClassName={item.color} />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Upcoming Milestones */}
            <Card className="lg:col-span-2 card-custom">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold">Critical Milestones</CardTitle>
                    <CardDescription>Upcoming delivery targets and deadlines</CardDescription>
                  </div>
                  <Target className="h-5 w-5 text-muted-foreground/50" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {milestones.length === 0 ? (
                    <div className="col-span-2 text-xs text-muted-foreground italic text-center p-8 border border-dashed rounded-2xl border-[#d3cec6] dark:border-[#27272a]">
                      No milestones defined yet.
                    </div>
                  ) : (
                    milestones.slice(0, 4).map((milestone: any, i: number) => {
                      const isCompleted = milestone.progressPercent === 100 || milestone.status === 'COMPLETED';
                      const isPastDue = milestone.targetDate && new Date(milestone.targetDate) < new Date() && !isCompleted;
                      return (
                        <div key={i} className={cn(
                          "flex items-center gap-4 p-4 rounded-2xl border border-[#d3cec6] dark:border-[#27272a] bg-white dark:bg-black/20",
                          isCompleted ? "opacity-75" : ""
                        )}>
                          <div className={cn(
                            "h-10 w-10 rounded-xl flex items-center justify-center",
                            isCompleted ? "bg-emerald-500/10" : isPastDue ? "bg-rose-500/10" : "bg-blue-500/10"
                          )}>
                            {isCompleted ? (
                              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            ) : isPastDue ? (
                              <AlertCircle className="h-5 w-5 text-rose-500" />
                            ) : (
                              <Clock className="h-5 w-5 text-blue-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate">{milestone.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="secondary" className="h-4 text-[7px] font-extrabold uppercase px-1">
                                {isCompleted ? 'Done' : isPastDue ? 'Overdue' : 'Active'}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground font-bold">
                                {milestone.targetDate ? format(new Date(milestone.targetDate), 'MMM d, yyyy') : 'No date'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="animate-in fade-in duration-300 h-[700px]">
          <div className="h-full card-custom overflow-hidden">
            <KanbanBoard tasks={project.tasks || []} />
          </div>
        </TabsContent>

        <TabsContent value="timesheets" className="animate-in fade-in duration-300">
          <Card className="card-custom">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">Team Timesheets</CardTitle>
                <CardDescription>Review hours logged by the project team</CardDescription>
              </div>
              <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 font-bold uppercase text-[10px]">
                Total: {timeLogs.reduce((sum, log) => sum + Number(log.hours), 0)}h
              </Badge>
            </CardHeader>
            <CardContent>
              {timeLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-3xl opacity-50">
                  <Clock className="h-10 w-10 mb-4 text-muted-foreground" />
                  <p className="text-sm font-bold italic">No time logs recorded for this project yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-[#d3cec6] dark:border-[#27272a]">
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest">Employee</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest">Task</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest">Description</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest">Date</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest text-right">Hours</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timeLogs.map((log) => (
                      <TableRow key={log.id} className="border-[#d3cec6] dark:border-[#27272a] hover:bg-[#f5f1ec]/30 dark:hover:bg-[#18181b]/30 transition-colors">
                        <TableCell className="font-bold text-xs py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[8px] font-extrabold uppercase">
                              {log.employee.firstName?.[0]}{log.employee.lastName?.[0]}
                            </div>
                            {log.employee.fullName}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="space-y-0.5">
                            <p className="text-[9px] font-extrabold text-muted-foreground uppercase">{log.task.taskNumber}</p>
                            <p className="text-xs font-bold truncate max-w-[200px]">{log.task.title}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground py-4 max-w-[300px] truncate italic">
                          {log.description || 'No description'}
                        </TableCell>
                        <TableCell className="text-xs font-bold py-4">
                          {format(new Date(log.date), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-right py-4 font-mono font-bold text-sm">
                          {Number(log.hours).toFixed(1)}h
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="animate-in fade-in duration-300">
          <Card className="card-custom">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">Manage Team</CardTitle>
                <CardDescription>Assign and remove members from this project</CardDescription>
              </div>
              <Button 
                onClick={() => setIsAddMemberModalOpen(true)}
                className="rounded-xl font-bold h-9 gap-2 shadow-lg shadow-black/5"
              >
                <UserPlus className="h-4 w-4" />
                Add Member
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(project.members || []).map((member: any) => (
                  <Card key={member.id} className="border-[#d3cec6] dark:border-[#27272a] shadow-none bg-white dark:bg-black/20 rounded-2xl overflow-hidden group">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="h-12 w-12 rounded-2xl bg-[#f5f1ec] dark:bg-[#18181b] border border-[#d3cec6] dark:border-[#27272a] flex items-center justify-center text-sm font-extrabold shrink-0">
                            {member.employee.firstName?.[0]}{member.employee.lastName?.[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm truncate">{member.employee.fullName}</p>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider truncate">{member.employee.designation?.title || 'Team Member'}</p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemoveMember(member.employeeId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="mt-6 flex items-center justify-between border-t border-[#d3cec6]/50 dark:border-[#27272a]/50 pt-4">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className={cn(
                            "text-[9px] font-extrabold uppercase px-1.5 h-5",
                            member.role === 'LEAD' ? "bg-amber-500/10 text-amber-600 border-amber-500/20" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                          )}>
                            {member.role}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 text-[10px] font-bold rounded-lg px-2 hover:bg-amber-500/10 hover:text-amber-600 transition-colors"
                            onClick={() => handleRoleUpdate(member.employeeId, member.role === 'LEAD' ? 'MEMBER' : 'LEAD')}
                          >
                            Set {member.role === 'LEAD' ? 'Member' : 'Lead'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="animate-in fade-in duration-300">
          <Card className="card-custom">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Project Settings</CardTitle>
              <CardDescription>General configuration for this project</CardDescription>
            </CardHeader>
            <CardContent className="max-w-2xl space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Project Name</label>
                  <Input 
                    value={editProject?.projectName} 
                    onChange={(e) => setEditProject({ ...editProject, projectName: e.target.value })}
                    className="border-[#d3cec6] dark:border-[#27272a] rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Budget Amount ($)</label>
                  <Input 
                    type="number"
                    value={editProject?.budgetAmount} 
                    onChange={(e) => setEditProject({ ...editProject, budgetAmount: e.target.value })}
                    className="border-[#d3cec6] dark:border-[#27272a] rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Description</label>
                <Textarea 
                  value={editProject?.description} 
                  onChange={(e) => setEditProject({ ...editProject, description: e.target.value })}
                  className="border-[#d3cec6] dark:border-[#27272a] rounded-xl min-h-[120px]"
                />
              </div>

              <div className="pt-4 flex justify-end">
                <Button 
                  onClick={handleUpdateProject}
                  disabled={isSaving}
                  className="rounded-xl font-bold h-11 px-8 gap-2"
                >
                  {isSaving ? <Clock className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AddProjectMemberModal 
        projectId={projectId}
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        onSuccess={fetchData}
        existingMemberIds={(project.members || []).map((m: any) => m.employeeId)}
      />

      <style jsx global>{`
        .card-custom {
          border: 1px solid #d3cec6;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          background-color: #fdfcfb;
          border-radius: 1.5rem;
          overflow: hidden;
        }
        .dark .card-custom {
          border-color: #27272a;
          background-color: #09090b;
        }
        .tab-custom {
          border-radius: 0;
          font-weight: 800;
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          padding: 0 0 1rem 0;
          border-bottom: 2px solid transparent;
          background: transparent !important;
          box-shadow: none !important;
          color: #71717a;
          transition: all 0.2s;
        }
        .tab-custom[data-state="active"] {
          color: #111111;
          border-bottom-color: #111111;
        }
        .dark .tab-custom[data-state="active"] {
          color: #f4f4f5;
          border-bottom-color: #f4f4f5;
        }
      `}</style>
    </div>
  );
}
