'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserMinus, Loader2, CheckCircle2, AlertCircle, FileText, CheckSquare, Clock } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FormContainer } from '@/components/common/FormContainer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  getEmployees, 
  getSeparations, 
  createSeparation, 
  approveSeparation,
  getOffboardingTemplates,
  initiateOffboarding,
  getOffboardingTasks,
  updateOffboardingTask
} from '@/lib/hr';
import Link from 'next/link';
import { format } from 'date-fns';

export default function SeparationsPage() {
  const [separations, setSeparations] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Single state for active modal/form to prevent desktop leakage
  const [activeModal, setActiveModal] = useState<'CREATE' | 'APPROVE' | 'TASKS' | null>(null);
  const [selectedSeparation, setSelectedSeparation] = useState<any | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sepRes, empRes, tplRes] = await Promise.all([
        getSeparations(),
        getEmployees(),
        getOffboardingTemplates()
      ]);
      setSeparations(Array.isArray(sepRes) ? sepRes : sepRes.data || []);
      setEmployees(Array.isArray(empRes) ? empRes : empRes.data || []);
      setTemplates(Array.isArray(tplRes) ? tplRes : tplRes.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveWithTemplate = async (templateId: string) => {
    if (!selectedSeparation) return;
    
    try {
      // 1. Approve Separation (Updates Employee Master Status)
      await approveSeparation(selectedSeparation.id);
      
      // 2. Assign Offboarding Tasks based on Template
      if (templateId) {
        await initiateOffboarding({
          employeeId: selectedSeparation.employeeId,
          templateId: templateId
        });
      }
      
      setActiveModal(null);
      setSelectedSeparation(null);
      loadData();
    } catch (error) {
      console.error('Failed to approve separation:', error);
    }
  };

  return (
    <AppShell>
      <div className="p-6 max-w-6xl mx-auto space-y-6 text-[#111111] dark:text-[#f4f4f5]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Employee Separations & Offboarding</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">Manage resignations, terminations, approvals, and offboarding checklists.</p>
          </div>
          <div className="shrink-0">
            <Button 
              className="bg-red-600 hover:bg-red-700 text-white shadow-sm" 
              onClick={() => setActiveModal(activeModal === 'CREATE' ? null : 'CREATE')}
            >
              <UserMinus className="mr-2 h-4 w-4" /> 
              Initiate Separation
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-card/50 backdrop-blur-sm border-amber-500/20 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Pending Approvals</CardTitle>
              <AlertCircle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-amber-600 dark:text-amber-500">
                {separations.filter(s => s.status === 'PENDING_APPROVAL').length}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur-sm border-blue-500/20 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Active Offboarding</CardTitle>
              <Loader2 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-blue-600 dark:text-blue-500">
                {separations.filter(s => s.status === 'APPROVED').length}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur-sm border-emerald-500/20 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-emerald-600 dark:text-emerald-500">
                {separations.filter(s => s.status === 'COMPLETED').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dynamic Form Area */}
        <div className="animate-in slide-in-from-top duration-300">
          <FormContainer 
            title="Initiate Separation Request" 
            isOpen={activeModal === 'CREATE'} 
            setIsOpen={(val) => setActiveModal(val ? 'CREATE' : null)}
          >
            <CreateSeparationForm 
              employees={employees} 
              onSuccess={() => { setActiveModal(null); loadData(); }} 
              onCancel={() => setActiveModal(null)} 
            />
          </FormContainer>

          <FormContainer 
            title="Approve & Initiate Offboarding" 
            isOpen={activeModal === 'APPROVE'} 
            setIsOpen={(val) => setActiveModal(val ? 'APPROVE' : null)}
          >
            <ApprovalForm 
              separation={selectedSeparation} 
              templates={templates} 
              onSubmit={handleApproveWithTemplate} 
              onCancel={() => { setActiveModal(null); setSelectedSeparation(null); }} 
            />
          </FormContainer>

          <FormContainer 
            title="Offboarding Checklist Tasks" 
            isOpen={activeModal === 'TASKS'} 
            setIsOpen={(val) => setActiveModal(val ? 'TASKS' : null)}
          >
            <ManageTasksForm employeeId={selectedEmployeeId} />
          </FormContainer>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <div className="overflow-x-auto pb-2 scrollbar-none">
            <TabsList className="flex w-max sm:grid sm:w-full sm:grid-cols-4 max-w-2xl bg-muted/50 p-1 rounded-lg min-w-full sm:min-w-0">
              <TabsTrigger value="all" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm text-[10px] sm:text-xs font-bold uppercase tracking-wider px-3 sm:px-0">All Records</TabsTrigger>
              <TabsTrigger value="pending" className="rounded-md data-[state=active]:bg-amber-100 dark:data-[state=active]:bg-amber-950/50 data-[state=active]:text-amber-700 dark:data-[state=active]:text-amber-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider px-3 sm:px-0">Queue ({separations.filter(s => s.status === 'PENDING_APPROVAL').length})</TabsTrigger>
              <TabsTrigger value="active" className="rounded-md data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-950/50 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider px-3 sm:px-0">In Progress</TabsTrigger>
              <TabsTrigger value="completed" className="rounded-md data-[state=active]:bg-emerald-100 dark:data-[state=active]:bg-emerald-950/50 data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider px-3 sm:px-0">Completed</TabsTrigger>
            </TabsList>
          </div>

          {['all', 'pending', 'active', 'completed'].map((tabValue) => (
            <TabsContent key={tabValue} value={tabValue} className="mt-4">
              <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  {isLoading ? (
                    <div className="flex h-40 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground/50" /></div>
                  ) : (
                    <Table>
                      <TableHeader className="bg-muted/30 text-[10px] uppercase tracking-widest text-muted-foreground font-black">
                        <TableRow>
                          <TableHead className="px-6 py-4">Employee</TableHead>
                          <TableHead className="px-6 py-4">Type</TableHead>
                          <TableHead className="px-6 py-4">Dates</TableHead>
                          <TableHead className="px-6 py-4 text-right">Workflow Status & Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-border/50">
                        {separations
                          .filter(s => 
                            tabValue === 'all' ? true :
                            tabValue === 'pending' ? s.status === 'PENDING_APPROVAL' :
                            tabValue === 'active' ? s.status === 'APPROVED' :
                            s.status === 'COMPLETED'
                          )
                          .map((s) => (
                          <TableRow key={s.id} className="hover:bg-muted/10 transition-colors">
                            <TableCell className="px-6 py-4">
                              <Link href={`/dashboard/hr/employees/${s.employeeId}`} className="font-bold hover:underline text-[#111111] dark:text-white">
                                {s.employee?.fullName}
                              </Link>
                              <div className="text-[10px] text-muted-foreground font-medium mt-0.5">{s.employee?.employeeNumber}</div>
                            </TableCell>
                            <TableCell className="px-6 py-4">
                              <Badge variant="outline" className={
                                s.separationType === 'TERMINATION' ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-800' :
                                'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-800'
                              }>
                                {s.separationType}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-6 py-4 text-xs">
                              <div className="space-y-1">
                                {s.resignationDate && (
                                  <div className="flex justify-between gap-4">
                                    <span className="text-muted-foreground">Resigned:</span>
                                    <span className="font-medium">{format(new Date(s.resignationDate), 'dd MMM yyyy')}</span>
                                  </div>
                                )}
                                <div className="flex justify-between gap-4">
                                  <span className="text-muted-foreground font-bold">LWD:</span>
                                  <span className="font-black text-red-600 dark:text-red-400">{format(new Date(s.lastWorkingDate), 'dd MMM yyyy')}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="px-6 py-4 text-right">
                              {s.status === 'PENDING_APPROVAL' ? (
                                <div className="flex flex-col items-end gap-2">
                                  <span className="text-[9px] font-black text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900 uppercase tracking-widest flex items-center">
                                    <Clock className="w-3 h-3 mr-1" /> Awaiting Approval
                                  </span>
                                  <Button 
                                    size="sm" 
                                    className="h-8 px-4 text-xs font-bold bg-[#111111] dark:bg-[#f4f4f5] dark:text-[#111111] shadow-sm transition-all"
                                    onClick={() => {
                                      setSelectedSeparation(s);
                                      setActiveModal('APPROVE');
                                    }}
                                  >
                                    <CheckCircle2 className="mr-1.5 h-4 w-4" />
                                    Review & Process
                                  </Button>
                                </div>
                              ) : s.status === 'APPROVED' ? (
                                <div className="flex flex-col items-end gap-2">
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900 text-[10px] font-black flex items-center">
                                    <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Active Offboarding
                                  </Badge>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-8 px-4 text-xs font-bold border-blue-200 hover:bg-blue-50 text-blue-700 dark:border-blue-900 dark:text-blue-400 dark:hover:bg-blue-950/50"
                                    onClick={() => {
                                      setSelectedEmployeeId(s.employeeId);
                                      setActiveModal('TASKS');
                                    }}
                                  >
                                    <CheckSquare className="mr-1.5 h-4 w-4" />
                                    Checklist Tasks
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex flex-col items-end gap-1">
                                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900 text-[10px] font-black">
                                    <CheckCircle2 className="w-3 h-3 mr-1 inline" /> Completed
                                  </Badge>
                                  <span className="text-[9px] text-muted-foreground italic font-medium">All tasks finished</span>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                        {separations.filter(s => 
                          tabValue === 'all' ? true :
                          tabValue === 'pending' ? s.status === 'PENDING_APPROVAL' :
                          tabValue === 'active' ? s.status === 'APPROVED' :
                          s.status === 'COMPLETED'
                        ).length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                              <div className="flex flex-col items-center gap-2">
                                <FileText className="h-8 w-8 text-muted-foreground/30" />
                                <p className="text-sm font-medium">No records found in this queue.</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AppShell>
  );
}

// ----------------- SUB-COMPONENTS -----------------

function CreateSeparationForm({ employees, onSuccess, onCancel }: { employees: any[], onSuccess: () => void, onCancel: () => void }) {
  const [formData, setFormData] = useState({ employeeId: '', separationType: 'RESIGNATION', resignationDate: '', lastWorkingDate: '', reason: '' });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await createSeparation(formData);
      onSuccess();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Employee</Label>
          <select required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})}>
            <option value="">Choose an employee...</option>
            {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.fullName}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Separation Type</Label>
          <select required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={formData.separationType} onChange={e => setFormData({...formData, separationType: e.target.value})}>
            <option value="RESIGNATION">Resignation</option>
            <option value="TERMINATION">Termination</option>
            <option value="RETIREMENT">Retirement</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {formData.separationType === 'RESIGNATION' && (
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Resignation Date</Label>
            <Input type="date" value={formData.resignationDate} onChange={e => setFormData({...formData, resignationDate: e.target.value})} required />
          </div>
        )}
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Last Working Day (LWD)</Label>
          <Input required type="date" value={formData.lastWorkingDate} onChange={e => setFormData({...formData, lastWorkingDate: e.target.value})} />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Reason / Remarks</Label>
        <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Optional details..." value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} />
      </div>
      <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white" disabled={isSaving}>{isSaving ? 'Submitting...' : 'Submit Request'}</Button>
      </div>
    </form>
  );
}

function ApprovalForm({ separation, templates, onSubmit, onCancel }: { separation: any, templates: any[], onSubmit: (templateId: string) => void, onCancel: () => void }) {
  const [templateId, setTemplateId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    await onSubmit(templateId);
    setIsProcessing(false);
  };

  if (!separation) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg border border-amber-200 dark:border-amber-900/50 mb-4">
        <h3 className="font-bold text-amber-800 dark:text-amber-500 mb-2">Confirm Action</h3>
        <p className="text-sm text-amber-700 dark:text-amber-400">
          Approving this separation will immediately update the Employee Master, marking them as <strong>{separation.separationType}</strong> with a Last Working Day of <strong>{format(new Date(separation.lastWorkingDate), 'dd MMM yyyy')}</strong>.
        </p>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-bold">Assign Offboarding Checklist Template (Optional)</Label>
        <p className="text-xs text-muted-foreground">Select a template to automatically generate IT, Finance, and HR exit tasks.</p>
        <select 
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={templateId}
          onChange={e => setTemplateId(e.target.value)}
        >
          <option value="">Do not assign tasks automatically</option>
          {templates.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" className="bg-[#111111] dark:bg-[#f4f4f5] dark:text-[#111111]" disabled={isProcessing}>
          {isProcessing ? 'Processing...' : 'Confirm & Approve'}
        </Button>
      </div>
    </form>
  );
}

function ManageTasksForm({ employeeId }: { employeeId: string | null }) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (employeeId) loadTasks();
  }, [employeeId]);

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const res = await getOffboardingTasks(employeeId!);
      setTasks(Array.isArray(res) ? res : res.data || []);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
      
      // Optimistic update
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      
      await updateOffboardingTask(taskId, newStatus);
    } catch (error) {
      console.error('Failed to update task:', error);
      loadTasks(); // Revert on failure
    }
  };

  if (!employeeId) return null;

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="flex h-32 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : tasks.length === 0 ? (
        <div className="p-8 text-center bg-muted/20 rounded-lg border border-border border-dashed">
          <CheckSquare className="h-8 w-8 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-sm font-medium">No offboarding tasks assigned.</p>
          <p className="text-xs text-muted-foreground mt-1">Tasks are usually assigned when approving a separation using an Offboarding Template.</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
          {tasks.map(task => (
            <div key={task.id} className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${task.status === 'COMPLETED' ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900' : 'bg-card border-border'}`}>
              <div className="mt-0.5">
                <input 
                  type="checkbox" 
                  checked={task.status === 'COMPLETED'}
                  onChange={() => handleToggleTask(task.id, task.status)}
                  className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-600"
                />
              </div>
              <div className="flex-1">
                <p className={`text-sm font-bold ${task.status === 'COMPLETED' ? 'text-muted-foreground line-through' : ''}`}>
                  {task.title}
                </p>
                {task.description && (
                  <p className={`text-xs mt-1 ${task.status === 'COMPLETED' ? 'text-muted-foreground/60 line-through' : 'text-muted-foreground'}`}>
                    {task.description}
                  </p>
                )}
                {task.isMandatory && task.status !== 'COMPLETED' && (
                  <Badge variant="outline" className="mt-2 text-[9px] uppercase tracking-widest bg-red-50 text-red-600 border-red-200 dark:bg-red-950/30">Mandatory</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
