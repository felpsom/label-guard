import React from 'react';
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-red-600 flex items-center justify-center p-4 animate-pulse">
      <div className="w-full max-w-2xl space-y-8 text-center">
        {/* Ícone de alerta piscando */}
        <div className="flex justify-center">
          <div className="bg-red-800/30 p-6 rounded-full">
            <XCircle className="w-24 h-24 md:w-32 md:h-32 text-white animate-bounce" />
          </div>
        </div>
        
        {/* Título principal */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold text-white uppercase tracking-wide">
            PRODUTO REPROVADO
          </h1>
          <div className="bg-red-800/30 p-2 rounded">
            <AlertTriangle className="w-8 h-8 text-yellow-300 mx-auto mb-2 animate-pulse" />
            <p className="text-xl md:text-2xl font-semibold text-white">
              CÓDIGOS NÃO COINCIDEM!
            </p>
          </div>
        </div>

        {/* Códigos em destaque */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 bg-red-800/20 border-2 border-red-400">
            <div className="text-white/80 mb-2 text-lg font-semibold">CÓDIGO 1:</div>
            <div className="font-mono text-2xl break-all bg-white/10 p-4 rounded text-white border-2 border-red-400">
              {serial1}
            </div>
          </Card>
          
          <Card className="p-6 bg-red-800/20 border-2 border-red-400">
            <div className="text-white/80 mb-2 text-lg font-semibold">CÓDIGO 2:</div>
            <div className="font-mono text-2xl break-all bg-white/10 p-4 rounded text-white border-2 border-red-400">
              {serial2}
            </div>
          </Card>
        </div>

        {/* Instrução e botão */}
        <div className="space-y-6">
          <p className="text-xl md:text-2xl text-white font-medium">
            Verifique as etiquetas e tente novamente
          </p>
          
          <Button 
            onClick={handleConfirm}
            className="w-full max-w-md mx-auto bg-white hover:bg-gray-100 text-red-600 text-2xl py-8 px-12 font-bold uppercase tracking-wide shadow-2xl border-4 border-white"
            size="lg"
          >
            CONFIRMAR E CONTINUAR
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RejectedModal;