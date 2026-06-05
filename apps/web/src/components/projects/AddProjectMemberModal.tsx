'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  UserPlus, 
  Loader2, 
  Info,
  CheckCircle2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { getEmployees } from '@/lib/hr';
import { assignProjectMember } from '@/lib/projects';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface AddProjectMemberModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingMemberIds: string[];
}

export function AddProjectMemberModal({
  projectId,
  isOpen,
  onClose,
  onSuccess,
  existingMemberIds,
}: AddProjectMemberModalProps) {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [fetchingEmployees, setFetchingEmployees] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [role, setRole] = useState<string>('MEMBER');

  useEffect(() => {
    if (isOpen) {
      const fetchEmployees = async () => {
        setFetchingEmployees(true);
        try {
          const res = await getEmployees();
          setEmployees(res.data || res || []);
        } catch (error) {
          toast.error('Failed to load employees');
        } finally {
          setFetchingEmployees(false);
        }
      };
      fetchEmployees();
    }
  }, [isOpen]);

  const filteredEmployees = employees.filter(emp => 
    !existingMemberIds.includes(emp.id) &&
    (emp.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
     emp.employeeNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAddMember = async () => {
    if (!selectedEmployeeId) {
      toast.error('Please select an employee');
      return;
    }

    setLoading(true);
    try {
      await assignProjectMember(projectId, {
        employeeId: selectedEmployeeId,
        role,
      });
      toast.success('Member added successfully');
      onSuccess();
      onClose();
      // Reset state
      setSelectedEmployeeId('');
      setRole('MEMBER');
      setSearchQuery('');
    } catch (error) {
      toast.error('Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] border-[#d3cec6] dark:border-[#27272a] bg-[#fdfcfb] dark:bg-[#09090b] rounded-[2rem] p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-6 border-b border-[#d3cec6] dark:border-[#27272a] bg-[#f5f1ec]/30 dark:bg-[#18181b]/30">
          <DialogTitle className="text-xl font-extrabold tracking-tight flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Add Team Member
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Employee Selection */}
          <div className="space-y-3">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Select Employee</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by name or ID..." 
                className="pl-9 h-11 border-[#d3cec6] dark:border-[#27272a] bg-white dark:bg-[#09090b] rounded-xl font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="max-h-[200px] overflow-y-auto border border-[#d3cec6] dark:border-[#27272a] rounded-xl bg-white dark:bg-black/20 p-1 space-y-1">
              {fetchingEmployees ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : filteredEmployees.length === 0 ? (
                <p className="text-center py-8 text-xs font-bold text-muted-foreground italic">
                  {searchQuery ? 'No matching employees found' : 'No more employees to add'}
                </p>
              ) : (
                filteredEmployees.map((emp) => (
                  <div 
                    key={emp.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors",
                      selectedEmployeeId === emp.id 
                        ? "bg-primary/10 border border-primary/20" 
                        : "hover:bg-[#f5f1ec] dark:hover:bg-[#18181b]"
                    )}
                    onClick={() => setSelectedEmployeeId(emp.id)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold border border-slate-200 dark:border-slate-700 shrink-0">
                        {emp.firstName?.[0]}{emp.lastName?.[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">{emp.fullName}</p>
                        <p className="text-[9px] text-muted-foreground font-bold uppercase truncate">{emp.employeeNumber} • {emp.designation?.title || 'No Title'}</p>
                      </div>
                    </div>
                    {selectedEmployeeId === emp.id && (
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Project Role</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-black text-white border-none rounded-xl p-3 max-w-xs z-[100]">
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold"><span className="text-amber-400">Team Lead:</span> Can create tasks, assign members, and manage project progress. Multiple leads can be assigned.</p>
                      <p className="text-[10px] font-bold"><span className="text-blue-400">Member:</span> Can view projects and manage their own assigned tasks.</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="h-11 border-[#d3cec6] dark:border-[#27272a] bg-white dark:bg-[#09090b] rounded-xl font-bold">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-[#d3cec6] dark:border-[#27272a] shadow-xl">
                <SelectItem value="MEMBER" className="rounded-lg font-bold">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="h-4 text-[8px] uppercase">Member</Badge>
                    <span>Regular project contributor</span>
                  </div>
                </SelectItem>
                <SelectItem value="LEAD" className="rounded-lg font-bold">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="h-4 text-[8px] uppercase bg-amber-500/10 text-amber-600 border-amber-500/20">Lead</Badge>
                    <span>Project lead privileges</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="p-6 border-t border-[#d3cec6] dark:border-[#27272a] bg-[#fdfcfb] dark:bg-[#09090b]">
          <Button variant="ghost" onClick={onClose} className="rounded-xl font-bold h-11 border border-[#d3cec6] dark:border-[#27272a]">
            Cancel
          </Button>
          <Button 
            onClick={handleAddMember} 
            disabled={loading || !selectedEmployeeId}
            className="rounded-xl font-bold h-11 px-8 gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Add Member
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
