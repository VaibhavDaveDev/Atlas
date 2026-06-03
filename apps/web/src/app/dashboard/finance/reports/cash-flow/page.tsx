'use client';

import { AppShell } from '@/components/layout/AppShell';
import { useState, useEffect } from 'react';
import { getCashFlow } from '@/lib/finance';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, ArrowLeft, Download, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { toast } from 'sonner';
import Link from 'next/link';

export default function CashFlowPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await getCashFlow(startDate, endDate);
      if (res.success) setData(res.data);
    } catch (e) {
      toast.error('Failed to load cash flow statement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  return (
    <AppShell>
      <div className="p-8 max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <Link href="/dashboard/finance" className="text-xs text-muted-foreground flex items-center gap-1 hover:text-primary transition-colors mb-2">
              <ArrowLeft className="h-3 w-3" />
              Back to Finance
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Cash Flow Statement</h1>
            <p className="text-muted-foreground">Analysis of cash inflows and outflows for a specific period.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-white dark:bg-[#121214] p-1 rounded-lg border border-[#d3cec6] dark:border-[#27272a]">
              <Input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                className="border-none h-8 text-xs w-32"
              />
              <span className="text-muted-foreground text-xs">to</span>
              <Input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                className="border-none h-8 text-xs w-32"
              />
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={fetchReport}>
                <TrendingUp className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm" className="h-10">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="h-[400px] flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-[#d3cec6] dark:border-[#27272a]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Operating</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-mono font-bold">${data?.operating?.toLocaleString() || '0.00'}</div>
                </CardContent>
              </Card>
              <Card className="border-[#d3cec6] dark:border-[#27272a]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Investing</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-mono font-bold">${data?.investing?.toLocaleString() || '0.00'}</div>
                </CardContent>
              </Card>
              <Card className="border-[#d3cec6] dark:border-[#27272a]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Financing</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-mono font-bold">${data?.financing?.toLocaleString() || '0.00'}</div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-[#d3cec6] dark:border-[#27272a] overflow-hidden">
              <CardHeader className="bg-[#f5f1ec] dark:bg-[#09090b] border-b border-[#d3cec6] dark:border-[#27272a]">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  Cash Flow Breakdown
                </CardTitle>
                <CardDescription>Categorized summary of cash movements</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-[#d3cec6] dark:divide-[#27272a]">
                  <div className="p-4 flex justify-between items-center bg-muted/30">
                    <span className="font-bold">Net Cash from Operating Activities</span>
                    <span className={data?.operating >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {data?.operating >= 0 ? <TrendingUp className="inline mr-1 h-4 w-4" /> : <TrendingDown className="inline mr-1 h-4 w-4" />}
                      ${Math.abs(data?.operating || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="p-4 flex justify-between items-center">
                    <span className="font-bold text-muted-foreground">Net Cash from Investing Activities</span>
                    <span className={data?.investing >= 0 ? 'text-green-600' : 'text-red-600'}>
                      ${data?.investing?.toLocaleString() || '0.00'}
                    </span>
                  </div>
                  <div className="p-4 flex justify-between items-center">
                    <span className="font-bold text-muted-foreground">Net Cash from Financing Activities</span>
                    <span className={data?.financing >= 0 ? 'text-green-600' : 'text-red-600'}>
                      ${data?.financing?.toLocaleString() || '0.00'}
                    </span>
                  </div>
                  <div className="p-6 flex justify-between items-center bg-[#111111] dark:bg-[#f4f4f5] text-white dark:text-[#111111]">
                    <span className="text-lg font-bold uppercase tracking-wider">Net Cash Flow</span>
                    <span className="text-2xl font-mono font-bold">
                      ${data?.netCashFlow?.toLocaleString() || '0.00'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}
