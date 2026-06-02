'use client';

import { useEffect, useState } from 'react';
import { Calendar, Plus, Info, XCircle } from 'lucide-react';
import { getMyLeaves, getMyLeaveBalances, applyLeave, getEssLeaveTypes, cancelLeave } from '@/lib/ess';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useMediaQuery } from '@/hooks/use-media-query';

interface LeaveApplication {
  id: string;
  leaveType: { name: string };
  fromDate: string;
  toDate: string;
  totalDays: number;
  reason: string;
  status: string;
  createdAt: string;
}

interface LeaveBalance {
  leaveType: string;
  balance: number;
}

interface LeaveType {
  id: string;
  name: string;
}

export default function EssLeavesPage() {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);

  // Form State
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [leavesData, balancesData] = await Promise.all([
        getMyLeaves(),
        getMyLeaveBalances()
      ]);
      setLeaves(leavesData || []);
      setBalances(balancesData || []);
      
      try {
        const typesRes = await getEssLeaveTypes();
        setLeaveTypes(typesRes || []);
      } catch (err) {
        console.warn('Could not fetch leave types', err);
        setLeaveTypes([
          { id: '1', name: 'Annual Leave' },
          { id: '2', name: 'Sick Leave' },
          { id: '3', name: 'Casual Leave' }
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch leave data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const start = new Date(fromDate);
    const end = new Date(toDate);
    if (start > end) {
      toast.error('From Date cannot be after To Date');
      return;
    }

    setSubmitting(true);
    try {
      const res = await applyLeave({ leaveTypeId, fromDate, toDate, reason });
      if (res.id) {
        toast.success('Leave application submitted successfully');
        setIsApplying(false);
        setLeaveTypeId('');
        setFromDate('');
        setToDate('');
        setReason('');
        fetchData();
      } else {
        toast.error(res.message || 'Failed to submit leave application');
      }
    } catch (error) {
      toast.error('An error occurred while submitting leave');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this leave application?')) return;
    try {
      await cancelLeave(id);
      toast.success('Leave cancelled successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to cancel leave');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-none">Approved</Badge>;
      case 'REJECTED':
        return <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/20 shadow-none">Rejected</Badge>;
      case 'PENDING':
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 shadow-none">Pending</Badge>;
      case 'CANCELLED':
        return <Badge variant="outline" className="text-gray-500 shadow-none">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111111] dark:text-[#f4f4f5] flex items-center gap-2">
            <Calendar className="h-6 w-6 text-emerald-500" /> Leave Management
          </h1>
          <p className="text-sm text-[#626260] dark:text-[#a1a1aa] mt-1">
            Apply for time off and track your leave balances and requests.
          </p>
        </div>
        {!isApplying && (
          <Button onClick={() => setIsApplying(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
            <Plus className="mr-2 h-4 w-4" /> Apply for Leave
          </Button>
        )}
      </div>

      {/* Leave Balances Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-muted/20 animate-pulse border border-[#d3cec6] dark:border-[#27272a]" />
          ))
        ) : balances.length === 0 ? (
          <div className="col-span-full p-6 text-center border-2 border-dashed rounded-xl text-[#626260]">
            No leave balances allocated yet.
          </div>
        ) : (
          balances.map((bal, i) => (
            <Card key={i} className="border-[#d3cec6] dark:border-[#27272a] shadow-none bg-white dark:bg-[#121214]">
              <CardContent className="pt-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#7b7b78]">{bal.leaveType}</p>
                <div className="flex items-end justify-between mt-2">
                  <p className="text-2xl font-bold">{bal.balance} <span className="text-xs font-normal text-[#626260]">Days</span></p>
                  <Info className="h-4 w-4 text-[#d3cec6]" />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {isApplying && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          {/* Desktop: Inline Card */}
          <div className="hidden md:block">
            <Card className="border-[#d3cec6] dark:border-[#27272a] shadow-sm overflow-hidden bg-white dark:bg-[#121214] rounded-3xl">
              <CardHeader className="border-b border-[#f5f1ec] dark:border-[#27272a] px-8 py-6">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl font-bold">New Leave Application</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setIsApplying(false)} className="rounded-full">
                    <XCircle className="h-5 w-5 text-[#7b7b78]" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-2">
                      <Label htmlFor="leaveType-desktop" className="text-[10px] font-bold uppercase tracking-wider text-[#7b7b78]">Leave Type</Label>
                      <select
                        id="leaveType-desktop"
                        required
                        className="flex h-12 w-full rounded-xl border border-[#d3cec6] dark:border-[#27272a] bg-[#fcfaf8] dark:bg-white/5 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        value={leaveTypeId}
                        onChange={(e) => setLeaveTypeId(e.target.value)}
                      >
                        <option value="">Select leave type...</option>
                        {leaveTypes.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fromDate-desktop" className="text-[10px] font-bold uppercase tracking-wider text-[#7b7b78]">From Date</Label>
                      <Input
                        id="fromDate-desktop"
                        type="date"
                        required
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="h-12 rounded-xl border-[#d3cec6] dark:border-[#27272a] bg-[#fcfaf8] dark:bg-white/5"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="toDate-desktop" className="text-[10px] font-bold uppercase tracking-wider text-[#7b7b78]">To Date</Label>
                      <Input
                        id="toDate-desktop"
                        type="date"
                        required
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="h-12 rounded-xl border-[#d3cec6] dark:border-[#27272a] bg-[#fcfaf8] dark:bg-white/5"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reason-desktop" className="text-[10px] font-bold uppercase tracking-wider text-[#7b7b78]">Reason for Leave</Label>
                    <Input
                      id="reason-desktop"
                      required
                      placeholder="e.g., Family vacation, Medical checkup"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="h-12 rounded-xl border-[#d3cec6] dark:border-[#27272a] bg-[#fcfaf8] dark:bg-white/5"
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-6 border-t border-[#f5f1ec] dark:border-[#27272a]">
                    <Button type="button" variant="ghost" onClick={() => setIsApplying(false)} disabled={submitting} className="font-bold rounded-xl h-11 px-6">
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl h-11 px-10 shadow-lg transition-all" disabled={submitting}>
                      {submitting ? 'Submitting...' : 'Submit Application'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Mobile: Dialog/Modal (Actually we will just use a focused card or Dialog here too) */}
          <div className="md:hidden">
             {/* Using a Dialog for mobile as requested for that 'popup like card' feel */}
             <Dialog open={!isDesktop && isApplying} onOpenChange={setIsApplying}>
               <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden rounded-3xl border-none">
                 <div className="h-1.5 w-full bg-emerald-600" />
                 <DialogHeader className="p-6 pb-2 text-left">
                   <DialogTitle className="text-xl font-bold">Apply for Leave</DialogTitle>
                   <DialogDescription className="text-xs">Request time off from work.</DialogDescription>
                 </DialogHeader>
                 <form onSubmit={handleSubmit} className="p-6 pt-2 space-y-4">
                   <div className="space-y-4">
                     <div className="space-y-1">
                       <Label className="text-[10px] uppercase text-[#7b7b78]">Leave Type</Label>
                       <select
                         required
                         className="flex h-10 w-full rounded-md border border-[#d3cec6] dark:border-[#27272a] bg-transparent px-3 py-2 text-sm"
                         value={leaveTypeId}
                         onChange={(e) => setLeaveTypeId(e.target.value)}
                       >
                         <option value="">Select type...</option>
                         {leaveTypes.map((t) => (
                           <option key={t.id} value={t.id}>{t.name}</option>
                         ))}
                       </select>
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                       <div className="space-y-1">
                         <Label className="text-[10px] uppercase text-[#7b7b78]">From</Label>
                         <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-10 text-xs" required />
                       </div>
                       <div className="space-y-1">
                         <Label className="text-[10px] uppercase text-[#7b7b78]">To</Label>
                         <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-10 text-xs" required />
                       </div>
                     </div>
                     <div className="space-y-1">
                       <Label className="text-[10px] uppercase text-[#7b7b78]">Reason</Label>
                       <Input placeholder="Reason" value={reason} onChange={(e) => setReason(e.target.value)} className="h-10 text-xs" required />
                     </div>
                   </div>
                   <DialogFooter className="pt-4 flex-row gap-2">
                     <Button variant="ghost" type="button" onClick={() => setIsApplying(false)} className="flex-1 h-10 text-xs">Cancel</Button>
                     <Button type="submit" className="flex-1 h-10 text-xs bg-emerald-600 text-white" disabled={submitting}>
                       {submitting ? 'Applying...' : 'Apply'}
                     </Button>
                   </DialogFooter>
                 </form>
               </DialogContent>
             </Dialog>
          </div>
        </div>
      )}

      {/* Leave History Table */}
      <Card className="border-[#d3cec6] dark:border-[#27272a] shadow-none overflow-hidden">
        <CardHeader className="bg-[#f5f1ec]/50 dark:bg-[#09090b]/50 border-b border-[#d3cec6] dark:border-[#27272a] px-6 py-4">
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-[#7b7b78]">My Leave Applications</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-[#f5f1ec]/30 dark:bg-[#09090b]/30">
              <TableRow className="border-[#d3cec6] dark:border-[#27272a] hover:bg-transparent">
                <TableHead className="font-bold text-[#111111] dark:text-[#f4f4f5] py-4">Type</TableHead>
                <TableHead className="font-bold text-[#111111] dark:text-[#f4f4f5]">Duration</TableHead>
                <TableHead className="font-bold text-[#111111] dark:text-[#f4f4f5]">Days</TableHead>
                <TableHead className="font-bold text-[#111111] dark:text-[#f4f4f5]">Reason</TableHead>
                <TableHead className="font-bold text-[#111111] dark:text-[#f4f4f5]">Status</TableHead>
                <TableHead className="font-bold text-[#111111] dark:text-[#f4f4f5]">Applied On</TableHead>
                <TableHead className="font-bold text-[#111111] dark:text-[#f4f4f5] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-[#d3cec6] dark:border-[#27272a]">
                    <TableCell colSpan={7} className="h-12 animate-pulse bg-muted/20" />
                  </TableRow>
                ))
              ) : leaves.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-[#626260] dark:text-[#a1a1aa]">
                    No leave applications found.
                  </TableCell>
                </TableRow>
              ) : (
                leaves.map((leave) => (
                  <TableRow key={leave.id} className="border-[#d3cec6] dark:border-[#27272a] hover:bg-[#f5f1ec]/50 dark:hover:bg-[#121214]/50 transition-colors">
                    <TableCell className="font-medium py-4">{leave.leaveType.name}</TableCell>
                    <TableCell className="text-xs">
                      {new Date(leave.fromDate).toLocaleDateString()} - {new Date(leave.toDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-semibold">{Number(leave.totalDays)} Days</TableCell>
                    <TableCell className="text-xs text-[#626260] dark:text-[#a1a1aa] max-w-xs truncate" title={leave.reason}>
                      {leave.reason}
                    </TableCell>
                    <TableCell>{getStatusBadge(leave.status)}</TableCell>
                    <TableCell className="text-[10px] text-[#7b7b78] uppercase">
                      {new Date(leave.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {leave.status === 'PENDING' && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                          onClick={() => handleCancel(leave.id)}
                        >
                          <XCircle className="h-4 w-4 mr-1" /> Cancel
                        </Button>
                      )}
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