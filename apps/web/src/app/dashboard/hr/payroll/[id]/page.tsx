'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { getPayrollRunById, addPayrollEarning, addPayrollDeduction } from '@/lib/hr';
import { Loader2, ArrowLeft, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function PayrollRunDetailPage() {
  const { id } = useParams();
  const [run, setRun] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals for editing payslips
  const [activeEntry, setActiveEntry] = useState<any>(null);
  const [editMode, setEditMode] = useState<'earning' | 'deduction' | null>(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await getPayrollRunById(id as string);
      if (res.success) setRun(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const EditPayslipForm = () => {
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [remarks, setRemarks] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSaving(true);
      try {
        if (editMode === 'earning') {
          await addPayrollEarning(activeEntry.id, { earningType: 'OTHER', name, amount, remarks });
        } else {
          await addPayrollDeduction(activeEntry.id, { deductionType: 'OTHER', name, amount, remarks });
        }
        setEditMode(null);
        setActiveEntry(null);
        fetchData();
      } catch (e) {
        console.error(e);
      } finally {
        setIsSaving(false);
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg animate-in zoom-in-95">
          <h2 className="text-lg font-semibold mb-1">
            Add {editMode === 'earning' ? 'Earning' : 'Deduction'}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            For {activeEntry.employee?.fullName}
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Description</Label>
              <Input required value={name} onChange={e => setName(e.target.value)} placeholder={editMode === 'earning' ? 'Performance Bonus' : 'Unpaid Leave'} />
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input required type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label>Remarks (Optional)</Label>
              <Input value={remarks} onChange={e => setRemarks(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button type="button" variant="outline" onClick={() => setEditMode(null)}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}</Button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex h-[calc(100vh-100px)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  if (!run) {
    return (
      <AppShell>
        <div className="p-6 text-center">Run not found</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {editMode && <EditPayslipForm />}
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/hr/payroll">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{run.name}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground font-mono">
              {run.runNumber} • {new Date(run.periodStart).toLocaleDateString()} - {new Date(run.periodEnd).toLocaleDateString()}
            </p>
          </div>
          <Badge variant="outline" className="ml-auto">{run.status}</Badge>
        </div>

        {/* Run Summary */}
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Employees</p>
            <p className="text-2xl font-bold">{run.totalEmployees}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total Gross</p>
            <p className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">${Number(run.totalGross).toFixed(2)}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total Deductions</p>
            <p className="text-2xl font-bold font-mono text-destructive">${Number(run.totalDeductions).toFixed(2)}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total Net Payout</p>
            <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">${Number(run.totalNet).toFixed(2)}</p>
          </div>
        </div>

        {/* Payslips Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="border-b border-border bg-muted/20 px-5 py-3.5">
            <h2 className="text-sm font-semibold">Employee Payslips</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-medium">Employee</th>
                  <th className="px-6 py-4 font-medium text-right">Base Salary</th>
                  <th className="px-6 py-4 font-medium text-right">Gross</th>
                  <th className="px-6 py-4 font-medium text-right">Deductions</th>
                  <th className="px-6 py-4 font-medium text-right">Net Payout</th>
                  <th className="px-6 py-4 font-medium text-center">Adjustments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {run.entries.map((entry: any) => (
                  <tr key={entry.id} className="hover:bg-muted/30">
                    <td className="px-6 py-4">
                      <p className="font-medium">{entry.employee?.fullName}</p>
                      <p className="text-xs text-muted-foreground font-mono">{entry.employee?.employeeNumber}</p>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-muted-foreground">
                      ${Number(entry.basicSalary).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-blue-600 dark:text-blue-400">
                      ${Number(entry.grossSalary).toFixed(2)}
                      {entry.earnings.length > 0 && (
                        <p className="text-[10px] text-muted-foreground mt-1">+{entry.earnings.length} item(s)</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-destructive">
                      ${Number(entry.totalDeductions).toFixed(2)}
                      {entry.deductions.length > 0 && (
                        <p className="text-[10px] text-muted-foreground mt-1">-{entry.deductions.length} item(s)</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      ${Number(entry.netSalary).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button 
                          size="icon" 
                          variant="outline" 
                          className="h-7 w-7 text-blue-600 border-blue-600/20 hover:bg-blue-600/10"
                          onClick={() => { setActiveEntry(entry); setEditMode('earning'); }}
                          title="Add Earning / Bonus"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="outline" 
                          className="h-7 w-7 text-destructive border-destructive/20 hover:bg-destructive/10"
                          onClick={() => { setActiveEntry(entry); setEditMode('deduction'); }}
                          title="Add Deduction / Penalty"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
