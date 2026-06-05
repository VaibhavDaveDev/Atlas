'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, 
  Users, 
  CheckCircle2, 
  Clock, 
  MoreVertical,
  ArrowUpRight,
  Archive,
  Pencil,
  Trash2
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { deleteProject, updateProject } from '@/lib/projects';
import { useProject } from '@/contexts/ProjectContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { DeleteProjectDialog } from './DeleteProjectDialog';

interface ProjectCardProps {
  project: {
    id: string;
    projectCode: string;
    projectName: string;
    description?: string;
    status: string;
    progressPercent: number;
    startDate: string;
    endDate?: string;
    budgetAmount?: number;
    actualCost?: number;
  };
}

export function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();
  const [isArchiving, setIsArchiving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const statusColors: Record<string, string> = {
    PLANNING: 'bg-slate-500',
    IN_PROGRESS: 'bg-blue-500',
    ON_HOLD: 'bg-amber-500',
    COMPLETED: 'bg-emerald-500',
    CANCELLED: 'bg-rose-500',
  };

  const handleArchive = async () => {
    setIsArchiving(true);
    try {
      await updateProject(project.id, { status: 'COMPLETED' });
      window.location.reload();
    } catch (error) {
      console.error('Failed to archive project', error);
      alert('Failed to archive project.');
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <>
      <Card className={`group border-[#d3cec6] dark:border-[#27272a] hover:border-[#111111] dark:hover:border-[#f4f4f5] transition-all duration-300 overflow-hidden shadow-sm`}>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-[#f5f1ec] dark:bg-[#09090b] px-1.5 py-0.5 rounded border border-[#d3cec6] dark:border-[#27272a]">
                {project.projectCode}
              </span>
              <Badge className={`${statusColors[project.status] || 'bg-slate-500'} text-[10px] font-bold py-0 h-4`}>
                {project.status.replace('_', ' ')}
              </Badge>
            </div>
            <CardTitle className="text-base font-bold line-clamp-1 group-hover:text-[#111111] dark:group-hover:text-[#f4f4f5] transition-colors">
              {project.projectName}
            </CardTitle>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <Link href={`/dashboard/projects/${project.id}/settings`}>
                <DropdownMenuItem className="cursor-pointer">
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Settings
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem onClick={handleArchive} disabled={isArchiving} className="cursor-pointer">
                <Archive className="h-4 w-4 mr-2" />
                {isArchiving ? 'Archiving...' : 'Mark as Completed'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setShowDeleteDialog(true)} 
                className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950 cursor-pointer"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground line-clamp-2 min-h-[32px]">
            {project.description || 'No description provided.'}
          </p>
          
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <span>Progress</span>
              <span>{project.progressPercent}%</span>
            </div>
            <Progress value={project.progressPercent} className="h-1 bg-[#f5f1ec] dark:bg-[#09090b]" />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{project.startDate ? format(new Date(project.startDate), 'MMM d, yyyy') : 'N/A'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground justify-end">
              <Users className="h-3 w-3" />
              <span>Team</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#d3cec6] dark:border-[#27272a] mt-2">
            <Link href={`/dashboard/projects/${project.id}`}>
              <Button variant="ghost" className="w-full h-8 text-[10px] font-bold hover:bg-[#111111] hover:text-white dark:hover:bg-[#f4f4f5] dark:hover:text-[#111111] justify-center group/btn rounded-lg">
                Workspace
              </Button>
            </Link>
            <Link href={`/dashboard/projects/${project.id}/tasks`}>
              <Button className="w-full h-8 text-[10px] font-bold bg-[#111111] text-white dark:bg-[#f4f4f5] dark:text-[#111111] hover:bg-[#111111]/90 hover:text-white dark:hover:bg-[#f4f4f5]/90 dark:hover:text-[#111111] justify-center group/btn rounded-lg shadow-sm border-none">
                Board
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <DeleteProjectDialog 
        project={project}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onSuccess={() => window.location.reload()}
      />
    </>
  );
}
