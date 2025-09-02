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
  const [currentInput, setCurrentInput] = useState('');
  
  // Configuration state
  const [config, setConfig] = useState<ValidationConfig>({
    autoResetTime: 3,
    soundEnabled: true,
    stationId: '',
    lineId: '',
    productionLine: '',
    productModel: '',
    voltage: ''
  });
  
  const hiddenInputRef = useRef<HTMLInputElement>(null);

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
      timestamp: new Date(),
      productionLine: config.productionLine,
      productModel: config.productModel,
      voltage: config.voltage,
      stationId: config.stationId,
      lineId: config.lineId
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
    setCurrentInput('');
    setIsSerial1Complete(false);
    setValidationState('waiting');
    setMessage('Aguardando primeira leitura...');
    hiddenInputRef.current?.focus();
  };

  // Handler para leitura automática
  const handleScanInput = (value: string) => {
    // Se ainda não há primeira leitura
    if (!isSerial1Complete) {
      const normalized = normalizeSerial(value);
      if (validateFormat(normalized)) {
        setSerial1(value);
        setIsSerial1Complete(true);
        setMessage('Aguardando segunda leitura...');
        setCurrentInput('');
        hiddenInputRef.current?.focus();
      } else {
        setValidationState('error');
        setMessage('Formato do primeiro código inválido');
        setCurrentInput('');
        setTimeout(() => {
          resetValidation();
        }, 2000);
      }
    } else {
      // Segunda leitura
      setSerial2(value);
      compareSerials(serial1, value);
      setCurrentInput('');
    }
  };

  // Handler para Enter key no input oculto
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentInput.trim()) {
      handleScanInput(currentInput.trim());
    }
  };

  // Foco automático no input oculto ao carregar e manter sempre focado
  useEffect(() => {
    // Focus once on load, but do NOT steal focus from outside the iframe (Lovable chat)
    hiddenInputRef.current?.focus();

    const handleFocus = () => {
      // Only manage focus if this document is active and visible
      if (!document.hasFocus() || document.visibilityState !== 'visible') return;

      const active = document.activeElement as HTMLElement | null;
      const isInteractive = !!active && (active.isContentEditable || ['INPUT','TEXTAREA','SELECT','BUTTON'].includes(active.tagName));

      if (hiddenInputRef.current && (!isInteractive || active === hiddenInputRef.current)) {
        if (active !== hiddenInputRef.current) hiddenInputRef.current.focus();
      }
    };

    const interval = setInterval(handleFocus, 300);
    return () => clearInterval(interval);
  }, []);

  // Clear history function
  const clearHistory = () => {
    setValidationHistory([]);
  };

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
    <div className="min-h-screen bg-gradient-subtle p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4 mb-8">
          {/* Colormaq Logo */}
          <div className="flex justify-center items-center mb-4">
            <img 
              src="/src/assets/colormaq-logo.svg" 
              alt="Colormaq Logo" 
              className="h-16 w-auto filter brightness-0 invert dark:brightness-100 dark:invert-0"
            />
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            Sistema de Validação de Etiquetas
          </h1>
          <p className="text-lg text-muted-foreground">
            Escaneie ou digite os dois códigos para validação
          </p>
        </div>

        {/* Informações de Produção Atuais */}
        {(config.productionLine || config.productModel || config.voltage) && (
          <Card className="p-4 bg-gradient-subtle shadow-industrial border-primary/10">
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              {config.productionLine && (
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Linha</div>
                  <div className="font-mono font-semibold text-primary">{config.productionLine}</div>
                </div>
              )}
              {config.productModel && (
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Modelo</div>
                  <div className="font-mono font-semibold text-primary">{config.productModel}</div>
                </div>
              )}
              {config.voltage && (
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Voltagem</div>
                  <div className="font-mono font-semibold text-primary">{config.voltage}</div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Status Card */}
        <Card className={`p-6 transition-all duration-500 shadow-colormaq ${getStateClasses()}`}>
          <div className="flex flex-col items-center space-y-4">
            {getIcon()}
            <h2 className={`text-2xl font-bold text-center ${
              validationState === 'approved' ? 'text-success-foreground' : 
              validationState === 'rejected' ? 'text-error-foreground' :
              validationState === 'error' ? 'text-warning-foreground' :
              'text-foreground'
            }`}>
              {message}
            </h2>
          </div>
        </Card>

        {/* Input oculto para capturar leituras */}
        <Input
          ref={hiddenInputRef}
          value={currentInput}
          onChange={(e) => setCurrentInput(e.target.value)}
          onKeyDown={handleKeyPress}
          className="absolute opacity-0 pointer-events-none -z-10"
          autoComplete="off"
          aria-hidden
          tabIndex={-1}
        />

        {/* Display de códigos lidos */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className={`p-6 space-y-4 transition-all duration-300 ${
            !isSerial1Complete ? 'ring-2 ring-primary shadow-lg' : 'bg-muted/30'
          }`}>
            <Label className="text-xl font-semibold flex items-center gap-2">
              <ScanLine className={`w-5 h-5 ${!isSerial1Complete ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
              Código 1
              {!isSerial1Complete && <span className="text-sm font-normal text-primary ml-2">(Aguardando...)</span>}
            </Label>
            <div className={`text-xl p-4 text-center font-mono tracking-wider border-2 border-dashed rounded-lg min-h-[60px] flex items-center justify-center break-all ${
              serial1 ? 'border-success bg-success/10 text-success' : 'border-muted-foreground/30 text-muted-foreground'
            }`}>
              {serial1 || 'Nenhum código lido'}
            </div>
            {isSerial1Complete && (
              <div className="flex items-center justify-center text-success">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span className="font-medium">Código 1 registrado</span>
              </div>
            )}
          </Card>

          <Card className={`p-6 space-y-4 transition-all duration-300 ${
            isSerial1Complete && !serial2 ? 'ring-2 ring-primary shadow-lg' : 'bg-muted/30'
          }`}>
            <Label className="text-xl font-semibold flex items-center gap-2">
              <ScanLine className={`w-5 h-5 ${isSerial1Complete && !serial2 ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
              Código 2
              {isSerial1Complete && !serial2 && <span className="text-sm font-normal text-primary ml-2">(Aguardando...)</span>}
            </Label>
            <div className={`text-xl p-4 text-center font-mono tracking-wider border-2 border-dashed rounded-lg min-h-[60px] flex items-center justify-center break-all ${
              serial2 ? 'border-success bg-success/10 text-success' : 'border-muted-foreground/30 text-muted-foreground'
            }`}>
              {serial2 || 'Nenhum código lido'}
            </div>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex justify-center flex-wrap gap-3">
          <Button
            onClick={resetValidation}
            size="default"
            variant="outline"
            className="px-6 py-2"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Limpar (F9)
          </Button>
          
          <Button
            onClick={() => setShowHistoryModal(true)}
            size="default"
            variant="outline"
            className="px-6 py-2"
          >
            <History className="w-4 h-4 mr-2" />
            Histórico (F6)
          </Button>
          
          <Button
            onClick={() => setShowConfigModal(true)}
            size="default"
            variant="outline"
            className="px-6 py-2"
          >
            <Settings className="w-4 h-4 mr-2" />
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
          validationHistory={validationHistory}
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