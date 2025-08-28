import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  XCircle, 
  ScanLine, 
  RotateCcw, 
  History, 
  Settings,
  Shield,
  Activity,
  TrendingUp,
  Clock,
  Zap
} from 'lucide-react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { AudioFeedback } from '@/utils/audioFeedback';
import { ValidationState, ValidationResult, ValidationConfig } from '@/types/validation';
import ConfigurationModal from '@/components/ConfigurationModal';

const ValidationSystem = () => {
  const [serial1, setSerial1] = useState('');
  const [serial2, setSerial2] = useState('');
  const [validationState, setValidationState] = useState<ValidationState>('waiting');
  const [message, setMessage] = useState('Aguardando primeira leitura...');
  const [isSerial1Complete, setIsSerial1Complete] = useState(false);
  const [validationHistory, setValidationHistory] = useState<ValidationResult[]>([]);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [scannerInput, setScannerInput] = useState('');
  
  // Configuration state
  const [config, setConfig] = useState<ValidationConfig>({
    autoResetTime: 3,
    soundEnabled: true,
    stationId: '',
    lineId: ''
  });
  
  const scannerRef = useRef<HTMLInputElement>(null);

  // Normaliza o código removendo prefixos e caracteres especiais
  const normalizeSerial = (input: string): string => {
    let normalized = input.trim().toUpperCase();
    
    // Remove prefixos comuns como SN:, SN-, SN=, etc.
    const prefixRegex = /^SN\s*[:=\-]?\s*([A-Z0-9]+)/i;
    const match = normalized.match(prefixRegex);
    if (match) {
      normalized = match[1];
    }
    
    // Remove caracteres especiais, mantém apenas alfanuméricos
    normalized = normalized.replace(/[^A-Z0-9]/g, '');
    
    return normalized;
  };

  // Valida o formato do código
  const validateFormat = (serial: string): boolean => {
    // Aceita códigos de 8 a 20 caracteres alfanuméricos
    const formatRegex = /^[A-Z0-9]{8,20}$/;
    return formatRegex.test(serial);
  };

  // Compara os dois códigos
  const compareSerials = (s1: string, s2: string) => {
    const norm1 = normalizeSerial(s1);
    const norm2 = normalizeSerial(s2);
    
    if (!validateFormat(norm1) || !validateFormat(norm2)) {
      setValidationState('error');
      setMessage('Formato inválido detectado');
      if (config.soundEnabled) AudioFeedback.playWarning();
      return;
    }
    
    const result: ValidationResult = {
      serial1: s1,
      serial2: s2,
      state: norm1 === norm2 ? 'approved' : 'rejected',
      message: norm1 === norm2 ? 'APROVADO - Códigos coincidem' : 'REPROVADO - Códigos diferentes',
      timestamp: new Date()
    };
    
    setValidationState(result.state);
    setMessage(result.message);
    
    // Add to history
    setValidationHistory(prev => [result, ...prev.slice(0, 99)]); // Keep last 100 records
    
    // Audio feedback
    if (config.soundEnabled) {
      if (result.state === 'approved') {
        AudioFeedback.playSuccess();
      } else {
        AudioFeedback.playError();
      }
    }
    
    // Auto-reset após tempo configurável
    setTimeout(() => {
      resetValidation();
    }, config.autoResetTime * 1000);
  };

  // Reset do sistema
  const resetValidation = () => {
    setSerial1('');
    setSerial2('');
    setScannerInput('');
    setIsSerial1Complete(false);
    setValidationState('waiting');
    setMessage('Aguardando primeira leitura...');
    // Focus scanner for automatic reading
    setTimeout(() => scannerRef.current?.focus(), 100);
  };

  // Handler para o scanner automático
  const handleScannerInput = (value: string) => {
    setScannerInput(value);
    
    // Detecta entrada completa (Enter ou código longo o suficiente)
    if (value.length >= 8) {
      const normalized = normalizeSerial(value);
      
      if (!validateFormat(normalized)) {
        setValidationState('error');
        setMessage('Formato do código inválido');
        if (config.soundEnabled) AudioFeedback.playWarning();
        setTimeout(() => {
          setScannerInput('');
          scannerRef.current?.focus();
        }, 1000);
        return;
      }

      if (!isSerial1Complete) {
        // Primeiro código
        setSerial1(value);
        setIsSerial1Complete(true);
        setMessage('Aguardando segunda leitura...');
        setScannerInput('');
        scannerRef.current?.focus();
      } else {
        // Segundo código - comparar
        setSerial2(value);
        compareSerials(serial1, value);
        setScannerInput('');
      }
    }
  };

  // Handler para Enter no scanner
  const handleScannerKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && scannerInput.length >= 8) {
      handleScannerInput(scannerInput);
    }
  };

  // Focus scanner quando clicar na área de validação
  const handleValidationAreaClick = () => {
    scannerRef.current?.focus();
  };

  // Auto-focus no scanner ao carregar (apenas se não estiver em modal/chat)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        scannerRef.current?.focus();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onClear: resetValidation,
    onHistory: () => console.log('Histórico - implementar modal/página'),
    onConfig: () => setShowConfigModal(true)
  });

  // Classes para estados visuais
  const getStateClasses = () => {
    switch (validationState) {
      case 'approved':
        return 'bg-gradient-success shadow-success border-success';
      case 'rejected':
        return 'bg-gradient-error shadow-error border-error';
      case 'error':
        return 'bg-warning/10 shadow-lg border-warning';
      default:
        return 'bg-gradient-subtle shadow-industrial border-primary/20';
    }
  };

  const getIcon = () => {
    switch (validationState) {
      case 'approved':
        return <CheckCircle className="w-16 h-16 text-success-foreground" />;
      case 'rejected':
        return <XCircle className="w-16 h-16 text-error-foreground" />;
      case 'error':
        return <ScanLine className="w-16 h-16 text-warning-foreground" />;
      default:
        return <ScanLine className="w-16 h-16 text-primary animate-pulse" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <g fill="none" fillRule="evenodd">
            <g fill="hsl(var(--primary))" fillOpacity="0.1">
              <circle cx="30" cy="30" r="2"/>
            </g>
          </g>
        </svg>
      </div>
      
      <div className="relative z-10 p-6" onClick={handleValidationAreaClick}>
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Modern Header */}
          <div className="text-center space-y-6 animate-fade-in">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="p-4 bg-gradient-primary rounded-2xl shadow-elegant">
                <Shield className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">
                  ValidaCode Pro
                </h1>
                <Badge variant="outline" className="mt-2 text-sm border-primary/20 bg-primary/5">
                  <Zap className="w-3 h-3 mr-1" />
                  Sistema Industrial de Validação
                </Badge>
              </div>
            </div>
            
            <div className="max-w-2xl mx-auto">
              <p className="text-xl text-muted-foreground leading-relaxed">
                Tecnologia avançada de dupla verificação para garantir a integridade dos códigos de etiquetas
              </p>
              <div className="flex items-center justify-center gap-6 mt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  <span>Tempo Real</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-success" />
                  <span>Verificação Dupla</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span>Alta Precisão</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-8 animate-slide-up">
            
            {/* Scanner Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Status Display */}
              <Card className={`p-8 transition-all duration-700 transform hover:scale-[1.02] ${getStateClasses()}`}>
                <div className="flex flex-col items-center space-y-6">
                  <div className="relative">
                    {getIcon()}
                    <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-transparent to-primary/20 rounded-full blur-xl opacity-50 animate-pulse"></div>
                  </div>
                  
                  <div className="text-center space-y-2">
                    <h2 className={`text-3xl font-bold ${
                      validationState === 'approved' ? 'text-success-foreground' : 
                      validationState === 'rejected' ? 'text-error-foreground' :
                      validationState === 'error' ? 'text-warning-foreground' :
                      'text-foreground'
                    }`}>
                      {message}
                    </h2>
                    {validationState === 'waiting' && (
                      <p className="text-muted-foreground animate-pulse">
                        Posicione o leitor no campo abaixo
                      </p>
                    )}
                  </div>
                  
                  {(validationState === 'approved' || validationState === 'rejected') && (
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Reset automático em {config.autoResetTime}s
                    </div>
                  )}
                </div>
              </Card>

              {/* Scanner Input */}
              <Card className="p-6 space-y-4 bg-gradient-to-br from-card via-card to-muted/50 shadow-soft">
                <div className="flex items-center justify-between">
                  <Label htmlFor="scanner" className="text-xl font-semibold flex items-center gap-2">
                    <ScanLine className="w-5 h-5 text-primary" />
                    Scanner Automático
                  </Label>
                  <Badge variant="secondary" className="text-xs">
                    Modo: Sequencial
                  </Badge>
                </div>
                
                <Input
                  id="scanner"
                  ref={scannerRef}
                  value={scannerInput}
                  onChange={(e) => handleScannerInput(e.target.value)}
                  onKeyPress={handleScannerKeyPress}
                  placeholder="🔍 Posicione o cursor aqui e escaneie os códigos..."
                  className="text-2xl p-6 text-center font-mono tracking-wider bg-gradient-to-r from-primary/5 via-transparent to-primary/5 border-primary/30 focus:border-primary focus:shadow-elegant transition-all duration-300"
                />
                
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <ScanLine className="w-4 h-4 text-primary" />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium mb-1">Instruções de uso:</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Posicione o cursor no campo acima</li>
                        <li>Escaneie o primeiro código</li>
                        <li>Escaneie o segundo código sequencialmente</li>
                        <li>O sistema processará automaticamente</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Codes Display */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-6 space-y-4 animate-scale-in" style={{animationDelay: '0.1s'}}>
                  <Label className="text-lg font-semibold flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    Código 1
                  </Label>
                  <div className="relative">
                    <div className="text-2xl p-6 text-center font-mono tracking-wider bg-gradient-to-br from-muted/30 to-muted/50 border-2 border-dashed border-border rounded-xl min-h-[5rem] flex items-center justify-center transition-all duration-300">
                      {serial1 ? (
                        <span className="text-foreground font-semibold">{serial1}</span>
                      ) : (
                        <span className="text-muted-foreground">Aguardando leitura...</span>
                      )}
                    </div>
                    {isSerial1Complete && (
                      <div className="absolute -top-2 -right-2 bg-success text-success-foreground rounded-full p-2 shadow-success animate-scale-in">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  {isSerial1Complete && (
                    <div className="flex items-center justify-center text-success text-sm font-medium animate-fade-in">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Código registrado com sucesso
                    </div>
                  )}
                </Card>

                <Card className="p-6 space-y-4 animate-scale-in" style={{animationDelay: '0.2s'}}>
                  <Label className="text-lg font-semibold flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary-glow rounded-full"></div>
                    Código 2
                  </Label>
                  <div className="relative">
                    <div className="text-2xl p-6 text-center font-mono tracking-wider bg-gradient-to-br from-muted/30 to-muted/50 border-2 border-dashed border-border rounded-xl min-h-[5rem] flex items-center justify-center transition-all duration-300">
                      {serial2 ? (
                        <span className="text-foreground font-semibold">{serial2}</span>
                      ) : isSerial1Complete ? (
                        <span className="text-muted-foreground animate-pulse">Aguardando leitura...</span>
                      ) : (
                        <span className="text-muted-foreground/50">Pendente do código 1</span>
                      )}
                    </div>
                    {serial2 && (
                      <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-2 shadow-industrial animate-scale-in">
                        <ScanLine className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card className="p-6 space-y-4 bg-gradient-to-br from-card to-muted/20 animate-scale-in" style={{animationDelay: '0.3s'}}>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Ações Rápidas
                </h3>
                <div className="space-y-3">
                  <Button
                    onClick={resetValidation}
                    size="lg"
                    variant="outline"
                    className="w-full text-base justify-start hover:bg-muted/50 transition-all duration-300"
                  >
                    <RotateCcw className="w-4 h-4 mr-3" />
                    Limpar Sistema
                    <Badge variant="secondary" className="ml-auto text-xs">F9</Badge>
                  </Button>
                  
                  <Button
                    onClick={() => console.log('Histórico')}
                    size="lg"
                    variant="outline"
                    className="w-full text-base justify-start hover:bg-muted/50 transition-all duration-300"
                  >
                    <History className="w-4 h-4 mr-3" />
                    Ver Histórico
                    <Badge variant="secondary" className="ml-auto text-xs">F6</Badge>
                  </Button>
                  
                  <Button
                    onClick={() => setShowConfigModal(true)}
                    size="lg"
                    variant="outline"
                    className="w-full text-base justify-start hover:bg-muted/50 transition-all duration-300"
                  >
                    <Settings className="w-4 h-4 mr-3" />
                    Configurações
                    <Badge variant="secondary" className="ml-auto text-xs">Ctrl+.</Badge>
                  </Button>
                </div>
              </Card>

              {/* Session Stats */}
              {validationHistory.length > 0 && (
                <Card className="p-6 space-y-4 bg-gradient-to-br from-primary/5 to-primary-glow/5 animate-fade-in">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Estatísticas da Sessão
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-card rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-primary rounded-full"></div>
                        <span className="text-sm font-medium">Total</span>
                      </div>
                      <span className="text-lg font-bold text-primary">{validationHistory.length}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-card rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-success rounded-full"></div>
                        <span className="text-sm font-medium">Aprovados</span>
                      </div>
                      <span className="text-lg font-bold text-success">
                        {validationHistory.filter(v => v.state === 'approved').length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-card rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-error rounded-full"></div>
                        <span className="text-sm font-medium">Reprovados</span>
                      </div>
                      <span className="text-lg font-bold text-error">
                        {validationHistory.filter(v => v.state === 'rejected').length}
                      </span>
                    </div>
                  </div>
                  
                  {validationHistory.length > 0 && (
                    <div className="pt-4 border-t">
                      <div className="text-center text-sm text-muted-foreground">
                        Taxa de Sucesso: {Math.round((validationHistory.filter(v => v.state === 'approved').length / validationHistory.length) * 100)}%
                      </div>
                    </div>
                  )}
                </Card>
              )}

              {/* Status Guide */}
              <Card className="p-6 space-y-4 bg-gradient-to-br from-muted/20 to-card animate-scale-in" style={{animationDelay: '0.4s'}}>
                <h3 className="text-lg font-semibold">Status Guide</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-2 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-success" />
                    <div>
                      <div className="font-semibold text-success">APROVADO</div>
                      <div className="text-xs text-muted-foreground">Códigos idênticos verificados</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded-lg">
                    <XCircle className="w-5 h-5 text-error" />
                    <div>
                      <div className="font-semibold text-error">REPROVADO</div>
                      <div className="text-xs text-muted-foreground">Códigos não coincidem</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded-lg">
                    <ScanLine className="w-5 h-5 text-warning" />
                    <div>
                      <div className="font-semibold text-warning">ERRO</div>
                      <div className="text-xs text-muted-foreground">Formato inválido detectado</div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Modal */}
      <ConfigurationModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        config={config}
        onConfigChange={setConfig}
      />
    </div>
  );
};

export default ValidationSystem;