'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar, 
  Plus, 
  Search, 
  MoreHorizontal, 
  MapPin, 
  Clock, 
  Trash2, 
  Edit, 
  Loader2,
  AlertCircle,
  CheckCircle2,
  Globe
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  getCompanyEvents, 
  createCompanyEvent, 
  updateCompanyEvent, 
  deleteCompanyEvent 
} from '@/lib/hr';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function HrEventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    isPublic: true
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const data = await getCompanyEvents();
      setEvents(data);
    } catch (error) {
      console.error('Failed to fetch events', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (event: any = null) => {
    if (event) {
      setCurrentEvent(event);
      setFormData({
        title: event.title,
        description: event.description || '',
        startDate: format(new Date(event.startDate), "yyyy-MM-dd'T'HH:mm"),
        endDate: format(new Date(event.endDate), "yyyy-MM-dd'T'HH:mm"),
        location: event.location || '',
        isPublic: event.isPublic
      });
    } else {
      setCurrentEvent(null);
      setFormData({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        location: '',
        isPublic: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (currentEvent) {
        await updateCompanyEvent(currentEvent.id, formData);
        toast.success('Event updated successfully');
      } else {
        const result = await createCompanyEvent(formData);
        // Show calendar sync feedback
        const sync = result?.calendarSync;
        if (sync && sync.total > 0) {
          if (sync.failed === 0) {
            toast.success(
              `Event created & synced to ${sync.succeeded} Google Calendar${sync.succeeded !== 1 ? 's' : ''}`,
              { description: 'All linked accounts were updated.' }
            );
          } else if (sync.succeeded > 0) {
            toast.warning(
              `Event created. Calendar sync partial: ${sync.succeeded}/${sync.total} succeeded`,
              { description: `${sync.failed} user(s) could not be synced — their token may need re-authorisation.` }
            );
          } else {
            toast.error(
              `Event created but Google Calendar sync failed for all ${sync.total} linked user(s)`,
              { description: 'Check server logs. Users may need to re-link their Google account.' }
            );
          }
        } else {
          toast.success('Event created', {
            description: sync?.total === 0
              ? 'No users have linked their Google Calendar yet.'
              : undefined,
          });
        }
      }
      setIsModalOpen(false);
      fetchEvents();
    } catch (error) {
      console.error('Failed to save event', error);
      toast.error('Failed to save event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      await deleteCompanyEvent(id);
      fetchEvents();
    } catch (error) {
      console.error('Failed to delete event', error);
    }
  };

  const filteredEvents = (Array.isArray(events) ? events : []).filter(e => 
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.location && e.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <AppShell>
      <div className="p-6 md:p-8 space-y-8 max-w-[1400px] mx-auto animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[#111111] dark:text-[#f4f4f5] flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-[#ffffff] dark:bg-[#121214] border border-[#d3cec6] dark:border-[#27272a] flex items-center justify-center shadow-sm">
                <Calendar className="h-4.5 w-4.5 text-[#4f46e5] dark:text-[#818cf8]" />
              </div>
              Company Events & Activity Log
            </h1>
            <p className="mt-2 text-sm text-[#626260] dark:text-[#a1a1aa]">
              Manage company-wide events and track creation activity.
            </p>
          </div>
          <Button onClick={() => handleOpenModal()} className="bg-[#111111] hover:bg-[#222222] text-[#ffffff] dark:bg-[#f4f4f5] dark:hover:bg-[#e4e4e7] dark:text-[#09090b] font-bold shadow-sm">
            <Plus className="h-4 w-4 mr-2" /> Add Event
          </Button>
        </div>

        <div className="flex items-center gap-4 bg-[#ffffff] dark:bg-[#121214] border border-[#d3cec6] dark:border-[#27272a] rounded-xl px-4 py-2 shadow-sm">
          <Search className="h-4 w-4 text-[#7b7b78] dark:text-[#71717a]" />
          <input 
            type="text" 
            placeholder="Search events or authors..." 
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm placeholder:text-[#7b7b78] dark:placeholder:text-[#71717a]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-[#4f46e5] dark:text-[#818cf8]" />
            <p className="text-sm font-medium text-[#7b7b78] dark:text-[#71717a]">Loading events...</p>
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Event List / Grid */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#7b7b78] mb-4">Scheduled Events</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {filteredEvents.map((event) => (
                  <div key={event.id} className="rounded-xl border border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] overflow-hidden shadow-none group transition-all hover:border-[#111111] dark:hover:border-[#f4f4f5]">
                    <div className="p-5 space-y-4">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-base text-[#111111] dark:text-[#f4f4f5] tracking-tight line-clamp-1">{event.title}</h3>
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleOpenModal(event)} className="p-1.5 hover:bg-[#f5f1ec] dark:hover:bg-[#1a1a1e] rounded-lg text-[#626260] dark:text-[#a1a1aa] hover:text-[#111111] dark:hover:text-[#f4f4f5]">
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleDelete(event.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg text-[#626260] dark:text-[#a1a1aa] hover:text-red-600 dark:hover:text-red-400">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-[#626260] dark:text-[#a1a1aa] font-medium">
                          <Clock className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                          <span>{format(new Date(event.startDate), 'MMM dd, yyyy • hh:mm a')}</span>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-2 text-xs text-[#626260] dark:text-[#a1a1aa] font-medium">
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-rose-500" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-[#626260] dark:text-[#a1a1aa] line-clamp-2 leading-relaxed italic border-t pt-3 dark:border-white/5">
                        {event.description || 'No description provided.'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity Log Sidebar */}
            <div className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#7b7b78] mb-4">Activity Log</h2>
              <div className="rounded-2xl border border-[#d3cec6] dark:border-[#27272a] bg-white dark:bg-[#121214] overflow-hidden">
                <div className="divide-y dark:divide-white/5 max-h-[600px] overflow-y-auto">
                  {events.map((event) => (
                    <div key={`log-${event.id}`} className="p-4 flex gap-3 items-start hover:bg-[#fcfaf8] dark:hover:bg-white/[0.02] transition-colors">
                      <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center shrink-0 border border-[#d3cec6] dark:border-[#27272a] overflow-hidden">
                        {event.author?.image ? (
                          <img src={event.author.image} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-[10px] font-bold text-[#7b7b78] uppercase">{event.author?.name?.slice(0, 2)}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-[#111111] dark:text-[#f4f4f5] leading-tight">
                          <span className="font-bold">{event.author?.name || 'Unknown HR'}</span> created event <span className="font-semibold text-blue-600">"{event.title}"</span>
                        </p>
                        <p className="text-[10px] text-[#7b7b78] mt-1 uppercase font-medium">{format(new Date(event.createdAt), 'MMM dd • hh:mm a')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-[#fcfaf8] dark:bg-[#09090b]/20 border border-dashed border-[#d3cec6] dark:border-[#27272a] rounded-2xl">
            <div className="h-16 w-16 rounded-2xl bg-[#ffffff] dark:bg-[#121214] border border-[#d3cec6] dark:border-[#27272a] flex items-center justify-center mb-5 shadow-sm">
              <Calendar className="h-8 w-8 text-[#d3cec6] dark:text-[#27272a]" />
            </div>
            <h3 className="font-semibold text-base text-[#111111] dark:text-[#f4f4f5]">No events found</h3>
            <p className="text-sm text-[#626260] dark:text-[#a1a1aa] mt-2 max-w-xs mx-auto leading-relaxed">
              {searchTerm ? `No results for "${searchTerm}". Try a different search.` : 'Start by adding your first company event.'}
            </p>
            {!searchTerm && (
              <Button onClick={() => handleOpenModal()} variant="outline" className="mt-6 border-[#d3cec6] dark:border-[#27272a] text-[#111111] dark:text-[#f4f4f5] font-bold">
                Create Event
              </Button>
            )}
          </div>
        )}

        {/* Create/Edit Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-lg rounded-2xl border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214]">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold tracking-tight text-[#111111] dark:text-[#f4f4f5]">
                {currentEvent ? 'Edit Event' : 'Create New Event'}
              </DialogTitle>
              <DialogDescription className="text-sm text-[#626260] dark:text-[#a1a1aa]">
                Enter the details for the company event.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-5 pt-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#7b7b78] dark:text-[#71717a]">Event Title</Label>
                <Input 
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g. Annual Town Hall 2024"
                  className="bg-transparent border-[#d3cec6] dark:border-[#27272a]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-[#7b7b78] dark:text-[#71717a]">Start Date & Time</Label>
                  <Input 
                    required
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="bg-transparent border-[#d3cec6] dark:border-[#27272a]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-[#7b7b78] dark:text-[#71717a]">End Date & Time</Label>
                  <Input 
                    required
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="bg-transparent border-[#d3cec6] dark:border-[#27272a]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#7b7b78] dark:text-[#71717a]">Location</Label>
                <Input 
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="e.g. Main Conference Hall / Zoom Link"
                  className="bg-transparent border-[#d3cec6] dark:border-[#27272a]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#7b7b78] dark:text-[#71717a]">Description</Label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full min-h-[100px] rounded-md border border-[#d3cec6] dark:border-[#27272a] bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#111111] dark:focus:ring-[#f4f4f5]"
                  placeholder="Tell employees more about this event..."
                />
              </div>

              <DialogFooter className="pt-4 gap-3 sm:gap-0">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="text-[#626260] dark:text-[#a1a1aa] font-bold hover:text-[#111111] dark:hover:text-[#f4f4f5]">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-[#111111] hover:bg-[#222222] text-[#ffffff] dark:bg-[#f4f4f5] dark:hover:bg-[#e4e4e7] dark:text-[#09090b] font-bold px-8 shadow-sm">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : (currentEvent ? 'Update Event' : 'Create Event')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
