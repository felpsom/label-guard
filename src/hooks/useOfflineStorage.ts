import { useState, useEffect } from 'react';
import { ValidationResult, ValidationConfig } from '@/types/validation';

interface OfflineStorage {
  saveValidationHistory: (history: ValidationResult[]) => Promise<void>;
  loadValidationHistory: () => Promise<ValidationResult[]>;
  saveConfig: (config: ValidationConfig) => Promise<void>;
  loadConfig: () => Promise<ValidationConfig | null>;
  clearAllData: () => Promise<void>;
  isSupported: boolean;
}

// Configuração padrão
const DEFAULT_CONFIG: ValidationConfig = {
  autoResetTime: 3,
  soundEnabled: true,
  stationId: '',
  lineId: '',
  productionLine: '',
  productModel: '',
  voltage: ''
};

export const useOfflineStorage = (): OfflineStorage => {
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Verificar suporte ao IndexedDB
    setIsSupported('indexedDB' in window);
  }, []);

  // Função para abrir o banco de dados
  const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('LabelGuardDB', 1);

      request.onerror = () => {
        reject(new Error('Erro ao abrir banco de dados IndexedDB'));
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Criar object stores se não existirem
        if (!db.objectStoreNames.contains('validationHistory')) {
          const historyStore = db.createObjectStore('validationHistory', {
            keyPath: 'id',
            autoIncrement: true
          });
          historyStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('config')) {
          db.createObjectStore('config', { keyPath: 'id' });
        }
      };
    });
  };

  // Salvar histórico de validações
  const saveValidationHistory = async (history: ValidationResult[]): Promise<void> => {
    if (!isSupported) {
      localStorage.setItem('labelguard-history', JSON.stringify(history));
      return;
    }

    try {
      const db = await openDB();
      const transaction = db.transaction(['validationHistory'], 'readwrite');
      const store = transaction.objectStore('validationHistory');

      // Limpar dados antigos
      await new Promise<void>((resolve, reject) => {
        const clearRequest = store.clear();
        clearRequest.onsuccess = () => resolve();
        clearRequest.onerror = () => reject(clearRequest.error);
      });

      // Adicionar novos dados
      for (const item of history) {
        await new Promise<void>((resolve, reject) => {
          const addRequest = store.add({
            ...item,
            timestamp: item.timestamp.getTime() // Converter Date para timestamp
          });
          addRequest.onsuccess = () => resolve();
          addRequest.onerror = () => reject(addRequest.error);
        });
      }

      db.close();
    } catch (error) {
      console.error('Erro ao salvar histórico:', error);
      // Fallback para localStorage
      localStorage.setItem('labelguard-history', JSON.stringify(history));
    }
  };

  // Carregar histórico de validações
  const loadValidationHistory = async (): Promise<ValidationResult[]> => {
    if (!isSupported) {
      const stored = localStorage.getItem('labelguard-history');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
      }
      return [];
    }

    try {
      const db = await openDB();
      const transaction = db.transaction(['validationHistory'], 'readonly');
      const store = transaction.objectStore('validationHistory');

      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => {
          const results = request.result.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp)
          }));
          resolve(results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      // Fallback para localStorage
      const stored = localStorage.getItem('labelguard-history');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
      }
      return [];
    }
  };

  // Salvar configurações
  const saveConfig = async (config: ValidationConfig): Promise<void> => {
    if (!isSupported) {
      localStorage.setItem('labelguard-config', JSON.stringify(config));
      return;
    }

    try {
      const db = await openDB();
      const transaction = db.transaction(['config'], 'readwrite');
      const store = transaction.objectStore('config');

      await new Promise<void>((resolve, reject) => {
        const request = store.put({ id: 'main', ...config });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      db.close();
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      localStorage.setItem('labelguard-config', JSON.stringify(config));
    }
  };

  // Carregar configurações
  const loadConfig = async (): Promise<ValidationConfig | null> => {
    if (!isSupported) {
      const stored = localStorage.getItem('labelguard-config');
      return stored ? JSON.parse(stored) : DEFAULT_CONFIG;
    }

    try {
      const db = await openDB();
      const transaction = db.transaction(['config'], 'readonly');
      const store = transaction.objectStore('config');

      return new Promise((resolve, reject) => {
        const request = store.get('main');
        request.onsuccess = () => {
          const result = request.result;
          if (result) {
            const { id, ...config } = result;
            resolve(config as ValidationConfig);
          } else {
            resolve(DEFAULT_CONFIG);
          }
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      const stored = localStorage.getItem('labelguard-config');
      return stored ? JSON.parse(stored) : DEFAULT_CONFIG;
    }
  };

  // Limpar todos os dados
  const clearAllData = async (): Promise<void> => {
    if (!isSupported) {
      localStorage.removeItem('labelguard-history');
      localStorage.removeItem('labelguard-config');
      return;
    }

    try {
      const db = await openDB();
      const transaction = db.transaction(['validationHistory', 'config'], 'readwrite');
      
      await Promise.all([
        new Promise<void>((resolve, reject) => {
          const request = transaction.objectStore('validationHistory').clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        }),
        new Promise<void>((resolve, reject) => {
          const request = transaction.objectStore('config').clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        })
      ]);

      db.close();
    } catch (error) {
      console.error('Erro ao limpar dados:', error);
      localStorage.removeItem('labelguard-history');
      localStorage.removeItem('labelguard-config');
    }
  };

  return {
    saveValidationHistory,
    loadValidationHistory,
    saveConfig,
    loadConfig,
    clearAllData,
    isSupported
  };
};