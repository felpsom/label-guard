export type ValidationState = 'waiting' | 'approved' | 'rejected' | 'error' | 'blocked';

export interface ValidationResult {
  serial1: string;
  serial2: string;
  state: ValidationState;
  message: string;
  timestamp: Date;
  productionLine?: string;
  productModel?: string;
  voltage?: string;
  stationId?: string;
  lineId?: string;
}

export interface ValidationConfig {
  autoResetTime: number;
  soundEnabled: boolean;
  stationId?: string;
  lineId?: string;
  productionLine?: string;
  productModel?: string;
  voltage?: string;
}