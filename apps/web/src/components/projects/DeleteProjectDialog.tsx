'use client';

import { useState } from 'react';
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
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { deleteProject } from '@/lib/projects';
import { toast } from 'sonner';

interface DeleteProjectDialogProps {
  project: {
    id: string;
    projectName: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DeleteProjectDialog({ project, open, onOpenChange, onSuccess }: DeleteProjectDialogProps) {
  const [confirmName, setConfirmName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (confirmName !== project.projectName) {
      toast.error('Project name does not match');
      return;
    }

    setLoading(true);
    try {
      await deleteProject(project.id);
      toast.success('Project deleted successfully');
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] border-[#d3cec6] dark:border-[#27272a] bg-[#fdfcfb] dark:bg-[#09090b] p-0 overflow-hidden rounded-3xl">
        <div className="bg-rose-50 dark:bg-rose-950/20 p-6 flex items-center gap-4 border-b border-rose-100 dark:border-rose-900/30">
          <div className="h-12 w-12 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-6 w-6 text-rose-600" />
          </div>
          <div>
            <DialogTitle className="text-rose-900 dark:text-rose-400 font-bold">Delete Initiative</DialogTitle>
            <DialogDescription className="text-rose-700/70 dark:text-rose-400/50 text-xs mt-0.5">
              This action is irreversible and will delete all tasks.
            </DialogDescription>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              To confirm, please type <span className="font-bold text-[#111111] dark:text-[#f4f4f5] select-all underline decoration-rose-500/30 underline-offset-4">{project.projectName}</span> below.
            </p>
            <div className="grid gap-2">
              <Label htmlFor="confirmName" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Verify Project Name</Label>
              <Input
                id="confirmName"
                placeholder="Type project name exactly"
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                className="bg-transparent border-[#d3cec6] dark:border-[#27272a] h-11 rounded-xl"
                autoComplete="off"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 pt-0 gap-3">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="rounded-xl font-bold text-xs h-11 px-6"
            disabled={loading}
          >
            Keep Project
          </Button>
          <Button 
            variant="destructive"
            onClick={handleDelete}
            disabled={confirmName !== project.projectName || loading}
            className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs h-11 px-6 shadow-lg shadow-rose-600/20 disabled:opacity-50 disabled:grayscale"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Terminate Initiative
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
