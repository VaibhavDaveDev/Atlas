'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { getBalanceSheet } from '@/lib/finance';
import { 
  Loader2, 
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableRow 
} from '@/components/ui/table';
import { format } from 'date-fns';

export default function BalanceSheetPage() {
  const [report, setReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getBalanceSheet()
      .then((res) => {
        if (res.success) {
          setReport(res.data);
        } else {
          setError(res.error || 'Failed to load report');
        }
      })
      .catch((err) => {
        setError(err.message || 'Failed to load report');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const renderSection = (title: string, items: any[], total: number) => (
    <div className="space-y-3">
      <h3 className="text-lg font-bold border-b pb-2">{title}</h3>
      <Table>
        <TableBody>
          {items.length > 0 ? items.map((item: any, i: number) => (
            <TableRow key={i} className="hover:bg-transparent border-none">
              <TableCell className="py-2">
                <div className="flex flex-col">
                  <span>{item.name}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{item.code}</span>
                </div>
              </TableCell>
              <TableCell className="text-right py-2 font-mono">${Number(item.balance).toLocaleString()}</TableCell>
            </TableRow>
          )) : (
            <TableRow className="hover:bg-transparent border-none">
              <TableCell className="py-2 text-[#7b7b78] italic">No {title.toLowerCase()} found</TableCell>
              <TableCell className="text-right py-2 font-mono">$0.00</TableCell>
            </TableRow>
          )}
          <TableRow className="border-t-2 font-bold bg-[#f5f1ec]/30 dark:bg-[#09090b]/30">
            <TableCell className="py-3">Total {title}</TableCell>
            <TableCell className="text-right py-3 font-mono">${Number(total).toLocaleString()}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );

  return (
    <AppShell>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#111111] dark:text-[#f4f4f5]">Balance Sheet</h1>
            <p className="mt-0.5 text-sm text-[#7b7b78] dark:text-[#a1a1aa]">
              As of {format(new Date(), 'MMMM dd, yyyy')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => {
              if (!report) return;
              const lines = ['Category,Account Name,Account Code,Balance'];
              report.assets.forEach((a: any) => lines.push(`Assets,"${a.name}","${a.code}",${a.balance}`));
              report.liabilities.forEach((a: any) => lines.push(`Liabilities,"${a.name}","${a.code}",${a.balance}`));
              report.equity.forEach((a: any) => lines.push(`Equity,"${a.name}","${a.code}",${a.balance}`));
              
              const csvContent = "data:text/csv;charset=utf-8," + lines.join("\n");
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement("a");
              link.setAttribute("href", encodedUri);
              link.setAttribute("download", `balance_sheet_${format(new Date(), 'yyyy-MM-dd')}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#7b7b78] dark:text-[#a1a1aa]" />
          </div>
        ) : error ? (
          <div className="p-8 text-center border rounded-xl border-dashed">
            <p className="text-red-500 font-medium">{error}</p>
            <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        ) : (
          <div className="grid gap-12">
            {renderSection('Assets', report.assets, report.totals.assets)}
            {renderSection('Liabilities', report.liabilities, report.totals.liabilities)}
            {renderSection('Equity', report.equity, report.totals.equity)}

            <div className="flex flex-col gap-4 mt-8 p-6 bg-[#f5f1ec] dark:bg-[#09090b] rounded-xl border border-[#d3cec6] dark:border-[#27272a]">
              <div className="flex justify-between items-center">
                <div className="text-lg font-bold">Total Assets</div>
                <div className="text-2xl font-bold font-mono">${Number(report.totals.assets).toLocaleString()}</div>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <div className="text-lg font-bold">Total Liabilities & Equity</div>
                <div className="text-2xl font-bold font-mono">${(Number(report.totals.liabilities) + Number(report.totals.equity)).toLocaleString()}</div>
              </div>
              {Math.abs(Number(report.totals.assets) - (Number(report.totals.liabilities) + Number(report.totals.equity))) > 0.01 && (
                <div className="mt-2 text-xs text-red-500 font-bold uppercase tracking-widest flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  Ledger Unbalanced
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
