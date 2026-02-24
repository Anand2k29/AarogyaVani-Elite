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

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
}

// ── Elderly Care Companion ──────────────────────────────────────────────────

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  times: string[]; // array of HH:MM strings e.g. ["08:00","20:00"]
  notes?: string;
}

export interface MedLog {
  id: string;
  medicationId: string;
  medicationName: string;
  date: string;   // YYYY-MM-DD
  time: string;   // HH:MM
  status: 'taken' | 'skipped';
  loggedAt: number; // timestamp
}

export interface Appointment {
  id: string;
  title: string;
  doctor?: string;
  location?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  notes?: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relation?: string;
}