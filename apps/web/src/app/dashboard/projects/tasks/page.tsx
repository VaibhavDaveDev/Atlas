'use client';

import { AppShell } from '@/components/layout/AppShell';
import { useEffect, useState } from 'react';
import { getTasks } from '@/lib/projects';
import { Loader2 } from 'lucide-react';
import { KanbanBoard } from '@/components/projects/kanban/KanbanBoard';

export default function GlobalTasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await getTasks();
        setTasks(res.data || res || []);
      } catch (error) {
        console.error('Failed to fetch tasks', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
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
      <div className="h-[calc(100vh-64px)] overflow-hidden flex flex-col">
        <div className="px-4 md:px-8 py-6 pb-2 shrink-0">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Global Kanban</h1>
          <p className="text-muted-foreground text-sm">Orchestrating tasks across all active projects.</p>
        </div>
        <div className="flex-1 overflow-hidden">
          <KanbanBoard tasks={tasks} isGlobal={true} />
        </div>
      </div>
    </AppShell>
  );
}
