'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { tokenStorage } from '@/lib/auth';
import { FormContainer } from '@/components/common/FormContainer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getEmployees } from '@/lib/hr';

export default function PerformanceDashboard() {
  const [activeTab, setActiveTab] = useState('cycles');
  const [cycles, setCycles] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [appraisals, setAppraisals] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [isCreatingCycle, setIsCreatingCycle] = useState(false);
  const [isCreatingGoal, setIsCreatingGoal] = useState(false);
  const [isCreatingAppraisal, setIsCreatingAppraisal] = useState(false);

  useEffect(() => {
    // Reset form visibility when switching tabs
    setIsCreatingCycle(false);
    setIsCreatingGoal(false);
    setIsCreatingAppraisal(false);

    loadData();
    loadEmployees();
  }, [activeTab]);

  const loadEmployees = async () => {
    try {
      const res = await getEmployees();
      if (res.success) setEmployees(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const headers = {
        Authorization: `Bearer ${tokenStorage.getAccessToken()}`,
      };

      if (activeTab === 'cycles') {
        const res = await fetch(`${baseUrl}/api/v1/hr/performance/cycles`, { headers });
        const json = await res.json();
        const data = json.data || json;
        setCycles(Array.isArray(data) ? data : []);
      } else if (activeTab === 'goals') {
        const res = await fetch(`${baseUrl}/api/v1/hr/performance/goals`, { headers });
        const json = await res.json();
        const data = json.data || json;
        setGoals(Array.isArray(data) ? data : []);
      } else if (activeTab === 'appraisals') {
        const res = await fetch(`${baseUrl}/api/v1/hr/performance/appraisals`, { headers });
        const json = await res.json();
        const data = json.data || json;
        setAppraisals(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to load performance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClick = () => {
    if (activeTab === 'cycles') setIsCreatingCycle(true);
    else if (activeTab === 'goals') setIsCreatingGoal(true);
    else setIsCreatingAppraisal(true);
  };

  return (
    <AppShell>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Performance Management</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">Track employee goals, appraisal cycles, and performance reviews.</p>
          </div>
          <div className="flex bg-muted/50 p-1 rounded-lg overflow-x-auto">
            {(['cycles', 'goals', 'appraisals'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors capitalize whitespace-nowrap ${activeTab === tab ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {tab === 'cycles' ? 'Appraisal Cycles' : tab === 'goals' ? 'Employee Goals' : 'Appraisals'}
              </button>
            ))}
          </div>
          <div className="shrink-0">
            <Button className="bg-[#111111] dark:bg-[#f4f4f5] dark:text-[#111111]" onClick={handleCreateClick}>
              <Plus className="mr-2 h-4 w-4" /> 
              {activeTab === 'cycles' ? 'New Cycle' : activeTab === 'goals' ? 'Assign Goal' : 'Initiate Appraisal'}
            </Button>
          </div>
        </div>

        {/* Form Containers */}
        {activeTab === 'cycles' && (
          <FormContainer title="Create Appraisal Cycle" isOpen={isCreatingCycle} setIsOpen={setIsCreatingCycle}>
            <CreateCycleForm />
          </FormContainer>
        )}
        {activeTab === 'goals' && (
          <FormContainer title="Assign Employee Goal" isOpen={isCreatingGoal} setIsOpen={setIsCreatingGoal}>
            <CreateGoalForm />
          </FormContainer>
        )}
        {activeTab === 'appraisals' && (
          <FormContainer title="Initiate Appraisal" isOpen={isCreatingAppraisal} setIsOpen={setIsCreatingAppraisal}>
            <CreateAppraisalForm />
          </FormContainer>
        )}

        {/* Dynamic Content rendered as Data Tables */}
        <div className="rounded-xl border border-border bg-card overflow-x-auto">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : activeTab === 'cycles' ? (
            <Table>
              <TableHeader className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <TableRow>
                  <TableHead className="px-6 py-4 font-medium">Cycle Name</TableHead>
                  <TableHead className="px-6 py-4 font-medium">Start Date</TableHead>
                  <TableHead className="px-6 py-4 font-medium">End Date</TableHead>
                  <TableHead className="px-6 py-4 font-medium">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border">
                {cycles.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No appraisal cycles found.</TableCell></TableRow>
                ) : cycles.map((c) => (
                  <TableRow key={c.id} className="hover:bg-muted/30">
                    <TableCell className="px-6 py-4 font-medium">{c.name}</TableCell>
                    <TableCell className="px-6 py-4 text-xs">{new Date(c.startDate).toLocaleDateString()}</TableCell>
                    <TableCell className="px-6 py-4 text-xs">{new Date(c.endDate).toLocaleDateString()}</TableCell>
                    <TableCell className="px-6 py-4">
                      <Badge variant="outline" className={c.isActive ? "border-emerald-500/50 text-emerald-600" : ""}>
                        {c.isActive ? 'Active' : 'Closed'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : activeTab === 'goals' ? (
            <Table>
              <TableHeader className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <TableRow>
                  <TableHead className="px-6 py-4 font-medium">Employee</TableHead>
                  <TableHead className="px-6 py-4 font-medium">Goal Title</TableHead>
                  <TableHead className="px-6 py-4 font-medium">Cycle</TableHead>
                  <TableHead className="px-6 py-4 font-medium">Progress</TableHead>
                  <TableHead className="px-6 py-4 font-medium">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border">
                {goals.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No employee goals assigned.</TableCell></TableRow>
                ) : goals.map((g) => (
                  <TableRow key={g.id} className="hover:bg-muted/30">
                    <TableCell className="px-6 py-4 font-medium">{g.employee?.fullName}</TableCell>
                    <TableCell className="px-6 py-4">{g.title}</TableCell>
                    <TableCell className="px-6 py-4 text-xs text-muted-foreground">{g.appraisalCycle?.name}</TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${g.completionPercentage}%` }}></div>
                        </div>
                        <span className="text-xs font-medium">{g.completionPercentage}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <Badge variant="outline">{g.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Table>
              <TableHeader className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <TableRow>
                  <TableHead className="px-6 py-4 font-medium">Employee</TableHead>
                  <TableHead className="px-6 py-4 font-medium">Cycle</TableHead>
                  <TableHead className="px-6 py-4 font-medium">Self Score</TableHead>
                  <TableHead className="px-6 py-4 font-medium">Final Score</TableHead>
                  <TableHead className="px-6 py-4 font-medium">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border">
                {appraisals.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No appraisals initiated.</TableCell></TableRow>
                ) : appraisals.map((a) => (
                  <TableRow key={a.id} className="hover:bg-muted/30">
                    <TableCell className="px-6 py-4 font-medium">{a.employee?.fullName}</TableCell>
                    <TableCell className="px-6 py-4 text-xs text-muted-foreground">{a.appraisalCycle?.name}</TableCell>
                    <TableCell className="px-6 py-4">{a.selfScore || '-'}</TableCell>
                    <TableCell className="px-6 py-4 font-bold text-primary">{a.finalScore || '-'}</TableCell>
                    <TableCell className="px-6 py-4">
                      <Badge variant="outline">{a.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </AppShell>
  );

  function CreateCycleForm() {
    const [formData, setFormData] = useState({ name: '', startDate: '', endDate: '' });
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSaving(true);
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        await fetch(`${baseUrl}/api/v1/hr/performance/cycles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenStorage.getAccessToken()}` },
          body: JSON.stringify(formData),
        });
        setIsCreatingCycle(false);
        loadData();
      } catch (error) {
        console.error(error);
      } finally {
        setIsSaving(false);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label>Cycle Name</Label>
          <Input required placeholder="Annual Review 2026" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label>Start Date</Label><Input required type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} /></div>
          <div className="space-y-2"><Label>End Date</Label><Input required type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} /></div>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
          <Button type="button" variant="outline" onClick={() => setIsCreatingCycle(false)}>Cancel</Button>
          <Button type="submit" disabled={isSaving}>{isSaving ? 'Creating...' : 'Create Cycle'}</Button>
        </div>
      </form>
    );
  }

  function CreateGoalForm() {
    const [formData, setFormData] = useState({ employeeId: '', appraisalCycleId: '', title: '', description: '', weightage: 0 });
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSaving(true);
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        await fetch(`${baseUrl}/api/v1/hr/performance/goals`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenStorage.getAccessToken()}` },
          body: JSON.stringify(formData),
        });
        setIsCreatingGoal(false);
        loadData();
      } catch (error) { console.error(error); } finally { setIsSaving(false); }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label>Employee</Label>
            <select required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})}>
              <option value="">Select Employee</option>
              {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.fullName}</option>)}
            </select>
          </div>
          <div className="space-y-2"><Label>Cycle</Label>
            <select required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={formData.appraisalCycleId} onChange={e => setFormData({...formData, appraisalCycleId: e.target.value})}>
              <option value="">Select Cycle</option>
              {cycles.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div className="space-y-2"><Label>Goal Title</Label><Input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} /></div>
        <div className="space-y-2"><Label>Weightage (%)</Label><Input type="number" max="100" min="0" value={formData.weightage} onChange={e => setFormData({...formData, weightage: Number(e.target.value)})} /></div>
        <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
          <Button type="button" variant="outline" onClick={() => setIsCreatingGoal(false)}>Cancel</Button>
          <Button type="submit" disabled={isSaving}>{isSaving ? 'Assigning...' : 'Assign Goal'}</Button>
        </div>
      </form>
    );
  }

  function CreateAppraisalForm() {
    const [formData, setFormData] = useState({ employeeId: '', appraisalCycleId: '' });
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSaving(true);
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        await fetch(`${baseUrl}/api/v1/hr/performance/appraisals`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenStorage.getAccessToken()}` },
          body: JSON.stringify(formData),
        });
        setIsCreatingAppraisal(false);
        loadData();
      } catch (error) { console.error(error); } finally { setIsSaving(false); }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label>Employee</Label>
            <select required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})}>
              <option value="">Select Employee</option>
              {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.fullName}</option>)}
            </select>
          </div>
          <div className="space-y-2"><Label>Cycle</Label>
            <select required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={formData.appraisalCycleId} onChange={e => setFormData({...formData, appraisalCycleId: e.target.value})}>
              <option value="">Select Cycle</option>
              {cycles.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
          <Button type="button" variant="outline" onClick={() => setIsCreatingAppraisal(false)}>Cancel</Button>
          <Button type="submit" disabled={isSaving}>{isSaving ? 'Initiating...' : 'Initiate Appraisal'}</Button>
        </div>
      </form>
    );
  }
}
