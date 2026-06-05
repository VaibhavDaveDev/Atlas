'use client';

import { useState } from 'react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetFooter
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  CheckCircle2, 
  Calendar, 
  Briefcase, 
  History,
  Play,
  Save,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { logTime, updateTaskStatus } from '@/lib/my-work';
import { toast } from 'sonner';

interface TaskDetailSidebarProps {
  task: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function TaskDetailSidebar({ task, isOpen, onClose, onUpdate }: TaskDetailSidebarProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(task?.status || 'TODO');
  const [hours, setHours] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  if (!task) return null;

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      setLoading(true);
      await updateTaskStatus(task.id, newStatus);
      setStatus(newStatus);
      toast.success('Status updated successfully');
      onUpdate();
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const handleLogTime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hours || isNaN(parseFloat(hours))) {
      toast.error('Please enter a valid number of hours');
      return;
    }

    try {
      setLoading(true);
      await logTime(task.id, {
        hours: parseFloat(hours),
        description,
        date
      });
      toast.success('Time logged successfully');
      setHours('');
      setDescription('');
      onUpdate();
    } catch (error) {
      toast.error('Failed to log time');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md border-l border-[#d3cec6] dark:border-[#27272a] bg-[#fdfcfb] dark:bg-[#09090b] p-0 flex flex-col">
        <SheetHeader className="p-6 border-b border-[#d3cec6] dark:border-[#27272a] bg-[#f5f1ec]/30 dark:bg-[#18181b]/30">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-[#f5f1ec] dark:bg-[#18181b] px-1.5 py-0.5 rounded border border-[#d3cec6] dark:border-[#27272a]">
              {task.taskNumber}
            </span>
            <Badge variant="outline" className="text-[9px] font-bold h-4 uppercase">
              {task.priority}
            </Badge>
          </div>
          <SheetTitle className="text-xl font-extrabold tracking-tight leading-tight">
            {task.title}
          </SheetTitle>
          <SheetDescription className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider mt-1">
            <Briefcase className="h-3.5 w-3.5" />
            {task.project?.projectName}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Status Section */}
          <div className="space-y-3">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Current Status</Label>
            <Select 
              value={status} 
              onValueChange={handleStatusUpdate}
              disabled={loading}
            >
              <SelectTrigger className="h-10 border-[#d3cec6] dark:border-[#27272a] bg-white dark:bg-[#09090b] rounded-xl font-bold text-sm">
                <SelectValue placeholder="Set status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-[#d3cec6] dark:border-[#27272a] shadow-xl">
                <SelectItem value="TODO" className="rounded-lg font-bold">To Do</SelectItem>
                <SelectItem value="IN_PROGRESS" className="rounded-lg font-bold">In Progress</SelectItem>
                <SelectItem value="REVIEW" className="rounded-lg font-bold">In Review</SelectItem>
                <SelectItem value="DONE" className="rounded-lg font-bold">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description Section */}
          {task.description && (
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Description</Label>
              <p className="text-sm text-muted-foreground bg-[#f5f1ec]/50 dark:bg-[#18181b]/50 p-4 rounded-2xl border border-[#d3cec6] dark:border-[#27272a] whitespace-pre-wrap italic">
                {task.description}
              </p>
            </div>
          )}

          {/* Time Tracking Section */}
          <div className="space-y-4 pt-4 border-t border-[#d3cec6] dark:border-[#27272a]">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Log Your Time</Label>
              <Badge variant="secondary" className="h-5 text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                {task.actualHours}h Total
              </Badge>
            </div>

            <form onSubmit={handleLogTime} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="hours" className="text-xs font-bold">Hours</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="hours"
                      placeholder="e.g. 2.5" 
                      className="pl-9 h-10 border-[#d3cec6] dark:border-[#27272a] bg-white dark:bg-[#09090b] rounded-xl font-bold"
                      value={hours}
                      onChange={(e) => setHours(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="date" className="text-xs font-bold">Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="date"
                      type="date"
                      className="pl-9 h-10 border-[#d3cec6] dark:border-[#27272a] bg-white dark:bg-[#09090b] rounded-xl font-bold text-xs"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="work-desc" className="text-xs font-bold">What did you work on?</Label>
                <Textarea 
                  id="work-desc"
                  placeholder="Describe your progress..." 
                  className="min-h-[100px] border-[#d3cec6] dark:border-[#27272a] bg-white dark:bg-[#09090b] rounded-xl font-medium text-sm resize-none"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-10 rounded-xl font-bold gap-2"
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Log Work Hours
              </Button>
            </form>
          </div>

          {/* Activity/History */}
          <div className="space-y-3 pt-4 border-t border-[#d3cec6] dark:border-[#27272a]">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <History className="h-3.5 w-3.5" />
              Recent Activity
            </Label>
            <div className="space-y-3">
              {(task.timeLogs || []).length === 0 ? (
                <p className="text-[10px] text-muted-foreground italic">No work logged yet.</p>
              ) : (
                task.timeLogs.map((log: any) => (
                  <div key={log.id} className="flex gap-3">
                    <div className="h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-[10px] font-bold shrink-0 uppercase">
                      {log.employee.firstName?.[0]}{log.employee.lastName?.[0]}
                    </div>
                    <div className="space-y-1 min-w-0">
                      <p className="text-xs"><span className="font-bold">{log.employee.fullName}</span> logged <span className="font-bold">{log.hours}h</span></p>
                      {log.description && <p className="text-[11px] text-muted-foreground leading-snug">{log.description}</p>}
                      <p className="text-[9px] text-muted-foreground font-bold">{format(new Date(log.date), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <SheetFooter className="p-6 border-t border-[#d3cec6] dark:border-[#27272a] bg-[#fdfcfb] dark:bg-[#09090b]">
          <Button variant="ghost" onClick={onClose} className="w-full rounded-xl font-bold h-10 border border-[#d3cec6] dark:border-[#27272a]">
            Close
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
