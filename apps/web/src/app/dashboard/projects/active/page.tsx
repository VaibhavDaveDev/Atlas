'use client';

import { AppShell } from '@/components/layout/AppShell';
import { Briefcase, Loader2, Plus, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getProjects } from '@/lib/projects';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function ActiveProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await getProjects();
        // For this page, we might want to filter by status if we had one, 
        // or just show all since they are "initiatives"
        setProjects(res.data || res || []);
      } catch (error) {
        console.error('Failed to fetch projects', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

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
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#111111] dark:text-[#f4f4f5]">Active Initiatives</h1>
            <p className="text-muted-foreground text-sm">Detailed overview of all ongoing projects in your workspace.</p>
          </div>
          <Link href="/dashboard/projects/new">
            <Button className="bg-[#111111] dark:bg-[#f4f4f5] text-white dark:text-[#111111] font-bold">
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed rounded-3xl opacity-50 bg-[#fdfcfb] dark:bg-[#18181b]/30">
            <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm font-bold">No active projects found.</p>
            <Link href="/dashboard/projects/new" className="mt-4">
              <Button variant="link" className="text-blue-600 font-bold">Create your first initiative</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              const taskCount = project._count?.tasks || 0;
              const completedTasks = project.tasks?.filter((t: any) => t.status === 'DONE').length || 0;
              const progress = taskCount > 0 ? Math.round((completedTasks / taskCount) * 100) : 0;
              
              return (
                <Card key={project.id} className="border-[#d3cec6] dark:border-[#27272a] hover:border-[#111111] dark:hover:border-[#f4f4f5] transition-all shadow-sm group">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-[10px] font-bold uppercase border-[#d3cec6] dark:border-[#27272a]">
                        {project.projectCode}
                      </Badge>
                      <div className="h-8 w-8 rounded-lg bg-[#f5f1ec] dark:bg-[#18181b] flex items-center justify-center border border-[#d3cec6] dark:border-[#27272a]">
                        <Briefcase className="h-4 w-4 text-[#7b7b78]" />
                      </div>
                    </div>
                    <CardTitle className="text-lg font-bold group-hover:text-blue-600 transition-colors">
                      {project.projectName}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 text-xs min-h-[32px]">
                      {project.description || 'No description provided.'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        <span>Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-1.5 bg-[#f5f1ec] dark:bg-[#18181b]" />
                    </div>
                    
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground">Tasks</span>
                        <span className="text-sm font-bold">{completedTasks}/{taskCount}</span>
                      </div>
                      <Link href={`/dashboard/projects/${project.id}`}>
                        <Button variant="ghost" size="sm" className="text-xs font-bold hover:bg-[#f5f1ec] dark:hover:bg-[#18181b]">
                          Details
                          <ArrowRight className="ml-2 h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
