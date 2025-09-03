import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wifi, WifiOff } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

const OfflineIndicator: React.FC = () => {
  const { isOnline } = usePWA();

  if (isOnline) return null;

  return (
    <Alert className="mb-4 bg-warning/10 border-warning text-warning-foreground">
      <WifiOff className="h-4 w-4" />
      <AlertDescription className="font-medium">
        Modo Offline - Todos os dados são salvos localmente
      </AlertDescription>
    </Alert>
  );
};

export default OfflineIndicator;