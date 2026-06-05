'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { User, Building2, Briefcase, Calendar, Save, Landmark, Heart, ShieldAlert, Eye, EyeOff, Link2, Loader2 } from 'lucide-react';
import { getMyProfile, updateMyProfile, syncCalendar } from '@/lib/ess';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { authClient } from '@/lib/auth-client';

interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

interface BankDetails {
  bankName: string;
  accountNo: string;
  ifscCode: string;
}

interface Profile {
  fullName: string;
  email: string;
  mobileNo?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  maritalStatus?: string;
  panNumber?: string;
  pfAccount?: string;
  esiNumber?: string;
  aadhaarNumber?: string;
  avatarUrl?: string;
  designation?: { title: string };
  department?: { name: string };
  dateOfJoining?: string;
  employeeNumber?: string;
  status?: string;
  reportingTo?: { fullName: string };
  emergencyContact?: EmergencyContact;
  bankDetails?: BankDetails;
}

export default function EssProfilePage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);
  const [isGoogleLinked, setIsGoogleLinked] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [linkedGoogleEmail, setLinkedGoogleEmail] = useState<string | null>(null);

  // Editable fields
  const [mobileNo, setMobileNo] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [pfAccount, setPfAccount] = useState('');
  const [esiNumber, setEsiNumber] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [emergencyContact, setEmergencyContact] = useState<EmergencyContact>({ name: '', relationship: '', phone: '' });
  const [bankDetails, setBankDetails] = useState<BankDetails>({ bankName: '', accountNo: '', ifscCode: '' });

  // Masking state
  const [showSensitive, setShowSensitive] = useState({
    accountNo: false,
    panNumber: false,
    aadhaarNumber: false
  });
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Check if Google is already linked
  useEffect(() => {
    async function checkLinkedAccounts() {
      try {
        const accounts = await authClient.listAccounts();
        if (accounts?.data) {
          const googleAccount = accounts.data.find(
            (a: any) => a.provider === 'google'
          );
          setIsGoogleLinked(!!googleAccount);
          setLinkedGoogleEmail(googleAccount?.accountId || null);
        }
      } catch (e) {
        // silently fail — not critical
      }
    }
    checkLinkedAccounts();
  }, []);

  // Handle OAuth return — Better Auth appends ?error= on failure
  useEffect(() => {
    const error = searchParams.get('error');
    const linked = searchParams.get('linked');
    if (error) {
      const msg = error === "email_doesn't_match"
        ? 'Google account email does not match. Your Atlas admin may need to enable cross-email linking.'
        : `Failed to connect Google: ${error.replace(/_/g, ' ')}`.trim();
      toast.error(msg);
      // Clean the URL
      router.replace('/dashboard/ess/profile');
    } else if (linked === 'google') {
      toast.success('Google Calendar connected successfully!');
      setIsGoogleLinked(true);
      handleManualSync(); // Sync immediately after link
      router.replace('/dashboard/ess/profile');
    }
  }, [searchParams, router]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const result = await syncCalendar();
      toast.success(`Synced ${result.succeeded} upcoming events to your Google Calendar!`);
    } catch (error) {
      console.error('Manual sync failed', error);
      toast.error('Failed to sync events to Google Calendar');
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      try {
        const data = await getMyProfile();
        setProfile(data);
        setMobileNo(data.mobileNo || '');
        setPhone(data.phone || '');
        setDateOfBirth(data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split('T')[0] : '');
        setGender(data.gender || '');
        setMaritalStatus(data.maritalStatus || '');
        setPanNumber(data.panNumber || '');
        setPfAccount(data.pfAccount || '');
        setEsiNumber(data.esiNumber || '');
        setAadhaarNumber(data.aadhaarNumber || '');
        if (data.emergencyContact) setEmergencyContact(data.emergencyContact);
        if (data.bankDetails) setBankDetails(data.bankDetails);
      } catch (error) {
        console.error('Failed to fetch profile', error);
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    }
    
    // Only fetch if we have a user session (or attempt anyway if we want to handle 401)
    fetchProfile();
  }, [user?.id]); // Re-run if user ID changes

  const handleLinkGoogle = async () => {
    setIsLinkingGoogle(true);
    try {
      // Use a clean URL without any existing query params as the callback
      const callbackURL = `${window.location.origin}/dashboard/ess/profile?linked=google`;
      await authClient.linkSocial({
        provider: 'google',
        callbackURL,
        scopes: [
          'https://www.googleapis.com/auth/calendar.events',
          'email',
          'profile',
        ],
      });
      // This code is unreachable — linkSocial redirects the browser to Google.
    } catch (error) {
      console.error('Failed to link Google account', error);
      toast.error('Failed to initiate Google connection');
      setIsLinkingGoogle(false);
    }
  };

  const validateFields = () => {
    if (mobileNo && !/^\+?[\d\s-]{10,15}$/.test(mobileNo)) {
      toast.error('Invalid mobile number format');
      return false;
    }
    if (panNumber && panNumber !== 'REDACTED' && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber)) {
      toast.error('Invalid PAN number format');
      return false;
    }
    if (aadhaarNumber && aadhaarNumber !== 'REDACTED' && !/^\d{12}$/.test(aadhaarNumber.replace(/\s/g, ''))) {
      toast.error('Aadhaar number must be 12 digits');
      return false;
    }
    return true;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateFields()) return;
    setSaving(true);
    try {
      await updateMyProfile({
        mobileNo,
        phone,
        dateOfBirth: dateOfBirth || null,
        gender,
        maritalStatus,
        panNumber,
        pfAccount,
        esiNumber,
        aadhaarNumber,
        emergencyContact,
        bankDetails,
      });
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };


  const maskValue = (value: string, show: boolean, visibleCount: number = 4) => {
    if (!value) return '';
    if (show) return value;
    if (value.length <= visibleCount) return value;
    const maskedPart = '*'.repeat(value.length - visibleCount);
    const visiblePart = value.slice(-visibleCount);
    return maskedPart + visiblePart;
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6 flex flex-col items-center justify-center h-[60vh]">
        <div className="h-12 w-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-[#626260]">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="h-24 w-24 rounded-2xl bg-white dark:bg-[#e2e2e2] border border-[#d3cec6] dark:border-[#27272a] flex items-center justify-center text-3xl font-bold overflow-hidden shadow-sm">
            <img 
              src={user?.image || profile?.avatarUrl || `https://api.dicebear.com/7.x/lorelei/svg?seed=${user?.username || 'user'}`} 
              alt={profile?.fullName || 'Avatar'} 
              className="h-full w-full object-cover" 
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#111111] dark:text-[#f4f4f5]">{profile?.fullName}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-[#626260] dark:text-[#a1a1aa]">
              <span className="flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" /> {profile?.designation?.title || 'No Designation'}</span>
              <span className="h-1 w-1 rounded-full bg-[#d3cec6]" />
              <span className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" /> {profile?.department?.name || 'No Department'}</span>
              <span className="h-1 w-1 rounded-full bg-[#d3cec6]" />
              <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Joined {profile?.dateOfJoining ? new Date(profile.dateOfJoining).toLocaleDateString() : '---'}</span>
            </div>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]">
          {saving ? 'Saving...' : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* Personal Information */}
          <Card className="border-[#d3cec6] dark:border-[#27272a] shadow-none overflow-hidden">
            <CardHeader className="bg-[#f5f1ec]/50 dark:bg-[#09090b]/50 border-b border-[#d3cec6] dark:border-[#27272a]">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-[#7b7b78] flex items-center gap-2">
                <User className="h-4 w-4" /> Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={profile?.fullName || ''} disabled className="bg-muted/50 cursor-not-allowed border-[#d3cec6]" />
                </div>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input value={profile?.email || ''} disabled className="bg-muted/50 cursor-not-allowed border-[#d3cec6]" />
                </div>
                <div className="space-y-2">
                  <Label>Mobile Number</Label>
                  <Input value={mobileNo} onChange={(e) => setMobileNo(e.target.value)} placeholder="+91 XXXXX XXXXX" className="border-[#d3cec6]" />
                </div>
                <div className="space-y-2">
                  <Label>Alternate Phone</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" className="border-[#d3cec6]" />
                </div>

              </div>

              <Separator className="bg-[#f5f1ec] dark:bg-[#27272a]" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className="border-[#d3cec6]" />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-[#d3cec6] dark:border-[#27272a] bg-white dark:bg-[#121214] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-[#111111] dark:text-[#f4f4f5]"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                  >
                    <option value="" className="dark:bg-[#121214]">Select gender...</option>
                    <option value="Male" className="dark:bg-[#121214]">Male</option>
                    <option value="Female" className="dark:bg-[#121214]">Female</option>
                    <option value="Other" className="dark:bg-[#121214]">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Marital Status</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-[#d3cec6] dark:border-[#27272a] bg-white dark:bg-[#121214] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-[#111111] dark:text-[#f4f4f5]"
                    value={maritalStatus}
                    onChange={(e) => setMaritalStatus(e.target.value)}
                  >
                    <option value="" className="dark:bg-[#121214]">Select status...</option>
                    <option value="Single" className="dark:bg-[#121214]">Single</option>
                    <option value="Married" className="dark:bg-[#121214]">Married</option>
                    <option value="Divorced" className="dark:bg-[#121214]">Divorced</option>
                    <option value="Widowed" className="dark:bg-[#121214]">Widowed</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statutory Information */}
          <Card className="border-[#d3cec6] dark:border-[#27272a] shadow-none overflow-hidden">
            <CardHeader className="bg-[#f5f1ec]/50 dark:bg-[#09090b]/50 border-b border-[#d3cec6] dark:border-[#27272a]">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-[#7b7b78] flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" /> Statutory Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>PAN Number</Label>
                  <div className="relative">
                    <Input 
                      value={focusedField === 'panNumber' || showSensitive.panNumber ? panNumber : maskValue(panNumber, false, 2)} 
                      onChange={(e) => setPanNumber(e.target.value.toUpperCase())} 
                      onFocus={() => setFocusedField('panNumber')}
                      onBlur={() => setFocusedField(null)}
                      className="border-[#d3cec6] uppercase pr-10"
                      placeholder="ABCDE1234F"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowSensitive(prev => ({ ...prev, panNumber: !prev.panNumber }))}
                      className="absolute right-3 top-2.5 text-[#7b7b78] hover:text-[#111111] dark:hover:text-[#f4f4f5]"
                    >
                      {showSensitive.panNumber ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Aadhaar Number</Label>
                  <div className="relative">
                    <Input 
                      value={focusedField === 'aadhaarNumber' || showSensitive.aadhaarNumber ? aadhaarNumber : maskValue(aadhaarNumber, false, 4)} 
                      onChange={(e) => setAadhaarNumber(e.target.value)} 
                      onFocus={() => setFocusedField('aadhaarNumber')}
                      onBlur={() => setFocusedField(null)}
                      className="border-[#d3cec6] pr-10"
                      placeholder="1234 5678 9012"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowSensitive(prev => ({ ...prev, aadhaarNumber: !prev.aadhaarNumber }))}
                      className="absolute right-3 top-2.5 text-[#7b7b78] hover:text-[#111111] dark:hover:text-[#f4f4f5]"
                    >
                      {showSensitive.aadhaarNumber ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>PF Account Number</Label>
                  <Input 
                    value={pfAccount} 
                    onChange={(e) => setPfAccount(e.target.value)} 
                    className="border-[#d3cec6]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>ESI Number</Label>
                  <Input 
                    value={esiNumber} 
                    onChange={(e) => setEsiNumber(e.target.value)} 
                    className="border-[#d3cec6]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card className="border-[#d3cec6] dark:border-[#27272a] shadow-none overflow-hidden">
            <CardHeader className="bg-[#f5f1ec]/50 dark:bg-[#09090b]/50 border-b border-[#d3cec6] dark:border-[#27272a]">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-[#7b7b78] flex items-center gap-2">
                <Heart className="h-4 w-4 text-rose-500" /> Emergency Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Contact Name</Label>
                  <Input 
                    value={emergencyContact.name} 
                    onChange={(e) => setEmergencyContact({...emergencyContact, name: e.target.value})} 
                    className="border-[#d3cec6]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Relationship</Label>
                  <Input 
                    value={emergencyContact.relationship} 
                    onChange={(e) => setEmergencyContact({...emergencyContact, relationship: e.target.value})} 
                    className="border-[#d3cec6]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input 
                    value={emergencyContact.phone} 
                    onChange={(e) => setEmergencyContact({...emergencyContact, phone: e.target.value})} 
                    className="border-[#d3cec6]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bank Details */}
          <Card className="border-[#d3cec6] dark:border-[#27272a] shadow-none overflow-hidden">
            <CardHeader className="bg-[#f5f1ec]/50 dark:bg-[#09090b]/50 border-b border-[#d3cec6] dark:border-[#27272a]">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-[#7b7b78] flex items-center gap-2">
                <Landmark className="h-4 w-4" /> Bank Account Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Bank Name</Label>
                  <Input 
                    value={bankDetails.bankName} 
                    onChange={(e) => setBankDetails({...bankDetails, bankName: e.target.value})} 
                    className="border-[#d3cec6]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Account Number</Label>
                  <div className="relative">
                    <Input 
                      value={focusedField === 'accountNo' || showSensitive.accountNo ? bankDetails.accountNo : maskValue(bankDetails.accountNo, false)} 
                      onChange={(e) => setBankDetails({...bankDetails, accountNo: e.target.value})} 
                      onFocus={() => setFocusedField('accountNo')}
                      onBlur={() => setFocusedField(null)}
                      className="border-[#d3cec6] pr-10"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowSensitive(prev => ({ ...prev, accountNo: !prev.accountNo }))}
                      className="absolute right-3 top-2.5 text-[#7b7b78] hover:text-[#111111] dark:hover:text-[#f4f4f5]"
                    >
                      {showSensitive.accountNo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>IFSC Code</Label>
                  <Input 
                    value={bankDetails.ifscCode} 
                    onChange={(e) => setBankDetails({...bankDetails, ifscCode: e.target.value.toUpperCase()})} 
                    className="border-[#d3cec6] uppercase"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar info */}
        <div className="space-y-8">
          <Card className="border-[#d3cec6] dark:border-[#27272a] shadow-none">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-[#7b7b78]">Employment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-[#626260]">Employee ID</span>
                <span className="font-bold">{profile?.employeeNumber || '---'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#626260]">Reporting To</span>
                <span className="font-bold text-blue-600">{profile?.reportingTo?.fullName || 'No Manager'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#626260]">Work Status</span>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-none uppercase text-[9px]">{profile?.status || 'Unknown'}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#d3cec6] dark:border-[#27272a] shadow-none overflow-hidden text-wrap">
            <CardHeader className="bg-[#f5f1ec]/50 dark:bg-[#09090b]/50 border-b border-[#d3cec6] dark:border-[#27272a]">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-[#7b7b78] flex items-center gap-2">
                <Link2 className="h-4 w-4" /> Connected Accounts
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <p className="text-xs text-[#626260] dark:text-[#a1a1aa] leading-relaxed">
                Connect your external accounts to synchronize your calendar and enable additional features.
              </p>
              
              <div className="pt-2">
                {isGoogleLinked ? (
                  /* ── Already linked state ── */
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-900/10 p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 flex items-center justify-center bg-white dark:bg-transparent rounded-full overflow-hidden shrink-0">
                        <svg viewBox="0 0 24 24" className="h-4 w-4">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Google Calendar Connected</p>
                        {linkedGoogleEmail && (
                          <p className="text-[10px] text-emerald-600/80 dark:text-emerald-500/80 truncate">{linkedGoogleEmail}</p>
                        )}
                      </div>
                      <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 shadow-none text-[9px] uppercase shrink-0">
                        Active
                      </Badge>
                    </div>
                    <div className="flex flex-col gap-2 pt-1">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={handleManualSync}
                        disabled={isSyncing}
                        className="h-8 justify-start px-0 text-emerald-700 dark:text-emerald-400 hover:bg-transparent hover:text-emerald-800 font-bold text-[11px] uppercase tracking-wider group"
                      >
                        {isSyncing ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-2" />
                        ) : (
                          <Link2 className="h-3 w-3 mr-2 transition-transform group-hover:rotate-12" />
                        )}
                        {isSyncing ? 'Syncing...' : 'Sync Upcoming Events'}
                      </Button>
                      <button
                        onClick={handleLinkGoogle}
                        disabled={isLinkingGoogle}
                        className="text-[10px] text-emerald-700/70 dark:text-emerald-500/70 hover:text-emerald-700 dark:hover:text-emerald-400 underline underline-offset-2 transition-colors text-left"
                      >
                        {isLinkingGoogle ? 'Reconnecting...' : 'Reconnect / re-authorize'}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── Not linked state ── */
                  <Button
                    onClick={handleLinkGoogle}
                    disabled={isLinkingGoogle}
                    variant="outline"
                    className="w-full justify-start gap-3 border-[#d3cec6] dark:border-[#27272a] hover:bg-[#f5f1ec] dark:hover:bg-[#1a1a1e] text-[#111111] dark:text-[#f4f4f5] font-semibold h-11"
                  >
                    {isLinkingGoogle ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <div className="h-5 w-5 flex items-center justify-center bg-white dark:bg-transparent rounded-full overflow-hidden">
                        <svg viewBox="0 0 24 24" className="h-4 w-4">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                      </div>
                    )}
                    {isLinkingGoogle ? 'Connecting...' : 'Connect Google Calendar'}
                  </Button>
                )}
                <p className="text-[10px] text-[#7b7b78] dark:text-[#71717a] mt-3 italic leading-tight">
                  {isGoogleLinked
                    ? 'Atlas will sync company events and holidays to your Google Calendar.'
                    : 'This will allow Atlas to synchronize company events and holidays with your Google Calendar.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
