'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Shield, 
  Key, 
  Fingerprint, 
  History, 
  Lock, 
  AlertTriangle,
  LogOut,
  CheckCircle2,
  Clock,
  Globe,
  Plus,
  ShieldCheck,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import { tokenStorage } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function AdminSecurityPage() {
  const { workspace, user } = useAuth();
  const [isAuditEnabled, setIsAuditEnabled] = useState(false);
  const [isMfaEnforced, setIsMfaEnforced] = useState(false);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingChain, setIsVerifyingChain] = useState(false);
  const [isRecomputingChain, setIsRecomputingChain] = useState(false);
  const [ssoProviders, setSsoProviders] = useState<any[]>([]);
  const [newSsoProvider, setNewSsoProvider] = useState({
    name: '',
    issuer: '',
    domain: '',
    protocol: 'OIDC' as 'OIDC' | 'SAML',
    metadataUrl: '',
  });

  const loadSsoProviders = async () => {
    if (!workspace) return;
    try {
      const res = await fetch(`${API_URL}/api/v1/workspaces/${workspace.workspaceId}/sso-providers`, {
        headers: {
          'Authorization': `Bearer ${tokenStorage.getAccessToken()}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setSsoProviders(data);
      }
    } catch (error) {
      console.error('Failed to load SSO providers', error);
    }
  };

  const handleAddSsoProvider = async () => {
    if (!workspace) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/workspaces/${workspace.workspaceId}/sso-providers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenStorage.getAccessToken()}`,
        },
        body: JSON.stringify(newSsoProvider),
      });

      if (!res.ok) throw new Error('Failed to add SSO provider');
      
      toast.success('SSO Provider added successfully');
      loadSsoProviders();
      setNewSsoProvider({
        name: '',
        issuer: '',
        domain: '',
        protocol: 'OIDC',
        metadataUrl: '',
      });
    } catch (error) {
      toast.error('Failed to add SSO provider');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveSsoProvider = async (providerId: string) => {
    if (!workspace) return;
    if (!confirm('Are you sure you want to remove this SSO provider?')) return;
    
    try {
      const res = await fetch(`${API_URL}/api/v1/workspaces/${workspace.workspaceId}/sso-providers/${providerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${tokenStorage.getAccessToken()}`,
        },
      });

      if (!res.ok) throw new Error('Failed to remove SSO provider');
      
      toast.success('SSO Provider removed');
      loadSsoProviders();
    } catch (error) {
      toast.error('Failed to remove SSO provider');
    }
  };

  const handleRecomputeChain = async () => {
    if (!workspace) return;
    if (!confirm('This will recalculate all hashes in the audit trail. This is a heavy operation. Continue?')) return;
    
    setIsRecomputingChain(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/logs/audit/${workspace.workspaceId}/recompute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenStorage.getAccessToken()}`,
        },
      });

      if (!res.ok) throw new Error('Failed to recompute chain');
      const data = await res.json();
      
      toast.success(`Audit trail recomputed successfully. Processed ${data.count} records.`, {
        icon: <ShieldCheck className="h-4 w-4 text-green-500" />
      });
    } catch (error) {
      toast.error('Failed to recompute audit trail');
    } finally {
      setIsRecomputingChain(false);
    }
  };

  useEffect(() => {
    if (workspace) {
      setIsAuditEnabled(workspace.isAuditEnabled);
      setIsMfaEnforced(workspace.mfaEnforced);
      loadSessions();
    }
  }, [workspace]);

  const loadSessions = async () => {
    if (!workspace) return;
    try {
      const res = await fetch(`${API_URL}/api/v1/workspaces/${workspace.workspaceId}/sessions`, {
        headers: {
          'Authorization': `Bearer ${tokenStorage.getAccessToken()}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setActiveSessions(data);
      }
    } catch (error) {
      console.error('Failed to load sessions', error);
    }
  };

  const handleSaveMfaPolicy = async () => {
    if (!workspace) return;
    
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/workspaces/${workspace.workspaceId}/mfa-policy`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenStorage.getAccessToken()}`,
        },
        body: JSON.stringify({ mfaEnforced: isMfaEnforced }),
      });

      if (!res.ok) throw new Error('Failed to update MFA policy');
      
      toast.success(`MFA enforcement ${isMfaEnforced ? 'enabled' : 'disabled'} successfully.`);
    } catch (error) {
      toast.error('Failed to update MFA policy');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnableAudit = async () => {
    if (!workspace) return;
    
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/workspaces/${workspace.workspaceId}/audit/enable`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenStorage.getAccessToken()}`,
        },
      });

      if (!res.ok) throw new Error('Failed to enable audit logging');
      
      setIsAuditEnabled(true);
      toast.success('Immutable Audit Logging has been enabled for this workspace.');
    } catch (error) {
      toast.error('Failed to enable audit logging');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyIntegrity = async () => {
    if (!workspace) return;
    setIsVerifyingChain(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/logs/audit/${workspace.workspaceId}/verify`, {
        headers: {
          'Authorization': `Bearer ${tokenStorage.getAccessToken()}`,
        },
      });

      if (!res.ok) throw new Error('Failed to verify chain');
      const data = await res.json();
      
      if (data.isValid) {
        toast.success('Audit trail integrity verified. All hash chains are valid.', {
          icon: <ShieldCheck className="h-4 w-4 text-green-500" />
        });
      } else {
        toast.error(`Audit trail integrity compromised! Invalid record: ${data.invalidRecordId}`, {
          icon: <AlertTriangle className="h-4 w-4 text-red-500" />
        });
      }
    } catch (error) {
      toast.error('Failed to verify chain integrity');
    } finally {
      setIsVerifyingChain(false);
    }
  };

  const handleRevokeSession = async (token: string) => {
    try {
      await authClient.revokeSession({ token });
      toast.success('Session revoked successfully');
      loadSessions();
    } catch (error) {
      toast.error('Failed to revoke session');
    }
  };

  const handleRevokeAllSessions = async () => {
    try {
      await authClient.revokeOtherSessions();
      toast.success('All other sessions revoked successfully');
      loadSessions();
    } catch (error) {
      toast.error('Failed to revoke sessions');
    }
  };

  return (
    <AppShell>
      <div className="p-6 max-w-5xl mx-auto space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" /> IT Security & Compliance
            </h1>
            <p className="text-muted-foreground mt-1 text-lg">
              Manage tenant security policies, SSO integrations, and immutable audit trails.
            </p>
          </div>
          <div className="flex gap-2">
            {isAuditEnabled && (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2" 
                  onClick={handleVerifyIntegrity}
                  disabled={isVerifyingChain || isRecomputingChain}
                >
                  <RefreshCw className={`h-4 w-4 ${isVerifyingChain ? 'animate-spin' : ''}`} />
                  Verify Chain
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50" 
                  onClick={handleRecomputeChain}
                  disabled={isVerifyingChain || isRecomputingChain}
                >
                  <History className={`h-4 w-4 ${isRecomputingChain ? 'animate-spin' : ''}`} />
                  Recompute Chain
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Audit Logging Card */}
          <Card className={isAuditEnabled ? 'border-green-500/20 bg-green-500/5' : 'border-amber-500/20 bg-amber-500/5'}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" /> Immutable Audit Trail
                  </CardTitle>
                  <CardDescription>
                    Record every mutation with hash-chaining for SOC 2 compliance.
                  </CardDescription>
                </div>
                {isAuditEnabled ? (
                  <Badge className="bg-green-500">SECURE</Badge>
                ) : (
                  <Badge variant="outline" className="text-amber-600 border-amber-600">DISABLED</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-md bg-background/50 border text-sm">
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                <p>
                  <strong>Irreversible Action:</strong> Once enabled, auditing cannot be disabled. This ensures the integrity of the compliance trail via SHA-256 hash chaining.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                variant={isAuditEnabled ? "outline" : "default"}
                disabled={isAuditEnabled || isLoading}
                onClick={handleEnableAudit}
              >
                {isAuditEnabled ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Compliance Active
                  </>
                ) : (
                  "Enable Immutable Auditing"
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* MFA Policy Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fingerprint className="h-5 w-5" /> MFA Enforcement
              </CardTitle>
              <CardDescription>
                Require all users in this organization to use Two-Factor Authentication.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="mfa-enforce" className="flex flex-col space-y-1">
                  <span>Enforce MFA for all members</span>
                  <span className="font-normal text-xs text-muted-foreground">
                    Users without MFA will be prompted to set it up on next login.
                  </span>
                </Label>
                <Switch 
                  id="mfa-enforce" 
                  checked={isMfaEnforced}
                  onCheckedChange={setIsMfaEnforced}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={handleSaveMfaPolicy}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Policy
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* SSO Integration Section */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" /> Single Sign-On (SSO)
                </CardTitle>
                <CardDescription>
                  Configure Enterprise SSO providers like Azure AD, Okta, or Google Workspace.
                </CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Plus className="h-4 w-4" /> Add Provider
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Configure SSO Provider</DialogTitle>
                    <DialogDescription>
                      Add a SAML 2.0 or OIDC provider for your organization.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Provider Name</Label>
                      <Input 
                        placeholder="e.g. Azure AD" 
                        value={newSsoProvider.name}
                        onChange={(e) => setNewSsoProvider({...newSsoProvider, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Domain</Label>
                      <Input 
                        placeholder="e.g. acme.com" 
                        value={newSsoProvider.domain}
                        onChange={(e) => setNewSsoProvider({...newSsoProvider, domain: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Protocol</Label>
                      <select 
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={newSsoProvider.protocol}
                        onChange={(e) => setNewSsoProvider({...newSsoProvider, protocol: e.target.value as any})}
                      >
                        <option value="SAML">SAML 2.0</option>
                        <option value="OIDC">OIDC (OpenID Connect)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>{newSsoProvider.protocol === 'SAML' ? 'Metadata URL' : 'Issuer URL'}</Label>
                      <Input 
                        placeholder="https://..." 
                        value={newSsoProvider.metadataUrl}
                        onChange={(e) => setNewSsoProvider({...newSsoProvider, metadataUrl: e.target.value, issuer: e.target.value})}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAddSsoProvider} disabled={isLoading || !newSsoProvider.name || !newSsoProvider.domain || !newSsoProvider.metadataUrl}>
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Save Configuration
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {ssoProviders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg">
                <Key className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                <h3 className="font-semibold text-lg">No SSO Providers Configured</h3>
                <p className="text-muted-foreground max-w-xs mx-auto">
                  Connect your identity provider to allow users to sign in with their corporate credentials.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {ssoProviders.map((provider) => (
                  <div key={provider.id} className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Globe className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {provider.issuer.includes('microsoft') ? 'Azure AD' : provider.issuer.includes('google') ? 'Google Workspace' : 'SSO Provider'}
                          <Badge variant="outline" className="text-[10px]">{provider.samlConfig ? 'SAML' : 'OIDC'}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">{provider.domain}</div>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemoveSsoProvider(provider.id)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Sessions Management */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" /> Active Sessions Management
                </CardTitle>
                <CardDescription>
                  Monitor and revoke active sessions to protect compromised accounts.
                </CardDescription>
              </div>
              <Button variant="destructive" size="sm" onClick={handleRevokeAllSessions} disabled={activeSessions.length <= 1}>
                <LogOut className="h-4 w-4 mr-2" /> Revoke All Other Sessions
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">User / Device</TableHead>
                  <TableHead>Location / IP</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right pr-6">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeSessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No active sessions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  activeSessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="pl-6 font-medium">
                        <div className="flex flex-col">
                          <span className="text-sm">{session.user?.username || session.user?.email}</span>
                          <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                            {session.userAgent.split('(')[0] || 'Unknown Browser'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-[10px] font-mono">{session.ipAddress || '127.0.0.1'}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(session.updatedAt).toLocaleTimeString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px]">
                          CURRENT
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleRevokeSession(session.token)}
                        >
                          <LogOut className="h-4 w-4 mr-2" /> Revoke
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="border-t bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground">
              Revoking a session will immediately invalidate the user's access token and force them to re-authenticate.
            </p>
          </CardFooter>
        </Card>
      </div>
    </AppShell>
  );
}
