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
import { createJournalEntry, getAccounts, getExchangeRate, getSupportedCurrencies } from '@/lib/finance';
import { Plus, Trash2, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface NewJournalEntrySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function NewJournalEntrySheet({ open, onOpenChange, onSuccess }: NewJournalEntrySheetProps) {
  const { workspace } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetchingRate, setFetchingRate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<Record<string, string>>({});
  
  const [description, setDescription] = useState('');
  const [postingDate, setPostingDate] = useState(new Date().toISOString().split('T')[0]);
  const [currencyCode, setCurrencyCode] = useState('USD');
  const [exchangeRate, setExchangeRate] = useState(1);
  const [lines, setLines] = useState([
    { accountId: '', debit: 0, credit: 0, description: '' },
    { accountId: '', debit: 0, credit: 0, description: '' }
  ]);

  useEffect(() => {
    if (open) {
      getAccounts().then(res => {
        if (res.success) setAccounts(res.data);
      });
      getSupportedCurrencies().then(res => {
        setCurrencies(res.data || res);
      });
      if (workspace?.settings?.baseCurrency) {
        setCurrencyCode(workspace.settings.baseCurrency);
      }
    }
  }, [open, workspace]);

  const fetchRate = async (quote: string) => {
    const base = workspace?.settings?.baseCurrency || 'USD';
    if (quote === base) {
      setExchangeRate(1);
      return;
    }
    setFetchingRate(true);
    try {
      const res = await getExchangeRate(quote, base, postingDate);
      const rate = res.data?.rate || res.rate;
      if (rate) setExchangeRate(rate);
    } catch (e) {
      toast.error('Failed to fetch exchange rate');
    } finally {
      setFetchingRate(false);
    }
  };

  useEffect(() => {
    if (currencyCode && open) {
      fetchRate(currencyCode);
    }
  }, [currencyCode, postingDate]);

  const addLine = () => {
    setLines([...lines, { accountId: '', debit: 0, credit: 0, description: '' }]);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 2) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  const updateLine = (index: number, field: string, value: any) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    
    // If setting debit, clear credit and vice versa
    if (field === 'debit' && value > 0) newLines[index].credit = 0;
    if (field === 'credit' && value > 0) newLines[index].debit = 0;
    
    setLines(newLines);
  };

  const totalDebit = lines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
  const totalCredit = lines.reduce((sum, line) => sum + Number(line.credit || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const handleSubmit = async () => {
    if (!isBalanced) {
      setError('Journal entry must be balanced (Total Debit = Total Credit)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        description,
        postingDate,
        currencyCode,
        exchangeRate,
        lines: lines.map(l => ({
          accountId: l.accountId,
          debit: Number(l.debit) * exchangeRate, // Store in Base Currency
          credit: Number(l.credit) * exchangeRate, // Store in Base Currency
          description: l.description || description
        }))
      };

      const res = await createJournalEntry(payload);
      if (res.success) {
        onSuccess();
        onOpenChange(false);
        // Reset form
        setDescription('');
        setExchangeRate(1);
        setLines([
          { accountId: '', debit: 0, credit: 0, description: '' },
          { accountId: '', debit: 0, credit: 0, description: '' }
        ]);
      } else {
        setError(res.error || 'Failed to create journal entry');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[700px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>New Journal Entry</SheetTitle>
          <SheetDescription>
            Record a manual transaction. Amounts will be converted to {workspace?.settings?.baseCurrency || 'Base Currency'} for the ledger.
          </SheetDescription>
        </SheetHeader>

        <div className="grid gap-6 py-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Posting Date</Label>
              <Input 
                id="date" 
                type="date" 
                value={postingDate} 
                onChange={(e) => setPostingDate(e.target.value)} 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-muted/30 border border-dashed border-[#d3cec6] dark:border-[#27272a]">
            <div className="space-y-2">
              <Label>Entry Currency</Label>
              <Select value={currencyCode} onValueChange={setCurrencyCode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(currencies) ? (
                    currencies.map((c: any) => (
                      <SelectItem key={c.iso_code || c.code} value={c.iso_code || c.code}>
                        {c.iso_code || c.code} - {c.name}
                      </SelectItem>
                    ))
                  ) : (
                    Object.entries(currencies).map(([code, details]: [string, any]) => (
                      <SelectItem key={code} value={code}>
                        {code} - {typeof details === 'object' ? details.name || code : details}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                Exchange Rate
                {fetchingRate && <Loader2 className="h-3 w-3 animate-spin" />}
              </Label>
              <div className="relative">
                <Input 
                  type="number" 
                  step="0.000001" 
                  value={exchangeRate} 
                  onChange={(e) => setExchangeRate(Number(e.target.value))} 
                />
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="absolute right-1 top-1 h-8 w-8"
                  onClick={() => fetchRate(currencyCode)}
                  disabled={fetchingRate}
                >
                  <RefreshCw className={cn("h-3 w-3", fetchingRate && "animate-spin")} />
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="desc">Description</Label>
            <Textarea 
              id="desc" 
              placeholder="Enter transaction description..." 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-bold uppercase tracking-wider text-[#7b7b78]">Line Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addLine}>
                <Plus className="mr-2 h-3 w-3" /> Add Line
              </Button>
            </div>

            <div className="space-y-3">
              {lines.map((line, index) => (
                <div key={index} className="flex gap-3 items-start p-3 rounded-lg border border-[#d3cec6] dark:border-[#27272a] bg-[#fcfaf8] dark:bg-[#09090b]">
                  <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-12 gap-3">
                      <div className="col-span-6">
                        <Select 
                          value={line.accountId} 
                          onValueChange={(val) => updateLine(index, 'accountId', val)}
                        >
                          <SelectTrigger className="bg-white dark:bg-[#121214]">
                            <SelectValue placeholder="Select Account" />
                          </SelectTrigger>
                          <SelectContent>
                            {accounts.length === 0 ? (
                              <SelectItem value="empty" disabled>No accounts found</SelectItem>
                            ) : (
                              accounts.map(acc => (
                                <SelectItem key={acc.id} value={acc.id}>
                                  {acc.accountNumber} - {acc.accountName}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-3">
                        <Input 
                          type="number" 
                          placeholder="Debit" 
                          value={line.debit || ''} 
                          onChange={(e) => updateLine(index, 'debit', e.target.value)}
                          className="bg-white dark:bg-[#121214]"
                        />
                      </div>
                      <div className="col-span-3">
                        <Input 
                          type="number" 
                          placeholder="Credit" 
                          value={line.credit || ''} 
                          onChange={(e) => updateLine(index, 'credit', e.target.value)}
                          className="bg-white dark:bg-[#121214]"
                        />
                      </div>
                    </div>
                    <Input 
                      placeholder="Line description (optional)" 
                      value={line.description}
                      onChange={(e) => updateLine(index, 'description', e.target.value)}
                      className="text-xs bg-white dark:bg-[#121214]"
                    />
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => removeLine(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
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

          <div className="flex justify-between items-center p-4 rounded-xl bg-[#f5f1ec] dark:bg-[#09090b] border border-[#d3cec6] dark:border-[#27272a]">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#7b7b78]">Status</p>
              <p className={cn(
                "text-sm font-bold mt-1",
                isBalanced ? "text-green-600" : "text-amber-600"
              )}>
                {isBalanced ? "Balanced" : "Unbalanced"}
              </p>
            </div>
            <div className="text-right flex gap-8">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#7b7b78]">Total Debit</p>
                <p className="text-sm font-mono font-bold mt-1">${totalDebit.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#7b7b78]">Total Credit</p>
                <p className="text-sm font-mono font-bold mt-1">${totalCredit.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button 
            className="bg-[#111111] dark:bg-[#f4f4f5] text-white dark:text-[#111111]" 
            onClick={handleSubmit}
            disabled={loading || !isBalanced}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Post Entry
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
