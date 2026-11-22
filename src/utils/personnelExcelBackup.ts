import * as XLSX from 'xlsx-js-style';
import {
  DEFAULT_ORG_HEADER,
  DEFAULT_PAWAS_ANCHOR,
  UNIT_META,
} from '../data/polriOktober2026';
import {
  CycleType,
  PawasAnchor,
  Personnel,
  RosterBackupPayload,
  RosterOrgHeader,
  ShiftOverrides,
  UnitKey,
} from '../types/polriRoster';
import { DEFAULT_UNIT_ORDER, getOrderedUnitMeta } from './continuousRoster';

export function inferCycleForUnit(unit: UnitKey): {
  cycleType: CycleType;
  cycleLength: number;
} {
  if (unit === 'PAWAS') return { cycleType: 'INTERVAL_X', cycleLength: 6 };
  if (unit === 'BHABIN') return { cycleType: 'INTERVAL_X', cycleLength: 10 };
  if (unit === 'SAMAPTA' || unit === 'LANTAS' || unit === 'SPK') {
    return { cycleType: 'CYCLE_SML', cycleLength: 3 };
  }
  if (unit === 'INTEL') return { cycleType: 'CYCLE_INTEL', cycleLength: 4 };
  if (unit === 'RESKRIM') return { cycleType: 'CYCLE_RESKRIM', cycleLength: 3 };
  return { cycleType: 'NONE', cycleLength: 0 };
}

function normalizeUnitKey(raw: string): UnitKey {
  const cleaned = raw.trim().toUpperCase().replace(/[\s-]+/g, '_');
  const direct = UNIT_META.find(
    (u) =>
      u.key === cleaned ||
      u.label.toUpperCase().replace(/[\s-]+/g, '_') === cleaned
  );
  if (direct) return direct.key;

  if (cleaned.includes('PIMPIN') || cleaned.includes('KAPOLSEK')) return 'PIMPINAN';
  if (cleaned.includes('PAWAS')) return 'PAWAS';
  if (cleaned.includes('SAMAPTA') || cleaned.includes('SABHARA')) return 'SAMAPTA';
  if (cleaned.includes('LANTAS')) return 'LANTAS';
  if (cleaned.includes('BHABIN')) return 'BHABIN';
  if (cleaned.includes('INTEL')) return 'INTEL';
  if (cleaned.includes('RESKRIM')) return 'RESKRIM';
  if (cleaned.includes('STANBY') || cleaned.includes('STANDBY')) return 'STANBY';
  if (cleaned.includes('SPK')) return 'SPK';
  if (cleaned.includes('BANK') || cleaned.includes('OBVIT')) return 'JAGA_BANK';
  if (cleaned.includes('SIUM')) return 'SIUM';
  return 'SAMAPTA';
}

function normalizeCycleType(raw: string, fallbackUnit: UnitKey): {
  cycleType: CycleType;
  cycleLength: number;
} {
  const cleaned = raw.trim().toUpperCase();
  if (!cleaned) return inferCycleForUnit(fallbackUnit);
  if (cleaned === 'NONE' || cleaned.includes('NON') || cleaned.includes('JAM DINAS') || cleaned.includes('STAFF')) {
    return { cycleType: 'NONE', cycleLength: 0 };
  }
  if (cleaned === 'INTERVAL_X' || cleaned.includes('24J') || cleaned === 'X') {
    return {
      cycleType: 'INTERVAL_X',
      cycleLength: fallbackUnit === 'BHABIN' ? 10 : 6,
    };
  }
  if (cleaned === 'CYCLE_SML' || cleaned.includes('SML') || cleaned.includes('3 REGU')) {
    return { cycleType: 'CYCLE_SML', cycleLength: 3 };
  }
  if (cleaned === 'CYCLE_INTEL' || cleaned.includes('INTEL') || cleaned.includes('C1')) {
    return { cycleType: 'CYCLE_INTEL', cycleLength: 4 };
  }
  if (cleaned === 'CYCLE_RESKRIM' || cleaned.includes('RESKRIM') || cleaned.includes('C-P-L')) {
    return { cycleType: 'CYCLE_RESKRIM', cycleLength: 3 };
  }
  return inferCycleForUnit(fallbackUnit);
}

export function buildPersonnelExcelBytes(
  header: RosterOrgHeader,
  personnel: Personnel[],
  unitOrder: UnitKey[],
  templateOnly: boolean
): Uint8Array {
  const xlsxApi =
    (XLSX as unknown as { default?: typeof XLSX }).default ?? XLSX;

  const borderThin: NonNullable<XLSX.CellStyle['border']> = {
    top: { style: 'thin', color: { rgb: 'CBD5E1' } },
    bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
    left: { style: 'thin', color: { rgb: 'CBD5E1' } },
    right: { style: 'thin', color: { rgb: 'CBD5E1' } },
  };

  const titleFont: NonNullable<XLSX.CellStyle['font']> = {
    name: 'Arial',
    sz: 11,
    bold: true,
    color: { rgb: '0F172A' },
  };
  const headerFont: NonNullable<XLSX.CellStyle['font']> = {
    name: 'Arial',
    sz: 10,
    bold: true,
    color: { rgb: 'FFFFFF' },
  };
  const bodyFont: NonNullable<XLSX.CellStyle['font']> = {
    name: 'Arial',
    sz: 10,
    color: { rgb: '0F172A' },
  };

  const ws: XLSX.WorkSheet = {};
  const setCell = (
    r: number,
    c: number,
    v: string | number,
    t: 's' | 'n',
    s?: XLSX.CellStyle
  ) => {
    const addr = xlsxApi.utils.encode_cell({ r, c });
    ws[addr] = { v, t, s };
  };

  const orderedUnits = getOrderedUnitMeta(unitOrder);
  const unitRank = new Map(orderedUnits.map((u, idx) => [u.key, idx]));

  const rowsSource: Personnel[] = templateOnly
    ? [
        {
          id: 'contoh_1',
          unit: 'SAMAPTA',
          unitNo: 1,
          name: 'BUDI SANTOSO',
          pangkat: 'AIPDA',
          nrp: '82040512',
          jabatan: 'PS. PANIT SAMAPTA',
          ket: '',
          cycleType: 'CYCLE_SML',
          cycleLength: 3,
          phaseOnOct31: 0,
          highlightColor: 'none',
          dutyPaused: false,
        },
        {
          id: 'contoh_2',
          unit: 'PAWAS',
          unitNo: 1,
          name: 'AGUS PRASETYO, S.H.',
          pangkat: 'IPTU',
          nrp: '76080321',
          jabatan: 'KANIT BINMAS',
          ket: '',
          cycleType: 'INTERVAL_X',
          cycleLength: 6,
          phaseOnOct31: 0,
          highlightColor: 'none',
          dutyPaused: false,
        },
      ]
    : [...personnel].sort((a, b) => {
        const ra = unitRank.get(a.unit) ?? 999;
        const rb = unitRank.get(b.unit) ?? 999;
        if (ra !== rb) return ra - rb;
        return a.unitNo - b.unitNo;
      });

  const toCap = (v?: string) => (v ?? '').toUpperCase();

  // Kop / Title rows
  setCell(
    0,
    0,
    `${toCap(header.line1)} — ${toCap(header.line2)} (${toCap(header.line3)})`,
    's',
    { font: titleFont, alignment: { horizontal: 'left', vertical: 'center' } }
  );
  setCell(
    1,
    0,
    templateOnly
      ? 'FORMAT TEMPLATE INPUT DATA PERSONEL (ISI MULAI BARIS 4, LIHAT SHEET PANDUAN UNTUK DAFTAR UNIT & POLA)'
      : `DATA PERSONEL & KONFIGURASI PIKET (${rowsSource.length} PERSONEL)`,
    's',
    {
      font: { name: 'Arial', sz: 9, italic: true, color: { rgb: '475569' } },
      alignment: { horizontal: 'left', vertical: 'center' },
    }
  );

  const columns = [
    'UNIT',
    'NO',
    'NAMA',
    'PANGKAT',
    'NRP',
    'JABATAN',
    'KETERANGAN',
    'POLA ROTASI',
    'INTERVAL HARI',
    'STATUS PIKET',
  ];

  const headerStyle: XLSX.CellStyle = {
    font: headerFont,
    fill: { fgColor: { rgb: '1E293B' } },
    border: borderThin,
    alignment: { horizontal: 'center', vertical: 'center' },
  };

  columns.forEach((col, cIdx) => {
    setCell(2, cIdx, col, 's', headerStyle);
  });

  const centerStyle: XLSX.CellStyle = {
    font: bodyFont,
    border: borderThin,
    alignment: { horizontal: 'center', vertical: 'center' },
  };
  const leftStyle: XLSX.CellStyle = {
    font: bodyFont,
    border: borderThin,
    alignment: { horizontal: 'left', vertical: 'center' },
  };
  const nrpStyle: XLSX.CellStyle = {
    font: bodyFont,
    border: borderThin,
    alignment: { horizontal: 'center', vertical: 'center' },
    numFmt: '@',
  };

  rowsSource.forEach((p, idx) => {
    const r = 3 + idx;
    setCell(r, 0, toCap(p.unit), 's', centerStyle);
    setCell(r, 1, p.unitNo, 'n', centerStyle);
    setCell(r, 2, toCap(p.name), 's', leftStyle);
    setCell(r, 3, toCap(p.pangkat), 's', centerStyle);
    setCell(r, 4, toCap(p.nrp), 's', nrpStyle);
    setCell(r, 5, toCap(p.jabatan), 's', leftStyle);
    setCell(r, 6, toCap(p.ket), 's', leftStyle);
    setCell(r, 7, toCap(p.cycleType), 's', centerStyle);
    setCell(r, 8, p.cycleLength || 0, 'n', centerStyle);
    setCell(r, 9, p.dutyPaused ? 'TIDAK PIKET' : 'AKTIF', 's', centerStyle);
  });

  const lastRow = 2 + rowsSource.length;
  ws['!ref'] = xlsxApi.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: Math.max(3, lastRow), c: columns.length - 1 },
  });
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: columns.length - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: columns.length - 1 } },
  ];
  ws['!cols'] = [
    { wch: 13 }, // UNIT
    { wch: 6 },  // NO
    { wch: 30 }, // NAMA
    { wch: 12 }, // PANGKAT
    { wch: 14 }, // NRP
    { wch: 26 }, // JABATAN
    { wch: 22 }, // KETERANGAN
    { wch: 16 }, // POLA ROTASI
    { wch: 14 }, // INTERVAL HARI
    { wch: 14 }, // STATUS PIKET
  ];
  ws['!rows'] = [{ hpt: 22 }, { hpt: 18 }, { hpt: 24 }];

  // Sheet 2: Panduan Pengisian
  const guideWs: XLSX.WorkSheet = {};
  const setGuide = (
    r: number,
    c: number,
    v: string,
    s?: XLSX.CellStyle
  ) => {
    const addr = xlsxApi.utils.encode_cell({ r, c });
    guideWs[addr] = { v, t: 's', s };
  };

  setGuide(0, 0, 'PANDUAN PENGISIAN FORMAT EXCEL DATA PERSONEL', {
    font: titleFont,
  });
  setGuide(2, 0, 'KODE UNIT', headerStyle);
  setGuide(2, 1, 'NAMA SATUAN', headerStyle);
  setGuide(2, 2, 'POLA ROTASI DEFAULT', headerStyle);

  UNIT_META.forEach((u, idx) => {
    const r = 3 + idx;
    const def = inferCycleForUnit(u.key);
    setGuide(r, 0, toCap(u.key), centerStyle);
    setGuide(r, 1, toCap(u.label), leftStyle);
    setGuide(r, 2, toCap(def.cycleType), centerStyle);
  });

  const cycleStartRow = 3 + UNIT_META.length + 2;
  setGuide(cycleStartRow, 0, 'KODE POLA ROTASI', headerStyle);
  setGuide(cycleStartRow, 1, 'KETERANGAN', headerStyle);
  const cycleGuideRows: [CycleType, string][] = [
    ['NONE', 'JAM DINAS / NON-SHIFT (PIMPINAN, STANBY, JAGA BANK, SIUM)'],
    ['INTERVAL_X', 'PIKET 24 JAM BERGILIRAN SETIAP N HARI (PAWAS, BHABIN)'],
    ['CYCLE_SML', 'SHIFT 3 REGU: SIANG -> MALAM -> LEPAS (SAMAPTA, LANTAS, SPK)'],
    ['CYCLE_INTEL', 'SHIFT 4 HARI INTEL: C1 -> C2 -> P -> L'],
    ['CYCLE_RESKRIM', 'SHIFT 3 TIM RESKRIM: C -> P -> L'],
  ];
  cycleGuideRows.forEach(([code, desc], idx) => {
    const r = cycleStartRow + 1 + idx;
    setGuide(r, 0, toCap(code), centerStyle);
    setGuide(r, 1, toCap(desc), leftStyle);
  });

  guideWs['!ref'] = xlsxApi.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: cycleStartRow + cycleGuideRows.length, c: 2 },
  });
  guideWs['!cols'] = [{ wch: 20 }, { wch: 46 }, { wch: 24 }];

  const wb = xlsxApi.utils.book_new();
  xlsxApi.utils.book_append_sheet(wb, ws, 'DATA PERSONEL');
  xlsxApi.utils.book_append_sheet(wb, guideWs, 'PANDUAN UNIT & POLA');

  const rawOut = xlsxApi.write(wb, {
    bookType: 'xlsx',
    type: 'array',
  }) as ArrayBuffer | Uint8Array;

  return rawOut instanceof Uint8Array ? rawOut : new Uint8Array(rawOut);
}

export interface ParsedExcelPersonnelResult {
  items: Omit<Personnel, 'id'>[];
  skippedRows: number;
}

export function parsePersonnelExcelBuffer(
  buffer: ArrayBuffer
): ParsedExcelPersonnelResult {
  const xlsxApi =
    (XLSX as unknown as { default?: typeof XLSX }).default ?? XLSX;
  const wb = xlsxApi.read(buffer, { type: 'array' });
  const firstSheetName = wb.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('File Excel tidak memiliki lembar kerja (sheet).');
  }
  const sheet = wb.Sheets[firstSheetName];
  const matrix = xlsxApi.utils.sheet_to_json<(string | number | null)[]>(sheet, {
    header: 1,
    defval: '',
    raw: false,
  });

  if (!Array.isArray(matrix) || matrix.length === 0) {
    throw new Error('Isi lembar kerja Excel kosong.');
  }

  // Cari baris header (mengandung kolom NAMA)
  let headerRowIdx = -1;
  let colMap = {
    unit: -1,
    no: -1,
    name: -1,
    pangkat: -1,
    nrp: -1,
    jabatan: -1,
    ket: -1,
    cycleType: -1,
    cycleLength: -1,
    status: -1,
  };

  for (let r = 0; r < Math.min(matrix.length, 15); r++) {
    const row = matrix[r] ?? [];
    const normalizedCells = row.map((c) => String(c ?? '').trim().toUpperCase());
    const nameIdx = normalizedCells.findIndex(
      (c) => c === 'NAMA' || c === 'NAMA LENGKAP' || c === 'NAMA PERSONEL'
    );
    if (nameIdx !== -1) {
      headerRowIdx = r;
      colMap = {
        unit: normalizedCells.findIndex((c) => c === 'UNIT' || c === 'SATUAN'),
        no: normalizedCells.findIndex((c) => c === 'NO' || c === 'NO URUT'),
        name: nameIdx,
        pangkat: normalizedCells.findIndex((c) => c === 'PANGKAT' || c === 'PKT'),
        nrp: normalizedCells.findIndex((c) => c === 'NRP' || c === 'NRP / NIP' || c === 'NIP'),
        jabatan: normalizedCells.findIndex((c) => c === 'JABATAN' || c === 'JAB'),
        ket: normalizedCells.findIndex((c) => c === 'KETERANGAN' || c === 'KET'),
        cycleType: normalizedCells.findIndex((c) => c === 'POLA ROTASI' || c === 'POLA' || c === 'CYCLE'),
        cycleLength: normalizedCells.findIndex((c) => c === 'INTERVAL HARI' || c === 'INTERVAL'),
        status: normalizedCells.findIndex((c) => c === 'STATUS PIKET' || c === 'STATUS'),
      };
      break;
    }
  }

  // Jika tidak ada baris header standar, asumsikan urutan kolom standar: UNIT, NO, NAMA, PANGKAT, NRP, JABATAN, KET
  const startRow = headerRowIdx >= 0 ? headerRowIdx + 1 : 0;
  if (headerRowIdx === -1) {
    colMap = {
      unit: 0,
      no: 1,
      name: 2,
      pangkat: 3,
      nrp: 4,
      jabatan: 5,
      ket: 6,
      cycleType: 7,
      cycleLength: 8,
      status: 9,
    };
  }

  const items: Omit<Personnel, 'id'>[] = [];
  const unitCounter = new Map<UnitKey, number>();
  let skippedRows = 0;

  for (let r = startRow; r < matrix.length; r++) {
    const row = matrix[r] ?? [];
    const getCell = (idx: number) =>
      idx >= 0 && idx < row.length ? String(row[idx] ?? '').trim() : '';

    const rawName = getCell(colMap.name);
    if (!rawName || rawName.toUpperCase() === 'NAMA') {
      if (row.some((c) => String(c ?? '').trim() !== '')) {
        skippedRows += 1;
      }
      continue;
    }

    const rawUnit = getCell(colMap.unit);
    const unit = rawUnit ? normalizeUnitKey(rawUnit) : 'SAMAPTA';
    const nextUnitNo = (unitCounter.get(unit) ?? 0) + 1;
    const parsedNo = Number(getCell(colMap.no));
    const unitNo = Number.isFinite(parsedNo) && parsedNo > 0 ? Math.floor(parsedNo) : nextUnitNo;
    unitCounter.set(unit, Math.max(nextUnitNo, unitNo));

    const rawCycle = getCell(colMap.cycleType);
    const inferred = normalizeCycleType(rawCycle, unit);
    const parsedInterval = Number(getCell(colMap.cycleLength));
    const cycleLength =
      inferred.cycleType === 'INTERVAL_X' &&
      Number.isFinite(parsedInterval) &&
      parsedInterval >= 2
        ? Math.floor(parsedInterval)
        : inferred.cycleLength;

    const rawStatus = getCell(colMap.status).toUpperCase();
    const dutyPaused =
      rawStatus.includes('TIDAK') || rawStatus.includes('PAUSE') || rawStatus.includes('OFF');

    items.push({
      unit,
      unitNo,
      name: rawName.toUpperCase(),
      pangkat: getCell(colMap.pangkat).toUpperCase() || 'BRIPKA',
      nrp: getCell(colMap.nrp),
      jabatan: getCell(colMap.jabatan).toUpperCase() || 'BANIT',
      ket: getCell(colMap.ket).toUpperCase(),
      cycleType: inferred.cycleType,
      cycleLength,
      phaseOnOct31: 0,
      highlightColor: dutyPaused ? 'red' : 'none',
      dutyPaused,
    });
  }

  if (items.length === 0) {
    throw new Error(
      'Tidak ada baris data personel yang valid ditemukan di file Excel. Pastikan kolom NAMA terisi.'
    );
  }

  return { items, skippedRows };
}

export function parseBulkManualLines(
  rawText: string,
  defaultUnit: UnitKey
): Omit<Personnel, 'id'>[] {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const results: Omit<Personnel, 'id'>[] = [];
  const unitCounter = new Map<UnitKey, number>();

  for (const line of lines) {
    // Support pemisah | , ; atau tab
    const sep = line.includes('|')
      ? '|'
      : line.includes('\t')
      ? '\t'
      : line.includes(';')
      ? ';'
      : null;

    const parts = sep
      ? line.split(sep).map((s) => s.trim())
      : [line];

    // Bersihkan nomor urut di depan seperti "1. " atau "1) "
    const firstPartClean = (parts[0] || '').replace(/^\d+[.)]\s+/, '').trim();
    if (!firstPartClean) continue;

    let name = firstPartClean;
    let pangkat = parts[1] || 'BRIPKA';
    let nrp = parts[2] || '';
    let jabatan = parts[3] || 'BANIT';
    let unit = parts[4] ? normalizeUnitKey(parts[4]) : defaultUnit;
    const ket = parts[5] || '';

    // Jika hanya 1 kolom namun diawali pangkat umum Polri (misal "AIPDA BUDI SANTOSO")
    if (!sep) {
      const rankMatch = firstPartClean.match(
        /^(KOMPOL|AKP|IPTU|IPDA|AIPTU|AIPDA|BRIPKA|BRIGADIR|BRIGPOL|BRIPTU|BRIPDA|PENDA|PENGATUR|JURU)\s+(.+)$/i
      );
      if (rankMatch) {
        pangkat = rankMatch[1];
        name = rankMatch[2];
      }
      unit = defaultUnit;
    }

    const nextNo = (unitCounter.get(unit) ?? 0) + 1;
    unitCounter.set(unit, nextNo);
    const { cycleType, cycleLength } = inferCycleForUnit(unit);

    results.push({
      unit,
      unitNo: nextNo,
      name: name.toUpperCase(),
      pangkat: pangkat.toUpperCase() || 'BRIPKA',
      nrp: nrp.trim(),
      jabatan: jabatan.toUpperCase() || 'BANIT',
      ket: ket.toUpperCase(),
      cycleType,
      cycleLength,
      phaseOnOct31: 0,
      highlightColor: 'none',
      dutyPaused: false,
    });
  }

  return results;
}

export interface ParsedBackupPreview {
  exportedAt?: string;
  data: RosterBackupPayload['data'];
}

export function parseBackupJsonInput(rawText: string): ParsedBackupPreview {
  const parsed = JSON.parse(rawText) as Record<string, unknown>;
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Format JSON tidak valid.');
  }

  const candidate =
    parsed.data && typeof parsed.data === 'object'
      ? (parsed.data as Record<string, unknown>)
      : parsed;

  if (!Array.isArray(candidate.personnel) || candidate.personnel.length === 0) {
    throw new Error(
      'Data personel tidak ditemukan atau kosong di file backup.'
    );
  }

  const validPersonnel = candidate.personnel.every(
    (item) =>
      item &&
      typeof item === 'object' &&
      typeof (item as Personnel).id === 'string' &&
      typeof (item as Personnel).name === 'string' &&
      typeof (item as Personnel).unit === 'string'
  );

  if (!validPersonnel) {
    throw new Error('Struktur data personel di dalam backup tidak valid.');
  }

  const headerObj =
    candidate.header && typeof candidate.header === 'object'
      ? {
          ...DEFAULT_ORG_HEADER,
          ...(candidate.header as Partial<RosterOrgHeader>),
        }
      : DEFAULT_ORG_HEADER;

  const pawasObj =
    candidate.pawasAnchor &&
    typeof candidate.pawasAnchor === 'object' &&
    typeof (candidate.pawasAnchor as PawasAnchor).dateKey === 'string'
      ? (candidate.pawasAnchor as PawasAnchor)
      : DEFAULT_PAWAS_ANCHOR;

  const unitOrderArr = Array.isArray(candidate.unitOrder)
    ? (candidate.unitOrder as UnitKey[])
    : DEFAULT_UNIT_ORDER;

  const overridesObj =
    candidate.overrides && typeof candidate.overrides === 'object'
      ? (candidate.overrides as ShiftOverrides)
      : {};

  return {
    exportedAt:
      typeof parsed.exportedAt === 'string' ? parsed.exportedAt : undefined,
    data: {
      header: headerObj,
      personnel: candidate.personnel as Personnel[],
      unitOrder: unitOrderArr,
      pawasAnchor: pawasObj,
      overrides: overridesObj,
    },
  };
}
