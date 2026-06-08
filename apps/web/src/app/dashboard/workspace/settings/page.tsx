'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Users, 
  Settings, 
  Globe, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  UserPlus, 
  ShieldCheck, 
  CalendarClock,
  ArrowRightLeft
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { tokenStorage, API_BASE } from '@/lib/auth';
import { workspaceApi } from '@/lib/workspace';
import { cn } from '@/lib/utils';

export default function WorkspaceSettingsPage() {
  const { workspace } = useAuth();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('USER');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [roles, setRoles] = useState<any[]>([]);
  const [countries, setCountries] = useState<{ key: string; value: string }[]>([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [isRegionLoading, setIsRegionLoading] = useState(false);
  const [isSavingRegion, setIsSavingRegion] = useState(false);
  const [weekendHolidays, setWeekendHolidays] = useState<number[]>([]);

  // Confirmation dialog state
  const [showConfirm, setShowConfirm] = useState(false);
  const [existingMember, setExistingMember] = useState<{ isMember: boolean; role: string } | null>(null);

  useEffect(() => {
    if (workspace?.workspaceId) {
      loadRoles();
      loadCountries();
      setSelectedCountry(workspace?.settings?.countryCode || '');
      setWeekendHolidays((workspace?.settings?.weekendHolidays as number[]) || []);
    }
  }, [workspace]);

  const loadRoles = async () => {
    try {
      const rolesData = await workspaceApi.getRoles();
      setRoles(rolesData);
      
      // Default to USER role if it exists
      if (rolesData.some((r: any) => r.name === 'USER')) {
        setRole('USER');
      } else if (rolesData.length > 0) {
        setRole(rolesData[0].name);
      }
    } catch (err) {
      console.error('Failed to load roles:', err);
    }
  };

  const loadCountries = async () => {
    setIsRegionLoading(true);
    try {
      const data = await workspaceApi.getAvailableCountries();
      // Nager.Date API returns [{ countryCode: "AD", name: "Andorra" }]
      // Map to expected { key, value } format
      const formatted = Array.isArray(data) 
        ? data.map((c: any) => ({ key: c.countryCode, value: c.name }))
        : [];
      setCountries(formatted);
    } catch (err) {
      console.error('Failed to load countries:', err);
      setError('Failed to load available countries');
    } finally {
      setIsRegionLoading(false);
    }
  };

  const handleUpdateRegion = async () => {
    if (!selectedCountry) return;
    setIsSavingRegion(true);
    try {
      const result = await workspaceApi.updateSettings({
        countryCode: selectedCountry,
        weekendHolidays: weekendHolidays
      });
      
      // Update local state with the saved values
      if (result.data?.settings) {
        setSelectedCountry(result.data.settings.countryCode || selectedCountry);
        setWeekendHolidays(result.data.settings.weekendHolidays || weekendHolidays);
      }
      
      toast.success('Regional settings updated successfully');
    } catch (err: any) {
      console.error('Failed to update settings:', err);
      toast.error(err.message || 'Failed to update settings');
    } finally {
      setIsSavingRegion(false);
    }
  };

  const handleInviteClick = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!workspace?.workspaceId) return;
      // Check if user is already a member
      const checkRes = await fetch(`${API_BASE}/workspaces/${workspace.workspaceId}/members/check?email=${email}`, {
        credentials: 'include',
      });
      const checkData = await checkRes.json();

      if (checkData.isMember) {
        setExistingMember(checkData);
        setShowConfirm(true);
      } else {
        await sendInvite();
      }
    } catch (err) {
      setError('Failed to check member status');
    } finally {
      setIsLoading(false);
    }
  };

  const sendInvite = async () => {
    if (!workspace?.workspaceId) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/workspaces/${workspace.workspaceId}/invites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, roleName: role }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to send invite');
      }

      setSuccess('Invite sent successfully!');
      setEmail('');
      setShowConfirm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invite');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleWeekend = (day: number) => {
    setWeekendHolidays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  return (
    <AppShell>
      <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-10 animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[#111111] dark:text-[#f4f4f5]">Workspace Settings</h1>
          <p className="mt-1 text-sm text-[#626260] dark:text-[#a1a1aa]">Manage your workspace members, roles, and organizational preferences.</p>
        </div>

        <div className="grid gap-8">
          {/* Invite Section */}
          <div className="rounded-xl border border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] overflow-hidden shadow-none">
            <div className="px-6 py-4 border-b border-[#f5f1ec] dark:border-[#1a1a1e] bg-[#f5f1ec]/30 dark:bg-[#09090b]/30">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#111111] dark:text-[#f4f4f5] flex items-center gap-2.5">
                <Users className="h-4 w-4" /> Invite New Members
              </h2>
            </div>
            <div className="p-6">
              <form onSubmit={handleInviteClick} className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-[#7b7b78] dark:text-[#71717a]">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="colleague@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-transparent border-[#d3cec6] dark:border-[#27272a] focus-visible:ring-[#111111] dark:focus-visible:ring-[#f4f4f5]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-xs font-bold uppercase tracking-wider text-[#7b7b78] dark:text-[#71717a]">Workspace Role</Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger id="role" className="bg-transparent border-[#d3cec6] dark:border-[#27272a] focus:ring-[#111111] dark:focus:ring-[#f4f4f5]">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map(r => (
                          <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {error && (
                  <div className="text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-100 dark:border-red-900/30 flex items-start gap-3 animate-in fade-in duration-200">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    {error}
                  </div>
                )}

                {success && (
                  <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-lg border border-emerald-100 dark:border-emerald-900/30 flex items-start gap-3 animate-in fade-in duration-200">
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                    {success}
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-[#111111] hover:bg-[#222222] text-white dark:bg-[#f4f4f5] dark:text-[#09090b] dark:hover:bg-[#e4e4e7] font-bold rounded-xl px-8 h-11 shadow-sm transition-all disabled:opacity-50"
                  >
                    {isLoading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking...</>
                    ) : (
                      <><UserPlus className="mr-2 h-4 w-4" /> Send Invitation</>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Region & Holidays Section */}
          <div className="rounded-xl border border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] overflow-hidden shadow-none">
            <div className="px-6 py-4 border-b border-[#f5f1ec] dark:border-[#1a1a1e] bg-[#f5f1ec]/30 dark:bg-[#09090b]/30">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#111111] dark:text-[#f4f4f5] flex items-center gap-2.5">
                <Globe className="h-4 w-4" /> Region & Holidays
              </h2>
            </div>
            <div className="p-6 space-y-10">
              <div className="grid gap-8 sm:grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-[#7b7b78] dark:text-[#71717a]">Workspace Region (for Holidays)</Label>
                    {isRegionLoading ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground p-2 border rounded-md border-dashed">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading countries...
                      </div>
                    ) : (
                      <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                        <SelectTrigger className="flex h-11 w-full rounded-xl border border-[#d3cec6] dark:border-[#27272a] bg-transparent px-3 py-1 text-sm transition-all focus:ring-1 focus:ring-[#111111] dark:focus:ring-[#f4f4f5]">
                          <SelectValue placeholder="Select a country..." />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map(c => (
                            <SelectItem key={c.key} value={c.key}>{c.value}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1">This will automatically sync public holidays to the workspace calendar.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-xs font-bold uppercase tracking-wider text-[#7b7b78] dark:text-[#71717a]">Weekly Holidays (Weekends)</Label>
                  <div className="flex flex-wrap gap-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                      <button
                        key={day}
                        onClick={() => toggleWeekend(index)}
                        className={cn(
                          "px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg border transition-all",
                          weekendHolidays.includes(index)
                            ? "bg-[#111111] text-white border-[#111111] dark:bg-[#f4f4f5] dark:text-[#09090b] dark:border-[#f4f4f5]"
                            : "bg-transparent text-[#7b7b78] border-[#d3cec6] dark:border-[#27272a] hover:border-[#111111] dark:hover:border-[#f4f4f5]"
                        )}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground">Selected days will be marked as recurring holidays on the calendar.</p>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-[#f5f1ec] dark:border-[#1a1a1e]">
                <Button
                  onClick={handleUpdateRegion}
                  disabled={isSavingRegion || !selectedCountry}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-10 h-11 shadow-sm transition-all"
                >
                  {isSavingRegion ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                  ) : (
                    <><Settings className="mr-2 h-4 w-4" /> Save Regional Preferences</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Role Change Confirmation Dialog */}
        <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
          <DialogContent className="rounded-2xl border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-amber-600 dark:text-amber-500 tracking-tight text-xl font-bold">
                <ShieldCheck className="h-6 w-6" /> Existing Member
              </DialogTitle>
              <DialogDescription className="text-sm pt-2">
                This user is already a member of the workspace with the <strong>{existingMember?.role}</strong> role. 
                Do you want to update their role to <strong>{role}</strong>?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-3 sm:gap-0 mt-6 pt-6 border-t border-[#f5f1ec] dark:border-[#1a1a1e]">
              <Button variant="ghost" onClick={() => setShowConfirm(false)} className="rounded-xl font-bold">Cancel</Button>
              <Button onClick={sendInvite} className="bg-[#111111] dark:bg-[#f4f4f5] dark:text-[#09090b] rounded-xl font-bold px-6">
                Update User Role
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
