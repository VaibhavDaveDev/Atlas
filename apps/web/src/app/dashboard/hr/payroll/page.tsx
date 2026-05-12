'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { getPayrollRuns, createPayrollRun, getSalaryComponents, getSalaryStructures, getTaxSlabs, createSalaryComponent, createSalaryStructure } from '@/lib/hr';
import { Loader2, Plus, Receipt, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function PayrollRunsPage() {
  const [activeTab, setActiveTab] = useState<'runs' | 'components' | 'structures' | 'tax-slabs'>('runs');
  const [runs, setRuns] = useState<any[]>([]);
  const [components, setComponents] = useState<any[]>([]);
  const [structures, setStructures] = useState<any[]>([]);
  const [taxSlabs, setTaxSlabs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isCreatingRun, setIsCreatingRun] = useState(false);
  const [isCreatingComponent, setIsCreatingComponent] = useState(false);
  const [isCreatingStructure, setIsCreatingStructure] = useState(false);
  const [isCreatingTaxSlab, setIsCreatingTaxSlab] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'runs') {
        const res = await getPayrollRuns();
        if (res.success) setRuns(res.data);
      } else if (activeTab === 'components') {
        const res = await getSalaryComponents();
        if (res.success) setComponents(res.data);
      } else if (activeTab === 'structures') {
        const [structRes, compRes] = await Promise.all([getSalaryStructures(), getSalaryComponents()]);
        if (structRes.success) setStructures(structRes.data);
        if (compRes.success) setComponents(compRes.data);
      } else if (activeTab === 'tax-slabs') {
        const res = await getTaxSlabs();
        if (res.success) setTaxSlabs(res.data);
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
            <h1 className="text-xl font-bold tracking-tight">Payroll Processing</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">Manage salary calculation, structures, and payslips.</p>
          </div>
          <div className="flex bg-muted/50 p-1 rounded-lg">
            {(['runs', 'components', 'structures', 'tax-slabs'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${activeTab === tab ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {tab === 'tax-slabs' ? 'Tax Slabs' : tab}
              </button>
            ))}
          </div>
          {activeTab === 'runs' && <Button onClick={() => setIsCreatingRun(!isCreatingRun)}><Plus className="mr-2 h-4 w-4" /> New Run</Button>}
          {activeTab === 'components' && <Button onClick={() => setIsCreatingComponent(!isCreatingComponent)}><Plus className="mr-2 h-4 w-4" /> New Component</Button>}
          {activeTab === 'structures' && <Button onClick={() => setIsCreatingStructure(!isCreatingStructure)}><Plus className="mr-2 h-4 w-4" /> New Structure</Button>}
          {activeTab === 'tax-slabs' && <Button onClick={() => setIsCreatingTaxSlab(!isCreatingTaxSlab)}><Plus className="mr-2 h-4 w-4" /> New Tax Slab</Button>}
        </div>

        {activeTab === 'runs' && isCreatingRun && <CreateRunForm />}
        {activeTab === 'components' && isCreatingComponent && <CreateComponentForm />}
        {activeTab === 'structures' && isCreatingStructure && <CreateStructureForm />}
        {activeTab === 'tax-slabs' && isCreatingTaxSlab && <CreateTaxSlabForm />}

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : activeTab === 'runs' ? (
            <RunsTable />
          ) : activeTab === 'components' ? (
            <ComponentsTable />
          ) : activeTab === 'structures' ? (
            <StructuresTable />
          ) : (
            <TaxSlabsTable />
          )}
        </div>
      </div>
    </AppShell>
  );

  function RunsTable() {
    return (
      runs.length === 0 ? (
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
              <th className="px-6 py-4 font-medium text-center">Employees</th>
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
                <td className="px-6 py-4 text-center">{run.totalEmployees}</td>
                <td className="px-6 py-4 font-mono font-medium">${Number(run.totalNet).toFixed(2)}</td>
                <td className="px-6 py-4">
                  <Badge variant="outline" className={run.status === 'PROCESSED' ? 'border-emerald-500/50 text-emerald-600' : 'border-amber-500/50 text-amber-600'}>
                    {run.status}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-right">
                  <Link href={`/dashboard/hr/payroll/${run.id}`}>
                    <Button size="sm" variant="ghost" className="text-primary hover:bg-primary/10">
                      View Payslips <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )
    );
  }

  function ComponentsTable() {
    return (
      <table className="w-full text-sm text-left">
        <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-6 py-4 font-medium">Component</th>
            <th className="px-6 py-4 font-medium">Abbr</th>
            <th className="px-6 py-4 font-medium">Type</th>
            <th className="px-6 py-4 font-medium">Calculation</th>
            <th className="px-6 py-4 font-medium text-center">Taxable</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {components.map(comp => (
            <tr key={comp.id} className="hover:bg-muted/30">
              <td className="px-6 py-4 font-medium">{comp.name}</td>
              <td className="px-6 py-4 font-mono text-xs">{comp.abbr}</td>
              <td className="px-6 py-4">
                <Badge variant="secondary" className={comp.type === 'EARNING' ? 'bg-emerald-500/10 text-emerald-700' : 'bg-destructive/10 text-destructive'}>
                  {comp.type}
                </Badge>
              </td>
              <td className="px-6 py-4 text-xs">
                {comp.calculationType === 'FORMULA' ? <span className="font-mono text-primary">{comp.formula}</span> : `${comp.calculationType} (${comp.amount || 0})`}
              </td>
              <td className="px-6 py-4 text-center">{comp.isTaxable ? 'Yes' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  function CreateRunForm() {
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
        setIsCreatingRun(false);
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
          Draft payslips will be auto-calculated using the **Formula Engine**, based on employee attendance and assigned salary structures.
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
            <Button type="button" variant="outline" className="mr-2" onClick={() => setIsCreatingRun(false)}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>{isSaving ? 'Generating...' : 'Generate'}</Button>
          </div>
        </form>
      </div>
    );
  }

  function CreateComponentForm() {
    const [formData, setFormData] = useState({ name: '', abbr: '', type: 'EARNING', calculationType: 'FLAT', amount: '', formula: '', isTaxable: true, dependsOnDays: true });
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSaving(true);
      try {
        await createSalaryComponent(formData);
        setIsCreatingComponent(false);
        fetchData();
      } catch (e) { console.error(e); } finally { setIsSaving(false); }
    };

    return (
      <div className="rounded-xl border border-border bg-card p-5 mb-6 animate-fade-in">
        <h3 className="font-semibold mb-4">Create Salary Component</h3>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 items-end">
          <div className="space-y-1"><Label>Name</Label><Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Basic Salary" /></div>
          <div className="space-y-1"><Label>Abbr</Label><Input required value={formData.abbr} onChange={e => setFormData({...formData, abbr: e.target.value})} placeholder="BS" /></div>
          <div className="space-y-1"><Label>Type</Label>
            <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
              <option value="EARNING" className="bg-background">Earning</option>
              <option value="DEDUCTION" className="bg-background">Deduction</option>
            </select>
          </div>
          <div className="space-y-1"><Label>Calc Type</Label>
            <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={formData.calculationType} onChange={e => setFormData({...formData, calculationType: e.target.value})}>
              <option value="FLAT" className="bg-background">Flat Amount</option>
              <option value="PERCENTAGE" className="bg-background">Percentage</option>
              <option value="FORMULA" className="bg-background">Formula</option>
            </select>
          </div>
          {formData.calculationType === 'FORMULA' ? (
            <div className="space-y-1 col-span-2"><Label>Formula (e.g. BS * 0.4)</Label><Input required value={formData.formula} onChange={e => setFormData({...formData, formula: e.target.value})} /></div>
          ) : (
            <div className="space-y-1 col-span-1"><Label>Amount / %</Label><Input required type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} /></div>
          )}
          <div className="flex items-center gap-4 col-span-2 py-2">
            <label className="flex items-center text-sm gap-2"><input type="checkbox" checked={formData.isTaxable} onChange={e => setFormData({...formData, isTaxable: e.target.checked})} /> Taxable</label>
            <label className="flex items-center text-sm gap-2"><input type="checkbox" checked={formData.dependsOnDays} onChange={e => setFormData({...formData, dependsOnDays: e.target.checked})} /> Depends on Attendance</label>
          </div>
          <div className="col-span-4 flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setIsCreatingComponent(false)}>Cancel</Button><Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Component'}</Button></div>
        </form>
      </div>
    );
  }

  function CreateStructureForm() {
    const [name, setName] = useState('');
    const [selectedComponents, setSelectedComponents] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSaving(true);
      try {
        await createSalaryStructure({ name, componentIds: selectedComponents });
        setIsCreatingStructure(false);
        fetchData();
      } catch (e) { console.error(e); } finally { setIsSaving(false); }
    };

    return (
      <div className="rounded-xl border border-border bg-card p-5 mb-6 animate-fade-in">
        <h3 className="font-semibold mb-4">Create Salary Structure</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1"><Label>Structure Name</Label><Input required value={name} onChange={e => setName(e.target.value)} placeholder="Senior Engineer Structure" /></div>
          <div className="space-y-2">
            <Label>Include Components</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {components.map(c => (
                <label key={c.id} className="flex items-center p-2 rounded border border-border bg-muted/10 text-xs gap-2">
                  <input type="checkbox" checked={selectedComponents.includes(c.id)} onChange={e => e.target.checked ? setSelectedComponents([...selectedComponents, c.id]) : setSelectedComponents(selectedComponents.filter(id => id !== c.id))} />
                  {c.name} ({c.abbr})
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setIsCreatingStructure(false)}>Cancel</Button><Button type="submit" disabled={isSaving}>Create Structure</Button></div>
        </form>
      </div>
    );
  }

  function StructuresTable() {
    return (
      <table className="w-full text-sm text-left">
        <thead className="bg-muted/50 text-xs uppercase text-muted-foreground"><tr><th className="px-6 py-4">Structure Name</th><th className="px-6 py-4">Components</th><th className="px-6 py-4 text-center">Status</th></tr></thead>
        <tbody className="divide-y divide-border">
          {structures.map(s => (
            <tr key={s.id} className="hover:bg-muted/30">
              <td className="px-6 py-4 font-medium">{s.name}</td>
              <td className="px-6 py-4 text-xs text-muted-foreground">{s.components?.map((c: any) => c.salaryComponent?.abbr).join(', ')}</td>
              <td className="px-6 py-4 text-center"><Badge variant="outline" className={s.isActive ? 'text-emerald-600' : ''}>{s.isActive ? 'Active' : 'Inactive'}</Badge></td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  function CreateTaxSlabForm() { return <div className="p-5 text-sm text-muted-foreground">Tax slab configuration form coming soon...</div>; }
  function TaxSlabsTable() { 
    return (
      <table className="w-full text-sm text-left">
        <thead className="bg-muted/50 text-xs uppercase text-muted-foreground"><tr><th className="px-6 py-4">Slab Name</th><th className="px-6 py-4">Effective From</th><th className="px-6 py-4">Slabs Count</th></tr></thead>
        <tbody className="divide-y divide-border">
          {taxSlabs.map(slab => (
            <tr key={slab.id} className="hover:bg-muted/30">
              <td className="px-6 py-4 font-medium">{slab.name}</td>
              <td className="px-6 py-4 text-xs">{new Date(slab.effectiveFrom).toLocaleDateString()}</td>
              <td className="px-6 py-4">{slab.slabs?.length || 0} Lines</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
}
