'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bell, 
  Check, 
  Info, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Search,
  Filter,
  MoreVertical,
  CheckAll
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AppShell } from '@/components/layout/AppShell';
import { 
  getNotifications, 
  markAsRead, 
  markAllAsRead 
} from '@/lib/notifications';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getNotifications();
      if (res.success) {
        setNotifications(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'WARNING': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'ERROR': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const filteredNotifications = notifications.filter(n => 
    filter === 'ALL' || !n.isRead
  );

  return (
    <AppShell>
      <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111111] dark:text-[#f4f4f5]">Notifications</h1>
          <p className="text-sm text-[#7b7b78] dark:text-[#71717a]">Stay updated with the latest events and actions in your workspace.</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="border-[#d3cec6] dark:border-[#27272a] text-[#111111] dark:text-[#f4f4f5]"
          onClick={handleMarkAllAsRead}
          disabled={!notifications.some(n => !n.isRead)}
        >
          <Check className="mr-2 h-4 w-4" />
          Mark all as read
        </Button>
      </div>

      <Card className="border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] shadow-sm overflow-hidden">
        <CardHeader className="border-b border-[#f5f1ec] dark:border-[#27272a] p-4">
          <div className="flex items-center gap-4">
            <Button 
              variant={filter === 'ALL' ? 'secondary' : 'ghost'} 
              size="sm" 
              className={cn(
                "h-8 rounded-full px-4 text-xs font-bold",
                filter === 'ALL' && "bg-[#f5f1ec] dark:bg-[#18181b] text-[#111111] dark:text-[#f4f4f5]"
              )}
              onClick={() => setFilter('ALL')}
            >
              All
            </Button>
            <Button 
              variant={filter === 'UNREAD' ? 'secondary' : 'ghost'} 
              size="sm" 
              className={cn(
                "h-8 rounded-full px-4 text-xs font-bold",
                filter === 'UNREAD' && "bg-[#f5f1ec] dark:bg-[#18181b] text-[#111111] dark:text-[#f4f4f5]"
              )}
              onClick={() => setFilter('UNREAD')}
            >
              Unread
              {notifications.filter(n => !n.isRead).length > 0 && (
                <Badge className="ml-2 h-5 min-w-5 justify-center bg-orange-600 dark:bg-orange-500 hover:bg-orange-600">
                  {notifications.filter(n => !n.isRead).length}
                </Badge>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-sm text-[#7b7b78] dark:text-[#71717a]">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 text-center p-8">
              <div className="h-16 w-16 rounded-full bg-[#f5f1ec] dark:bg-[#18181b] flex items-center justify-center mb-4">
                <Bell className="h-8 w-8 text-[#7b7b78] dark:text-[#71717a]" />
              </div>
              <h3 className="text-lg font-bold text-[#111111] dark:text-[#f4f4f5]">No notifications found</h3>
              <p className="text-sm text-[#7b7b78] dark:text-[#71717a] max-w-xs">
                {filter === 'UNREAD' 
                  ? "You don't have any unread notifications at the moment." 
                  : "Your notification center is empty. New updates will appear here."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#f5f1ec] dark:divide-[#27272a]">
              {filteredNotifications.map((n) => (
                <div 
                  key={n.id} 
                  className={cn(
                    "group flex gap-4 p-5 transition-colors",
                    !n.isRead ? "bg-orange-50/20 dark:bg-orange-950/5" : "hover:bg-[#f5f1ec]/30 dark:hover:bg-[#18181b]/30"
                  )}
                >
                  <div className="shrink-0 mt-1">
                    {getTypeIcon(n.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between">
                      <h4 className={cn(
                        "text-sm tracking-tight",
                        !n.isRead ? "font-bold text-[#111111] dark:text-[#f4f4f5]" : "font-semibold text-[#626260] dark:text-[#a1a1aa]"
                      )}>
                        {n.title}
                      </h4>
                      <span className="text-[10px] font-bold text-[#7b7b78] dark:text-[#71717a] uppercase tracking-wider">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-[#626260] dark:text-[#a1a1aa] leading-relaxed">
                      {n.message}
                    </p>
                    <div className="flex items-center gap-4 pt-1">
                      <span className="text-[10px] font-bold text-[#7b7b78] dark:text-[#71717a]">
                        {format(new Date(n.createdAt), 'MMM d, yyyy · h:mm a')}
                      </span>
                      {!n.isRead && (
                        <button 
                          className="text-[10px] font-bold text-orange-600 hover:text-orange-700 hover:underline underline-offset-2 transition-all"
                          onClick={() => handleMarkAsRead(n.id)}
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </AppShell>
  );
}
