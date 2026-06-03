'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { getInvoices } from '@/lib/finance';
import { 
  Loader2, 
  Plus, 
  Search, 
  FileText, 
  Calendar,
  Clock
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
import { NewInvoiceSheet } from '@/components/finance/NewInvoiceSheet';
import { InvoiceDetailSheet } from '@/components/finance/InvoiceDetailSheet';
import { useSearchParams } from 'next/navigation';

export default function InvoicesPage() {
  const searchParams = useSearchParams();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(searchParams.get('new') === 'true');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  const fetchInvoices = () => {
    setIsLoading(true);
    getInvoices()
      .then((res) => {
        if (res.success) {
          setInvoices(res.data);
        } else {
          setError(res.error || 'Failed to load invoices');
        }
      })
      .catch((err) => {
        setError(err.message || 'Failed to load invoices');
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const filteredInvoices = invoices.filter(inv => 
    (inv.invoiceNumber ?? '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (inv.notes ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 uppercase text-[10px]">Paid</Badge>;
      case 'SENT':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 uppercase text-[10px]">Posted</Badge>;
      case 'DRAFT':
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 border-gray-200 uppercase text-[10px]">Draft</Badge>;
      case 'OVERDUE':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200 uppercase text-[10px]">Overdue</Badge>;
      default:
        return <Badge variant="outline" className="uppercase text-[10px]">{status}</Badge>;
    }
  };

  return (
    <AppShell>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#111111] dark:text-[#f4f4f5]">Invoices & Bills</h1>
            <p className="mt-0.5 text-sm text-[#7b7b78] dark:text-[#a1a1aa]">
              Manage your sales invoices and purchase bills.
            </p>
          </div>
          <Button 
            className="bg-[#111111] dark:bg-[#f4f4f5] text-white dark:text-[#111111] hover:bg-[#222222] dark:hover:bg-[#e4e4e7]"
            onClick={() => setIsNewInvoiceOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Invoice
          </Button>
        </div>

        <NewInvoiceSheet 
          open={isNewInvoiceOpen} 
          onOpenChange={setIsNewInvoiceOpen} 
          onSuccess={fetchInvoices} 
        />

        <InvoiceDetailSheet 
          id={selectedInvoiceId}
          open={!!selectedInvoiceId}
          onOpenChange={(open) => !open && setSelectedInvoiceId(null)}
        />

        <div className="flex items-center justify-between rounded-xl border border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] p-2">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7b7b78] dark:text-[#a1a1aa]" />
            <Input
              placeholder="Search by invoice number..."
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
          ) : filteredInvoices.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
              <FileText className="h-12 w-12 text-[#7b7b78] mb-4 opacity-20" />
              <h3 className="text-lg font-medium text-[#111111] dark:text-[#f4f4f5]">No invoices found</h3>
              <p className="text-sm text-[#7b7b78] dark:text-[#a1a1aa] mt-1 max-w-xs mx-auto">
                Once you create sales invoices or record purchase bills, they will appear here.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-[#f5f1ec] dark:bg-[#09090b] border-[#d3cec6] dark:border-[#27272a]">
                  <TableHead className="w-[150px] font-bold text-[#111111] dark:text-[#f4f4f5]">Number</TableHead>
                  <TableHead className="w-[120px] font-bold text-[#111111] dark:text-[#f4f4f5]">Type</TableHead>
                  <TableHead className="w-[150px] font-bold text-[#111111] dark:text-[#f4f4f5]">Date</TableHead>
                  <TableHead className="w-[150px] font-bold text-[#111111] dark:text-[#f4f4f5]">Due Date</TableHead>
                  <TableHead className="text-right font-bold text-[#111111] dark:text-[#f4f4f5]">Total</TableHead>
                  <TableHead className="w-[100px] font-bold text-[#111111] dark:text-[#f4f4f5] text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((inv) => (
                  <TableRow 
                    key={inv.id} 
                    className="border-[#d3cec6] dark:border-[#27272a] hover:bg-[#f5f1ec]/50 dark:hover:bg-[#18181b]/50 cursor-pointer group"
                    onClick={() => setSelectedInvoiceId(inv.id)}
                  >
                    <TableCell className="font-mono text-sm font-semibold">{inv.invoiceNumber}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-bold">
                        {inv.invoiceType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-2 text-[#7b7b78]" />
                        {format(new Date(inv.invoiceDate), 'MMM dd, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center text-[#7b7b78]">
                        <Clock className="h-3 w-3 mr-2" />
                        {format(new Date(inv.dueDate), 'MMM dd, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      ${Number(inv.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(inv.status)}
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
