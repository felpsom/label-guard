import React from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { CheckCircle, ScanLine } from 'lucide-react';
import { ValidationState } from '@/types/validation';

interface ValidationDisplayProps {
  serial1: string;
  serial2: string;
  isSerial1Complete: boolean;
  isBlocked: boolean;
  validationState: ValidationState;
}

const ValidationDisplay: React.FC<ValidationDisplayProps> = ({
  serial1,
  serial2,
  isSerial1Complete,
  isBlocked,
  validationState
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
      <Card className={`p-4 md:p-6 space-y-4 transition-all duration-300 bg-primary/80 border-white/10 ${
        !isSerial1Complete ? 'ring-2 ring-white/40 shadow-lg' : ''
      }`}>
        <Label className="text-lg md:text-xl font-semibold flex items-center gap-2 text-white">
          <ScanLine className={`w-4 h-4 md:w-5 md:h-5 ${!isSerial1Complete ? 'text-white animate-pulse' : 'text-white/60'}`} />
          Código 1
          {!isSerial1Complete && <span className="text-xs md:text-sm font-normal text-white/80 ml-2">(Aguardando...)</span>}
        </Label>
        <div className={`text-lg md:text-xl p-3 md:p-4 text-center font-mono tracking-wider border-2 border-dashed rounded-lg min-h-[50px] md:min-h-[60px] flex items-center justify-center break-all ${
          serial1 ? 'border-green-400 bg-green-400/10 text-green-400' : 'border-white/30 text-white/60'
        }`}>
          {serial1 || 'Nenhum código lido'}
        </div>
        {isSerial1Complete && (
          <div className="flex items-center justify-center text-green-400">
            <CheckCircle className="w-4 h-4 md:w-5 md:h-5 mr-2" />
            <span className="font-medium text-sm md:text-base">Código 1 registrado</span>
          </div>
        )}
      </Card>

      <Card className={`p-4 md:p-6 space-y-4 transition-all duration-300 bg-primary/80 border-white/10 ${
        isSerial1Complete && !serial2 && !isBlocked ? 'ring-2 ring-white/40 shadow-lg' : ''
      } ${isBlocked ? 'opacity-60' : ''}`}>
        <Label className="text-lg md:text-xl font-semibold flex items-center gap-2 text-white">
          <ScanLine className={`w-4 h-4 md:w-5 md:h-5 ${isSerial1Complete && !serial2 && !isBlocked ? 'text-white animate-pulse' : 'text-white/60'}`} />
          Código 2
          {isSerial1Complete && !serial2 && !isBlocked && <span className="text-xs md:text-sm font-normal text-white/80 ml-2">(Aguardando...)</span>}
          {isBlocked && <span className="text-xs md:text-sm font-normal text-red-400 ml-2">(Bloqueado)</span>}
        </Label>
        <div className={`text-lg md:text-xl p-3 md:p-4 text-center font-mono tracking-wider border-2 border-dashed rounded-lg min-h-[50px] md:min-h-[60px] flex items-center justify-center break-all ${
          serial2 ? 'border-green-400 bg-green-400/10 text-green-400' : 'border-white/30 text-white/60'
        }`}>
          {serial2 || 'Nenhum código lido'}
        </div>
      </Card>
    </div>
  );
};

export default ValidationDisplay;