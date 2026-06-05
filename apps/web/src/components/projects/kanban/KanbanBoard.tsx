'use client';

import { KanbanColumn } from './KanbanColumn';
import { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  LayoutGrid, 
  List, 
  MoreHorizontal, 
  Clock, 
  CheckCircle2, 
  Circle,
  Settings,
  Share2,
  Download,
  Maximize2,
  TrendingUp,
  Target
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
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

interface KanbanBoardProps {
  tasks: Task[];
  isGlobal?: boolean;
}

export function KanbanBoard({ tasks, isGlobal }: KanbanBoardProps) {
  const params = useParams();
  const projectId = params.projectId as string;
  const { canManageTasks } = useProjectMemberRole(projectId);
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'BOARD' | 'LIST'>('BOARD');

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.taskNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tasks, searchQuery]);

  const columns = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];

  return (
    <div className="flex flex-col h-full bg-[#fdfcfb] dark:bg-[#09090b] transition-colors duration-300">
      {/* Board Header */}
      <div className="px-4 py-4 border-b border-[#d3cec6] dark:border-[#27272a] bg-white/50 dark:bg-[#09090b]/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-[1600px] mx-auto">
          <div className="flex items-center gap-2">
            <div className="relative w-full md:w-80 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-[#111111] dark:group-focus-within:text-[#f4f4f5] transition-colors" />
              <Input 
                placeholder="Filter tasks..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 border-[#d3cec6] dark:border-[#27272a] bg-white/80 dark:bg-[#18181b]/50 rounded-xl focus:ring-1 focus:ring-[#111111] dark:focus:ring-[#f4f4f5] transition-all"
              />
            </div>
            <Button variant="outline" size="icon" className="h-10 w-10 border-[#d3cec6] dark:border-[#27272a] rounded-xl bg-white dark:bg-[#18181b]/50">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center border border-[#d3cec6] dark:border-[#27272a] rounded-xl p-1 bg-white dark:bg-[#18181b]/50">
              <Button 
                variant={view === 'BOARD' ? 'secondary' : 'ghost'} 
                size="sm" 
                className="h-8 px-3 rounded-lg font-bold text-[10px] uppercase tracking-widest"
                onClick={() => setView('BOARD')}
              >
                <LayoutGrid className="h-3.5 w-3.5 mr-2" />
                Board
              </Button>
              <Button 
                variant={view === 'LIST' ? 'secondary' : 'ghost'} 
                size="sm" 
                className="h-8 px-3 rounded-lg font-bold text-[10px] uppercase tracking-widest"
                onClick={() => setView('LIST')}
              >
                <List className="h-3.5 w-3.5 mr-2" />
                List
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Board Content */}
      <div className="flex-1 overflow-hidden p-4 md:p-6">
        {view === 'BOARD' ? (
          <div className="flex gap-6 h-full overflow-x-auto pb-4 scrollbar-hide">
            {columns.map(status => (
              <KanbanColumn 
                key={status} 
                status={status} 
                tasks={filteredTasks.filter(t => t.status === status)} 
                isGlobal={isGlobal}
              />
            ))}
          </div>
        ) : (
          <div className="max-w-[1600px] mx-auto bg-white dark:bg-[#18181b]/50 border border-[#d3cec6] dark:border-[#27272a] rounded-[2rem] overflow-hidden shadow-sm transition-all duration-500">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#d3cec6] dark:border-[#27272a] bg-[#fdfcfb]/50 dark:bg-[#09090b]/50">
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-24">Number</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Title</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-32">Priority</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-32">Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-32 text-right">Due Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d3cec6]/30 dark:divide-[#27272a]/30">
                  {filteredTasks.map((task) => (
                    <tr 
                      key={task.id} 
                      className="group hover:bg-[#f5f1ec]/50 dark:hover:bg-[#18181b] transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-mono font-bold text-muted-foreground group-hover:text-[#111111] dark:group-hover:text-[#f4f4f5] transition-colors">
                          {task.taskNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-7 w-7 rounded-lg flex items-center justify-center border",
                            task.status === 'DONE' ? "bg-emerald-500/10 border-emerald-500/20" : "bg-slate-50 dark:bg-[#09090b] border-slate-200 dark:border-[#27272a]"
                          )}>
                            {task.status === 'DONE' ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <Circle className="h-3.5 w-3.5 text-muted-foreground" />}
                          </div>
                          <span className={cn(
                            "text-sm font-bold transition-all",
                            task.status === 'DONE' ? "text-muted-foreground line-through" : "text-[#111111] dark:text-[#f4f4f5]"
                          )}>
                            {task.title}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={cn(
                          "text-[9px] font-bold uppercase tracking-wider px-2 h-5 border",
                          task.priority === 'URGENT' ? "text-rose-500 bg-rose-500/10 border-rose-500/20" :
                          task.priority === 'HIGH' ? "text-amber-500 bg-amber-500/10 border-amber-500/20" :
                          task.priority === 'MEDIUM' ? "text-blue-500 bg-blue-500/10 border-blue-500/20" :
                          "text-slate-500 bg-slate-500/10 border-slate-500/20"
                        )}>
                          {task.priority}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="secondary" className="text-[9px] font-bold uppercase tracking-wider px-2 h-5 bg-[#f5f1ec] dark:bg-[#27272a] text-[#111111] dark:text-[#f4f4f5]">
                          {task.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {task.dueDate ? (
                          <span className="text-[10px] font-bold text-muted-foreground">
                            {format(new Date(task.dueDate), 'MMM d, yyyy')}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-muted-foreground/30 italic">No date</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredTasks.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center text-muted-foreground italic text-xs">
                        No tasks found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
