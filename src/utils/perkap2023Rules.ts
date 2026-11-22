import {
  SignerDelegationMode,
  SuratBiasaData,
  SuratFontFamily,
  SuratPerintahData,
  SuratPersonRow,
} from '../types/polriRoster';

export const PERKAP_KLASIFIKASI_OPTIONS = [
  'Biasa',
  'Terbatas',
  'Rahasia',
  'Sangat Rahasia',
] as const;

export const PERKAP_DERAJAT_OPTIONS = [
  '',
  'Kilat',
  'Sangat Segera',
  'Segera',
  'Biasa',
] as const;

export const SIGNER_DELEGATION_OPTIONS: {
  value: SignerDelegationMode;
  label: string;
  shortLabel: string;
  description: string;
}[] = [
  {
    value: 'NONE',
    label: 'Langsung (Pejabat Definitif)',
    shortLabel: 'Langsung',
    description: 'Ditandatangani langsung oleh pejabat berwenang.',
  },
  {
    value: 'AN',
    label: 'a.n. (Atas Nama — pelimpahan 1 tingkat)',
    shortLabel: 'a.n.',
    description: 'Dilimpahkan kepada pejabat 1 tingkat di bawahnya (huruf kecil bertitik: a.n.).',
  },
  {
    value: 'AN_UB',
    label: 'a.n. + u.b. (Atas Nama & Untuk Beliau — 2 tingkat)',
    shortLabel: 'a.n. + u.b.',
    description: 'Pelimpahan berjenjang 2 tingkat; u.b. hanya boleh setelah a.n.',
  },
  {
    value: 'PLT',
    label: 'Plt. (Pelaksana Tugas)',
    shortLabel: 'Plt.',
    description: 'Pejabat pelaksana tugas sementara karena pejabat definitif belum ada.',
  },
  {
    value: 'PLH',
    label: 'Plh. (Pelaksana Harian)',
    shortLabel: 'Plh.',
    description: 'Pejabat pelaksana harian saat pejabat definitif berhalangan sementara.',
  },
  {
    value: 'PS',
    label: 'PS (Pemangku Sementara)',
    shortLabel: 'PS',
    description: 'Pemangku sementara (kapital tanpa titik).',
  },
];

export const SURAT_FONT_OPTIONS = ['Arial Narrow', 'Arial'] as const;

export const PERKAP_RULES_SUMMARY = {
  paper: 'A4 (210 × 297 mm)',
  margins:
    'Atas 2 cm (2 baris di bawah kop) · Kiri 3 cm · Bawah 3 cm (min. 1,5 cm penyambung/klasifikasi) · Kanan 1,5 cm',
  font: 'Arial / Arial Narrow · Ukuran 12 pt',
  kopMaxChars: 41,
  tajukMaxChars: 48,
  halMaxLines: 3,
  sprinInlineLimit: 5,
} as const;

export interface PerkapCheckItem {
  id: string;
  status: 'ok' | 'warn';
  title: string;
  detail: string;
}

export interface TajukTitleLine {
  text: string;
  isUbMarker?: boolean;
}

// ============================================================================
// TABEL PANGKAT POLRI LENGKAP (TIDAK DISINGKAT PADA TAJUK TANDA TANGAN)
// ============================================================================

export const POLRI_RANK_FULL_MAP: Record<string, string> = {
  JEND: 'JENDERAL POLISI',
  'JEND.': 'JENDERAL POLISI',
  'JEND POL': 'JENDERAL POLISI',
  'JENDERAL POL': 'JENDERAL POLISI',
  JENDERAL: 'JENDERAL POLISI',
  'JENDERAL POLISI': 'JENDERAL POLISI',
  KOMJEN: 'KOMISARIS JENDERAL POLISI',
  'KOMJEN POL': 'KOMISARIS JENDERAL POLISI',
  'KOMISARIS JENDERAL': 'KOMISARIS JENDERAL POLISI',
  'KOMISARIS JENDERAL POLISI': 'KOMISARIS JENDERAL POLISI',
  IRJEN: 'INSPEKTUR JENDERAL POLISI',
  'IRJEN POL': 'INSPEKTUR JENDERAL POLISI',
  'INSPEKTUR JENDERAL': 'INSPEKTUR JENDERAL POLISI',
  'INSPEKTUR JENDERAL POLISI': 'INSPEKTUR JENDERAL POLISI',
  BRIGJEN: 'BRIGADIR JENDERAL POLISI',
  'BRIGJEN POL': 'BRIGADIR JENDERAL POLISI',
  'BRIGADIR JENDERAL': 'BRIGADIR JENDERAL POLISI',
  'BRIGADIR JENDERAL POLISI': 'BRIGADIR JENDERAL POLISI',
  KOMBES: 'KOMISARIS BESAR POLISI',
  'KOMBES POL': 'KOMISARIS BESAR POLISI',
  'KOMBESPOL': 'KOMISARIS BESAR POLISI',
  'KOMISARIS BESAR': 'KOMISARIS BESAR POLISI',
  'KOMISARIS BESAR POLISI': 'KOMISARIS BESAR POLISI',
  AKBP: 'AJUN KOMISARIS BESAR POLISI',
  'AJUN KOMISARIS BESAR POLISI': 'AJUN KOMISARIS BESAR POLISI',
  KOMPOL: 'KOMISARIS POLISI',
  'KOMISARIS POLISI': 'KOMISARIS POLISI',
  AKP: 'AJUN KOMISARIS POLISI',
  'AJUN KOMISARIS POLISI': 'AJUN KOMISARIS POLISI',
  IPTU: 'INSPEKTUR POLISI SATU',
  'INSPEKTUR POLISI SATU': 'INSPEKTUR POLISI SATU',
  IPDA: 'INSPEKTUR POLISI DUA',
  'INSPEKTUR POLISI DUA': 'INSPEKTUR POLISI DUA',
  AIPTU: 'AJUN INSPEKTUR POLISI SATU',
  'AJUN INSPEKTUR POLISI SATU': 'AJUN INSPEKTUR POLISI SATU',
  AIPDA: 'AJUN INSPEKTUR POLISI DUA',
  'AJUN INSPEKTUR POLISI DUA': 'AJUN INSPEKTUR POLISI DUA',
  BRIPKA: 'BRIGADIR POLISI KEPALA',
  'BRIGADIR POLISI KEPALA': 'BRIGADIR POLISI KEPALA',
  BRIGPOL: 'BRIGADIR POLISI',
  BRIGADIR: 'BRIGADIR POLISI',
  'BRIGADIR POLISI': 'BRIGADIR POLISI',
  BRIPTU: 'BRIGADIR POLISI SATU',
  'BRIGADIR POLISI SATU': 'BRIGADIR POLISI SATU',
  BRIPDA: 'BRIGADIR POLISI DUA',
  'BRIGADIR POLISI DUA': 'BRIGADIR POLISI DUA',
  ABRIP: 'AJUN BRIGADIR POLISI',
  'AJUN BRIGADIR POLISI': 'AJUN BRIGADIR POLISI',
  ABRIPTU: 'AJUN BRIGADIR POLISI SATU',
  'AJUN BRIGADIR POLISI SATU': 'AJUN BRIGADIR POLISI SATU',
  ABRIPDA: 'AJUN BRIGADIR POLISI DUA',
  'AJUN BRIGADIR POLISI DUA': 'AJUN BRIGADIR POLISI DUA',
  BHARAKA: 'BHAYANGKARA KEPALA',
  'BHAYANGKARA KEPALA': 'BHAYANGKARA KEPALA',
  BHARATU: 'BHAYANGKARA SATU',
  'BHAYANGKARA SATU': 'BHAYANGKARA SATU',
  BHARADA: 'BHAYANGKARA DUA',
  'BHAYANGKARA DUA': 'BHAYANGKARA DUA',
};

const ABBREVIATED_RANK_TOKENS = [
  'KOMBES POL',
  'KOMBESPOL',
  'KOMBES',
  'AKBP',
  'KOMPOL',
  'AKP',
  'IPTU',
  'IPDA',
  'AIPTU',
  'AIPDA',
  'BRIPKA',
  'BRIGPOL',
  'BRIPTU',
  'BRIPDA',
  'ABRIPTU',
  'ABRIPDA',
  'ABRIP',
  'BHARAKA',
  'BHARATU',
  'BHARADA',
  'BRIGJEN',
  'IRJEN',
  'KOMJEN',
  'JEND',
];

const PATI_FULL_RANKS = [
  'JENDERAL POLISI',
  'KOMISARIS JENDERAL POLISI',
  'INSPEKTUR JENDERAL POLISI',
  'BRIGADIR JENDERAL POLISI',
];

export function isPatiRank(rankOrLine: string): boolean {
  const expanded = expandPolriRankToFull(rankOrLine).toUpperCase();
  return PATI_FULL_RANKS.some((pati) => expanded.includes(pati));
}

export function expandPolriRankToFull(rawRank: string): string {
  const cleaned = rawRank.trim().replace(/\s+/g, ' ').toUpperCase();
  if (!cleaned) return '';
  if (POLRI_RANK_FULL_MAP[cleaned]) {
    return POLRI_RANK_FULL_MAP[cleaned];
  }
  const noDot = cleaned.replace(/\.+$/, '');
  if (POLRI_RANK_FULL_MAP[noDot]) {
    return POLRI_RANK_FULL_MAP[noDot];
  }
  return cleaned;
}

export function normalizeSignerRankNrpPerkap(raw: string): string {
  let cleaned = raw.trim().replace(/\s+/g, ' ');
  if (!cleaned) return '';

  // Perbaiki penulisan N.R.P / NRP. / duplikasi "NRP NRP"
  cleaned = cleaned
    .replace(/\bN\.?\s*R\.?\s*P\.?\b/gi, 'NRP')
    .replace(/\bN\.?\s*I\.?\s*P\.?\b/gi, 'NIP')
    .replace(/\b(NRP|NIP)\s+\1\b/gi, '$1')
    .replace(/\b(NRP|NIP)\.\s*/gi, '$1 ')
    .replace(/\s+/g, ' ')
    .trim();

  const nrpMatch = cleaned.match(/^(.*?)\s*\b(NRP|NIP)\s+([0-9.\-\s]+)$/i);
  if (nrpMatch) {
    const rankPart = expandPolriRankToFull(nrpMatch[1]);
    const idLabel = nrpMatch[2].toUpperCase();
    const idDigits = nrpMatch[3].replace(/[.\s]+/g, '');
    if (idLabel === 'NRP' && isPatiRank(rankPart)) {
      // Khusus Perwira Tinggi (Pati) Polri tanpa NRP
      return rankPart;
    }
    return `${rankPart} ${idLabel} ${idDigits}`.trim();
  }

  return expandPolriRankToFull(cleaned);
}

// ============================================================================
// PENULISAN NAMA PEJABAT & GELAR AKADEMIK (EYD/PUEBI + NAMA KAPITAL)
// ============================================================================

const ACADEMIC_DEGREE_CANONICAL: Record<string, string> = {
  DR: 'Dr.',
  DRS: 'Drs.',
  DRA: 'Dra.',
  IR: 'Ir.',
  PROF: 'Prof.',
  H: 'H.',
  HJ: 'Hj.',
  SH: 'S.H.',
  MH: 'M.H.',
  SIK: 'S.I.K.',
  STK: 'S.T.K.',
  MSI: 'M.Si.',
  MM: 'M.M.',
  SSOS: 'S.Sos.',
  MKOM: 'M.Kom.',
  SKOM: 'S.Kom.',
  SE: 'S.E.',
  ME: 'M.E.',
  SPD: 'S.Pd.',
  MPD: 'M.Pd.',
  SPSI: 'S.Psi.',
  MPSI: 'M.Psi.',
  ST: 'S.T.',
  MT: 'M.T.',
  SIP: 'S.I.P.',
  MAP: 'M.A.P.',
  SAG: 'S.Ag.',
  MAG: 'M.Ag.',
  SHUM: 'S.Hum.',
  MHUM: 'M.Hum.',
  SKM: 'S.K.M.',
  MKM: 'M.K.M.',
  PHD: 'Ph.D.',
  LLM: 'LL.M.',
  LLB: 'LL.B.',
  MBA: 'M.B.A.',
  MPA: 'M.P.A.',
  MSC: 'M.Sc.',
};

const PREFIX_TITLE_KEYS = new Set(['DR', 'DRS', 'DRA', 'IR', 'PROF', 'H', 'HJ']);

function normalizeDegreeToken(rawToken: string): string {
  const trimmed = rawToken.trim();
  if (!trimmed) return '';
  const strippedKey = trimmed.replace(/[.,]/g, '').toUpperCase();
  if (ACADEMIC_DEGREE_CANONICAL[strippedKey]) {
    return ACADEMIC_DEGREE_CANONICAL[strippedKey];
  }
  // Pertahankan gelar custom yang sudah punya campuran huruf besar/kecil (mis. S.Tr.K.)
  if (/[a-z]/.test(trimmed) && trimmed.includes('.')) {
    return trimmed;
  }
  return trimmed;
}

export function normalizeSignerNamePerkap(raw: string): string {
  const cleaned = raw.trim().replace(/\s+/g, ' ');
  if (!cleaned) return '';

  // Pisahkan bagian nama utama dan gelar di belakang koma pertama
  const commaParts = cleaned.split(',').map((p) => p.trim()).filter(Boolean);
  const nameSegment = commaParts[0] ?? '';
  const suffixSegments = commaParts.slice(1);

  const nameTokens = nameSegment.split(/\s+/).map((tok, idx) => {
    const strippedKey = tok.replace(/\./g, '').toUpperCase();
    // Gelar depan (Dr., Prof., Ir., H., Hj.) atau gelar bertitik sebelum koma
    if (
      idx < 2 &&
      PREFIX_TITLE_KEYS.has(strippedKey) &&
      (tok.includes('.') || ACADEMIC_DEGREE_CANONICAL[strippedKey])
    ) {
      return ACADEMIC_DEGREE_CANONICAL[strippedKey] ?? tok;
    }
    if (tok.includes('.') && /[a-z]/.test(tok)) {
      return tok;
    }
    return tok.toUpperCase();
  });

  const normalizedSuffixes = suffixSegments.flatMap((seg) => {
    // Jika user menulis "S.H. M.H." tanpa koma di antara gelar, pecah tiap gelar bertitik
    const subTokens = seg.split(/\s+/).filter(Boolean);
    return subTokens.map((st) => normalizeDegreeToken(st));
  });

  if (normalizedSuffixes.length === 0) {
    return nameTokens.join(' ');
  }
  return `${nameTokens.join(' ')}, ${normalizedSuffixes.join(', ')}`;
}

// ============================================================================
// PENULISAN JABATAN & TAJUK TANDA TANGAN (MAKS 48 KETUKAN + PASAL 88)
// ============================================================================

const JABATAN_ABBREVIATIONS: Array<[RegExp, string]> = [
  [/\bKEPALA KEPOLISIAN NEGARA REPUBLIK INDONESIA\b/g, 'KAPOLRI'],
  [/\bKEPALA KEPOLISIAN DAERAH\b/g, 'KAPOLDA'],
  [/\bWAKIL KEPALA KEPOLISIAN DAERAH\b/g, 'WAKAPOLDA'],
  [/\bKEPALA KEPOLISIAN RESOR KOTA BESAR\b/g, 'KAPOLRESTABES'],
  [/\bWAKIL KEPALA KEPOLISIAN RESOR KOTA BESAR\b/g, 'WAKAPOLRESTABES'],
  [/\bKEPALA KEPOLISIAN RESOR KOTA\b/g, 'KAPOLRESTA'],
  [/\bKEPALA KEPOLISIAN RESOR METROPOLITAN\b/g, 'KAPOLRES METRO'],
  [/\bKEPALA KEPOLISIAN RESOR\b/g, 'KAPOLRES'],
  [/\bWAKIL KEPALA KEPOLISIAN RESOR\b/g, 'WAKAPOLRES'],
  [/\bKEPALA KEPOLISIAN SEKTOR\b/g, 'KAPOLSEK'],
  [/\bWAKIL KEPALA KEPOLISIAN SEKTOR\b/g, 'WAKAPOLSEK'],
  [/\bKEPALA BAGIAN OPERASIONAL\b/g, 'KABAG OPS'],
  [/\bKEPALA BAGIAN PERENCANAAN\b/g, 'KABAGREN'],
  [/\bKEPALA BAGIAN SUMBER DAYA MANUSIA\b/g, 'KABAG SDM'],
  [/\bKEPALA SATUAN\b/g, 'KASAT'],
  [/\bKEPALA SEKSI\b/g, 'KASI'],
  [/\bKEPALA UNIT\b/g, 'KANIT'],
];

const JABATAN_EXPANSIONS: Array<[RegExp, string]> = [
  [/\bKAPOLSEK\b/g, 'KEPALA KEPOLISIAN SEKTOR'],
  [/\bWAKAPOLSEK\b/g, 'WAKIL KEPALA KEPOLISIAN SEKTOR'],
  [/\bKAPOLRESTABES\b/g, 'KEPALA KEPOLISIAN RESOR KOTA BESAR'],
  [/\bWAKAPOLRESTABES\b/g, 'WAKIL KEPALA KEPOLISIAN RESOR KOTA BESAR'],
  [/\bKAPOLRES\b/g, 'KEPALA KEPOLISIAN RESOR'],
  [/\bKAPOLDA\b/g, 'KEPALA KEPOLISIAN DAERAH'],
];

export function abbreviateJabatanIfOver48(raw: string): string {
  let text = raw.trim().replace(/\s+/g, ' ').toUpperCase();
  if (text.length <= PERKAP_RULES_SUMMARY.tajukMaxChars) return text;
  for (const [pattern, replacement] of JABATAN_ABBREVIATIONS) {
    text = text.replace(pattern, replacement);
    if (text.length <= PERKAP_RULES_SUMMARY.tajukMaxChars) break;
  }
  return text;
}

export function expandJabatanIfShort(raw: string): string {
  let text = raw.trim().replace(/\s+/g, ' ').toUpperCase();
  for (const [pattern, replacement] of JABATAN_EXPANSIONS) {
    const candidate = text.replace(pattern, replacement);
    if (candidate.length <= PERKAP_RULES_SUMMARY.tajukMaxChars) {
      text = candidate;
    }
  }
  return text;
}

export function normalizeSignerTitleText(raw: string): string {
  const trimmed = raw.trim().replace(/\s+/g, ' ');
  if (!trimmed) return '';
  // Hilangkan prefiks delegasi jika user mengetik manual di field jabatan
  const stripped = trimmed
    .replace(/^(a\.n\.|u\.b\.|plt\.|plh\.|p\.?s\.?)\s+/i, '')
    .trim();
  return stripped.toUpperCase();
}

export function buildTajukTitleLines(opts: {
  signerDelegation?: SignerDelegationMode;
  signerSuperiorTitle?: string;
  signerMiddleTitle?: string;
  signerTitle: string;
}): TajukTitleLine[] {
  const mode = opts.signerDelegation ?? 'NONE';
  const mainTitle = opts.signerTitle.trim() || 'KAPOLSEK SEMARANG SELATAN';
  const superior = opts.signerSuperiorTitle?.trim() || 'KAPOLRESTABES SEMARANG';
  const middle = opts.signerMiddleTitle?.trim() || 'KABAG OPS';

  if (mode === 'AN') {
    return [
      { text: `a.n. ${superior}` },
      { text: mainTitle },
    ];
  }
  if (mode === 'AN_UB') {
    return [
      { text: `a.n. ${superior}` },
      { text: middle },
      { text: 'u.b.', isUbMarker: true },
      { text: mainTitle },
    ];
  }
  if (mode === 'PLT') {
    return [{ text: `Plt. ${mainTitle}` }];
  }
  if (mode === 'PLH') {
    return [{ text: `Plh. ${mainTitle}` }];
  }
  if (mode === 'PS') {
    return [{ text: `PS ${mainTitle}` }];
  }
  return [{ text: mainTitle }];
}

// ============================================================================
// FORMAT KEPADA INLINE SURAT PERINTAH (≤ 5 PERSONEL) — PERKAP 1/2023
// Urutan: PANGKAT NAMA NRP (dengan garis pemisah sepanjang Pangkat, Nama, NRP)
//        JABATAN
// ============================================================================

export function formatSprinInlineKepadaPerson(row: SuratPersonRow): {
  identityLine: string;
  jabatanLine: string;
} {
  const pangkat = row.pangkat.trim().toUpperCase();
  const nama = normalizeSignerNamePerkap(row.name);
  const nrpDigits = row.nrp.trim().replace(/^nrp\s*/i, '');
  const idPart =
    nrpDigits && !isPatiRank(pangkat) ? `NRP ${nrpDigits}` : '';
  const identityLine = [pangkat, nama, idPart].filter(Boolean).join(' ');
  const jab = row.jabatan.trim().toUpperCase();
  const ket = row.ket.trim().toUpperCase();
  const jabatanLine = ket ? `${jab} (${ket})` : jab;
  return { identityLine, jabatanLine };
}

// ============================================================================
// NORMALISASI LAMPIRAN, HAL, TEMBUSAN, DAN PENERAPAN STANDAR PERKAP 1/2023
// ============================================================================

const SINGLE_WORD_NUMBERS: Record<number, string> = {
  1: 'satu',
  2: 'dua',
  3: 'tiga',
  4: 'empat',
  5: 'lima',
  6: 'enam',
  7: 'tujuh',
  8: 'delapan',
  9: 'sembilan',
  10: 'sepuluh',
  11: 'sebelas',
  100: 'seratus',
};

const LAMPIRAN_UNITS = ['lembar', 'buku', 'eksemplar', 'berkas', 'bundel'];

export function normalizePerkapLampiran(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed || trimmed === '-') return '-';

  const matchNumUnit = trimmed.match(/^(\d+)\s+([a-zA-Z]+)$/);
  if (matchNumUnit) {
    const num = Number(matchNumUnit[1]);
    const unitLower = matchNumUnit[2].toLowerCase();
    const validUnit = LAMPIRAN_UNITS.includes(unitLower) ? unitLower : unitLower;
    if (SINGLE_WORD_NUMBERS[num]) {
      return `${SINGLE_WORD_NUMBERS[num]} ${validUnit}`;
    }
    return `${num} ${validUnit}`;
  }

  const matchWordUnit = trimmed.match(/^([a-zA-Z]+)\s+([a-zA-Z]+)$/);
  if (matchWordUnit) {
    return `${matchWordUnit[1].toLowerCase()} ${matchWordUnit[2].toLowerCase()}`;
  }

  return trimmed;
}

export function normalizePerkapHal(raw: string): string {
  const cleaned = raw.trim().replace(/\s+/g, ' ');
  if (!cleaned) return '';
  return cleaned.endsWith('.') ? cleaned : `${cleaned}.`;
}

export function normalizePerkapTembusan(lines: string[]): string[] {
  return lines.map((line) => line.trim().replace(/\.+$/, ''));
}

export function normalizePerkapUpText(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  return trimmed.replace(/^up\.?\s*/i, 'u.p. ');
}

export function applyPerkapBiasaStandard(data: SuratBiasaData): SuratBiasaData {
  const validKlas = PERKAP_KLASIFIKASI_OPTIONS.find(
    (k) => k.toLowerCase() === data.klasifikasi.trim().toLowerCase()
  );

  return {
    ...data,
    klasifikasi:
      validKlas ??
      (data.klasifikasi.trim().toLowerCase() === 'konfidensial'
        ? 'Terbatas'
        : 'Biasa'),
    lampiran: normalizePerkapLampiran(data.lampiran),
    perihal: normalizePerkapHal(data.perihal),
    upText: normalizePerkapUpText(data.upText),
    kepadaYth: data.kepadaYth.trim().toUpperCase(),
    signerSuperiorTitle: data.signerSuperiorTitle
      ? abbreviateJabatanIfOver48(normalizeSignerTitleText(data.signerSuperiorTitle))
      : data.signerSuperiorTitle,
    signerMiddleTitle: data.signerMiddleTitle
      ? abbreviateJabatanIfOver48(normalizeSignerTitleText(data.signerMiddleTitle))
      : data.signerMiddleTitle,
    signerTitle: abbreviateJabatanIfOver48(
      normalizeSignerTitleText(data.signerTitle)
    ),
    signerName: normalizeSignerNamePerkap(data.signerName),
    signerRankNrp: normalizeSignerRankNrpPerkap(data.signerRankNrp),
    personnelRows: data.personnelRows.map((row) => ({
      ...row,
      name: normalizeSignerNamePerkap(row.name),
      pangkat: row.pangkat.trim().toUpperCase(),
      jabatan: row.jabatan.trim().toUpperCase(),
      ket: row.ket.trim().toUpperCase(),
    })),
    tembusan: normalizePerkapTembusan(data.tembusan),
  };
}

export function applyPerkapSprinStandard(
  data: SuratPerintahData
): SuratPerintahData {
  return {
    ...data,
    signerSuperiorTitle: data.signerSuperiorTitle
      ? abbreviateJabatanIfOver48(normalizeSignerTitleText(data.signerSuperiorTitle))
      : data.signerSuperiorTitle,
    signerMiddleTitle: data.signerMiddleTitle
      ? abbreviateJabatanIfOver48(normalizeSignerTitleText(data.signerMiddleTitle))
      : data.signerMiddleTitle,
    signerTitle: abbreviateJabatanIfOver48(
      normalizeSignerTitleText(data.signerTitle)
    ),
    signerName: normalizeSignerNamePerkap(data.signerName),
    signerRankNrp: normalizeSignerRankNrpPerkap(data.signerRankNrp),
    personnelRows: data.personnelRows.map((row) => ({
      ...row,
      name: normalizeSignerNamePerkap(row.name),
      pangkat: row.pangkat.trim().toUpperCase(),
      jabatan: row.jabatan.trim().toUpperCase(),
      ket: row.ket.trim().toUpperCase(),
    })),
    tembusan: normalizePerkapTembusan(data.tembusan),
    useInlineKepadaIfFiveOrLess:
      data.personnelRows.length > PERKAP_RULES_SUMMARY.sprinInlineLimit
        ? false
        : data.useInlineKepadaIfFiveOrLess,
  };
}

// ============================================================================
// VALIDATOR KEPATUHAN PERKAP NOMOR 1 TAHUN 2023
// ============================================================================

function checkKopLines(lines: string[]): PerkapCheckItem {
  const nonEmpty = lines.filter((l) => l.trim().length > 0);
  const overChars = nonEmpty.filter(
    (l) => l.trim().length > PERKAP_RULES_SUMMARY.kopMaxChars
  );
  if (nonEmpty.length > 3) {
    return {
      id: 'kop',
      status: 'warn',
      title: 'Kopstuk Instansi (Pasal 43)',
      detail: `Kopstuk instansi maksimal 3 baris ke bawah (saat ini ${nonEmpty.length} baris).`,
    };
  }
  if (overChars.length > 0) {
    return {
      id: 'kop',
      status: 'warn',
      title: 'Kopstuk Instansi (Pasal 43)',
      detail: `Ada baris kopstuk melebihi 41 ketukan: "${overChars[0].trim()}" (${overChars[0].trim().length} ketukan).`,
    };
  }
  return {
    id: 'kop',
    status: 'ok',
    title: 'Kopstuk Instansi (Pasal 43)',
    detail: 'Maksimal 3 baris & ≤ 41 ketukan/baris terpenuhi.',
  };
}

function checkLampiranFormat(lampiran: string): PerkapCheckItem {
  const val = lampiran.trim();
  if (!val || val === '-') {
    return {
      id: 'lampiran',
      status: 'ok',
      title: 'Penulisan Lampiran',
      detail: 'Lampiran nihil ("-").',
    };
  }

  const m = val.match(/^(\d+)\s+([a-zA-Z]+)$/);
  if (m) {
    const num = Number(m[1]);
    if (SINGLE_WORD_NUMBERS[num]) {
      return {
        id: 'lampiran',
        status: 'warn',
        title: 'Penulisan Lampiran',
        detail: `Jumlah 1 kata ("${num}") menurut Perkap 1/2023 ditulis huruf kecil: "${SINGLE_WORD_NUMBERS[num]} ${m[2].toLowerCase()}".`,
      };
    }
    if (m[2] !== m[2].toLowerCase()) {
      return {
        id: 'lampiran',
        status: 'warn',
        title: 'Penulisan Lampiran',
        detail: `Satuan lampiran ditulis huruf kecil, mis. "${num} ${m[2].toLowerCase()}".`,
      };
    }
  }

  return {
    id: 'lampiran',
    status: 'ok',
    title: 'Penulisan Lampiran',
    detail: `"${val}" sesuai aturan 1 kata huruf kecil / ≥2 kata angka.`,
  };
}

function checkTajukJabatan(opts: {
  signerDelegation?: SignerDelegationMode;
  signerSuperiorTitle?: string;
  signerMiddleTitle?: string;
  signerTitle: string;
}): PerkapCheckItem {
  const mode = opts.signerDelegation ?? 'NONE';
  const mainRaw = opts.signerTitle.trim();

  if (!mainRaw) {
    return {
      id: 'tajuk_jabatan',
      status: 'warn',
      title: 'Jabatan Penandatangan (Maks. 48 Ketukan)',
      detail: 'Nama jabatan penandatangan pada tajuk tanda tangan wajib diisi.',
    };
  }

  if (mode === 'AN' && !opts.signerSuperiorTitle?.trim()) {
    return {
      id: 'tajuk_jabatan',
      status: 'warn',
      title: 'Jabatan Penandatangan (Pasal 88)',
      detail: 'Mode "a.n." mewajibkan pengisian Jabatan Pemberi Wewenang di atasnya.',
    };
  }

  if (
    mode === 'AN_UB' &&
    (!opts.signerSuperiorTitle?.trim() || !opts.signerMiddleTitle?.trim())
  ) {
    return {
      id: 'tajuk_jabatan',
      status: 'warn',
      title: 'Jabatan Penandatangan (Pasal 88)',
      detail:
        'Mode "a.n. + u.b." mewajibkan Jabatan Pemberi Wewenang dan Jabatan Perantara (di atas u.b.).',
    };
  }

  // Cek huruf kapital pada bagian jabatan (selain prefiks a.n., u.b., Plt., Plh.)
  const linesToCheck = buildTajukTitleLines(opts);
  const nonUpperLine = linesToCheck.find((line) => {
    if (line.isUbMarker) return false;
    const withoutPrefix = line.text.replace(/^(a\.n\.|Plt\.|Plh\.|PS)\s+/, '');
    return /[a-z]/.test(withoutPrefix);
  });

  if (nonUpperLine) {
    return {
      id: 'tajuk_jabatan',
      status: 'warn',
      title: 'Jabatan Penandatangan (Huruf Kapital)',
      detail: `Nama jabatan pada tajuk tanda tangan wajib HURUF KAPITAL: "${nonUpperLine.text}".`,
    };
  }

  const over48 = linesToCheck.find(
    (line) => line.text.length > PERKAP_RULES_SUMMARY.tajukMaxChars
  );
  if (over48) {
    return {
      id: 'tajuk_jabatan',
      status: 'warn',
      title: 'Batas 48 Ketukan Jabatan Penandatangan',
      detail: `Baris "${over48.text}" (${over48.text.length} ketukan) melebihi 48 ketukan. Singkat memakai singkatan resmi Polri.`,
    };
  }

  return {
    id: 'tajuk_jabatan',
    status: 'ok',
    title: 'Jabatan Penandatangan (≤ 48 Ketukan)',
    detail: `Huruf kapital simetris, ${mainRaw.length}/48 ketukan${mode !== 'NONE' ? `, delegasi ${mode === 'AN' ? 'a.n.' : mode === 'AN_UB' ? 'a.n. + u.b.' : mode === 'PLT' ? 'Plt.' : mode === 'PLH' ? 'Plh.' : 'PS'}` : ''}.`,
  };
}

function checkNamaPejabat(signerName: string): PerkapCheckItem {
  const trimmed = signerName.trim();
  if (!trimmed) {
    return {
      id: 'nama_pejabat',
      status: 'warn',
      title: 'Nama Pejabat & Gelar Akademik',
      detail: 'Nama pejabat penandatangan belum diisi.',
    };
  }

  const commaParts = trimmed.split(',').map((p) => p.trim());
  const baseName = commaParts[0] ?? '';
  const baseTokens = baseName.split(/\s+/);
  const hasLowerInPersonName = baseTokens.some((tok, idx) => {
    const key = tok.replace(/\./g, '').toUpperCase();
    if (idx < 2 && PREFIX_TITLE_KEYS.has(key) && tok.includes('.')) {
      return false;
    }
    return /[a-z]/.test(tok);
  });

  if (hasLowerInPersonName) {
    return {
      id: 'nama_pejabat',
      status: 'warn',
      title: 'Nama Pejabat & Gelar Akademik',
      detail:
        'Nama lengkap pejabat ditulis HURUF KAPITAL dan bergaris bawah; hanya gelar akademik yang memakai huruf kecil sesuai EYD (mis. Dr., S.H., M.H.).',
    };
  }

  const unformattedDegree = trimmed
    .split(/[,\s]+/)
    .some((tok) => /^(SH|MH|SIK|MM|DR\.?)$/i.test(tok) && !/^(Dr\.)$/.test(tok));

  if (unformattedDegree) {
    return {
      id: 'nama_pejabat',
      status: 'warn',
      title: 'Nama Pejabat & Gelar Akademik',
      detail:
        'Penulisan gelar akademik disarankan sesuai kaidah EYD (mis. S.H., M.H., S.I.K., Dr.).',
    };
  }

  return {
    id: 'nama_pejabat',
    status: 'ok',
    title: 'Nama Pejabat & Gelar Akademik',
    detail: 'Nama kapital bergaris bawah & gelar akademik sesuai kaidah Perkap 1/2023.',
  };
}

function checkPangkatDanNrp(signerRankNrp: string): PerkapCheckItem {
  const val = signerRankNrp.trim();
  if (!val) {
    return {
      id: 'pangkat_nrp',
      status: 'warn',
      title: 'Pangkat Lengkap & NRP/NIP',
      detail: 'Pangkat pejabat penandatangan belum diisi.',
    };
  }

  if (/NRP\s+NRP/i.test(val) || /N\.R\.P|NRP\./i.test(val)) {
    return {
      id: 'pangkat_nrp',
      status: 'warn',
      title: 'Pangkat Lengkap & NRP/NIP',
      detail:
        'Penulisan NRP harus kapital tanpa titik dan tidak ganda (contoh: KOMISARIS POLISI NRP 73020406).',
    };
  }

  if (/[a-z]/.test(val)) {
    return {
      id: 'pangkat_nrp',
      status: 'warn',
      title: 'Pangkat Lengkap & NRP/NIP',
      detail: 'Pangkat dan NRP pada tajuk tanda tangan ditulis HURUF KAPITAL seluruhnya.',
    };
  }

  const upper = val.toUpperCase();
  const hasAbbrev = ABBREVIATED_RANK_TOKENS.some((abbr) =>
    new RegExp(`\\b${abbr}\\b`).test(upper)
  );
  if (hasAbbrev) {
    return {
      id: 'pangkat_nrp',
      status: 'warn',
      title: 'Pangkat Tidak Disingkat (Perkap 1/2023)',
      detail:
        'Pada tajuk tanda tangan, pangkat TIDAK boleh disingkat (mis. KOMPOL → KOMISARIS POLISI, IPTU → INSPEKTUR POLISI SATU).',
    };
  }

  const pati = isPatiRank(upper);
  const hasNrp = /\b(NRP|NIP)\s+\d+/i.test(upper);

  if (pati && hasNrp) {
    return {
      id: 'pangkat_nrp',
      status: 'warn',
      title: 'Pangkat Pati Tanpa NRP (Perkap 1/2023)',
      detail:
        'Khusus Perwira Tinggi (Pati) Polri, penulisan pangkat pada tajuk tanda tangan TANPA NRP.',
    };
  }

  if (!pati && !hasNrp) {
    return {
      id: 'pangkat_nrp',
      status: 'warn',
      title: 'Pangkat Lengkap & NRP/NIP',
      detail:
        'Non-Pati wajib mencantumkan pangkat lengkap tidak disingkat diikuti NRP/NIP tanpa titik (mis. KOMISARIS POLISI NRP 73020406).',
    };
  }

  return {
    id: 'pangkat_nrp',
    status: 'ok',
    title: pati ? 'Pangkat Pati (Tanpa NRP)' : 'Pangkat Lengkap & NRP',
    detail: pati
      ? 'Pangkat Pati ditulis lengkap huruf kapital tanpa NRP sesuai Perkap 1/2023.'
      : 'Pangkat lengkap (tidak disingkat), huruf kapital, dan NRP tanpa titik terpenuhi.',
  };
}

function checkMarginDanHuruf(fontFamily?: SuratFontFamily): PerkapCheckItem {
  const activeFont: SuratFontFamily =
    fontFamily === 'Arial' ? 'Arial' : 'Arial Narrow';
  return {
    id: 'margin_font',
    status: 'ok',
    title: 'Margin & Jenis Huruf (Pasal 54)',
    detail: `Atas 2 cm (2 baris di bawah kop), Bawah 3 cm (min. 1,5 cm penyambung/klasifikasi), Kiri 3 cm, Kanan 1,5 cm · ${activeFont} 12 pt.`,
  };
}

export function validateSprinPerkap2023(
  data: SuratPerintahData
): PerkapCheckItem[] {
  const items: PerkapCheckItem[] = [];

  items.push(checkMarginDanHuruf(data.fontFamily));
  items.push(checkKopLines([data.kopLine1, data.kopLine2, data.kopLine3]));

  const hasSprinNomor = data.nomor.trim().toLowerCase().startsWith('sprin/');
  items.push({
    id: 'nomor',
    status: hasSprinNomor ? 'ok' : 'warn',
    title: 'Penomoran Surat Perintah',
    detail: hasSprinNomor
      ? 'Diawali kode baku "Sprin/...".'
      : 'Nomor Surat Perintah menurut Perkap 1/2023 diawali "Sprin/...".',
  });

  const count = data.personnelRows.length;
  const inlineMode = Boolean(data.useInlineKepadaIfFiveOrLess) && count <= 5;
  if (count > 5 && data.useInlineKepadaIfFiveOrLess) {
    items.push({
      id: 'kepada',
      status: 'warn',
      title: 'Batas 5 Personel pada Pokok Sprin',
      detail: `Personel berjumlah ${count} orang (> 5), wajib dicantumkan dalam Lampiran tersendiri.`,
    });
  } else if (count <= 5 && count > 0) {
    items.push({
      id: 'kepada',
      status: 'ok',
      title: 'Kepada (≤ 5 Personel)',
      detail: inlineMode
        ? `${count} personel dicantumkan langsung (Pangkat, Nama, NRP bergaris pemisah + Jabatan).`
        : `${count} personel ditampilkan di Lampiran (bisa juga langsung di pokok karena ≤ 5).`,
    });
  } else {
    items.push({
      id: 'kepada',
      status: count > 0 ? 'ok' : 'warn',
      title: 'Lampiran Personel (> 5 Personel)',
      detail:
        count > 0
          ? `${count} personel (> 5) otomatis masuk ke Lampiran terpisah sesuai Perkap 1/2023.`
          : 'Belum ada personel dipilih pada Surat Perintah.',
    });
  }

  items.push(
    checkTajukJabatan({
      signerDelegation: data.signerDelegation,
      signerSuperiorTitle: data.signerSuperiorTitle,
      signerMiddleTitle: data.signerMiddleTitle,
      signerTitle: data.signerTitle,
    })
  );
  items.push(checkNamaPejabat(data.signerName));
  items.push(checkPangkatDanNrp(data.signerRankNrp));

  const tembusanWithDot = data.tembusan.some((t) => /\.\s*$/.test(t.trim()));
  items.push({
    id: 'tembusan',
    status: tembusanWithDot ? 'warn' : 'ok',
    title: 'Tembusan (Daftar Jabatan)',
    detail: tembusanWithDot
      ? 'Daftar jabatan pada Tembusan menurut Perkap 1/2023 ditulis tanpa tanda titik (.) di akhir.'
      : 'Daftar jabatan tembusan tanpa tanda titik & tanpa garis penutup sudah sesuai.',
  });

  return items;
}

export function validateSuratBiasaPerkap2023(
  data: SuratBiasaData
): PerkapCheckItem[] {
  const items: PerkapCheckItem[] = [];

  items.push(checkMarginDanHuruf(data.fontFamily));
  items.push(checkKopLines([data.kopLine1, data.kopLine2, data.kopLine3]));

  const hasAddress = data.kopAddress.trim().length > 0;
  items.push({
    id: 'kop_addr',
    status: hasAddress ? 'ok' : 'warn',
    title: 'Alamat & Kode Pos Kop Surat (Pasal 43)',
    detail: hasAddress
      ? 'Kopstuk di bawah lambang Tribrata hitam dilengkapi alamat jalan & kode pos.'
      : 'Kop Surat Biasa wajib mencantumkan alamat jalan dan kode pos dengan garis penutup.',
  });

  const validKlas = PERKAP_KLASIFIKASI_OPTIONS.some(
    (k) => k.toLowerCase() === data.klasifikasi.trim().toLowerCase()
  );
  items.push({
    id: 'klasifikasi',
    status: validKlas ? 'ok' : 'warn',
    title: 'Klasifikasi Keamanan (Perkap 1/2023)',
    detail: validKlas
      ? `Menggunakan klasifikasi resmi "${data.klasifikasi}".`
      : 'Gunakan salah satu klasifikasi Perkap 1/2023: Biasa, Terbatas, Rahasia, atau Sangat Rahasia.',
  });

  items.push(checkLampiranFormat(data.lampiran));

  const halText = data.perihal.trim();
  const halOkDot = halText.endsWith('.');
  const halOkLen = halText.length > 0 && halText.length <= 135;
  items.push({
    id: 'hal',
    status: halOkDot && halOkLen ? 'ok' : 'warn',
    title: 'Istilah "Hal" (Pengganti "Perihal")',
    detail:
      halOkDot && halOkLen
        ? 'Menggunakan label "Hal", ringkas (≤ 3 baris), dan diakhiri tanda titik (.).'
        : !halOkDot
          ? 'Kalimat "Hal" menurut Perkap 1/2023 diakhiri tanda baca titik (.).'
          : 'Panjang kalimat "Hal" disarankan maksimal 3 baris dan tidak melebihi kopstuk.',
  });

  const kepadaOk = data.kepadaYth.trim().length > 0;
  const upBadCase = data.upText.trim().length > 0 && /^Up\./.test(data.upText.trim());
  items.push({
    id: 'kepada_yth',
    status: kepadaOk && !upBadCase ? 'ok' : 'warn',
    title: 'Alamat Jabatan Tujuan (Kepada Yth. & u.p.)',
    detail: !kepadaOk
      ? 'Jabatan tujuan pada "Kepada Yth." belum diisi.'
      : upBadCase
        ? 'Singkatan untuk perhatian ditulis huruf kecil bertitik ("u.p."), bukan "Up.".'
        : 'Jabatan tujuan tanpa garis penutup & format u.p. sesuai Perkap 1/2023.',
  });

  items.push(
    checkTajukJabatan({
      signerDelegation: data.signerDelegation,
      signerSuperiorTitle: data.signerSuperiorTitle,
      signerMiddleTitle: data.signerMiddleTitle,
      signerTitle: data.signerTitle,
    })
  );
  items.push(checkNamaPejabat(data.signerName));
  items.push(checkPangkatDanNrp(data.signerRankNrp));

  const tembusanWithDot = data.tembusan.some((t) => /\.\s*$/.test(t.trim()));
  items.push({
    id: 'tembusan',
    status: tembusanWithDot ? 'warn' : 'ok',
    title: 'Tembusan (Daftar Jabatan)',
    detail: tembusanWithDot
      ? 'Daftar jabatan pada Tembusan menurut Perkap 1/2023 tidak diakhiri tanda titik (.).'
      : 'Daftar jabatan tembusan tanpa tanda titik & tanpa garis penutup sudah sesuai.',
  });

  return items;
}
