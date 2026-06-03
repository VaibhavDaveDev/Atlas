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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createAccount, getAccounts } from '@/lib/finance';
import { Loader2, AlertCircle } from 'lucide-react';

interface NewAccountSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const ACCOUNT_TYPES = [
  { label: 'Asset', value: 'ASSET' },
  { label: 'Liability', value: 'LIABILITY' },
  { label: 'Equity', value: 'EQUITY' },
  { label: 'Income', value: 'INCOME' },
  { label: 'Expense', value: 'EXPENSE' },
];

export function NewAccountSheet({ open, onOpenChange, onSuccess }: NewAccountSheetProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parentAccounts, setParentAccounts] = useState<any[]>([]);
  
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState('ASSET');
  const [parentAccountId, setParentAccountId] = useState<string | undefined>(undefined);
  const [isGroup, setIsGroup] = useState(false);

  useEffect(() => {
    if (open) {
      getAccounts().then(res => {
        if (res.success) {
          // Only show group accounts as potential parents
          setParentAccounts(res.data.filter((a: any) => a.isGroup));
        }
      });
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!accountNumber || !accountName || !accountType) {
      setError('Account code, name and type are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await createAccount({
        accountNumber,
        accountName,
        accountType,
        parentAccountId: parentAccountId === 'none' ? undefined : parentAccountId,
        isGroup,
      });

      if (res.success) {
        onSuccess();
        onOpenChange(false);
        // Reset
        setAccountNumber('');
        setAccountName('');
        setAccountType('ASSET');
        setParentAccountId(undefined);
        setIsGroup(false);
      } else {
        setError(res.error || 'Failed to create account');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[500px]">
        <SheetHeader>
          <SheetTitle>New Account</SheetTitle>
          <SheetDescription>
            Add a new account to your Chart of Accounts.
          </SheetDescription>
        </SheetHeader>

        <div className="grid gap-6 py-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Account Code</Label>
              <Input 
                id="code" 
                placeholder="e.g., 1000" 
                value={accountNumber} 
                onChange={(e) => setAccountNumber(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Account Type</Label>
              <Select value={accountType} onValueChange={setAccountType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Account Name</Label>
            <Input 
              id="name" 
              placeholder="e.g., Cash at Bank" 
              value={accountName} 
              onChange={(e) => setAccountName(e.target.value)} 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="parent">Parent Account (Optional)</Label>
            <Select value={parentAccountId || 'none'} onValueChange={setParentAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="No Parent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Parent (Root)</SelectItem>
                {parentAccounts.map(acc => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.accountNumber} - {acc.accountName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="isGroup" 
              checked={isGroup} 
              onChange={(e) => setIsGroup(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="isGroup">This is a group account (can contain sub-accounts)</Label>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button 
            className="bg-[#111111] dark:bg-[#f4f4f5] text-white dark:text-[#111111]" 
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Account
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
