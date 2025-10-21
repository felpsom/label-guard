import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RotateCcw, History, Settings } from 'lucide-react';
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
import ValidationDisplay from '@/components/ValidationDisplay';
import ValidationStatusCard from '@/components/ValidationStatusCard';
import ValidationStats from '@/components/ValidationStats';

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
  
  // Sistema de deduplicação para evitar leituras repetidas
  const recentScansRef = useRef<Map<string, number>>(new Map());
  const DEDUPE_WINDOW = 2000; // 2 segundos para considerar duplicata
  
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
    recentScansRef.current.clear(); // Limpa o cache de deduplicação
    hiddenInputRef.current?.focus();
  };

  // Verifica no histórico se um código já foi apontado anteriormente
  const hasAlreadyBeenPointed = (normalizedCode: string): boolean => {
    if (!normalizedCode) return false;
    return validationHistory.some((r) => {
      const s1 = r.serial1 ? normalizeSerial(r.serial1) : "";
      const s2 = r.serial2 ? normalizeSerial(r.serial2) : "";
      return s1 === normalizedCode || s2 === normalizedCode;
    });
  };

  // Handler para confirmação do modal de reprovado
  const handleRejectedConfirm = () => {
    setShowRejectedModal(false);
    setIsBlocked(true); // Bloqueia o sistema após confirmação
    setValidationState('blocked');
    setMessage('Sistema bloqueado - Clique em LIMPAR para continuar');
  };

  // Verifica se o código já foi lido recentemente (deduplicação)
  const isDuplicateScan = (normalizedCode: string): boolean => {
    const now = Date.now();
    const lastScanTime = recentScansRef.current.get(normalizedCode);
    
    // Limpar códigos antigos do cache (mais de 5 segundos)
    recentScansRef.current.forEach((timestamp, code) => {
      if (now - timestamp > 5000) {
        recentScansRef.current.delete(code);
      }
    });
    
    // Verifica se foi lido nos últimos 2 segundos
    if (lastScanTime && (now - lastScanTime) < DEDUPE_WINDOW) {
      return true;
    }
    
    // Registra esta leitura
    recentScansRef.current.set(normalizedCode, now);
    return false;
  };

  // Handler para leitura automática
  const handleScanInput = (value: string) => {
    // Se o sistema estiver bloqueado, não processa leituras
    if (isBlocked) {
      return;
    }
    
    const normalized = normalizeSerial(value);
    
    // Verifica se é uma leitura duplicada
    if (isDuplicateScan(normalized)) {
      console.log('Leitura duplicada ignorada:', normalized);
      setCurrentInput('');
      return;
    }

    // Se ainda não há primeira leitura
    if (!isSerial1Complete) {
      if (validateFormat(normalized)) {
        // Bloqueia códigos já apontados anteriormente
        if (hasAlreadyBeenPointed(normalized)) {
          setValidationState('error');
          setMessage('Código já apontado anteriormente');
          if (config.soundEnabled) AudioFeedback.playWarning();
          setCurrentInput('');
          return;
        }
        
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
      // Bloqueia códigos já apontados anteriormente
      const normalizedSecond = normalizeSerial(value);
      if (hasAlreadyBeenPointed(normalizedSecond)) {
        setValidationState('error');
        setMessage('Código já apontado anteriormente');
        if (config.soundEnabled) AudioFeedback.playWarning();
        setCurrentInput('');
        return;
      }
      
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
        
        // Mostrar prompt de instalação PWA após 5 segundos se instalável
        setTimeout(() => {
          if (isInstallable) {
            setShowInstallPrompt(true);
          }
        }, 5000);
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
    // Focus inicial apenas se não estivermos no modo de desenvolvimento do Lovable
    if (document.visibilityState === 'visible' && document.hasFocus()) {
      setTimeout(() => {
        hiddenInputRef.current?.focus();
      }, 100);
    }

    const handleFocus = () => {
      // Gerenciar foco apenas se o documento estiver ativo e visível
      if (!document.hasFocus() || document.visibilityState !== 'visible') return;
      
      // Não roubar foco se estiver dentro de um iframe (modo Lovable)
      if (window !== window.parent) return;

      const active = document.activeElement as HTMLElement | null;
      const isModalOpen = showConfigModal || showHistoryModal || showRejectedModal;
      
      // Não gerenciar foco se um modal estiver aberto
      if (isModalOpen) return;
      
      const isInteractive = !!active && (
        active.isContentEditable || 
        ['INPUT','TEXTAREA','SELECT','BUTTON'].includes(active.tagName) ||
        active.closest('[role="dialog"]') ||
        active.closest('.radix-dialog-content')
      );

      if (hiddenInputRef.current && !isInteractive && active !== hiddenInputRef.current) {
        hiddenInputRef.current.focus();
      }
    };

    const interval = setInterval(handleFocus, 500);
    return () => clearInterval(interval);
  }, [showConfigModal, showHistoryModal, showRejectedModal]);

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

  return (
    <div className="min-h-screen bg-primary p-4 mobile-optimized flex flex-col overflow-hidden">
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
        <ValidationStatusCard 
          validationState={validationState}
          message={message}
        />

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
        <ValidationDisplay
          serial1={serial1}
          serial2={serial2}
          isSerial1Complete={isSerial1Complete}
          isBlocked={isBlocked}
          validationState={validationState}
        />

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

        {/* Stats and Quick Info */}
        <ValidationStats validationHistory={validationHistory} />
        
        {/* PWA Install Prompt */}
        {showInstallPrompt && isInstallable && (
          <PWAInstallPrompt onDismiss={() => setShowInstallPrompt(false)} />
        )}
      </div>
    </div>
  );
};

export default ValidationSystem;