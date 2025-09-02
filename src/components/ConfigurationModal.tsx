import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Settings, Volume2, VolumeX, Clock } from 'lucide-react';
import { ValidationConfig } from '@/types/validation';

interface ConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ValidationConfig;
  onConfigChange: (config: ValidationConfig) => void;
}

const ConfigurationModal: React.FC<ConfigurationModalProps> = ({
  isOpen,
  onClose,
  config,
  onConfigChange,
}) => {
  const updateConfig = (updates: Partial<ValidationConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Settings className="w-6 h-6" />
            Configurações do Sistema
          </DialogTitle>
          <DialogDescription>
            Configure o comportamento do sistema de validação conforme suas necessidades.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Tempo de Auto-Reset */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <Label className="text-lg font-semibold">Tempo de Auto-Reset</Label>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-muted-foreground min-w-[30px]">1s</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.5"
                    value={config.autoResetTime}
                    onChange={(e) => updateConfig({ autoResetTime: Number(e.target.value) })}
                    className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
                  />
                  <span className="text-sm text-muted-foreground min-w-[30px]">10s</span>
                  <div className="min-w-[60px] text-center">
                    <span className="text-xl font-bold text-primary">{config.autoResetTime}s</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {[1, 1.5, 2, 3, 5, 8, 10].map((time) => (
                    <Button
                      key={time}
                      onClick={() => updateConfig({ autoResetTime: time })}
                      size="sm"
                      variant={config.autoResetTime === time ? "default" : "outline"}
                      className="px-3 py-1"
                    >
                      {time}s
                    </Button>
                  ))}
                </div>
                
                <p className="text-sm text-muted-foreground">
                  Tempo para limpeza automática dos campos após exibir o resultado da validação
                </p>
              </div>
            </div>
          </Card>

          {/* Configurações de Audio */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {config.soundEnabled ? (
                    <Volume2 className="w-5 h-5 text-primary" />
                  ) : (
                    <VolumeX className="w-5 h-5 text-muted-foreground" />
                  )}
                  <div>
                    <Label className="text-lg font-semibold">Feedback Sonoro</Label>
                    <p className="text-sm text-muted-foreground">
                      Reproduzir sons para indicar resultados da validação
                    </p>
                  </div>
                </div>
                <Switch
                  checked={config.soundEnabled}
                  onCheckedChange={(enabled) => updateConfig({ soundEnabled: enabled })}
                />
              </div>
              
              {config.soundEnabled && (
                <div className="ml-7 space-y-2 p-4 bg-muted/50 rounded-lg">
                  <div className="text-sm">
                    <span className="font-medium text-success">✓ Aprovado:</span> Beep curto e agudo
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-error">✗ Reprovado:</span> Alarme alto (sequência intensa)
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-warning">⚠ Erro:</span> Beep médio de alerta
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Identificação da Estação */}
          <Card className="p-6">
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Identificação da Estação</Label>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stationId" className="text-sm">ID da Estação</Label>
                  <Input
                    id="stationId"
                    value={config.stationId || ''}
                    onChange={(e) => updateConfig({ stationId: e.target.value })}
                    placeholder="EST-001"
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lineId" className="text-sm">ID da Linha</Label>
                  <Input
                    id="lineId"
                    value={config.lineId || ''}
                    onChange={(e) => updateConfig({ lineId: e.target.value })}
                    placeholder="LINHA-A"
                    className="font-mono"
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Identificação para registro nos logs de validação
              </p>
            </div>
          </Card>

          {/* Informações de Produção */}
          <Card className="p-6">
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Informações de Produção</Label>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="productionLine" className="text-sm">Linha de Produção</Label>
                  <Input
                    id="productionLine"
                    value={config.productionLine || ''}
                    onChange={(e) => updateConfig({ productionLine: e.target.value })}
                    placeholder="LINHA-01"
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="productModel" className="text-sm">Modelo do Produto</Label>
                  <Input
                    id="productModel"
                    value={config.productModel || ''}
                    onChange={(e) => updateConfig({ productModel: e.target.value })}
                    placeholder="CM-2024-X"
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="voltage" className="text-sm">Voltagem</Label>
                  <Input
                    id="voltage"
                    value={config.voltage || ''}
                    onChange={(e) => updateConfig({ voltage: e.target.value })}
                    placeholder="220V"
                    className="font-mono"
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Informações do produto para melhor identificação no histórico
              </p>
            </div>
          </Card>

          {/* Atalhos de Teclado */}
          <Card className="p-6">
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Atalhos de Teclado</Label>
              <div className="grid gap-3 text-sm">
                <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                  <span>Limpar campos</span>
                  <div className="flex gap-1">
                    <kbd className="px-2 py-1 bg-background border rounded text-xs">F9</kbd>
                    <span className="text-muted-foreground">ou</span>
                    <kbd className="px-2 py-1 bg-background border rounded text-xs">Esc</kbd>
                  </div>
                </div>
                <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                  <span>Abrir histórico</span>
                  <kbd className="px-2 py-1 bg-background border rounded text-xs">F6</kbd>
                </div>
                <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                  <span>Abrir configurações</span>
                  <div className="flex gap-1">
                    <kbd className="px-2 py-1 bg-background border rounded text-xs">Ctrl</kbd>
                    <span>+</span>
                    <kbd className="px-2 py-1 bg-background border rounded text-xs">.</kbd>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose} size="lg">
            Aplicar Configurações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConfigurationModal;