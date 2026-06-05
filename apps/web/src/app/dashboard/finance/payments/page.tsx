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
  ArrowDownLeft,
  CheckCircle2,
  History,
  ShieldCheck
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
import { reconcilePayment, getAccounts } from '@/lib/finance';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'history' | 'reconciliation'>('history');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [isNewPaymentOpen, setIsNewPaymentOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<'RECEIVED' | 'MADE'>('RECEIVED');
  const [isReconciling, setIsReconciling] = useState(false);

  const fetchPayments = () => {
    setIsLoading(true);
    Promise.all([getPayments(), getAccounts()])
      .then(([payRes, accRes]) => {
        if (payRes.success) setPayments(payRes.data);
        if (accRes.success) setAccounts(accRes.data.filter((a: any) => a.accountType === 'ASSET')); // Show bank/cash accounts
      })
      .catch((err) => {
        setError(err.message || 'Failed to load data');
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleReconcile = async () => {
    if (selectedPayments.length === 0) return;
    if (!window.confirm(`Are you sure you want to reconcile ${selectedPayments.length} transactions?`)) return;

    setIsReconciling(true);
    try {
      for (const id of selectedPayments) {
        await reconcilePayment(id);
      }
      alert('Transactions reconciled successfully!');
      setSelectedPayments([]);
      fetchPayments();
    } catch (e: any) {
      alert(e.message || 'Reconciliation failed');
    } finally {
      setIsReconciling(false);
    }
  };

  const openNewPayment = (type: 'RECEIVED' | 'MADE') => {
    setPaymentType(type);
    setIsNewPaymentOpen(true);
  };

  const filteredPayments = payments.filter(p => {
    const matchesSearch = (p.paymentNumber ?? '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.remarks ?? '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAccount = selectedAccountId === 'all' || p.accountId === selectedAccountId;
    const matchesStatus = activeTab === 'history' ? true : p.status !== 'RECONCILED';
    
    return matchesSearch && matchesAccount && matchesStatus;
  });

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

        <div className="flex bg-[#f5f1ec] dark:bg-[#09090b] p-1 rounded-lg w-fit border border-[#d3cec6] dark:border-[#27272a]">
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-[#ffffff] dark:bg-[#121214] shadow-sm text-[#111111] dark:text-[#f4f4f5]' : 'text-[#7b7b78] hover:text-[#111111]'}`}
          >
            <History className="h-4 w-4" />
            Payment History
          </button>
          <button
            onClick={() => setActiveTab('reconciliation')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${activeTab === 'reconciliation' ? 'bg-[#ffffff] dark:bg-[#121214] shadow-sm text-[#111111] dark:text-[#f4f4f5]' : 'text-[#7b7b78] hover:text-[#111111]'}`}
          >
            <ShieldCheck className="h-4 w-4" />
            Bank Reconciliation
          </button>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 rounded-xl border border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] p-2">
          <div className="flex flex-1 items-center gap-2 w-full">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7b7b78] dark:text-[#a1a1aa]" />
              <Input
                placeholder="Search payments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 border-none bg-transparent shadow-none focus-visible:ring-0"
              />
            </div>
            
            <div className="h-6 w-px bg-[#d3cec6] dark:bg-[#27272a] hidden md:block" />
            
            <select 
              className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer p-1"
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
            >
              <option value="all">All Bank Accounts</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.accountName}</option>
              ))}
            </select>
          </div>

          {activeTab === 'reconciliation' && selectedPayments.length > 0 && (
            <Button 
              size="sm" 
              onClick={handleReconcile}
              disabled={isReconciling}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isReconciling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Reconcile {selectedPayments.length} Items
            </Button>
          )}
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
              <h3 className="text-lg font-medium text-[#111111] dark:text-[#f4f4f5]">No {activeTab === 'reconciliation' ? 'unreconciled' : ''} payments</h3>
              <p className="text-sm text-[#7b7b78] dark:text-[#a1a1aa] mt-1 max-w-xs mx-auto">
                {activeTab === 'reconciliation' 
                  ? 'Great! Your books are in sync with your bank statement.'
                  : 'Any payments received or made will show up here.'
                }
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-[#f5f1ec] dark:bg-[#09090b] border-[#d3cec6] dark:border-[#27272a]">
                  {activeTab === 'reconciliation' && <TableHead className="w-[50px]"></TableHead>}
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
                    {activeTab === 'reconciliation' && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          className="h-4 w-4 rounded border-[#d3cec6]" 
                          checked={selectedPayments.includes(p.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedPayments([...selectedPayments, p.id]);
                            else setSelectedPayments(selectedPayments.filter(id => id !== p.id));
                          }}
                        />
                      </TableCell>
                    )}
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
                      <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0 ${p.status === 'RECONCILED' ? 'border-emerald-500 text-emerald-600 bg-emerald-500/5' : ''}`}>
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
