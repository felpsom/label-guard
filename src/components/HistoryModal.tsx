import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle, AlertTriangle, History, Trash2 } from 'lucide-react';
import { ValidationResult } from '@/types/validation';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  validationHistory: ValidationResult[];
  onClearHistory: () => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  validationHistory,
  onClearHistory
}) => {
  const getStateIcon = (state: string) => {
    switch (state) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-error" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      default:
        return null;
    }
  };

  const getStateBadge = (state: string) => {
    switch (state) {
      case 'approved':
        return <Badge variant="default" className="bg-success text-success-foreground">Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="bg-error text-error-foreground">Reprovado</Badge>;
      case 'error':
        return <Badge variant="secondary" className="bg-warning text-warning-foreground">Erro</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const approvedCount = validationHistory.filter(v => v.state === 'approved').length;
  const rejectedCount = validationHistory.filter(v => v.state === 'rejected').length;
  const errorCount = validationHistory.filter(v => v.state === 'error').length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Histórico de Validações
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Estatísticas */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{validationHistory.length}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-success">{approvedCount}</div>
              <div className="text-sm text-muted-foreground">Aprovados</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-error">{rejectedCount}</div>
              <div className="text-sm text-muted-foreground">Reprovados</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-warning">{errorCount}</div>
              <div className="text-sm text-muted-foreground">Erros</div>
            </Card>
          </div>

          {/* Tabela de histórico */}
          <div className="flex-1 overflow-auto border rounded-lg">
            <Table>
               <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Status</TableHead>
                  <TableHead>Código 1</TableHead>
                  <TableHead>Código 2</TableHead>
                  <TableHead>Linha</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Voltagem</TableHead>
                  <TableHead>Data/Hora</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {validationHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Nenhuma validação encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  validationHistory.map((validation, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getStateIcon(validation.state)}
                          {getStateBadge(validation.state)}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{validation.serial1}</TableCell>
                      <TableCell className="font-mono text-xs">{validation.serial2}</TableCell>
                      <TableCell className="text-xs">{validation.productionLine || '-'}</TableCell>
                      <TableCell className="text-xs">{validation.productModel || '-'}</TableCell>
                      <TableCell className="text-xs">{validation.voltage || '-'}</TableCell>
                      <TableCell className="text-xs">
                        {validation.timestamp instanceof Date ? 
                          validation.timestamp.toLocaleString('pt-BR') : 
                          new Date(validation.timestamp).toLocaleString('pt-BR')
                        }
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Ações */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button
              onClick={onClearHistory}
              variant="destructive"
              size="sm"
              disabled={validationHistory.length === 0}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Limpar Histórico
            </Button>
            <Button onClick={onClose} variant="outline">
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HistoryModal;