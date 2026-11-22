import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  BookmarkCheck,
  Calendar,
  Check,
  Copy,
  Download,
  FileSpreadsheet,
  FolderOpen,
  History,
  Plus,
  RefreshCw,
  Send,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserPlus,
} from 'lucide-react';
import {
  PamMode,
  PamPersonEntry,
  PawasAnchor,
  Personnel,
  RosterOrgHeader,
  SavedPamRoster,
  ShiftOverrides,
  UnitKey,
} from '../types/polriRoster';
import {
  DAY_NAMES_FULL_ID,
  getEffectivePersonnelForMonth,
  getEffectiveShift,
  getOrderedUnitMeta,
  isPersonPausedOnDate,
  MONTH_NAMES_ID,
} from '../utils/continuousRoster';
import * as XLSX from 'xlsx-js-style';

const PAM_STORAGE_KEY = 'kuat_pers_pam_v1';
const MAX_SAVED_PAM_LISTS = 10;

interface PamStoredState {
  activeMode: PamMode;
  drafts: {
    AKSI: {
      dateKey: string;
      title: string;
      entries: PamPersonEntry[];
      loadedSavedId?: string;
    };
    GIAT: {
      dateKey: string;
      title: string;
      entries: PamPersonEntry[];
      loadedSavedId?: string;
    };
  };
  savedLists: SavedPamRoster[];
  waPhone: string;
}

interface DaftarPersPamViewProps {
  header: RosterOrgHeader;
  todayDateKey: string;
  personnel: Personnel[];
  unitOrder?: UnitKey[];
  pawasAnchor: PawasAnchor;
  overrides: ShiftOverrides;
}

function addDaysToDateKey(dateKey: string, delta: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(Date.UTC(y || 2026, (m || 1) - 1, (d || 1) + delta));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function parseDateKeyParts(dateKey: string): {
  year: number;
  monthIndex: number;
  day: number;
} {
  const [y, m, d] = dateKey.split('-').map(Number);
  return {
    year: y || 2026,
    monthIndex: (m || 1) - 1,
    day: d || 1,
  };
}

function formatPamDefaultTitle(mode: PamMode, dateKey: string): string {
  const { year, monthIndex, day } = parseDateKeyParts(dateKey);
  const monthShort = (MONTH_NAMES_ID[monthIndex] ?? '').slice(0, 3);
  return `DAFTAR PERS PAM ${mode} ${day} ${monthShort} ${year}`;
}

function formatIndonesianLongDate(dateKey: string): string {
  const { year, monthIndex, day } = parseDateKeyParts(dateKey);
  const dt = new Date(year, monthIndex, day);
  const dayName = DAY_NAMES_FULL_ID[dt.getDay()];
  const monthName = MONTH_NAMES_ID[monthIndex] ?? '';
  return `${dayName}, ${day} ${monthName} ${year}`;
}

function formatSavedTimestamp(iso: string): string {
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function buildAutoPamEntries(
  mode: PamMode,
  dateKey: string,
  personnel: Personnel[],
  unitOrder: UnitKey[] | undefined,
  pawasAnchor: PawasAnchor,
  overrides: ShiftOverrides
): PamPersonEntry[] {
  const { year, monthIndex, day } = parseDateKeyParts(dateKey);
  const prevDateKey = addDaysToDateKey(dateKey, -1);
  const { year: prevY, monthIndex: prevM, day: prevD } =
    parseDateKeyParts(prevDateKey);

  const monthPersonnel = getEffectivePersonnelForMonth(
    personnel,
    year,
    monthIndex
  );
  const prevMonthPersonnel = getEffectivePersonnelForMonth(
    personnel,
    prevY,
    prevM
  );

  const orderedUnits = getOrderedUnitMeta(unitOrder);
  const results: PamPersonEntry[] = [];

  for (const unitMeta of orderedUnits) {
    const unitMembers = monthPersonnel.filter((p) => p.unit === unitMeta.key);

    for (const person of unitMembers) {
      if (isPersonPausedOnDate(person, dateKey)) {
        continue;
      }

      const todayShift = getEffectiveShift(
        person,
        year,
        monthIndex,
        day,
        overrides,
        monthPersonnel,
        pawasAnchor
      ).code;

      if (mode === 'AKSI') {
        if (person.unit === 'PAWAS') {
          const prevPerson =
            prevMonthPersonnel.find((x) => x.id === person.id) ?? person;
          const yesterdayShift = getEffectiveShift(
            prevPerson,
            prevY,
            prevM,
            prevD,
            overrides,
            prevMonthPersonnel,
            pawasAnchor
          ).code;

          // Semua PAWAS masuk KECUALI PAWAS yang 1 hari sebelumnya piket (X)
          if (yesterdayShift === 'X') {
            continue;
          }

          results.push({
            id: `pam_${person.id}`,
            sourcePersonnelId: person.id,
            name: person.name,
            pangkat: person.pangkat,
            nrp: person.nrp,
            jabatan: person.jabatan,
            ket: '',
            unitLabel: person.unit,
            shiftCode: todayShift === 'X' ? 'X' : 'PAWAS',
          });
          continue;
        }

        // Non-PAWAS: harus sedang piket pada hari yang dipilih
        if (!todayShift || todayShift === 'L') {
          continue;
        }

        // Pengecualian khusus PAM AKSI:
        // Anggota SPKT, C Reskrim, dan C2 Intel tidak ikut terfilter
        if (person.unit === 'SPK') continue;
        if (person.unit === 'RESKRIM' && todayShift === 'C') continue;
        if (person.unit === 'INTEL' && todayShift === 'C2') continue;

        results.push({
          id: `pam_${person.id}`,
          sourcePersonnelId: person.id,
          name: person.name,
          pangkat: person.pangkat,
          nrp: person.nrp,
          jabatan: person.jabatan,
          ket: '',
          unitLabel: person.unit,
          shiftCode: todayShift,
        });
      } else {
        // PAM GIAT: cukup filter sesuai jadwal pada hari piket
        if (!todayShift || todayShift === 'L') {
          continue;
        }

        results.push({
          id: `pam_${person.id}`,
          sourcePersonnelId: person.id,
          name: person.name,
          pangkat: person.pangkat,
          nrp: person.nrp,
          jabatan: person.jabatan,
          ket: '',
          unitLabel: person.unit,
          shiftCode: todayShift,
        });
      }
    }
  }

  return results;
}

function buildPamXlsxBytes(
  header: RosterOrgHeader,
  docTitle: string,
  entries: PamPersonEntry[]
): Uint8Array {
  const xlsxApi =
    (XLSX as unknown as { default?: typeof XLSX }).default ?? XLSX;

  const borderThin: NonNullable<XLSX.CellStyle['border']> = {
    top: { style: 'thin', color: { rgb: '000000' } },
    bottom: { style: 'thin', color: { rgb: '000000' } },
    left: { style: 'thin', color: { rgb: '000000' } },
    right: { style: 'thin', color: { rgb: '000000' } },
  };

  const baseFont: NonNullable<XLSX.CellStyle['font']> = {
    name: 'Arial',
    sz: 11,
    color: { rgb: '000000' },
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

  const kopStyle: XLSX.CellStyle = {
    font: baseFont,
    alignment: { horizontal: 'center', vertical: 'center' },
  };

  const toCap = (v?: string) => (v ?? '').toUpperCase();

  // Baris 1-3: Kop di kolom B (indeks 1)
  setCell(0, 1, toCap(header.line1), 's', kopStyle);
  setCell(1, 1, toCap(header.line2), 's', kopStyle);
  setCell(2, 1, toCap(header.line3), 's', kopStyle);

  // Baris 5 (indeks 4): Judul di kolom B..F (merge B5:F5)
  setCell(4, 1, toCap(docTitle), 's', kopStyle);

  // Baris 7 (indeks 6): Header Tabel
  const headerTitles = ['NO', 'NAMA', 'PANGKAT', 'NRP', 'JABATAN', 'KET'];
  const headerStyle: XLSX.CellStyle = {
    font: baseFont,
    border: borderThin,
    alignment: { horizontal: 'center', vertical: 'center' },
  };
  headerTitles.forEach((label, colIdx) => {
    setCell(6, colIdx, label, 's', headerStyle);
  });

  // Baris 8+ (indeks 7+): Data Personel
  const cellCenterStyle: XLSX.CellStyle = {
    font: baseFont,
    border: borderThin,
    alignment: { horizontal: 'center', vertical: 'center' },
  };
  const cellLeftStyle: XLSX.CellStyle = {
    font: baseFont,
    border: borderThin,
    alignment: { horizontal: 'left', vertical: 'center' },
  };
  const cellNrpStyle: XLSX.CellStyle = {
    font: baseFont,
    border: borderThin,
    alignment: { horizontal: 'center', vertical: 'center' },
    numFmt: '@',
  };

  entries.forEach((entry, idx) => {
    const r = 7 + idx;
    setCell(r, 0, idx + 1, 'n', cellCenterStyle);
    setCell(r, 1, toCap(entry.name), 's', cellLeftStyle);
    setCell(r, 2, toCap(entry.pangkat), 's', cellCenterStyle);
    setCell(r, 3, toCap(entry.nrp), 's', cellNrpStyle);
    setCell(r, 4, toCap(entry.jabatan), 's', cellCenterStyle);
    setCell(r, 5, toCap(entry.ket), 's', cellCenterStyle);
  });

  // Baris Total setelah 1 baris kosong di Kolom A
  const totalRowIdx = 8 + entries.length;
  setCell(totalRowIdx, 0, entries.length, 'n', {
    font: baseFont,
    alignment: { horizontal: 'center', vertical: 'center' },
  });

  const maxNameLen = entries.reduce(
    (max, item) => Math.max(max, item.name.length),
    header.line2.length
  );
  const maxJabatanLen = entries.reduce(
    (max, item) => Math.max(max, item.jabatan.length),
    12
  );
  const maxKetLen = entries.reduce(
    (max, item) => Math.max(max, (item.ket || '').length),
    8
  );

  ws['!ref'] = xlsxApi.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: totalRowIdx, c: 5 },
  });
  ws['!merges'] = [{ s: { r: 4, c: 1 }, e: { r: 4, c: 5 } }];
  ws['!cols'] = [
    { wch: 5 },
    { wch: Math.max(26, maxNameLen + 3) },
    { wch: 11 },
    { wch: 13 },
    { wch: Math.max(24, maxJabatanLen + 3) },
    { wch: Math.max(12, maxKetLen + 3) },
  ];

  const wb = xlsxApi.utils.book_new();
  xlsxApi.utils.book_append_sheet(wb, ws, 'DAFTAR PERS PAM');

  const rawOut = xlsxApi.write(wb, {
    bookType: 'xlsx',
    type: 'array',
  }) as ArrayBuffer | Uint8Array;
  return rawOut instanceof Uint8Array ? rawOut : new Uint8Array(rawOut);
}

function buildPamCsv(
  header: RosterOrgHeader,
  docTitle: string,
  entries: PamPersonEntry[]
): string {
  const esc = (v: string | number) =>
    `"${String(v).toUpperCase().replace(/"/g, '""')}"`;
  const lines: string[] = [
    ['', header.line1].map(esc).join(','),
    ['', header.line2].map(esc).join(','),
    ['', header.line3].map(esc).join(','),
    '',
    ['', docTitle].map(esc).join(','),
    '',
    ['NO', 'NAMA', 'PANGKAT', 'NRP', 'JABATAN', 'KET'].map(esc).join(','),
    ...entries.map((entry, idx) =>
      [
        idx + 1,
        entry.name,
        entry.pangkat,
        entry.nrp,
        entry.jabatan,
        entry.ket || '',
      ]
        .map(esc)
        .join(',')
    ),
    '',
    [entries.length].map(esc).join(','),
  ];
  return '\uFEFF' + lines.join('\r\n');
}

function buildPamWhatsAppText(
  header: RosterOrgHeader,
  docTitle: string,
  dateKey: string,
  entries: PamPersonEntry[]
): string {
  const lines: string[] = [
    `*${header.line3}*`,
    `*${docTitle}*`,
    `Hari/Tanggal: *${formatIndonesianLongDate(dateKey)}*`,
    `Jumlah Kekuatan: *${entries.length} Personel*`,
    '',
  ];

  if (entries.length === 0) {
    lines.push('- Belum ada personel pada daftar ini.');
  } else {
    entries.forEach((entry, idx) => {
      const nrpPart = entry.nrp ? ` (NRP ${entry.nrp})` : '';
      const ketPart = entry.ket.trim() ? ` [${entry.ket.trim()}]` : '';
      lines.push(
        `${idx + 1}. ${entry.pangkat} ${entry.name}${nrpPart} — ${entry.jabatan}${ketPart}`
      );
    });
  }

  return lines.join('\n');
}

function sanitizeFileSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function triggerFileDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function loadStoredPamState(
  todayDateKey: string,
  personnel: Personnel[],
  unitOrder: UnitKey[] | undefined,
  pawasAnchor: PawasAnchor,
  overrides: ShiftOverrides
): PamStoredState {
  try {
    const raw = localStorage.getItem(PAM_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PamStoredState>;
      if (parsed && parsed.drafts?.AKSI && parsed.drafts?.GIAT) {
        return {
          activeMode: parsed.activeMode === 'GIAT' ? 'GIAT' : 'AKSI',
          drafts: parsed.drafts,
          savedLists: Array.isArray(parsed.savedLists)
            ? parsed.savedLists.slice(0, MAX_SAVED_PAM_LISTS)
            : [],
          waPhone: typeof parsed.waPhone === 'string' ? parsed.waPhone : '',
        };
      }
    }
  } catch {
    // Abaikan error storage
  }

  return {
    activeMode: 'AKSI',
    drafts: {
      AKSI: {
        dateKey: todayDateKey,
        title: formatPamDefaultTitle('AKSI', todayDateKey),
        entries: buildAutoPamEntries(
          'AKSI',
          todayDateKey,
          personnel,
          unitOrder,
          pawasAnchor,
          overrides
        ),
      },
      GIAT: {
        dateKey: todayDateKey,
        title: formatPamDefaultTitle('GIAT', todayDateKey),
        entries: buildAutoPamEntries(
          'GIAT',
          todayDateKey,
          personnel,
          unitOrder,
          pawasAnchor,
          overrides
        ),
      },
    },
    savedLists: [],
    waPhone: '',
  };
}

function getShiftBadgeClass(shiftCode?: string): string {
  switch (shiftCode) {
    case 'X':
      return 'bg-blue-600 text-white';
    case 'PAWAS':
      return 'bg-indigo-100 text-indigo-800 border border-indigo-200';
    case 'S':
      return 'bg-amber-100 text-amber-900 border border-amber-200';
    case 'M':
      return 'bg-slate-800 text-white';
    case 'P':
      return 'bg-emerald-600 text-white';
    case 'C':
    case 'C1':
    case 'C2':
      return 'bg-slate-200 text-slate-800';
    case 'MANUAL':
      return 'bg-purple-100 text-purple-800 border border-purple-200';
    default:
      return 'bg-slate-100 text-slate-600';
  }
}

export function DaftarPersPamView({
  header,
  todayDateKey,
  personnel,
  unitOrder,
  pawasAnchor,
  overrides,
}: DaftarPersPamViewProps) {
  const [state, setState] = useState<PamStoredState>(() =>
    loadStoredPamState(
      todayDateKey,
      personnel,
      unitOrder,
      pawasAnchor,
      overrides
    )
  );

  const [selectedRosterIdsToAdd, setSelectedRosterIdsToAdd] = useState<
    string[]
  >([]);
  const [rosterSearch, setRosterSearch] = useState<string>('');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customPangkat, setCustomPangkat] = useState('');
  const [customNrp, setCustomNrp] = useState('');
  const [customJabatan, setCustomJabatan] = useState('');
  const [customKet, setCustomKet] = useState('');
  const [copiedWa, setCopiedWa] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [confirmDeleteSavedId, setConfirmDeleteSavedId] = useState<
    string | null
  >(null);



  useEffect(() => {
    try {
      localStorage.setItem(PAM_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Abaikan kuota penuh
    }
  }, [state]);



  const showNotice = (msg: string) => {
    setStatusNotice(msg);
    window.setTimeout(() => {
      setStatusNotice((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  const activeMode = state.activeMode;
  const activeDraft = state.drafts[activeMode];
  const entries = activeDraft.entries;

  // Daftar personel master yang belum masuk ke daftar aktif (untuk tambah manual cepat)
  const availableRosterOptions = useMemo(() => {
    const existingSourceIds = new Set(
      entries.map((e) => e.sourcePersonnelId).filter(Boolean)
    );
    const { year, monthIndex, day } = parseDateKeyParts(activeDraft.dateKey);
    const monthPersonnel = getEffectivePersonnelForMonth(
      personnel,
      year,
      monthIndex
    );

    const q = rosterSearch.trim().toLowerCase();

    return monthPersonnel
      .filter((p) => !existingSourceIds.has(p.id))
      .filter((p) => {
        if (!q) return true;
        return (
          p.name.toLowerCase().includes(q) ||
          p.jabatan.toLowerCase().includes(q) ||
          p.unit.toLowerCase().includes(q) ||
          p.pangkat.toLowerCase().includes(q)
        );
      })
      .map((p) => {
        const shift = getEffectiveShift(
          p,
          year,
          monthIndex,
          day,
          overrides,
          monthPersonnel,
          pawasAnchor
        ).code;
        return { person: p, shift };
      });
  }, [
    entries,
    personnel,
    activeDraft.dateKey,
    overrides,
    pawasAnchor,
    rosterSearch,
  ]);

  const updateActiveDraft = (
    updater: (
      prev: PamStoredState['drafts']['AKSI']
    ) => PamStoredState['drafts']['AKSI']
  ) => {
    setState((prev) => ({
      ...prev,
      drafts: {
        ...prev.drafts,
        [prev.activeMode]: updater(prev.drafts[prev.activeMode]),
      },
    }));
  };

  const handleChangeDate = (nextDateKey: string) => {
    if (!nextDateKey) return;
    const filtered = buildAutoPamEntries(
      activeMode,
      nextDateKey,
      personnel,
      unitOrder,
      pawasAnchor,
      overrides
    );
    updateActiveDraft(() => ({
      dateKey: nextDateKey,
      title: formatPamDefaultTitle(activeMode, nextDateKey),
      entries: filtered,
      loadedSavedId: undefined,
    }));
    showNotice(
      `Daftar ${activeMode === 'AKSI' ? 'PAM AKSI' : 'PAM GIAT'} difilter ulang untuk ${formatIndonesianLongDate(nextDateKey)} (${filtered.length} personel).`
    );
  };

  const handleReFilterFromSchedule = () => {
    const filtered = buildAutoPamEntries(
      activeMode,
      activeDraft.dateKey,
      personnel,
      unitOrder,
      pawasAnchor,
      overrides
    );
    updateActiveDraft((prev) => ({
      ...prev,
      title: formatPamDefaultTitle(activeMode, prev.dateKey),
      entries: filtered,
      loadedSavedId: undefined,
    }));
    showNotice(
      `Berhasil memuat ulang hasil filter jadwal piket (${filtered.length} personel).`
    );
  };

  const activeSelectedIds = useMemo(() => {
    const availSet = new Set(availableRosterOptions.map((o) => o.person.id));
    return selectedRosterIdsToAdd.filter((id) => availSet.has(id));
  }, [selectedRosterIdsToAdd, availableRosterOptions]);

  const handleToggleRosterId = (personId: string) => {
    setSelectedRosterIdsToAdd((prev) =>
      prev.includes(personId)
        ? prev.filter((id) => id !== personId)
        : [...prev, personId]
    );
  };

  const handleSelectAllFilteredRoster = () => {
    const filteredIds = availableRosterOptions.map((o) => o.person.id);
    setSelectedRosterIdsToAdd((prev) => {
      const merged = new Set([...prev, ...filteredIds]);
      return Array.from(merged);
    });
  };

  const handleClearRosterSelection = () => {
    setSelectedRosterIdsToAdd([]);
  };

  const handleAddFromRoster = () => {
    if (activeSelectedIds.length === 0) return;
    const selectedSet = new Set(activeSelectedIds);
    const pickedItems = availableRosterOptions.filter((o) =>
      selectedSet.has(o.person.id)
    );
    if (pickedItems.length === 0) return;

    const nowStamp = Date.now().toString(36);
    const newEntries: PamPersonEntry[] = pickedItems.map((picked, idx) => ({
      id: `pam_${picked.person.id}_${nowStamp}_${idx}`,
      sourcePersonnelId: picked.person.id,
      name: picked.person.name,
      pangkat: picked.person.pangkat,
      nrp: picked.person.nrp,
      jabatan: picked.person.jabatan,
      ket: '',
      unitLabel: picked.person.unit,
      shiftCode: picked.shift || 'MANUAL',
    }));

    updateActiveDraft((prev) => ({
      ...prev,
      entries: [...prev.entries, ...newEntries],
    }));
    setSelectedRosterIdsToAdd([]);
    showNotice(
      newEntries.length === 1
        ? `${newEntries[0].name} ditambahkan ke daftar PAM.`
        : `${newEntries.length} personel ditambahkan ke daftar PAM.`
    );
  };

  const handleAddCustomPerson = (e: FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const newEntry: PamPersonEntry = {
      id: `pam_manual_${Date.now().toString(36)}_${Math.random()
        .toString(36)
        .slice(2, 5)}`,
      name: customName.trim().toUpperCase(),
      pangkat: customPangkat.trim().toUpperCase(),
      nrp: customNrp.trim(),
      jabatan: customJabatan.trim().toUpperCase(),
      ket: customKet.trim().toUpperCase(),
      unitLabel: 'MANUAL',
      shiftCode: 'MANUAL',
    };

    updateActiveDraft((prev) => ({
      ...prev,
      entries: [...prev.entries, newEntry],
    }));
    setCustomName('');
    setCustomPangkat('');
    setCustomNrp('');
    setCustomJabatan('');
    setCustomKet('');
    setShowCustomForm(false);
    showNotice(`${newEntry.name} ditambahkan secara manual.`);
  };

  const handleRemoveEntry = (entryId: string) => {
    updateActiveDraft((prev) => ({
      ...prev,
      entries: prev.entries.filter((item) => item.id !== entryId),
    }));
  };

  const handleMoveEntry = (idx: number, delta: -1 | 1) => {
    const targetIdx = idx + delta;
    if (targetIdx < 0 || targetIdx >= entries.length) return;
    updateActiveDraft((prev) => {
      const next = [...prev.entries];
      [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
      return { ...prev, entries: next };
    });
  };

  const handleUpdateKet = (entryId: string, ket: string) => {
    updateActiveDraft((prev) => ({
      ...prev,
      entries: prev.entries.map((item) =>
        item.id === entryId ? { ...item, ket } : item
      ),
    }));
  };

  const handleSaveList = (asNew = false) => {
    const nowIso = new Date().toISOString();
    const snapshotEntries = entries.map((e) => ({ ...e }));
    const cleanTitle =
      activeDraft.title.trim() ||
      formatPamDefaultTitle(activeMode, activeDraft.dateKey);

    setState((prev) => {
      const currentDraft = prev.drafts[prev.activeMode];
      const existingId = !asNew ? currentDraft.loadedSavedId : undefined;

      if (existingId && prev.savedLists.some((s) => s.id === existingId)) {
        const updatedList = prev.savedLists.map((s) =>
          s.id === existingId
            ? {
                ...s,
                mode: prev.activeMode,
                dateKey: currentDraft.dateKey,
                title: cleanTitle,
                savedAt: nowIso,
                entries: snapshotEntries,
              }
            : s
        );
        return {
          ...prev,
          savedLists: updatedList,
        };
      }

      const newId = `saved_pam_${Date.now().toString(36)}_${Math.random()
        .toString(36)
        .slice(2, 5)}`;
      const newSaved: SavedPamRoster = {
        id: newId,
        mode: prev.activeMode,
        dateKey: currentDraft.dateKey,
        title: cleanTitle,
        savedAt: nowIso,
        entries: snapshotEntries,
      };

      const nextSavedLists = [newSaved, ...prev.savedLists].slice(
        0,
        MAX_SAVED_PAM_LISTS
      );

      return {
        ...prev,
        drafts: {
          ...prev.drafts,
          [prev.activeMode]: {
            ...currentDraft,
            loadedSavedId: newId,
          },
        },
        savedLists: nextSavedLists,
      };
    });

    showNotice(
      `Daftar "${cleanTitle}" (${entries.length} pers) disimpan ke riwayat (maks. ${MAX_SAVED_PAM_LISTS} daftar).`
    );
  };

  const handleLoadSaved = (saved: SavedPamRoster) => {
    setState((prev) => ({
      ...prev,
      activeMode: saved.mode,
      drafts: {
        ...prev.drafts,
        [saved.mode]: {
          dateKey: saved.dateKey,
          title: saved.title,
          entries: saved.entries.map((e) => ({ ...e })),
          loadedSavedId: saved.id,
        },
      },
    }));
    showNotice(`Membuka daftar tersimpan: ${saved.title}`);
  };

  const handleDeleteSaved = (id: string) => {
    setState((prev) => ({
      ...prev,
      savedLists: prev.savedLists.filter((s) => s.id !== id),
      drafts: {
        AKSI:
          prev.drafts.AKSI.loadedSavedId === id
            ? { ...prev.drafts.AKSI, loadedSavedId: undefined }
            : prev.drafts.AKSI,
        GIAT:
          prev.drafts.GIAT.loadedSavedId === id
            ? { ...prev.drafts.GIAT, loadedSavedId: undefined }
            : prev.drafts.GIAT,
      },
    }));
    setConfirmDeleteSavedId(null);
    showNotice('Daftar PAM tersimpan dihapus dari riwayat.');
  };

  const handleDownloadXlsx = (
    customTitle = activeDraft.title,
    customEntries = entries
  ) => {
    const xlsxBytes = buildPamXlsxBytes(header, customTitle, customEntries);
    const blob = new Blob([xlsxBytes as BlobPart], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const filename = `${sanitizeFileSlug(customTitle) || 'daftar-pers-pam'}.xlsx`;
    triggerFileDownload(blob, filename);
    showNotice(`File Excel (${filename}) berhasil diunduh.`);
  };

  const handleDownloadCsv = (
    customTitle = activeDraft.title,
    customEntries = entries
  ) => {
    const csv = buildPamCsv(header, customTitle, customEntries);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const filename = `${sanitizeFileSlug(customTitle) || 'daftar-pers-pam'}.csv`;
    triggerFileDownload(blob, filename);
    showNotice(`File CSV (${filename}) berhasil diunduh.`);
  };

  const handleSendExcelToWhatsApp = async (
    customTitle = activeDraft.title,
    customDateKey = activeDraft.dateKey,
    customEntries = entries
  ) => {
    const xlsxBytes = buildPamXlsxBytes(header, customTitle, customEntries);
    const filename = `${sanitizeFileSlug(customTitle) || 'daftar-pers-pam'}.xlsx`;
    const mimeType =
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    const file = new File([xlsxBytes as BlobPart], filename, {
      type: mimeType,
    });

    const nav = navigator as Navigator & {
      canShare?: (data: ShareData) => boolean;
      share?: (data: ShareData) => Promise<void>;
    };

    if (
      typeof nav.share === 'function' &&
      typeof nav.canShare === 'function' &&
      nav.canShare({ files: [file] })
    ) {
      try {
        await nav.share({
          files: [file],
          title: customTitle,
          text: `${customTitle} (${customEntries.length} Personel) - ${formatIndonesianLongDate(customDateKey)}`,
        });
        showNotice(`File Excel ${filename} dibagikan ke WhatsApp.`);
        return;
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
      }
    }

    // Fallback ketika browser desktop tidak mendukung Share File secara langsung:
    // Otomatis unduh file .xlsx agar siap dilampirkan di WhatsApp Web.
    const blob = new Blob([xlsxBytes as BlobPart], { type: mimeType });
    triggerFileDownload(blob, filename);
    showNotice(
      `File Excel "${filename}" telah diunduh otomatis. Perangkat/browser ini tidak mendukung kirim lampiran langsung — silakan lampirkan file .xlsx tersebut di chat WhatsApp atau gunakan tombol "Kirim Teks via WA".`
    );
  };

  const waText = useMemo(
    () =>
      buildPamWhatsAppText(
        header,
        activeDraft.title,
        activeDraft.dateKey,
        entries
      ),
    [header, activeDraft.title, activeDraft.dateKey, entries]
  );

  const waUrl = useMemo(() => {
    const digits = state.waPhone.replace(/\D/g, '');
    const normalized = digits.startsWith('0')
      ? `62${digits.slice(1)}`
      : digits;
    const encoded = encodeURIComponent(waText);
    return normalized
      ? `https://wa.me/${normalized}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
  }, [state.waPhone, waText]);

  const handleCopyWaText = async () => {
    try {
      await navigator.clipboard.writeText(waText);
      setCopiedWa(true);
      window.setTimeout(() => setCopiedWa(false), 2400);
    } catch {
      showNotice('Gagal menyalin teks WhatsApp.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Submenu Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            DAFTAR PERS PAM
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Terfilter otomatis dari jadwal piket pada tanggal terpilih tanpa
            mengubah data jadwal utama.
          </p>
        </div>

        {/* 2 Submenus: PAM AKSI & PAM GIAT */}
        <div
          role="tablist"
          aria-label="Submenu Daftar Pers PAM"
          className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 self-start"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeMode === 'AKSI'}
            onClick={() =>
              setState((prev) => ({ ...prev, activeMode: 'AKSI' }))
            }
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
              activeMode === 'AKSI'
                ? 'bg-slate-900 text-amber-300 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>PAM AKSI</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeMode === 'GIAT'}
            onClick={() =>
              setState((prev) => ({ ...prev, activeMode: 'GIAT' }))
            }
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
              activeMode === 'GIAT'
                ? 'bg-slate-900 text-emerald-300 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>PAM GIAT</span>
          </button>
        </div>
      </div>

      {/* Status Notice */}
      {statusNotice && (
        <div
          role="status"
          className="px-4 py-2.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-950 text-xs font-medium flex items-center justify-between gap-3"
        >
          <span>{statusNotice}</span>
          <button
            type="button"
            onClick={() => setStatusNotice(null)}
            className="text-amber-700 hover:text-amber-950 font-semibold shrink-0"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Filter Rule Info Strip */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        {activeMode === 'AKSI' ? (
          <div>
            <span className="font-bold text-slate-900">
              Aturan Filter PAM AKSI:
            </span>{' '}
            Personel yang sedang piket pada tanggal dipilih.{' '}
            <span className="font-semibold text-blue-700">
              Semua PAWAS masuk kecuali PAWAS yang 1 hari sebelumnya piket (X)
            </span>
            . Anggota <span className="font-semibold text-rose-700">SPKT</span>,{' '}
            <span className="font-semibold text-rose-700">C Reskrim</span>, dan{' '}
            <span className="font-semibold text-rose-700">C2 Intel</span> tidak
            ikut terfilter.
          </div>
        ) : (
          <div>
            <span className="font-bold text-slate-900">
              Aturan Filter PAM GIAT:
            </span>{' '}
            Menampilkan seluruh personel yang sedang piket sesuai jadwal pada
            tanggal dipilih (X, S, M, P, C, C1, C2). Anda dapat menambah maupun
            menghapus personel secara manual.
          </div>
        )}
        <span className="font-mono text-[11px] font-semibold px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 shrink-0 self-start sm:self-center">
          {entries.length} Personel
        </span>
      </div>

      {/* Controls: Date Picker, Title, Export & WA Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-7 bg-white border border-slate-200 rounded-xl p-4 space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-600 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                <span>Tanggal Jadwal Piket</span>
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={activeDraft.dateKey}
                  onChange={(e) => handleChangeDate(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => handleChangeDate(todayDateKey)}
                  className="px-2.5 py-2 text-[11px] font-semibold border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 whitespace-nowrap"
                >
                  Hari Ini
                </button>
              </div>
              <div className="flex items-center gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() =>
                    handleChangeDate(addDaysToDateKey(activeDraft.dateKey, -1))
                  }
                  className="px-2 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded"
                >
                  &larr; -1 Hari
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleChangeDate(addDaysToDateKey(activeDraft.dateKey, 1))
                  }
                  className="px-2 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded"
                >
                  +1 Hari &rarr;
                </button>
                <span className="text-[11px] text-slate-500 truncate ml-1">
                  {formatIndonesianLongDate(activeDraft.dateKey)}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                Judul Dokumen Excel
              </label>
              <input
                type="text"
                value={activeDraft.title}
                onChange={(e) =>
                  updateActiveDraft((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
                placeholder={`DAFTAR PERS PAM ${activeMode} ...`}
                className="w-full px-3 py-2 text-xs font-semibold border border-slate-300 rounded-lg bg-white text-slate-900"
              />
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={handleReFilterFromSchedule}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Filter Ulang dari Jadwal</span>
                </button>
              </div>
            </div>
          </div>

          {/* Save & Excel/WA Export Toolbar */}
          <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleSaveList(false)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <BookmarkCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {activeDraft.loadedSavedId
                  ? 'Perbarui Tersimpan'
                  : 'Simpan Daftar PAM'}
              </span>
            </button>

            {activeDraft.loadedSavedId && (
              <button
                type="button"
                onClick={() => handleSaveList(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Simpan Sebagai Baru</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleDownloadXlsx()}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Unduh Excel (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={() => handleDownloadCsv()}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* WhatsApp Direct Share Panel */}
        <div className="xl:col-span-5 bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-bold text-emerald-950 uppercase tracking-wide flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-emerald-700" />
              <span>Kirim ke WhatsApp</span>
            </div>
            <span className="text-[11px] font-medium text-emerald-800">
              Excel (.xlsx) / Teks
            </span>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-emerald-900">
              Nomor WA Tujuan (opsional, kosongkan untuk pilih kontak di WA)
            </label>
            <input
              type="tel"
              value={state.waPhone}
              onChange={(e) =>
                setState((prev) => ({ ...prev, waPhone: e.target.value }))
              }
              placeholder="Contoh: 081234567890"
              className="w-full px-3 py-1.5 text-xs bg-white border border-emerald-200 rounded-lg text-slate-900"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleSendExcelToWhatsApp()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Kirim File Excel ke WA</span>
            </button>

            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-900 bg-white hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Kirim Teks via WA</span>
            </a>

            <button
              type="button"
              onClick={handleCopyWaText}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors"
            >
              {copiedWa ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Teks</span>
                </>
              )}
            </button>
          </div>
          <p className="text-[11px] text-emerald-800/90 leading-snug">
            Di Android/HP, tombol <strong>Kirim File Excel ke WA</strong>{' '}
            membuka menu Bagikan untuk langsung mengirim file{' '}
            <code>.xlsx</code> ke WhatsApp.
          </p>
        </div>
      </div>

      {/* Add Personnel Manually */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
            <UserPlus className="w-4 h-4 text-amber-600" />
            <span>Tambah Personel Manual ke Daftar Ini</span>
          </div>
          <button
            type="button"
            onClick={() => setShowCustomForm((v) => !v)}
            className="text-xs font-semibold text-blue-700 hover:text-blue-900"
          >
            {showCustomForm
              ? 'Tutup Input Manual Baru'
              : '+ Input Personel di Luar Data'}
          </button>
        </div>

        <div className="space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2.5">
            <div className="flex-1 space-y-1">
              <label className="text-[11px] font-medium text-slate-600">
                Cari &amp; Centang Personel dari Data Induk (bisa pilih lebih
                dari satu · {availableRosterOptions.length} tersedia)
              </label>
              <input
                type="text"
                value={rosterSearch}
                onChange={(e) => setRosterSearch(e.target.value)}
                placeholder="Cari nama / jabatan / unit (mis. WAKA, STANBY, BHABIN)..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleSelectAllFilteredRoster}
                disabled={availableRosterOptions.length === 0}
                className="px-2.5 py-2 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg transition-colors"
              >
                Pilih Semua ({availableRosterOptions.length})
              </button>
              {activeSelectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearRosterSelection}
                  className="px-2.5 py-2 text-[11px] font-semibold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Batal Pilih
                </button>
              )}
              <button
                type="button"
                onClick={handleAddFromRoster}
                disabled={activeSelectedIds.length === 0}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>
                  Tambahkan Terpilih
                  {activeSelectedIds.length > 0
                    ? ` (${activeSelectedIds.length})`
                    : ''}
                </span>
              </button>
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 bg-slate-50/40">
            {availableRosterOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-slate-500">
                {rosterSearch.trim()
                  ? 'Tidak ada personel yang cocok dengan pencarian.'
                  : 'Semua personel data induk sudah ada di daftar ini.'}
              </div>
            ) : (
              availableRosterOptions.map(({ person, shift }) => {
                const checked = activeSelectedIds.includes(person.id);
                return (
                  <label
                    key={person.id}
                    className={`flex items-center gap-2.5 px-3 py-2 text-xs cursor-pointer transition-colors ${
                      checked
                        ? 'bg-amber-50/90 hover:bg-amber-100/70'
                        : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleToggleRosterId(person.id)}
                      className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 shrink-0"
                    />
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                      {person.unit} · {shift || '-'}
                    </span>
                    <span className="font-semibold text-slate-900 truncate">
                      {person.pangkat} {person.name}
                    </span>
                    <span className="text-slate-500 truncate hidden sm:inline">
                      — {person.jabatan}
                    </span>
                  </label>
                );
              })
            )}
          </div>
        </div>

        {showCustomForm && (
          <form
            onSubmit={handleAddCustomPerson}
            className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 items-end"
          >
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-600">
                Nama *
              </label>
              <input
                type="text"
                required
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="NAMA PERSONEL"
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-600">
                Pangkat
              </label>
              <input
                type="text"
                value={customPangkat}
                onChange={(e) => setCustomPangkat(e.target.value)}
                placeholder="AIPTU / BRIPKA"
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-600">
                NRP
              </label>
              <input
                type="text"
                value={customNrp}
                onChange={(e) => setCustomNrp(e.target.value)}
                placeholder="8 digit NRP"
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-600">
                Jabatan
              </label>
              <input
                type="text"
                value={customJabatan}
                onChange={(e) => setCustomJabatan(e.target.value)}
                placeholder="JABATAN"
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-600">
                Ket
              </label>
              <input
                type="text"
                value={customKet}
                onChange={(e) => setCustomKet(e.target.value)}
                placeholder="Opsional"
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              Simpan Baris
            </button>
          </form>
        )}
      </div>

      {/* Editable Working Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Editor Daftar Pers {activeMode === 'AKSI' ? 'PAM AKSI' : 'PAM GIAT'}
            </h3>
            <p className="text-[11px] text-slate-500">
              Kolom KET dapat langsung diketik. Gunakan panah untuk mengatur
              urutan atau ikon tempat sampah untuk menghapus baris.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-900">
            Total: {entries.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700">
                <th className="px-2.5 py-2 text-center font-bold w-10">NO</th>
                <th className="px-3 py-2 text-left font-bold min-w-[170px]">
                  NAMA
                </th>
                <th className="px-2.5 py-2 text-center font-bold whitespace-nowrap">
                  PANGKAT
                </th>
                <th className="px-2.5 py-2 text-center font-bold whitespace-nowrap">
                  NRP
                </th>
                <th className="px-3 py-2 text-left font-bold min-w-[170px]">
                  JABATAN
                </th>
                <th className="px-2.5 py-2 text-center font-bold whitespace-nowrap">
                  PIKET
                </th>
                <th className="px-2.5 py-2 text-left font-bold min-w-[120px]">
                  KET
                </th>
                <th className="px-2.5 py-2 text-center font-bold w-24">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {entries.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    Tidak ada personel dalam daftar ini. Klik{' '}
                    <strong>Filter Ulang dari Jadwal</strong> atau tambahkan
                    personel secara manual.
                  </td>
                </tr>
              ) : (
                entries.map((entry, idx) => (
                  <tr key={entry.id} className="hover:bg-slate-50">
                    <td className="px-2.5 py-2 text-center font-mono tabular-nums text-slate-600">
                      {idx + 1}
                    </td>
                    <td className="px-3 py-2 font-semibold text-slate-900 whitespace-nowrap">
                      {entry.name}
                    </td>
                    <td className="px-2.5 py-2 text-center text-slate-700 whitespace-nowrap">
                      {entry.pangkat}
                    </td>
                    <td className="px-2.5 py-2 text-center font-mono tabular-nums text-slate-700 whitespace-nowrap">
                      {entry.nrp}
                    </td>
                    <td className="px-3 py-2 text-slate-700 whitespace-nowrap">
                      {entry.jabatan}
                    </td>
                    <td className="px-2.5 py-2 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${getShiftBadgeClass(entry.shiftCode)}`}
                      >
                        {entry.shiftCode || '-'}
                      </span>
                    </td>
                    <td className="px-2.5 py-1.5">
                      <input
                        type="text"
                        value={entry.ket}
                        onChange={(e) =>
                          handleUpdateKet(entry.id, e.target.value)
                        }
                        placeholder="-"
                        className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-white text-slate-900 focus:border-amber-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveEntry(idx, -1)}
                          disabled={idx === 0}
                          title="Geser ke atas"
                          className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveEntry(idx, 1)}
                          disabled={idx === entries.length - 1}
                          title="Geser ke bawah"
                          className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveEntry(entry.id)}
                          title="Hapus dari daftar ini"
                          className="p-1 text-rose-500 hover:text-rose-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Exact Spreadsheet Output Preview (Matches Screenshot_20261115_082323_Sheets) */}
      <div className="bg-white border border-slate-300 rounded-xl p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Pratinjau Output Excel</span>
          </div>
          <span className="text-[11px] text-slate-500">
            Susunan persis kolom A–F siap unduh &amp; kirim WA
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-300 rounded-lg bg-white p-3">
          <table className="w-full min-w-[660px] border-collapse text-[12px] text-black font-sans">
            <tbody>
              <tr>
                <td className="w-10 py-0.5"></td>
                <td className="text-center py-0.5 leading-tight">
                  {header.line1}
                </td>
                <td className="py-0.5"></td>
                <td className="py-0.5"></td>
                <td className="py-0.5"></td>
                <td className="py-0.5"></td>
              </tr>
              <tr>
                <td className="py-0.5"></td>
                <td className="text-center py-0.5 leading-tight">
                  {header.line2}
                </td>
                <td className="py-0.5"></td>
                <td className="py-0.5"></td>
                <td className="py-0.5"></td>
                <td className="py-0.5"></td>
              </tr>
              <tr>
                <td className="py-0.5"></td>
                <td className="text-center py-0.5 leading-tight">
                  {header.line3}
                </td>
                <td className="py-0.5"></td>
                <td className="py-0.5"></td>
                <td className="py-0.5"></td>
                <td className="py-0.5"></td>
              </tr>
              <tr>
                <td colSpan={6} className="h-4"></td>
              </tr>
              <tr>
                <td></td>
                <td colSpan={5} className="text-center py-1 tracking-wide">
                  {activeDraft.title}
                </td>
              </tr>
              <tr>
                <td colSpan={6} className="h-3"></td>
              </tr>
              <tr>
                <td className="border border-black text-center px-2 py-1">
                  NO
                </td>
                <td className="border border-black text-center px-2 py-1">
                  NAMA
                </td>
                <td className="border border-black text-center px-2 py-1">
                  PANGKAT
                </td>
                <td className="border border-black text-center px-2 py-1">
                  NRP
                </td>
                <td className="border border-black text-center px-2 py-1">
                  JABATAN
                </td>
                <td className="border border-black text-center px-2 py-1">
                  KET
                </td>
              </tr>
              {entries.map((entry, idx) => (
                <tr key={`preview_${entry.id}`}>
                  <td className="border border-black text-center px-2 py-0.5 tabular-nums">
                    {idx + 1}
                  </td>
                  <td className="border border-black text-left px-2 py-0.5 whitespace-nowrap">
                    {entry.name}
                  </td>
                  <td className="border border-black text-center px-2 py-0.5 whitespace-nowrap">
                    {entry.pangkat}
                  </td>
                  <td className="border border-black text-center px-2 py-0.5 tabular-nums whitespace-nowrap">
                    {entry.nrp}
                  </td>
                  <td className="border border-black text-center px-2 py-0.5 whitespace-nowrap">
                    {entry.jabatan}
                  </td>
                  <td className="border border-black text-center px-2 py-0.5 whitespace-nowrap">
                    {entry.ket}
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={6} className="h-3"></td>
              </tr>
              <tr>
                <td className="text-center py-0.5 tabular-nums">
                  {entries.length}
                </td>
                <td colSpan={5}></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Saved History up to 10 Daftar Personel PAM */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-amber-600" />
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Riwayat Daftar Personil PAM Tersimpan ({state.savedLists.length}
                /{MAX_SAVED_PAM_LISTS})
              </h3>
              <p className="text-[11px] text-slate-500">
                Menyimpan hingga 10 daftar personel PAM terakhir agar tetap
                dapat dilihat, diunduh Excel, atau dikirim ulang ke WhatsApp.
              </p>
            </div>
          </div>
        </div>

        {state.savedLists.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500">
            Belum ada daftar yang disimpan. Klik{' '}
            <strong>Simpan Daftar PAM</strong> di atas untuk menyimpan ke
            riwayat.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {state.savedLists.map((saved, index) => {
              const isCurrentlyLoaded =
                activeDraft.loadedSavedId === saved.id &&
                activeMode === saved.mode;
              return (
                <div
                  key={saved.id}
                  className={`rounded-xl border p-3.5 space-y-2.5 transition-colors ${
                    isCurrentlyLoaded
                      ? 'border-amber-500 bg-amber-50/40'
                      : 'border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-mono font-bold text-slate-500">
                          #{index + 1}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            saved.mode === 'AKSI'
                              ? 'bg-slate-900 text-amber-300'
                              : 'bg-emerald-700 text-white'
                          }`}
                        >
                          PAM {saved.mode}
                        </span>
                        <span className="text-[11px] font-mono font-semibold text-slate-600">
                          {saved.entries.length} Pers
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 mt-1 truncate">
                        {saved.title}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Jadwal: {formatIndonesianLongDate(saved.dateKey)} ·
                        Disimpan {formatSavedTimestamp(saved.savedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handleLoadSaved(saved)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg"
                    >
                      <FolderOpen className="w-3 h-3 text-amber-600" />
                      <span>Lihat / Buka</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleDownloadXlsx(saved.title, saved.entries)
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg"
                    >
                      <FileSpreadsheet className="w-3 h-3" />
                      <span>Excel</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleSendExcelToWhatsApp(
                          saved.title,
                          saved.dateKey,
                          saved.entries
                        )
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
                    >
                      <Share2 className="w-3 h-3" />
                      <span>WA</span>
                    </button>

                    {confirmDeleteSavedId === saved.id ? (
                      <div className="inline-flex items-center gap-1 ml-auto">
                        <button
                          type="button"
                          onClick={() => handleDeleteSaved(saved.id)}
                          className="px-2 py-1 text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-700 rounded"
                        >
                          Ya, Hapus
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteSavedId(null)}
                          className="px-2 py-1 text-[11px] font-medium text-slate-600 bg-white border border-slate-300 rounded"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteSavedId(saved.id)}
                        title="Hapus dari riwayat"
                        className="ml-auto p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
