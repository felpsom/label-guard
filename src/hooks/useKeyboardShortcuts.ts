import { useEffect } from 'react';

interface KeyboardShortcuts {
  onClear?: () => void;
  onHistory?: () => void;
  onConfig?: () => void;
}

export const useKeyboardShortcuts = ({ onClear, onHistory, onConfig }: KeyboardShortcuts) => {
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // F9 - Limpar
      if (event.key === 'F9') {
        event.preventDefault();
        onClear?.();
      }
      
      // F6 - Histórico
      if (event.key === 'F6') {
        event.preventDefault();
        onHistory?.();
      }
      
      // Ctrl + . - Configurações
      if (event.ctrlKey && event.key === '.') {
        event.preventDefault();
        onConfig?.();
      }
      
      // Escape - Cancelar/Limpar
      if (event.key === 'Escape') {
        event.preventDefault();
        onClear?.();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [onClear, onHistory, onConfig]);
};