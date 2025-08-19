import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, ScanLine, RotateCcw, History, Settings } from 'lucide-react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { AudioFeedback } from '@/utils/audioFeedback';

type ValidationState = 'waiting' | 'approved' | 'rejected' | 'error';

interface ValidationResult {
  serial1: string;
  serial2: string;
  state: ValidationState;
  message: string;
  timestamp: Date;
}

const ValidationSystem = () => {
  const [serial1, setSerial1] = useState('');
  const [serial2, setSerial2] = useState('');
  const [validationState, setValidationState] = useState<ValidationState>('waiting');
  const [message, setMessage] = useState('Aguardando primeira leitura...');
  const [isSerial1Complete, setIsSerial1Complete] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [validationHistory, setValidationHistory] = useState<ValidationResult[]>([]);
  const [autoResetTime, setAutoResetTime] = useState(3); // Tempo em segundos para auto-reset
  
  const serial1Ref = useRef<HTMLInputElement>(null);
  const serial2Ref = useRef<HTMLInputElement>(null);

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
      if (soundEnabled) AudioFeedback.playWarning();
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
    if (soundEnabled) {
      if (result.state === 'approved') {
        AudioFeedback.playSuccess();
      } else {
        AudioFeedback.playError();
      }
    }
    
    // Auto-reset após tempo configurável
    setTimeout(() => {
      resetValidation();
    }, autoResetTime * 1000);
  };

  // Reset do sistema
  const resetValidation = () => {
    setSerial1('');
    setSerial2('');
    setIsSerial1Complete(false);
    setValidationState('waiting');
    setMessage('Aguardando primeira leitura...');
    serial1Ref.current?.focus();
  };

  // Handler para primeira entrada
  const handleSerial1Change = (value: string) => {
    setSerial1(value);
    if (value.length >= 8) {
      const normalized = normalizeSerial(value);
      if (validateFormat(normalized)) {
        setIsSerial1Complete(true);
        setMessage('Aguardando segunda leitura...');
        serial2Ref.current?.focus();
      } else {
        setValidationState('error');
        setMessage('Formato do primeiro código inválido');
      }
    }
  };

  // Handler para segunda entrada
  const handleSerial2Change = (value: string) => {
    setSerial2(value);
    if (value.length >= 8 && isSerial1Complete) {
      compareSerials(serial1, value);
    }
  };

  // Handler para Enter key
  const handleKeyPress = (e: React.KeyboardEvent, field: 'serial1' | 'serial2') => {
    if (e.key === 'Enter') {
      if (field === 'serial1' && serial1.length >= 8) {
        handleSerial1Change(serial1);
      } else if (field === 'serial2' && serial2.length >= 8) {
        handleSerial2Change(serial2);
      }
    }
  };

  // Foco automático no primeiro campo ao carregar
  useEffect(() => {
    serial1Ref.current?.focus();
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onClear: resetValidation,
    onHistory: () => console.log('Histórico - implementar modal/página'),
    onConfig: () => console.log('Configurações - implementar modal')
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
      <div className="max-w-4xl mx-auto space-y-8">
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

        {/* Input Fields */}
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="p-6 space-y-4">
            <Label htmlFor="serial1" className="text-xl font-semibold flex items-center gap-2">
              <ScanLine className="w-5 h-5" />
              Código 1
            </Label>
            <Input
              id="serial1"
              ref={serial1Ref}
              value={serial1}
              onChange={(e) => handleSerial1Change(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, 'serial1')}
              placeholder="Escaneie ou digite o primeiro código"
              className="text-2xl p-6 text-center font-mono tracking-wider"
              disabled={isSerial1Complete && validationState !== 'waiting'}
            />
            {isSerial1Complete && (
              <div className="flex items-center justify-center text-success">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span className="font-medium">Código 1 registrado</span>
              </div>
            )}
          </Card>

          <Card className="p-6 space-y-4">
            <Label htmlFor="serial2" className="text-xl font-semibold flex items-center gap-2">
              <ScanLine className="w-5 h-5" />
              Código 2
            </Label>
            <Input
              id="serial2"
              ref={serial2Ref}
              value={serial2}
              onChange={(e) => handleSerial2Change(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, 'serial2')}
              placeholder="Escaneie ou digite o segundo código"
              className="text-2xl p-6 text-center font-mono tracking-wider"
              disabled={!isSerial1Complete || (validationState !== 'waiting' && validationState !== 'error')}
            />
          </Card>
        </div>

        {/* Time Control */}
        <Card className="p-6">
          <div className="flex flex-col items-center space-y-4">
            <Label className="text-lg font-semibold">Tempo de Auto-Reset</Label>
            <div className="flex items-center space-x-4 w-full max-w-md">
              <span className="text-sm text-muted-foreground">1s</span>
              <input
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={autoResetTime}
                onChange={(e) => setAutoResetTime(Number(e.target.value))}
                className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
              />
              <span className="text-sm text-muted-foreground">10s</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-2xl font-bold text-primary">{autoResetTime}s</span>
              <div className="flex space-x-2">
                {[1, 2, 3, 5, 8].map((time) => (
                  <Button
                    key={time}
                    onClick={() => setAutoResetTime(time)}
                    size="sm"
                    variant={autoResetTime === time ? "default" : "outline"}
                    className="px-3 py-1"
                  >
                    {time}s
                  </Button>
                ))}
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Tempo para limpeza automática após resultado da validação
            </p>
          </div>
        </Card>

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
            onClick={() => console.log('Histórico')}
            size="lg"
            variant="outline"
            className="text-lg px-8 py-4"
          >
            <History className="w-5 h-5 mr-2" />
            Histórico (F6)
          </Button>
          
          <Button
            onClick={() => setSoundEnabled(!soundEnabled)}
            size="lg"
            variant={soundEnabled ? "default" : "outline"}
            className="text-lg px-8 py-4"
          >
            🔊 Som {soundEnabled ? 'Ligado' : 'Desligado'}
          </Button>
        </div>

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