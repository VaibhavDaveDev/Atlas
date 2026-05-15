'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { getPayrollRuns, createPayrollRun, getSalaryComponents, getSalaryStructures, getTaxSlabs, createSalaryComponent, createSalaryStructure, createTaxSlab } from '@/lib/hr';
import { Loader2, Plus, Receipt, ArrowRight, HelpCircle, Trash2, Banknote, Landmark, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { FormContainer } from '@/components/common/FormContainer';
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
          <div className="flex bg-muted/50 p-1 rounded-lg overflow-x-auto">
            {(['runs', 'components', 'structures', 'tax-slabs'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors capitalize whitespace-nowrap ${activeTab === tab ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {tab === 'tax-slabs' ? 'Tax Slabs' : tab}
              </button>
            ))}
          </div>
          <div className="shrink-0">
            {activeTab === 'runs' && <Button onClick={() => setIsCreatingRun(!isCreatingRun)}><Plus className="mr-2 h-4 w-4" /> New Run</Button>}
            {activeTab === 'components' && <Button onClick={() => setIsCreatingComponent(!isCreatingComponent)}><Plus className="mr-2 h-4 w-4" /> New Component</Button>}
            {activeTab === 'structures' && <Button onClick={() => setIsCreatingStructure(!isCreatingStructure)}><Plus className="mr-2 h-4 w-4" /> New Structure</Button>}
            {activeTab === 'tax-slabs' && <Button onClick={() => setIsCreatingTaxSlab(!isCreatingTaxSlab)}><Plus className="mr-2 h-4 w-4" /> New Tax Slab</Button>}
          </div>
        </div>

        {/* KPI Section */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Processed MTD</CardTitle>
              <Banknote className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0.00</div>
              <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                <span className="text-emerald-500 font-bold">0%</span> from last month
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Active Structures</CardTitle>
              <Landmark className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{structures.length}</div>
              <p className="text-[10px] text-muted-foreground mt-1">Across all departments</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Next Payment</CardTitle>
              <CreditCard className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">TBD</div>
              <p className="text-[10px] text-muted-foreground mt-1">Scheduled for end of month</p>
            </CardContent>
          </Card>
        </div>

        {/* Dynamic Forms rendered as Desktop Cards or Mobile Dialogs */}
        <FormContainer 
          title="Generate New Payroll Run" 
          description="Draft payslips will be auto-calculated using the Formula Engine." 
          isOpen={activeTab === 'runs' && isCreatingRun} 
          setIsOpen={setIsCreatingRun}
        >
          <CreateRunForm />
        </FormContainer>

        <FormContainer 
          title="Create Salary Component" 
          isOpen={activeTab === 'components' && isCreatingComponent} 
          setIsOpen={setIsCreatingComponent}
        >
          <CreateComponentForm />
        </FormContainer>

        <FormContainer 
          title="Create Salary Structure" 
          isOpen={activeTab === 'structures' && isCreatingStructure} 
          setIsOpen={setIsCreatingStructure}
        >
          <CreateStructureForm />
        </FormContainer>

        <FormContainer 
          title="Create Income Tax Slab" 
          isOpen={activeTab === 'tax-slabs' && isCreatingTaxSlab} 
          setIsOpen={setIsCreatingTaxSlab}
        >
          <CreateTaxSlabForm />
        </FormContainer>

        {/* Data Tables */}
        <div className="rounded-xl border border-border bg-card overflow-x-auto">
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
        <table className="w-full text-sm text-left whitespace-nowrap">
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
      <table className="w-full text-sm text-left whitespace-nowrap">
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
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label>Run Name</Label>
          <Input required value={name} onChange={e => setName(e.target.value)} placeholder="April 2026 Payroll" />
        </div>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Period Start</Label>
            <Input required type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Period End</Label>
            <Input required type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Payment Date</Label>
            <Input required type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
          <Button type="button" variant="outline" onClick={() => setIsCreatingRun(false)}>Cancel</Button>
          <Button type="submit" disabled={isSaving}>{isSaving ? 'Generating...' : 'Generate'}</Button>
        </div>
      </form>
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
      <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-1.5">
                <Label>Name</Label>
                <HoverCard openDelay={0}>
                  <HoverCardTrigger asChild>
                    <button type="button" aria-label="Name information" className="inline-flex items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </button>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <p className="text-sm">Full name of the component (e.g., Basic Salary, House Rent Allowance)</p>
                  </HoverCardContent>
                </HoverCard>
              </div>
              <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Basic Salary" />
            </div>
            <div className="w-full sm:w-28 space-y-2">
              <div className="flex items-center gap-1.5">
                <Label>Abbr</Label>
                <HoverCard openDelay={0}>
                  <HoverCardTrigger asChild>
                    <button type="button" aria-label="Abbreviation information" className="inline-flex items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </button>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <p className="text-sm">Short name used in formulas (e.g., BS, HRA)</p>
                  </HoverCardContent>
                </HoverCard>
              </div>
              <Input required value={formData.abbr} onChange={e => setFormData({...formData, abbr: e.target.value})} placeholder="BS" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Type</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                <option value="EARNING">Earning</option>
                <option value="DEDUCTION">Deduction</option>
              </select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label>Calc Type</Label>
                <HoverCard openDelay={0}>
                  <HoverCardTrigger asChild>
                    <button type="button" aria-label="Calculation type information" className="inline-flex items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </button>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <p className="text-sm">FLAT: Fixed amount<br/>PERCENTAGE: % of total<br/>FORMULA: Expression using Abbrs</p>
                  </HoverCardContent>
                </HoverCard>
              </div>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={formData.calculationType} onChange={e => setFormData({...formData, calculationType: e.target.value})}>
                <option value="FLAT">Flat Amount</option>
                <option value="PERCENTAGE">Percentage</option>
                <option value="FORMULA">Formula</option>
              </select>
            </div>
          </div>

          {formData.calculationType === 'FORMULA' ? (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label>Formula</Label>
                <HoverCard openDelay={0}>
                  <HoverCardTrigger asChild>
                    <button type="button" aria-label="Formula information" className="inline-flex items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </button>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <p className="text-sm">Use Abbrs of other components. Example: BS * 0.4</p>
                  </HoverCardContent>
                </HoverCard>
              </div>
              <Input required value={formData.formula} onChange={e => setFormData({...formData, formula: e.target.value})} placeholder="BS * 0.4" />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Amount / %</Label>
              <Input required type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="0.00" />
            </div>
          )}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center py-2">
            <label className="flex items-center text-sm gap-2 cursor-pointer">
              <input type="checkbox" className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer" checked={formData.isTaxable} onChange={e => setFormData({...formData, isTaxable: e.target.checked})} /> Taxable
            </label>
            <label className="flex items-center text-sm gap-2 cursor-pointer">
              <input type="checkbox" className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer" checked={formData.dependsOnDays} onChange={e => setFormData({...formData, dependsOnDays: e.target.checked})} /> Depends on Attendance
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
            <Button type="button" variant="outline" onClick={() => setIsCreatingComponent(false)}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Component'}</Button>
          </div>
        </form>
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
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label>Structure Name</Label>
          <Input required value={name} onChange={e => setName(e.target.value)} placeholder="Senior Engineer Structure" />
        </div>
        <div className="space-y-3">
          <Label>Include Components</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {components.map(c => (
              <label key={c.id} className="flex items-center p-3 rounded-lg border border-border bg-muted/10 text-sm gap-3 cursor-pointer hover:bg-muted/30 transition-colors">
                <input 
                  type="checkbox" 
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
                  checked={selectedComponents.includes(c.id)} 
                  onChange={e => e.target.checked ? setSelectedComponents([...selectedComponents, c.id]) : setSelectedComponents(selectedComponents.filter(id => id !== c.id))} 
                />
                <span className="font-medium">{c.name} <span className="text-muted-foreground font-normal">({c.abbr})</span></span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
          <Button type="button" variant="outline" onClick={() => setIsCreatingStructure(false)}>Cancel</Button>
          <Button type="submit" disabled={isSaving}>Create Structure</Button>
        </div>
      </form>
    );
  }

  function StructuresTable() {
    return (
      <table className="w-full text-sm text-left whitespace-nowrap">
        <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
          <tr><th className="px-6 py-4">Structure Name</th><th className="px-6 py-4">Components</th><th className="px-6 py-4 text-center">Status</th></tr>
        </thead>
        <tbody className="divide-y divide-border">
          {structures.map(s => (
            <tr key={s.id} className="hover:bg-muted/30">
              <td className="px-6 py-4 font-medium">{s.name}</td>
              <td className="px-6 py-4 text-xs text-muted-foreground whitespace-normal">{s.components?.map((c: any) => c.salaryComponent?.abbr).join(', ')}</td>
              <td className="px-6 py-4 text-center">
                <Badge variant="outline" className={s.isActive ? 'border-emerald-500/50 text-emerald-600' : ''}>{s.isActive ? 'Active' : 'Inactive'}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  function CreateTaxSlabForm() {
    const [name, setName] = useState('');
    const [effectiveFrom, setEffectiveFrom] = useState('');
    const [slabs, setSlabs] = useState<any[]>([{ fromAmount: '0', toAmount: '', taxRate: '0' }]);
    const [isSaving, setIsSaving] = useState(false);

    const addLine = () => setSlabs([...slabs, { fromAmount: '', toAmount: '', taxRate: '' }]);
    const removeLine = (index: number) => {
      if (slabs.length > 1) {
        setSlabs(slabs.filter((_, i) => i !== index));
      }
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSaving(true);
      try {
        await createTaxSlab({ name, effectiveFrom, slabs });
        setIsCreatingTaxSlab(false);
        fetchData();
      } catch (e) { console.error(e); } finally { setIsSaving(false); }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label>Slab Name</Label><Input required value={name} onChange={e => setName(e.target.value)} placeholder="FY 2026-27 New Regime" /></div>
          <div className="space-y-2"><Label>Effective From</Label><Input required type="date" value={effectiveFrom} onChange={e => setEffectiveFrom(e.target.value)} /></div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Tax Slab Lines</Label>
          </div>
          <div className="space-y-3">
            {slabs.map((slab, i) => (
              <div key={i} className="flex flex-col sm:flex-row gap-3 sm:items-end p-4 sm:p-0 border sm:border-0 rounded-lg bg-muted/20 sm:bg-transparent">
                <div className="w-full space-y-2">
                  <Label className="text-[11px] uppercase text-muted-foreground">From Amount</Label>
                  <Input required type="number" value={slab.fromAmount} onChange={e => {
                    const newSlabs = [...slabs];
                    newSlabs[i].fromAmount = e.target.value;
                    setSlabs(newSlabs);
                  }} />
                </div>
                <div className="w-full space-y-2">
                  <Label className="text-[11px] uppercase text-muted-foreground">To Amount (Empty for ∞)</Label>
                  <Input type="number" value={slab.toAmount} onChange={e => {
                    const newSlabs = [...slabs];
                    newSlabs[i].toAmount = e.target.value;
                    setSlabs(newSlabs);
                  }} />
                </div>
                <div className="w-full space-y-2">
                  <Label className="text-[11px] uppercase text-muted-foreground">Tax Rate (%)</Label>
                  <Input required type="number" step="0.01" value={slab.taxRate} onChange={e => {
                    const newSlabs = [...slabs];
                    newSlabs[i].taxRate = e.target.value;
                    setSlabs(newSlabs);
                  }} />
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon" 
                  className="w-full sm:w-10 sm:h-10 mt-2 sm:mt-0 text-destructive border-destructive/20 hover:bg-destructive/10 shrink-0"
                  onClick={() => removeLine(i)}
                  disabled={slabs.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sm:hidden ml-2">Remove Line</span>
                </Button>
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addLine} className="w-full sm:w-auto"><Plus className="h-4 w-4 mr-2" /> Add Line</Button>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
          <Button type="button" variant="outline" onClick={() => setIsCreatingTaxSlab(false)}>Cancel</Button>
          <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Tax Slab'}</Button>
        </div>
      </form>
    );
  }

  function TaxSlabsTable() { 
    return (
      <table className="w-full text-sm text-left whitespace-nowrap">
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
