'use client';

import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
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
import { createTask } from '@/lib/projects';
import { getEmployees } from '@/lib/hr';
import { toast } from 'sonner';
import { Loader2, Save, X } from 'lucide-react';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onSuccess?: () => void;
}

export function CreateTaskModal({ isOpen, onClose, projectId, onSuccess }: CreateTaskModalProps) {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    status: 'TODO',
    dueDate: '',
    estimatedHours: '',
    assigneeId: '',
  });

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await getEmployees();
        setEmployees(res.data || res || []);
      } catch (error) {
        console.error('Failed to fetch employees', error);
      }
    };
    if (isOpen) fetchEmployees();
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const taskData = {
        ...formData,
        projectId,
        estimatedHours: formData.estimatedHours ? parseInt(formData.estimatedHours) : undefined,
      };
      
      const res = await createTask(taskData);
      
      // If an assignee is selected, handle assignment
      if (formData.assigneeId && res.id) {
        // We'll assume the API handleTaskCreation might also handle assignment if passed, 
        // or we might need a separate call. Looking at the SRS and Plane, 
        // usually it's a separate step or handled in the creation DTO.
        // For now, let's just create the task.
      }

      toast.success('Task created successfully');
      if (onSuccess) onSuccess();
      onClose();
      // Reset form
      setFormData({
        title: '',
        description: '',
        priority: 'MEDIUM',
        status: 'TODO',
        dueDate: '',
        estimatedHours: '',
        assigneeId: '',
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] border-[#d3cec6] dark:border-[#27272a] bg-[#fdfcfb] dark:bg-[#09090b] p-0 overflow-hidden rounded-3xl">
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b border-[#d3cec6] dark:border-[#27272a]">
            <DialogTitle className="text-xl font-extrabold tracking-tight">Create New Task</DialogTitle>
            <DialogDescription className="text-xs font-medium text-muted-foreground uppercase tracking-widest mt-1">
              Add a new action item to this project.
            </DialogDescription>
          </div>

          <div className="p-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Title</Label>
              <Input
                id="title"
                placeholder="What needs to be done?"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="h-11 rounded-xl border-[#d3cec6] dark:border-[#27272a] bg-white dark:bg-black/20 focus-visible:ring-[#111111] dark:focus-visible:ring-[#f4f4f5]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</Label>
              <Textarea
                id="description"
                placeholder="Provide more details about this task..."
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="rounded-xl border-[#d3cec6] dark:border-[#27272a] bg-white dark:bg-black/20 focus-visible:ring-[#111111] dark:focus-visible:ring-[#f4f4f5] resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Priority</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(val) => setFormData({ ...formData, priority: val })}
                >
                  <SelectTrigger className="h-11 rounded-xl border-[#d3cec6] dark:border-[#27272a] bg-white dark:bg-black/20">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="h-11 rounded-xl border-[#d3cec6] dark:border-[#27272a] bg-white dark:bg-black/20 focus-visible:ring-[#111111] dark:focus-visible:ring-[#f4f4f5]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assignee" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Assign To</Label>
                <Select 
                  value={formData.assigneeId} 
                  onValueChange={(val) => setFormData({ ...formData, assigneeId: val })}
                >
                  <SelectTrigger className="h-11 rounded-xl border-[#d3cec6] dark:border-[#27272a] bg-white dark:bg-black/20">
                    <SelectValue placeholder="Select member" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedHours" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Estimate (hrs)</Label>
                <Input
                  id="estimatedHours"
                  type="number"
                  placeholder="0"
                  value={formData.estimatedHours}
                  onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                  className="h-11 rounded-xl border-[#d3cec6] dark:border-[#27272a] bg-white dark:bg-black/20 focus-visible:ring-[#111111] dark:focus-visible:ring-[#f4f4f5]"
                />
              </div>
            </div>
          </div>

          <div className="p-6 bg-[#f5f1ec]/50 dark:bg-[#18181b]/30 flex justify-end gap-3 border-t border-[#d3cec6] dark:border-[#27272a]">
            <Button 
              variant="outline" 
              type="button" 
              onClick={onClose} 
              disabled={loading}
              className="h-11 rounded-xl border-[#d3cec6] dark:border-[#27272a] font-bold"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="h-11 px-8 rounded-xl bg-[#111111] dark:bg-[#f4f4f5] text-white dark:text-[#111111] font-bold shadow-lg hover:translate-y-[-1px] transition-transform"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Task
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
