'use client';

import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createMilestone } from '@/lib/projects';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface CreateMilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onSuccess: () => void;
}

export function CreateMilestoneModal({ isOpen, onClose, projectId, onSuccess }: CreateMilestoneModalProps) {
  const { workspace } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetDate: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createMilestone({
        projectId,
        name: formData.name,
        description: formData.description,
        targetDate: new Date(formData.targetDate).toISOString(),
      });
      setFormData({ name: '', description: '', targetDate: '' });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to create milestone', error);
      alert('Failed to create milestone');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] border-[#d3cec6] dark:border-[#27272a] bg-[#fdfcfb] dark:bg-[#09090b]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Create Milestone</DialogTitle>
          <DialogDescription className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Define a high-level target
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Milestone Name</Label>
            <Input 
              id="name"
              required 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="border-[#d3cec6] dark:border-[#27272a] bg-white dark:bg-[#09090b]"
              placeholder="e.g. Beta Release"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea 
              id="description"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="border-[#d3cec6] dark:border-[#27272a] bg-white dark:bg-[#09090b]"
              placeholder="Describe the milestone deliverables..."
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="targetDate">Target Date</Label>
            <Input 
              id="targetDate"
              type="date"
              required 
              value={formData.targetDate}
              onChange={e => setFormData({...formData, targetDate: e.target.value})}
              className="border-[#d3cec6] dark:border-[#27272a] bg-white dark:bg-[#09090b]"
            />
          </div>
          
          <div className="flex justify-end pt-4 gap-2">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={onClose}
              disabled={loading}
              className="font-bold"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-[#111111] dark:bg-[#f4f4f5] text-white dark:text-[#111111] font-bold shadow-lg"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create Milestone
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
