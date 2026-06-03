'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { getProfitLoss } from '@/lib/finance';
import { 
  Loader2, 
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableRow 
} from '@/components/ui/table';
import { format, startOfYear, endOfYear } from 'date-fns';

export default function ProfitLossPage() {
  const [report, setReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const startDate = format(startOfYear(new Date()), 'yyyy-MM-dd');
  const endDate = format(endOfYear(new Date()), 'yyyy-MM-dd');

  useEffect(() => {
    getProfitLoss(startDate, endDate)
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
  }, [startDate, endDate]);

  return (
    <AppShell>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#111111] dark:text-[#f4f4f5]">Profit and Loss Statement</h1>
            <p className="mt-0.5 text-sm text-[#7b7b78] dark:text-[#a1a1aa]">
              Fiscal year: {format(new Date(startDate), 'MMMM yyyy')} - {format(new Date(endDate), 'MMMM yyyy')}
            </p>
          </div>
          <Button variant="outline" onClick={() => window.print()}>
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
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
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="bg-[#f5f1ec] dark:bg-[#09090b] border-[#d3cec6] dark:border-[#27272a]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-bold uppercase tracking-widest text-[#7b7b78]">Total Income</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">${Number(report.totals.income).toLocaleString()}</div>
                </CardContent>
              </Card>
              <Card className="bg-[#f5f1ec] dark:bg-[#09090b] border-[#d3cec6] dark:border-[#27272a]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-bold uppercase tracking-widest text-[#7b7b78]">Total Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">${Number(report.totals.expenses).toLocaleString()}</div>
                </CardContent>
              </Card>
              <Card className="bg-[#111111] dark:bg-[#f4f4f5] text-white dark:text-[#111111]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-bold uppercase tracking-widest opacity-70">Net Profit</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${Number(report.totals.netProfit).toLocaleString()}</div>
                </CardContent>
              </Card>
            </div>

            {/* Income Section */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold border-b pb-2">Operating Income</h3>
              <Table>
                <TableBody>
                  {report.income.length > 0 ? report.income.map((item: any, i: number) => (
                    <TableRow key={i} className="hover:bg-transparent border-none">
                      <TableCell className="py-2">{item.name}</TableCell>
                      <TableCell className="text-right py-2 font-mono">${Number(item.amount).toLocaleString()}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow className="hover:bg-transparent border-none">
                      <TableCell className="py-2 text-[#7b7b78] italic">No income recorded</TableCell>
                      <TableCell className="text-right py-2 font-mono">$0.00</TableCell>
                    </TableRow>
                  )}
                  <TableRow className="border-t-2 font-bold bg-[#f5f1ec]/30">
                    <TableCell className="py-3">Total Operating Income</TableCell>
                    <TableCell className="text-right py-3 font-mono">${Number(report.totals.income).toLocaleString()}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Expenses Section */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold border-b pb-2">Operating Expenses</h3>
              <Table>
                <TableBody>
                  {report.expenses.length > 0 ? report.expenses.map((item: any, i: number) => (
                    <TableRow key={i} className="hover:bg-transparent border-none">
                      <TableCell className="py-2">{item.name}</TableCell>
                      <TableCell className="text-right py-2 font-mono">${Number(item.amount).toLocaleString()}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow className="hover:bg-transparent border-none">
                      <TableCell className="py-2 text-[#7b7b78] italic">No expenses recorded</TableCell>
                      <TableCell className="text-right py-2 font-mono">$0.00</TableCell>
                    </TableRow>
                  )}
                  <TableRow className="border-t-2 font-bold bg-[#f5f1ec]/30">
                    <TableCell className="py-3">Total Operating Expenses</TableCell>
                    <TableCell className="text-right py-3 font-mono">${Number(report.totals.expenses).toLocaleString()}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Bottom Line */}
            <div className="flex justify-between items-center p-6 bg-[#111111] dark:bg-[#f4f4f5] text-white dark:text-[#111111] rounded-xl mt-12">
              <div className="text-xl font-bold uppercase tracking-wider">Net Profit / Loss</div>
              <div className="text-3xl font-bold font-mono">
                ${Number(report.totals.netProfit).toLocaleString()}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
