'use client';

import { AppShell } from '@/components/layout/AppShell';
import { 
  LayoutDashboard, 
  ListTodo, 
  Milestone as MilestoneIcon, 
  Settings, 
  Users,
  ChevronRight,
  Plus
} from 'lucide-react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { getProject } from '@/lib/projects';
import { ProjectProvider, useProject } from '@/contexts/ProjectContext';
import { CreateTaskModal } from '@/components/projects/CreateTaskModal';
import { useProjectMemberRole } from '@/hooks/useProjectMemberRole';

function ProjectLayoutInner({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const projectId = params.projectId as string;
  const [project, setProject] = useState<any>(null);
  const { isCreateTaskModalOpen, setCreateTaskModalOpen, triggerRefresh } = useProject();
  const { canManageTasks } = useProjectMemberRole(projectId);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await getProject(projectId);
        setProject(res.data || res);
      } catch (error) {
        console.error('Failed to fetch project', error);
      }
    };
    if (projectId) fetchProject();
  }, [projectId]);

  const navItems = [
    { name: 'Overview', href: `/dashboard/projects/${projectId}`, icon: LayoutDashboard },
    { name: 'Tasks', href: `/dashboard/projects/${projectId}/tasks`, icon: ListTodo },
    { name: 'Milestones', href: `/dashboard/projects/${projectId}/milestones`, icon: MilestoneIcon },
    { name: 'Members', href: `/dashboard/projects/${projectId}/members`, icon: Users },
    { name: 'Settings', href: `/dashboard/projects/${projectId}/settings`, icon: Settings },
  ];

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] overflow-hidden">
      {/* Mobile Top Nav */}
      <div className="md:hidden flex flex-col shrink-0 border-b border-[#d3cec6] dark:border-[#27272a] bg-[#fdfcfb] dark:bg-[#09090b]">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-[#111111] dark:bg-[#f4f4f5] flex items-center justify-center text-white dark:text-[#111111] font-bold text-sm shadow-md">
              {project?.projectName?.charAt(0) || 'P'}
            </div>
            <span className="font-bold truncate">{project?.projectName || 'Loading...'}</span>
          </div>
          <Button 
            size="sm"
            onClick={() => setCreateTaskModalOpen(true)}
            className="bg-[#111111] dark:bg-[#f4f4f5] text-white dark:text-[#111111] font-bold shadow-md"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <nav className="flex overflow-x-auto hide-scrollbar px-2 pb-2 gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.name === 'Overview' && pathname === `/dashboard/projects/${projectId}`);
            return (
              <Link key={item.name} href={item.href} className="shrink-0">
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200",
                  isActive 
                    ? "bg-[#111111] text-white dark:bg-[#f4f4f5] dark:text-[#111111]" 
                    : "text-muted-foreground hover:bg-[#f5f1ec] dark:hover:bg-[#18181b] hover:text-[#111111] dark:hover:text-[#f4f4f5]"
                )}>
                  <item.icon className="h-3.5 w-3.5" />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-[#d3cec6] dark:border-[#27272a] bg-[#fdfcfb] dark:bg-[#09090b] flex-col shrink-0">
        <div className="p-4 border-b border-[#d3cec6] dark:border-[#27272a]">
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="h-10 w-10 rounded-xl bg-[#111111] dark:bg-[#f4f4f5] flex items-center justify-center text-white dark:text-[#111111] font-bold text-lg shadow-lg">
              {project?.projectName?.charAt(0) || 'P'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{project?.projectCode || '...'}</span>
              <span className="text-sm font-bold truncate">{project?.projectName || 'Loading...'}</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.name === 'Overview' && pathname === `/dashboard/projects/${projectId}`);
            return (
              <Link key={item.name} href={item.href}>
                <div className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold transition-all duration-200 group",
                  isActive 
                    ? "bg-[#111111] text-white dark:bg-[#f4f4f5] dark:text-[#111111] shadow-md" 
                    : "text-muted-foreground hover:bg-[#f5f1ec] dark:hover:bg-[#18181b] hover:text-[#111111] dark:hover:text-[#f4f4f5]"
                )}>
                  <item.icon className={cn("h-4 w-4", isActive ? "" : "text-[#7b7b78] group-hover:text-[#111111] dark:group-hover:text-[#f4f4f5]")} />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#d3cec6] dark:border-[#27272a] bg-[#f5f1ec]/50 dark:bg-[#18181b]/30">
          {canManageTasks && (
            <Button 
              onClick={() => setCreateTaskModalOpen(true)}
              className="w-full bg-[#111111] dark:bg-[#f4f4f5] text-white dark:text-[#111111] font-bold h-10 shadow-lg hover:translate-y-[-1px] transition-transform"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          )}
        </div>
      </aside>

      {/* Project Content */}
      <main className="flex-1 overflow-y-auto bg-white dark:bg-[#09090b]">
        {children}
      </main>

      <CreateTaskModal 
        isOpen={isCreateTaskModalOpen} 
        onClose={() => setCreateTaskModalOpen(false)} 
        projectId={projectId}
        onSuccess={triggerRefresh}
      />
    </div>
  );
}

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <ProjectProvider>
        <ProjectLayoutInner>
          {children}
        </ProjectLayoutInner>
      </ProjectProvider>
    </AppShell>
  );
}
