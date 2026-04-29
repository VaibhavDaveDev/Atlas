'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { getPayrollRuns, createPayrollRun } from '@/lib/hr';
import { Loader2, Plus, Receipt, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function PayrollRunsPage() {
  const [runs, setRuns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await getPayrollRuns();
      if (res.success) setRuns(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const CreateRunForm = () => {
    const [name, setName] = useState('');
    const [periodStart, setPeriodStart] = useState('');
    const [periodEnd, setPeriodEnd] = useState('');
    const [paymentDate, setPaymentDate] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSaving(true);
      try {
        await createPayrollRun({ name, periodStart, periodEnd, paymentDate });
        setIsCreating(false);
        fetchData();
      } catch (e) {
        console.error(e);
      } finally {
        setIsSaving(false);
      }
    };

    return (
      <div className="rounded-xl border border-border bg-card p-5 mb-6 animate-fade-in">
        <h3 className="font-semibold mb-4">Generate New Payroll Run</h3>
        <p className="text-sm text-muted-foreground mb-4">
          This will generate draft payslips for all active employees based on their base salary. You can edit them before processing.
        </p>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 md:grid-cols-5 items-end">
          <div className="space-y-2 col-span-1">
            <Label>Run Name</Label>
            <Input required value={name} onChange={e => setName(e.target.value)} placeholder="April 2026 Payroll" />
          </div>
          <div className="space-y-2 col-span-1">
            <Label>Period Start</Label>
            <Input required type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} />
          </div>
          <div className="space-y-2 col-span-1">
            <Label>Period End</Label>
            <Input required type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} />
          </div>
          <div className="space-y-2 col-span-1">
            <Label>Payment Date</Label>
            <Input required type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
          </div>
          <div className="col-span-1 flex justify-end">
            <Button type="button" variant="outline" className="mr-2" onClick={() => setIsCreating(false)}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>{isSaving ? 'Generating...' : 'Generate'}</Button>
          </div>
        </form>
      </div>
    );
  };

  return (
    <AppShell>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Payroll Processing</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">Manage salary calculation and payslips.</p>
          </div>
          <Button onClick={() => setIsCreating(!isCreating)}><Plus className="mr-2 h-4 w-4" /> New Payroll Run</Button>
        </div>

        {isCreating && <CreateRunForm />}

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : runs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Receipt className="h-10 w-10 text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold text-lg">No Payroll Runs</h3>
              <p className="text-muted-foreground text-sm">Generate your first payroll run to calculate employee salaries.</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-medium">Run Name</th>
                  <th className="px-6 py-4 font-medium">Period</th>
                  <th className="px-6 py-4 font-medium">Employees</th>
                  <th className="px-6 py-4 font-medium">Total Net</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {runs.map(run => (
                  <tr key={run.id} className="hover:bg-muted/30">
                    <td className="px-6 py-4">
                      <p className="font-medium">{run.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{run.runNumber}</p>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {new Date(run.periodStart).toLocaleDateString()} - {new Date(run.periodEnd).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">{run.totalEmployees}</td>
                    <td className="px-6 py-4 font-mono font-medium">${Number(run.totalNet).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={run.status === 'PROCESSED' ? 'border-emerald-500/50 text-emerald-600' : 'border-amber-500/50 text-amber-600'}>
                        {run.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/dashboard/hr/payroll/${run.id}`}>
                        <Button size="sm" variant="ghost" className="text-primary hover:bg-primary/10 hover:text-primary">
                          View Payslips <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                    </td>
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
