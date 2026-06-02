'use client';

import { useEffect, useState, useMemo } from 'react';
import { Briefcase, Download, Eye, FileText, Search } from 'lucide-react';
import { getMyPayslips, getMyProfile } from '@/lib/ess';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Payslip {
  id: string;
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  basicSalary: number;
  status: string;
  payrollRun: {
    periodStart: string;
    paymentDate: string;
  };
}

interface Profile {
  fullName: string;
  employeeNumber: string;
  designation?: { title: string };
}

export default function EssPayslipsPage() {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [payslipsData, profileData] = await Promise.all([
          getMyPayslips(),
          getMyProfile()
        ]);
        setPayslips(payslipsData || []);
        setProfile(profileData);
      } catch (error) {
        console.error('Failed to fetch data', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const getMonthYear = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      month: 'long',
      year: 'numeric',
    });
  };

  const filteredPayslips = useMemo(() => {
    if (!searchQuery) return payslips;
    return payslips.filter((p) =>
      getMonthYear(p.payrollRun.periodStart).toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [payslips, searchQuery]);

  const handleDownloadPDF = async (payslip: Payslip) => {
    setDownloading(true);
    try {
      // Create an off-screen element to capture
      const el = document.getElementById(`payslip-content-${payslip.id}`);
      if (!el) return;
      
      const canvas = await html2canvas(el, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`Payslip_${getMonthYear(payslip.payrollRun.periodStart).replace(' ', '_')}.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF', error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111111] dark:text-[#f4f4f5] flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-violet-500" /> My Payslips
          </h1>
          <p className="text-sm text-[#626260] dark:text-[#a1a1aa] mt-1">
            View and download your monthly salary statements.
          </p>
        </div>
      </div>

      <Card className="border-[#d3cec6] dark:border-[#27272a] shadow-none overflow-hidden">
        <CardHeader className="bg-[#f5f1ec]/50 dark:bg-[#09090b]/50 border-b border-[#d3cec6] dark:border-[#27272a] px-6 py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-[#7b7b78]">Historical Payslips</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#7b7b78]" />
              <Input
                placeholder="Search by month (e.g. May 2026)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white dark:bg-[#121214] border-[#d3cec6] dark:border-[#27272a] h-9 text-xs"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-[#f5f1ec]/30 dark:bg-[#09090b]/30">
              <TableRow className="border-[#d3cec6] dark:border-[#27272a] hover:bg-transparent">
                <TableHead className="w-[180px] font-bold text-[#111111] dark:text-[#f4f4f5] py-4">Period</TableHead>
                <TableHead className="font-bold text-[#111111] dark:text-[#f4f4f5]">Gross Salary</TableHead>
                <TableHead className="font-bold text-[#111111] dark:text-[#f4f4f5]">Deductions</TableHead>
                <TableHead className="font-bold text-[#111111] dark:text-[#f4f4f5]">Net Payout</TableHead>
                <TableHead className="font-bold text-[#111111] dark:text-[#f4f4f5]">Status</TableHead>
                <TableHead className="text-right font-bold text-[#111111] dark:text-[#f4f4f5]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-[#d3cec6] dark:border-[#27272a]">
                    <TableCell colSpan={6} className="h-12 animate-pulse bg-muted/20" />
                  </TableRow>
                ))
              ) : filteredPayslips.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-[#626260] dark:text-[#a1a1aa]">
                    No payslips found matching your search.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayslips.map((payslip) => (
                  <TableRow key={payslip.id} className="border-[#d3cec6] dark:border-[#27272a] hover:bg-[#f5f1ec]/50 dark:hover:bg-[#121214]/50 transition-colors">
                    <TableCell className="font-bold py-4">
                      {getMonthYear(payslip.payrollRun.periodStart)}
                    </TableCell>
                    <TableCell className="text-[#626260] dark:text-[#a1a1aa] font-mono">
                      {formatCurrency(Number(payslip.grossSalary))}
                    </TableCell>
                    <TableCell className="text-rose-600 font-mono">
                      -{formatCurrency(Number(payslip.totalDeductions))}
                    </TableCell>
                    <TableCell className="font-bold text-emerald-600 font-mono">
                      {formatCurrency(Number(payslip.netSalary))}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-none uppercase text-[9px] font-bold tracking-widest">
                        {payslip.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="icon" className="h-8 w-8 border-[#d3cec6]" onClick={() => setSelectedPayslip(payslip)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl bg-white dark:bg-[#09090b] border-[#d3cec6] dark:border-[#27272a]">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-blue-500" />
                                Payslip - {selectedPayslip && getMonthYear(selectedPayslip.payrollRun.periodStart)}
                              </DialogTitle>
                            </DialogHeader>
                            {selectedPayslip && (
                              <div className="space-y-6 pt-4" id={`payslip-content-${selectedPayslip.id}`}>
                                <div className="grid grid-cols-2 gap-4 border-b border-[#f5f1ec] pb-4">
                                  <div>
                                    <p className="text-[10px] font-bold uppercase text-[#7b7b78]">Employee</p>
                                    <p className="text-sm font-bold">{profile?.fullName || 'N/A'}</p>
                                    <p className="text-xs text-[#626260]">{profile?.employeeNumber} • {profile?.designation?.title || 'Employee'}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-[10px] font-bold uppercase text-[#7b7b78]">Payout Date</p>
                                    <p className="text-sm font-bold">{new Date(selectedPayslip.payrollRun.paymentDate).toLocaleDateString()}</p>
                                    <p className="text-xs text-emerald-600 font-bold uppercase tracking-widest">Paid</p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                  {/* Earnings */}
                                  <div className="space-y-2">
                                    <p className="text-[10px] font-bold uppercase text-emerald-600 tracking-widest">Earnings</p>
                                    <div className="space-y-1 text-sm">
                                      <div className="flex justify-between">
                                        <span>Basic Salary</span>
                                        <span className="font-mono">{formatCurrency(Number(selectedPayslip.basicSalary))}</span>
                                      </div>
                                      <div className="flex justify-between font-bold pt-2 border-t mt-2">
                                        <span>Total Gross</span>
                                        <span className="font-mono text-blue-600">{formatCurrency(Number(selectedPayslip.grossSalary))}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Deductions */}
                                  <div className="space-y-2">
                                    <p className="text-[10px] font-bold uppercase text-rose-600 tracking-widest">Deductions</p>
                                    <div className="space-y-1 text-sm">
                                      <div className="flex justify-between text-rose-600/80">
                                        <span>Statutory Deductions</span>
                                        <span className="font-mono">{formatCurrency(Number(selectedPayslip.totalDeductions))}</span>
                                      </div>
                                      <div className="flex justify-between font-bold pt-2 border-t mt-2">
                                        <span>Total Deductions</span>
                                        <span className="font-mono text-rose-600">{formatCurrency(Number(selectedPayslip.totalDeductions))}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="bg-[#f5f1ec] dark:bg-[#121214] p-4 rounded-xl border border-[#d3cec6] dark:border-[#27272a] flex items-center justify-between">
                                  <div>
                                    <p className="text-[10px] font-bold uppercase text-[#7b7b78]">Net Payout</p>
                                    <p className="text-2xl font-bold font-mono text-emerald-600">{formatCurrency(Number(selectedPayslip.netSalary))}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                            <div className="flex justify-end pt-4 border-t border-[#d3cec6] dark:border-[#27272a]">
                               <Button 
                                  onClick={() => selectedPayslip && handleDownloadPDF(selectedPayslip)} 
                                  className="bg-[#111111] dark:bg-[#f4f4f5] text-white dark:text-[#111111] hover:opacity-90"
                                  disabled={downloading}
                               >
                                 <Download className="mr-2 h-4 w-4" /> {downloading ? 'Generating...' : 'Download PDF'}
                               </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button variant="outline" size="icon" className="h-8 w-8 border-[#d3cec6]" onClick={() => handleDownloadPDF(payslip)} disabled={downloading}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
