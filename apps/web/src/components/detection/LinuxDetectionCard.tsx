import { CircleHelp, Laptop } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useLinuxDetection } from '@/hooks/useLinuxDetection';

/**
 * Browser-only "does this look like Linux" indicator. Never attempts to
 * name a specific distribution — see useLinuxDetection for why that isn't
 * reliably possible from a browser.
 */
export function LinuxDetectionCard() {
  const state = useLinuxDetection();

  if (state === 'linux') {
    return (
      <Alert>
        <Laptop />
        <AlertTitle className="flex items-center gap-2">
          Linux detected
          <Badge variant="secondary">Browser signal</Badge>
        </AlertTitle>
        <AlertDescription>Your browser appears to be running on Linux.</AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert>
      <CircleHelp />
      <AlertTitle>Linux could not be confirmed</AlertTitle>
      <AlertDescription>
        {state === 'not-linux'
          ? "This browser doesn't look like Linux. "
          : "Your browser didn't report enough information to tell. "}
        You can still choose your distribution manually below.
      </AlertDescription>
    </Alert>
  );
}
