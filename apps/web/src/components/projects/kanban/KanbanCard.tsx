'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  MoreHorizontal,
  ChevronRight,
  Trash2,
  CheckCircle2,
  Circle,
  ArrowRightCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { format, isPast, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useProject } from '@/contexts/ProjectContext';
import { useState } from 'react';
import { toast } from 'sonner';
import { useProjectMemberRole } from '@/hooks/useProjectMemberRole';
import { useParams, useRouter } from 'next/navigation';
import { tokenStorage } from '@/lib/auth';

interface Task {
  id: string;
  taskNumber: string;
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: string;
  dueDate?: string;
  completedDate?: string;
  assignments?: any[];
  projectId: string;
  project?: {
    projectName: string;
    projectCode: string;
  };
}

interface KanbanCardProps {
  task: Task;
  isGlobal?: boolean;
}

export function KanbanCard({ task, isGlobal }: KanbanCardProps) {
  const router = useRouter();
  const params = useParams();
  const projectId = task.projectId || (params.projectId as string);
  const { canManageTasks } = useProjectMemberRole(projectId);
  const { triggerRefresh } = useProject();
  const [isUpdating, setIsUpdating] = useState(false);

  const user = tokenStorage.getUser();
  const isAssignee = task.assignments?.some((a: any) => a.employee.userId === user?.id);
  const canEdit = canManageTasks || isAssignee;

  const priorityColors = {
    LOW: 'text-slate-500 bg-slate-500/10 border-slate-500/20',
    MEDIUM: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    HIGH: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    URGENT: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
  };

  const deleteTask = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      setIsUpdating(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/project/tasks/${task.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Task deleted successfully');
      triggerRefresh();
    } catch (error) {
      console.error('Failed to delete task', error);
      toast.error('Failed to delete task');
    } finally {
      setIsUpdating(false);
    }
  };

  const moveTask = async (newStatus: string) => {
    try {
      setIsUpdating(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/project/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Failed to move');
      toast.success(`Task moved to ${newStatus}`);
      triggerRefresh();
    } catch (error) {
      console.error('Failed to move task', error);
      toast.error('Failed to move task');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card 
      className={cn(
        "group border-[#d3cec6] dark:border-[#27272a] hover:border-[#111111] dark:hover:border-[#f4f4f5] transition-all shadow-sm cursor-grab active:cursor-grabbing bg-white dark:bg-[#09090b] rounded-2xl overflow-hidden",
        isUpdating && "opacity-50 pointer-events-none"
      )}
    >
      <CardContent className="p-4 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest bg-[#f5f1ec] dark:bg-[#18181b] px-1.5 py-0.5 rounded border border-[#d3cec6] dark:border-[#27272a] w-fit">
                {task.taskNumber}
              </span>
              {isGlobal && task.project && (
                <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-800/50 w-fit">
                  {task.project.projectCode}
                </span>
              )}
            </div>
            <h4 className="text-xs font-bold leading-relaxed line-clamp-2 transition-colors group-hover:text-[#111111] dark:group-hover:text-[#f4f4f5]">
              {task.title}
            </h4>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-2xl p-2 shadow-xl border-[#d3cec6] dark:border-[#27272a] bg-white dark:bg-[#18181b]">
              <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2 py-1.5">Task Actions</DropdownMenuLabel>
              
              {canEdit && (
                <>
                  <DropdownMenuItem className="rounded-xl cursor-pointer py-2">
                    <ChevronRight className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                    <span className="text-xs font-bold">Edit Details</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator className="my-1 bg-[#d3cec6]/50 dark:bg-[#27272a]/50" />
                  
                  {['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'].filter(s => s !== task.status).map(status => (
                    <DropdownMenuItem key={status} onClick={() => moveTask(status)} className="rounded-xl cursor-pointer py-2">
                      <ArrowRightCircle className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                      <span className="text-xs font-bold uppercase tracking-tighter">Move to {status}</span>
                    </DropdownMenuItem>
                  ))}
                  
                  <DropdownMenuSeparator className="my-1 bg-[#d3cec6]/50 dark:bg-[#27272a]/50" />
                  <DropdownMenuItem onClick={deleteTask} className="rounded-xl cursor-pointer py-2 text-rose-600 focus:text-rose-600">
                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                    <span className="text-xs font-bold">Delete Task</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className={cn("text-[8px] font-bold h-4 px-1.5 uppercase", priorityColors[task.priority])}>
              {task.priority}
            </Badge>
            {task.dueDate && (
              <div className={cn(
                "flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider",
                isPast(parseISO(task.dueDate)) && task.status !== 'DONE' ? "text-rose-500" : "text-muted-foreground"
              )}>
                <Clock className="h-2.5 w-2.5" />
                <span>{format(new Date(task.dueDate), 'MMM d')}</span>
              </div>
            )}
          </div>

          <div className="flex -space-x-1.5">
            {(task.assignments || []).slice(0, 2).map((assignment: any, i: number) => (
              <div 
                key={i} 
                className="h-5 w-5 rounded-full border-2 border-white dark:border-[#09090b] bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[7px] font-bold shadow-sm"
                title={assignment.employee?.fullName}
              >
                {assignment.employee?.fullName?.[0] || 'U'}
              </div>
            ))}
            {(task.assignments || []).length > 2 && (
              <div className="h-5 w-5 rounded-full border-2 border-white dark:border-[#09090b] bg-[#f5f1ec] dark:bg-[#18181b] flex items-center justify-center text-[7px] font-bold text-muted-foreground shadow-sm">
                +{(task.assignments || []).length - 2}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
