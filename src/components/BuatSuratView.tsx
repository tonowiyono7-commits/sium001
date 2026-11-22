import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  BookmarkCheck,
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronUp,
  FileDown,
  FileText,
  FolderOpen,
  History,
  Plus,
  RotateCcw,
  Share2,
  ShieldCheck,
  Trash2,
  Upload,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  createDefaultPolsekSuratBiasa,
  parseImportedSuratBiasaJson,
  SURAT_BIASA_TEMPLATES,
  SuratBiasaTemplateItem,
} from '../data/suratBiasaTemplates';
import {
  createDefaultPolsekSprin,
  parseImportedSprinJson,
  SURAT_PERINTAH_TEMPLATES,
  SuratPerintahTemplateItem,
} from '../data/suratPerintahTemplates';
import { KopSuratEditorModal } from './KopSuratEditorModal';
import {
  PawasAnchor,
  Personnel,
  RosterOrgHeader,
  SavedSuratItem,
  ShiftCode,
  ShiftOverrides,
  SignerDelegationMode,
  SuratBiasaData,
  SuratFontFamily,
  SuratMode,
  SuratPerintahData,
  SuratPersonRow,
} from '../types/polriRoster';
import {
  DAY_NAMES_FULL_ID,
  getEffectivePersonnelForMonth,
  getEffectiveShift,
  isPersonPausedOnDate,
  MONTH_NAMES_ID,
} from '../utils/continuousRoster';
import {
  PERKAP_KLASIFIKASI_OPTIONS,
  SIGNER_DELEGATION_OPTIONS,
  SURAT_FONT_OPTIONS,
  normalizeSignerNamePerkap,
  normalizeSignerRankNrpPerkap,
} from '../utils/perkap2023Rules';
import {
  A4PreviewBlock,
  A4PreviewPage,
  buildSprinA4Pages,
  buildSuratBiasaA4Pages,
  generateSprinDocxBlob,
  generateSprinPdfBlob,
  generateSuratBiasaDocxBlob,
  generateSuratBiasaPdfBlob,
} from '../utils/suratDocxPdf';

const SURAT_STORAGE_KEY = 'kuat_pers_surat_v1';
const MAX_SAVED_SURAT = 10;
const TRIBRATA_LOGO_URL = '/assets/aistudio/Logo_Tri_Brata__1___1__7bf85ea6.png';

interface SuratStoredState {
  activeMode: SuratMode;
  sprin: SuratPerintahData;
  biasa: SuratBiasaData;
  savedList: SavedSuratItem[];
  defaultFontMigratedNarrow?: boolean;
}

interface BuatSuratViewProps {
  header: RosterOrgHeader;
  onHeaderUpdated?: (nextHeader: RosterOrgHeader) => void;
  todayDateKey: string;
  personnel: Personnel[];
  pawasAnchor: PawasAnchor;
  overrides: ShiftOverrides;
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

function formatIndonesianTitleDate(dateKey: string): string {
  const { year, monthIndex, day } = parseDateKeyParts(dateKey);
  const monthRaw = MONTH_NAMES_ID[monthIndex] ?? 'NOVEMBER';
  const monthTitle =
    monthRaw.charAt(0).toUpperCase() + monthRaw.slice(1).toLowerCase();
  return `${day} ${monthTitle} ${year}`;
}

function formatIndonesianUpperDayDate(dateKey: string): string {
  const { year, monthIndex, day } = parseDateKeyParts(dateKey);
  const dt = new Date(year, monthIndex, day);
  const dayName = DAY_NAMES_FULL_ID[dt.getDay()].toUpperCase();
  const monthName = MONTH_NAMES_ID[monthIndex] ?? 'NOVEMBER';
  return `${dayName} ${day} ${monthName} ${year}`;
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

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function sanitizeFilename(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function createDefaultSprin(
  header: RosterOrgHeader,
  todayDateKey: string,
  personnel: Personnel[]
): SuratPerintahData {
  return createDefaultPolsekSprin(header, todayDateKey, personnel);
}

function createDefaultSuratBiasa(
  header: RosterOrgHeader,
  todayDateKey: string
): SuratBiasaData {
  return createDefaultPolsekSuratBiasa(header, todayDateKey);
}

function loadStoredSuratState(
  header: RosterOrgHeader,
  todayDateKey: string,
  personnel: Personnel[]
): SuratStoredState {
  try {
    const raw = localStorage.getItem(SURAT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SuratStoredState>;
      if (parsed && parsed.sprin && parsed.biasa) {
        return {
          activeMode: parsed.activeMode === 'BIASA' ? 'BIASA' : 'SPRIN',
          sprin: {
            ...parsed.sprin,
            signerDelegation: parsed.sprin.signerDelegation ?? 'NONE',
            signerSuperiorTitle:
              parsed.sprin.signerSuperiorTitle || 'KAPOLRESTABES SEMARANG',
            signerMiddleTitle:
              parsed.sprin.signerMiddleTitle || 'WAKAPOLRESTABES SEMARANG',
            signerRankNrp: /NRP\s+NRP|^KOMPOL\b/i.test(
              parsed.sprin.signerRankNrp
            )
              ? normalizeSignerRankNrpPerkap(parsed.sprin.signerRankNrp)
              : parsed.sprin.signerRankNrp,
            sprinContinuationHeaderLabel:
              parsed.sprin.sprinContinuationHeaderLabel ||
              'SPRIN KAPOLSEK SMG SELATAN',
            lampiranHeaderLabel:
              !parsed.sprin.lampiranHeaderLabel ||
              parsed.sprin.lampiranHeaderLabel ===
                'LAMPIRAN SPRIN KAPOLSEK SMG SLTN'
                ? 'LAMPIRAN SPRIN KAPOLSEK SMG SELATAN'
                : parsed.sprin.lampiranHeaderLabel,
            fontFamily: !parsed.defaultFontMigratedNarrow
              ? 'Arial Narrow'
              : parsed.sprin.fontFamily === 'Arial'
                ? 'Arial'
                : 'Arial Narrow',
          },
          biasa: {
            ...parsed.biasa,
            signerDelegation: parsed.biasa.signerDelegation ?? 'NONE',
            signerSuperiorTitle:
              parsed.biasa.signerSuperiorTitle || 'KAPOLRESTABES SEMARANG',
            signerMiddleTitle:
              parsed.biasa.signerMiddleTitle || 'WAKAPOLRESTABES SEMARANG',
            signerRankNrp: /NRP\s+NRP|^KOMPOL\b/i.test(
              parsed.biasa.signerRankNrp
            )
              ? normalizeSignerRankNrpPerkap(parsed.biasa.signerRankNrp)
              : parsed.biasa.signerRankNrp,
            page2HeaderLabel:
              !parsed.biasa.page2HeaderLabel ||
              parsed.biasa.page2HeaderLabel === 'SURAT KAPOLSEK SMG SLTN'
                ? 'SURAT KAPOLSEK SMG SELATAN'
                : parsed.biasa.page2HeaderLabel,
            fontFamily: !parsed.defaultFontMigratedNarrow
              ? 'Arial Narrow'
              : parsed.biasa.fontFamily === 'Arial'
                ? 'Arial'
                : 'Arial Narrow',
          },
          savedList: Array.isArray(parsed.savedList)
            ? parsed.savedList.slice(0, MAX_SAVED_SURAT)
            : [],
          defaultFontMigratedNarrow: true,
        };
      }
    }
  } catch {
    // Abaikan error storage
  }

  return {
    activeMode: 'SPRIN',
    sprin: createDefaultSprin(header, todayDateKey, personnel),
    biasa: createDefaultSuratBiasa(header, todayDateKey),
    savedList: [],
    defaultFontMigratedNarrow: true,
  };
}

export function BuatSuratView({
  header,
  onHeaderUpdated,
  todayDateKey,
  personnel,
  pawasAnchor,
  overrides,
}: BuatSuratViewProps) {
  const [state, setState] = useState<SuratStoredState>(() =>
    loadStoredSuratState(header, todayDateKey, personnel)
  );
  const [kopEditorOpen, setKopEditorOpen] = useState(false);

  const handleSaveKopHeader = (nextHeader: RosterOrgHeader) => {
    if (onHeaderUpdated) {
      onHeaderUpdated(nextHeader);
    }
    setState((prev) => ({
      ...prev,
      sprin: {
        ...prev.sprin,
        kopLine1: nextHeader.line1,
        kopLine2: nextHeader.line2,
        kopLine3: nextHeader.line3,
        signerTitle: `${nextHeader.signerTitle} POLRESTABES SEMARANG`,
        signerName: nextHeader.signerName,
        signerRankNrp: `${nextHeader.signerRank} ${nextHeader.signerNrp}`,
      },
      biasa: {
        ...prev.biasa,
        kopLine1: nextHeader.line1,
        kopLine2: nextHeader.line2,
        kopLine3: nextHeader.line3,
        signerTitle: `${nextHeader.signerTitle} POLRESTABES SEMARANG`,
        signerName: nextHeader.signerName,
        signerRankNrp: `${nextHeader.signerRank} ${nextHeader.signerNrp}`,
      },
    }));
  };

  // Jadwal Piket Picker state
  const [rosterDateKey, setRosterDateKey] = useState<string>(todayDateKey);
  const [rosterSearch, setRosterSearch] = useState<string>('');
  const [selectedRosterIds, setSelectedRosterIds] = useState<string[]>([]);
  const [showCustomPersonForm, setShowCustomPersonForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customPangkat, setCustomPangkat] = useState('');
  const [customNrp, setCustomNrp] = useState('');
  const [customJabatan, setCustomJabatan] = useState('');
  const [customKet, setCustomKet] = useState('SDA');
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedSprinTemplateId, setSelectedSprinTemplateId] =
    useState<string>('tpl-sprin-kryd-default');
  const [showSprinTemplates, setShowSprinTemplates] = useState<boolean>(true);
  const sprinJsonInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedBiasaTemplateId, setSelectedBiasaTemplateId] =
    useState<string>('tpl-dipa-polsek');
  const [showBiasaTemplates, setShowBiasaTemplates] = useState<boolean>(true);
  const biasaJsonInputRef = useRef<HTMLInputElement | null>(null);



  useEffect(() => {
    try {
      localStorage.setItem(SURAT_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Abaikan kuota penuh
    }
  }, [state]);



  const showNotice = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => {
      setNotice((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  const activeMode = state.activeMode;
  const currentRows =
    activeMode === 'SPRIN'
      ? state.sprin.personnelRows
      : state.biasa.personnelRows;

  // Hitung status piket tiap personel pada tanggal yang dipilih
  const rosterCandidates = useMemo(() => {
    const { year, monthIndex, day } = parseDateKeyParts(rosterDateKey);
    const monthPersonnel = getEffectivePersonnelForMonth(
      personnel,
      year,
      monthIndex
    );
    const q = rosterSearch.trim().toLowerCase();

    return monthPersonnel
      .map((p) => {
        const paused = isPersonPausedOnDate(p, rosterDateKey);
        const shift: ShiftCode = paused
          ? ''
          : getEffectiveShift(
              p,
              year,
              monthIndex,
              day,
              overrides,
              monthPersonnel,
              pawasAnchor
            ).code;
        return { person: p, shift, paused };
      })
      .filter(({ person }) => {
        if (!q) return true;
        return (
          person.name.toLowerCase().includes(q) ||
          person.jabatan.toLowerCase().includes(q) ||
          person.unit.toLowerCase().includes(q) ||
          person.pangkat.toLowerCase().includes(q)
        );
      });
  }, [personnel, rosterDateKey, overrides, pawasAnchor, rosterSearch]);

  const setActivePersonnelRows = (
    updater: (prev: SuratPersonRow[]) => SuratPersonRow[]
  ) => {
    setState((prev) => {
      if (prev.activeMode === 'SPRIN') {
        return {
          ...prev,
          sprin: {
            ...prev.sprin,
            personnelRows: updater(prev.sprin.personnelRows),
          },
        };
      }
      return {
        ...prev,
        biasa: {
          ...prev.biasa,
          personnelRows: updater(prev.biasa.personnelRows),
        },
      };
    });
  };

  const handleToggleCandidate = (id: string) => {
    setSelectedRosterIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleQuickFilterPick = (
    filterKind: 'ON_DUTY' | '24J' | 'SIANG' | 'MALAM' | 'ALL_VISIBLE' | 'CLEAR'
  ) => {
    if (filterKind === 'CLEAR') {
      setSelectedRosterIds([]);
      return;
    }
    if (filterKind === 'ALL_VISIBLE') {
      setSelectedRosterIds(rosterCandidates.map((c) => c.person.id));
      return;
    }

    const picked = rosterCandidates
      .filter((c) => {
        if (c.paused || !c.shift || c.shift === 'L') return false;
        if (filterKind === 'ON_DUTY') return true;
        if (filterKind === '24J') return c.shift === 'X' || c.shift === 'P';
        if (filterKind === 'SIANG') return c.shift === 'S';
        if (filterKind === 'MALAM') return c.shift === 'M';
        return false;
      })
      .map((c) => c.person.id);

    setSelectedRosterIds(picked);
    showNotice(
      `Terpilih ${picked.length} personel piket (${formatIndonesianTitleDate(rosterDateKey)}). Klik "Masukkan ke Surat" untuk menambahkan.`
    );
  };

  const handleAddSelectedToSurat = () => {
    if (selectedRosterIds.length === 0) return;
    const selectedSet = new Set(selectedRosterIds);
    const existingIds = new Set(
      currentRows.map((r) => r.sourcePersonnelId).filter(Boolean)
    );

    const toAdd = rosterCandidates
      .filter(
        (c) => selectedSet.has(c.person.id) && !existingIds.has(c.person.id)
      )
      .map((c, idx) => ({
        id: `surat_row_${c.person.id}_${Date.now().toString(36)}_${idx}`,
        sourcePersonnelId: c.person.id,
        name: normalizeSignerNamePerkap(c.person.name),
        pangkat: c.person.pangkat.trim().toUpperCase(),
        nrp: c.person.nrp.trim(),
        jabatan: c.person.jabatan.trim().toUpperCase(),
        ket: currentRows.length === 0 && idx === 0 ? 'PADAL' : 'SDA',
      }));

    if (toAdd.length === 0) {
      showNotice('Semua personel yang dicentang sudah ada di daftar surat.');
      return;
    }

    setActivePersonnelRows((prev) => [...prev, ...toAdd]);
    if (activeMode === 'BIASA') {
      setState((prev) => ({
        ...prev,
        biasa: { ...prev.biasa, includePersonnelTable: true },
      }));
    }
    setSelectedRosterIds([]);
    showNotice(`${toAdd.length} personel dari Jadwal Piket ditambahkan.`);
  };

  const handleInsertSelectedIntoBiasaText = () => {
    if (selectedRosterIds.length === 0) return;
    const selectedSet = new Set(selectedRosterIds);
    const picked = rosterCandidates.filter((c) => selectedSet.has(c.person.id));
    if (picked.length === 0) return;

    const formatted = picked
      .map(
        (c, idx) =>
          `${idx + 1}. ${c.person.pangkat.trim().toUpperCase()} ${normalizeSignerNamePerkap(c.person.name)} NRP ${c.person.nrp} (${c.person.jabatan.trim().toUpperCase()})`
      )
      .join('\n');

    setState((prev) => ({
      ...prev,
      biasa: {
        ...prev.biasa,
        paragraphsPage1: [
          ...prev.biasa.paragraphsPage1,
          `Daftar Personel:\n${formatted}`,
        ],
      },
    }));
    setSelectedRosterIds([]);
    showNotice(
      `${picked.length} nama personel disisipkan langsung ke isi Surat Biasa.`
    );
  };

  const handleAddCustomPerson = (e: FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    const newRow: SuratPersonRow = {
      id: `surat_manual_${Date.now().toString(36)}`,
      name: normalizeSignerNamePerkap(customName),
      pangkat: customPangkat.trim().toUpperCase(),
      nrp: customNrp.trim(),
      jabatan: customJabatan.trim().toUpperCase(),
      ket: customKet.trim().toUpperCase() || 'SDA',
    };
    setActivePersonnelRows((prev) => [...prev, newRow]);
    if (activeMode === 'BIASA') {
      setState((prev) => ({
        ...prev,
        biasa: { ...prev.biasa, includePersonnelTable: true },
      }));
    }
    setCustomName('');
    setCustomPangkat('');
    setCustomNrp('');
    setCustomJabatan('');
    setCustomKet('SDA');
    setShowCustomPersonForm(false);
    showNotice(`${newRow.name} ditambahkan ke daftar surat.`);
  };

  const handleMoveRow = (idx: number, delta: -1 | 1) => {
    const targetIdx = idx + delta;
    if (targetIdx < 0 || targetIdx >= currentRows.length) return;
    setActivePersonnelRows((prev) => {
      const next = [...prev];
      [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
      return next;
    });
  };

  const handleRemoveRow = (rowId: string) => {
    setActivePersonnelRows((prev) => prev.filter((r) => r.id !== rowId));
  };

  const [bulkKetInput, setBulkKetInput] = useState('SDA');

  const handleApplyBulkKet = () => {
    const val = bulkKetInput.trim().toUpperCase();
    if (!val) return;
    setActivePersonnelRows((prev) =>
      prev.map((r) => ({ ...r, ket: val }))
    );
    showNotice(`Keterangan seluruh personel terlampir diubah menjadi "${val}".`);
  };

  const handleUpdateRowField = (
    rowId: string,
    patch: Partial<SuratPersonRow>
  ) => {
    setActivePersonnelRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, ...patch } : r))
    );
  };

  const handleResetTemplate = () => {
    setState((prev) => ({
      ...prev,
      sprin:
        prev.activeMode === 'SPRIN'
          ? createDefaultSprin(header, todayDateKey, personnel)
          : prev.sprin,
      biasa:
        prev.activeMode === 'BIASA'
          ? createDefaultSuratBiasa(header, todayDateKey)
          : prev.biasa,
    }));
    if (activeMode === 'SPRIN') {
      setSelectedSprinTemplateId('tpl-sprin-kryd-default');
    } else {
      setSelectedBiasaTemplateId('tpl-dipa-polsek');
    }
    showNotice(
      `Template ${activeMode === 'SPRIN' ? 'Surat Perintah' : 'Surat Biasa'} dimuat ulang sesuai contoh resmi.`
    );
  };

  const handleApplySprinTemplate = (
    tpl: SuratPerintahTemplateItem,
    useCurrentDate = false
  ) => {
    const nextData = tpl.buildData(header, todayDateKey, personnel, {
      useCurrentDate,
      fontFamily: state.sprin.fontFamily ?? 'Arial Narrow',
    });
    setState((prev) => ({
      ...prev,
      activeMode: 'SPRIN',
      sprin: nextData,
    }));
    setSelectedSprinTemplateId(tpl.id);
    showNotice(
      useCurrentDate
        ? `Template "${tpl.title}" dimuat dengan tanggal hari ini (${formatIndonesianTitleDate(todayDateKey)}).`
        : `Template "${tpl.title}" (${nextData.personnelRows.length} personel) dimuat ke editor Surat Perintah.`
    );
  };

  const handleExportSprinJson = () => {
    const blob = new Blob([JSON.stringify(state.sprin, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Template_Sprin_${state.sprin.nomor.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotice('Draf Surat Perintah berhasil diekspor ke berkas JSON.');
  };

  const handleImportSprinJsonFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const imported = parseImportedSprinJson(
        text,
        header,
        personnel,
        state.sprin.fontFamily ?? 'Arial Narrow'
      );
      if (!imported) {
        showNotice(
          'Format JSON tidak dikenali. Gunakan JSON draf Surat Perintah atau JSON hasil ekstraksi template Sprin DOCX.'
        );
        return;
      }
      setState((prev) => ({
        ...prev,
        activeMode: 'SPRIN',
        sprin: imported,
      }));
      setSelectedSprinTemplateId('imported-json');
      showNotice(
        `Template "${file.name}" (${imported.personnelRows.length} personel) berhasil dimuat ke editor Surat Perintah.`
      );
    } catch {
      showNotice('Gagal membaca berkas JSON.');
    } finally {
      e.target.value = '';
    }
  };

  const handleApplyBiasaTemplate = (
    tpl: SuratBiasaTemplateItem,
    useCurrentSatkerKopSigner = false
  ) => {
    const nextData = tpl.buildData(header, todayDateKey, {
      useCurrentSatkerKopSigner,
      fontFamily: state.biasa.fontFamily ?? 'Arial Narrow',
    });
    setState((prev) => ({
      ...prev,
      activeMode: 'BIASA',
      biasa: nextData,
    }));
    setSelectedBiasaTemplateId(tpl.id);
    showNotice(
      useCurrentSatkerKopSigner
        ? `Template "${tpl.title}" dimuat dengan Kop & Penandatangan satker aktif.`
        : `Template "${tpl.title}" dimuat ke editor Surat Biasa.`
    );
  };

  const handleExportBiasaJson = () => {
    const blob = new Blob([JSON.stringify(state.biasa, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Template_Surat_Biasa_${state.biasa.nomor.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotice('Draf Surat Biasa berhasil diekspor ke berkas JSON.');
  };

  const handleImportBiasaJsonFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const imported = parseImportedSuratBiasaJson(
        text,
        state.biasa.fontFamily ?? 'Arial Narrow'
      );
      if (!imported) {
        showNotice(
          'Format JSON tidak dikenali. Gunakan JSON draf Surat Biasa atau ekspor dari Template Surat Biasa.'
        );
        return;
      }
      setState((prev) => ({
        ...prev,
        activeMode: 'BIASA',
        biasa: imported,
      }));
      setSelectedBiasaTemplateId('imported-json');
      showNotice(`Draf "${file.name}" berhasil dimuat ke editor Surat Biasa.`);
    } catch {
      showNotice('Gagal membaca berkas JSON.');
    } finally {
      e.target.value = '';
    }
  };

  const handleSaveSurat = () => {
    const nowIso = new Date().toISOString();
    const title =
      activeMode === 'SPRIN'
        ? `${state.sprin.nomor} · ${state.sprin.lampiranTitle}`
        : `${state.biasa.nomor} · ${state.biasa.perihal}`;

    const item: SavedSuratItem = {
      id: `surat_${Date.now().toString(36)}_${Math.random()
        .toString(36)
        .slice(2, 5)}`,
      mode: activeMode,
      title,
      savedAt: nowIso,
      sprinData:
        activeMode === 'SPRIN'
          ? JSON.parse(JSON.stringify(state.sprin))
          : undefined,
      biasaData:
        activeMode === 'BIASA'
          ? JSON.parse(JSON.stringify(state.biasa))
          : undefined,
    };

    setState((prev) => ({
      ...prev,
      savedList: [item, ...prev.savedList].slice(0, MAX_SAVED_SURAT),
    }));
    showNotice('Surat berhasil disimpan ke riwayat arsip.');
  };

  const handleLoadSaved = (saved: SavedSuratItem) => {
    setState((prev) => ({
      ...prev,
      activeMode: saved.mode,
      sprin: saved.sprinData ? saved.sprinData : prev.sprin,
      biasa: saved.biasaData ? saved.biasaData : prev.biasa,
    }));
    showNotice(`Membuka arsip: ${saved.title}`);
  };

  const handleDeleteSaved = (id: string) => {
    setState((prev) => ({
      ...prev,
      savedList: prev.savedList.filter((s) => s.id !== id),
    }));
  };

  const handleDownloadDocx = async () => {
    setBusyAction('docx');
    try {
      const blob =
        activeMode === 'SPRIN'
          ? await generateSprinDocxBlob(state.sprin)
          : await generateSuratBiasaDocxBlob(state.biasa);
      const base =
        activeMode === 'SPRIN'
          ? `surat-perintah-${sanitizeFilename(state.sprin.nomor) || 'sprin'}`
          : `surat-biasa-${sanitizeFilename(state.biasa.nomor) || 'surat'}`;
      triggerBlobDownload(blob, `${base}.docx`);
      showNotice(`File Word (${base}.docx) berhasil diunduh.`);
    } catch {
      showNotice('Terjadi kendala saat membuat file DOCX.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleDownloadPdf = async () => {
    setBusyAction('pdf');
    try {
      const blob =
        activeMode === 'SPRIN'
          ? await generateSprinPdfBlob(state.sprin)
          : await generateSuratBiasaPdfBlob(state.biasa);
      const base =
        activeMode === 'SPRIN'
          ? `surat-perintah-${sanitizeFilename(state.sprin.nomor) || 'sprin'}`
          : `surat-biasa-${sanitizeFilename(state.biasa.nomor) || 'surat'}`;
      triggerBlobDownload(blob, `${base}.pdf`);
      showNotice(`File PDF (${base}.pdf) berhasil diunduh.`);
    } catch {
      showNotice('Terjadi kendala saat membuat file PDF.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleSharePdf = async () => {
    setBusyAction('share');
    try {
      const blob =
        activeMode === 'SPRIN'
          ? await generateSprinPdfBlob(state.sprin)
          : await generateSuratBiasaPdfBlob(state.biasa);
      const base =
        activeMode === 'SPRIN'
          ? `surat-perintah-${sanitizeFilename(state.sprin.nomor) || 'sprin'}`
          : `surat-biasa-${sanitizeFilename(state.biasa.nomor) || 'surat'}`;
      const file = new File([blob], `${base}.pdf`, { type: 'application/pdf' });
      const nav = navigator as Navigator & {
        canShare?: (data: ShareData) => boolean;
        share?: (data: ShareData) => Promise<void>;
      };

      if (
        typeof nav.share === 'function' &&
        typeof nav.canShare === 'function' &&
        nav.canShare({ files: [file] })
      ) {
        await nav.share({
          files: [file],
          title:
            activeMode === 'SPRIN' ? state.sprin.nomor : state.biasa.perihal,
        });
        showNotice(`File ${base}.pdf dibagikan.`);
      } else {
        triggerBlobDownload(blob, `${base}.pdf`);
        showNotice(
          `File ${base}.pdf diunduh otomatis karena browser ini belum mendukung menu Bagikan file.`
        );
      }
    } catch (err) {
      if (!(err instanceof Error && err.name === 'AbortError')) {
        showNotice('Gagal membagikan file PDF.');
      }
    } finally {
      setBusyAction(null);
    }
  };

  const previewPages: A4PreviewPage[] = useMemo(
    () =>
      activeMode === 'SPRIN'
        ? buildSprinA4Pages(state.sprin)
        : buildSuratBiasaA4Pages(state.biasa),
    [activeMode, state.sprin, state.biasa]
  );

  const renderA4PreviewBlock = (block: A4PreviewBlock, key: string) => {
    if (block.kind === 'sprin_header') {
      return (
        <div key={key} className="space-y-3 mb-2">
          <div className="inline-block text-center text-[10.5pt] leading-[1.3]">
            <div>{block.kopLine1}</div>
            <div>{block.kopLine2}</div>
            <div className="border-b border-black pb-0.5">{block.kopLine3}</div>
          </div>
          <div className="flex flex-col items-center pt-1">
            <img
              src={TRIBRATA_LOGO_URL}
              alt="Tribrata"
              className="w-11 h-11 object-contain grayscale contrast-150 brightness-75 mb-1"
            />
            <div className="underline font-normal tracking-wide">
              SURAT PERINTAH
            </div>
            <div>Nomor : {block.nomor}</div>
          </div>
        </div>
      );
    }

    if (block.kind === 'sprin_line') {
      const { item } = block;
      const gapClass =
        (item.gapAfterMm ?? 0) >= 2.5
          ? 'mb-2'
          : (item.gapAfterMm ?? 0) >= 1
            ? 'mb-1'
            : '';
      return (
        <div key={key} className={`flex items-start leading-[1.42] ${gapClass}`}>
          <div className="w-28 shrink-0">{item.label ?? ''}</div>
          <div className="w-4 shrink-0">{item.showColon ? ':' : ''}</div>
          {(item.numPrefix || item.indentUnderNum) && (
            <div className="w-6 shrink-0">{item.numPrefix ?? ''}</div>
          )}
          <div className="flex-1">
            <span className={item.underline ? 'underline' : undefined}>
              {item.text}
            </span>
          </div>
        </div>
      );
    }

    if (block.kind === 'sprin_center_heading') {
      return (
        <div key={key} className="text-center py-2 tracking-wide">
          {block.text}
        </div>
      );
    }

    if (block.kind === 'sprin_selesai') {
      return (
        <div key={key} className="pt-1 pb-2">
          Selesai.
        </div>
      );
    }

    if (block.kind === 'biasa_header') {
      const d = block.data;
      return (
        <div key={key} className="space-y-4 mb-2">
          {/* Kop surat kiri atas center alignment (logo s.d. alamat) + Tempat & Tanggal sebaris alamat kop, sejajar vertikal dengan Yth. */}
          <div className="flex justify-between items-end gap-4">
            <div className="inline-flex flex-col items-center text-center text-[10.5pt] leading-[1.3]">
              <img
                src={TRIBRATA_LOGO_URL}
                alt="Tribrata"
                className="w-11 h-11 object-contain grayscale contrast-150 brightness-75 mb-1"
              />
              <div>{d.kopLine1}</div>
              <div>{d.kopLine2}</div>
              {d.kopLine3.trim() && <div>{d.kopLine3}</div>}
              <div className="border-b border-black pb-0.5">{d.kopAddress}</div>
            </div>

            <div className="w-[66mm] shrink-0 pb-0.5">
              <div>{d.dateRightText}</div>
            </div>
          </div>

          {/* 2 baris di bawah kop naskah dinas: Kepada sebaris dengan Hal; Yth. sejajar vertikal dengan Tempat & Tanggal */}
          <div className="pt-3 space-y-0.5">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex">
                  <span className="w-24 shrink-0">Nomor</span>
                  <span className="w-3 shrink-0">:</span>
                  <span className="flex-1">{d.nomor}</span>
                </div>
                <div className="flex">
                  <span className="w-24 shrink-0">Klasifikasi</span>
                  <span className="w-3 shrink-0">:</span>
                  <span className="flex-1">{d.klasifikasi}</span>
                </div>
                <div className="flex">
                  <span className="w-24 shrink-0">Lampiran</span>
                  <span className="w-3 shrink-0">:</span>
                  <span className="flex-1">{d.lampiran}</span>
                </div>
              </div>
              <div className="w-[66mm] shrink-0" />
            </div>

            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex">
                  <span className="w-24 shrink-0">Hal</span>
                  <span className="w-3 shrink-0">:</span>
                  <span className="flex-1">{d.perihal}</span>
                </div>
              </div>

              <div className="w-[66mm] shrink-0 space-y-0.5">
                <div className="pl-[9mm]">Kepada</div>
                <div className="flex items-start">
                  <span className="w-[9mm] shrink-0">Yth.</span>
                  <span className="flex-1 whitespace-pre-line">{d.kepadaYth}</span>
                </div>
                <div className="pl-[9mm] pt-1">di</div>
                <div className="pl-[9mm]">{d.diKota}</div>
              </div>
            </div>
          </div>

          {d.upText.trim() && <div className="pl-4 pt-1">{d.upText}</div>}
        </div>
      );
    }

    if (block.kind === 'biasa_line') {
      const { item } = block;
      if (!item.text && !item.marker) {
        return <div key={key} className="h-2" />;
      }
      const gapClass =
        (item.gapAfterMm ?? 0) >= 2.5
          ? 'mb-2'
          : (item.gapAfterMm ?? 0) >= 1
            ? 'mb-0.5'
            : '';
      return (
        <div
          key={key}
          className={`relative leading-[1.42] ${gapClass}`}
          style={{ paddingLeft: `${item.textIndentMm}mm` }}
        >
          {item.marker && (
            <span
              className="absolute top-0"
              style={{ left: `${item.markerIndentMm}mm` }}
            >
              {item.marker}
            </span>
          )}
          <span>{item.text}</span>
        </div>
      );
    }

    if (block.kind === 'lampiran_header') {
      return (
        <div key={key} className="space-y-3 mb-2">
          <div className="flex justify-between items-start gap-4">
            <div className="text-center text-[9.5pt] leading-[1.25]">
              <div>{block.kopLine1}</div>
              <div>{block.kopLine2}</div>
              <div className="border-b border-black pb-0.5">
                {block.kopLine3}
              </div>
            </div>

            <div className="text-left text-[9.5pt] leading-tight">
              <div>{block.rightHeader.label}</div>
              <div>NOMOR : {block.rightHeader.nomor}</div>
              <div className="border-b border-black pb-0.5">
                TANGGAL: {block.rightHeader.tanggalUpper}
              </div>
            </div>
          </div>

          <div className="text-center">
            <div>{block.title}</div>
            <div className="underline">{block.subtitle}</div>
          </div>
        </div>
      );
    }

    if (block.kind === 'table_title') {
      return (
        <div key={key} className="text-center font-bold pt-1 pb-1.5">
          {block.text}
        </div>
      );
    }

    if (block.kind === 'personnel_table') {
      return (
        <div key={key} className="my-1.5">
          <table className="w-full border-collapse border border-black text-[10.5px]">
            <thead>
              <tr>
                <th className="border border-black px-1.5 py-1 font-normal">
                  NO
                </th>
                <th className="border border-black px-2 py-1 font-normal">
                  NAMA
                </th>
                <th className="border border-black px-1.5 py-1 font-normal">
                  PANGKAT
                </th>
                <th className="border border-black px-1.5 py-1 font-normal">
                  NRP
                </th>
                <th className="border border-black px-2 py-1 font-normal">
                  JABATAN
                </th>
                <th className="border border-black px-1.5 py-1 font-normal">
                  KET
                </th>
              </tr>
              {block.withNumberSubRow && (
                <tr>
                  <th className="border border-black px-1.5 py-0.5 font-normal">
                    1
                  </th>
                  <th className="border border-black px-2 py-0.5 font-normal">
                    2
                  </th>
                  <th className="border border-black px-1.5 py-0.5 font-normal">
                    3
                  </th>
                  <th className="border border-black px-1.5 py-0.5 font-normal">
                    4
                  </th>
                  <th className="border border-black px-2 py-0.5 font-normal">
                    5
                  </th>
                  <th className="border border-black px-1.5 py-0.5 font-normal"></th>
                </tr>
              )}
            </thead>
            <tbody>
              {block.rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="border border-black px-2 py-4 text-center text-slate-500"
                  >
                    Belum ada personel. Pilih nama dari Jadwal Piket di atas.
                  </td>
                </tr>
              ) : (
                block.rows.map((entry) => (
                  <tr key={`${key}_r_${entry.no}_${entry.row.id}`}>
                    <td className="border border-black px-1.5 py-1 text-center">
                      {entry.no}
                    </td>
                    <td className="border border-black px-2 py-1 text-left">
                      {entry.row.name}
                    </td>
                    <td className="border border-black px-1.5 py-1 text-center">
                      {entry.row.pangkat}
                    </td>
                    <td className="border border-black px-1.5 py-1 text-center">
                      {entry.row.nrp}
                    </td>
                    <td className="border border-black px-2 py-1 text-center">
                      {entry.row.jabatan}
                    </td>
                    <td className="border border-black px-1.5 py-1 text-center">
                      {entry.row.ket || block.defaultEmptyKet}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      );
    }

    if (block.kind === 'signature_tembusan') {
      const hasIssued = Boolean(block.issuedPlace && block.issuedDateText);
      const isMultiTitle = block.signerTitleLines.length > 1;
      return (
        <div key={key} className="pt-3">
          <div className="flex justify-end">
            <div className="inline-flex flex-col items-center max-w-full">
              {hasIssued && (
                <div className="inline-block text-left mb-1">
                  <div>Dikeluarkan di : {block.issuedPlace}</div>
                  <div className="border-b border-black pb-0.5">
                    Pada tanggal &nbsp;&nbsp;: {block.issuedDateText}
                  </div>
                </div>
              )}
              <div className="w-full">
                {block.signerTitleLines.map((tLine, idx) => (
                  <div
                    key={`${key}_st_${idx}`}
                    className={
                      isMultiTitle
                        ? 'text-center whitespace-nowrap'
                        : 'text-right whitespace-nowrap'
                    }
                  >
                    {tLine.text}
                  </div>
                ))}
              </div>
              <div className="h-14" />
              <div className="text-center">
                <div className="underline">{block.signerName}</div>
                <div>{block.signerRankNrp}</div>
              </div>
            </div>
          </div>

          {block.tembusan.length > 0 && (
            <div className="-mt-8">
              <div>Tembusan :</div>
              {block.tembusan.map((t, idx) => (
                <div key={`${key}_t_${idx}`} className="relative pl-[7mm]">
                  <span className="absolute left-0 top-0">{idx + 1}.</span>
                  <span>{t}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header & Submenu Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            BUAT SURAT DINAS POLRI
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Penyusunan Surat Perintah dan Surat Biasa ukuran A4 (Arial Narrow /
            Arial 12 pt) siap ekspor <strong>.docx</strong> &amp;{' '}
            <strong>.pdf</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setKopEditorOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors shadow-xs"
          >
            <span>⚙️ Editor Kop Surat</span>
          </button>

          <div
            role="tablist"
            aria-label="Submenu Buat Surat"
            className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 self-start"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeMode === 'SPRIN'}
              onClick={() =>
                setState((prev) => ({ ...prev, activeMode: 'SPRIN' }))
              }
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
                activeMode === 'SPRIN'
                  ? 'bg-slate-900 text-amber-300 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>SURAT PERINTAH</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeMode === 'BIASA'}
              onClick={() =>
                setState((prev) => ({ ...prev, activeMode: 'BIASA' }))
              }
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
                activeMode === 'BIASA'
                  ? 'bg-slate-900 text-emerald-300 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>SURAT BIASA</span>
            </button>
          </div>
        </div>
      </div>

      {/* Status Notice */}
      {notice && (
        <div
          role="status"
          className="px-4 py-2.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-950 text-xs font-medium flex items-center justify-between gap-3"
        >
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-amber-700 hover:text-amber-950 font-semibold shrink-0"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Action Bar: DOCX, PDF, Share, Save, Reset */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadDocx}
            disabled={busyAction !== null}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60 rounded-lg transition-colors"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>
              {busyAction === 'docx' ? 'Membuat DOCX...' : 'Unduh Word (.docx)'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={busyAction !== null}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 disabled:opacity-60 rounded-lg transition-colors"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>
              {busyAction === 'pdf' ? 'Membuat PDF...' : 'Unduh PDF (.pdf)'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleSharePdf}
            disabled={busyAction !== null}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Bagikan PDF / WA</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSaveSurat}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <BookmarkCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Simpan Arsip</span>
          </button>

          <button
            type="button"
            onClick={handleResetTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Muat Contoh Template</span>
          </button>
        </div>
      </div>

      {/* Picker: Pilih Nama Langsung dari Jadwal Piket */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
            <Users className="w-4 h-4 text-amber-600" />
            <span>
              Pilih Nama Personel Langsung dari Jadwal Piket (
              {currentRows.length} terlampir)
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowCustomPersonForm((v) => !v)}
            className="text-xs font-semibold text-blue-700 hover:text-blue-900"
          >
            {showCustomPersonForm
              ? 'Tutup Input Manual'
              : '+ Tambah Nama Manual'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end">
          <div className="md:col-span-3 space-y-1">
            <label className="text-[11px] font-medium text-slate-600 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-amber-600" />
              <span>Tanggal Jadwal Piket</span>
            </label>
            <input
              type="date"
              value={rosterDateKey}
              onChange={(e) => setRosterDateKey(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900"
            />
          </div>

          <div className="md:col-span-5 space-y-1">
            <label className="text-[11px] font-medium text-slate-600">
              Cari Nama / Unit / Jabatan
            </label>
            <input
              type="text"
              value={rosterSearch}
              onChange={(e) => setRosterSearch(e.target.value)}
              placeholder="Cari nama, unit (PAWAS, SAMAPTA, RESKRIM)..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div className="md:col-span-4 flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={handleAddSelectedToSurat}
              disabled={selectedRosterIds.length === 0}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 rounded-lg transition-colors whitespace-nowrap"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>
                Masukkan ke Tabel ({selectedRosterIds.length})
              </span>
            </button>

            {activeMode === 'BIASA' && (
              <button
                type="button"
                onClick={handleInsertSelectedIntoBiasaText}
                disabled={selectedRosterIds.length === 0}
                className="inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 disabled:opacity-40 rounded-lg whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Sisipkan ke Isi</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Shift Selection Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-slate-500 mr-1">
            Centang cepat:
          </span>
          <button
            type="button"
            onClick={() => handleQuickFilterPick('ON_DUTY')}
            className="px-2.5 py-1 text-[11px] font-semibold bg-slate-900 text-amber-300 hover:bg-slate-800 rounded-md"
          >
            Semua Piket Tanggal Ini
          </button>
          <button
            type="button"
            onClick={() => handleQuickFilterPick('24J')}
            className="px-2.5 py-1 text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 rounded-md"
          >
            Piket 24J (X &amp; P)
          </button>
          <button
            type="button"
            onClick={() => handleQuickFilterPick('SIANG')}
            className="px-2.5 py-1 text-[11px] font-semibold bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 rounded-md"
          >
            Piket Siang (S)
          </button>
          <button
            type="button"
            onClick={() => handleQuickFilterPick('MALAM')}
            className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-300 hover:bg-slate-200 rounded-md"
          >
            Piket Malam (M)
          </button>
          <button
            type="button"
            onClick={() => handleQuickFilterPick('ALL_VISIBLE')}
            className="px-2.5 py-1 text-[11px] font-medium bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 rounded-md"
          >
            Pilih Semua ({rosterCandidates.length})
          </button>
          {selectedRosterIds.length > 0 && (
            <button
              type="button"
              onClick={() => handleQuickFilterPick('CLEAR')}
              className="px-2.5 py-1 text-[11px] font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-md"
            >
              Reset Centang
            </button>
          )}
        </div>

        {/* Multi-select Checklist */}
        <div className="max-h-52 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
          {rosterCandidates.map(({ person, shift, paused }) => {
            const checked = selectedRosterIds.includes(person.id);
            const alreadyInRows = currentRows.some(
              (r) => r.sourcePersonnelId === person.id
            );
            return (
              <label
                key={person.id}
                className={`flex items-center gap-2.5 px-3 py-1.5 text-xs cursor-pointer transition-colors ${
                  checked ? 'bg-amber-50' : 'bg-white hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => handleToggleCandidate(person.id)}
                  className="w-4 h-4 rounded border-slate-300 text-amber-600 shrink-0"
                />
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                  {person.unit} · {paused ? 'JEDA' : shift || '-'}
                </span>
                <span className="font-semibold text-slate-900 truncate">
                  {person.pangkat} {person.name}
                </span>
                <span className="text-slate-500 truncate hidden sm:inline">
                  — {person.jabatan}
                </span>
                {alreadyInRows && (
                  <span className="ml-auto text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded shrink-0">
                    Sudah di daftar
                  </span>
                )}
              </label>
            );
          })}
        </div>

        {showCustomPersonForm && (
          <form
            onSubmit={handleAddCustomPerson}
            className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2 items-end"
          >
            <input
              type="text"
              required
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="NAMA *"
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
            />
            <input
              type="text"
              value={customPangkat}
              onChange={(e) => setCustomPangkat(e.target.value)}
              placeholder="PANGKAT"
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
            />
            <input
              type="text"
              value={customNrp}
              onChange={(e) => setCustomNrp(e.target.value)}
              placeholder="NRP"
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
            />
            <input
              type="text"
              value={customJabatan}
              onChange={(e) => setCustomJabatan(e.target.value)}
              placeholder="JABATAN"
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
            />
            <input
              type="text"
              value={customKet}
              onChange={(e) => setCustomKet(e.target.value)}
              placeholder="KET (PADAL/SDA)"
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
            />
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              Simpan Baris
            </button>
          </form>
        )}

        {/* Active Personnel Rows Editor */}
        {currentRows.length > 0 && (
          <div className="pt-2 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-[11px] font-bold uppercase tracking-wide text-slate-700">
                Daftar Personel Terlampir ({currentRows.length}) · Kolom Keterangan Dapat Diedit
              </span>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={bulkKetInput}
                  onChange={(e) => setBulkKetInput(e.target.value)}
                  placeholder="Atur Ket masal (misal: SDA)..."
                  className="px-2.5 py-1 text-xs border border-slate-300 rounded-md bg-white w-40"
                />
                <button
                  type="button"
                  onClick={handleApplyBulkKet}
                  className="px-2.5 py-1 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-md"
                >
                  Terapkan Masal
                </button>
                <button
                  type="button"
                  onClick={() => setActivePersonnelRows(() => [])}
                  className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:text-rose-800 bg-rose-50 border border-rose-200 rounded-md"
                >
                  Kosongkan
                </button>
              </div>
            </div>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700">
                    <th className="px-2 py-1.5 text-center w-9">NO</th>
                    <th className="px-2 py-1.5 text-left">NAMA</th>
                    <th className="px-2 py-1.5 text-center">PANGKAT</th>
                    <th className="px-2 py-1.5 text-center">NRP</th>
                    <th className="px-2 py-1.5 text-left">JABATAN</th>
                    <th className="px-2 py-1.5 text-left w-72">KET</th>
                    <th className="px-2 py-1.5 text-center w-20">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {currentRows.map((row, idx) => (
                    <tr key={row.id} className="hover:bg-slate-50">
                      <td className="px-2 py-1 text-center font-mono text-slate-600">
                        {idx + 1}
                      </td>
                      <td className="px-2 py-1 font-semibold text-slate-900 whitespace-nowrap">
                        {row.name}
                      </td>
                      <td className="px-2 py-1 text-center whitespace-nowrap">
                        {row.pangkat}
                      </td>
                      <td className="px-2 py-1 text-center font-mono whitespace-nowrap">
                        {row.nrp}
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap">
                        {row.jabatan}
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="text"
                          value={row.ket}
                          onChange={(e) =>
                            handleUpdateRowField(row.id, {
                              ket: e.target.value,
                            })
                          }
                          className="w-full min-w-[240px] px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white focus:outline-none focus:border-blue-600"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <div className="flex items-center justify-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => handleMoveRow(idx, -1)}
                            disabled={idx === 0}
                            className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveRow(idx, 1)}
                            disabled={idx === currentRows.length - 1}
                            className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(row.id)}
                            className="p-1 text-rose-500 hover:text-rose-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Pustaka Template Surat Perintah */}
      {activeMode === 'SPRIN' && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-900">
                <BookOpen className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Pustaka Template Surat Perintah (
                  {SURAT_PERINTAH_TEMPLATES.length} Template Siap Pakai)
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                Pilih template Surat Perintah bawaan atau template Sprin KRYD
                169 (17 Oktober 2026) beserta daftar personel lampirannya, lalu
                sesuaikan di formulir di bawah.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <input
                ref={sprinJsonInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleImportSprinJsonFile}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => sprinJsonInputRef.current?.click()}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Impor JSON</span>
              </button>
              <button
                type="button"
                onClick={handleExportSprinJson}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Ekspor JSON</span>
              </button>
              <button
                type="button"
                onClick={() => setShowSprinTemplates((v) => !v)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
              >
                {showSprinTemplates ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" />
                    <span>Sembunyikan</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span>
                      Tampilkan ({SURAT_PERINTAH_TEMPLATES.length})
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {showSprinTemplates && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
              {SURAT_PERINTAH_TEMPLATES.map((tpl) => {
                const isSelected = selectedSprinTemplateId === tpl.id;
                return (
                  <div
                    key={tpl.id}
                    className={`rounded-lg border p-3 flex flex-col justify-between gap-2.5 transition-colors ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/40'
                        : 'border-slate-200 bg-slate-50/60 hover:bg-white'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2 text-[10px] font-semibold text-slate-500">
                        <span className="uppercase tracking-wide text-amber-800">
                          {tpl.category}
                        </span>
                        <span className="font-mono">
                          {tpl.personnelCount} personel
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-900 leading-snug">
                        {tpl.title}
                      </div>
                      <div className="text-[10.5px] font-mono text-slate-600 truncate">
                        {tpl.previewNomor}
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-2 leading-snug">
                        {tpl.previewSubtitle}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200/80">
                      <button
                        type="button"
                        onClick={() => handleApplySprinTemplate(tpl, false)}
                        className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-md whitespace-nowrap transition-colors"
                      >
                        <FolderOpen className="w-3 h-3" />
                        <span>Gunakan Template</span>
                      </button>
                      {tpl.id !== 'tpl-sprin-kryd-default' && (
                        <button
                          type="button"
                          onClick={() => handleApplySprinTemplate(tpl, true)}
                          title="Muat isi & daftar personel template sambil menyesuaikan tanggal surat & lampiran ke hari ini"
                          className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-md whitespace-nowrap transition-colors"
                        >
                          <span>+ Tanggal Hari Ini</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Pustaka Template Surat Biasa (termasuk referensi B/14381 & preset operasional) */}
      {activeMode === 'BIASA' && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-900">
                <BookOpen className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>
                  Pustaka Template Surat Biasa ({SURAT_BIASA_TEMPLATES.length}{' '}
                  Template Siap Pakai)
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                Pilih template bawaan Polsek atau template Jukrah / Arahan
                Teknis (termasuk referensi B/14381/XI/OPS.2.1./2026/Roops), lalu
                sesuaikan isinya di formulir di bawah.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <input
                ref={biasaJsonInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleImportBiasaJsonFile}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => biasaJsonInputRef.current?.click()}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Impor JSON</span>
              </button>
              <button
                type="button"
                onClick={handleExportBiasaJson}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Ekspor JSON</span>
              </button>
              <button
                type="button"
                onClick={() => setShowBiasaTemplates((v) => !v)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
              >
                {showBiasaTemplates ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" />
                    <span>Sembunyikan</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span>Tampilkan ({SURAT_BIASA_TEMPLATES.length})</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {showBiasaTemplates && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5 pt-1">
              {SURAT_BIASA_TEMPLATES.map((tpl) => {
                const isSelected = selectedBiasaTemplateId === tpl.id;
                return (
                  <div
                    key={tpl.id}
                    className={`rounded-lg border p-3 flex flex-col justify-between gap-2.5 transition-colors ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/40'
                        : 'border-slate-200 bg-slate-50/60 hover:bg-white'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2 text-[10px] font-semibold text-slate-500">
                        <span className="uppercase tracking-wide text-emerald-800">
                          {tpl.category}
                        </span>
                        <span className="font-mono">
                          {tpl.directiveCount} poin
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-900 leading-snug">
                        {tpl.title}
                      </div>
                      <div className="text-[10.5px] font-mono text-slate-600 truncate">
                        {tpl.previewNomor}
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-2 leading-snug">
                        Hal: {tpl.previewHal}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200/80">
                      <button
                        type="button"
                        onClick={() => handleApplyBiasaTemplate(tpl, false)}
                        className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-md whitespace-nowrap transition-colors"
                      >
                        <FolderOpen className="w-3 h-3" />
                        <span>Gunakan Template</span>
                      </button>
                      {tpl.id !== 'tpl-dipa-polsek' && (
                        <button
                          type="button"
                          onClick={() => handleApplyBiasaTemplate(tpl, true)}
                          title="Muat isi & struktur template sambil menyesuaikan Kop dan Pejabat Penandatangan ke satker aktif"
                          className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-md whitespace-nowrap transition-colors"
                        >
                          <span>+ Kop Satker</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Form Editor + Live Preview Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Form Editor (5 cols) */}
        <div className="xl:col-span-5 bg-white border border-slate-200 rounded-xl p-4 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2">
            Isi Dokumen {activeMode === 'SPRIN' ? 'Surat Perintah' : 'Surat Biasa'}
          </h3>

          {activeMode === 'SPRIN' ? (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">
                    Nomor Surat Perintah
                  </label>
                  <input
                    type="text"
                    value={state.sprin.nomor}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        sprin: { ...prev.sprin, nomor: e.target.value },
                      }))
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">
                    Tanggal Dikeluarkan
                  </label>
                  <input
                    type="text"
                    value={state.sprin.issuedDateText}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        sprin: {
                          ...prev.sprin,
                          issuedDateText: e.target.value,
                        },
                      }))
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-600">
                  Jenis &amp; Ukuran Huruf
                </label>
                <select
                  value={state.sprin.fontFamily ?? 'Arial Narrow'}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      sprin: {
                        ...prev.sprin,
                        fontFamily: e.target.value as SuratFontFamily,
                      },
                    }))
                  }
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                >
                  {SURAT_FONT_OPTIONS.map((fontOpt) => (
                    <option key={fontOpt} value={fontOpt}>
                      {fontOpt} — Ukuran 12 pt
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-600">
                  Pertimbangan
                </label>
                <textarea
                  rows={3}
                  value={state.sprin.pertimbangan}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      sprin: { ...prev.sprin, pertimbangan: e.target.value },
                    }))
                  }
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-600">
                    Dasar (Poin 1, 2, ...)
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setState((prev) => ({
                        ...prev,
                        sprin: {
                          ...prev.sprin,
                          dasar: [...prev.sprin.dasar, ''],
                        },
                      }))
                    }
                    className="text-[11px] font-semibold text-blue-700"
                  >
                    + Tambah Dasar
                  </button>
                </div>
                {state.sprin.dasar.map((item, idx) => (
                  <div key={`dasar_${idx}`} className="flex gap-1.5">
                    <span className="pt-1.5 font-mono text-slate-500">
                      {idx + 1}.
                    </span>
                    <textarea
                      rows={2}
                      value={item}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          sprin: {
                            ...prev.sprin,
                            dasar: prev.sprin.dasar.map((d, i) =>
                              i === idx ? e.target.value : d
                            ),
                          },
                        }))
                      }
                      className="flex-1 px-2.5 py-1 border border-slate-300 rounded-lg"
                    />
                    {state.sprin.dasar.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setState((prev) => ({
                            ...prev,
                            sprin: {
                              ...prev.sprin,
                              dasar: prev.sprin.dasar.filter(
                                (_, i) => i !== idx
                              ),
                            },
                          }))
                        }
                        className="p-1 text-rose-500 self-start"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-600">Kepada</label>
                <label className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(state.sprin.useInlineKepadaIfFiveOrLess)}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        sprin: {
                          ...prev.sprin,
                          useInlineKepadaIfFiveOrLess: e.target.checked,
                        },
                      }))
                    }
                    className="mt-0.5 w-3.5 h-3.5 rounded border-slate-300 text-amber-600"
                  />
                  <span className="text-[11px] text-slate-700 leading-snug">
                    Cantumkan langsung daftar personel di pokok{' '}
                    <strong>Kepada</strong> (tanpa Lampiran terpisah · saat ini{' '}
                    <strong>{state.sprin.personnelRows.length}</strong>{' '}
                    personel)
                  </span>
                </label>
                {!(
                  Boolean(state.sprin.useInlineKepadaIfFiveOrLess) &&
                  state.sprin.personnelRows.length > 0
                ) && (
                  <textarea
                    rows={2}
                    value={state.sprin.kepadaText}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        sprin: { ...prev.sprin, kepadaText: e.target.value },
                      }))
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-600">
                    Untuk (Poin 1, 2, ...)
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setState((prev) => ({
                        ...prev,
                        sprin: {
                          ...prev.sprin,
                          untuk: [...prev.sprin.untuk, ''],
                        },
                      }))
                    }
                    className="text-[11px] font-semibold text-blue-700"
                  >
                    + Tambah Poin Untuk
                  </button>
                </div>
                {state.sprin.untuk.map((item, idx) => (
                  <div key={`untuk_${idx}`} className="flex gap-1.5">
                    <span className="pt-1.5 font-mono text-slate-500">
                      {idx + 1}.
                    </span>
                    <textarea
                      rows={2}
                      value={item}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          sprin: {
                            ...prev.sprin,
                            untuk: prev.sprin.untuk.map((u, i) =>
                              i === idx ? e.target.value : u
                            ),
                          },
                        }))
                      }
                      className="flex-1 px-2.5 py-1 border border-slate-300 rounded-lg"
                    />
                    {state.sprin.untuk.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setState((prev) => ({
                            ...prev,
                            sprin: {
                              ...prev.sprin,
                              untuk: prev.sprin.untuk.filter(
                                (_, i) => i !== idx
                              ),
                            },
                          }))
                        }
                        className="p-1 text-rose-500 self-start"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-200">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">
                    Judul Lampiran (Hal. 2)
                  </label>
                  <input
                    type="text"
                    value={state.sprin.lampiranTitle}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        sprin: {
                          ...prev.sprin,
                          lampiranTitle: e.target.value,
                        },
                      }))
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">
                    Subjudul Hari/Tanggal Lampiran
                  </label>
                  <input
                    type="text"
                    value={state.sprin.lampiranSubtitle}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        sprin: {
                          ...prev.sprin,
                          lampiranSubtitle: e.target.value,
                        },
                      }))
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">
                    Header Lanjutan Hal. 2+ (Kanan Atas)
                  </label>
                  <input
                    type="text"
                    value={
                      state.sprin.sprinContinuationHeaderLabel ??
                      'SPRIN KAPOLSEK SMG SELATAN'
                    }
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        sprin: {
                          ...prev.sprin,
                          sprinContinuationHeaderLabel: e.target.value,
                        },
                      }))
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">
                    Header Kanan Lampiran
                  </label>
                  <input
                    type="text"
                    value={state.sprin.lampiranHeaderLabel}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        sprin: {
                          ...prev.sprin,
                          lampiranHeaderLabel: e.target.value,
                        },
                      }))
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-600">
                  Tanggal Header Lanjutan &amp; Lampiran (Kapital)
                </label>
                <input
                  type="text"
                  value={state.sprin.lampiranDateUpper}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      sprin: {
                        ...prev.sprin,
                        lampiranDateUpper: e.target.value,
                      },
                    }))
                  }
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>

              {(() => {
                const delMode = state.sprin.signerDelegation ?? 'NONE';
                const patchSprinSigner = (
                  patch: Partial<SuratPerintahData>
                ) =>
                  setState((prev) => ({
                    ...prev,
                    sprin: { ...prev.sprin, ...patch },
                  }));

                return (
                  <div className="space-y-2.5 pt-3 border-t border-slate-200">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-slate-800">
                        Tajuk Tanda Tangan: Jabatan &amp; Nama Pejabat
                      </span>
                      <select
                        value=""
                        onChange={(e) => {
                          const p = personnel.find(
                            (item) => item.id === e.target.value
                          );
                          if (!p) return;
                          patchSprinSigner({
                            signerName: normalizeSignerNamePerkap(p.name),
                            signerRankNrp: normalizeSignerRankNrpPerkap(
                              `${p.pangkat} NRP ${p.nrp}`
                            ),
                            signerTitle: `${p.jabatan.toUpperCase()} POLSEK SEMARANG SELATAN`,
                          });
                        }}
                        className="px-2 py-1 text-[11px] border border-slate-300 rounded-md bg-slate-50 text-slate-700"
                      >
                        <option value="">Isi cepat dari Data Personel...</option>
                        {personnel.map((p) => (
                          <option key={`pick_sp_${p.id}`} value={p.id}>
                            {p.jabatan} — {p.pangkat} {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-600">
                        Wewenang Penandatanganan
                      </label>
                      <select
                        value={delMode}
                        onChange={(e) =>
                          patchSprinSigner({
                            signerDelegation: e.target
                              .value as SignerDelegationMode,
                          })
                        }
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                      >
                        {SIGNER_DELEGATION_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {(delMode === 'AN' || delMode === 'AN_UB') && (
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-600">
                          Jabatan Pemberi Wewenang (a.n. ...)
                        </label>
                        <input
                          type="text"
                          value={state.sprin.signerSuperiorTitle ?? ''}
                          onChange={(e) =>
                            patchSprinSigner({
                              signerSuperiorTitle: e.target.value,
                            })
                          }
                          placeholder="KAPOLRESTABES SEMARANG"
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                        />
                      </div>
                    )}

                    {delMode === 'AN_UB' && (
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-600">
                          Jabatan Perantara (di atas u.b.)
                        </label>
                        <input
                          type="text"
                          value={state.sprin.signerMiddleTitle ?? ''}
                          onChange={(e) =>
                            patchSprinSigner({
                              signerMiddleTitle: e.target.value,
                            })
                          }
                          placeholder="WAKAPOLRESTABES SEMARANG"
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                        />
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-600">
                        Jabatan Penandatangan
                      </label>
                      <input
                        type="text"
                        value={state.sprin.signerTitle}
                        onChange={(e) =>
                          patchSprinSigner({ signerTitle: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-600">
                          Nama Pejabat &amp; Gelar
                        </label>
                        <input
                          type="text"
                          value={state.sprin.signerName}
                          onChange={(e) =>
                            patchSprinSigner({ signerName: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-600">
                          Pangkat &amp; NRP/NIP
                        </label>
                        <input
                          type="text"
                          value={state.sprin.signerRankNrp}
                          onChange={(e) =>
                            patchSprinSigner({ signerRankNrp: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="space-y-1">
                <label className="font-semibold text-slate-600">
                  Tembusan (satu baris per tujuan)
                </label>
                <textarea
                  rows={2}
                  value={state.sprin.tembusan.join('\n')}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      sprin: {
                        ...prev.sprin,
                        tembusan: e.target.value.split('\n'),
                      },
                    }))
                  }
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          ) : (
            /* SURAT BIASA FORM */
            <div className="space-y-3 text-xs">
              <div className="space-y-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-[11px] font-bold uppercase tracking-wide text-slate-700">
                  Kop Naskah Dinas (Kiri Atas, Rata Tengah)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-600">
                      Kop Baris 1 (Instansi)
                    </label>
                    <input
                      type="text"
                      value={state.biasa.kopLine1}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          biasa: { ...prev.biasa, kopLine1: e.target.value },
                        }))
                      }
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-600">
                      Kop Baris 2 (Satuan Induk)
                    </label>
                    <input
                      type="text"
                      value={state.biasa.kopLine2}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          biasa: { ...prev.biasa, kopLine2: e.target.value },
                        }))
                      }
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-600">
                      Kop Baris 3 (Satuan / Opsional)
                    </label>
                    <input
                      type="text"
                      value={state.biasa.kopLine3}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          biasa: { ...prev.biasa, kopLine3: e.target.value },
                        }))
                      }
                      placeholder="Kosongkan jika 2 baris kop"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-600">
                      Alamat Kop Surat (Bergaris Bawah)
                    </label>
                    <input
                      type="text"
                      value={state.biasa.kopAddress}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          biasa: { ...prev.biasa, kopAddress: e.target.value },
                        }))
                      }
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">Nomor</label>
                  <input
                    type="text"
                    value={state.biasa.nomor}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        biasa: { ...prev.biasa, nomor: e.target.value },
                      }))
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">
                    Tanggal Surat (Kanan)
                  </label>
                  <input
                    type="text"
                    value={state.biasa.dateRightText}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        biasa: { ...prev.biasa, dateRightText: e.target.value },
                      }))
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-600">
                  Jenis &amp; Ukuran Huruf
                </label>
                <select
                  value={state.biasa.fontFamily ?? 'Arial Narrow'}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      biasa: {
                        ...prev.biasa,
                        fontFamily: e.target.value as SuratFontFamily,
                      },
                    }))
                  }
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                >
                  {SURAT_FONT_OPTIONS.map((fontOpt) => (
                    <option key={fontOpt} value={fontOpt}>
                      {fontOpt} — Ukuran 12 pt
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">
                    Klasifikasi
                  </label>
                  <select
                    value={state.biasa.klasifikasi}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        biasa: { ...prev.biasa, klasifikasi: e.target.value },
                      }))
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                  >
                    {PERKAP_KLASIFIKASI_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                    {!(
                      PERKAP_KLASIFIKASI_OPTIONS as readonly string[]
                    ).includes(state.biasa.klasifikasi) && (
                      <option value={state.biasa.klasifikasi}>
                        {state.biasa.klasifikasi}
                      </option>
                    )}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">
                    Lampiran
                  </label>
                  <input
                    type="text"
                    value={state.biasa.lampiran}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        biasa: { ...prev.biasa, lampiran: e.target.value },
                      }))
                    }
                    placeholder="satu lembar / 12 berkas / -"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-600">Hal</label>
                <textarea
                  rows={2}
                  value={state.biasa.perihal}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      biasa: { ...prev.biasa, perihal: e.target.value },
                    }))
                  }
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2 space-y-1">
                  <label className="font-semibold text-slate-600">
                    Kepada Yth. (Nama Jabatan Tujuan)
                  </label>
                  <input
                    type="text"
                    value={state.biasa.kepadaYth}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        biasa: { ...prev.biasa, kepadaYth: e.target.value },
                      }))
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">di</label>
                  <input
                    type="text"
                    value={state.biasa.diKota}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        biasa: { ...prev.biasa, diKota: e.target.value },
                      }))
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">
                    Header Lanjutan Hal. 2+ (Kanan Atas)
                  </label>
                  <input
                    type="text"
                    value={state.biasa.page2HeaderLabel}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        biasa: {
                          ...prev.biasa,
                          page2HeaderLabel: e.target.value,
                        },
                      }))
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">
                    Tanggal Header Lanjutan (Kapital)
                  </label>
                  <input
                    type="text"
                    value={state.biasa.page2DateUpper}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        biasa: {
                          ...prev.biasa,
                          page2DateUpper: e.target.value,
                        },
                      }))
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-600">
                  Up. (Opsional)
                </label>
                <input
                  type="text"
                  value={state.biasa.upText}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      biasa: { ...prev.biasa, upText: e.target.value },
                    }))
                  }
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-600">
                    Isi Surat Halaman 1 (Poin 1–4)
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setState((prev) => ({
                        ...prev,
                        biasa: {
                          ...prev.biasa,
                          paragraphsPage1: [...prev.biasa.paragraphsPage1, ''],
                        },
                      }))
                    }
                    className="text-[11px] font-semibold text-blue-700"
                  >
                    + Tambah Poin
                  </button>
                </div>
                {state.biasa.paragraphsPage1.map((p, idx) => (
                  <div key={`p1_${idx}`} className="flex gap-1.5">
                    <textarea
                      rows={3}
                      value={p}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          biasa: {
                            ...prev.biasa,
                            paragraphsPage1: prev.biasa.paragraphsPage1.map(
                              (item, i) => (i === idx ? e.target.value : item)
                            ),
                          },
                        }))
                      }
                      className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-lg"
                    />
                    {state.biasa.paragraphsPage1.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setState((prev) => ({
                            ...prev,
                            biasa: {
                              ...prev.biasa,
                              paragraphsPage1:
                                prev.biasa.paragraphsPage1.filter(
                                  (_, i) => i !== idx
                                ),
                            },
                          }))
                        }
                        className="p-1 text-rose-500 self-start"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-600">
                    Isi Surat Halaman 2 (Lanjutan &amp; Penutup)
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setState((prev) => ({
                        ...prev,
                        biasa: {
                          ...prev.biasa,
                          paragraphsPage2: [...prev.biasa.paragraphsPage2, ''],
                        },
                      }))
                    }
                    className="text-[11px] font-semibold text-blue-700"
                  >
                    + Tambah Poin
                  </button>
                </div>
                {state.biasa.paragraphsPage2.map((p, idx) => (
                  <div key={`p2_${idx}`} className="flex gap-1.5">
                    <textarea
                      rows={2}
                      value={p}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          biasa: {
                            ...prev.biasa,
                            paragraphsPage2: prev.biasa.paragraphsPage2.map(
                              (item, i) => (i === idx ? e.target.value : item)
                            ),
                          },
                        }))
                      }
                      className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-lg"
                    />
                    {state.biasa.paragraphsPage2.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setState((prev) => ({
                            ...prev,
                            biasa: {
                              ...prev.biasa,
                              paragraphsPage2:
                                prev.biasa.paragraphsPage2.filter(
                                  (_, i) => i !== idx
                                ),
                            },
                          }))
                        }
                        className="p-1 text-rose-500 self-start"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={state.biasa.includePersonnelTable}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      biasa: {
                        ...prev.biasa,
                        includePersonnelTable: e.target.checked,
                      },
                    }))
                  }
                  className="w-4 h-4 rounded border-slate-300 text-amber-600"
                />
                <span className="font-semibold text-slate-700">
                  Sertakan Tabel Daftar Nama Personel pada Halaman 2
                </span>
              </label>

              {(() => {
                const delMode = state.biasa.signerDelegation ?? 'NONE';
                const patchBiasaSigner = (patch: Partial<SuratBiasaData>) =>
                  setState((prev) => ({
                    ...prev,
                    biasa: { ...prev.biasa, ...patch },
                  }));

                return (
                  <div className="space-y-2.5 pt-3 border-t border-slate-200">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-slate-800">
                        Tajuk Tanda Tangan: Jabatan &amp; Nama Pejabat
                      </span>
                      <select
                        value=""
                        onChange={(e) => {
                          const p = personnel.find(
                            (item) => item.id === e.target.value
                          );
                          if (!p) return;
                          patchBiasaSigner({
                            signerName: normalizeSignerNamePerkap(p.name),
                            signerRankNrp: normalizeSignerRankNrpPerkap(
                              `${p.pangkat} NRP ${p.nrp}`
                            ),
                            signerTitle: `${p.jabatan.toUpperCase()} POLSEK SEMARANG SELATAN`,
                          });
                        }}
                        className="px-2 py-1 text-[11px] border border-slate-300 rounded-md bg-slate-50 text-slate-700"
                      >
                        <option value="">Isi cepat dari Data Personel...</option>
                        {personnel.map((p) => (
                          <option key={`pick_bs_${p.id}`} value={p.id}>
                            {p.jabatan} — {p.pangkat} {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-600">
                        Wewenang Penandatanganan
                      </label>
                      <select
                        value={delMode}
                        onChange={(e) =>
                          patchBiasaSigner({
                            signerDelegation: e.target
                              .value as SignerDelegationMode,
                          })
                        }
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                      >
                        {SIGNER_DELEGATION_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {(delMode === 'AN' || delMode === 'AN_UB') && (
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-600">
                          Jabatan Pemberi Wewenang (a.n. ...)
                        </label>
                        <input
                          type="text"
                          value={state.biasa.signerSuperiorTitle ?? ''}
                          onChange={(e) =>
                            patchBiasaSigner({
                              signerSuperiorTitle: e.target.value,
                            })
                          }
                          placeholder="KAPOLRESTABES SEMARANG"
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                        />
                      </div>
                    )}

                    {delMode === 'AN_UB' && (
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-600">
                          Jabatan Perantara (di atas u.b.)
                        </label>
                        <input
                          type="text"
                          value={state.biasa.signerMiddleTitle ?? ''}
                          onChange={(e) =>
                            patchBiasaSigner({
                              signerMiddleTitle: e.target.value,
                            })
                          }
                          placeholder="WAKAPOLRESTABES SEMARANG"
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                        />
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-600">
                        Jabatan Penandatangan
                      </label>
                      <input
                        type="text"
                        value={state.biasa.signerTitle}
                        onChange={(e) =>
                          patchBiasaSigner({ signerTitle: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-600">
                          Nama Pejabat &amp; Gelar
                        </label>
                        <input
                          type="text"
                          value={state.biasa.signerName}
                          onChange={(e) =>
                            patchBiasaSigner({ signerName: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-600">
                          Pangkat &amp; NRP/NIP
                        </label>
                        <input
                          type="text"
                          value={state.biasa.signerRankNrp}
                          onChange={(e) =>
                            patchBiasaSigner({ signerRankNrp: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="space-y-1">
                <label className="font-semibold text-slate-600">
                  Tembusan (satu baris per tujuan)
                </label>
                <textarea
                  rows={3}
                  value={state.biasa.tembusan.join('\n')}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      biasa: {
                        ...prev.biasa,
                        tembusan: e.target.value.split('\n'),
                      },
                    }))
                  }
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          )}
        </div>

        {/* Live Document Preview (7 cols) - 100% sinkron dengan file A4 yang diunduh */}
        <div className="xl:col-span-7 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Pratinjau Dokumen A4
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-800">
              Total {previewPages.length} Halaman A4 · Sinkron 1:1 dengan file PDF &amp; DOCX
            </span>
          </div>

          <div className="space-y-5">
            {previewPages.map((page) => {
              const sectionLabel =
                page.section === 'SPRIN'
                  ? 'SURAT PERINTAH'
                  : page.section === 'LAMPIRAN'
                    ? 'LAMPIRAN SPRIN'
                    : 'SURAT BIASA';
              const activeFont: SuratFontFamily =
                activeMode === 'SPRIN'
                  ? (state.sprin.fontFamily ?? 'Arial Narrow')
                  : (state.biasa.fontFamily ?? 'Arial Narrow');
              const activeFontCss =
                activeFont === 'Arial Narrow'
                  ? '"Arial Narrow", "Liberation Sans Narrow", "Roboto Condensed", Arial, sans-serif'
                  : 'Arial, "Liberation Sans", sans-serif';

              return (
                <div
                  key={`a4_page_${page.section}_${page.pageNumber}`}
                  className="bg-white border border-slate-300 shadow-sm rounded-lg overflow-hidden"
                >
                  <div className="bg-slate-100 border-b border-slate-200 px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[10.5px] font-semibold text-slate-600">
                    <span>
                      Kertas A4 (210 × 297 mm) · Margin 2/3/3/1,5 cm ·{' '}
                      {activeFont} 12 pt · {sectionLabel}
                    </span>
                    <span>
                      Halaman {page.pageNumber} dari {previewPages.length}
                      {page.sectionPageNumber >= 2
                        ? ` (Hal. naskah: ${page.sectionPageNumber})`
                        : ''}
                    </span>
                  </div>

                  <div
                    className="text-[12pt] leading-[1.35] text-black overflow-x-auto"
                    style={{ fontFamily: activeFontCss }}
                  >
                    <div className="min-w-[210mm] pt-[20mm] pl-[30mm] pr-[15mm] pb-[15mm] space-y-0.5">
                      {page.classificationBanner && (
                        <div className="text-center text-[10pt] tracking-wider pb-1">
                          {page.classificationBanner}
                        </div>
                      )}

                      {page.sectionPageNumber >= 2 && (
                        <div className="text-center text-[11pt] pb-1">
                          {page.sectionPageNumber}
                        </div>
                      )}

                      {page.continuationHeader && (
                        <div className="flex justify-end mb-6">
                          <div className="text-left text-[9.5pt] leading-tight">
                            <div>{page.continuationHeader.label}</div>
                            <div>NOMOR : {page.continuationHeader.nomor}</div>
                            <div className="border-b border-black pb-0.5">
                              TANGGAL: {page.continuationHeader.tanggalUpper}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="pb-[15mm] space-y-0.5">
                        {page.blocks.map((block, bIdx) =>
                          renderA4PreviewBlock(
                            block,
                            `p${page.pageNumber}_b${bIdx}_${block.kind}`
                          )
                        )}
                      </div>

                      {page.connectorWord && (
                        <div className="text-right text-[11pt]">
                          {page.connectorWord}
                        </div>
                      )}

                      {page.classificationBanner && (
                        <div className="text-center text-[10pt] tracking-wider pt-1">
                          {page.classificationBanner}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Saved Letters Archive (Max 10) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2.5">
          <History className="w-4 h-4 text-amber-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
            Arsip Surat Tersimpan ({state.savedList.length}/{MAX_SAVED_SURAT})
          </h3>
        </div>

        {state.savedList.length === 0 ? (
          <p className="text-xs text-slate-500 py-3 text-center">
            Belum ada arsip surat tersimpan. Klik <strong>Simpan Arsip</strong>{' '}
            untuk menyimpan surat yang sedang disusun.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {state.savedList.map((item) => (
              <div
                key={item.id}
                className="border border-slate-200 rounded-lg p-3 flex items-center justify-between gap-2 bg-slate-50/50"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.mode === 'SPRIN'
                          ? 'bg-slate-900 text-amber-300'
                          : 'bg-emerald-700 text-white'
                      }`}
                    >
                      {item.mode === 'SPRIN' ? 'SURAT PERINTAH' : 'SURAT BIASA'}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {formatSavedTimestamp(item.savedAt)}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 truncate mt-1">
                    {item.title}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleLoadSaved(item)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold bg-white border border-slate-300 hover:bg-slate-100 rounded-md"
                  >
                    <FolderOpen className="w-3 h-3 text-amber-600" />
                    <span>Buka</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteSaved(item.id)}
                    className="p-1.5 text-rose-500 hover:text-rose-700"
                    title="Hapus arsip"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {kopEditorOpen && (
        <KopSuratEditorModal
          header={header}
          onSaveHeader={handleSaveKopHeader}
          onClose={() => setKopEditorOpen(false)}
          onNotice={showNotice}
        />
      )}
    </div>
  );
}
