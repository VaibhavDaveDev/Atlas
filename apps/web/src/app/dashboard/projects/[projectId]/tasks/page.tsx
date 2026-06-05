'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { KanbanBoard } from '@/components/projects/kanban/KanbanBoard';
import { getTasks } from '@/lib/projects';
import { Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProject } from '@/contexts/ProjectContext';

export default function ProjectTasksPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { setCreateTaskModalOpen, refreshTrigger } = useProject();

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await getTasks(projectId);
      setTasks(res.data || res || []);
    } catch (error) {
      console.error('Failed to fetch tasks', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) fetchTasks();
  }, [projectId, refreshTrigger]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4 md:p-8 pb-0 md:pb-0">
      <div className="flex items-center justify-between mb-4 md:mb-8">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">Project Board</h1>
          <p className="text-muted-foreground text-xs md:text-sm">Manage and track tasks for this project.</p>
        </div>
        <Button 
          size="sm"
          onClick={() => setCreateTaskModalOpen(true)}
          className="bg-[#111111] dark:bg-[#f4f4f5] text-white dark:text-[#111111] font-bold shadow-lg md:hidden"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button 
          onClick={() => setCreateTaskModalOpen(true)}
          className="bg-[#111111] dark:bg-[#f4f4f5] text-white dark:text-[#111111] font-bold shadow-lg hidden md:flex"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Task
        </Button>
      </div>

      <div className="flex-1 overflow-hidden">
        <KanbanBoard tasks={tasks} />
      </div>
    </div>
  );
}


