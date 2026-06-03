'use client';

import { AppShell } from '@/components/layout/AppShell';
import { useState, useEffect } from 'react';
import { getPayments, reconcilePayment } from '@/lib/finance';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, Loader2, Landmark, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import Link from 'next/link';

export default function BankReconciliationPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await getPayments();
      // Handle wrapped response { success: true, data: [...] } or direct array
      const paymentData = res.data || (Array.isArray(res) ? res : []);
      // Filter for unreconciled payments
      setPayments(paymentData.filter((p: any) => p.status !== 'RECONCILED'));
    } catch (e) {
      console.error('Fetch payments error:', e);
      toast.error('Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleReconcile = async (id: string) => {
    try {
      await reconcilePayment(id);
      toast.success('Transaction reconciled');
      fetchPayments();
    } catch (e) {
      toast.error('Failed to reconcile');
    }
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-8 p-8 max-w-6xl mx-auto">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <Link href="/dashboard/finance" className="text-xs text-muted-foreground flex items-center gap-1 hover:text-primary transition-colors mb-2">
              <ArrowLeft className="h-3 w-3" />
              Back to Finance
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Bank Reconciliation</h1>
            <p className="text-muted-foreground">Match your ledger entries with your bank statement.</p>
          </div>
        </div>

        <Card className="border-[#d3cec6] dark:border-[#27272a]">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Landmark className="h-5 w-5 text-primary" />
              Unreconciled Transactions
            </CardTitle>
            <CardDescription>
              Check off transactions as they appear on your bank statement.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-20 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-muted-foreground" /></div>
            ) : payments.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground italic">No transactions awaiting reconciliation.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{format(new Date(payment.paymentDate), 'PP')}</TableCell>
                      <TableCell>
                        <div className="font-bold">{payment.paymentNumber}</div>
                        <div className="text-[10px] text-muted-foreground uppercase">{payment.paymentMethod}</div>
                      </TableCell>
                      <TableCell>{payment.currencyCode}</TableCell>
                      <TableCell className="text-right font-mono font-bold">
                        {payment.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 gap-1"
                          onClick={() => handleReconcile(payment.id)}
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Reconcile
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
