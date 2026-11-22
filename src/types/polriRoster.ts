export type UnitKey =
  | 'PIMPINAN'
  | 'PAWAS'
  | 'SAMAPTA'
  | 'LANTAS'
  | 'BHABIN'
  | 'INTEL'
  | 'RESKRIM'
  | 'STANBY'
  | 'SPK'
  | 'JAGA_BANK'
  | 'SIUM';

export type ShiftCode =
  | ''
  | 'X'
  | 'L'
  | 'S'
  | 'M'
  | 'P'
  | 'C'
  | 'C1'
  | 'C2';

export type CycleType =
  | 'NONE'
  | 'INTERVAL_X'     // 1 shift 'X' every N days (PAWAS, BHABIN)
  | 'CYCLE_SML'      // Continuous 3-day S -> M -> L (SAMAPTA, LANTAS, SPK)
  | 'CYCLE_INTEL'    // Continuous 4-day C1 -> C2 -> P -> L
  | 'CYCLE_RESKRIM'; // Continuous 3-day C -> P -> L

export type HighlightColor = 'none' | 'red' | 'yellow';

export interface Personnel {
  id: string;
  unit: UnitKey;
  unitNo: number;
  name: string;
  pangkat: string;
  nrp: string;
  jabatan: string;
  ket: string;
  cycleType: CycleType;
  cycleLength: number;
  phaseOnOct31: number;
  highlightColor?: HighlightColor;
  dutyPaused?: boolean;
  pausedFromDate?: string; // YYYY-MM-DD
}

export interface PawasAnchor {
  dateKey: string; // YYYY-MM-DD
  personnelId: string;
}

export interface RosterOrgHeader {
  line1: string;
  line2: string;
  line3: string;
  documentPrefix: string;
  signerTitle: string;
  signerRank: string;
  signerName: string;
  signerNrp: string;
}

export type ShiftOverrides = Record<string, ShiftCode>; // key: `${personnelId}__${YYYY-MM-DD}`

export type AppTab =
  | 'dashboard'
  | 'matrix'
  | 'daily'
  | 'rengiat'
  | 'pam'
  | 'surat'
  | 'buat-sprin'
  | 'personnel'
  | 'export'
  | 'backup';

export type RengiatPlacePreset =
  | 'LAP. MAPOLRESTABES SMG'
  | 'AULA MAPOLRESTABES SMG'
  | 'R.RUPATAMA MAPOLRESTABES SMG'
  | 'MAPOLSEK SMG SELATAN'
  | 'TENTATIF'
  | 'LAINNYA';

export type RengiatExecutorPreset =
  | 'KAPOLSEK'
  | 'WAKAPOLSEK'
  | 'PAWAS'
  | 'ANGGOTA YG TERSEPRIN'
  | 'LAINNYA';

export interface RengiatItem {
  id: string;
  dateKey: string; // YYYY-MM-DD
  timeMode: 'WIB' | 'TENTATIF';
  timeValue: string; // e.g. '08.00'
  title: string;
  placePreset: RengiatPlacePreset;
  placeCustom: string;
  executorPresets: RengiatExecutorPreset[];
  executorCustom: string;
  notes?: string;
}

export type PamMode = 'AKSI' | 'GIAT';

export interface PamPersonEntry {
  id: string;
  sourcePersonnelId?: string;
  name: string;
  pangkat: string;
  nrp: string;
  jabatan: string;
  ket: string;
  unitLabel?: UnitKey | 'MANUAL';
  shiftCode?: ShiftCode | 'PAWAS' | 'MANUAL';
}

export interface SavedPamRoster {
  id: string;
  mode: PamMode;
  dateKey: string; // YYYY-MM-DD
  title: string;
  savedAt: string;
  entries: PamPersonEntry[];
}

export type SuratMode = 'SPRIN' | 'BIASA';

export type SignerDelegationMode = 'NONE' | 'AN' | 'AN_UB' | 'PLT' | 'PLH' | 'PS';

export type SuratFontFamily = 'Arial' | 'Arial Narrow';

export interface SuratPersonRow {
  id: string;
  sourcePersonnelId?: string;
  name: string;
  pangkat: string;
  nrp: string;
  jabatan: string;
  ket: string;
}

export interface SuratPerintahData {
  kopLine1: string;
  kopLine2: string;
  kopLine3: string;
  nomor: string;
  pertimbangan: string;
  dasar: string[];
  kepadaText: string;
  untuk: string[];
  issuedPlace: string;
  issuedDateText: string;
  signerDelegation?: SignerDelegationMode;
  signerSuperiorTitle?: string;
  signerMiddleTitle?: string;
  signerTitle: string;
  signerName: string;
  signerRankNrp: string;
  tembusan: string[];
  sprinContinuationHeaderLabel?: string;
  lampiranHeaderLabel: string;
  lampiranDateUpper: string;
  lampiranTitle: string;
  lampiranSubtitle: string;
  personnelRows: SuratPersonRow[];
  useInlineKepadaIfFiveOrLess?: boolean;
  fontFamily?: SuratFontFamily;
}

export interface SuratBiasaData {
  kopLine1: string;
  kopLine2: string;
  kopLine3: string;
  kopAddress: string;
  nomor: string;
  klasifikasi: string;
  derajat?: string;
  lampiran: string;
  perihal: string;
  dateRightText: string;
  kepadaYth: string;
  diKota: string;
  upText: string;
  page2HeaderLabel: string;
  page2DateUpper: string;
  paragraphsPage1: string[];
  paragraphsPage2: string[];
  includePersonnelTable: boolean;
  personnelTableTitle: string;
  personnelRows: SuratPersonRow[];
  signerDelegation?: SignerDelegationMode;
  signerSuperiorTitle?: string;
  signerMiddleTitle?: string;
  signerTitle: string;
  signerName: string;
  signerRankNrp: string;
  tembusan: string[];
  fontFamily?: SuratFontFamily;
}

export interface SavedSuratItem {
  id: string;
  mode: SuratMode;
  title: string;
  savedAt: string;
  sprinData?: SuratPerintahData;
  biasaData?: SuratBiasaData;
}

export interface RosterBackupPayload {
  app: 'kuat-pers-jadwal-piket';
  version: number;
  exportedAt: string;
  data: {
    header: RosterOrgHeader;
    personnel: Personnel[];
    unitOrder: UnitKey[];
    pawasAnchor: PawasAnchor;
    overrides: ShiftOverrides;
  };
}

export interface LegendItem {
  code: string;
  label: string;
}
