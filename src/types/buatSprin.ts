export interface PersonnelRow {
  id: string;
  nama: string;
  pangkat: string;
  nrp: string;
  jabatan: string;
  ket: string;
}

export interface SatkerPreset {
  id: string;
  label: string;
  shortLabel: string;
  polda: string;
  polres: string;
  polsek: string;
  kopLine1: string;
  kopLine2: string;
  kopLine3: string;
  lampiranHeaderTitle: string;
  pejabatJabatan: string;
  pejabatNama: string;
  pejabatPangkatNrp: string;
  stampResorText: string;
  stampSektorText: string;
}

export interface StampSignatureConfig {
  stampImageDataUrl: string | null;
  stampSizeCm: number;
  stampOffsetXMm: number;
  stampOffsetYMm: number;
  stampMultiplyBlend: boolean;
  signatureImageDataUrl: string | null;
  signatureWidthCm: number;
  signatureOffsetXMm: number;
  signatureOffsetYMm: number;
  signatureMultiplyBlend: boolean;
  aboveText: boolean;
}

export interface SprinDocument {
  id: string;
  status: 'Draft' | 'Siap Cetak' | 'Terbit';
  updatedAt: string;
  useLampiran: boolean;

  // Section 1: Jabatan dan Identitas Laporan
  polda: string;
  polres: string;
  polsek: string;
  tanggalKegiatan: string; // YYYY-MM-DD
  pelaporNamaPangkat: string;
  pelaporJabatan: string;
  programQuickWins: string;

  // Section 2: Surat Perintah Halaman 1
  kopLine1: string;
  kopLine2: string;
  kopLine3: string;
  nomorSprin: string;
  pertimbangan: string;
  dasarList: string[];
  kepadaText: string;
  untukList: string[];
  tembusanList: string[];

  // Section 3: Lampiran Halaman 2 (opsional bila useLampiran = true)
  lampiranHeaderTitle: string;
  lampiranNomor: string;
  lampiranTanggalUpper: string;
  lampiranJudul: string;
  lampiranSubjudul: string;
  personelList: PersonnelRow[];

  // Section 4: Pengesahan, Penanda Tangan & Stempel
  dikeluarkanDi: string;
  tanggalSuratHal1: string;
  tanggalSuratHal2: string;
  pejabatJabatan: string;
  pejabatNama: string;
  pejabatPangkatNrp: string;
  showStampAndSignature: boolean;
  stampResorText: string;
  stampSektorText: string;
  stampConfig: StampSignatureConfig;
}

export type AppView = 'editor' | 'arsip' | 'personel';
export type LetterPreviewPage = 'both' | 'page1' | 'page2';
