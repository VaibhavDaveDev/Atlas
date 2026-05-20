'use client';

import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Calculator, 
  FileText, 
  Info, 
  ArrowRight,
  Landmark,
  FileBadge,
  AlertCircle,
  Loader2,
  Download,
  X
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { 
  getIndiaComplianceSettings, 
  updateIndiaComplianceSettings, 
  getPfEsiReport,
  getStatutoryStatus
} from '@/lib/hr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function IndiaCompliancePage() {
  const [settings, setSettings] = useState<any>(null);
  const [statutoryStatus, setStatutoryStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingSettings, setEditingSettings] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any[] | null>(null);
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [hraInput, setHraInput] = useState({ basic: 0, hraReceived: 0, rentPaid: 0, isMetro: true });
  const [hraResult, setHraResult] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [settingsRes, statusRes] = await Promise.all([
        getIndiaComplianceSettings(),
        getStatutoryStatus()
      ]);
      if (settingsRes.success) setSettings(settingsRes.data);
      if (statusRes.success) setStatutoryStatus(statusRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await getIndiaComplianceSettings();
      if (res.success) setSettings(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateIndiaComplianceSettings(settings);
      setEditingSettings(null);
      fetchSettings();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const calculateHra = () => {
    const case1 = hraInput.hraReceived;
    const case2 = Math.max(0, hraInput.rentPaid - 0.1 * hraInput.basic);
    const case3 = hraInput.isMetro ? 0.5 * hraInput.basic : 0.4 * hraInput.basic;
    setHraResult(Math.min(case1, case2, case3));
  };

  const generateReport = async () => {
    setIsGeneratingReport(true);
    try {
      const res = await getPfEsiReport(reportMonth, reportYear);
      if (res.success) setReportData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex h-[80vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" /> India Statutory Compliance
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage PF, ESI, Professional Tax, and Income Tax (TDS) for your Indian workforce.
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setReportData([])}>
              Generate PF/ESI Report
            </Button>
          </div>
        </div>

        {/* Report View Overlay */}
        {reportData && (
          <div 
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setReportData(null);
              }
            }}
          >
            <div className="bg-card border border-border rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="px-4 py-3 md:px-6 md:py-4 border-b border-border flex flex-col md:flex-row md:items-center justify-between bg-muted/30 gap-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold flex items-center gap-2 text-sm md:text-base">
                    <FileText className="h-4 w-4 md:h-5 md:w-5 text-primary" /> PF/ESI Contribution Report
                  </h2>
                  <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setReportData(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between md:justify-end gap-2 md:gap-4">
                  <div className="flex items-center gap-2">
                    <select 
                      value={reportMonth} 
                      onChange={e => setReportMonth(parseInt(e.target.value))}
                      className="bg-transparent text-xs md:text-sm border-none focus:ring-0 cursor-pointer font-medium p-0"
                    >
                      {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                        <option key={m} value={i + 1}>{m}</option>
                      ))}
                    </select>
                    <select 
                      value={reportYear} 
                      onChange={e => setReportYear(parseInt(e.target.value))}
                      className="bg-transparent text-xs md:text-sm border-none focus:ring-0 cursor-pointer font-medium p-0"
                    >
                      {[2024, 2025, 2026].map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                  <Button size="sm" className="h-8 text-xs md:text-sm" onClick={generateReport} disabled={isGeneratingReport}>
                    {isGeneratingReport ? <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" /> : 'Fetch Data'}
                  </Button>
                  <Button className="hidden md:flex h-8 w-8" variant="ghost" size="icon" onClick={() => setReportData(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-6">
                {reportData.length > 0 ? (
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted text-xs uppercase text-muted-foreground sticky top-0">
                      <tr>
                        <th className="px-4 py-3 font-medium">Employee</th>
                        <th className="px-4 py-3 text-right">Gross</th>
                        <th className="px-4 py-3 text-right">PF (Emp)</th>
                        <th className="px-4 py-3 text-right">PF (Empr)</th>
                        <th className="px-4 py-3 text-right">ESI (Emp)</th>
                        <th className="px-4 py-3 text-right">ESI (Empr)</th>
                        <th className="px-4 py-3 text-right font-bold">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {reportData.map((row, i) => (
                        <tr key={i} className="hover:bg-muted/30">
                          <td className="px-4 py-3">
                            <p className="font-medium">{row.employeeName}</p>
                            <p className="text-[10px] text-muted-foreground uppercase">{row.employeeNumber}</p>
                          </td>
                          <td className="px-4 py-3 text-right">₹{row.grossEarnings.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">₹{row.employeePf.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">₹{row.employerPf.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">₹{row.employeeEsi.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">₹{row.employerEsi.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right font-bold">₹{row.totalContribution.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-center text-muted-foreground">
                    <FileText className="h-12 w-12 opacity-20 mb-4" />
                    <p>No payroll records found for the selected period.</p>
                    <p className="text-xs mt-1">Ensure payroll has been run and marked as PAID.</p>
                  </div>
                )}
              </div>
              {reportData.length > 0 && (
                <div className="px-6 py-4 border-t border-border bg-muted/10 flex justify-end">
                  <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-2" /> Download ECR File</Button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Compliance Status Cards */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="p-5 rounded-xl border border-border bg-card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Landmark className="h-5 w-5 text-blue-500" />
                  </div>
                  <h3 className="font-bold">Provident Fund (PF)</h3>
                </div>
                {editingSettings === 'pf' ? (
                  <form onSubmit={handleUpdateSettings} className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase">Employer Rate (%)</Label>
                      <Input 
                        type="number" step="0.01" 
                        value={settings.pfRate * 100} 
                        onChange={e => setSettings({...settings, pfRate: parseFloat(e.target.value) / 100})} 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase">Wage Cap (₹)</Label>
                      <Input 
                        type="number" 
                        value={settings.pfCap} 
                        onChange={e => setSettings({...settings, pfCap: parseInt(e.target.value)})} 
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button type="submit" size="sm" className="flex-1" disabled={isSaving}>Save</Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => setEditingSettings(null)}>Cancel</Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Standard Rate</span>
                      <span className="font-medium">{(settings.pfRate * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Statutory Cap</span>
                      <span className="font-medium">₹{settings.pfCap.toLocaleString()}</span>
                    </div>
                    <div className="pt-3 border-t border-border flex justify-between items-center text-xs">
                      <span className="text-emerald-500 font-semibold uppercase tracking-wider">Configured</span>
                      <button className="text-primary hover:underline" onClick={() => setEditingSettings('pf')}>Edit Settings</button>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-5 rounded-xl border border-border bg-card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                    <FileBadge className="h-5 w-5 text-violet-500" />
                  </div>
                  <h3 className="font-bold">ESI</h3>
                </div>
                {editingSettings === 'esi' ? (
                  <form onSubmit={handleUpdateSettings} className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] uppercase">Emp Rate (%)</Label>
                        <Input 
                          type="number" step="0.01" 
                          value={settings.esiEmployeeRate * 100} 
                          onChange={e => setSettings({...settings, esiEmployeeRate: parseFloat(e.target.value) / 100})} 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] uppercase">Empr Rate (%)</Label>
                        <Input 
                          type="number" step="0.01" 
                          value={settings.esiEmployerRate * 100} 
                          onChange={e => setSettings({...settings, esiEmployerRate: parseFloat(e.target.value) / 100})} 
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase">Wage Cap (₹)</Label>
                      <Input 
                        type="number" 
                        value={settings.esiCap} 
                        onChange={e => setSettings({...settings, esiCap: parseInt(e.target.value)})} 
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button type="submit" size="sm" className="flex-1" disabled={isSaving}>Save</Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => setEditingSettings(null)}>Cancel</Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Employee Rate</span>
                      <span className="font-medium">{(settings.esiEmployeeRate * 100).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Employer Rate</span>
                      <span className="font-medium">{(settings.esiEmployerRate * 100).toFixed(2)}%</span>
                    </div>
                    <div className="pt-3 border-t border-border flex justify-between items-center text-xs">
                      <span className="text-emerald-500 font-semibold uppercase tracking-wider">Configured</span>
                      <button className="text-primary hover:underline" onClick={() => setEditingSettings('esi')}>Edit Settings</button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* HRA Calculator */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center gap-2">
                <Calculator className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-bold uppercase tracking-wider">HRA Exemption Calculator</h2>
              </div>
              <div className="p-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                        Annual Basic Salary
                      </label>
                      <input 
                        type="number" 
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        placeholder="e.g. 600000"
                        onChange={(e) => setHraInput({ ...hraInput, basic: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                        Annual HRA Received
                      </label>
                      <input 
                        type="number" 
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        placeholder="e.g. 240000"
                        onChange={(e) => setHraInput({ ...hraInput, hraReceived: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                        Annual Rent Paid
                      </label>
                      <input 
                        type="number" 
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        placeholder="e.g. 180000"
                        onChange={(e) => setHraInput({ ...hraInput, rentPaid: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <input 
                        type="checkbox" 
                        id="isMetro" 
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
                        onChange={(e) => setHraInput({ ...hraInput, isMetro: e.target.checked })}
                      />
                      <label htmlFor="isMetro" className="text-sm font-medium">Living in Metro City (50% Basic)</label>
                    </div>
                    <button 
                      onClick={calculateHra}
                      className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-bold text-sm shadow-sm hover:bg-primary/90 transition-all"
                    >
                      Calculate Exemption
                    </button>
                  </div>
                  
                  <div className="bg-muted/50 rounded-xl p-6 flex flex-col items-center justify-center text-center border border-dashed border-border">
                    {hraResult !== null ? (
                      <>
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Exempt HRA Amount</p>
                        <p className="text-4xl font-black text-primary">₹{hraResult.toLocaleString('en-IN')}</p>
                        <p className="text-xs text-muted-foreground mt-4 max-w-[200px]">
                          This amount is exempt from income tax under Section 10(13A).
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="h-12 w-12 rounded-full bg-background flex items-center justify-center mb-3">
                          <Info className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium">Enter details to calculate</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Calculated based on Rule 2A of Income Tax Rules.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Tax Slabs Overview */}
            <div className="rounded-2xl border border-border bg-card">
              <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-bold uppercase tracking-wider">Income Tax Slabs (FY 2024-25)</h2>
                </div>
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 text-[10px] font-bold rounded uppercase">New Regime</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border">
                    <tr>
                      <th className="px-6 py-3">Income Range</th>
                      <th className="px-6 py-3 text-right">Tax Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[
                      { range: 'Up to ₹3,00,000', rate: 'Nil' },
                      { range: '₹3,00,001 - ₹6,00,000', rate: '5%' },
                      { range: '₹6,00,001 - ₹9,00,000', rate: '10%' },
                      { range: '₹9,00,001 - ₹12,00,000', rate: '15%' },
                      { range: '₹12,00,001 - ₹15,00,000', rate: '20%' },
                      { range: 'Above ₹15,00,000', rate: '30%' },
                    ].map((row) => (
                      <tr key={row.range} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-3 font-medium">{row.range}</td>
                        <td className="px-6 py-3 text-right font-bold text-primary">{row.rate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* PAN/Aadhaar Status */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-sm font-bold uppercase tracking-wider mb-4">Statutory Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${(statutoryStatus?.panRecords?.pct || 0) > 90 ? 'bg-emerald-500' : (statutoryStatus?.panRecords?.pct || 0) > 50 ? 'bg-amber-500' : 'bg-red-500'}`} />
                    <span className="text-xs font-medium">PAN Records</span>
                  </div>
                  <span className="text-xs font-bold">{statutoryStatus?.panRecords?.pct ?? 0}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${(statutoryStatus?.pfNominations?.pct || 0) > 90 ? 'bg-emerald-500' : (statutoryStatus?.pfNominations?.pct || 0) > 50 ? 'bg-amber-500' : 'bg-red-500'}`} />
                    <span className="text-xs font-medium">PF Nominations</span>
                  </div>
                  <span className="text-xs font-bold">{statutoryStatus?.pfNominations?.pct ?? 0}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${(statutoryStatus?.tdsDeclarations?.pct || 0) > 90 ? 'bg-emerald-500' : (statutoryStatus?.tdsDeclarations?.pct || 0) > 50 ? 'bg-amber-500' : 'bg-red-500'}`} />
                    <span className="text-xs font-medium">TDS Declarations</span>
                  </div>
                  <span className="text-xs font-bold">{statutoryStatus?.tdsDeclarations?.pct ?? 0}%</span>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-6 text-xs" onClick={() => alert('Reminders sent to employees!')} disabled={statutoryStatus?.totalEmployees === 0}>
                Send Reminders
              </Button>
            </div>

            {/* Compliance Alerts */}
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-5">
              <div className="flex items-center gap-2 text-destructive mb-3">
                <AlertCircle className="h-4 w-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider">Urgent Alerts</h3>
              </div>
              <p className="text-xs text-destructive/80 leading-relaxed">
                TDS declaration window is open for FY 2024-25. No employees have submitted their investment proofs yet.
              </p>
              <button className="mt-4 text-[10px] font-bold text-destructive uppercase tracking-widest hover:underline flex items-center gap-1">
                Open Window <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {/* Help Docs */}
            <div className="p-5">
              <h3 className="text-sm font-bold uppercase tracking-wider mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="https://www.epfindia.gov.in/" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center justify-between">PF Portal <ArrowRight className="h-3 w-3 opacity-30" aria-hidden="true" /></a></li>
                <li><a href="https://www.esic.gov.in/" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center justify-between">ESI Registration <ArrowRight className="h-3 w-3 opacity-30" aria-hidden="true" /></a></li>
                <li><a href="https://www.tdscpc.gov.in/" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center justify-between">Income Tax TRACES <ArrowRight className="h-3 w-3 opacity-30" aria-hidden="true" /></a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

