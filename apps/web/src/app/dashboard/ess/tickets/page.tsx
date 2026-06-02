'use client';

import { useEffect, useState } from 'react';
import { LifeBuoy, MessageSquare, Plus, Search, User, Calendar, XCircle, ArrowLeft } from 'lucide-react';
import { getMyTickets, createTicket, getTicketDetails, addTicketComment, cancelTicket } from '@/lib/ess';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

import { useMediaQuery } from '@/hooks/use-media-query';

export default function EssTicketsPage() {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [tickets, setTickets] = useState<any[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // New Ticket State
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    type: 'IT_SUPPORT',
    priority: 'MEDIUM',
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterTickets();
  }, [tickets, searchQuery, dateFilter]);

  async function fetchData() {
    setLoading(true);
    try {
      const data = await getMyTickets();
      setTickets(data || []);
    } catch (error) {
      console.error('Failed to fetch tickets', error);
    } finally {
      setLoading(false);
    }
  }

  const filterTickets = () => {
    let filtered = [...tickets];
    
    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (dateFilter) {
      filtered = filtered.filter(t => 
        new Date(t.createdAt).toISOString().split('T')[0] === dateFilter
      );
    }
    
    setFilteredTickets(filtered);
  };

  const handleTicketSelect = async (ticket: any) => {
    setLoading(true);
    try {
      const details = await getTicketDetails(ticket.id);
      setSelectedTicket(details);
      setShowNewTicket(false);
    } catch (error) {
      toast.error('Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createTicket(formData);
      toast.success('Ticket raised successfully!');
      setShowNewTicket(false);
      setFormData({ subject: '', description: '', type: 'IT_SUPPORT', priority: 'MEDIUM' });
      fetchData();
    } catch (error) {
      toast.error('Failed to raise ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelTicket = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this ticket?')) return;
    setSubmitting(true);
    try {
      await cancelTicket(id);
      toast.success('Ticket cancelled successfully');
      fetchData();
      if (selectedTicket?.id === id) {
        handleTicketSelect({ id });
      }
    } catch (error) {
      toast.error('Failed to cancel ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedTicket) return;
    setSubmitting(true);
    try {
      await addTicketComment(selectedTicket.id, newComment);
      setNewComment('');
      // Refresh details
      const details = await getTicketDetails(selectedTicket.id);
      setSelectedTicket(details);
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN': return <Badge variant="outline" className="text-blue-600 border-blue-200">Open</Badge>;
      case 'IN_PROGRESS': return <Badge variant="secondary" className="bg-amber-100 text-amber-700">In Progress</Badge>;
      case 'RESOLVED': return <Badge variant="success" className="bg-emerald-100 text-emerald-700">Resolved</Badge>;
      case 'CLOSED': return <Badge variant="secondary">Closed</Badge>;
      case 'CANCELLED': return <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-200">Cancelled</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 h-full flex flex-col gap-8 max-w-7xl mx-auto overflow-hidden">
      {/* Header Block with Spacing */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 mb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <LifeBuoy className="h-6 w-6 text-indigo-600" /> Helpdesk
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Need help? Raise a ticket for IT support or HR grievances.
          </p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 w-full md:w-auto font-bold shadow-sm" onClick={() => setShowNewTicket(true)}>
          <Plus className="h-4 w-4 mr-2" /> Raise Ticket
        </Button>
      </div>

      <div className="flex flex-1 gap-6 min-h-0 overflow-hidden relative">
        {/* Ticket List - Mobile Responsive */}
        <div className={`flex-1 flex flex-col gap-4 min-w-0 ${selectedTicket ? 'hidden lg:flex max-w-sm' : 'flex'}`}>
          <div className="flex flex-col md:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search tickets..." 
                className="pl-9 h-10" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="relative w-full md:w-40">
              <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input 
                type="date" 
                className="pl-9 h-10 text-xs" 
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {loading ? (
              <div className="text-center py-12">Loading tickets...</div>
            ) : filteredTickets.length === 0 ? (
              <div className="text-center py-12 border rounded-lg border-dashed">
                <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-20" />
                <p className="text-sm text-muted-foreground">No tickets found</p>
              </div>
            ) : (
              filteredTickets.map((t) => (
                <Card 
                  key={t.id} 
                  className={`cursor-pointer hover:border-indigo-300 transition-all ${selectedTicket?.id === t.id ? 'border-indigo-600 ring-1 ring-indigo-600 shadow-sm' : ''}`}
                  onClick={() => handleTicketSelect(t)}
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t.ticketNumber}</span>
                      {getStatusBadge(t.status)}
                    </div>
                    <CardTitle className="text-sm line-clamp-1">{t.subject}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 flex items-center justify-between">
                    <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-medium">{t.type.replace('_', ' ')}</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(t.createdAt).toLocaleDateString()}</span>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* View Area */}
        <div className={`flex-[2] bg-background border rounded-xl overflow-hidden flex flex-col min-w-0 ${!selectedTicket ? 'hidden lg:flex' : 'flex'}`}>
          {isDesktop && showNewTicket ? (
            <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-[#121214] p-8 overflow-y-auto">
              <h2 className="text-2xl font-bold tracking-tight mb-2">Raise Support Request</h2>
              <p className="text-sm text-muted-foreground mb-8">Provide details about your issue and we'll get back to you as soon as possible.</p>
              
              <form onSubmit={handleCreateTicket} className="space-y-6 max-w-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Category</label>
                    <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
                      <SelectTrigger className="bg-transparent border-[#d3cec6] dark:border-[#27272a] h-11"><SelectValue /></SelectTrigger>
                      <SelectContent className="dark:bg-[#1a1a1e] border-[#d3cec6] dark:border-[#27272a]">
                        <SelectItem value="IT_SUPPORT">IT Support / Technical</SelectItem>
                        <SelectItem value="HR_GRIEVANCE">HR Grievance / Query</SelectItem>
                        <SelectItem value="FACILITIES">Facilities / Maintenance</SelectItem>
                        <SelectItem value="PAYROLL">Payroll / Salary Query</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Priority</label>
                    <Select value={formData.priority} onValueChange={v => setFormData({...formData, priority: v})}>
                      <SelectTrigger className="bg-transparent border-[#d3cec6] dark:border-[#27272a] h-11"><SelectValue /></SelectTrigger>
                      <SelectContent className="dark:bg-[#1a1a1e] border-[#d3cec6] dark:border-[#27272a]">
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Subject</label>
                  <Input 
                    placeholder="Short summary of the issue" 
                    value={formData.subject}
                    onChange={e => setFormData({...formData, subject: e.target.value})}
                    required
                    className="bg-transparent border-[#d3cec6] dark:border-[#27272a] h-11 focus-visible:ring-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Description</label>
                  <Textarea 
                    placeholder="Provide detailed information about your request..." 
                    className="min-h-[150px] bg-transparent border-[#d3cec6] dark:border-[#27272a] focus-visible:ring-indigo-500 resize-none"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    required
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 mt-2">
                  <Button variant="ghost" type="button" onClick={() => setShowNewTicket(false)} className="font-bold text-muted-foreground">Cancel</Button>
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 font-bold px-8 shadow-md h-11" disabled={submitting}>
                    {submitting ? 'Raising Ticket...' : 'Submit Request'}
                  </Button>
                </div>
              </form>
            </div>
          ) : selectedTicket ? (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Ticket Header */}
              <div className="p-6 border-b bg-muted/10 dark:bg-muted/5 pt-12 lg:pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-muted-foreground tracking-wider">{selectedTicket.ticketNumber}</span>
                      <span className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 rounded-full border border-indigo-100 dark:border-indigo-500/20 font-bold uppercase">{selectedTicket.type.replace('_', ' ')}</span>
                    </div>
                    <h2 className="text-xl font-bold">{selectedTicket.subject}</h2>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(selectedTicket.status)}
                    {selectedTicket.status === 'OPEN' && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 h-7 text-[10px] font-bold uppercase"
                        onClick={() => handleCancelTicket(selectedTicket.id)}
                        disabled={submitting}
                      >
                        <XCircle className="h-3 w-3 mr-1" /> Cancel Ticket
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

              {/* Chat/Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30 dark:bg-slate-900/10">
                {/* Original Description */}
                <div className="flex gap-3">
                  <div className="bg-indigo-600 h-8 w-8 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="bg-white dark:bg-[#1a1a1e] border border-[#d3cec6] dark:border-[#27272a] p-4 rounded-2xl rounded-tl-none flex-1 max-w-[85%] shadow-sm">
                    <h4 className="text-[10px] font-bold uppercase text-muted-foreground mb-2 tracking-widest">Initial Request</h4>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{selectedTicket.description}</p>
                  </div>
                </div>

                {/* Comments */}
                {selectedTicket.comments?.map((comment: any) => (
                  <div key={comment.id} className={`flex gap-3 ${comment.authorId === selectedTicket.raisedById ? '' : 'flex-row-reverse text-right'}`}>
                    <div className={`${comment.authorId === selectedTicket.raisedById ? 'bg-indigo-600' : 'bg-slate-700'} h-8 w-8 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm`}>
                      <User className="h-4 w-4" />
                    </div>
                    <div className={cn(
                      "p-4 rounded-2xl flex-1 max-w-[85%] shadow-sm border",
                      comment.authorId === selectedTicket.raisedById 
                        ? "bg-white dark:bg-[#1a1a1e] border-[#d3cec6] dark:border-[#27272a] rounded-tl-none" 
                        : "bg-indigo-50/50 dark:bg-indigo-500/5 border-indigo-100 dark:border-indigo-500/20 rounded-tr-none"
                    )}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold opacity-60 uppercase tracking-tighter">{comment.author.name}</span>
                        <span className="text-[10px] opacity-40">{new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-sm leading-relaxed">{comment.message}</p>
                    </div>
                  </div>
                ))}

                {selectedTicket.status === 'RESOLVED' && (
                  <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 p-4 rounded-xl text-emerald-800 dark:text-emerald-400 shadow-sm">
                    <h4 className="font-bold text-xs uppercase mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 bg-emerald-500 text-white rounded-full p-0.5" />
                      Resolution Details
                    </h4>
                    <p className="text-sm leading-relaxed">{selectedTicket.resolutionDetails}</p>
                    <p className="text-[10px] mt-2 opacity-60 italic">Resolved on {new Date(selectedTicket.resolvedAt).toLocaleString()}</p>
                  </div>
                )}
                
                {selectedTicket.status === 'CANCELLED' && (
                  <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 p-4 rounded-xl text-red-800 dark:text-red-400 text-center">
                    <p className="text-xs font-bold uppercase">This ticket has been cancelled.</p>
                  </div>
                )}
              </div>

              {/* Reply Box */}
              {!['CLOSED', 'CANCELLED', 'RESOLVED'].includes(selectedTicket.status) && (
                <div className="p-4 border-t bg-white dark:bg-[#121214]">
                  <div className="flex gap-2">
                    <Textarea 
                      placeholder="Add a comment..." 
                      className="min-h-[40px] max-h-[120px] text-sm bg-transparent border-[#d3cec6] dark:border-[#27272a]" 
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                    />
                    <Button 
                      className="bg-indigo-600 hover:bg-indigo-700 h-auto px-6 font-bold" 
                      onClick={handleAddComment}
                      disabled={submitting || !newComment.trim()}
                    >
                      Reply
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-muted-foreground bg-slate-50/20 dark:bg-slate-900/5">
              <div className="bg-muted dark:bg-muted/10 p-4 rounded-full mb-4">
                <LifeBuoy className="h-10 w-10 opacity-20" />
              </div>
              <h3 className="text-lg font-medium text-foreground">Select a ticket to view details</h3>
              <p className="max-w-xs mt-2 text-sm">Select a ticket from the sidebar to view history, comments, and resolution status.</p>
            </div>
          )}
        </div>
      </div>

      {/* New Ticket Modal */}
      <Dialog open={!isDesktop && showNewTicket} onOpenChange={setShowNewTicket}>
        <DialogContent className="sm:max-w-[600px] rounded-2xl border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] p-0 overflow-hidden shadow-2xl">
          <div className="h-2 w-full bg-indigo-600" />
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-2xl font-bold tracking-tight">Raise Support Request</DialogTitle>
            <DialogDescription className="text-sm mt-1">
              Provide details about your issue and we'll get back to you as soon as possible.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateTicket} className="p-6 pt-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Category</label>
                <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
                  <SelectTrigger className="bg-transparent border-[#d3cec6] dark:border-[#27272a] h-11"><SelectValue /></SelectTrigger>
                  <SelectContent className="dark:bg-[#1a1a1e] border-[#d3cec6] dark:border-[#27272a]">
                    <SelectItem value="IT_SUPPORT">IT Support / Technical</SelectItem>
                    <SelectItem value="HR_GRIEVANCE">HR Grievance / Query</SelectItem>
                    <SelectItem value="FACILITIES">Facilities / Maintenance</SelectItem>
                    <SelectItem value="PAYROLL">Payroll / Salary Query</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Priority</label>
                <Select value={formData.priority} onValueChange={v => setFormData({...formData, priority: v})}>
                  <SelectTrigger className="bg-transparent border-[#d3cec6] dark:border-[#27272a] h-11"><SelectValue /></SelectTrigger>
                  <SelectContent className="dark:bg-[#1a1a1e] border-[#d3cec6] dark:border-[#27272a]">
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Subject</label>
              <Input 
                placeholder="Short summary of the issue" 
                value={formData.subject}
                onChange={e => setFormData({...formData, subject: e.target.value})}
                required
                className="bg-transparent border-[#d3cec6] dark:border-[#27272a] h-11 focus-visible:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Description</label>
              <Textarea 
                placeholder="Provide detailed information about your request..." 
                className="min-h-[150px] bg-transparent border-[#d3cec6] dark:border-[#27272a] focus-visible:ring-indigo-500 resize-none"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                required
              />
            </div>
            <DialogFooter className="gap-3 pt-4 border-t border-[#f5f1ec] dark:border-[#1a1a1e] mt-2">
              <Button variant="ghost" type="button" onClick={() => setShowNewTicket(false)} className="font-bold text-muted-foreground">Cancel</Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 font-bold px-8 shadow-md h-11" disabled={submitting}>
                {submitting ? 'Raising Ticket...' : 'Submit Request'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
