'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { getJournalEntries } from '@/lib/finance';
import { 
  Loader2, 
  Plus, 
  Search, 
  FileText, 
  Calendar,
  ExternalLink
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
import { NewJournalEntrySheet } from '@/components/finance/NewJournalEntrySheet';
import { JournalEntryDetailSheet } from '@/components/finance/JournalEntryDetailSheet';
import { useSearchParams } from 'next/navigation';

export default function JournalsPage() {
  const searchParams = useSearchParams();
  const [entries, setEntries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(searchParams.get('new') === 'true');
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  const fetchEntries = () => {
    setIsLoading(true);
    getJournalEntries()
      .then((res) => {
        if (res.success) {
          setEntries(res.data);
        } else {
          setError(res.error || 'Failed to load journal entries');
        }
      })
      .catch((err) => {
        setError(err.message || 'Failed to load journal entries');
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const filteredEntries = entries.filter(e => 
    (e.entryNumber ?? '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (e.description ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppShell>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#111111] dark:text-[#f4f4f5]">Journal Entries</h1>
            <p className="mt-0.5 text-sm text-[#7b7b78] dark:text-[#a1a1aa]">
              Record and view all financial transactions in the general ledger.
            </p>
          </div>
          <Button 
            className="bg-[#111111] dark:bg-[#f4f4f5] text-white dark:text-[#111111] hover:bg-[#222222] dark:hover:bg-[#e4e4e7]"
            onClick={() => setIsNewEntryOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Entry
          </Button>
        </div>

        <NewJournalEntrySheet 
          open={isNewEntryOpen} 
          onOpenChange={setIsNewEntryOpen} 
          onSuccess={fetchEntries}
        />

        <JournalEntryDetailSheet 
          id={selectedEntryId}
          open={!!selectedEntryId}
          onOpenChange={(open) => !open && setSelectedEntryId(null)}
        />

        <div className="flex items-center justify-between rounded-xl border border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] p-2">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7b7b78] dark:text-[#a1a1aa]" />
            <Input
              placeholder="Search by number or description..."
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
          ) : entries.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
              <FileText className="h-12 w-12 text-[#7b7b78] mb-4 opacity-20" />
              <h3 className="text-lg font-medium text-[#111111] dark:text-[#f4f4f5]">No journal entries found</h3>
              <p className="text-sm text-[#7b7b78] dark:text-[#a1a1aa] mt-1 max-w-xs mx-auto">
                Start recording your first financial transaction to see it here.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-[#f5f1ec] dark:bg-[#09090b] border-[#d3cec6] dark:border-[#27272a]">
                  <TableHead className="w-[150px] font-bold text-[#111111] dark:text-[#f4f4f5]">Number</TableHead>
                  <TableHead className="w-[150px] font-bold text-[#111111] dark:text-[#f4f4f5]">Date</TableHead>
                  <TableHead className="font-bold text-[#111111] dark:text-[#f4f4f5]">Description</TableHead>
                  <TableHead className="text-right font-bold text-[#111111] dark:text-[#f4f4f5]">Amount</TableHead>
                  <TableHead className="w-[100px] font-bold text-[#111111] dark:text-[#f4f4f5] text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => (
                  <TableRow 
                    key={entry.id} 
                    className="border-[#d3cec6] dark:border-[#27272a] hover:bg-[#f5f1ec]/50 dark:hover:bg-[#18181b]/50 cursor-pointer group"
                    onClick={() => setSelectedEntryId(entry.id)}
                  >
                    <TableCell className="font-mono text-sm font-semibold">{entry.entryNumber}</TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-2 text-[#7b7b78]" />
                        {format(new Date(entry.postingDate), 'MMM dd, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{entry.description || 'No description'}</div>
                      {entry.referenceType && (
                        <div className="text-[10px] text-[#7b7b78] flex items-center mt-0.5 uppercase">
                          <ExternalLink className="h-2 w-2 mr-1" />
                          {entry.referenceType}: {entry.referenceId}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      ${Number(entry.totalDebit).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={
                        entry.status === 'POSTED' 
                          ? 'bg-green-100 text-green-700 hover:bg-green-100 border-green-200' 
                          : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200'
                      }>
                        {entry.status}
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
