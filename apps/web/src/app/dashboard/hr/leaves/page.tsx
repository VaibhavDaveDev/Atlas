'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { getLeaveApplications, getLeaveTypes, createLeaveType, createLeaveApplication, updateLeaveStatus, getEmployees } from '@/lib/hr';
import { Loader2, Plus, CalendarOff, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

export default function LeaveManagementPage() {
  const [activeTab, setActiveTab] = useState<'applications' | 'types'>('applications');
  
  // Data State
  const [applications, setApplications] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Forms
  const [isApplying, setIsApplying] = useState(false);
  const [isCreatingType, setIsCreatingType] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'applications') {
        const [appRes, empRes, typeRes] = await Promise.all([getLeaveApplications(), getEmployees(), getLeaveTypes()]);
        if (appRes.success) setApplications(appRes.data);
        if (empRes.success) setEmployees(empRes.data);
        if (typeRes.success) setLeaveTypes(typeRes.data);
      } else {
        const typeRes = await getLeaveTypes();
        if (typeRes.success) setLeaveTypes(typeRes.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await updateLeaveStatus(id, 'APPROVED');
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await updateLeaveStatus(id, 'REJECTED');
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const SubmitLeaveApplicationForm = () => {
    const [employeeId, setEmployeeId] = useState('');
    const [leaveTypeId, setLeaveTypeId] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [reason, setReason] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSaving(true);
      try {
        await createLeaveApplication({ employeeId, leaveTypeId, fromDate, toDate, reason });
        setIsApplying(false);
        fetchData();
      } catch (e) {
        console.error(e);
      } finally {
        setIsSaving(false);
      }
    };

    return (
      <div className="rounded-xl border border-border bg-card p-5 mb-6 animate-fade-in">
        <h3 className="font-semibold mb-4">New Leave Application</h3>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 md:grid-cols-5 items-end">
          <div className="space-y-2 col-span-1">
            <Label>Employee</Label>
            <select required value={employeeId} onChange={e => setEmployeeId(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
              <option value="" className="bg-background">Select...</option>
              {employees.map(e => <option key={e.id} value={e.id} className="bg-background">{e.fullName}</option>)}
            </select>
          </div>
          <div className="space-y-2 col-span-1">
            <Label>Leave Type</Label>
            <select required value={leaveTypeId} onChange={e => setLeaveTypeId(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
              <option value="" className="bg-background">Select...</option>
              {leaveTypes.map(t => <option key={t.id} value={t.id} className="bg-background">{t.name}</option>)}
            </select>
          </div>
          <div className="space-y-2 col-span-1">
            <Label>From</Label>
            <Input required type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
          </div>
          <div className="space-y-2 col-span-1">
            <Label>To</Label>
            <Input required type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
          </div>
          <div className="space-y-2 col-span-1">
            <Label>Reason</Label>
            <Input required value={reason} onChange={e => setReason(e.target.value)} placeholder="Sick" />
          </div>
          <div className="col-span-5 flex justify-end mt-2">
            <Button type="button" variant="outline" className="mr-2" onClick={() => setIsApplying(false)}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>{isSaving ? 'Submitting...' : 'Apply Leave'}</Button>
          </div>
        </form>
      </div>
    );
  };

  const SubmitLeaveTypeForm = () => {
    const [name, setName] = useState('');
    const [maxDaysAllowed, setMaxDaysAllowed] = useState('10');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSaving(true);
      try {
        await createLeaveType({ name, maxDaysAllowed, isPaid: true, requiresApproval: true });
        setIsCreatingType(false);
        fetchData();
      } catch (e) {
        console.error(e);
      } finally {
        setIsSaving(false);
      }
    };

    return (
      <div className="rounded-xl border border-border bg-card p-5 mb-6 animate-fade-in">
        <h3 className="font-semibold mb-4">Create Leave Type</h3>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-end gap-4">
          <div className="space-y-2 flex-1">
            <Label>Leave Name</Label>
            <Input required value={name} onChange={e => setName(e.target.value)} placeholder="Annual Leave" />
          </div>
          <div className="space-y-2 flex-1">
            <Label>Max Days Allowed (Annual)</Label>
            <Input required type="number" min="0" value={maxDaysAllowed} onChange={e => setMaxDaysAllowed(e.target.value)} />
          </div>
          <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Type'}</Button>
        </form>
      </div>
    );
  };

  return (
    <AppShell>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Leave Management</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">Manage employee time off and leave policies.</p>
          </div>
          <div className="flex bg-muted/50 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('applications')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'applications' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Applications
            </button>
            <button
              onClick={() => setActiveTab('types')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'types' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Leave Types
            </button>
          </div>
          {activeTab === 'applications' ? (
            <Button onClick={() => setIsApplying(!isApplying)}><Plus className="mr-2 h-4 w-4" /> Apply for Leave</Button>
          ) : (
            <Button onClick={() => setIsCreatingType(!isCreatingType)}><Plus className="mr-2 h-4 w-4" /> New Policy</Button>
          )}
        </div>

        {activeTab === 'applications' && isApplying && <SubmitLeaveApplicationForm />}
        {activeTab === 'types' && isCreatingType && <SubmitLeaveTypeForm />}

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : activeTab === 'applications' ? (
            applications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CalendarOff className="h-10 w-10 text-muted-foreground/50 mb-4" />
                <h3 className="font-semibold text-lg">No Leave Applications</h3>
                <p className="text-muted-foreground text-sm">Employees haven't requested any time off yet.</p>
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4 font-medium">Employee</th>
                    <th className="px-6 py-4 font-medium">Leave Type</th>
                    <th className="px-6 py-4 font-medium">Dates</th>
                    <th className="px-6 py-4 font-medium">Duration</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {applications.map(app => (
                    <tr key={app.id} className="hover:bg-muted/30">
                      <td className="px-6 py-4">
                        <p className="font-medium">{app.employee?.fullName}</p>
                        <p className="text-xs text-muted-foreground">{app.employee?.employeeNumber}</p>
                      </td>
                      <td className="px-6 py-4">{app.leaveType?.name}</td>
                      <td className="px-6 py-4 text-xs">
                        {new Date(app.fromDate).toLocaleDateString()} - {new Date(app.toDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">{app.totalDays} Days</td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={
                          app.status === 'APPROVED' ? 'border-emerald-500/50 text-emerald-600' :
                          app.status === 'REJECTED' ? 'border-destructive/50 text-destructive' :
                          'border-amber-500/50 text-amber-600'
                        }>{app.status}</Badge>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {app.status === 'PENDING' && (
                          <>
                            <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-600/20 hover:bg-emerald-500/10" onClick={() => handleApprove(app.id)}><CheckCircle2 className="h-4 w-4 mr-1" /> Approve</Button>
                            <Button size="sm" variant="outline" className="text-destructive border-destructive/20 hover:bg-destructive/10" onClick={() => handleReject(app.id)}><XCircle className="h-4 w-4 mr-1" /> Reject</Button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-medium">Leave Type</th>
                  <th className="px-6 py-4 font-medium">Max Days Allowed</th>
                  <th className="px-6 py-4 font-medium">Is Paid</th>
                  <th className="px-6 py-4 font-medium">Requires Approval</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {leaveTypes.map(type => (
                  <tr key={type.id} className="hover:bg-muted/30">
                    <td className="px-6 py-4 font-medium">{type.name}</td>
                    <td className="px-6 py-4">{type.maxDaysAllowed} Days / Year</td>
                    <td className="px-6 py-4">{type.isPaid ? 'Yes' : 'No'}</td>
                    <td className="px-6 py-4">{type.requiresApproval ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppShell>
  );
}
