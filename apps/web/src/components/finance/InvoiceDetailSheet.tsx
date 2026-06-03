'use client';

import { useState, useEffect } from 'react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from '@/components/ui/sheet';
import { getInvoice, postInvoice } from '@/lib/finance';
import { Loader2, Calendar, Clock, Send, CreditCard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { NewPaymentSheet } from './NewPaymentSheet';

interface InvoiceDetailSheetProps {
  id: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh?: () => void;
}

export function InvoiceDetailSheet({ id, open, onOpenChange, onRefresh }: InvoiceDetailSheetProps) {
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  const fetchInvoice = () => {
    if (id) {
      setLoading(true);
      getInvoice(id)
        .then(res => {
          if (res.success) setInvoice(res.data);
        })
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    if (id && open) {
      fetchInvoice();
    }
  }, [id, open]);

  const handlePost = async () => {
    if (!invoice) return;
    setActionLoading(true);
    try {
      const res = await postInvoice(invoice.id);
      if (res.success) {
        toast.success('Invoice posted to GL successfully');
        fetchInvoice();
        if (onRefresh) onRefresh();
      } else {
        toast.error(res.error || 'Failed to post invoice');
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge className="bg-green-100 text-green-700">Paid</Badge>;
      case 'SENT':
        return <Badge className="bg-blue-100 text-blue-700">Posted</Badge>;
      case 'DRAFT':
        return <Badge className="bg-gray-100 text-gray-700">Draft</Badge>;
      case 'OVERDUE':
        return <Badge className="bg-red-100 text-red-700">Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[700px] overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-2 mb-2">
             {invoice && getStatusBadge(invoice.status)}
             <span className="text-xs text-muted-foreground font-mono">{invoice?.invoiceNumber}</span>
          </div>
          <SheetTitle>{invoice?.invoiceType === 'SALES' ? 'Sales Invoice' : 'Purchase Bill'}</SheetTitle>
          <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Date: {invoice && format(new Date(invoice.invoiceDate), 'PPP')}</span>
            <span className="flex items-center gap-1 text-red-500"><Clock className="h-3 w-3" /> Due: {invoice && format(new Date(invoice.dueDate), 'PPP')}</span>
          </div>
        </SheetHeader>

        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : invoice && (
          <div className="py-8 space-y-8">
            <div className="grid grid-cols-2 gap-8 text-sm">
               <div className="space-y-1">
                 <p className="font-bold text-[#7b7b78] uppercase text-[10px]">Entity</p>
                 <p className="font-medium">{invoice.invoiceType === 'SALES' ? 'Customer' : 'Vendor'}</p>
                 <p className="text-muted-foreground italic text-xs">Internal ID: {invoice.customerId || invoice.vendorId || 'N/A'}</p>
               </div>
               <div className="space-y-1 text-right">
                 <p className="font-bold text-[#7b7b78] uppercase text-[10px]">Currency</p>
                 <p className="font-medium">{invoice.currencyCode} (Rate: {Number(invoice.exchangeRate)})</p>
               </div>
            </div>

            <div className="rounded-xl border border-[#d3cec6] dark:border-[#27272a] overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#f5f1ec] dark:bg-[#09090b] hover:bg-transparent">
                    <TableHead className="text-[#111111] dark:text-[#f4f4f5] font-bold">Description</TableHead>
                    <TableHead className="text-right text-[#111111] dark:text-[#f4f4f5] font-bold">Qty</TableHead>
                    <TableHead className="text-right text-[#111111] dark:text-[#f4f4f5] font-bold">Price</TableHead>
                    <TableHead className="text-right text-[#111111] dark:text-[#f4f4f5] font-bold">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.items.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{item.description}</div>
                      </TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right font-mono">${Number(item.unitPrice).toLocaleString()}</TableCell>
                      <TableCell className="text-right font-mono font-bold">${Number(item.amount).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end">
              <div className="w-full max-w-[250px] space-y-2 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-mono">${Number(invoice.subtotal).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-mono">${Number(invoice.taxAmount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                  <span>Total</span>
                  <span className="font-mono text-green-600">${Number(invoice.total).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {invoice.notes && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase text-[#7b7b78]">Notes</p>
                <div className="p-4 rounded-xl bg-[#fcfaf8] dark:bg-[#09090b] border border-[#d3cec6] dark:border-[#27272a] text-sm italic">
                  {invoice.notes}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 pt-6 border-t">
              {invoice.status === 'DRAFT' && (
                <Button 
                  className="w-full bg-[#111111] dark:bg-[#f4f4f5] text-white dark:text-[#111111]"
                  onClick={handlePost}
                  disabled={actionLoading}
                >
                  {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Post to General Ledger
                </Button>
              )}

              {invoice.status === 'SENT' && (
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => setIsPaymentOpen(true)}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Record Payment
                </Button>
              )}
              
              <Button variant="outline" className="w-full" onClick={() => toast.info('PDF export coming soon')}>
                Download PDF
              </Button>
            </div>

            <NewPaymentSheet 
              open={isPaymentOpen}
              onOpenChange={setIsPaymentOpen}
              onSuccess={() => {
                fetchInvoice();
                if (onRefresh) onRefresh();
              }}
              type={invoice.invoiceType === 'SALES' ? 'RECEIVED' : 'MADE'}
              invoiceId={invoice.id}
              defaultAmount={Number(invoice.total)}
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
