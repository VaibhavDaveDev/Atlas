'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { setupFinance } from '@/lib/finance';
import { Loader2, Landmark, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/contexts/AuthContext';
import { workspaceApi } from '@/lib/workspace';

export function FinanceSetupWizard({ onSuccess }: { onSuccess: () => void }) {
  const { workspace, setWorkspaces } = useAuth();
  const [loading, setLoading] = useState(false);
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [fiscalYearStart, setFiscalYearStart] = useState('01-01');

  const handleSetup = async () => {
    setLoading(true);
    try {
      await setupFinance({ baseCurrency, fiscalYearStart });
      
      // We'll just rely on the onSuccess callback to trigger a local refresh
      // The parent component already handles the workspace re-fetching
      
      toast.success('Finance module initialized successfully!');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to initialize finance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
      <Card className="w-full max-w-md shadow-2xl border-[#d3cec6] dark:border-[#27272a]">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Landmark className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Initialize Finance Module</CardTitle>
          <CardDescription>
            Configure your workspace's economic environment to get started with Atlas Finance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="currency">Base Currency</Label>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">
              Used for all General Ledger entries
            </p>
            <Select value={baseCurrency} onValueChange={setBaseCurrency}>
              <SelectTrigger id="currency">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD - US Dollar</SelectItem>
                <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                <SelectItem value="EUR">EUR - Euro</SelectItem>
                <SelectItem value="GBP">GBP - British Pound</SelectItem>
                <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fiscalStart">Fiscal Year Start</Label>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">
              MM-DD format (e.g. 04-01 for April 1st)
            </p>
            <Input 
              id="fiscalStart" 
              placeholder="01-01" 
              value={fiscalYearStart} 
              onChange={(e) => setFiscalYearStart(e.target.value)}
            />
          </div>

          <div className="rounded-lg bg-muted p-4 space-y-2">
            <h4 className="text-sm font-bold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              What happens next?
            </h4>
            <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1">
              <li>A standard Chart of Accounts (COA) will be generated.</li>
              <li>A default Exchange Gain/Loss account will be created.</li>
              <li>Multi-currency features will be enabled.</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full h-11" 
            onClick={handleSetup} 
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Initializing...
              </>
            ) : (
              'Complete Setup'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
