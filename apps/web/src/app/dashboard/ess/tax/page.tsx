'use client';

import { useEffect, useState } from 'react';
import { Landmark, Plus, Receipt, Save, XCircle, AlertCircle, CheckCircle2, History, Loader2, ArrowRight } from 'lucide-react';
import { getMyTaxDeclarations, submitTaxDeclaration, cancelTaxDeclaration } from '@/lib/ess';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

import { useMediaQuery } from '@/hooks/use-media-query';

export default function EssTaxPage() {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [declarations, setDeclarations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    monthlyHouseRent: '',
    rentedInMetroCity: false,
    rentedFromDate: '',
    rentedToDate: '',
    investment80C: '',
    medicalInsurance: '',
    otherInvestments: '',
  });

  async function fetchData() {
    setLoading(true);
    try {
      const data = await getMyTaxDeclarations();
      setDeclarations(data || []);
    } catch (error) {
      console.error('Failed to fetch tax declarations', error);
      toast.error('Failed to load declarations');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        monthlyHouseRent: parseFloat(formData.monthlyHouseRent) || 0,
        rentedInMetroCity: formData.rentedInMetroCity,
        rentedFromDate: formData.rentedFromDate,
        rentedToDate: formData.rentedToDate,
        declarations: {
          section80C: parseFloat(formData.investment80C) || 0,
          section80D: parseFloat(formData.medicalInsurance) || 0,
          others: parseFloat(formData.otherInvestments) || 0,
        }
      };

      await submitTaxDeclaration(payload);
      toast.success('Tax declaration submitted successfully!');
      setShowForm(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit declaration');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this declaration?')) return;
    setSubmitting(true);
    try {
      await cancelTaxDeclaration(id);
      toast.success('Declaration cancelled successfully');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel declaration');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED': 
        return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-none shadow-none text-[9px] font-bold uppercase">Approved</Badge>;
      case 'REJECTED': 
        return <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-none shadow-none text-[9px] font-bold uppercase">Rejected</Badge>;
      case 'SUBMITTED': 
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-none shadow-none text-[9px] font-bold uppercase">Submitted</Badge>;
      case 'CANCELLED': 
        return <Badge className="bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-slate-400 border-none shadow-none text-[9px] font-bold uppercase">Cancelled</Badge>;
      default: 
        return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-none shadow-none text-[9px] font-bold uppercase">{status}</Badge>;
    }
  };

  const calculateTotal = (d: any) => {
    return (Number(d.monthlyHouseRent || 0) * 12) + 
           (Number(d.declarations?.section80C || 0)) + 
           (Number(d.declarations?.section80D || 0)) + 
           (Number(d.declarations?.others || 0));
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#111111] dark:text-[#f4f4f5] flex items-center gap-2">
            <Landmark className="h-6 w-6 text-emerald-600" /> Tax Declarations
          </h1>
          <p className="text-sm text-[#626260] dark:text-[#a1a1aa]">
            Manage your investment declarations for income tax compliance.
          </p>
        </div>
        <Button className="bg-[#111111] dark:bg-[#f4f4f5] text-white dark:text-[#111111] hover:bg-[#27272a] dark:hover:bg-[#e4e4e7] h-11 px-6 font-bold shadow-sm rounded-xl transition-all" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Declaration
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white dark:bg-[#121214] rounded-2xl border border-[#d3cec6] dark:border-[#27272a]">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-xs font-bold uppercase tracking-widest text-[#7b7b78]">Syncing Records...</p>
        </div>
      ) : declarations.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-[#121214] rounded-2xl border border-[#d3cec6] dark:border-[#27272a] border-dashed">
          <Landmark className="h-10 w-10 text-[#d3cec6] dark:text-[#27272a] mx-auto mb-4" />
          <p className="text-sm font-medium text-[#626260]">No declarations found for the current period.</p>
          <Button variant="link" className="mt-2 text-emerald-600 font-bold uppercase text-[10px]" onClick={() => setShowForm(true)}>Start First Declaration</Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Mobile Card View */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {declarations.map((d) => (
              <Card key={d.id} className="border-[#d3cec6] dark:border-[#27272a] shadow-none bg-white dark:bg-[#121214] overflow-hidden rounded-2xl">
                <div className="h-1.5 w-full bg-emerald-500" />
                <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase text-[#7b7b78] tracking-widest">Submitted On</p>
                    <p className="text-sm font-bold text-[#111111] dark:text-[#f4f4f5]">{new Date(d.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                  </div>
                  {getStatusBadge(d.status)}
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="grid grid-cols-2 gap-4 py-4 border-y border-[#f5f1ec] dark:border-[#27272a]">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-[#7b7b78] mb-1">Financial Year</p>
                      <p className="text-sm font-medium">2024-25</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-[#7b7b78] mb-1 text-right">Total Amount</p>
                      <p className="text-sm font-bold text-emerald-600 text-right">₹{calculateTotal(d).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="pt-4 flex justify-between items-center">
                    <div className="flex gap-2">
                       <History className="h-3.5 w-3.5 text-blue-500" />
                       <span className="text-[10px] font-bold text-[#626260] dark:text-[#a1a1aa] uppercase tracking-wider">Progress Tracked</span>
                    </div>
                    {d.status === 'SUBMITTED' && (
                      <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold uppercase text-rose-500 hover:text-rose-600" onClick={() => handleCancel(d.id)}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Card className="border-[#d3cec6] dark:border-[#27272a] shadow-none bg-white dark:bg-[#121214] overflow-hidden rounded-2xl">
              <CardHeader className="bg-[#fcfaf8]/50 dark:bg-white/5 border-b border-[#f5f1ec] dark:border-[#27272a] py-4">
                <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7b7b78]">Declaration History</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-left">
                  <thead className="text-[10px] font-bold uppercase tracking-widest text-[#7b7b78] border-b border-[#f5f1ec] dark:border-[#27272a]">
                    <tr>
                      <th className="px-6 py-4">Submission Date</th>
                      <th className="px-6 py-4">Financial Year</th>
                      <th className="px-6 py-4">Rent Exemption</th>
                      <th className="px-6 py-4">Investment (80C)</th>
                      <th className="px-6 py-4">Total Declared</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f5f1ec] dark:divide-[#27272a]">
                    {declarations.map((d) => (
                      <tr key={d.id} className="group hover:bg-[#fcfaf8] dark:hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-[#111111] dark:text-[#f4f4f5] text-sm">
                            {new Date(d.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                          <p className="text-[10px] text-[#7b7b78] font-medium tracking-tighter">ID: {d.id.slice(0, 8)}</p>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">2024-25</td>
                        <td className="px-6 py-4 text-sm font-medium">₹{(d.monthlyHouseRent * 12).toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm font-medium">₹{(d.declarations?.section80C || 0).toLocaleString()}</td>
                        <td className="px-6 py-4">
                           <span className="font-bold text-emerald-600">₹{calculateTotal(d).toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(d.status)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {d.status === 'SUBMITTED' ? (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 text-[10px] font-bold uppercase border-rose-100 text-rose-500 hover:bg-rose-50 dark:border-rose-950 dark:hover:bg-rose-950/20" 
                              onClick={() => handleCancel(d.id)}
                            >
                              Withdraw
                            </Button>
                          ) : (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-[#d3cec6] group-hover:text-[#7b7b78] transition-colors">
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Declaration Form - Responsive Layout */}
      {(showForm && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          {/* Desktop: Inline Card */}
          <div className="hidden md:block">
            <Card className="border-[#d3cec6] dark:border-[#27272a] shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-[#121214]">
              <div className="h-2 w-full bg-emerald-600" />
              <CardHeader className="p-8 pb-0">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-3xl font-bold tracking-tight text-[#111111] dark:text-[#f4f4f5]">New Tax Declaration</CardTitle>
                    <CardDescription className="text-sm mt-1.5 text-[#626260] dark:text-[#a1a1aa]">
                      Provide accurate estimates to ensure correct TDS deductions from your monthly payroll.
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setShowForm(false)} className="rounded-full">
                    <XCircle className="h-6 w-6 text-[#7b7b78]" />
                  </Button>
                </div>
              </CardHeader>
              <form onSubmit={handleSubmit} className="p-8 pt-6 space-y-10">
                <div className="grid grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-6 w-1 bg-emerald-500 rounded-full" />
                      <h3 className="font-bold text-[11px] uppercase tracking-[0.2em] text-[#7b7b78]">HRA & Rent Info</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-[#7b7b78]">Monthly Rent Amount</Label>
                        <div className="relative group">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7b7b78] font-bold text-sm">₹</span>
                          <Input 
                            type="number" 
                            placeholder="0.00" 
                            value={formData.monthlyHouseRent}
                            onChange={e => setFormData({...formData, monthlyHouseRent: e.target.value})}
                            className="h-12 pl-7 bg-[#fcfaf8] dark:bg-white/5 border-[#d3cec6] dark:border-[#27272a] rounded-xl focus:ring-emerald-500"
                            required
                          />
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 bg-blue-50/20 dark:bg-blue-500/5 p-4 rounded-2xl border border-blue-100/50 dark:border-blue-500/10">
                        <Checkbox 
                          id="metro-desktop" 
                          checked={formData.rentedInMetroCity}
                          onCheckedChange={v => setFormData({...formData, rentedInMetroCity: !!v})}
                          className="mt-1 data-[state=checked]:bg-blue-600 border-blue-200"
                        />
                        <div className="grid gap-1 leading-none">
                          <Label htmlFor="metro-desktop" className="text-xs font-bold uppercase text-blue-900 dark:text-blue-100 cursor-pointer">Metro City</Label>
                          <p className="text-[10px] text-blue-700/70 dark:text-blue-400/70 leading-relaxed">Check for higher exemption if you live in Mumbai, Delhi, Kolkata, or Chennai.</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-[#7b7b78]">From Date</Label>
                          <Input type="date" value={formData.rentedFromDate} onChange={e => setFormData({...formData, rentedFromDate: e.target.value})} className="h-11 bg-[#fcfaf8] dark:bg-white/5 border-[#d3cec6] dark:border-[#27272a] rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-[#7b7b78]">To Date</Label>
                          <Input type="date" value={formData.rentedToDate} onChange={e => setFormData({...formData, rentedToDate: e.target.value})} className="h-11 bg-[#fcfaf8] dark:bg-white/5 border-[#d3cec6] dark:border-[#27272a] rounded-xl" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-6 w-1 bg-emerald-500 rounded-full" />
                      <h3 className="font-bold text-[11px] uppercase tracking-[0.2em] text-[#7b7b78]">Investment Proofs</h3>
                    </div>
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-[#7b7b78]">Section 80C (Max ₹1.5L)</Label>
                        <div className="relative group">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7b7b78] font-bold text-sm">₹</span>
                          <Input type="number" placeholder="LIC, PPF, ELSS..." value={formData.investment80C} onChange={e => setFormData({...formData, investment80C: e.target.value})} className="h-12 pl-7 bg-[#fcfaf8] dark:bg-white/5 border-[#d3cec6] dark:border-[#27272a] rounded-xl focus:ring-emerald-500" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-[#7b7b78]">Section 80D (Medical)</Label>
                        <div className="relative group">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7b7b78] font-bold text-sm">₹</span>
                          <Input type="number" placeholder="Health Insurance" value={formData.medicalInsurance} onChange={e => setFormData({...formData, medicalInsurance: e.target.value})} className="h-12 pl-7 bg-[#fcfaf8] dark:bg-white/5 border-[#d3cec6] dark:border-[#27272a] rounded-xl focus:ring-emerald-500" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-[#7b7b78]">Other Savings</Label>
                        <div className="relative group">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7b7b78] font-bold text-sm">₹</span>
                          <Input type="number" placeholder="NPS, Loans, etc." value={formData.otherInvestments} onChange={e => setFormData({...formData, otherInvestments: e.target.value})} className="h-12 pl-7 bg-[#fcfaf8] dark:bg-white/5 border-[#d3cec6] dark:border-[#27272a] rounded-xl focus:ring-emerald-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-8 border-t border-[#f5f1ec] dark:border-white/5 mt-4">
                  <Button variant="ghost" type="button" onClick={() => setShowForm(false)} className="font-bold text-[#7b7b78] hover:text-[#111111] dark:hover:text-[#f4f4f5] h-12 rounded-xl">Discard Changes</Button>
                  <Button type="submit" className="bg-[#111111] dark:bg-[#f4f4f5] text-white dark:text-[#111111] hover:bg-[#27272a] dark:hover:bg-[#e4e4e7] font-bold px-12 shadow-xl h-12 rounded-xl" disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Submit Declaration'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          {/* Mobile: Dialog/Modal */}
          <div className="md:hidden">
            <Dialog open={showForm && !isDesktop} onOpenChange={setShowForm}>
              <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden rounded-3xl border-none">
                <div className="h-1.5 w-full bg-emerald-600" />
                <DialogHeader className="p-6 pb-2">
                  <DialogTitle className="text-xl font-bold">New Tax Declaration</DialogTitle>
                  <DialogDescription className="text-xs">Submit your investment estimates for the financial year.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="p-6 pt-2 space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-[#7b7b78]">Monthly Rent</Label>
                      <Input 
                        type="number" 
                        value={formData.monthlyHouseRent}
                        onChange={e => setFormData({...formData, monthlyHouseRent: e.target.value})}
                        className="h-10 border-[#d3cec6] dark:border-[#27272a]"
                        required
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="metro-mobile" 
                        checked={formData.rentedInMetroCity}
                        onCheckedChange={v => setFormData({...formData, rentedInMetroCity: !!v})}
                      />
                      <Label htmlFor="metro-mobile" className="text-xs">Rented in Metro City</Label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase text-[#7b7b78]">From</Label>
                        <Input type="date" value={formData.rentedFromDate} onChange={e => setFormData({...formData, rentedFromDate: e.target.value})} className="h-10 text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase text-[#7b7b78]">To</Label>
                        <Input type="date" value={formData.rentedToDate} onChange={e => setFormData({...formData, rentedToDate: e.target.value})} className="h-10 text-xs" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-[#7b7b78]">Section 80C</Label>
                      <Input type="number" value={formData.investment80C} onChange={e => setFormData({...formData, investment80C: e.target.value})} className="h-10 border-[#d3cec6] dark:border-[#27272a]" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-[#7b7b78]">Section 80D (Medical)</Label>
                      <Input type="number" value={formData.medicalInsurance} onChange={e => setFormData({...formData, medicalInsurance: e.target.value})} className="h-10 border-[#d3cec6] dark:border-[#27272a]" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-[#7b7b78]">Other Savings</Label>
                      <Input type="number" value={formData.otherInvestments} onChange={e => setFormData({...formData, otherInvestments: e.target.value})} className="h-10 border-[#d3cec6] dark:border-[#27272a]" />
                    </div>
                  </div>
                  <DialogFooter className="pt-4 flex-row gap-2">
                    <Button variant="ghost" type="button" onClick={() => setShowForm(false)} className="flex-1 h-10 text-xs">Cancel</Button>
                    <Button type="submit" className="flex-1 h-10 text-xs bg-[#111111] dark:bg-[#f4f4f5] dark:text-[#09090b]" disabled={submitting}>
                      {submitting ? 'Submitting...' : 'Submit'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      ))}
    </div>
  );
}
