'use client';

import { useEffect, useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  MapPin, 
  Clock, 
  AlignLeft, 
  Loader2,
  Filter,
  LayoutGrid,
  List,
  CalendarDays,
  ChevronDown,
} from 'lucide-react';
import { getCalendar } from '@/lib/ess';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Link from 'next/link';
import { 
  format, 
  isValid, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday as isDateToday,
  addDays,
  subDays,
  startOfDay,
  setHours,
} from 'date-fns';
import { cn } from '@/lib/utils';

type ViewMode = 'month' | 'week' | 'agenda';

export default function EssCalendarPage() {
  const [data, setData] = useState<any>({ holidays: [], events: [], leaves: [] });
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showHint, setShowHint] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  
  // Filtering
  const [filters, setFilters] = useState({
    holidays: true,
    events: true,
    leaves: true
  });

  // Selected item for details modal
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [modalType, setModalType] = useState<'event' | 'holiday' | 'leave' | null>(null);

  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  // Helper for safe date formatting
  const formatSafe = (dateStr: any, formatStr: string, fallback: string = 'Invalid Date') => {
    if (!dateStr) return fallback;
    const date = new Date(dateStr);
    if (!isValid(date)) return fallback;
    return format(date, formatStr);
  };

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const result = await getCalendar(month, year);
        setData(result);
      } catch (error) {
        console.error('Failed to fetch calendar data', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [month, year]);

  const nextPeriod = () => {
    if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(addDays(currentDate, 7));
    else setCurrentDate(addMonths(currentDate, 1));
  };

  const prevPeriod = () => {
    if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(subDays(currentDate, 7));
    else setCurrentDate(subMonths(currentDate, 1));
  };

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    return eachDayOfInterval({
      start: startDate,
      end: endDate,
    });
  }, [currentDate]);

  const getDayContent = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    const dayHolidays = filters.holidays ? (data.holidays || []).filter((h: any) => isSameDay(new Date(h.date), date)) : [];
    const dayEvents = filters.events ? (data.events || []).filter((e: any) => {
      const start = new Date(e.startDate);
      const end = new Date(e.endDate);
      return (isSameDay(start, date) || isSameDay(end, date) || (date > start && date < end));
    }) : [];
    const dayLeaves = filters.leaves ? (data.leaves || []).filter((l: any) => {
      const start = startOfDay(new Date(l.fromDate));
      const end = startOfDay(new Date(l.toDate));
      const target = startOfDay(date);
      return target >= start && target <= end;
    }) : [];

    return { dayHolidays, dayEvents, dayLeaves };
  };

  const handleShowDetails = (item: any, type: 'event' | 'holiday' | 'leave') => {
    setSelectedItem(item);
    setModalType(type);
  };

  const { dayHolidays: selectedHolidays, dayEvents: selectedEvents, dayLeaves: selectedLeaves } = getDayContent(selectedDate);
  const hasItemsOnSelected = selectedHolidays.length > 0 || selectedEvents.length > 0 || selectedLeaves.length > 0;

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-7xl mx-auto flex flex-col min-h-[calc(100vh-100px)]">
      {/* Premium Condensed Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#121214] p-4 rounded-2xl border border-[#d3cec6] dark:border-[#27272a] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-600/10 flex items-center justify-center border border-blue-600/20 shrink-0">
            <CalendarIcon className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg md:text-xl font-bold tracking-tight text-[#111111] dark:text-[#f4f4f5] leading-none">
              {format(currentDate, 'MMMM yyyy')}
            </h1>
          </div>
        </div>

        {/* Desktop Header Middle: Filters */}
        <div className="hidden lg:flex items-center bg-[#f5f1ec] dark:bg-[#1a1a1e] p-1 rounded-xl border border-[#d3cec6] dark:border-[#27272a]">
          <button 
            onClick={() => setFilters({...filters, events: !filters.events})}
            className={cn(
              "px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all flex items-center gap-2",
              filters.events ? "bg-white dark:bg-[#27272a] shadow-sm text-blue-600" : "text-[#7b7b78] hover:text-[#111111]"
            )}
          >
            <div className="h-2 w-2 rounded-full bg-blue-500" /> Events
          </button>
          <button 
            onClick={() => setFilters({...filters, holidays: !filters.holidays})}
            className={cn(
              "px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all flex items-center gap-2",
              filters.holidays ? "bg-white dark:bg-[#27272a] shadow-sm text-rose-600" : "text-[#7b7b78] hover:text-[#111111]"
            )}
          >
            <div className="h-2 w-2 rounded-full bg-rose-500" /> Holidays
          </button>
          <button 
            onClick={() => setFilters({...filters, leaves: !filters.leaves})}
            className={cn(
              "px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all flex items-center gap-2",
              filters.leaves ? "bg-white dark:bg-[#27272a] shadow-sm text-emerald-600" : "text-[#7b7b78] hover:text-[#111111]"
            )}
          >
            <div className="h-2 w-2 rounded-full bg-emerald-500" /> My Leaves
          </button>
        </div>

        {/* View Toggles & Month Nav */}
        <div className="flex items-center gap-2">
          {/* Mobile Filter Toggle */}
          <div className="lg:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-[#d3cec6] dark:border-[#27272a]">
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl">
                <DropdownMenuCheckboxItem checked={filters.events} onCheckedChange={(v) => setFilters({...filters, events: !!v})}>Events</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={filters.holidays} onCheckedChange={(v) => setFilters({...filters, holidays: !!v})}>Holidays</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={filters.leaves} onCheckedChange={(v) => setFilters({...filters, leaves: !!v})}>Leaves</DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex bg-[#f5f1ec] dark:bg-[#1a1a1e] p-1 rounded-xl border border-[#d3cec6] dark:border-[#27272a]">
            <button onClick={() => setViewMode('month')} className={cn("p-1.5 rounded-lg transition-all", viewMode === 'month' ? "bg-white dark:bg-[#27272a] shadow-sm text-blue-600" : "text-[#7b7b78]")}><LayoutGrid className="h-4 w-4" /></button>
            <button onClick={() => setViewMode('week')} className={cn("p-1.5 rounded-lg transition-all", viewMode === 'week' ? "bg-white dark:bg-[#27272a] shadow-sm text-blue-600" : "text-[#7b7b78]")}><CalendarDays className="h-4 w-4" /></button>
            <button onClick={() => setViewMode('agenda')} className={cn("p-1.5 rounded-lg transition-all", viewMode === 'agenda' ? "bg-white dark:bg-[#27272a] shadow-sm text-blue-600" : "text-[#7b7b78]")}><List className="h-4 w-4" /></button>
          </div>

          <div className="flex items-center gap-1 bg-[#f5f1ec] dark:bg-[#1a1a1e] p-1 rounded-xl border border-[#d3cec6] dark:border-[#27272a]">
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={prevPeriod}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-[9px] font-bold uppercase tracking-tighter" onClick={() => { setCurrentDate(new Date()); setSelectedDate(new Date()); }}>Today</Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={nextPeriod}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>

      {showHint && (
        <div className="bg-blue-600/5 dark:bg-blue-600/10 border border-blue-200/50 dark:border-blue-500/20 rounded-2xl p-4 flex items-start justify-between gap-4 animate-in slide-in-from-top duration-500">
          <div className="flex gap-4">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight text-[#111111] dark:text-[#f4f4f5]">Google Calendar Sync</p>
              <p className="text-xs text-[#626260] dark:text-[#a1a1aa] mt-0.5 max-w-lg">
                Automatically push company events and holidays to your personal Google Calendar. 
                <Link href="/dashboard/ess/profile" className="text-blue-600 font-bold ml-1 hover:underline">Enable in Profile Settings</Link>
              </p>
            </div>
          </div>
          <button onClick={() => setShowHint(false)} className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg text-[#7b7b78]"><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-h-0" role="main" aria-label="Calendar View">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-40 gap-4 bg-[#ffffff] dark:bg-[#121214] border border-[#d3cec6] dark:border-[#27272a] rounded-2xl" aria-busy="true" aria-live="polite">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            <p className="text-[10px] text-[#7b7b78] font-bold uppercase tracking-[0.2em]">Syncing Calendar Data...</p>
          </div>
        ) : viewMode === 'month' ? (
          /* Split View for Mobile / Refined Month Grid for Desktop */
          <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0">
            <div className="flex-1 overflow-hidden flex flex-col">
              <div 
                className="grid grid-cols-7 border-l border-t border-[#d3cec6] dark:border-[#27272a] rounded-t-2xl overflow-hidden shadow-sm flex-1"
                role="grid"
                aria-label={`Calendar for ${format(currentDate, 'MMMM yyyy')}`}
              >
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div 
                    key={d} 
                    className="bg-[#fcfaf8] dark:bg-[#1a1a1e] p-3 text-center text-[10px] font-bold uppercase tracking-widest text-[#7b7b78] border-r border-b border-[#d3cec6] dark:border-[#27272a]"
                    role="columnheader"
                  >
                    {d}
                  </div>
                ))}
                {calendarDays.map((date) => {
                  const { dayHolidays, dayEvents, dayLeaves } = getDayContent(date);
                  const isCurrentMonth = isSameMonth(date, currentDate);
                  const isToday = isDateToday(date);
                  const isSelected = isSameDay(date, selectedDate);
                  const allItems = [...dayHolidays, ...dayEvents, ...dayLeaves];
                  
                  return (
                    <div 
                      key={date.toString()} 
                      onClick={() => setSelectedDate(date)}
                      role="gridcell"
                      aria-selected={isSelected}
                      aria-label={`${format(date, 'MMMM do, yyyy')}${allItems.length > 0 ? `, ${allItems.length} items` : ''}`}
                      className={cn(
                        "relative bg-white dark:bg-[#121214] border-r border-b border-[#d3cec6] dark:border-[#27272a] transition-all cursor-pointer group flex flex-col",
                        "h-[65px] md:h-auto md:aspect-square md:min-h-[110px]",
                        !isCurrentMonth && "bg-slate-50/50 dark:bg-white/[0.02]",
                        isSelected && "ring-2 ring-inset ring-blue-600 z-10",
                        isToday && "bg-blue-50/20 dark:bg-blue-900/5"
                      )}
                    >
                      <div className="p-2 md:p-3 flex flex-col h-full overflow-hidden">
                        <span className={cn(
                          "text-xs md:text-sm font-bold flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-full transition-all shrink-0",
                          isToday ? "bg-blue-600 text-white shadow-lg scale-110" : 
                          isSelected ? "text-blue-600 border border-blue-600/30" :
                          isCurrentMonth ? "text-[#111111] dark:text-[#f4f4f5]" : "text-[#d3cec6] dark:text-[#3f3f46]"
                        )}>
                          {format(date, 'd')}
                        </span>

                        {/* Mobile: Colored Dots */}
                        <div className="md:hidden flex justify-center gap-1 mt-auto pb-1" aria-hidden="true">
                          {dayHolidays.length > 0 && <div className="h-1.5 w-1.5 rounded-full bg-rose-500 shadow-[0_0_4px_rgba(244,63,94,0.5)]" />}
                          {dayEvents.length > 0 && <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_4px_rgba(59,130,246,0.5)]" />}
                          {dayLeaves.length > 0 && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]" />}
                        </div>

                        {/* Desktop: Refined Pill Design with Overflow */}
                        <div className="hidden md:flex flex-col gap-1 mt-2 flex-1 min-h-0" role="list">
                          {allItems.slice(0, 3).map((item, idx) => {
                            const isHoliday = idx < dayHolidays.length;
                            const isEvent = idx >= dayHolidays.length && idx < dayHolidays.length + dayEvents.length;
                            const type = isHoliday ? 'holiday' : (isEvent ? 'event' : 'leave');
                            
                            return (
                              <button
                                key={item.id}
                                onClick={(e) => { e.stopPropagation(); handleShowDetails(item, type); }}
                                role="listitem"
                                aria-label={`${type}: ${item.title || item.name}`}
                                className={cn(
                                  "w-full text-left rounded-md px-1.5 py-0.5 text-[10px] font-bold truncate transition-transform hover:scale-[1.02] active:scale-95 shadow-sm ring-1 ring-inset",
                                  type === 'holiday' ? "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20" :
                                  type === 'event' ? "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20" :
                                  "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20"
                                )}
                              >
                                {item.title || item.name || 'Leave'}
                              </button>
                            );
                          })}
                          {allItems.length > 3 && (
                            <Popover>
                              <PopoverTrigger asChild>
                                <button 
                                  onClick={(e) => e.stopPropagation()}
                                  aria-label={`Show ${allItems.length - 3} more items`}
                                  className="text-[9px] font-bold text-[#7b7b78] hover:text-blue-600 transition-colors mt-auto pl-1 uppercase tracking-tighter"
                                >
                                  + {allItems.length - 3} more
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-56 p-2 rounded-xl" onClick={(e) => e.stopPropagation()}>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-[#7b7b78] p-2 border-b mb-1">Events on {format(date, 'MMM d')}</p>
                                <div className="space-y-1">
                                  {allItems.map((item, idx) => {
                                    const isHoliday = idx < dayHolidays.length;
                                    const isEvent = idx >= dayHolidays.length && idx < dayHolidays.length + dayEvents.length;
                                    const type = isHoliday ? 'holiday' : (isEvent ? 'event' : 'leave');
                                    return (
                                      <button
                                        key={item.id}
                                        onClick={(e) => { e.stopPropagation(); handleShowDetails(item, type); }}
                                        className={cn(
                                          "w-full text-left rounded-md px-2 py-1.5 text-xs font-semibold truncate hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2",
                                          type === 'holiday' ? "text-rose-600" : type === 'event' ? "text-blue-600" : "text-emerald-600"
                                        )}
                                      >
                                        <div className={cn("h-1.5 w-1.5 rounded-full", type === 'holiday' ? "bg-rose-500" : type === 'event' ? "bg-blue-500" : "bg-emerald-500")} />
                                        {item.title || item.name || 'Leave'}
                                      </button>
                                    );
                                  })}
                                </div>
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Side/Mobile-Bottom Agenda List */}
            <div className="w-full md:w-80 lg:w-96 flex flex-col gap-4">
              <Card className="flex-1 rounded-2xl border-[#d3cec6] dark:border-[#27272a] shadow-lg shadow-[#d3cec6]/10 dark:shadow-none bg-[#ffffff] dark:bg-[#121214] flex flex-col min-h-[350px] overflow-hidden" role="complementary" aria-label="Daily Agenda">
                <CardHeader className="py-4 border-b border-[#f5f1ec] dark:border-[#1a1a1e] bg-[#fcfaf8] dark:bg-[#09090b]/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7b7b78]">{format(selectedDate, 'EEEE')}</p>
                      <CardTitle className="text-sm font-bold text-[#111111] dark:text-[#f4f4f5]">
                        {format(selectedDate, 'MMMM d, yyyy')}
                      </CardTitle>
                    </div>
                    {isDateToday(selectedDate) && <Badge className="bg-blue-600 text-white font-bold text-[9px] uppercase px-2">Today</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-y-auto" role="list">
                  {!hasItemsOnSelected ? (
                    <div className="p-12 text-center space-y-4 flex flex-col items-center justify-center h-full">
                      <div className="h-16 w-16 rounded-2xl bg-[#fcfaf8] dark:bg-[#1a1a1e] border border-dashed border-[#d3cec6] dark:border-[#27272a] flex items-center justify-center">
                        <CalendarIcon className="h-6 w-6 text-[#d3cec6] dark:text-[#3f3f46]" />
                      </div>
                      <p className="text-sm font-medium text-[#626260] dark:text-[#a1a1aa] italic max-w-[200px]">No company events or holidays scheduled.</p>
                    </div>
                  ) : (
                    <div className="divide-y dark:divide-[#1a1a1e]">
                      {selectedHolidays.map((h: any) => (
                        <div key={h.id} onClick={() => handleShowDetails(h, 'holiday')} className="p-4 hover:bg-[#fcfaf8] dark:hover:bg-[#1a1a1e] transition-all cursor-pointer group border-l-4 border-l-rose-500">
                          <div className="flex gap-4">
                            <div className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 flex items-center justify-center shrink-0">
                              <span className="text-xl">🎉</span>
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-[#111111] dark:text-[#f4f4f5] group-hover:text-rose-600 transition-colors">{h.name}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-[9px] font-bold uppercase py-0 px-1.5 h-4 border-rose-200 text-rose-600 dark:border-rose-500/30 dark:text-rose-400">Holiday</Badge>
                                <p className="text-[10px] text-[#7b7b78] truncate">All Day</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {selectedEvents.map((e: any) => (
                        <div key={e.id} onClick={() => handleShowDetails(e, 'event')} className="p-4 hover:bg-[#fcfaf8] dark:hover:bg-[#1a1a1e] transition-all cursor-pointer group border-l-4 border-l-blue-600">
                          <div className="flex gap-4">
                            <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center shrink-0">
                              <span className="text-xl">🎯</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm font-bold text-[#111111] dark:text-[#f4f4f5] group-hover:text-blue-600 transition-colors truncate">{e.title}</h4>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#7b7b78] uppercase tracking-tighter">
                                  <Clock className="h-3 w-3 text-blue-500" /> {format(new Date(e.startDate), 'hh:mm a')}
                                </div>
                                {e.location && (
                                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#7b7b78] uppercase tracking-tighter truncate max-w-[150px]">
                                    <MapPin className="h-3 w-3 text-blue-500" /> {e.location}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {selectedLeaves.map((l: any) => (
                        <div key={l.id} onClick={() => handleShowDetails(l, 'leave')} className="p-4 hover:bg-[#fcfaf8] dark:hover:bg-[#1a1a1e] transition-all cursor-pointer group border-l-4 border-l-emerald-500">
                          <div className="flex gap-4">
                            <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center shrink-0">
                              <span className="text-xl">🌴</span>
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-[#111111] dark:text-[#f4f4f5] group-hover:text-emerald-600 transition-colors">Staff Absence</h4>
                              <p className="text-[10px] font-bold text-[#7b7b78] uppercase mt-1 tracking-wider">
                                {format(new Date(l.fromDate), 'MMM d')} - {format(new Date(l.toDate), 'MMM d, yyyy')}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : viewMode === 'week' ? (
          /* Week View Implementation */
          <div className="flex-1 bg-white dark:bg-[#121214] border border-[#d3cec6] dark:border-[#27272a] rounded-2xl overflow-hidden flex flex-col shadow-sm">
             <div className="grid grid-cols-8 divide-x dark:divide-[#27272a] h-full overflow-y-auto">
               <div className="col-span-1 bg-[#fcfaf8] dark:bg-[#1a1a1e] border-b dark:border-[#27272a]">
                 <div className="h-16" />
                 {Array.from({length: 24}).map((_, i) => (
                   <div key={i} className="h-20 border-t dark:border-white/5 flex items-start justify-end pr-3 pt-3">
                     <span className="text-[10px] font-bold text-[#7b7b78] uppercase tracking-widest">{format(setHours(new Date(), i), 'hh a')}</span>
                   </div>
                 ))}
               </div>
               {eachDayOfInterval({
                 start: startOfWeek(currentDate),
                 end: endOfWeek(currentDate)
               }).map(date => {
                 const { dayEvents } = getDayContent(date);
                 return (
                   <div key={date.toString()} className={cn("col-span-1 border-b dark:border-[#27272a]", isDateToday(date) && "bg-blue-50/10 dark:bg-blue-900/5")}>
                     <div className="h-16 flex flex-col items-center justify-center border-b dark:border-[#27272a] bg-[#fcfaf8] dark:bg-[#1a1a1e]">
                       <span className="text-[10px] font-bold uppercase tracking-widest text-[#7b7b78]">{format(date, 'EEE')}</span>
                       <span className={cn("text-lg font-bold mt-0.5", isDateToday(date) ? "text-blue-600" : "text-[#111111] dark:text-[#f4f4f5]")}>{format(date, 'd')}</span>
                     </div>
                     <div className="relative h-full min-h-[1000px]">
                        {dayEvents.map(e => {
                          const startH = new Date(e.startDate).getHours();
                          const startM = new Date(e.startDate).getMinutes();
                          const endH = new Date(e.endDate).getHours();
                          const endM = new Date(e.endDate).getMinutes();
                          const top = (startH * 80) + (startM / 60 * 80);
                          const height = Math.max(40, ((endH * 80) + (endM / 60 * 80)) - top);
                          
                          return (
                            <div 
                              key={e.id}
                              onClick={() => handleShowDetails(e, 'event')}
                              className="absolute left-1 right-1 bg-blue-600 text-white p-2 rounded-lg cursor-pointer shadow-md z-10 overflow-hidden border border-white/20 transition-transform hover:scale-[1.02]"
                              style={{ top: `${top}px`, height: `${height}px` }}
                            >
                              <p className="text-[10px] font-bold leading-tight line-clamp-2">{e.title}</p>
                              <p className="text-[9px] text-white/80 mt-1">{format(new Date(e.startDate), 'h:mm a')}</p>
                            </div>
                          );
                        })}
                     </div>
                   </div>
                 );
               })}
             </div>
          </div>
        ) : (
          /* Agenda (List) View */
          <div className="flex-1 space-y-4 max-w-4xl mx-auto w-full pb-10">
            {[...data.holidays, ...data.events].sort((a, b) => new Date(a.date || a.startDate).getTime() - new Date(b.date || b.startDate).getTime())
              .filter(item => new Date(item.date || item.startDate) >= startOfDay(new Date()))
              .map((item) => {
                const type = item.date ? 'holiday' : 'event';
                return (
                  <Card key={item.id} onClick={() => handleShowDetails(item, type)} className="border-[#d3cec6] dark:border-[#27272a] shadow-none hover:border-blue-500 transition-all cursor-pointer overflow-hidden group rounded-2xl">
                    <CardContent className="p-0 flex items-stretch">
                      <div className={cn("w-2", type === 'holiday' ? "bg-rose-500" : "bg-blue-600")} />
                      <div className="p-5 flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                          <div className="text-center min-w-[70px] py-2 bg-[#fcfaf8] dark:bg-[#1a1a1e] rounded-2xl border border-[#d3cec6] dark:border-[#27272a] shadow-inner">
                            <p className="text-[10px] font-bold uppercase tracking-tighter text-blue-600">{format(new Date(item.date || item.startDate), 'MMMM')}</p>
                            <p className="text-2xl font-black text-[#111111] dark:text-[#f4f4f5] leading-none mt-0.5">{format(new Date(item.date || item.startDate), 'dd')}</p>
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-lg text-[#111111] dark:text-[#f4f4f5] group-hover:text-blue-600 transition-colors truncate">{item.name || item.title}</h3>
                            <div className="flex flex-wrap items-center gap-4 mt-1.5">
                              <Badge variant="outline" className={cn("text-[9px] font-bold uppercase px-2 border-[#d3cec6] dark:border-[#27272a]", type === 'holiday' ? "text-rose-600" : "text-blue-600")}>
                                {type === 'holiday' ? 'Public Holiday' : 'Company Event'}
                              </Badge>
                              {!item.date && (
                                <span className="text-xs font-bold text-[#7b7b78] flex items-center gap-1.5 uppercase">
                                  <Clock className="h-3 w-3" /> {format(new Date(item.startDate), 'hh:mm a')}
                                </span>
                              )}
                              {item.location && <span className="text-xs font-bold text-[#7b7b78] flex items-center gap-1.5 uppercase truncate max-w-[200px]"><MapPin className="h-3 w-3" /> {item.location}</span>}
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" className="hidden sm:flex border-[#d3cec6] dark:border-[#27272a] text-[10px] font-bold uppercase tracking-widest hover:bg-blue-600 hover:text-white hover:border-blue-600 rounded-xl h-10 px-6 transition-all">View Details</Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        )}
      </div>

      {/* Details Modal */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="sm:max-w-[450px] rounded-3xl border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] shadow-2xl p-0 overflow-hidden">
          <div className={cn("h-2 w-full", modalType === 'event' ? "bg-blue-600" : modalType === 'holiday' ? "bg-rose-500" : "bg-emerald-500")} />
          <div className="p-6">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-2">
                 <Badge className={cn("shadow-none border-none text-[9px] font-bold uppercase px-2",
                    modalType === 'event' ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400" :
                    modalType === 'holiday' ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400" :
                    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400")}>
                   {modalType === 'holiday' ? 'Public Holiday' : modalType === 'event' ? 'Company Event' : 'Employee Leave'}
                 </Badge>
              </div>
              <DialogTitle className="text-2xl font-bold tracking-tight text-[#111111] dark:text-[#f4f4f5] leading-tight">
                {selectedItem?.title || selectedItem?.name || 'Schedule Details'}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                View detailed information regarding this {modalType === 'holiday' ? 'holiday' : modalType === 'event' ? 'event' : 'leave'}.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 mt-8">
              <div className="flex items-start gap-5">
                <div className="h-12 w-12 rounded-2xl bg-[#fcfaf8] dark:bg-white/5 border border-[#d3cec6] dark:border-white/10 flex items-center justify-center shrink-0 shadow-sm text-blue-600">
                  <Clock className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#7b7b78]">Schedule & Timing</p>
                  <p className="text-base font-bold text-[#111111] dark:text-[#f4f4f5]">
                    {modalType === 'holiday' && formatSafe(selectedItem?.date, 'EEEE, MMMM do, yyyy')}
                    {modalType === 'event' && (
                      <>
                        {formatSafe(selectedItem?.startDate, 'MMM d, h:mm a')} — 
                        {formatSafe(selectedItem?.endDate, ' h:mm a')}
                      </>
                    )}
                    {modalType === 'leave' && (
                      <>
                        {formatSafe(selectedItem?.fromDate, 'MMMM d')} — 
                        {formatSafe(selectedItem?.toDate, 'MMMM d, yyyy')}
                      </>
                    )}
                  </p>
                </div>
              </div>

              {selectedItem?.location && (
                <div className="flex items-start gap-5">
                  <div className="h-12 w-12 rounded-2xl bg-[#fcfaf8] dark:bg-white/5 border border-[#d3cec6] dark:border-white/10 flex items-center justify-center shrink-0 shadow-sm text-rose-500">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#7b7b78]">Location / Venue</p>
                    <p className="text-base font-bold text-[#111111] dark:text-[#f4f4f5]">{selectedItem.location}</p>
                  </div>
                </div>
              )}

              {(selectedItem?.description || selectedItem?.reason) && (
                <div className="flex items-start gap-5 border-t dark:border-white/10 pt-6">
                  <div className="h-12 w-12 rounded-2xl bg-[#fcfaf8] dark:bg-white/5 border border-[#d3cec6] dark:border-white/10 flex items-center justify-center shrink-0 shadow-sm text-emerald-600">
                    <AlignLeft className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#7b7b78]">Additional Notes</p>
                    <p className="text-sm font-medium text-[#626260] dark:text-[#a1a1aa] leading-relaxed italic pr-4">
                      {selectedItem.description || selectedItem.reason}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-10 flex gap-3">
              <Button onClick={() => setSelectedItem(null)} className="flex-1 bg-[#111111] hover:bg-[#222222] text-white dark:bg-[#f4f4f5] dark:text-[#09090b] dark:hover:bg-[#e4e4e7] font-bold rounded-2xl h-12">Done</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
