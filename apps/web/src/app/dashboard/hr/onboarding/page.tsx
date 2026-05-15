'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { getOnboardingTemplates, createOnboardingTemplate, getEmployees, initiateOnboarding, getOnboardingTasks, updateOnboardingTask } from '@/lib/hr';
import { Loader2, Plus, UserPlus, CheckCircle2, Circle, ClipboardList, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { FormContainer } from '@/components/common/FormContainer';

export default function OnboardingPage() {
  const [activeTab, setActiveTab] = useState<'templates' | 'active'>('active');
  const [templates, setTemplates] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [activeOnboardings, setActiveOnboardings] = useState<any[]>([]);
  const [selectedEmp, setSelectedEmp] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [isInitiating, setIsInitiating] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'active') {
        const [empRes, tempRes] = await Promise.all([getEmployees(), getOnboardingTemplates()]);
        if (empRes.success) {
          const onboardingEmps = empRes.data.filter((e: any) => e.status === 'ONBOARDING');
          setEmployees(empRes.data);
          setActiveOnboardings(onboardingEmps);
        }
        if (tempRes.success) setTemplates(tempRes.data);
      } else {
        const tempRes = await getOnboardingTemplates();
        if (tempRes.success) setTemplates(tempRes.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Employee Onboarding</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">Manage onboarding checklists and new hire progress.</p>
          </div>
          <div className="flex bg-muted/50 p-1 rounded-lg">
            <button onClick={() => setActiveTab('active')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'active' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Active Onboardings</button>
            <button onClick={() => setActiveTab('templates')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'templates' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Templates</button>
          </div>
          {activeTab === 'active' ? (
            <Button onClick={() => setIsInitiating(!isInitiating)}><UserPlus className="mr-2 h-4 w-4" /> Initiate Onboarding</Button>
          ) : (
            <Button onClick={() => setIsCreatingTemplate(!isCreatingTemplate)}><Plus className="mr-2 h-4 w-4" /> New Template</Button>
          )}
        </div>

        <FormContainer
          title="Initiate Onboarding"
          isOpen={isInitiating}
          setIsOpen={setIsInitiating}
        >
          <InitiateForm />
        </FormContainer>

        <FormContainer
          title="Create Onboarding Template"
          isOpen={isCreatingTemplate}
          setIsOpen={setIsCreatingTemplate}
        >
          <CreateTemplateForm />
        </FormContainer>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              {isLoading ? (
                <div className="flex h-32 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : activeTab === 'active' ? (
                <OnboardingList />
              ) : (
                <TemplateList />
              )}
            </div>
          </div>
          <div className="md:col-span-1">
            {selectedEmp ? <TaskProgress employee={selectedEmp} /> : <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground text-sm">Select an employee to view onboarding tasks</div>}
          </div>
        </div>
      </div>
    </AppShell>
  );

  function OnboardingList() {
    return activeOnboardings.length === 0 ? (
      <div className="p-12 text-center text-muted-foreground">No active onboardings</div>
    ) : (
      <table className="w-full text-sm text-left">
        <thead className="bg-muted/50 text-xs uppercase text-muted-foreground"><tr><th className="px-6 py-4">Employee</th><th className="px-6 py-4">Department</th><th className="px-6 py-4 text-right">Action</th></tr></thead>
        <tbody className="divide-y divide-border">
          {activeOnboardings.map(emp => (
            <tr key={emp.id} className={`hover:bg-muted/30 cursor-pointer ${selectedEmp?.id === emp.id ? 'bg-muted/50' : ''}`} onClick={() => setSelectedEmp(emp)}>
              <td className="px-6 py-4"><p className="font-medium">{emp.fullName}</p><p className="text-xs text-muted-foreground">{emp.employeeNumber}</p></td>
              <td className="px-6 py-4">{emp.department?.name || 'Unassigned'}</td>
              <td className="px-6 py-4 text-right"><Button variant="ghost" size="sm">View Tasks</Button></td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  function TemplateList() {
    return templates.length === 0 ? (
      <div className="p-12 text-center text-muted-foreground">No templates created yet</div>
    ) : (
      <table className="w-full text-sm text-left">
        <thead className="bg-muted/50 text-xs uppercase text-muted-foreground"><tr><th className="px-6 py-4">Template Name</th><th className="px-6 py-4">Activities</th></tr></thead>
        <tbody className="divide-y divide-border">
          {templates.map(t => (
            <tr key={t.id} className="hover:bg-muted/30">
              <td className="px-6 py-4 font-medium">{t.name}</td>
              <td className="px-6 py-4">{t.activities?.length || 0} Tasks</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  function TaskProgress({ employee }: { employee: any }) {
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      loadTasks();
    }, [employee.id]);

    const loadTasks = async () => {
      setLoading(true);
      try {
        const res = await getOnboardingTasks(employee.id);
        if (res.success) setTasks(res.data);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const toggleTask = async (taskId: string, currentStatus: string) => {
      const newStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
      try {
        await updateOnboardingTask(taskId, newStatus);
        loadTasks();
      } catch (e) { console.error(e); }
    };

    const completedCount = tasks.filter(t => t.status === 'COMPLETED').length;
    const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

    return (
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Onboarding Progress</h3>
          <Badge variant="secondary">{Math.round(progress)}%</Badge>
        </div>
        <div className="w-full bg-muted rounded-full h-1.5"><div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} /></div>
        <div className="space-y-3 pt-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : tasks.map(task => (
            <div key={task.id} className="flex items-start gap-3 group cursor-pointer" onClick={() => toggleTask(task.id, task.status)}>
              {task.status === 'COMPLETED' ? <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" /> : <Circle className="h-5 w-5 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />}
              <div className="space-y-0.5">
                <p className={`text-sm font-medium leading-none ${task.status === 'COMPLETED' ? 'text-muted-foreground line-through' : ''}`}>{task.title}</p>
                {task.description && <p className="text-xs text-muted-foreground">{task.description}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function InitiateForm() {
    const [empId, setEmpId] = useState('');
    const [tempId, setTempId] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSaving(true);
      try {
        await initiateOnboarding({ employeeId: empId, templateId: tempId });
        setIsInitiating(false);
        setActiveTab('active');
        fetchData();
      } catch (e) { console.error(e); } finally { setIsSaving(false); }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Employee</Label>
            <select required value={empId} onChange={e => setEmpId(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <option value="">Select Employee...</option>
              {employees.filter(e => e.status !== 'ONBOARDING').map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Template</Label>
            <select required value={tempId} onChange={e => setTempId(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <option value="">Select Template...</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
          <Button type="button" variant="outline" onClick={() => setIsInitiating(false)}>Cancel</Button>
          <Button type="submit" disabled={isSaving}>Start Onboarding</Button>
        </div>
      </form>
    );
  }

  function CreateTemplateForm() {
    const [name, setName] = useState('');
    const [activities, setActivities] = useState<any[]>([{ title: '', description: '', isMandatory: true }]);
    const [isSaving, setIsSaving] = useState(false);

    const addActivity = () => setActivities([...activities, { title: '', description: '', isMandatory: true }]);
    const removeActivity = (index: number) => {
      if (activities.length > 1) {
        setActivities(activities.filter((_, i) => i !== index));
      }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSaving(true);
      try {
        await createOnboardingTemplate({ name, activities });
        setIsCreatingTemplate(false);
        fetchData();
      } catch (e) { console.error(e); } finally { setIsSaving(false); }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label>Template Name</Label>
          <Input required value={name} onChange={e => setName(e.target.value)} placeholder="Engineering Onboarding" />
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Activities / Tasks</Label>
          </div>
          <div className="space-y-3">
            {activities.map((act, i) => (
              <div key={i} className="flex flex-col sm:flex-row gap-3 sm:items-start p-4 sm:p-0 border sm:border-0 rounded-lg bg-muted/20 sm:bg-transparent">
                <div className="flex-1 space-y-2">
                  <Input required placeholder="Task Title (e.g., IT Asset Allocation)" value={act.title} onChange={e => {
                    const newActs = [...activities];
                    newActs[i].title = e.target.value;
                    setActivities(newActs);
                  }} />
                  <Input placeholder="Description (Optional)" value={act.description} onChange={e => {
                    const newActs = [...activities];
                    newActs[i].description = e.target.value;
                    setActivities(newActs);
                  }} />
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon" 
                  className="w-full sm:w-10 sm:h-10 text-destructive border-destructive/20 hover:bg-destructive/10 shrink-0"
                  onClick={() => removeActivity(i)}
                  disabled={activities.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sm:hidden ml-2">Remove Task</span>
                </Button>
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addActivity} className="w-full sm:w-auto"><Plus className="h-4 w-4 mr-2" /> Add Task</Button>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
          <Button type="button" variant="outline" onClick={() => setIsCreatingTemplate(false)}>Cancel</Button>
          <Button type="submit" disabled={isSaving}>Save Template</Button>
        </div>
      </form>
    );
  }
}
