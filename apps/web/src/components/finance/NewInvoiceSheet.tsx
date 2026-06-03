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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createInvoice, getAccounts } from '@/lib/finance';
import { Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';

interface NewInvoiceSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function NewInvoiceSheet({ open, onOpenChange, onSuccess }: NewInvoiceSheetProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  
  const [invoiceType, setInvoiceType] = useState('SALES');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([
    { description: '', quantity: 1, unitPrice: 0, accountId: '' }
  ]);

  useEffect(() => {
    if (open) {
      getAccounts().then(res => {
        if (res.success) setAccounts(res.data);
      });
    }
  }, [open]);

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0, accountId: '' }]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const total = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice)), 0);

  const handleSubmit = async () => {
    if (items.some(item => !item.accountId || !item.description)) {
      setError('Please fill in all item details and select accounts');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        invoiceType,
        invoiceDate,
        dueDate,
        notes,
        items: items.map(item => ({
          ...item,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice)
        }))
      };

      const res = await createInvoice(payload);
      if (res.success) {
        onSuccess();
        onOpenChange(false);
        // Reset form
        setItems([{ description: '', quantity: 1, unitPrice: 0, accountId: '' }]);
        setNotes('');
      } else {
        setError(res.error || 'Failed to create invoice');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[800px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Create New {invoiceType === 'SALES' ? 'Invoice' : 'Bill'}</SheetTitle>
          <SheetDescription>
            Record a new {invoiceType === 'SALES' ? 'sales invoice' : 'purchase bill'}. This will automatically generate ledger entries when posted.
          </SheetDescription>
        </SheetHeader>

        <div className="grid gap-6 py-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={invoiceType} onValueChange={setInvoiceType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SALES">Sales Invoice</SelectItem>
                  <SelectItem value="PURCHASE">Purchase Bill</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Invoice Date</Label>
              <Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea 
              placeholder="Internal notes or terms..." 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-bold uppercase tracking-wider text-[#7b7b78]">Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="mr-2 h-3 w-3" /> Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 p-3 rounded-lg border border-[#d3cec6] dark:border-[#27272a] bg-[#fcfaf8] dark:bg-[#09090b]">
                  <div className="col-span-4 space-y-2">
                    <Label className="text-[10px] uppercase font-bold">Description</Label>
                    <Input 
                      placeholder="Service/Product name" 
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      className="bg-white dark:bg-[#121214]"
                    />
                  </div>
                  <div className="col-span-3 space-y-2">
                    <Label className="text-[10px] uppercase font-bold">Account</Label>
                    <Select 
                      value={item.accountId} 
                      onValueChange={(val) => updateItem(index, 'accountId', val)}
                    >
                      <SelectTrigger className="bg-white dark:bg-[#121214]">
                        <SelectValue placeholder="Income/Expense" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map(acc => (
                          <SelectItem key={acc.id} value={acc.id}>
                            {acc.code} - {acc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label className="text-[10px] uppercase font-bold">Qty</Label>
                    <Input 
                      type="number" 
                      value={item.quantity} 
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      className="bg-white dark:bg-[#121214]"
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label className="text-[10px] uppercase font-bold">Price</Label>
                    <Input 
                      type="number" 
                      value={item.unitPrice} 
                      onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                      className="bg-white dark:bg-[#121214]"
                    />
                  </div>
                  <div className="col-span-1 pt-7">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="text-red-500 hover:text-red-600 h-8 w-8"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <div className="flex justify-end p-4 rounded-xl bg-[#f5f1ec] dark:bg-[#09090b] border border-[#d3cec6] dark:border-[#27272a]">
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#7b7b78]">Total Amount</p>
              <p className="text-2xl font-mono font-bold mt-1">${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button 
            className="bg-[#111111] dark:bg-[#f4f4f5] text-white dark:text-[#111111]" 
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save as Draft
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
