import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Download, Smartphone } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

interface PWAInstallPromptProps {
  onDismiss?: () => void;
}

const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ onDismiss }) => {
  const { isInstallable, showInstallPrompt, dismissInstallPrompt } = usePWA();

  if (!isInstallable) return null;

  const handleInstall = async () => {
    const success = await showInstallPrompt();
    if (success) {
      onDismiss?.();
    }
  };

  const handleDismiss = () => {
    dismissInstallPrompt();
    onDismiss?.();
  };

  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 p-4 bg-gradient-primary border-primary/20 shadow-colormaq md:left-auto md:right-4 md:max-w-sm animate-in slide-in-from-bottom-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <Smartphone className="w-6 h-6 text-primary-foreground" />
        </div>
        
        <div className="flex-1 space-y-2">
          <h3 className="font-semibold text-primary-foreground">
            Instalar LabelGuard
          </h3>
          <p className="text-sm text-primary-foreground/90">
            Adicione à tela inicial para acesso rápido e funcionamento offline completo
          </p>
          
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleInstall}
              size="sm"
              variant="secondary"
              className="flex-1 bg-white/20 hover:bg-white/30 text-primary-foreground border-white/30"
            >
              <Download className="w-4 h-4 mr-2" />
              Instalar
            </Button>
            
            <Button
              onClick={handleDismiss}
              size="sm"
              variant="ghost"
              className="text-primary-foreground hover:bg-white/10"
            >
              Depois
            </Button>
          </div>
        </div>
        
        <Button
          onClick={handleDismiss}
          size="sm"
          variant="ghost"
          className="flex-shrink-0 p-1 text-primary-foreground hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
};

export default PWAInstallPrompt;