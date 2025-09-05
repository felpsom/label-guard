import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, ScanLine, RotateCcw, History, Settings } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useOfflineStorage } from '@/hooks/useOfflineStorage';
import { usePWA } from '@/hooks/usePWA';
import { AudioFeedback } from '@/utils/audioFeedback';
import { ValidationState, ValidationResult, ValidationConfig } from '@/types/validation';
import ConfigurationModal from '@/components/ConfigurationModal';
import HistoryModal from '@/components/HistoryModal';
import RejectedModal from '@/components/RejectedModal';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import OfflineIndicator from '@/components/OfflineIndicator';
import MobileOptimizations from '@/components/MobileOptimizations';

const ValidationSystem = () => {
  const [serial1, setSerial1] = useState('');
  const [serial2, setSerial2] = useState('');
  const [validationState, setValidationState] = useState<ValidationState>('waiting');
  const [message, setMessage] = useState('Aguardando primeira leitura...');
  const [isSerial1Complete, setIsSerial1Complete] = useState(false);
  const [validationHistory, setValidationHistory] = useState<ValidationResult[]>([]);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showRejectedModal, setShowRejectedModal] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [currentInput, setCurrentInput] = useState('');
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  
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
  
  // Offline storage hook
  const offlineStorage = useOfflineStorage();
  
  // PWA hooks
  const isMobile = useIsMobile();
  const { isInstallable, isOnline, showInstallPrompt: showPWAPrompt } = usePWA();
  
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
    const updatedHistory = [result, ...validationHistory.slice(0, 99)]; // Keep last 100 records
    setValidationHistory(updatedHistory);
    
    // Save to offline storage
    offlineStorage.saveValidationHistory(updatedHistory);
    
    // Audio feedback e ação baseada no resultado
    if (config.soundEnabled) {
      if (result.state === 'approved') {
        AudioFeedback.playSuccess();
        // Auto-reset para aprovado após tempo configurável
        setTimeout(() => {
          resetValidation();
        }, config.autoResetTime * 1000);
      } else {
        // Para reprovado, toca alarme contínuo e mostra modal
        AudioFeedback.playError();
        setShowRejectedModal(true);
      }
    } else {
      // Se som desabilitado, ainda assim diferencia aprovado de reprovado
      if (result.state === 'approved') {
        setTimeout(() => {
          resetValidation();
        }, config.autoResetTime * 1000);
      } else {
        setShowRejectedModal(true);
      }
    }
  };

  // Reset do sistema
  const resetValidation = () => {
    setSerial1('');
    setSerial2('');
    setCurrentInput('');
    setIsSerial1Complete(false);
    setValidationState('waiting');
    setMessage('Aguardando primeira leitura...');
    setShowRejectedModal(false);
    setIsBlocked(false); // Desbloqueia o sistema
    AudioFeedback.stopAlarm(); // Garantir que o alarme pare
    hiddenInputRef.current?.focus();
  };

  // Handler para confirmação do modal de reprovado
  const handleRejectedConfirm = () => {
    setShowRejectedModal(false);
    setIsBlocked(true); // Bloqueia o sistema após confirmação
    setValidationState('blocked');
    setMessage('Sistema bloqueado - Clique em LIMPAR para continuar');
  };

  // Handler para leitura automática
  const handleScanInput = (value: string) => {
    // Se o sistema estiver bloqueado, não processa leituras
    if (isBlocked) {
      return;
    }

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
    if (e.key === 'Enter' && currentInput.trim() && !isBlocked) {
      handleScanInput(currentInput.trim());
    }
  };

  // Inicialização e persistência de dados
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Carregar configurações salvas
        const savedConfig = await offlineStorage.loadConfig();
        if (savedConfig) {
          setConfig(savedConfig);
        }
        
        // Carregar histórico salvo
        const savedHistory = await offlineStorage.loadValidationHistory();
        setValidationHistory(savedHistory);
        
        // Mostrar prompt de instalação PWA após 2 segundos se não estiver instalado
        setTimeout(() => {
          setShowInstallPrompt(true);
        }, 2000);
      } catch (error) {
        console.error('Erro ao carregar dados salvos:', error);
      }
    };

    initializeData();
  }, [offlineStorage]);

  // Salvar configurações quando alteradas
  useEffect(() => {
    offlineStorage.saveConfig(config);
  }, [config, offlineStorage]);

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
    offlineStorage.saveValidationHistory([]);
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
      case 'blocked':
        return 'bg-red-500/20 shadow-lg border-red-500 animate-pulse';
      default:
        return 'bg-gradient-subtle shadow-industrial border-primary/20';
    }
  };

  const getIcon = () => {
    const iconClass = "w-full h-full";
    switch (validationState) {
      case 'approved':
        return <CheckCircle className={`${iconClass} text-success-foreground`} />;
      case 'rejected':
        return <XCircle className={`${iconClass} text-error-foreground`} />;
      case 'error':
        return <ScanLine className={`${iconClass} text-warning-foreground`} />;
      case 'blocked':
        return <XCircle className={`${iconClass} text-red-500`} />;
      default:
        return <ScanLine className={`${iconClass} text-primary animate-pulse`} />;
    }
  };

  return (
    <div className="min-h-screen bg-primary p-4 pb-20 mobile-optimized flex flex-col">
      <MobileOptimizations />
      <div className="max-w-4xl mx-auto w-full space-y-6 flex-1 flex flex-col justify-center">
        
        {/* Offline Indicator */}
        <OfflineIndicator />
        {/* Header */}
        <div className="text-center space-y-2 md:space-y-4 mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Sistema de Checagem de Etiquetas
          </h1>
          <p className="text-base md:text-lg text-white/80 px-4">
            CheckTag v2.0 - Escaneie ou digite os dois códigos para checagem
          </p>
        </div>

        {/* Informações de Produção Atuais */}
        {(config.productionLine || config.productModel || config.voltage) && (
          <Card className="p-4 bg-primary/80 shadow-industrial border-white/10">
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              {config.productionLine && (
                <div className="text-center">
                  <div className="text-xs text-white/60">Linha</div>
                  <div className="font-mono font-semibold text-white">{config.productionLine}</div>
                </div>
              )}
              {config.productModel && (
                <div className="text-center">
                  <div className="text-xs text-white/60">Modelo</div>
                  <div className="font-mono font-semibold text-white">{config.productModel}</div>
                </div>
              )}
              {config.voltage && (
                <div className="text-center">
                  <div className="text-xs text-white/60">Voltagem</div>
                  <div className="font-mono font-semibold text-white">{config.voltage}</div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Status Card */}
        <Card className={`p-4 md:p-6 transition-all duration-500 shadow-colormaq bg-primary/80 border-white/10 ${getStateClasses()}`}>
          <div className="flex flex-col items-center space-y-3 md:space-y-4">
            <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center">
              {getIcon()}
            </div>
            <h2 className={`text-xl md:text-2xl font-bold text-center px-2 ${
              validationState === 'approved' ? 'text-green-400' : 
              validationState === 'rejected' ? 'text-red-400' :
              validationState === 'error' ? 'text-yellow-400' :
              validationState === 'blocked' ? 'text-red-400' :
              'text-white'
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
          disabled={isBlocked}
        />

        {/* Display de códigos lidos */}
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

        {/* Controls */}
        <div className="flex justify-center flex-wrap gap-2 md:gap-3">
          <Button
            onClick={resetValidation}
            size="default"
            variant="outline"
            className="px-4 py-2 md:px-6 text-sm md:text-base bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <RotateCcw className="w-4 h-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Limpar (F9)</span>
            <span className="sm:hidden">Limpar</span>
          </Button>
          
          <Button
            onClick={() => setShowHistoryModal(true)}
            size="default"
            variant="outline"
            className="px-4 py-2 md:px-6 text-sm md:text-base bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <History className="w-4 h-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Histórico (F6)</span>
            <span className="sm:hidden">Histórico</span>
          </Button>
          
          <Button
            onClick={() => setShowConfigModal(true)}
            size="default"
            variant="outline"
            className="px-4 py-2 md:px-6 text-sm md:text-base bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <Settings className="w-4 h-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Config</span>
            <span className="sm:hidden">Config</span>
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

        {/* Rejected Modal */}
        <RejectedModal
          isOpen={showRejectedModal}
          onConfirm={handleRejectedConfirm}
          serial1={serial1}
          serial2={serial2}
        />

        {/* Stats */}
        {validationHistory.length > 0 && (
          <Card className="p-6 bg-primary/80 border-white/10">
            <h3 className="text-xl font-semibold mb-4 text-center text-white">Estatísticas da Sessão</h3>
            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-white">{validationHistory.length}</div>
                <div className="text-sm text-white/60">Total de Validações</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">
                  {validationHistory.filter(v => v.state === 'approved').length}
                </div>
                <div className="text-sm text-white/60">Aprovados</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-400">
                  {validationHistory.filter(v => v.state === 'rejected').length}
                </div>
                <div className="text-sm text-white/60">Reprovados</div>
              </div>
            </div>
          </Card>
        )}

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
        
        {/* PWA Install Prompt */}
        <PWAInstallPrompt />
      </div>
    </div>
  );
};

export default ValidationSystem;