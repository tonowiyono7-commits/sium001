import {
  DEFAULT_PAWAS_ANCHOR,
  OCTOBER_2026_UNIT_SNAPSHOT,
  UNIT_META,
} from '../data/polriOktober2026';
import {
  PawasAnchor,
  Personnel,
  RosterOrgHeader,
  ShiftCode,
  ShiftOverrides,
  UnitKey,
} from '../types/polriRoster';

export const DEFAULT_UNIT_ORDER: UnitKey[] = UNIT_META.map((u) => u.key);

export function getOrderedUnitMeta(unitOrder?: UnitKey[]) {
  const order =
    unitOrder && unitOrder.length > 0 ? unitOrder : DEFAULT_UNIT_ORDER;
  const metaMap = new Map(UNIT_META.map((u) => [u.key, u]));
  const result: typeof UNIT_META = [];
  const seen = new Set<UnitKey>();

  for (const key of order) {
    const item = metaMap.get(key);
    if (item && !seen.has(key)) {
      result.push(item);
      seen.add(key);
    }
  }
  for (const item of UNIT_META) {
    if (!seen.has(item.key)) {
      result.push(item);
    }
  }
  return result;
}

export function shiftPersonPhase(
  person: Personnel,
  deltaDays: 1 | -1
): number {
  const len = Math.max(1, person.cycleLength);
  if (person.cycleType === 'INTERVAL_X') {
    return mod(person.phaseOnOct31 + deltaDays, len);
  }
  if (
    person.cycleType === 'CYCLE_SML' ||
    person.cycleType === 'CYCLE_INTEL' ||
    person.cycleType === 'CYCLE_RESKRIM'
  ) {
    return mod(person.phaseOnOct31 - deltaDays, len);
  }
  return person.phaseOnOct31;
}

export const MONTH_NAMES_ID = [
  'JANUARI',
  'FEBRUARI',
  'MARET',
  'APRIL',
  'MEI',
  'JUNI',
  'JULI',
  'AGUSTUS',
  'SEPTEMBER',
  'OKTOBER',
  'NOVEMBER',
  'DESEMBER',
];

export const DAY_NAMES_SHORT_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
export const DAY_NAMES_FULL_ID = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

const SML_CODES: ShiftCode[] = ['S', 'M', 'L'];
const INTEL_CODES: ShiftCode[] = ['C1', 'C2', 'P', 'L'];
const RESKRIM_CODES: ShiftCode[] = ['C', 'P', 'L'];

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

export function getDaysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function formatDateKey(year: number, monthIndex: number, day: number): string {
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

export function parseDateKeyToUtc(dateKey: string): number {
  const [y, m, d] = dateKey.split('-').map(Number);
  return Date.UTC(y, (m || 1) - 1, d || 1);
}

export function daysBetweenDateKeys(fromKey: string, toKey: string): number {
  const fromUtc = parseDateKeyToUtc(fromKey);
  const toUtc = parseDateKeyToUtc(toKey);
  return Math.round((toUtc - fromUtc) / (1000 * 60 * 60 * 24));
}

/**
 * Selisih hari kalender UTC dari tanggal acuan 31 Oktober 2026.
 */
export function daysSinceOct31(year: number, monthIndex: number, day: number): number {
  const anchorUtc = Date.UTC(2026, 9, 31);
  const targetUtc = Date.UTC(year, monthIndex, day);
  return Math.round((targetUtc - anchorUtc) / (1000 * 60 * 60 * 24));
}

export function isPersonPausedOnDate(person: Personnel, dateKey: string): boolean {
  if (!person.dutyPaused) return false;
  if (!person.pausedFromDate) return true;
  return dateKey >= person.pausedFromDate;
}

/**
 * Mengembalikan daftar personel sesuai penempatan efektif pada bulan yang sedang dilihat.
 * Khusus Oktober 2026 (sebelum perputaran November 2026), mengembalikan susunan awal Oktober 2026
 * untuk personel SAMAPTA dan JAGA BANK yang bertukar.
 */
export function getEffectivePersonnelForMonth(
  personnel: Personnel[],
  year: number,
  monthIndex: number
): Personnel[] {
  if (year === 2026 && monthIndex === 9) {
    return personnel.map((p) => {
      const snap = OCTOBER_2026_UNIT_SNAPSHOT[p.id];
      if (!snap) return p;
      return { ...p, ...snap };
    });
  }
  return personnel;
}

/**
 * Menghitung kode shift otomatis secara berkelanjutan untuk seorang personel pada tanggal tertentu.
 * - Menghormati status `dutyPaused` (sementara tidak piket)
 * - Untuk PAWAS mulai `pawasAnchor.dateKey` (14 Nov 2026), rotasi berkelanjutan otomatis hanya memutar personel PAWAS yang aktif
 *   dimulai dari `pawasAnchor.personnelId` (TEGUH SANTOSO, S.H., M.M.).
 */
export function computeAutoShift(
  person: Personnel,
  year: number,
  monthIndex: number,
  day: number,
  allPersonnel: Personnel[] = [],
  pawasAnchor: PawasAnchor = DEFAULT_PAWAS_ANCHOR
): ShiftCode {
  if (person.cycleType === 'NONE') return '';

  const dateKey = formatDateKey(year, monthIndex, day);
  if (isPersonPausedOnDate(person, dateKey)) {
    return '';
  }

  // Rotasi PAWAS berkelanjutan mulai tanggal anchor (14 Nov 2026) melewati personel yang sementara tidak piket
  if (
    person.unit === 'PAWAS' &&
    person.cycleType === 'INTERVAL_X' &&
    dateKey >= pawasAnchor.dateKey &&
    allPersonnel.length > 0
  ) {
    const activePawas = allPersonnel.filter(
      (p) =>
        p.unit === 'PAWAS' &&
        p.cycleType === 'INTERVAL_X' &&
        !isPersonPausedOnDate(p, dateKey)
    );

    if (activePawas.length === 0) return '';

    const anchorIdx = activePawas.findIndex(
      (p) => p.id === pawasAnchor.personnelId
    );
    const startIdx = anchorIdx >= 0 ? anchorIdx : 0;
    const diffDays = daysBetweenDateKeys(pawasAnchor.dateKey, dateKey);
    const activeTodayIdx = mod(startIdx + diffDays, activePawas.length);
    return activePawas[activeTodayIdx]?.id === person.id ? 'X' : '';
  }

  const offset = daysSinceOct31(year, monthIndex, day);

  if (person.cycleType === 'INTERVAL_X') {
    const len = Math.max(1, person.cycleLength);
    return mod(offset - person.phaseOnOct31, len) === 0 ? 'X' : '';
  }

  if (person.cycleType === 'CYCLE_SML') {
    if (
      person.unit === 'SAMAPTA' &&
      year === 2026 &&
      monthIndex === 9 &&
      day <= 30
    ) {
      const idx = mod(person.phaseOnOct31 + offset + 2, 3);
      return SML_CODES[idx];
    }
    const idx = mod(person.phaseOnOct31 + offset, 3);
    return SML_CODES[idx];
  }

  if (person.cycleType === 'CYCLE_INTEL') {
    const idx = mod(person.phaseOnOct31 + offset, 4);
    return INTEL_CODES[idx];
  }

  if (person.cycleType === 'CYCLE_RESKRIM') {
    const idx = mod(person.phaseOnOct31 + offset, 3);
    return RESKRIM_CODES[idx];
  }

  return '';
}

export function getEffectiveShift(
  person: Personnel,
  year: number,
  monthIndex: number,
  day: number,
  overrides: ShiftOverrides,
  allPersonnel: Personnel[] = [],
  pawasAnchor: PawasAnchor = DEFAULT_PAWAS_ANCHOR
): { code: ShiftCode; isOverridden: boolean } {
  const dateKey = formatDateKey(year, monthIndex, day);
  const overrideKey = `${person.id}__${dateKey}`;
  if (overrides[overrideKey] !== undefined) {
    return { code: overrides[overrideKey], isOverridden: true };
  }
  return {
    code: computeAutoShift(
      person,
      year,
      monthIndex,
      day,
      allPersonnel,
      pawasAnchor
    ),
    isOverridden: false,
  };
}

export function getAllowedCodesForPerson(person: Personnel): ShiftCode[] {
  switch (person.cycleType) {
    case 'INTERVAL_X':
      return ['', 'X'];
    case 'CYCLE_SML':
      return ['S', 'M', 'L', ''];
    case 'CYCLE_INTEL':
      return ['C1', 'C2', 'P', 'L', ''];
    case 'CYCLE_RESKRIM':
      return ['C', 'P', 'L', ''];
    default:
      return ['', 'X', 'S', 'M', 'L', 'P'];
  }
}

export function getShiftDescription(code: ShiftCode): string {
  switch (code) {
    case 'X':
      return 'Piket Pawas / Bhabin 24 Jam';
    case 'L':
      return 'Lepas Dinas';
    case 'S':
      return 'Piket Siang 12 Jam (08.00 s.d. 20.00)';
    case 'M':
      return 'Piket Malam 12 Jam (20.00 s.d. 08.00)';
    case 'P':
      return 'Piket Intel / Reskrim 24 Jam';
    case 'C':
      return 'Cadangan Reskrim';
    case 'C1':
      return 'Cadangan 1 Intel';
    case 'C2':
      return 'Cadangan 2 Intel';
    default:
      return 'Tidak ada kode shift';
  }
}

export function getShiftStyle(code: ShiftCode): string {
  switch (code) {
    case 'X':
      return 'bg-blue-600 text-white font-bold';
    case 'S':
      return 'bg-amber-100 text-amber-900 font-semibold';
    case 'M':
      return 'bg-slate-800 text-white font-semibold';
    case 'P':
      return 'bg-emerald-600 text-white font-bold';
    case 'C':
    case 'C1':
    case 'C2':
      return 'bg-slate-200 text-slate-800 font-medium';
    case 'L':
      return 'bg-white text-slate-400 font-normal';
    default:
      return 'bg-white text-slate-300';
  }
}

export interface WhatsAppReportOptions {
  greeting?: string;
  includeCadangan?: boolean;
  includeJabatan?: boolean;
  compact?: boolean;
  closingNote?: string;
}

export function normalizeWhatsAppPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) {
    return `62${digits.slice(1)}`;
  }
  if (digits.startsWith('62')) {
    return digits;
  }
  if (digits.length >= 7) {
    return digits;
  }
  return '';
}

export function buildWhatsAppShareUrl(text: string, phone?: string): string {
  const normalized = phone ? normalizeWhatsAppPhone(phone) : '';
  const base = normalized ? `https://wa.me/${normalized}` : 'https://wa.me/';
  return `${base}?text=${encodeURIComponent(text)}`;
}

export function formatDailyWhatsAppReport(
  header: RosterOrgHeader,
  personnel: Personnel[],
  year: number,
  monthIndex: number,
  day: number,
  overrides: ShiftOverrides,
  pawasAnchor: PawasAnchor = DEFAULT_PAWAS_ANCHOR,
  options: WhatsAppReportOptions = {}
): string {
  const dateObj = new Date(year, monthIndex, day);
  const dayName = DAY_NAMES_FULL_ID[dateObj.getDay()];
  const monthName = MONTH_NAMES_ID[monthIndex];
  const dateKey = formatDateKey(year, monthIndex, day);

  const {
    greeting = '',
    includeCadangan = true,
    includeJabatan = true,
    compact = false,
    closingNote = '',
  } = options;

  const byShift = (unitFilter: string[], targetCode: ShiftCode) =>
    personnel
      .filter((p) => unitFilter.includes(p.unit))
      .filter(
        (p) =>
          getEffectiveShift(
            p,
            year,
            monthIndex,
            day,
            overrides,
            personnel,
            pawasAnchor
          ).code === targetCode
      );

  const pawas = byShift(['PAWAS'], 'X');
  const bhabin = byShift(['BHABIN'], 'X');
  const siang = byShift(['SAMAPTA', 'LANTAS', 'SPK'], 'S');
  const malam = byShift(['SAMAPTA', 'LANTAS', 'SPK'], 'M');
  const piket24IntelRes = byShift(['INTEL', 'RESKRIM'], 'P');
  const cadangan = personnel.filter((p) => {
    const code = getEffectiveShift(
      p,
      year,
      monthIndex,
      day,
      overrides,
      personnel,
      pawasAnchor
    ).code;
    return code === 'C' || code === 'C1' || code === 'C2';
  });
  const pausedList = personnel.filter((p) => isPersonPausedOnDate(p, dateKey));

  const formatList = (items: Personnel[]) =>
    items.length === 0
      ? '  - (Tidak ada)'
      : items
          .map((p, idx) =>
            includeJabatan
              ? `  ${idx + 1}. ${p.pangkat} ${p.name} (${p.jabatan})`
              : `  ${idx + 1}. ${p.pangkat} ${p.name}`
          )
          .join('\n');

  const total24Jam = pawas.length + bhabin.length + piket24IntelRes.length;
  const totalGabunganSiang = total24Jam + siang.length;
  const totalGabunganMalam = total24Jam + malam.length;

  const lines: string[] = [];
  const trimmedGreeting = greeting.trim();
  if (trimmedGreeting) {
    lines.push(`*${trimmedGreeting}*,`);
    lines.push(
      `MOHON IJIN MELAPORKAN JADWAL PIKET HARIAN *${header.line3}* PADA:`
    );
    lines.push('');
  } else {
    lines.push(`*DAFTAR PIKET HARIAN - ${header.line3}*`);
  }

  lines.push(`Hari/Tanggal: *${dayName}, ${day} ${monthName} ${year}*`);
  lines.push('');
  lines.push(`*REKAP JUMLAH KEKUATAN PIKET:*`);
  lines.push(`- Piket 24 Jam (X & P): *${total24Jam} pers*`);
  lines.push(`- Piket Siang 12 Jam (08.00 s.d. 20.00): *${siang.length} pers*`);
  lines.push(`- Piket Malam 12 Jam (20.00 s.d. 08.00): *${malam.length} pers*`);
  lines.push(`- Gabungan 24 Jam + Siang (08.00–20.00): *${totalGabunganSiang} pers*`);
  lines.push(`- Gabungan 24 Jam + Malam (20.00–08.00): *${totalGabunganMalam} pers*`);
  lines.push('');
  lines.push('*1. PAWAS 24 JAM (X):*');
  lines.push(formatList(pawas));
  lines.push('');
  lines.push('*2. BHABINKAMTIBMAS 24 JAM (X):*');
  lines.push(formatList(bhabin));
  lines.push('');
  lines.push('*3. PIKET SIANG 12 JAM (08.00 s.d. 20.00) (S) - SPK, SAMAPTA, LANTAS:*');
  lines.push(formatList(siang));
  lines.push('');
  lines.push('*4. PIKET MALAM 12 JAM (20.00 s.d. 08.00) (M) - SPK, SAMAPTA, LANTAS:*');
  lines.push(formatList(malam));
  lines.push('');
  lines.push('*5. PIKET INTEL & RESKRIM 24 JAM (P):*');
  lines.push(formatList(piket24IntelRes));

  if (includeCadangan && !compact) {
    lines.push('');
    lines.push('*6. CADANGAN (C / C1 / C2):*');
    lines.push(formatList(cadangan));
  }

  if (pausedList.length > 0) {
    lines.push('');
    lines.push('*CATATAN (SEMENTARA TIDAK PIKET):*');
    pausedList.forEach((p, idx) => {
      lines.push(`  ${idx + 1}. ${p.pangkat} ${p.name} (${p.ket || 'Tidak piket'})`);
    });
  }

  const trimmedClosing = closingNote.trim();
  if (trimmedClosing) {
    lines.push('');
    lines.push(trimmedClosing);
  } else if (trimmedGreeting) {
    lines.push('');
    lines.push('*DUMP*');
  }

  return lines.join('\n');
}

export function formatCombinedShiftWhatsApp(
  header: RosterOrgHeader,
  title: string,
  items: { person: Personnel; code: ShiftCode }[],
  year: number,
  monthIndex: number,
  day: number,
  options: { greeting?: string; includeJabatan?: boolean; closingNote?: string } = {}
): string {
  const dateObj = new Date(year, monthIndex, day);
  const dayName = DAY_NAMES_FULL_ID[dateObj.getDay()];
  const monthName = MONTH_NAMES_ID[monthIndex];
  const { greeting = '', includeJabatan = true, closingNote = '' } = options;

  const lines: string[] = [];
  const trimmedGreeting = greeting.trim();
  if (trimmedGreeting) {
    lines.push(`*${trimmedGreeting}*,`);
    lines.push(
      `MOHON IJIN MELAPORKAN *${title.toUpperCase()} - ${header.line3}*:`
    );
    lines.push('');
  } else {
    lines.push(`*${title.toUpperCase()} - ${header.line3}*`);
  }

  lines.push(`Hari/Tanggal: *${dayName}, ${day} ${monthName} ${year}*`);
  lines.push(`Total Kekuatan: *${items.length} Personel*`);
  lines.push('');

  if (items.length === 0) {
    lines.push('- Tidak ada personel terjadwal.');
  } else {
    items.forEach(({ person, code }, idx) => {
      const detail = includeJabatan
        ? `${person.pangkat} ${person.name} · ${person.jabatan} [${code}]`
        : `${person.pangkat} ${person.name} [${code}]`;
      lines.push(`${idx + 1}. ${detail}`);
    });
  }

  const trimmedClosing = closingNote.trim();
  if (trimmedClosing) {
    lines.push('');
    lines.push(trimmedClosing);
  } else if (trimmedGreeting) {
    lines.push('');
    lines.push('*DUMP*');
  }

  return lines.join('\n');
}

export function buildMonthlyRosterCSV(
  header: RosterOrgHeader,
  personnel: Personnel[],
  year: number,
  monthIndex: number,
  overrides: ShiftOverrides,
  pawasAnchor: PawasAnchor = DEFAULT_PAWAS_ANCHOR,
  unitOrder?: UnitKey[]
): string {
  const daysInMonth = getDaysInMonth(year, monthIndex);
  const monthName = MONTH_NAMES_ID[monthIndex];
  const esc = (v: string | number) =>
    `"${String(v).toUpperCase().replace(/"/g, '""')}"`;

  const lines: string[] = [];
  lines.push(esc(header.line1));
  lines.push(esc(header.line2));
  lines.push(esc(header.line3));
  lines.push(esc(`${header.documentPrefix} ${monthName} ${year}`));
  lines.push('');

  const dayCols = Array.from({ length: daysInMonth }, (_, i) => String(i + 1));
  lines.push(
    ['NO', 'NAMA', 'PANGKAT', 'NRP', 'JABATAN', 'KET', ...dayCols]
      .map(esc)
      .join(',')
  );

  for (const unitMeta of getOrderedUnitMeta(unitOrder)) {
    const unitPeople = personnel.filter((p) => p.unit === unitMeta.key);
    if (unitPeople.length === 0) continue;

    if (unitMeta.headerLabel) {
      lines.push(esc(unitMeta.headerLabel));
    }

    for (const p of unitPeople) {
      const shifts = Array.from({ length: daysInMonth }, (_, i) => {
        const d = i + 1;
        return getEffectiveShift(
          p,
          year,
          monthIndex,
          d,
          overrides,
          personnel,
          pawasAnchor
        ).code;
      });
      lines.push(
        [p.unitNo, p.name, p.pangkat, p.nrp, p.jabatan, p.ket, ...shifts]
          .map(esc)
          .join(',')
      );
    }
  }

  return '\uFEFF' + lines.join('\r\n');
}
