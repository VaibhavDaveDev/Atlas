'use client';

import { AppShell } from '@/components/layout/AppShell';
import { 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  Loader2, 
  Search,
  ExternalLink,
  Users,
  Target
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { getMyProjects } from '@/lib/my-work';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';

export default function MyProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await getMyProjects();
        setProjects(res || []);
      } catch (error) {
        console.error('Failed to fetch projects', error);
        toast.error('Failed to load your projects');
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const filteredProjects = projects.filter(project => 
    project.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.projectCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusColors = {
    PLANNING: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    ACTIVE: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    ON_HOLD: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    COMPLETED: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    CANCELLED: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">My Projects</h1>
            <p className="text-muted-foreground text-sm">Projects you are contributing to.</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search projects..." 
              className="pl-9 h-10 border-[#d3cec6] dark:border-[#27272a] bg-[#fdfcfb] dark:bg-[#09090b]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed rounded-[2.5rem] bg-[#fdfcfb] dark:bg-[#18181b]/30 border-[#d3cec6] dark:border-[#27272a]">
            <div className="h-20 w-20 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center mb-6">
              <Briefcase className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold mb-2">No active projects</h2>
            <p className="text-muted-foreground text-center max-w-xs">
              You haven't been assigned to any projects yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="border-[#d3cec6] dark:border-[#27272a] hover:border-[#111111] dark:hover:border-[#f4f4f5] transition-all shadow-sm overflow-hidden flex flex-col group">
                <CardContent className="p-0 flex-1 flex flex-col">
                  <div className="p-6 space-y-4 flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-[#f5f1ec] dark:bg-[#18181b] px-1.5 py-0.5 rounded border border-[#d3cec6] dark:border-[#27272a]">
                          {project.projectCode}
                        </span>
                        <h3 className="text-lg font-bold leading-tight group-hover:text-primary transition-colors">{project.projectName}</h3>
                      </div>
                      <Badge variant="outline" className={cn("text-[10px] font-bold px-2 py-0.5 uppercase h-5", statusColors[project.status as keyof typeof statusColors])}>
                        {project.status.replace('_', ' ')}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                      {project.description || 'No description provided.'}
                    </p>

                    <div className="pt-2 space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          <span>Overall Progress</span>
                          <span>{project.progressPercent}%</span>
                        </div>
                        <Progress value={project.progressPercent} className="h-1.5 bg-[#f5f1ec] dark:bg-[#18181b]" />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-800">
                            <Target className="h-4 w-4 text-slate-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[8px] font-bold uppercase text-muted-foreground tracking-widest">Tasks</p>
                            <p className="text-xs font-bold">{project._count?.tasks || 0}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-800">
                            <Clock className="h-4 w-4 text-slate-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[8px] font-bold uppercase text-muted-foreground tracking-widest">Start Date</p>
                            <p className="text-xs font-bold">{format(new Date(project.startDate), 'MMM d, yyyy')}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="px-6 py-4 bg-[#fdfcfb] dark:bg-[#09090b] border-t border-[#d3cec6] dark:border-[#27272a] flex items-center justify-between mt-auto">
                    <div className="flex -space-x-2">
                      {(project.members || []).slice(0, 3).map((member: any) => (
                        <div key={member.id} className="h-8 w-8 rounded-full border-2 border-white dark:border-[#09090b] bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold shadow-sm uppercase">
                          {member.employee.firstName?.[0]}{member.employee.lastName?.[0]}
                        </div>
                      ))}
                      {(project.members || []).length > 3 && (
                        <div className="h-8 w-8 rounded-full border-2 border-white dark:border-[#09090b] bg-[#f5f1ec] dark:bg-[#18181b] flex items-center justify-center text-[8px] font-bold shadow-sm text-muted-foreground">
                          +{(project.members || []).length - 3}
                        </div>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs font-bold px-3 border border-[#d3cec6] dark:border-[#27272a] hover:bg-[#e8e4dc] dark:hover:bg-[#18181b]" asChild>
                      <Link href={`/dashboard/my-work?projectId=${project.id}`}>
                        View Tasks
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
