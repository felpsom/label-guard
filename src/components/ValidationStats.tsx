import React from 'react';
import { Card } from '@/components/ui/card';
import { ValidationResult } from '@/types/validation';

interface ValidationStatsProps {
  validationHistory: ValidationResult[];
}

const ValidationStats: React.FC<ValidationStatsProps> = ({ validationHistory }) => {
  if (validationHistory.length === 0) return null;

  const approvedCount = validationHistory.filter(v => v.state === 'approved').length;
  const rejectedCount = validationHistory.filter(v => v.state === 'rejected').length;

  return (
    <>
      {/* Stats */}
      <Card className="p-6 bg-primary/80 border-white/10">
        <h3 className="text-xl font-semibold mb-4 text-center text-white">Estatísticas da Sessão</h3>
        <div className="grid md:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-white">{validationHistory.length}</div>
            <div className="text-sm text-white/60">Total de Validações</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400">{approvedCount}</div>
            <div className="text-sm text-white/60">Aprovados</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-400">{rejectedCount}</div>
            <div className="text-sm text-white/60">Reprovados</div>
          </div>
        </div>
      </Card>

      {/* Quick Info */}
      <Card className="p-6 bg-primary/80 border-white/10">
        <div className="grid md:grid-cols-3 gap-4 text-center">
          <div>
            <h3 className="font-semibold text-green-400">APROVADO</h3>
            <p className="text-sm text-white/60">Códigos idênticos</p>
          </div>
          <div>
            <h3 className="font-semibold text-red-400">REPROVADO</h3>
            <p className="text-sm text-white/60">Códigos diferentes</p>
          </div>
          <div>
            <h3 className="font-semibold text-yellow-400">ERRO</h3>
            <p className="text-sm text-white/60">Formato inválido</p>
          </div>
        </div>
      </Card>
    </>
  );
};

export default ValidationStats;