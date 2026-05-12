'use client';

import { useState } from 'react';
import { 
  ShieldCheck, 
  Calculator, 
  FileText, 
  Info, 
  ArrowRight,
  Landmark,
  FileBadge,
  AlertCircle
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';

export default function IndiaCompliancePage() {
  const { } = useAuth();
  const [hraInput, setHraInput] = useState({
    basic: 0,
    hraReceived: 0,
    rentPaid: 0,
    isMetro: false
  });
  const [hraResult, setHraResult] = useState<number | null>(null);

  const calculateHra = () => {
    const case1 = hraInput.hraReceived;
    const case2 = Math.max(0, hraInput.rentPaid - 0.1 * hraInput.basic);
    const case3 = hraInput.isMetro ? 0.5 * hraInput.basic : 0.4 * hraInput.basic;
    setHraResult(Math.min(case1, case2, case3));
  };

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
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
              Generate PF/ESI Report
            </button>
          </div>
        </div>

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
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Standard Rate</span>
                    <span className="font-medium">12%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Statutory Cap</span>
                    <span className="font-medium">₹15,000</span>
                  </div>
                  <div className="pt-3 border-t border-border flex justify-between items-center text-xs">
                    <span className="text-emerald-500 font-semibold uppercase tracking-wider">Configured</span>
                    <button className="text-primary hover:underline">Edit Settings</button>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-xl border border-border bg-card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                    <FileBadge className="h-5 w-5 text-violet-500" />
                  </div>
                  <h3 className="font-bold">ESI</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Employee Rate</span>
                    <span className="font-medium">0.75%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Employer Rate</span>
                    <span className="font-medium">3.25%</span>
                  </div>
                  <div className="pt-3 border-t border-border flex justify-between items-center text-xs">
                    <span className="text-emerald-500 font-semibold uppercase tracking-wider">Configured</span>
                    <button className="text-primary hover:underline">Edit Settings</button>
                  </div>
                </div>
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
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-medium">PAN Records</span>
                  </div>
                  <span className="text-xs font-bold">100%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-amber-500" />
                    <span className="text-xs font-medium">PF Nominations</span>
                  </div>
                  <span className="text-xs font-bold">85%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                    <span className="text-xs font-medium">TDS Declarations</span>
                  </div>
                  <span className="text-xs font-bold">0%</span>
                </div>
              </div>
              <button className="w-full mt-6 py-2 border border-border rounded-lg text-xs font-bold hover:bg-muted transition-colors">
                Send Reminders
              </button>
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
                <li><a href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center justify-between">PF Portal <ArrowRight className="h-3 w-3 opacity-30" /></a></li>
                <li><a href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center justify-between">ESI Registration <ArrowRight className="h-3 w-3 opacity-30" /></a></li>
                <li><a href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center justify-between">Income Tax TRACES <ArrowRight className="h-3 w-3 opacity-30" /></a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
