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
        return 'bg-success/10 shadow-success border-success/30';
      case 'rejected':
        return 'bg-error/10 shadow-error border-error/30';
      case 'error':
        return 'bg-warning/10 border-warning/30';
      default:
        return 'bg-white/60 shadow-industrial border-primary/20';
    }
  };

  const getIcon = () => {
    switch (validationState) {
      case 'approved':
        return <CheckCircle className="w-8 h-8 text-success" />;
      case 'rejected':
        return <XCircle className="w-8 h-8 text-error" />;
      case 'error':
        return <ScanLine className="w-8 h-8 text-warning" />;
      default:
        return <ScanLine className="w-8 h-8 text-primary animate-pulse" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle p-4">
      <div className="max-w-5xl mx-auto space-y-6" onClick={handleValidationAreaClick}>
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-light text-foreground">
            Validação de Etiquetas
          </h1>
          <p className="text-muted-foreground">
            Scanner automático para verificação de códigos
          </p>
        </div>

        {/* Status Card */}
        <Card className={`p-6 transition-all duration-500 ${getStateClasses()}`}>
          <div className="flex items-center justify-center space-x-4">
            {getIcon()}
            <h2 className={`text-2xl font-medium ${
              validationState === 'approved' ? 'text-success-foreground' : 
              validationState === 'rejected' ? 'text-error-foreground' :
              validationState === 'error' ? 'text-warning-foreground' :
              'text-foreground'
            }`}>
              {message}
            </h2>
          </div>
        </Card>

        {/* Scanner Input */}
        <Card className="p-4">
          <Input
            id="scanner"
            ref={scannerRef}
            value={scannerInput}
            onChange={(e) => handleScannerInput(e.target.value)}
            onKeyPress={handleScannerKeyPress}
            placeholder="Escaneie ou digite os códigos aqui"
            className="text-xl p-4 text-center font-mono bg-primary/5 border-primary/20 focus:border-primary"
          />
        </Card>

        {/* Display Fields */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-4">
            <Label className="text-sm font-medium text-muted-foreground mb-2 block">Código 1</Label>
            <div className="text-lg p-3 text-center font-mono bg-muted/30 rounded min-h-[3rem] flex items-center justify-center">
              {serial1 || '—'}
            </div>
            {isSerial1Complete && (
              <div className="flex items-center justify-center text-success mt-2 text-sm">
                <CheckCircle className="w-4 h-4 mr-1" />
                Registrado
              </div>
            )}
          </Card>

          <Card className="p-4">
            <Label className="text-sm font-medium text-muted-foreground mb-2 block">Código 2</Label>
            <div className="text-lg p-3 text-center font-mono bg-muted/30 rounded min-h-[3rem] flex items-center justify-center">
              {serial2 || '—'}
            </div>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-3">
          <Button
            onClick={resetValidation}
            variant="outline"
            size="sm"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Limpar
          </Button>
          
          <Button
            onClick={() => setShowHistoryModal(true)}
            variant="outline"
            size="sm"
          >
            <History className="w-4 h-4 mr-2" />
            Histórico
          </Button>
          
          <Button
            onClick={() => setShowConfigModal(true)}
            variant="outline"
            size="sm"
          >
            <Settings className="w-4 h-4 mr-2" />
            Config
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
          <Card className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xl font-semibold text-primary">{validationHistory.length}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
              <div>
                <div className="text-xl font-semibold text-success">
                  {validationHistory.filter(v => v.state === 'approved').length}
                </div>
                <div className="text-xs text-muted-foreground">Aprovados</div>
              </div>
              <div>
                <div className="text-xl font-semibold text-error">
                  {validationHistory.filter(v => v.state === 'rejected').length}
                </div>
                <div className="text-xs text-muted-foreground">Reprovados</div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ValidationSystem;