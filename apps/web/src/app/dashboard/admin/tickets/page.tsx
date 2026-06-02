'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, Filter, LifeBuoy, MessageSquare, User, UserPlus, Search, Calendar, ArrowLeft, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { AppShell } from '@/components/layout/AppShell';
import { getHelpdeskTickets, updateTicketStatus, addTicketComment } from '@/lib/hr';
import { cn } from '@/lib/utils';

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function fetchData() {
    setLoading(true);
    try {
      // Get IT-related tickets
      const res = await getHelpdeskTickets(undefined, 'IT');
      // API might return { data: [...] } or just [...]
      const ticketData = res.data || res;
      setTickets(Array.isArray(ticketData) ? ticketData : []);
    } catch (error) {
      console.error('Failed to fetch IT tickets', error);
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = [...(Array.isArray(tickets) ? tickets : [])];
    
    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.raisedBy?.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (dateFilter) {
      filtered = filtered.filter(t => 
        new Date(t.createdAt).toISOString().split('T')[0] === dateFilter
      );
    }
    
    setFilteredTickets(filtered);
  }, [tickets, searchQuery, dateFilter]);

  const handleStatusUpdate = async (status: string, resolution?: string) => {
    if (!selectedTicket) return;
    setSubmitting(true);
    try {
      await updateTicketStatus(selectedTicket.id, status, resolution);
      toast.success(`Ticket status updated to ${status}`);
      fetchData();
      setSelectedTicket(null);
    } catch (error) {
      toast.error('Failed to update ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN': return <Badge variant="outline" className="text-blue-600 border-blue-200 dark:border-blue-900/50">Open</Badge>;
      case 'IN_PROGRESS': return <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20">In Progress</Badge>;
      case 'RESOLVED': return <Badge variant="success" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20">Resolved</Badge>;
      case 'CLOSED': return <Badge variant="secondary" className="dark:bg-white/5">Closed</Badge>;
      case 'CANCELLED': return <Badge variant="destructive" className="bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20">Cancelled</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <AppShell>
      <div className="p-4 md:p-6 h-full flex flex-col gap-6 max-w-7xl mx-auto overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Shield className="h-6 w-6 text-violet-600" /> IT Support Desk
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage technical requests and facility maintenance tickets.
            </p>
          </div>
        </div>

        <div className="flex flex-1 gap-6 min-h-0 overflow-hidden relative">
          {/* Ticket List */}
          <div className={`flex-1 flex flex-col gap-4 min-w-0 ${selectedTicket ? 'hidden lg:flex max-w-sm' : 'flex'}`}>
            <div className="flex flex-col md:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search IT tickets..." 
                  className="pl-9 h-10 bg-transparent border-[#d3cec6] dark:border-[#27272a]" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="relative w-full md:w-40">
                <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input 
                  type="date" 
                  className="pl-9 h-10 text-xs bg-transparent border-[#d3cec6] dark:border-[#27272a]" 
                  value={dateFilter}
                  onChange={e => setDateFilter(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {loading ? (
                Array.from({length: 5}).map((_, i) => (
                  <div key={i} className="h-24 bg-muted/20 animate-pulse rounded-xl border border-dashed border-muted" />
                ))
              ) : filteredTickets.length === 0 ? (
                <div className="text-center py-20 border rounded-xl border-dashed border-[#d3cec6] dark:border-[#27272a] bg-[#fcfaf8]/30 dark:bg-white/[0.02]">
                  <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-20" />
                  <p className="text-sm text-muted-foreground font-medium">No IT tickets found</p>
                </div>
              ) : (
                filteredTickets.map((t) => (
                  <Card 
                    key={t.id} 
                    className={cn(
                      "cursor-pointer hover:border-violet-300 dark:hover:border-violet-900 transition-all border-[#d3cec6] dark:border-[#27272a] shadow-none",
                      selectedTicket?.id === t.id ? 'border-violet-600 ring-1 ring-violet-600 bg-violet-50/5 dark:bg-violet-900/5' : 'bg-white dark:bg-[#121214]'
                    )}
                    onClick={() => setSelectedTicket(t)}
                  >
                    <CardHeader className="p-4 pb-2">
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t.ticketNumber}</span>
                          <span className="text-xs font-bold text-violet-700 dark:text-violet-400">{t.raisedBy?.fullName}</span>
                        </div>
                        {getStatusBadge(t.status)}
                      </div>
                      <CardTitle className="text-sm line-clamp-1 mt-1">{t.subject}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 flex items-center justify-between">
                      <span className="text-[10px] bg-muted dark:bg-muted/10 px-1.5 py-0.5 rounded font-bold uppercase">{t.type.replace('_', ' ')}</span>
                      <span className="text-[10px] text-muted-foreground font-medium">{new Date(t.createdAt).toLocaleDateString()}</span>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* View Area */}
          <div className={`flex-[2] bg-background dark:bg-[#121214] border border-[#d3cec6] dark:border-[#27272a] rounded-xl overflow-hidden flex flex-col min-w-0 ${!selectedTicket ? 'hidden lg:flex' : 'flex'}`}>
            {selectedTicket ? (
              <div className="flex-1 flex flex-col min-h-0 relative">
                <Button 
                  variant="ghost" 
                  className="lg:hidden absolute top-2 left-2 z-10" 
                  onClick={() => setSelectedTicket(null)}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>

                <div className="p-6 border-b border-[#d3cec6] dark:border-[#27272a] bg-muted/10 dark:bg-muted/5 pt-12 lg:pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-muted-foreground tracking-wider">{selectedTicket.ticketNumber}</span>
                        <span className="text-[10px] px-2 py-0.5 bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400 rounded-full border border-violet-100 dark:border-violet-500/20 font-bold uppercase">{selectedTicket.type.replace('_', ' ')}</span>
                      </div>
                      <h2 className="text-xl font-bold">{selectedTicket.subject}</h2>
                      <p className="text-sm text-muted-foreground mt-1">Raised by <span className="font-semibold text-foreground">{selectedTicket.raisedBy?.fullName}</span> ({selectedTicket.raisedBy?.employeeNumber})</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(selectedTicket.status)}
                      {selectedTicket.status === 'OPEN' && (
                        <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white font-bold h-9 px-4 rounded-xl shadow-md" onClick={() => handleStatusUpdate('IN_PROGRESS')} disabled={submitting}>
                          <UserPlus className="h-4 w-4 mr-2" /> Take Ownership
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    <div>Priority: <span className="text-foreground font-bold">{selectedTicket.priority}</span></div>
                    <div>Raised: <span className="text-foreground">{new Date(selectedTicket.createdAt).toLocaleString()}</span></div>
                    <div>Assigned To: <span className="text-foreground">{selectedTicket.assignedTo?.fullName || 'Unassigned'}</span></div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30 dark:bg-slate-900/10">
                  <div className="bg-white dark:bg-[#1a1a1e] border border-[#d3cec6] dark:border-[#27272a] p-5 rounded-2xl shadow-sm">
                    <h4 className="text-[10px] font-bold uppercase text-muted-foreground mb-3 tracking-widest border-b dark:border-white/5 pb-2">User Request Details</h4>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{selectedTicket.description}</p>
                  </div>

                  {/* Resolution Details if resolved */}
                  {selectedTicket.status === 'RESOLVED' && (
                    <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 p-5 rounded-2xl text-emerald-800 dark:text-emerald-400 shadow-sm">
                      <h4 className="font-bold text-xs uppercase mb-2 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 bg-emerald-500 text-white rounded-full p-0.5" /> Resolution Provided
                      </h4>
                      <p className="text-sm leading-relaxed">{selectedTicket.resolutionDetails}</p>
                      <p className="text-[10px] mt-3 opacity-60 italic">Resolved on {new Date(selectedTicket.resolvedAt).toLocaleString()}</p>
                    </div>
                  )}

                  {/* Resolution Form if in progress */}
                  {selectedTicket.status === 'IN_PROGRESS' && (
                    <Card className="border-violet-100 dark:border-violet-500/20 bg-white dark:bg-[#1a1a1e] shadow-md overflow-hidden rounded-2xl">
                      <CardHeader className="py-3 bg-violet-50/50 dark:bg-violet-500/10 border-b border-violet-100 dark:border-violet-500/20">
                        <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-violet-700 dark:text-violet-400">Action: Resolve Ticket</CardTitle>
                      </CardHeader>
                      <CardContent className="p-5 space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Technical Resolution / Reply to User</label>
                          <Textarea id="res-detail" placeholder="Describe how the issue was fixed..." className="text-sm min-h-[120px] bg-transparent border-[#d3cec6] dark:border-[#27272a] focus:ring-violet-500" />
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                          <Button variant="ghost" size="sm" onClick={() => handleStatusUpdate('OPEN')} disabled={submitting} className="text-muted-foreground font-bold text-[10px] uppercase">Reopen</Button>
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 h-9 rounded-xl shadow-md" disabled={submitting} onClick={() => {
                            const res = (document.getElementById('res-detail') as HTMLTextAreaElement).value;
                            if (!res.trim()) {
                              toast.error('Please provide resolution details');
                              return;
                            }
                            handleStatusUpdate('RESOLVED', res);
                          }}>
                            <CheckCircle className="h-4 w-4 mr-2" /> Mark as Fixed
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground border-0 bg-slate-50/20 dark:bg-slate-900/5">
                <div className="bg-muted dark:bg-muted/10 p-4 rounded-full mb-4">
                  <LifeBuoy className="h-10 w-10 opacity-20" />
                </div>
                <h3 className="text-lg font-medium text-foreground">Select an IT ticket</h3>
                <p className="max-w-xs mt-2 text-sm text-center">Manage technical support requests from your team members here. Ensure timely resolutions for better workspace productivity.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
