import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { XCircle, AlertTriangle } from 'lucide-react';
import { AudioFeedback } from '@/utils/audioFeedback';

interface RejectedModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  serial1: string;
  serial2: string;
}

const RejectedModal: React.FC<RejectedModalProps> = ({ 
  isOpen, 
  onConfirm, 
  serial1, 
  serial2 
}) => {
  const handleConfirm = () => {
    AudioFeedback.stopAlarm();
    onConfirm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-[500px] bg-error/5 border-error"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl text-error">
            <XCircle className="w-8 h-8" />
            PRODUTO REPROVADO
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="flex items-center justify-center">
            <div className="bg-error/10 p-4 rounded-full">
              <AlertTriangle className="w-16 h-16 text-error animate-pulse" />
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-lg font-semibold text-error mb-4">
              Os códigos das etiquetas não coincidem!
            </p>
            <p className="text-muted-foreground">
              Verifique as etiquetas e tente novamente.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <Card className="p-4 bg-muted/50">
              <div className="text-sm text-muted-foreground mb-1">Código 1:</div>
              <div className="font-mono text-lg break-all bg-background p-2 rounded border">
                {serial1}
              </div>
            </Card>
            
            <Card className="p-4 bg-muted/50">
              <div className="text-sm text-muted-foreground mb-1">Código 2:</div>
              <div className="font-mono text-lg break-all bg-background p-2 rounded border">
                {serial2}
              </div>
            </Card>
          </div>

          <Button 
            onClick={handleConfirm}
            className="w-full bg-error hover:bg-error/90 text-error-foreground text-lg py-6"
            size="lg"
          >
            CONFIRMAR E CONTINUAR
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RejectedModal;