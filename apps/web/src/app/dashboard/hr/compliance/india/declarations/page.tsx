'use client';

import { useEffect, useState } from 'react';
import { Landmark, Search, Filter, CheckCircle2, XCircle, Clock, MoreVertical, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { AppShell } from '@/components/layout/AppShell';
import { getAllTaxDeclarations, updateTaxDeclarationStatus } from '@/lib/hr';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function HrTaxDeclarationsPage() {
  const [declarations, setDeclarations] = useState<any[]>([]);
  const [filteredDeclarations, setFilteredDeclarations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  async function fetchData() {
    setLoading(true);
    try {
      const res = await getAllTaxDeclarations();
      const dataArray = res?.data ? res.data : (Array.isArray(res) ? res : []);
      setDeclarations(dataArray);
      setFilteredDeclarations(dataArray);
    } catch (error) {
      console.error('Failed to fetch tax declarations', error);
      toast.error('Failed to load declarations');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = [...declarations];
    
    if (searchQuery) {
      filtered = filtered.filter(d => 
        d.employee.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.employee.employeeNumber.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(d => d.status === statusFilter);
    }
    
    setFilteredDeclarations(filtered);
  }, [declarations, searchQuery, statusFilter]);

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await updateTaxDeclarationStatus(id, status);
      toast.success(`Declaration ${status.toLowerCase()}ed successfully`);
      fetchData();
    } catch (error) {
      toast.error('Error updating status');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-none shadow-none text-[9px] font-bold uppercase">Submitted</Badge>;
      case 'APPROVED':
        return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-none shadow-none text-[9px] font-bold uppercase">Approved</Badge>;
      case 'REJECTED':
        return <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-none shadow-none text-[9px] font-bold uppercase">Rejected</Badge>;
      default:
        return <Badge variant="outline" className="text-[9px] font-bold uppercase">{status}</Badge>;
    }
  };

  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-[#111111] dark:text-[#f4f4f5]">Tax Exemption Declarations</h1>
            <p className="text-sm text-[#626260] dark:text-[#a1a1aa]">Review and verify investment proof declarations for Indian Income Tax compliance.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="border-[#d3cec6] dark:border-[#27272a] h-9 text-xs" onClick={fetchData}>
              Refresh List
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 bg-[#f5f1ec]/50 dark:bg-[#121214] p-4 rounded-2xl border border-[#d3cec6] dark:border-[#27272a]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7b7b78]" />
            <Input 
              placeholder="Search employee name or ID..." 
              className="pl-10 bg-white dark:bg-[#09090b] border-[#d3cec6] dark:border-[#27272a] h-10 text-sm"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] bg-white dark:bg-[#09090b] border-[#d3cec6] dark:border-[#27272a] h-10 text-sm font-medium">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-[#121214] border-[#d3cec6] dark:border-[#27272a]">
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="SUBMITTED">Submitted</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card className="border-[#d3cec6] dark:border-[#27272a] shadow-none bg-white dark:bg-[#121214] overflow-hidden">
          <CardHeader className="bg-[#f5f1ec]/30 dark:bg-[#121214]/50 border-b border-[#d3cec6] dark:border-[#27272a] py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7b7b78]">Declaration List</CardTitle>
              <Badge variant="outline" className="text-[10px] font-bold">{filteredDeclarations.length} total</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-[#d3cec6] dark:border-[#27272a]">
                    <TableHead className="w-[250px] text-[10px] font-bold uppercase tracking-widest text-[#7b7b78] h-11 px-6">Employee</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-[#7b7b78] h-11 px-6">Monthly Rent</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-[#7b7b78] h-11 px-6">80C Investments</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-[#7b7b78] h-11 px-6">Submission Date</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-[#7b7b78] h-11 px-6 text-center">Status</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-[#7b7b78] h-11 px-6 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-40 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                          <p className="text-xs font-bold uppercase tracking-widest text-[#7b7b78]">Syncing Declarations...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredDeclarations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-40 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Landmark className="h-8 w-8 text-[#d3cec6] dark:text-[#27272a]" />
                          <p className="text-sm font-medium text-[#626260]">No declarations found matching filters</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDeclarations.map((dec) => (
                      <TableRow key={dec.id} className="hover:bg-[#f5f1ec]/20 dark:hover:bg-white/5 transition-colors border-[#d3cec6] dark:border-[#27272a]">
                        <TableCell className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-[#111111] dark:text-[#f4f4f5] text-sm">{dec.employee.fullName}</span>
                            <span className="text-[10px] font-bold text-[#7b7b78] uppercase tracking-wider">{dec.employee.employeeNumber}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <span className="font-bold text-[#111111] dark:text-[#f4f4f5]">₹{Number(dec.monthlyHouseRent).toLocaleString()}</span>
                          <span className="text-[10px] block text-[#7b7b78] font-bold uppercase">{dec.rentedInMetroCity ? 'Metro' : 'Non-Metro'}</span>
                        </TableCell>
                        <TableCell className="px-6 py-4 font-bold text-[#111111] dark:text-[#f4f4f5]">
                          ₹{Number(dec.declarations?.section80C || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-xs font-medium text-[#626260] dark:text-[#a1a1aa]">
                          {new Date(dec.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-center">
                          {getStatusBadge(dec.status)}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-right">
                          {dec.status === 'SUBMITTED' ? (
                            <div className="flex justify-end gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-7 text-[10px] font-bold uppercase border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                                onClick={() => handleStatusUpdate(dec.id, 'APPROVED')}
                              >
                                Approve
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-7 text-[10px] font-bold uppercase border-rose-500/30 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                                onClick={() => handleStatusUpdate(dec.id, 'REJECTED')}
                              >
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-[#7b7b78]">
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
