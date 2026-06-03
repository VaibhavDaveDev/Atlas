'use client';

import { useState, useEffect } from 'react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetFooter
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { closePeriod, getDashboardStats } from '@/lib/finance';
import { Loader2, AlertCircle, CheckCircle2, ShieldCheck, ArrowRight, Lock } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { toast } from 'sonner';
import Link from 'next/link';

interface MonthEndCloseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function MonthEndCloseSheet({ open, onOpenChange, onSuccess }: MonthEndCloseSheetProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Default to previous month
  const targetDate = subMonths(new Date(), 1);
  const periodName = format(targetDate, 'MMMM yyyy');
  const startDate = format(startOfMonth(targetDate), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(targetDate), 'yyyy-MM-dd');

  useEffect(() => {
    if (open) {
      setStep(1);
      setError(null);
      setLoading(true);
      getDashboardStats()
        .then(res => {
          if (res.success) setStats(res.data);
        })
        .finally(() => setLoading(false));
    }
  }, [open]);

  const handleClosePeriod = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await closePeriod({
        name: periodName,
        startDate,
        endDate
      });

      if (res.success) {
        setStep(3);
        toast.success(`Period ${periodName} locked successfully`);
        onSuccess();
      } else {
        setError(res.error || 'Failed to close period');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during period closing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[500px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-purple-600" />
            Month-end Closing Flow
          </SheetTitle>
          <SheetDescription>
            Strict period control for {periodName}
          </SheetDescription>
        </SheetHeader>

        <div className="py-8">
          {step === 1 && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 text-sm text-blue-700 dark:text-blue-300">
                <p className="font-bold mb-1">Pre-closing Check</p>
                <p className="text-xs opacity-90">Closing a period will lock all entries and prevent future modifications for compliance.</p>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-[#7b7b78]">Period Summary</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg border border-[#d3cec6] dark:border-[#27272a]">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Revenue</p>
                    <p className="text-lg font-mono font-bold">${stats?.kpis?.totalRevenue?.toLocaleString() || '0'}</p>
                  </div>
                  <div className="p-3 rounded-lg border border-[#d3cec6] dark:border-[#27272a]">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Invoices</p>
                    <p className="text-lg font-mono font-bold">{stats?.kpis?.overdueInvoices || '0'} Overdue</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-widest text-[#7b7b78]">Required Actions</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 text-sm">
                    <div className="flex items-center gap-2">
                      {stats?.kpis?.draftInvoices === 0 ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                      )}
                      <span>Draft Invoices Cleared</span>
                    </div>
                    {stats?.kpis?.draftInvoices === 0 ? (
                      <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700">Verified</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700">{stats?.kpis?.draftInvoices} Pending</Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
                      <span>Bank Reconciliation</span>
                    </div>
                    <Link href="/dashboard/finance/payments/reconcile">
                       <Button variant="link" className="h-auto p-0 text-[10px] uppercase font-bold text-primary">Perform Check</Button>
                    </Link>
                  </div>
                </div>
              </div>

              <Button className="w-full h-12 bg-[#111111] dark:bg-[#f4f4f5] text-white dark:text-[#111111]" onClick={() => setStep(2)}>
                Proceed to Lock Period
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center">
                <Lock className="h-8 w-8 text-amber-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Final Confirmation</h3>
                <p className="text-sm text-muted-foreground">
                  You are about to lock the period <span className="font-bold text-[#111111] dark:text-[#f4f4f5]">{periodName}</span>. 
                  This action cannot be undone easily.
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs text-left flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <Button 
                  className="w-full h-12 bg-red-600 hover:bg-red-700 text-white" 
                  onClick={handleClosePeriod}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                  Confirm & Lock Ledger
                </Button>
                <Button variant="outline" className="w-full h-12" onClick={() => setStep(1)} disabled={loading}>
                  Back
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 text-center py-8">
              <div className="mx-auto h-20 w-20 rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">Period Locked</h3>
                <p className="text-sm text-muted-foreground">
                  The ledger for {periodName} has been successfully reconciled and sealed.
                </p>
              </div>
              <Button className="w-full h-12" variant="outline" onClick={() => onOpenChange(false)}>
                Return to Dashboard
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
