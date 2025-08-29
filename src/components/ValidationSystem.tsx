import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, ScanLine, RotateCcw, History, Settings } from 'lucide-react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { AudioFeedback } from '@/utils/audioFeedback';
import { ValidationState, ValidationResult, ValidationConfig } from '@/types/validation';
import ConfigurationModal from '@/components/ConfigurationModal';
import HistoryModal from '@/components/HistoryModal';

const ValidationSystem = () => {
  const [serial1, setSerial1] = useState('');
  const [serial2, setSerial2] = useState('');
  const [validationState, setValidationState] = useState<ValidationState>('waiting');
  const [message, setMessage] = useState('Aguardando primeira leitura...');
  const [isSerial1Complete, setIsSerial1Complete] = useState(false);
  const [validationHistory, setValidationHistory] = useState<ValidationResult[]>([]);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
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

  // Limpa o histórico de validações
  const clearHistory = () => {
    setValidationHistory([]);
    setShowHistoryModal(false);
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
    onHistory: () => setShowHistoryModal(true),
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
    <div className="min-h-screen bg-gradient-subtle p-6">
      <div className="max-w-4xl mx-auto space-y-8" onClick={handleValidationAreaClick}>
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            Sistema de Validação de Etiquetas
          </h1>
          <p className="text-xl text-muted-foreground">
            Escaneie ou digite os dois códigos para validação
          </p>
        </div>

        {/* Status Card */}
        <Card className={`p-8 transition-all duration-500 ${getStateClasses()}`}>
          <div className="flex flex-col items-center space-y-6">
            {getIcon()}
            <h2 className={`text-3xl font-bold text-center ${
              validationState === 'approved' ? 'text-success-foreground' : 
              validationState === 'rejected' ? 'text-error-foreground' :
              validationState === 'error' ? 'text-warning-foreground' :
              'text-foreground'
            }`}>
              {message}
            </h2>
          </div>
        </Card>

        {/* Scanner Input - Hidden field for automatic scanning */}
        <Card className="p-6 space-y-4">
          <Label htmlFor="scanner" className="text-xl font-semibold flex items-center gap-2">
            <ScanLine className="w-5 h-5" />
            Scanner Automático
          </Label>
          <Input
            id="scanner"
            ref={scannerRef}
            value={scannerInput}
            onChange={(e) => handleScannerInput(e.target.value)}
            onKeyPress={handleScannerKeyPress}
            placeholder="Posicione o cursor aqui e escaneie os códigos sequencialmente"
            className="text-2xl p-6 text-center font-mono tracking-wider bg-primary/5 border-primary/30"
          />
          <p className="text-sm text-muted-foreground text-center">
            Escaneie o primeiro código, depois o segundo. O sistema processará automaticamente.
          </p>
        </Card>

        {/* Display Fields - Read Only */}
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="p-6 space-y-4">
            <Label className="text-xl font-semibold flex items-center gap-2">
              <ScanLine className="w-5 h-5" />
              Código 1
            </Label>
            <div className="text-2xl p-6 text-center font-mono tracking-wider bg-muted/50 border border-border rounded-md min-h-[4rem] flex items-center justify-center">
              {serial1 || 'Aguardando...'}
            </div>
            {isSerial1Complete && (
              <div className="flex items-center justify-center text-success">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span className="font-medium">Código 1 registrado</span>
              </div>
            )}
          </Card>

          <Card className="p-6 space-y-4">
            <Label className="text-xl font-semibold flex items-center gap-2">
              <ScanLine className="w-5 h-5" />
              Código 2
            </Label>
            <div className="text-2xl p-6 text-center font-mono tracking-wider bg-muted/50 border border-border rounded-md min-h-[4rem] flex items-center justify-center">
              {serial2 || (isSerial1Complete ? 'Aguardando...' : '')}
            </div>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex justify-center space-x-4">
          <Button
            onClick={resetValidation}
            size="lg"
            variant="outline"
            className="text-lg px-8 py-4"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Limpar (F9)
          </Button>
          
          <Button
            onClick={() => setShowHistoryModal(true)}
            size="lg"
            variant="outline"
            className="text-lg px-8 py-4"
          >
            <History className="w-5 h-5 mr-2" />
            Histórico (F6)
          </Button>
          
          <Button
            onClick={() => setShowConfigModal(true)}
            size="lg"
            variant="outline"
            className="text-lg px-8 py-4"
          >
            <Settings className="w-5 h-5 mr-2" />
            Configurações (Ctrl+.)
          </Button>
        </div>

        {/* Configuration Modal */}
        <ConfigurationModal
          isOpen={showConfigModal}
          onClose={() => setShowConfigModal(false)}
          config={config}
          onConfigChange={setConfig}
        />

        {/* History Modal */}
        <HistoryModal
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          history={validationHistory}
          onClearHistory={clearHistory}
        />

        {/* Stats */}
        {validationHistory.length > 0 && (
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4 text-center">Estatísticas da Sessão</h3>
            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{validationHistory.length}</div>
                <div className="text-sm text-muted-foreground">Total de Validações</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-success">
                  {validationHistory.filter(v => v.state === 'approved').length}
                </div>
                <div className="text-sm text-muted-foreground">Aprovados</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-error">
                  {validationHistory.filter(v => v.state === 'rejected').length}
                </div>
                <div className="text-sm text-muted-foreground">Reprovados</div>
              </div>
            </div>
          </Card>
        )}

        {/* Quick Info */}
        <Card className="p-6 bg-muted/50">
          <div className="grid md:grid-cols-3 gap-4 text-center">
            <div>
              <h3 className="font-semibold text-success">APROVADO</h3>
              <p className="text-sm text-muted-foreground">Códigos idênticos</p>
            </div>
            <div>
              <h3 className="font-semibold text-error">REPROVADO</h3>
              <p className="text-sm text-muted-foreground">Códigos diferentes</p>
            </div>
            <div>
              <h3 className="font-semibold text-warning">ERRO</h3>
              <p className="text-sm text-muted-foreground">Formato inválido</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ValidationSystem;