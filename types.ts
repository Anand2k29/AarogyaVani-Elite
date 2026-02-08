export interface Medicine {
  name: string;
  dosage: string;
  timing: string;
  notes?: string;
}

export interface Interaction {
  severity: 'HIGH' | 'MODERATE' | 'LOW';
  description: string;
  medicines: string[];
}

export interface StructuredData {
  medicines: Medicine[];
  patientNotes?: string;
  interactions?: Interaction[];
}

export interface AarogyaResponse {
  structured_data: StructuredData;
  voice_script_english: string;
  voice_script_native: string;
  success_message?: string;
  language: string;
}

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  data: AarogyaResponse;
}

export interface PillAnalysisResult {
  visualDescription: string;
  matchStatus: 'LIKELY_MATCH' | 'POSSIBLE_MISMATCH' | 'UNCERTAIN';
  analysis: string;
  voiceSummary: string;
}