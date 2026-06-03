'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { getAccounts } from '@/lib/finance';
import { 
  Loader2, 
  Plus, 
  Search, 
  Landmark, 
  FolderTree,
  ChevronRight
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
import { NewAccountSheet } from '@/components/finance/NewAccountSheet';

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewAccountOpen, setIsNewAccountOpen] = useState(false);

  const fetchAccounts = () => {
    setIsLoading(true);
    getAccounts()
      .then((res) => {
        if (res.success) {
          setAccounts(res.data);
        } else {
          setError(res.error || 'Failed to load accounts');
        }
      })
      .catch((err) => {
        setError(err.message || 'Failed to load accounts');
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  // Helper to build hierarchy
  const buildHierarchy = (allAccounts: any[], parentId: string | null = null, level = 0): any[] => {
    return allAccounts
      .filter(a => a.parentAccountId === parentId)
      .map(a => ({
        ...a,
        level,
        children: buildHierarchy(allAccounts, a.id, level + 1)
      }));
  };

  const accountHierarchy = buildHierarchy(
    accounts.filter(a => 
      (a.accountName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (a.accountNumber || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const renderAccountRows = (items: any[]): React.ReactNode => {
    return items.map(account => (
      <React.Fragment key={account.id}>
        <TableRow className="border-[#d3cec6] dark:border-[#27272a] hover:bg-[#f5f1ec]/50 dark:hover:bg-[#18181b]/50 cursor-pointer group">
          <TableCell className="font-mono text-sm">
            <div className="flex items-center" style={{ paddingLeft: `${account.level * 24}px` }}>
              {account.level > 0 && <ChevronRight className="h-3 w-3 mr-1 text-muted-foreground/50" />}
              {account.accountNumber}
            </div>
          </TableCell>
          <TableCell>
            <div className="flex items-center">
              {account.isGroup ? <FolderTree className="h-4 w-4 mr-2 text-[#7b7b78]" /> : <Landmark className="h-3.5 w-3.5 mr-2 text-muted-foreground/40" />}
              <span className={account.isGroup ? "font-bold text-[#111111] dark:text-[#f4f4f5]" : "text-muted-foreground"}>{account.accountName}</span>
            </div>
          </TableCell>
          <TableCell>
            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-tighter h-5">
              {account.accountType}
            </Badge>
          </TableCell>
          <TableCell className="text-right font-mono font-bold">
            ${Number(account.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </TableCell>
        </TableRow>
        {account.children && account.children.length > 0 && renderAccountRows(account.children)}
      </React.Fragment>
    ));
  };

  return (
    <AppShell>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#111111] dark:text-[#f4f4f5]">Chart of Accounts</h1>
            <p className="mt-0.5 text-sm text-[#7b7b78] dark:text-[#a1a1aa]">
              View and manage your organization's general ledger accounts.
            </p>
          </div>
          <Button 
            className="bg-[#111111] dark:bg-[#f4f4f5] text-white dark:text-[#111111] hover:bg-[#222222] dark:hover:bg-[#e4e4e7]"
            onClick={() => setIsNewAccountOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Account
          </Button>
        </div>

        <NewAccountSheet 
          open={isNewAccountOpen} 
          onOpenChange={setIsNewAccountOpen} 
          onSuccess={fetchAccounts} 
        />

        <div className="flex items-center justify-between rounded-xl border border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] p-2 shadow-sm">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7b7b78] dark:text-[#a1a1aa]" />
            <Input
              placeholder="Search by code or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 border-none bg-transparent shadow-none focus-visible:ring-0"
            />
          </div>
        </div>

        <div className="rounded-xl border border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] overflow-hidden shadow-sm">
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
          ) : accounts.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
               <Landmark className="h-12 w-12 text-[#7b7b78] mb-4 opacity-20" />
               <h3 className="text-lg font-medium text-[#111111] dark:text-[#f4f4f5]">No accounts found</h3>
               <p className="text-sm text-[#7b7b78] dark:text-[#a1a1aa] mt-1 max-w-xs mx-auto">
                 Setup your chart of accounts to start tracking your finances.
               </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-[#f5f1ec] dark:bg-[#09090b] border-[#d3cec6] dark:border-[#27272a] hover:bg-transparent">
                  <TableHead className="w-[180px] font-bold text-[#111111] dark:text-[#f4f4f5]">Account Code</TableHead>
                  <TableHead className="font-bold text-[#111111] dark:text-[#f4f4f5]">Account Name</TableHead>
                  <TableHead className="w-[120px] font-bold text-[#111111] dark:text-[#f4f4f5]">Type</TableHead>
                  <TableHead className="w-[180px] text-right font-bold text-[#111111] dark:text-[#f4f4f5]">Running Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {renderAccountRows(accountHierarchy)}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </AppShell>
  );
}
