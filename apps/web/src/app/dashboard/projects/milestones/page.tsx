'use client';

import { AppShell } from '@/components/layout/AppShell';
import { 
  Milestone as MilestoneIcon, 
  Search, 
  Briefcase, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  MoreVertical,
  ExternalLink,
  Copy,
  Pencil
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { getMilestones } from '@/lib/projects';
import { Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import Link from 'next/link';

export default function MilestonesPage() {
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchMilestones = async () => {
      try {
        const res = await getMilestones();
        setMilestones(res.data || res || []);
      } catch (error) {
        console.error('Failed to fetch milestones', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMilestones();
  }, []);

  const filteredMilestones = milestones.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.project?.projectName || '').toLowerCase().includes(searchQuery.toLowerCase())
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
    <AppShell>
      <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Milestones & Roadmap</h1>
            <p className="text-muted-foreground text-sm">Critical path and timeline tracking across all tracked initiatives.</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search milestones or projects..." 
              className="pl-9 h-10 border-[#d3cec6] dark:border-[#27272a] bg-[#fdfcfb] dark:bg-[#09090b]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {milestones.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed rounded-3xl opacity-50 bg-[#fdfcfb] dark:bg-[#18181b]/30">
            <MilestoneIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm font-bold">No milestones defined in this workspace.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMilestones.map((milestone) => {
              const isCompleted = milestone.status === 'COMPLETED';
              const isPastDue = milestone.targetDate && new Date(milestone.targetDate) < new Date() && !isCompleted;
              
              return (
                <Card key={milestone.id} className="border-[#d3cec6] dark:border-[#27272a] hover:border-[#111111] dark:hover:border-[#f4f4f5] transition-all shadow-sm">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 border",
                          isCompleted ? "bg-emerald-500/10 border-emerald-500/20" : isPastDue ? "bg-rose-500/10 border-rose-500/20" : "bg-blue-500/10 border-blue-500/20"
                        )}>
                          {isCompleted ? (
                            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                          ) : (
                            <MilestoneIcon className="h-6 w-6 text-blue-500" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base font-bold truncate">{milestone.name}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                              <Briefcase className="h-3 w-3" />
                              <span className="truncate max-w-[200px]">{milestone.project?.projectName || 'No Project'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                              <Calendar className="h-3 w-3" />
                              <span>Target: {milestone.targetDate ? format(new Date(milestone.targetDate), 'MMM d, yyyy') : 'TBD'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between md:justify-end gap-6 pl-16 md:pl-0 border-t md:border-t-0 pt-3 md:pt-0">
                        <div className="flex flex-col md:items-end min-w-[100px]">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</span>
                          <Badge variant="outline" className={cn(
                            "mt-1 font-bold text-[10px] uppercase",
                            isCompleted ? "border-emerald-500 text-emerald-600" : isPastDue ? "border-rose-500 text-rose-600" : "border-[#d3cec6] dark:border-[#27272a]"
                          )}>
                            {milestone.status}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          {isPastDue && (
                            <div className="flex items-center gap-1 text-rose-600 animate-pulse hidden sm:flex">
                              <AlertCircle className="h-4 w-4" />
                              <span className="text-[10px] font-bold uppercase">Overdue</span>
                            </div>
                          )}
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-xl p-2 border-[#d3cec6] dark:border-[#27272a] shadow-xl">
                              <Link href={`/dashboard/projects/${milestone.projectId}`}>
                                <DropdownMenuItem className="rounded-lg cursor-pointer py-2 text-xs font-bold">
                                  <ExternalLink className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                                  View Project
                                </DropdownMenuItem>
                              </Link>
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
                              <DropdownMenuItem className="rounded-lg cursor-pointer py-2 text-xs font-bold text-rose-600 focus:text-rose-600" onClick={() => toast.error('Protected resource')}>
                                <AlertCircle className="h-3.5 w-3.5 mr-2" />
                                Mark Overdue
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
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
