'use client';

import { AppShell } from '@/components/layout/AppShell';
import { 
  ListTodo, 
  LayoutGrid, 
  List, 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  Circle, 
  Loader2, 
  Search,
  PlusCircle,
  Calendar,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { getMyTasks, getMyProjects } from '@/lib/my-work';
import { tokenStorage } from '@/lib/auth';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { format, isToday, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { KanbanBoard } from '@/components/projects/kanban/KanbanBoard';
import { TaskDetailSidebar } from '@/components/projects/TaskDetailSidebar';
import { ProjectProvider } from '@/contexts/ProjectContext';
import { CreateTaskModal } from '@/components/projects/CreateTaskModal';

export default function MyWorkPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'list' | 'board'>('list');
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState<string>('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [taskRes, projRes] = await Promise.all([
        getMyTasks(),
        getMyProjects()
      ]);
      
      const taskData = Array.isArray(taskRes) ? taskRes : (taskRes?.data || []);
      const projData = Array.isArray(projRes) ? projRes : (projRes?.data || []);
      
      setTasks(taskData);
      setProjects(projData);
    } catch (error) {
      console.error('Failed to fetch data', error);
      toast.error('Failed to load your work');
      setTasks([]);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Keep selected task in sync with updated tasks list
  useEffect(() => {
    if (selectedTask && tasks.length > 0) {
      const updatedTask = tasks.find(t => t.id === selectedTask.id);
      if (updatedTask) {
        setSelectedTask(updatedTask);
      }
    }
  }, [tasks]);

  const handleUpdate = () => {
    fetchData();
  };

  const handleAddTask = (projectId: string) => {
    setActiveProjectId(projectId);
    setIsCreateModalOpen(true);
  };

  const openTask = (task: any) => {
    setSelectedTask(task);
    setIsSidebarOpen(true);
  };

  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.taskNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (task.project?.projectName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const priorityColors = {
    LOW: 'text-slate-500 bg-slate-500/10 border-slate-500/20',
    MEDIUM: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    HIGH: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    URGENT: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
  };

  // Grouping for list view
  const overdueTasks = filteredTasks.filter(t => t.status !== 'DONE' && t.dueDate && new Date(t.dueDate) < new Date() && !isToday(new Date(t.dueDate)));
  const todayTasks = filteredTasks.filter(t => t.dueDate && isToday(new Date(t.dueDate)));
  const upcomingTasks = filteredTasks.filter(t => t.status !== 'DONE' && t.dueDate && new Date(t.dueDate) > new Date() && !isToday(new Date(t.dueDate)));
  const noDueDateTasks = filteredTasks.filter(t => !t.dueDate);
  const completedTasks = filteredTasks.filter(t => t.status === 'DONE');

  // Find projects where user is a Lead
  const currentUserId = tokenStorage.getUser()?.id;
  const managedProjects = projects.filter(p => 
    p.members?.some((m: any) => 
      (m.role === 'LEAD' || m.role === 'MANAGER') && 
      m.employee?.userId === currentUserId
    )
  );

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
    <ProjectProvider>
      <AppShell>
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">My Work</h1>
              <p className="text-muted-foreground text-sm">Everything assigned to you, across all projects.</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search tasks..." 
                  className="pl-9 h-9 border-[#d3cec6] dark:border-[#27272a] bg-[#fdfcfb] dark:bg-[#09090b]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center border border-[#d3cec6] dark:border-[#27272a] rounded-lg p-1 bg-[#fdfcfb] dark:bg-[#09090b]">
                <Button 
                  variant={view === 'list' ? 'secondary' : 'ghost'} 
                  size="sm" 
                  className="h-7 px-2 rounded-md"
                  onClick={() => setView('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button 
                  variant={view === 'board' ? 'secondary' : 'ghost'} 
                  size="sm" 
                  className="h-7 px-2 rounded-md"
                  onClick={() => setView('board')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {managedProjects.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {managedProjects.map((project: any) => (
                <Card key={project.id} className="border-[#d3cec6] dark:border-[#27272a] shadow-sm bg-white dark:bg-[#18181b] text-foreground overflow-hidden group">
                  <CardContent className="p-0">
                    <div className="p-5 space-y-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                            <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-sm truncate">{project.projectName}</h3>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Managed Project</p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-white/10"
                          asChild
                        >
                          <Link href={`/dashboard/projects/${project.id}`}>
                            <LayoutGrid className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          <span>Progress</span>
                          <span>{project.progressPercent || 0}%</span>
                        </div>
                        <Progress value={project.progressPercent || 0} className="h-1.5 bg-muted dark:bg-white/5" indicatorClassName="bg-emerald-500 dark:bg-emerald-500" />
                      </div>

                      <div className="flex items-center gap-3">
                        <Button 
                          onClick={() => handleAddTask(project.id)}
                          className="flex-1 bg-emerald-600 dark:bg-emerald-600 text-white hover:bg-emerald-700 dark:hover:bg-emerald-500 font-extrabold rounded-xl h-9 text-xs gap-2 border-none"
                        >
                          <PlusCircle className="h-4 w-4" />
                          New Task
                        </Button>
                        <Button 
                          variant="outline"
                          asChild
                          className="flex-1 border-[#d3cec6] dark:border-white/10 hover:bg-muted dark:hover:bg-white/10 text-foreground dark:text-white font-bold rounded-xl h-9 text-xs"
                        >
                          <Link href={`/dashboard/projects/${project.id}`}>
                            Overview
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed rounded-[2.5rem] bg-[#fdfcfb] dark:bg-[#18181b]/30 border-[#d3cec6] dark:border-[#27272a]">
              <div className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              </div>
              <h2 className="text-xl font-bold mb-2">You're all caught up!</h2>
              <p className="text-muted-foreground text-center max-w-xs mb-8">
                No tasks have been assigned to you yet. Once you're assigned a task, it will appear here.
              </p>
              <Button variant="outline" asChild className="rounded-xl">
                <Link href="/dashboard/my-work/projects">View My Projects</Link>
              </Button>
            </div>
          ) : (
            <>
              {view === 'list' ? (
                <div className="space-y-8">
                  {overdueTasks.length > 0 && (
                    <TaskSection title="Overdue" tasks={overdueTasks} priorityColors={priorityColors} onTaskClick={openTask} onAddTask={handleAddTask} />
                  )}
                  {todayTasks.length > 0 && (
                    <TaskSection title="Today" tasks={todayTasks} priorityColors={priorityColors} onTaskClick={openTask} onAddTask={handleAddTask} />
                  )}
                  {upcomingTasks.length > 0 && (
                    <TaskSection title="Upcoming" tasks={upcomingTasks} priorityColors={priorityColors} onTaskClick={openTask} onAddTask={handleAddTask} />
                  )}
                  {noDueDateTasks.length > 0 && (
                    <TaskSection title="No Due Date" tasks={noDueDateTasks} priorityColors={priorityColors} onTaskClick={openTask} onAddTask={handleAddTask} />
                  )}
                  {completedTasks.length > 0 && (
                    <TaskSection title="Completed" tasks={completedTasks} priorityColors={priorityColors} isCompleted onTaskClick={openTask} onAddTask={handleAddTask} />
                  )}
                </div>
              ) : (
                <div className="h-[calc(100vh-250px)]">
                  <KanbanBoard tasks={filteredTasks} />
                </div>
              )}
              
              <TaskDetailSidebar 
                task={selectedTask} 
                isOpen={isSidebarOpen} 
                onClose={() => setIsSidebarOpen(false)} 
                onUpdate={handleUpdate}
              />

              <CreateTaskModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                projectId={activeProjectId}
                onSuccess={handleUpdate}
              />
            </>
          )}
        </div>
      </AppShell>
    </ProjectProvider>
  );
}

function TaskSection({ 
  title, 
  tasks, 
  priorityColors, 
  isCompleted = false, 
  onTaskClick,
  onAddTask
}: { 
  title: string; 
  tasks: any[]; 
  priorityColors: any; 
  isCompleted?: boolean; 
  onTaskClick: (task: any) => void;
  onAddTask: (projectId: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className={cn(
          "text-xs font-bold uppercase tracking-widest",
          title === 'Overdue' ? "text-rose-500" : "text-muted-foreground"
        )}>{title}</h2>
        <Badge variant="outline" className="h-4 px-1 text-[10px] font-bold">
          {tasks.length}
        </Badge>
      </div>
      <div className="space-y-2">
        {tasks.map((task: any) => {
          const isLead = task.project?.members?.some((m: any) => m.role === 'LEAD' || m.role === 'MANAGER');
          
          return (
            <Card 
              key={task.id} 
              className="border-[#d3cec6] dark:border-[#27272a] hover:border-[#111111] dark:hover:border-[#f4f4f5] transition-all shadow-sm group cursor-pointer"
              onClick={() => onTaskClick(task)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn(
                      "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border",
                      task.status === 'DONE' ? "bg-emerald-500/10 border-emerald-500/20" : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                    )}>
                      {task.status === 'DONE' ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest bg-[#f5f1ec] dark:bg-[#18181b] px-1 py-0.5 rounded border border-[#d3cec6] dark:border-[#27272a]">
                          {task.taskNumber}
                        </span>
                        {!isCompleted && (
                          <Badge variant="outline" className={cn("text-[8px] font-bold h-3.5 px-1 uppercase", priorityColors[task.priority as keyof typeof priorityColors])}>
                            {task.priority}
                          </Badge>
                        )}
                      </div>
                      <h3 className={cn(
                        "text-sm font-bold truncate",
                        isCompleted && "text-muted-foreground line-through"
                      )}>{task.title}</h3>
                      <div className="flex items-center gap-3 mt-0.5">
                        <Link 
                          href={`/dashboard/projects/${task.projectId}`}
                          className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground uppercase tracking-wider hover:text-[#111111] dark:hover:text-[#f4f4f5] transition-colors"
                        >
                          <Briefcase className="h-2.5 w-2.5" />
                          <span className="truncate max-w-[120px] underline decoration-dotted underline-offset-2">{task.project?.projectName}</span>
                          {isLead && (
                            <Badge variant="secondary" className="h-3.5 text-[7px] font-bold bg-amber-500/10 text-amber-600 border-amber-500/20 uppercase px-1 ml-1">Lead</Badge>
                          )}
                        </Link>
                        {task.dueDate && (
                          <div className={cn(
                            "flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider",
                            title === 'Overdue' ? "text-rose-500" : "text-muted-foreground"
                          )}>
                            <Clock className="h-2.5 w-2.5" />
                            <span>{format(new Date(task.dueDate), 'MMM d')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="hidden sm:flex flex-col items-end mr-2">
                      <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Worked</span>
                      <span className="text-[10px] font-bold">{task.actualHours}h</span>
                    </div>
                    {isLead && !isCompleted && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 rounded-lg border border-[#d3cec6] dark:border-[#27272a] hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:text-emerald-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddTask(task.projectId);
                        }}
                      >
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs font-bold px-3 border border-[#d3cec6] dark:border-[#27272a] hover:bg-[#e8e4dc] dark:hover:bg-[#18181b]">
                      Update
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

import Link from 'next/link';
