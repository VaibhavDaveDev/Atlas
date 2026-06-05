'use client';

import { AppShell } from '@/components/layout/AppShell';
import {
  Briefcase,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  ArrowRight,
  ListTodo,
  Milestone as MilestoneIcon,
  BarChart3,
  FolderKanban
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Progress } from '@/components/ui/progress';
import { getProjects } from '@/lib/projects';
import { toast } from 'sonner';

import { ProjectCard } from '@/components/projects/ProjectCard';

export default function ProjectsDashboardPage() {
  const { workspace } = useAuth();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const res = await getProjects();
        setProjects(res.data || res || []);
      } catch (error) {
        console.error('Failed to fetch projects', error);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    if (workspace) {
      fetchProjects();
    }
  }, [workspace]);

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  const activeProjects = projects.length;
  const pendingTasks = projects.reduce((acc, p) => acc + (p._count?.tasks || 0), 0);
  const milestonesDue = projects.reduce((acc, p) => acc + (p.milestones?.filter((m: any) => new Date(m.targetDate) >= new Date()).length || 0), 0);
  
  const totalBudget = projects.reduce((acc, p) => acc + Number(p.budgetAmount || 0), 0);
  const totalSpent = projects.reduce((acc, p) => acc + Number(p.actualCost || 0), 0);
  const budgetUtilization = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  return (
    <AppShell>
      <div className="flex flex-col gap-8 p-4 md:p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#111111] dark:text-[#f4f4f5]">Project Command</h1>
            <p className="text-muted-foreground flex items-center gap-2 text-sm md:text-base">
              Orchestrate initiatives, track tasks, and monitor milestones.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/projects/new">
              <Button className="h-10 bg-[#111111] dark:bg-[#f4f4f5] text-white dark:text-[#111111]">
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </Link>
          </div>
        </div>

        {/* Top KPIs */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card className="relative overflow-hidden border-[#d3cec6] dark:border-[#27272a] shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Active Projects</CardTitle>
              <Briefcase className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono tracking-tighter">{activeProjects}</div>
              <div className="flex items-center mt-1 text-[10px] uppercase font-bold text-blue-600 tracking-wider">
                Ongoing Initiatives
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600/20" />
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-[#d3cec6] dark:border-[#27272a] shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total Tasks</CardTitle>
              <ListTodo className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono tracking-tighter">{pendingTasks}</div>
              <div className="flex items-center mt-1 text-[10px] uppercase font-bold text-amber-600 tracking-wider">
                Across all projects
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-600/20" />
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-[#d3cec6] dark:border-[#27272a] shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Milestones</CardTitle>
              <MilestoneIcon className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono tracking-tighter">{milestonesDue}</div>
              <div className="flex items-center mt-1 text-[10px] uppercase font-bold text-purple-600 tracking-wider">
                Upcoming targets
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-600/20" />
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-[#d3cec6] dark:border-[#27272a] shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Budget Utilization</CardTitle>
              <BarChart3 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono tracking-tighter">{budgetUtilization}%</div>
              <div className="flex items-center mt-1 text-[10px] uppercase font-bold text-green-600 tracking-wider">
                Overall efficiency
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-600/20" />
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-12">
          {/* Projects List/Cards */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between px-2">
              <div>
                <h2 className="text-lg font-bold">Initiatives</h2>
                <p className="text-xs text-muted-foreground">Recently active projects and their status</p>
              </div>
            </div>
            
            {projects.length === 0 ? (
              <Card className="border-[#d3cec6] dark:border-[#27272a] bg-[#fdfcfb] dark:bg-[#09090b]">
                <CardContent className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="h-16 w-16 rounded-full bg-[#f5f1ec] dark:bg-[#18181b] flex items-center justify-center mb-6 border border-[#d3cec6] dark:border-[#27272a] shadow-inner">
                    <Briefcase className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-base font-bold">No active projects</h3>
                  <p className="text-sm text-muted-foreground max-w-[300px] mt-2 mb-8">
                    Start your first project to begin tracking tasks and milestones across your workspace.
                  </p>
                  <Link href="/dashboard/projects/new">
                    <Button className="bg-[#111111] dark:bg-[#f4f4f5] text-white dark:text-[#111111] font-bold px-8 shadow-lg">
                      Create Your First Project
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            )}
          </div>

          {/* Quick Tasks / Feed */}
          <div className="lg:col-span-4 space-y-6">
            <div className="px-2">
              <h2 className="text-lg font-bold">Immediate Actions</h2>
              <p className="text-xs text-muted-foreground">Tasks assigned to you</p>
            </div>
            
            <Card className="border-[#d3cec6] dark:border-[#27272a] bg-[#fdfcfb] dark:bg-[#09090b]">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="py-12 text-center text-muted-foreground/60 italic text-xs font-medium border-2 border-dashed border-[#d3cec6]/50 dark:border-[#27272a]/50 rounded-2xl bg-white/50 dark:bg-black/20">
                    All caught up! No urgent tasks.
                  </div>
                </div>

                <div className="mt-10 rounded-2xl bg-[#f5f1ec] dark:bg-[#18181b] p-6 border border-[#d3cec6] dark:border-[#27272a] shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-white dark:bg-[#09090b] rounded-lg border border-[#d3cec6] dark:border-[#27272a] shadow-sm">
                      <FolderKanban className="h-4 w-4 text-[#111111] dark:text-[#f4f4f5]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold">Kanban Workspace</h4>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Visual Board</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-6 leading-relaxed">Interactive board to manage tasks across your projects. Drag and drop to update status.</p>
                  <Link href="/dashboard/projects/tasks">
                    <Button className="w-full bg-[#111111] dark:bg-[#f4f4f5] text-white dark:text-[#111111] text-xs h-10 font-bold shadow-md hover:translate-y-[-1px] transition-transform">
                      Open Kanban Board
                      <ArrowRight className="ml-2 h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Project Tools Grid */}
        <div className="grid gap-4 md:grid-cols-3 pt-4">
          <Link href="/dashboard/projects/tasks" className="block group">
            <Card className="hover:border-[#111111] dark:hover:border-[#f4f4f5] transition-all duration-300 cursor-pointer border-[#d3cec6] dark:border-[#27272a] bg-[#fdfcfb] dark:bg-[#09090b] hover:shadow-md">
              <CardHeader className="pb-2">
                <ListTodo className="h-5 w-5 mb-2 text-[#7b7b78] group-hover:text-[#111111] dark:group-hover:text-[#f4f4f5] transition-colors" />
                <CardTitle className="text-sm font-bold">Task Explorer</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Global view of all tasks, filters, and priority management.</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/dashboard/projects/milestones" className="block group">
            <Card className="hover:border-[#111111] dark:hover:border-[#f4f4f5] transition-all duration-300 cursor-pointer border-[#d3cec6] dark:border-[#27272a] bg-[#fdfcfb] dark:bg-[#09090b] hover:shadow-md">
              <CardHeader className="pb-2">
                <MilestoneIcon className="h-5 w-5 mb-2 text-[#7b7b78] group-hover:text-[#111111] dark:group-hover:text-[#f4f4f5] transition-colors" />
                <CardTitle className="text-sm font-bold">Milestones & Roadmap</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Track high-level progress and critical delivery dates.</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/dashboard/projects/analytics" className="block group">
            <Card className="hover:border-[#111111] dark:hover:border-[#f4f4f5] transition-all duration-300 cursor-pointer border-[#d3cec6] dark:border-[#27272a] bg-[#fdfcfb] dark:bg-[#09090b] hover:shadow-md">
              <CardHeader className="pb-2">
                <BarChart3 className="h-5 w-5 mb-2 text-[#7b7b78] group-hover:text-[#111111] dark:group-hover:text-[#f4f4f5] transition-colors" />
                <CardTitle className="text-sm font-bold">Project Intelligence</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Insights on resource utilization and delivery velocity.</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
