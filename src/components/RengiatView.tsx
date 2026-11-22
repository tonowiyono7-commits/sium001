import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  BookmarkCheck,
  Calendar,
  Check,
  ClipboardList,
  Clock,
  Copy,
  Edit3,
  FileText,
  MapPin,
  Plus,
  Send,
  Share2,
  Sparkles,
  StickyNote,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import {
  PawasAnchor,
  Personnel,
  RengiatExecutorPreset,
  RengiatItem,
  RengiatPlacePreset,
  RosterOrgHeader,
  ShiftOverrides,
} from '../types/polriRoster';
import {
  DAY_NAMES_FULL_ID,
  getEffectivePersonnelForMonth,
  getEffectiveShift,
  MONTH_NAMES_ID,
} from '../utils/continuousRoster';

const RENGIAT_STORAGE_KEY = 'kuat_pers_rengiat_v1';

const PLACE_OPTIONS: RengiatPlacePreset[] = [
  'LAP. MAPOLRESTABES SMG',
  'AULA MAPOLRESTABES SMG',
  'R.RUPATAMA MAPOLRESTABES SMG',
  'MAPOLSEK SMG SELATAN',
  'TENTATIF',
  'LAINNYA',
];

const EXECUTOR_OPTIONS: RengiatExecutorPreset[] = [
  'KAPOLSEK',
  'WAKAPOLSEK',
  'PAWAS',
  'ANGGOTA YG TERSEPRIN',
  'LAINNYA',
];

const GREETING_OPTIONS = [
  'SELAMAT PAGI KOMANDAN',
  'SELAMAT SIANG KOMANDAN',
  'SELAMAT SORE KOMANDAN',
  'SELAMAT MALAM KOMANDAN',
] as const;

const QUICK_TIMES = [
  '04.00',
  '05.00',
  '07.00',
  '08.00',
  '09.00',
  '10.00',
  '13.00',
  '19.00',
  '20.00',
  '22.00',
];

interface RengiatSavedState {
  greeting: string;
  unitLabel: string;
  items: RengiatItem[];
  selectedWaDates?: string[];
  waPhone?: string;
}

interface RengiatViewProps {
  header: RosterOrgHeader;
  todayDateKey: string;
  personnel: Personnel[];
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

function formatDateHeading(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  const dayName = DAY_NAMES_FULL_ID[dt.getDay()].toUpperCase();
  const monthName = MONTH_NAMES_ID[(m || 1) - 1] ?? '';
  return `${dayName}, ${d} ${monthName} ${y}`;
}

function formatShortDateChip(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  const dayName = DAY_NAMES_FULL_ID[dt.getDay()];
  const monthShort = (MONTH_NAMES_ID[(m || 1) - 1] ?? '').slice(0, 3);
  return `${dayName}, ${d} ${monthShort}`;
}

function resolvePlaceText(item: RengiatItem): string {
  if (item.placePreset === 'LAINNYA') {
    return item.placeCustom.trim() || '-';
  }
  return item.placePreset;
}

function resolveExecutorText(item: RengiatItem): string {
  const parts: string[] = [];
  for (const preset of item.executorPresets) {
    if (preset === 'LAINNYA') {
      const custom = item.executorCustom.trim();
      if (custom) parts.push(custom);
    } else {
      parts.push(preset);
    }
  }
  if (parts.length === 0) return '-';
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} DAN ${parts[1]}`;
  return `${parts.slice(0, -1).join(', ')} DAN ${parts[parts.length - 1]}`;
}

function loadSavedRengiat(defaultUnitLabel: string): RengiatSavedState {
  try {
    const raw = localStorage.getItem(RENGIAT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<RengiatSavedState>;
      if (parsed && Array.isArray(parsed.items)) {
        return {
          greeting: parsed.greeting || 'SELAMAT MALAM KOMANDAN',
          unitLabel: parsed.unitLabel || defaultUnitLabel,
          items: parsed.items,
          selectedWaDates: Array.isArray(parsed.selectedWaDates)
            ? parsed.selectedWaDates
            : [],
          waPhone: typeof parsed.waPhone === 'string' ? parsed.waPhone : '',
        };
      }
    }
  } catch {
    // Abaikan error storage
  }
  return {
    greeting: 'SELAMAT MALAM KOMANDAN',
    unitLabel: defaultUnitLabel,
    items: [],
    selectedWaDates: [],
    waPhone: '',
  };
}

export function RengiatView({
  header,
  todayDateKey,
  personnel,
  pawasAnchor,
  overrides,
}: RengiatViewProps) {
  const defaultUnitName = useMemo(() => {
    const raw = header.line3.trim();
    if (raw.toUpperCase().startsWith('SEKTOR ')) {
      return `POLSEK ${raw.slice(7)}`;
    }
    return raw || 'POLSEK SEMARANG SELATAN';
  }, [header.line3]);

  const initial = useMemo(
    () => loadSavedRengiat(defaultUnitName),
    [defaultUnitName]
  );

  const [greeting, setGreeting] = useState<string>(initial.greeting);
  const [unitLabel, setUnitLabel] = useState<string>(initial.unitLabel);
  const [items, setItems] = useState<RengiatItem[]>(initial.items);
  const [selectedWaDates, setSelectedWaDates] = useState<string[]>(
    initial.selectedWaDates ?? []
  );

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dateKey, setDateKey] = useState<string>(todayDateKey);
  const [timeMode, setTimeMode] = useState<'WIB' | 'TENTATIF'>('WIB');
  const [timeValue, setTimeValue] = useState<string>('08.00');
  const [title, setTitle] = useState<string>('');
  const [placePreset, setPlacePreset] = useState<RengiatPlacePreset>(
    'MAPOLSEK SMG SELATAN'
  );
  const [placeCustom, setPlaceCustom] = useState<string>('');
  const [executorPresets, setExecutorPresets] = useState<
    RengiatExecutorPreset[]
  >(['ANGGOTA YG TERSEPRIN']);
  const [executorCustom, setExecutorCustom] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [waPhone, setWaPhone] = useState(initial.waPhone ?? '');
  const [confirmClearAll, setConfirmClearAll] = useState(false);



  useEffect(() => {
    try {
      const payload: RengiatSavedState = {
        greeting,
        unitLabel,
        items,
        selectedWaDates,
        waPhone,
      };
      localStorage.setItem(RENGIAT_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Abaikan kuota penuh
    }
  }, [greeting, unitLabel, items, selectedWaDates, waPhone]);



  // Optional hint showing who is PAWAS on the selected Rengiat date
  const pawasForSelectedDate = useMemo(() => {
    const [y, m, d] = dateKey.split('-').map(Number);
    if (!y || !m || !d) return [];
    const monthPers = getEffectivePersonnelForMonth(personnel, y, m - 1);
    return monthPers.filter(
      (p) =>
        p.unit === 'PAWAS' &&
        getEffectiveShift(p, y, m - 1, d, overrides, monthPers, pawasAnchor)
          .code === 'X'
    );
  }, [dateKey, personnel, overrides, pawasAnchor]);

  const resetForm = () => {
    setEditingId(null);
    setTimeMode('WIB');
    setTimeValue('08.00');
    setTitle('');
    setPlacePreset('MAPOLSEK SMG SELATAN');
    setPlaceCustom('');
    setExecutorPresets(['ANGGOTA YG TERSEPRIN']);
    setExecutorCustom('');
    setNotes('');
    setFormError(null);
  };

  const toggleExecutor = (opt: RengiatExecutorPreset) => {
    setExecutorPresets((prev) => {
      if (prev.includes(opt)) {
        if (prev.length === 1) return prev;
        return prev.filter((x) => x !== opt);
      }
      return [...prev, opt];
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError('Nama / uraian kegiatan wajib diisi.');
      return;
    }
    if (placePreset === 'LAINNYA' && !placeCustom.trim()) {
      setFormError('Isi nama tempat manual karena pilihan LAINNYA dipilih.');
      return;
    }
    if (executorPresets.includes('LAINNYA') && !executorCustom.trim()) {
      setFormError(
        'Isi nama pelaksana manual karena pilihan LAINNYA dipilih.'
      );
      return;
    }
    if (timeMode === 'WIB' && !timeValue.trim()) {
      setFormError('Masukkan jam kegiatan atau pilih TENTATIF.');
      return;
    }

    const cleanTime = timeValue.trim().replace(':', '.');
    const record: RengiatItem = {
      id:
        editingId ||
        `rg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`,
      dateKey,
      timeMode,
      timeValue: timeMode === 'TENTATIF' ? '' : cleanTime,
      title: title.trim().toUpperCase(),
      placePreset,
      placeCustom: placePreset === 'LAINNYA' ? placeCustom.trim().toUpperCase() : '',
      executorPresets: [...executorPresets],
      executorCustom: executorPresets.includes('LAINNYA')
        ? executorCustom.trim().toUpperCase()
        : '',
      notes: notes.trim() || undefined,
    };

    if (editingId) {
      setItems((prev) => prev.map((it) => (it.id === editingId ? record : it)));
    } else {
      setItems((prev) => [...prev, record]);
    }
    resetForm();
  };

  const handleEditItem = (item: RengiatItem) => {
    setEditingId(item.id);
    setDateKey(item.dateKey);
    setTimeMode(item.timeMode);
    setTimeValue(item.timeValue || '08.00');
    setTitle(item.title);
    setPlacePreset(item.placePreset);
    setPlaceCustom(item.placeCustom);
    setExecutorPresets(
      item.executorPresets.length > 0
        ? item.executorPresets
        : ['ANGGOTA YG TERSEPRIN']
    );
    setExecutorCustom(item.executorCustom);
    setNotes(item.notes || '');
    setFormError(null);
  };

  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
    if (editingId === id) {
      resetForm();
    }
  };

  const handleMoveItem = (dateGroupKey: string, id: string, dir: 'up' | 'down') => {
    setItems((prev) => {
      const sameDateIndices: number[] = [];
      prev.forEach((it, idx) => {
        if (it.dateKey === dateGroupKey) sameDateIndices.push(idx);
      });
      const posInGroup = sameDateIndices.findIndex(
        (idx) => prev[idx].id === id
      );
      if (posInGroup === -1) return prev;
      const targetPosInGroup = dir === 'up' ? posInGroup - 1 : posInGroup + 1;
      if (targetPosInGroup < 0 || targetPosInGroup >= sameDateIndices.length) {
        return prev;
      }
      const next = [...prev];
      const idxA = sameDateIndices[posInGroup];
      const idxB = sameDateIndices[targetPosInGroup];
      [next[idxA], next[idxB]] = [next[idxB], next[idxA]];
      return next;
    });
  };

  const handleLoadExample = () => {
    const day1 = todayDateKey;
    const day2 = addDaysToDateKey(todayDateKey, 1);
    const sample: RengiatItem[] = [
      {
        id: `rg_ex1_${Date.now()}`,
        dateKey: day1,
        timeMode: 'WIB',
        timeValue: '04.00',
        title: 'GIAT QW SULING.',
        placePreset: 'LAINNYA',
        placeCustom: 'MASJID LAMPER TENGAH',
        executorPresets: ['LAINNYA'],
        executorCustom: 'KANIT BINMAS, PIKET BHABIN DAN PIKET INTEL.',
      },
      {
        id: `rg_ex2_${Date.now()}`,
        dateKey: day1,
        timeMode: 'WIB',
        timeValue: '22.00',
        title: 'APEL KRYD DILANJUT STRONG POINT BALAP LIAR',
        placePreset: 'LAINNYA',
        placeCustom: 'POLSEK SMG SELATAN & JL.KOMPOL MAKSUM.',
        executorPresets: ['ANGGOTA YG TERSEPRIN'],
        executorCustom: '',
      },
      {
        id: `rg_ex3_${Date.now()}`,
        dateKey: day2,
        timeMode: 'WIB',
        timeValue: '05.00',
        title: 'PAM FUN RUN & PENGOBATAN GRATIS.',
        placePreset: 'LAINNYA',
        placeCustom: 'HAL. KANTOR GUBERNUR JATENG',
        executorPresets: ['ANGGOTA YG TERSEPRIN'],
        executorCustom: '',
      },
      {
        id: `rg_ex4_${Date.now()}`,
        dateKey: day2,
        timeMode: 'WIB',
        timeValue: '09.00',
        title: 'PROGRAM QW1 : MINGGU KASIH',
        placePreset: 'TENTATIF',
        placeCustom: '',
        executorPresets: ['KAPOLSEK', 'LAINNYA'],
        executorCustom: 'PIKET BHABIN.',
      },
    ];
    setItems((prev) => (prev.length === 0 ? sample : [...prev, ...sample]));
  };

  // Group items chronologically by dateKey while preserving intra-day manual order
  const groupedByDate = useMemo(() => {
    const map = new Map<string, RengiatItem[]>();
    for (const it of items) {
      const arr = map.get(it.dateKey) ?? [];
      arr.push(it);
      map.set(it.dateKey, arr);
    }
    const sortedKeys = Array.from(map.keys()).sort();
    return sortedKeys.map((dk) => ({
      dateKey: dk,
      heading: formatDateHeading(dk),
      shortChip: formatShortDateChip(dk),
      entries: map.get(dk) ?? [],
    }));
  }, [items]);

  // Selected days to include in WhatsApp message ([] = semua hari yang tersimpan)
  const activeSelectedDates = useMemo(() => {
    const validKeys = new Set(groupedByDate.map((g) => g.dateKey));
    return selectedWaDates.filter((dk) => validKeys.has(dk));
  }, [selectedWaDates, groupedByDate]);

  const groupsForWhatsapp = useMemo(() => {
    if (activeSelectedDates.length === 0) return groupedByDate;
    return groupedByDate.filter((g) =>
      activeSelectedDates.includes(g.dateKey)
    );
  }, [groupedByDate, activeSelectedDates]);

  const toggleWaDate = (dk: string) => {
    setSelectedWaDates((prev) => {
      const validKeys = new Set(groupedByDate.map((g) => g.dateKey));
      const cleanPrev = prev.filter((x) => validKeys.has(x));
      if (cleanPrev.length === 0) {
        return [dk];
      }
      if (cleanPrev.includes(dk)) {
        return cleanPrev.filter((x) => x !== dk);
      }
      return [...cleanPrev, dk];
    });
  };

  const whatsappReportText = useMemo(() => {
    const lines: string[] = [
      `*${greeting.trim() || 'SELAMAT MALAM KOMANDAN'}*,`,
      `MOHON IJIN MELAPORKAN RENCANA KEGIATAN ${
        unitLabel.trim().toUpperCase() || 'POLSEK SEMARANG SELATAN'
      } PADA HARI :`,
      '',
    ];

    if (groupsForWhatsapp.length === 0) {
      lines.push(`📅 *${formatDateHeading(todayDateKey)}* adalah sbb :`);
      lines.push('');
      lines.push('- Belum ada rencana kegiatan yang ditambahkan.');
    } else {
      groupsForWhatsapp.forEach((group, gIdx) => {
        const suffix = gIdx === 0 ? 'adalah sbb :' : 'ADALAH SBB:';
        lines.push(`📅 *${group.heading}* ${suffix}`);
        lines.push('');

        group.entries.forEach((entry, idx) => {
          const waktuLabel =
            entry.timeMode === 'TENTATIF'
              ? 'TENTATIF'
              : `PKL.${entry.timeValue} WIB`;
          lines.push(`*${idx + 1}. 🕒 ${waktuLabel}*`);
          lines.push(`📌 ${entry.title}`);
          lines.push(`📍 TEMPAT : ${resolvePlaceText(entry)}`);
          lines.push(`👮 PELAKSANA : ${resolveExecutorText(entry)}`);
          if (entry.notes && entry.notes.trim()) {
            lines.push(`📝 KETERANGAN : ${entry.notes.trim()}`);
          }
          lines.push('');
        });
      });
    }

    lines.push('');
    lines.push('*DUMP*');
    return lines.join('\n');
  }, [greeting, unitLabel, groupsForWhatsapp, todayDateKey]);

  const whatsappShareUrl = useMemo(() => {
    const digits = waPhone.replace(/\D/g, '');
    let normalized = '';
    if (digits.startsWith('0')) {
      normalized = `62${digits.slice(1)}`;
    } else if (digits.startsWith('62')) {
      normalized = digits;
    } else if (digits.length > 6) {
      normalized = digits;
    }
    const base = normalized ? `https://wa.me/${normalized}` : 'https://wa.me/';
    return `${base}?text=${encodeURIComponent(whatsappReportText)}`;
  }, [waPhone, whatsappReportText]);

  const canNativeShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const handleCopyReport = async () => {
    try {
      await navigator.clipboard.writeText(whatsappReportText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      // Abaikan error clipboard
    }
  };

  const handleNativeShare = async () => {
    if (!canNativeShare) return;
    try {
      await navigator.share({
        title: `Rengiat ${unitLabel}`,
        text: whatsappReportText,
      });
    } catch {
      // Abaikan jika dibatalkan pengguna
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-600 shrink-0" />
            <span>Rengiat (Rencana Kegiatan)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Data tersimpan otomatis ({items.length} kegiatan) hingga dihapus
            manual. Pilih hari yang ingin dikirim ke WhatsApp.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleLoadExample}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>
              {items.length > 0 ? 'Tambah Contoh' : 'Muat Contoh Format'}
            </span>
          </button>

          {items.length > 0 && !confirmClearAll && (
            <button
              type="button"
              onClick={() => setConfirmClearAll(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 rounded-lg transition-colors whitespace-nowrap"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Semua</span>
            </button>
          )}

          {items.length > 0 && confirmClearAll && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-red-300 bg-red-50 text-xs">
              <span className="font-semibold text-red-800 whitespace-nowrap">
                Hapus {items.length} kegiatan?
              </span>
              <button
                type="button"
                onClick={() => {
                  setItems([]);
                  setSelectedWaDates([]);
                  setConfirmClearAll(false);
                  resetForm();
                }}
                className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white font-semibold rounded whitespace-nowrap"
              >
                Ya, Hapus
              </button>
              <button
                type="button"
                onClick={() => setConfirmClearAll(false)}
                className="px-2 py-1 text-slate-700 hover:text-slate-900 font-medium whitespace-nowrap"
              >
                Batal
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Split: Form & List on Left, Live WhatsApp Preview on Right */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left: Entry Form + Scheduled Items */}
        <div className="xl:col-span-7 space-y-5">
          {/* Header Report Settings */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label
                htmlFor="rengiat-greeting"
                className="block text-xs font-semibold text-slate-700"
              >
                Salam Pembuka Laporan
              </label>
              <select
                id="rengiat-greeting"
                value={greeting}
                onChange={(e) => setGreeting(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              >
                {GREETING_OPTIONS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="rengiat-unit-label"
                className="block text-xs font-semibold text-slate-700"
              >
                Nama Kesatuan di Laporan
              </label>
              <input
                id="rengiat-unit-label"
                type="text"
                value={unitLabel}
                onChange={(e) => setUnitLabel(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>
          </div>

          {/* Add / Edit Rengiat Form */}
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">
                {editingId
                  ? 'Edit Rencana Kegiatan'
                  : 'Tambah Rencana Kegiatan Baru'}
              </h2>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Batal Edit</span>
                </button>
              )}
            </div>

            {formError && (
              <div
                role="alert"
                className="px-3 py-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg"
              >
                {formError}
              </div>
            )}

            {/* Tanggal & Waktu */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="rengiat-date"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700"
                >
                  <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Tanggal Kegiatan</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    id="rengiat-date"
                    type="date"
                    value={dateKey}
                    onChange={(e) => setDateKey(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => setDateKey(todayDateKey)}
                    className="px-2.5 py-2 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg whitespace-nowrap"
                  >
                    Hari Ini
                  </button>
                  <button
                    type="button"
                    onClick={() => setDateKey(addDaysToDateKey(todayDateKey, 1))}
                    className="px-2.5 py-2 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg whitespace-nowrap"
                  >
                    Besok
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Waktu Kegiatan</span>
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
                    <button
                      type="button"
                      onClick={() => setTimeMode('WIB')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                        timeMode === 'WIB'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Jam (WIB)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimeMode('TENTATIF')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                        timeMode === 'TENTATIF'
                          ? 'bg-white text-amber-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      TENTATIF
                    </button>
                  </div>

                  {timeMode === 'WIB' && (
                    <input
                      type="text"
                      value={timeValue}
                      onChange={(e) => setTimeValue(e.target.value)}
                      placeholder="08.00"
                      aria-label="Jam kegiatan WIB"
                      className="w-24 px-3 py-1.5 text-xs font-mono font-semibold bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    />
                  )}
                </div>

                {timeMode === 'WIB' && (
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {QUICK_TIMES.map((qt) => (
                      <button
                        key={qt}
                        type="button"
                        onClick={() => setTimeValue(qt)}
                        className={`px-2 py-0.5 text-[11px] font-mono rounded border transition-colors ${
                          timeValue === qt
                            ? 'bg-blue-50 border-blue-400 text-blue-700 font-semibold'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {qt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Uraian Kegiatan */}
            <div className="space-y-1.5">
              <label
                htmlFor="rengiat-title"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700"
              >
                <BookmarkCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Nama / Uraian Kegiatan</span>
              </label>
              <input
                id="rengiat-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: GIAT QW SULING / APEL KRYD / PROGRAM QW1 : MINGGU KASIH"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>

            {/* Tempat (Pilihan Default + LAINNYA manual) */}
            <div className="space-y-2">
              <label
                htmlFor="rengiat-place"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700"
              >
                <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>Tempat Kegiatan</span>
              </label>
              <select
                id="rengiat-place"
                value={placePreset}
                onChange={(e) =>
                  setPlacePreset(e.target.value as RengiatPlacePreset)
                }
                className="w-full px-3 py-2 text-xs font-medium bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              >
                {PLACE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>

              {placePreset === 'LAINNYA' && (
                <input
                  type="text"
                  value={placeCustom}
                  onChange={(e) => setPlaceCustom(e.target.value)}
                  placeholder="Ketik tempat kegiatan secara manual..."
                  className="w-full px-3 py-2 text-xs bg-blue-50/50 border border-blue-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
              )}
            </div>

            {/* Pelaksana (Pilihan Default multi-pilih + LAINNYA manual) */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <Users className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Pelaksana (dapat pilih satu atau lebih)</span>
                </span>
                {pawasForSelectedDate.length > 0 && (
                  <span className="text-[11px] font-mono text-slate-500">
                    Pawas Tgl Ini:{' '}
                    {pawasForSelectedDate
                      .map((p) => `${p.pangkat} ${p.name}`)
                      .join(', ')}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {EXECUTOR_OPTIONS.map((opt) => {
                  const selected = executorPresets.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleExecutor(opt)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                        selected
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {selected && <Check className="w-3.5 h-3.5 shrink-0" />}
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>

              {executorPresets.includes('LAINNYA') && (
                <input
                  type="text"
                  value={executorCustom}
                  onChange={(e) => setExecutorCustom(e.target.value)}
                  placeholder="Ketik pelaksana secara manual (misal: KANIT BINMAS, PIKET BHABIN)..."
                  className="w-full px-3 py-2 text-xs bg-blue-50/50 border border-blue-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
              )}
            </div>

            {/* Keterangan / Catatan (Opsional — hanya dikirim ke WA jika terisi) */}
            <div className="space-y-1.5">
              <label
                htmlFor="rengiat-notes"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700"
              >
                <StickyNote className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Keterangan / Catatan (Opsional)</span>
              </label>
              <textarea
                id="rengiat-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Isi keterangan/catatan jika ada (kosongkan bila tidak perlu; hanya dikirim ke WA bila terisi)"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>

            <div className="pt-1 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>
                  {editingId ? 'Simpan Perubahan' : 'Tambahkan ke Rengiat'}
                </span>
              </button>
            </div>
          </form>

          {/* List of Rengiat Grouped by Date */}
          <div className="space-y-4">
            {groupedByDate.length === 0 ? (
              <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-6 text-center space-y-2">
                <FileText className="w-7 h-7 text-slate-400 mx-auto" />
                <div className="text-sm font-semibold text-slate-800">
                  Belum ada daftar Rengiat
                </div>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Tambahkan rencana kegiatan melalui formulir di atas, atau klik{' '}
                  <strong>Muat Contoh Format</strong> untuk melihat contoh
                  susunan laporan 2 hari.
                </p>
              </div>
            ) : (
              groupedByDate.map((group) => {
                const isSelectedForWa =
                  activeSelectedDates.length === 0 ||
                  activeSelectedDates.includes(group.dateKey);
                return (
                <div
                  key={group.dateKey}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden"
                >
                  <div className="bg-slate-900 text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-2 text-xs font-bold tracking-wide">
                      <Calendar className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                      <span>{group.heading}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedWaDates([group.dateKey])}
                        className={`px-2 py-0.5 text-[10px] font-semibold rounded border transition-colors whitespace-nowrap ${
                          activeSelectedDates.length === 1 &&
                          activeSelectedDates[0] === group.dateKey
                            ? 'bg-emerald-600 border-emerald-500 text-white'
                            : isSelectedForWa
                            ? 'bg-slate-800 border-slate-600 text-emerald-300 hover:border-emerald-400'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                        title="Kirim hanya kegiatan hari ini ke WhatsApp"
                      >
                        {activeSelectedDates.length === 1 &&
                        activeSelectedDates[0] === group.dateKey
                          ? 'Terpilih WA'
                          : 'Kirim Hari Ini'}
                      </button>
                      <span className="text-[11px] font-mono text-slate-300">
                        {group.entries.length} giat
                      </span>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-200">
                    {group.entries.map((entry, idx) => (
                      <div
                        key={entry.id}
                        className="p-3.5 sm:p-4 flex items-start justify-between gap-3 hover:bg-slate-50/70"
                      >
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono font-bold bg-blue-50 text-blue-800 border border-blue-200 rounded">
                              <Clock className="w-3 h-3 text-blue-600 shrink-0" />
                              <span>
                                {idx + 1}.{' '}
                                {entry.timeMode === 'TENTATIF'
                                  ? 'TENTATIF'
                                  : `PKL.${entry.timeValue} WIB`}
                              </span>
                            </span>
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-900">
                              <BookmarkCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span>{entry.title}</span>
                            </span>
                          </div>
                          <div className="flex items-start gap-1.5 text-xs text-slate-600">
                            <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                            <span>
                              <span className="font-semibold text-slate-700">
                                TEMPAT:
                              </span>{' '}
                              {resolvePlaceText(entry)}
                            </span>
                          </div>
                          <div className="flex items-start gap-1.5 text-xs text-slate-600">
                            <Users className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>
                              <span className="font-semibold text-slate-700">
                                PELAKSANA:
                              </span>{' '}
                              {resolveExecutorText(entry)}
                            </span>
                          </div>
                          {entry.notes && entry.notes.trim() && (
                            <div className="flex items-start gap-1.5 text-xs text-slate-600">
                              <StickyNote className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                              <span className="whitespace-pre-line">
                                <span className="font-semibold text-slate-700">
                                  KETERANGAN:
                                </span>{' '}
                                {entry.notes.trim()}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              handleMoveItem(group.dateKey, entry.id, 'up')
                            }
                            disabled={idx === 0}
                            title="Naikkan urutan"
                            className="p-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-30 rounded border border-slate-200 bg-white"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleMoveItem(group.dateKey, entry.id, 'down')
                            }
                            disabled={idx === group.entries.length - 1}
                            title="Turunkan urutan"
                            className="p-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-30 rounded border border-slate-200 bg-white"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditItem(entry)}
                            title="Edit kegiatan"
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded border border-slate-200 bg-white"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(entry.id)}
                            title="Hapus kegiatan"
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded border border-slate-200 bg-white"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Live WhatsApp Formatted Preview & Send */}
        <div className="xl:col-span-5">
          <div className="bg-slate-900 text-slate-100 rounded-xl border border-slate-800 overflow-hidden sticky top-20">
            <div className="px-4 py-3 border-b border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-300">
                    Pratinjau Laporan WhatsApp
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {groupedByDate.length === 0
                      ? 'Belum ada kegiatan tersimpan'
                      : activeSelectedDates.length === 0
                      ? `Mengirim semua hari (${groupedByDate.length} hari)`
                      : `Mengirim ${groupsForWhatsapp.length} hari terpilih`}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyReport}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin</span>
                      </>
                    )}
                  </button>

                  {canNativeShare && (
                    <button
                      type="button"
                      onClick={handleNativeShare}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Bagikan</span>
                    </button>
                  )}

                  <a
                    href={whatsappShareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim ke WA</span>
                  </a>
                </div>
              </div>

              {/* Selector Hari yang Akan Dikirim via WhatsApp */}
              {groupedByDate.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] font-semibold text-slate-300">
                    Pilih Kegiatan Hari yang Dikirim via WA:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedWaDates([])}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-md border transition-colors whitespace-nowrap ${
                        activeSelectedDates.length === 0
                          ? 'bg-amber-500 border-amber-400 text-slate-950'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                      }`}
                    >
                      Semua Hari ({groupedByDate.length})
                    </button>
                    {groupedByDate.map((g) => {
                      const isChecked =
                        activeSelectedDates.length > 0 &&
                        activeSelectedDates.includes(g.dateKey);
                      return (
                        <button
                          key={g.dateKey}
                          type="button"
                          onClick={() => toggleWaDate(g.dateKey)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md border transition-colors whitespace-nowrap ${
                            isChecked
                              ? 'bg-emerald-600 border-emerald-500 text-white font-semibold'
                              : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 shrink-0" />}
                          <span>
                            {g.shortChip} ({g.entries.length})
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="tel"
                  value={waPhone}
                  onChange={(e) => setWaPhone(e.target.value)}
                  placeholder="No. WA tujuan opsional (misal: 0812... atau kosongkan untuk pilih grup)"
                  aria-label="Nomor WhatsApp tujuan (opsional)"
                  className="w-full px-2.5 py-1.5 text-[11px] font-mono bg-slate-950/70 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <pre className="p-4 text-xs font-mono leading-relaxed whitespace-pre-wrap text-slate-100 max-h-[620px] overflow-y-auto">
              {whatsappReportText}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
