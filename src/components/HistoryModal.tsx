import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle, AlertTriangle, Trash2, Calendar } from 'lucide-react';
import { ValidationResult } from '@/types/validation';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: ValidationResult[];
  onClearHistory: () => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onClearHistory
}) => {
  const approvedCount = history.filter(v => v.state === 'approved').length;
  const rejectedCount = history.filter(v => v.state === 'rejected').length;
  const errorCount = history.filter(v => v.state === 'error').length;

  const getStateIcon = (state: string) => {
    switch (state) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-error" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-warning" />;
      default:
        return null;
    }
  };

  const getStateText = (state: string) => {
    switch (state) {
      case 'approved':
        return 'Aprovado';
      case 'rejected':
        return 'Reprovado';
      case 'error':
        return 'Erro';
      default:
        return state;
    }
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(new Date(date));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Calendar className="w-6 h-6" />
            Histórico de Validações
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4 bg-gradient-success/10 border-success/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Aprovados</p>
                  <p className="text-3xl font-bold text-success">{approvedCount}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
            </Card>

            <Card className="p-4 bg-gradient-error/10 border-error/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Reprovados</p>
                  <p className="text-3xl font-bold text-error">{rejectedCount}</p>
                </div>
                <XCircle className="w-8 h-8 text-error" />
              </div>
            </Card>

            <Card className="p-4 bg-warning/10 border-warning/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Erros</p>
                  <p className="text-3xl font-bold text-warning">{errorCount}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-warning" />
              </div>
            </Card>
          </div>

          {/* Clear History Button */}
          <div className="flex justify-end">
            <Button
              onClick={onClearHistory}
              variant="destructive"
              disabled={history.length === 0}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Limpar Histórico
            </Button>
          </div>

          {/* History Table */}
          <div className="border rounded-lg overflow-hidden">
            {history.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Nenhum registro encontrado</p>
                <p className="text-sm">As validações aparecerão aqui conforme forem realizadas</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Código 1</TableHead>
                      <TableHead>Código 2</TableHead>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Resultado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((record, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStateIcon(record.state)}
                            <span className={`font-medium ${
                              record.state === 'approved' ? 'text-success' :
                              record.state === 'rejected' ? 'text-error' :
                              'text-warning'
                            }`}>
                              {getStateText(record.state)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                            {record.serial1}
                          </code>
                        </TableCell>
                        <TableCell>
                          <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                            {record.serial2}
                          </code>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDateTime(record.timestamp)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {record.message}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Total Records */}
          {history.length > 0 && (
            <div className="text-center text-sm text-muted-foreground">
              Total de registros: {history.length} / 100
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HistoryModal;