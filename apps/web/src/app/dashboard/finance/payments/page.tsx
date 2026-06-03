'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { getPayments } from '@/lib/finance';
import { 
  Loader2, 
  Plus, 
  Search, 
  Landmark, 
  Calendar,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { format } from 'date-fns';
import { NewPaymentSheet } from '@/components/finance/NewPaymentSheet';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewPaymentOpen, setIsNewPaymentOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<'RECEIVED' | 'MADE'>('RECEIVED');

  const fetchPayments = () => {
    setIsLoading(true);
    getPayments()
      .then((res) => {
        if (res.success) {
          setPayments(res.data);
        } else {
          setError(res.error || 'Failed to load payments');
        }
      })
      .catch((err) => {
        setError(err.message || 'Failed to load payments');
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const openNewPayment = (type: 'RECEIVED' | 'MADE') => {
    setPaymentType(type);
    setIsNewPaymentOpen(true);
  };

  const filteredPayments = payments.filter(p => 
    (p.paymentNumber ?? '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.remarks ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppShell>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#111111] dark:text-[#f4f4f5]">Payments & Transactions</h1>
            <p className="mt-0.5 text-sm text-[#7b7b78] dark:text-[#a1a1aa]">
              Track incoming and outgoing payments.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => openNewPayment('MADE')}>
              <Plus className="mr-2 h-4 w-4" />
              Pay Bill
            </Button>
            <Button 
              className="bg-[#111111] dark:bg-[#f4f4f5] text-white dark:text-[#111111] hover:bg-[#222222] dark:hover:bg-[#e4e4e7]"
              onClick={() => openNewPayment('RECEIVED')}
            >
              <Plus className="mr-2 h-4 w-4" />
              Receive Payment
            </Button>
          </div>
        </div>

        <NewPaymentSheet 
          open={isNewPaymentOpen} 
          onOpenChange={setIsNewPaymentOpen} 
          onSuccess={fetchPayments}
          type={paymentType}
        />

        <div className="flex items-center justify-between rounded-xl border border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] p-2">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7b7b78] dark:text-[#a1a1aa]" />
            <Input
              placeholder="Search by payment number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 border-none bg-transparent shadow-none focus-visible:ring-0"
            />
          </div>
        </div>

        <div className="rounded-xl border border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] overflow-hidden">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#7b7b78] dark:text-[#a1a1aa]" />
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-red-500 font-medium">{error}</p>
              <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
              <Landmark className="h-12 w-12 text-[#7b7b78] mb-4 opacity-20" />
              <h3 className="text-lg font-medium text-[#111111] dark:text-[#f4f4f5]">No payments recorded</h3>
              <p className="text-sm text-[#7b7b78] dark:text-[#a1a1aa] mt-1 max-w-xs mx-auto">
                Any payments received or made will show up here.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-[#f5f1ec] dark:bg-[#09090b] border-[#d3cec6] dark:border-[#27272a]">
                  <TableHead className="w-[150px] font-bold text-[#111111] dark:text-[#f4f4f5]">Number</TableHead>
                  <TableHead className="w-[120px] font-bold text-[#111111] dark:text-[#f4f4f5]">Type</TableHead>
                  <TableHead className="w-[150px] font-bold text-[#111111] dark:text-[#f4f4f5]">Date</TableHead>
                  <TableHead className="font-bold text-[#111111] dark:text-[#f4f4f5]">Method</TableHead>
                  <TableHead className="text-right font-bold text-[#111111] dark:text-[#f4f4f5]">Amount</TableHead>
                  <TableHead className="w-[100px] font-bold text-[#111111] dark:text-[#f4f4f5] text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((p) => (
                  <TableRow key={p.id} className="border-[#d3cec6] dark:border-[#27272a] hover:bg-[#f5f1ec]/50 dark:hover:bg-[#18181b]/50 cursor-pointer group">
                    <TableCell className="font-mono text-sm font-semibold">{p.paymentNumber}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {p.paymentType === 'RECEIVED' 
                          ? <ArrowDownLeft className="h-3 w-3 text-green-500" />
                          : <ArrowUpRight className="h-3 w-3 text-red-500" />
                        }
                        <span className="text-xs font-medium uppercase tracking-tight">{p.paymentType}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center text-[#7b7b78]">
                        <Calendar className="h-3 w-3 mr-2" />
                        {format(new Date(p.paymentDate), 'MMM dd, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{p.paymentMethod}</span>
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      <span className={p.paymentType === 'RECEIVED' ? 'text-green-600' : 'text-red-600'}>
                        {p.paymentType === 'RECEIVED' ? '+' : '-'}${Number(p.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest px-2 py-0">
                        {p.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </AppShell>
  );
}
