'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Check, Info, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '@/lib/notifications';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [notifsRes, countRes] = await Promise.all([
        getNotifications(),
        getUnreadCount()
      ]);
      
      if (notifsRes.success) {
        setNotifications(notifsRes.data);
      }
      
      if (countRes.success) {
        setUnreadCount(countRes.data.count);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Poll every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'WARNING': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'ERROR': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative text-[#626260] dark:text-[#a1a1aa] hover:text-[#111111] dark:hover:text-[#f4f4f5] hover:bg-[#e8e4dc] dark:hover:bg-[#18181b]" 
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-orange-600 dark:bg-orange-500" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] shadow-lg">
        <div className="flex items-center justify-between p-4 border-b border-[#f5f1ec] dark:border-[#27272a]">
          <h4 className="text-sm font-bold tracking-tight text-[#111111] dark:text-[#f4f4f5]">Notifications</h4>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 px-2 text-[10px] font-bold text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950/20"
              onClick={handleMarkAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[350px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-center p-4">
              <div className="h-10 w-10 rounded-full bg-[#f5f1ec] dark:bg-[#18181b] flex items-center justify-center mb-3">
                <Bell className="h-5 w-5 text-[#7b7b78] dark:text-[#71717a]" />
              </div>
              <p className="text-sm font-medium text-[#111111] dark:text-[#f4f4f5]">All caught up!</p>
              <p className="text-xs text-[#7b7b78] dark:text-[#71717a]">No new notifications for now.</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((n) => (
                <div 
                  key={n.id} 
                  className={cn(
                    "flex gap-3 p-4 transition-colors border-b border-[#f5f1ec] dark:border-[#27272a] last:border-0",
                    !n.isRead ? "bg-orange-50/30 dark:bg-orange-950/5" : "hover:bg-[#f5f1ec]/50 dark:hover:bg-[#18181b]/50"
                  )}
                >
                  <div className="shrink-0 mt-0.5">
                    {getTypeIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-xs leading-none mb-1 tracking-tight",
                      !n.isRead ? "font-bold text-[#111111] dark:text-[#f4f4f5]" : "font-medium text-[#626260] dark:text-[#a1a1aa]"
                    )}>
                      {n.title}
                    </p>
                    <p className="text-[11px] text-[#7b7b78] dark:text-[#71717a] line-clamp-2 leading-normal mb-1.5">
                      {n.message}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#7b7b78] dark:text-[#71717a] font-medium">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </span>
                      {!n.isRead && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-5 w-5 text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950/20"
                          onClick={() => handleMarkAsRead(n.id)}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <div className="p-2 border-t border-[#f5f1ec] dark:border-[#27272a]">
          <Button asChild variant="ghost" className="w-full h-8 text-xs font-bold text-[#626260] dark:text-[#a1a1aa] hover:text-[#111111] dark:hover:text-[#f4f4f5] rounded-lg">
            <Link href="/dashboard/notifications">View all notifications</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
