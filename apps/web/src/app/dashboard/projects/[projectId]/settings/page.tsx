'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getProject, updateProject } from '@/lib/projects';
import { Loader2, Settings2, Trash2, Save, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { getEmployees } from '@/lib/hr';
import { toast } from 'sonner';
import { DeleteProjectDialog } from '@/components/projects/DeleteProjectDialog';

export default function ProjectSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const [project, setProject] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [projectRes, employeesRes] = await Promise.all([
          getProject(projectId),
          getEmployees()
        ]);
        setProject(projectRes.data || projectRes);
        setEmployees(employeesRes.data || employeesRes || []);
      } catch (error) {
        console.error('Failed to fetch settings data', error);
      } finally {
        setLoading(false);
      }
    };
    if (projectId) fetchData();
  }, [projectId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProject(projectId, {
        projectName: project.projectName,
        description: project.description,
        status: project.status,
        budgetAmount: project.budgetAmount ? Number(project.budgetAmount) : undefined,
        startDate: project.startDate,
        endDate: project.endDate,
        projectManagerId: project.projectManagerId,
      });
      toast.success('Project updated successfully.');
    } catch (error: any) {
      console.error('Failed to update project', error);
      toast.error(error.message || 'Failed to update project.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) return <div className="p-4 md:p-8">Project not found.</div>;

  return (
    <div className="h-full flex flex-col p-4 md:p-8 max-w-4xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 md:mb-8 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-[#111111] dark:text-[#f4f4f5]">Project Settings</h1>
          <p className="text-muted-foreground text-xs md:text-sm">Manage configuration and lifecycle for {project.projectCode}.</p>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="border-[#d3cec6] dark:border-[#27272a] shadow-sm bg-[#fdfcfb] dark:bg-[#09090b]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings2 className="h-5 w-5" /> General Information
            </CardTitle>
            <CardDescription>Update the basic details of your project.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Project Name</Label>
                  <Input 
                    required
                    value={project.projectName}
                    onChange={(e) => setProject({...project, projectName: e.target.value})}
                    className="border-[#d3cec6] dark:border-[#27272a] bg-white dark:bg-[#09090b]" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Project Code</Label>
                  <Input 
                    value={project.projectCode}
                    disabled
                    className="bg-slate-50 dark:bg-slate-900 border-[#d3cec6] dark:border-[#27272a] cursor-not-allowed" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea 
                  value={project.description || ''}
                  onChange={(e) => setProject({...project, description: e.target.value})}
                  className="border-[#d3cec6] dark:border-[#27272a] bg-white dark:bg-[#09090b] min-h-[100px]" 
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={project.status} onValueChange={(val) => setProject({...project, status: val})}>
                    <SelectTrigger className="border-[#d3cec6] dark:border-[#27272a] bg-white dark:bg-[#09090b]">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PLANNING">Planning</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="ON_HOLD">On Hold</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Project Manager</Label>
                  <Select value={project.projectManagerId || "none"} onValueChange={(val) => setProject({...project, projectManagerId: val === "none" ? null : val})}>
                    <SelectTrigger className="border-[#d3cec6] dark:border-[#27272a] bg-white dark:bg-[#09090b]">
                      <SelectValue placeholder="Assign Manager" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>{emp.fullName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Budget Amount</Label>
                  <Input 
                    type="number"
                    value={project.budgetAmount || ''}
                    onChange={(e) => setProject({...project, budgetAmount: e.target.value})}
                    className="border-[#d3cec6] dark:border-[#27272a] bg-white dark:bg-[#09090b]" 
                  />
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input 
                    type="date"
                    required
                    value={project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => setProject({...project, startDate: new Date(e.target.value).toISOString()})}
                    className="border-[#d3cec6] dark:border-[#27272a] bg-white dark:bg-[#09090b]" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input 
                    type="date"
                    value={project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => setProject({...project, endDate: e.target.value ? new Date(e.target.value).toISOString() : undefined})}
                    className="border-[#d3cec6] dark:border-[#27272a] bg-white dark:bg-[#09090b]" 
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button 
                  type="submit" 
                  disabled={saving}
                  className="bg-[#111111] dark:bg-[#f4f4f5] text-white dark:text-[#111111] font-bold shadow-lg"
                >
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border-rose-200 dark:border-rose-900/50 shadow-sm bg-rose-50/30 dark:bg-rose-950/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-rose-600 dark:text-rose-500">
              <AlertCircle className="h-5 w-5" /> Danger Zone
            </CardTitle>
            <CardDescription className="text-rose-600/80 dark:text-rose-400/80">
              Irreversible destructive actions for this project.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border border-rose-200 dark:border-rose-900/50 rounded-xl bg-white/50 dark:bg-black/20">
              <div>
                <h4 className="font-bold text-sm text-rose-900 dark:text-rose-300">Delete Project</h4>
                <p className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-1">Permanently remove this project and all its data. This cannot be undone.</p>
              </div>
              <Button 
                variant="destructive" 
                onClick={() => setShowDeleteDialog(true)}
                className="font-bold shadow-sm whitespace-nowrap"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Project
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <DeleteProjectDialog 
        project={project}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onSuccess={() => router.push('/dashboard/projects')}
      />
    </div>
  );
}
