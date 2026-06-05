'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { getMilestones, updateMilestone, deleteMilestone } from '@/lib/projects';
import { 
  Loader2, 
  Plus, 
  Milestone as MilestoneIcon, 
  CheckCircle2, 
  Clock,
  MoreVertical,
  Pencil,
  Trash2,
  Copy,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreateMilestoneModal } from '@/components/projects/CreateMilestoneModal';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

export default function ProjectMilestonesPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchMilestones = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMilestones(projectId);
      setMilestones(res.data || res || []);
    } catch (error) {
      console.error('Failed to fetch milestones', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) fetchMilestones();
  }, [projectId, fetchMilestones]);

  const handleStatusChange = async (milestoneId: string, status: string) => {
    try {
      await updateMilestone(milestoneId, { status });
      toast.success('Milestone updated');
      fetchMilestones();
    } catch (error) {
      toast.error('Update failed');
    }
  };

  const handleDelete = async (milestoneId: string) => {
    if (confirm('Delete this milestone?')) {
      try {
        await deleteMilestone(milestoneId);
        toast.success('Milestone deleted');
        fetchMilestones();
      } catch (error) {
        toast.error('Deletion failed');
      }
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4 md:p-8">
      <div className="flex items-center justify-between mb-4 md:mb-8">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">Milestones</h1>
          <p className="text-muted-foreground text-xs md:text-sm">Track key delivery targets and project phases.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#111111] dark:bg-[#f4f4f5] text-white dark:text-[#111111] font-bold shadow-lg md:hidden"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#111111] dark:bg-[#f4f4f5] text-white dark:text-[#111111] font-bold shadow-lg hidden md:flex"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Milestone
          </Button>
        </div>
      </div>

      {milestones.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-[#d3cec6] dark:border-[#27272a] rounded-3xl opacity-60 bg-[#fdfcfb] dark:bg-[#18181b]/30 min-h-[300px]">
          <MilestoneIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm font-bold">No milestones defined yet.</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-[250px] text-center">
            Define high-level targets to track project progress effectively.
          </p>
        </div>
      ) : (
        <div className="space-y-4 max-w-4xl">
          {milestones.map((milestone) => (
            <Card key={milestone.id} className="border-[#d3cec6] dark:border-[#27272a] shadow-sm hover:border-[#111111] dark:hover:border-[#f4f4f5] transition-all group">
              <CardContent className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 md:h-12 md:w-12 rounded-2xl flex items-center justify-center shrink-0 ${milestone.status === 'COMPLETED' ? 'bg-emerald-500/10' : 'bg-blue-500/10'}`}>
                    {milestone.status === 'COMPLETED' ? (
                      <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 text-emerald-500" />
                    ) : (
                      <MilestoneIcon className="h-5 w-5 md:h-6 md:w-6 text-blue-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm md:text-base font-bold">{milestone.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 md:line-clamp-none">{milestone.description || 'No description provided.'}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between md:justify-end gap-4 md:gap-8 w-full md:w-auto mt-2 md:mt-0 pl-14 md:pl-0">
                  <div className="flex flex-col md:items-end">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Target Date</span>
                    <span className="text-sm font-bold">{milestone.targetDate ? format(new Date(milestone.targetDate), 'MMM d, yyyy') : 'TBD'}</span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="h-6 font-bold text-[10px] uppercase tracking-wider border-[#d3cec6] dark:border-[#27272a]">
                      {milestone.status || 'PENDING'}
                    </Badge>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 rounded-xl p-2 border-[#d3cec6] dark:border-[#27272a] shadow-xl">
                        <DropdownMenuItem className="rounded-lg cursor-pointer py-2 text-xs font-bold" onClick={() => handleStatusChange(milestone.id, 'COMPLETED')}>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-500" />
                          Mark Completed
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-lg cursor-pointer py-2 text-xs font-bold" onClick={() => toast.info('Edit coming soon')}>
                          <Pencil className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                          Edit Milestone
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="rounded-lg cursor-pointer py-2 text-xs font-bold"
                          onClick={() => {
                            navigator.clipboard.writeText(milestone.id);
                            toast.success('ID copied');
                          }}
                        >
                          <Copy className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                          Copy ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="my-1 bg-[#d3cec6]/50 dark:bg-[#27272a]/50" />
                        <DropdownMenuItem className="rounded-lg cursor-pointer py-2 text-xs font-bold text-rose-600 focus:text-rose-600" onClick={() => handleDelete(milestone.id)}>
                          <Trash2 className="h-3.5 w-3.5 mr-2" />
                          Delete Milestone
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateMilestoneModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projectId={projectId}
        onSuccess={fetchMilestones}
      />
    </div>
  );
}
