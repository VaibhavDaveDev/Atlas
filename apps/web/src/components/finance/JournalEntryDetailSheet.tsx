'use client';

import { useState, useEffect } from 'react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from '@/components/ui/sheet';
import { getJournalEntry } from '@/lib/finance';
import { Loader2, Calendar, FileText } from 'lucide-react';
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

interface JournalEntryDetailSheetProps {
  id: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JournalEntryDetailSheet({ id, open, onOpenChange }: JournalEntryDetailSheetProps) {
  const [entry, setEntry] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id && open) {
      setLoading(true);
      getJournalEntry(id)
        .then(res => {
          if (res.success) setEntry(res.data);
        })
        .finally(() => setLoading(false));
    }
  }, [id, open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[600px] overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-2 mb-2">
             <Badge className={entry?.status === 'POSTED' ? 'bg-green-100 text-green-700' : ''}>
               {entry?.status || 'Loading...'}
             </Badge>
             <span className="text-xs text-muted-foreground font-mono">{entry?.entryNumber}</span>
          </div>
          <SheetTitle>{entry?.description || 'Journal Entry'}</SheetTitle>
          <SheetDescription className="flex items-center gap-4 mt-2">
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {entry && format(new Date(entry.postingDate), 'PPP')}</span>
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : entry && (
          <div className="py-8 space-y-8">
            <div className="rounded-xl border border-[#d3cec6] dark:border-[#27272a] overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#f5f1ec] dark:bg-[#09090b] hover:bg-transparent">
                    <TableHead className="text-[#111111] dark:text-[#f4f4f5] font-bold">Account</TableHead>
                    <TableHead className="text-right text-[#111111] dark:text-[#f4f4f5] font-bold">Debit</TableHead>
                    <TableHead className="text-right text-[#111111] dark:text-[#f4f4f5] font-bold">Credit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entry.lines.map((line: any) => (
                    <TableRow key={line.id}>
                      <TableCell>
                        <div className="font-medium">{line.account.accountName}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{line.account.accountNumber}</div>
                        {line.description && <div className="text-xs mt-1 italic text-muted-foreground">{line.description}</div>}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {Number(line.debit) > 0 ? `$${Number(line.debit).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {Number(line.credit) > 0 ? `$${Number(line.credit).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-[#f5f1ec]/30 dark:bg-[#09090b]/30 font-bold">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right font-mono">
                      ${Number(entry.totalDebit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ${Number(entry.totalCredit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {entry.referenceId && (
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 flex items-start gap-3">
                <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                   <p className="text-sm font-bold text-blue-900 dark:text-blue-300">Reference: {entry.referenceType}</p>
                   <p className="text-xs text-blue-700 dark:text-blue-400">Linked to {entry.referenceType} #{entry.referenceId}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
