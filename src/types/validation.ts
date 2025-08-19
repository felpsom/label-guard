export type ValidationState = 'waiting' | 'approved' | 'rejected' | 'error';

export interface ValidationResult {
  serial1: string;
  serial2: string;
  state: ValidationState;
  message: string;
  timestamp: Date;
}

export interface ValidationConfig {
  autoResetTime: number;
  soundEnabled: boolean;
  stationId?: string;
  lineId?: string;
}