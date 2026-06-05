'use client';

import { AppShell } from '@/components/layout/AppShell';
import {
  Landmark,
  FileText,
  TrendingUp,
  Receipt,
  Wallet,
  ArrowRight,
  TrendingDown,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import Link from 'next/link';
import { getDashboardStats } from '@/lib/finance';
import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { MonthEndCloseSheet } from '@/components/finance/MonthEndCloseSheet';
import { FinanceSetupWizard } from '@/components/finance/FinanceSetupWizard';
import { useAuth } from '@/contexts/AuthContext';
import { workspaceApi } from '@/lib/workspace';

// ─── Currency helpers ────────────────────────────────────────────────────────

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AED: 'AED',
  SGD: 'S$',
  AUD: 'A$',
  JPY: '¥',
};

function getCurrencySymbol(code?: string | null): string {
  return code ? (CURRENCY_SYMBOLS[code.toUpperCase()] ?? code) : '₹';
}

function formatAmount(value: number, symbol: string): string {
  if (Math.abs(value) >= 1_00_00_000) {
    return `${symbol}${(value / 1_00_00_000).toFixed(1)}Cr`;
  }
  if (Math.abs(value) >= 1_00_000) {
    return `${symbol}${(value / 1_00_000).toFixed(1)}L`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${symbol}${(value / 1_000).toFixed(1)}k`;
  }
  return `${symbol}${value.toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
}

// ─── Custom Tooltip ──────────────────────────────────────────────────────────

function CustomTooltip({
  active,
  payload,
  label,
  currencySymbol,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
  currencySymbol: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-xl border border-[#d3cec6] dark:border-[#27272a] bg-white dark:bg-[#121214] px-4 py-3 shadow-lg text-xs">
      <p className="font-bold text-[#111111] dark:text-[#f4f4f5] mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <div className="h-2 w-2 rounded-sm" style={{ background: p.fill || p.color }} />
          <span className="text-[#626260] dark:text-[#a1a1aa]">{p.name}:</span>
          <span className="font-semibold text-[#111111] dark:text-[#f4f4f5]">
            {currencySymbol}{(p.value as number).toLocaleString('en-IN')}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function FinanceDashboardPage() {
  const { workspace } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isClosingOpen, setIsClosingOpen] = useState(false);
  const [isSetupCompleted, setIsSetupCompleted] = useState<boolean | null>(null);
  const [baseCurrency, setBaseCurrency] = useState<string>('INR');

  const fetchStats = async () => {
    setLoading(true);
    try {
      if (!workspace) return;

      const res = await workspaceApi.getWorkspace(workspace.workspaceId);
      const wsData = res.data || res;
      const setupDone = wsData.settings?.financeSetupCompleted;
      const currency = wsData.settings?.baseCurrency || 'INR';
      setBaseCurrency(currency);
      setIsSetupCompleted(!!setupDone);

      if (setupDone) {
        const statsRes = await getDashboardStats();
        if (statsRes.success) setStats(statsRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch finance dashboard stats', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [workspace]);

  const kpis = stats?.kpis || { totalRevenue: 0, netProfit: 0, overdueInvoices: 0, treasury: 0 };
  const chartData = stats?.chartData || [];
  const recentActivity = stats?.recentActivity || [];
  const currencySymbol = getCurrencySymbol(baseCurrency);

  if (loading && isSetupCompleted === null) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  if (isSetupCompleted === false) {
    return (
      <AppShell>
        <FinanceSetupWizard onSuccess={fetchStats} />
      </AppShell>
    );
  }

  const isProfit = kpis.netProfit >= 0;

  return (
    <AppShell>
      <div className="flex flex-col gap-6 p-4 md:p-8 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#7b7b78] dark:text-[#71717a]">
                Finance
              </p>
              <span className="h-1 w-1 rounded-full bg-[#d3cec6] dark:bg-[#27272a]" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#7b7b78] dark:text-[#71717a]">
                {baseCurrency}
              </p>
            </div>
            <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[#111111] dark:text-[#f4f4f5]">
              Financial Overview
            </h1>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Link href="/dashboard/finance/journals?new=true">
              <Button variant="outline" className="h-9 text-xs border-[#d3cec6] dark:border-[#27272a]">
                Record Journal Entry
              </Button>
            </Link>
            <Link href="/dashboard/finance/invoices?new=true">
              <Button className="h-9 text-xs bg-[#111111] dark:bg-[#f4f4f5] text-white dark:text-[#111111] hover:bg-[#222222] dark:hover:bg-[#e4e4e7]">
                Create Invoice
              </Button>
            </Link>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Total Revenue',
              value: kpis.totalRevenue,
              icon: TrendingUp,
              color: 'text-emerald-600 dark:text-emerald-400',
              accent: 'border-l-emerald-500',
              positive: true,
            },
            {
              label: 'Net Profit',
              value: kpis.netProfit,
              icon: isProfit ? TrendingUp : TrendingDown,
              color: isProfit
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-rose-600 dark:text-rose-400',
              accent: isProfit ? 'border-l-blue-500' : 'border-l-rose-500',
              positive: isProfit,
            },
            {
              label: 'Overdue AR',
              value: kpis.overdueInvoices,
              icon: Receipt,
              color: 'text-amber-600 dark:text-amber-400',
              accent: 'border-l-amber-500',
              positive: kpis.overdueInvoices === 0,
              isCount: true,
            },
            {
              label: 'Treasury',
              value: kpis.treasury,
              icon: Landmark,
              color: 'text-violet-600 dark:text-violet-400',
              accent: 'border-l-violet-500',
              positive: true,
            },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className={`rounded-xl border border-[#d3cec6] dark:border-[#27272a] border-l-2 ${kpi.accent} bg-[#ffffff] dark:bg-[#121214] p-5 shadow-none`}
            >
              <div className="flex items-start justify-between mb-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#7b7b78] dark:text-[#71717a]">
                  {kpi.label}
                </p>
                <kpi.icon className={`h-4 w-4 shrink-0 ${kpi.color}`} />
              </div>
              <p className="text-2xl font-semibold tracking-[-0.03em] text-[#111111] dark:text-[#f4f4f5] font-mono">
                {kpi.isCount
                  ? kpi.value
                  : formatAmount(kpi.value, currencySymbol)}
              </p>
              <p className={`text-[10px] font-bold uppercase tracking-wide mt-1 ${kpi.color}`}>
                {kpi.isCount
                  ? kpi.value === 0 ? 'All clear' : 'Needs attention'
                  : 'Live from GL'}
              </p>
            </div>
          ))}
        </div>

        {/* Chart + Activity */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Bar Chart */}
          <Card className="lg:col-span-8 border-[#d3cec6] dark:border-[#27272a] shadow-none bg-[#ffffff] dark:bg-[#121214]">
            <CardHeader className="pb-0 px-6 pt-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm font-semibold tracking-tight text-[#111111] dark:text-[#f4f4f5]">
                    Income vs Expenditure
                  </CardTitle>
                  <CardDescription className="text-[11px] mt-0.5">
                    Monthly comparison · {baseCurrency}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#626260] dark:text-[#a1a1aa]">
                    <div className="h-2.5 w-2.5 rounded-sm bg-[#111111] dark:bg-[#f4f4f5]" />
                    Income
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#626260] dark:text-[#a1a1aa]">
                    <div className="h-2.5 w-2.5 rounded-sm bg-[#d3cec6] dark:bg-[#27272a]" />
                    Expenditure
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 px-2 sm:px-4">
              <div className="h-[280px] sm:h-[320px] w-full">
                {loading ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-[#7b7b78]" />
                  </div>
                ) : chartData.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center gap-2 text-center">
                    <div className="h-12 w-12 rounded-xl border border-[#d3cec6] dark:border-[#27272a] bg-[#f5f1ec] dark:bg-[#09090b] flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-[#7b7b78]" />
                    </div>
                    <p className="text-xs font-semibold text-[#111111] dark:text-[#f4f4f5]">
                      No transactions yet
                    </p>
                    <p className="text-[11px] text-[#626260] dark:text-[#a1a1aa] max-w-[200px] leading-relaxed">
                      Record journal entries or create invoices to see your financial trend.
                    </p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      barGap={4}
                      barCategoryGap="35%"
                      margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid
                        vertical={false}
                        stroke="currentColor"
                        className="text-[#f5f1ec] dark:text-[#1a1a1e]"
                        strokeWidth={1}
                      />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fontSize: 11,
                          fill: 'currentColor',
                          className: 'fill-[#7b7b78] dark:fill-[#71717a]',
                        }}
                        dy={8}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fontSize: 11,
                          fill: 'currentColor',
                          className: 'fill-[#7b7b78] dark:fill-[#71717a]',
                        }}
                        tickFormatter={(v: number) => formatAmount(v, currencySymbol)}
                        width={60}
                      />
                      <Tooltip
                        content={<CustomTooltip currencySymbol={currencySymbol} />}
                        cursor={{ fill: 'transparent' }}
                      />
                      <Bar
                        dataKey="revenue"
                        name="Income"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={32}
                      >
                        {chartData.map((_: any, index: number) => (
                          <Cell
                            key={`rev-${index}`}
                            fill="currentColor"
                            className="fill-[#111111] dark:fill-[#f4f4f5]"
                          />
                        ))}
                      </Bar>
                      <Bar
                        dataKey="expenses"
                        name="Expenditure"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={32}
                      >
                        {chartData.map((_: any, index: number) => (
                          <Cell
                            key={`exp-${index}`}
                            fill="currentColor"
                            className="fill-[#d3cec6] dark:fill-[#27272a]"
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Ledger Activity */}
          <Card className="lg:col-span-4 border-[#d3cec6] dark:border-[#27272a] shadow-none bg-[#ffffff] dark:bg-[#121214]">
            <CardHeader className="pb-3 px-5 pt-5 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold tracking-tight text-[#111111] dark:text-[#f4f4f5]">
                Recent Activity
              </CardTitle>
              <Link href="/dashboard/finance/journals">
                <Button variant="ghost" size="sm" className="text-[10px] h-7 font-bold uppercase tracking-wider text-[#7b7b78]">
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="px-5">
              <div className="space-y-4">
                {recentActivity.length === 0 && !loading && (
                  <div className="py-10 text-center">
                    <p className="text-xs text-[#626260] dark:text-[#a1a1aa] italic">
                      No recent activity
                    </p>
                  </div>
                )}
                {recentActivity.map((item: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between cursor-pointer group"
                    onClick={() => (window.location.href = `/dashboard/finance/journals`)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 shrink-0 rounded-lg border border-[#d3cec6] dark:border-[#27272a] bg-[#f5f1ec] dark:bg-[#09090b] flex items-center justify-center">
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#111111] dark:text-[#f4f4f5] truncate">
                          {item.name}
                        </p>
                        <p className="text-[10px] text-[#7b7b78] dark:text-[#71717a] uppercase font-bold tracking-wider">
                          {item.type} · {formatDistanceToNow(new Date(item.date))} ago
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-xs font-mono font-bold text-[#111111] dark:text-[#f4f4f5]">
                        {item.amount}
                      </p>
                      <p className="text-[10px] text-[#7b7b78] dark:text-[#71717a]">{item.status}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-xl bg-[#f5f1ec] dark:bg-[#09090b] p-4 border border-[#d3cec6] dark:border-[#27272a]">
                <h4 className="text-xs font-semibold text-[#111111] dark:text-[#f4f4f5] mb-1">
                  Month-end Close
                </h4>
                <p className="text-[11px] text-[#626260] dark:text-[#a1a1aa] mb-3 leading-relaxed">
                  Maintain strict period control and reconciliation.
                </p>
                <Button
                  className="w-full bg-[#111111] dark:bg-[#f4f4f5] text-white dark:text-[#111111] text-xs h-9 hover:bg-[#222222] dark:hover:bg-[#e4e4e7]"
                  onClick={() => setIsClosingOpen(true)}
                >
                  Start Closing Flow
                  <ArrowRight className="ml-2 h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Access */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              href: '/dashboard/finance/accounts',
              icon: Landmark,
              label: 'Chart of Accounts',
              desc: 'Ledger hierarchy & real-time balances',
            },
            {
              href: '/dashboard/finance/reports/profit-loss',
              icon: FileText,
              label: 'P&L & Balance Sheet',
              desc: 'Generate reports instantly',
            },
            {
              href: '/dashboard/finance/reports/cash-flow',
              icon: TrendingUp,
              label: 'Cash Flow',
              desc: 'Monitor inflows and outflows',
            },
            {
              href: '/dashboard/finance/payments',
              icon: Wallet,
              label: 'Treasury & Bank',
              desc: 'Reconciliation and payments',
            },
          ].map((item) => (
            <Link key={item.label} href={item.href} className="block group">
              <div className="h-full rounded-xl border border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] p-4 shadow-none hover:border-[#111111] dark:hover:border-[#f4f4f5] transition-all">
                <div className="h-8 w-8 rounded-lg border border-[#d3cec6] dark:border-[#27272a] bg-[#f5f1ec] dark:bg-[#09090b] flex items-center justify-center mb-3 shadow-sm">
                  <item.icon className="h-4 w-4 text-[#111111] dark:text-[#f4f4f5]" />
                </div>
                <p className="text-xs font-semibold text-[#111111] dark:text-[#f4f4f5] tracking-tight group-hover:text-[#4f46e5] transition-colors">
                  {item.label}
                </p>
                <p className="text-[11px] text-[#626260] dark:text-[#a1a1aa] mt-1 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <MonthEndCloseSheet
          open={isClosingOpen}
          onOpenChange={setIsClosingOpen}
          onSuccess={fetchStats}
        />
      </div>
    </AppShell>
  );
}
