'use client';

import { KanbanCard } from './KanbanCard';
import { 
  Plus, 
  MoreHorizontal, 
  CheckCircle2, 
  ArrowRightCircle, 
  SortAsc, 
  Archive 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProject } from '@/contexts/ProjectContext';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useProjectMemberRole } from '@/hooks/useProjectMemberRole';
import { useParams } from 'next/navigation';

interface Task {
  id: string;
  taskNumber: string;
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: string;
  dueDate?: string;
  projectId: string;
  project?: {
    projectName: string;
    projectCode: string;
  };
}

interface KanbanColumnProps {
  status: string;
  tasks: Task[];
  isGlobal?: boolean;
}

export function KanbanColumn({ status, tasks, isGlobal }: KanbanColumnProps) {
  const params = useParams();
  const projectId = params.projectId as string;
  const { canManageTasks } = useProjectMemberRole(projectId);
  const { setCreateTaskModalOpen } = useProject();

  const statusLabels: Record<string, string> = {
    TODO: 'Backlog',
    IN_PROGRESS: 'In Progress',
    REVIEW: 'In Review',
    DONE: 'Completed',
    CANCELLED: 'Cancelled',
  };

  const statusIcons: Record<string, string> = {
    TODO: 'bg-slate-500',
    IN_PROGRESS: 'bg-blue-500',
    REVIEW: 'bg-amber-500',
    DONE: 'bg-emerald-500',
    CANCELLED: 'bg-rose-500',
  };

  return (
    <div className="flex flex-col w-72 md:w-80 shrink-0 h-full group/column">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${statusIcons[status] || 'bg-slate-500'} shadow-sm`} />
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#111111] dark:text-[#f4f4f5]">
            {statusLabels[status] || status}
          </h3>
          <span className="text-[10px] font-bold text-muted-foreground bg-[#f5f1ec] dark:bg-[#18181b] px-1.5 rounded-full border border-[#d3cec6] dark:border-[#27272a]">
            {tasks.length}
          </span>
        </div>
        <div className="flex items-center gap-1 md:opacity-0 group-hover/column:opacity-100 transition-opacity">
          {canManageTasks && !isGlobal && (
            <>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCreateTaskModalOpen(true)}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 rounded-2xl p-2 shadow-xl border-[#d3cec6] dark:border-[#27272a]">
                  <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2 py-1.5">Column Actions</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => toast.success('All tasks marked as completed')} className="rounded-xl cursor-pointer py-2">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-500" />
                    <span className="text-xs font-bold">Mark all as Done</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast.info('Sorting tasks by priority...')} className="rounded-xl cursor-pointer py-2">
                    <SortAsc className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                    <span className="text-xs font-bold">Sort by Priority</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast.info('Moving tasks...')} className="rounded-xl cursor-pointer py-2">
                    <ArrowRightCircle className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                    <span className="text-xs font-bold">Move all to...</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1 bg-[#d3cec6]/50 dark:bg-[#27272a]/50" />
                  <DropdownMenuItem onClick={() => toast.info('Column archived')} className="rounded-xl cursor-pointer py-2 text-rose-600 focus:text-rose-600">
                    <Archive className="h-3.5 w-3.5 mr-2" />
                    <span className="text-xs font-bold">Archive Column</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>

      {/* Tasks List */}
      <ScrollArea className="flex-1 pr-2">
        <div className="space-y-3 pb-4">
          {tasks.map((task) => (
            <KanbanCard key={task.id} task={task} isGlobal={isGlobal} />
          ))}
          
          {canManageTasks && projectId && (
            <Button 
              variant="ghost" 
              onClick={() => setCreateTaskModalOpen(true)}
              className="w-full h-10 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:bg-[#f5f1ec] dark:hover:bg-[#18181b] hover:text-[#111111] dark:hover:text-[#f4f4f5] border border-dashed border-[#d3cec6] dark:border-[#27272a] rounded-xl justify-start px-4 transition-all duration-200 group/add"
            >
              <Plus className="h-3 w-3 mr-2 group-hover/add:scale-110 transition-transform" />
              Add Task
            </Button>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
