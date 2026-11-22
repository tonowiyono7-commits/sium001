import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Calendar,
  ChevronDown,
  Layers,
  PenTool,
  Plus,
  RotateCcw,
  Stamp,
  Trash2,
  Upload,
  UserPlus,
  Users,
} from 'lucide-react';
import { DEFAULT_STAMP_CONFIG } from '../../data/buatSprinDefaultData';
import { DEFAULT_PAWAS_ANCHOR } from '../../data/polriOktober2026';
import { PersonnelRow, SprinDocument, StampSignatureConfig } from '../../types/buatSprin';
import { PawasAnchor, Personnel, ShiftCode, ShiftOverrides } from '../../types/polriRoster';
import {
  getEffectivePersonnelForMonth,
  getEffectiveShift,
  isPersonPausedOnDate,
  MONTH_NAMES_ID,
} from '../../utils/continuousRoster';
import { normalizeSignerNamePerkap } from '../../utils/perkap2023Rules';
import { DefaultSignatureGraphic, DefaultStampGraphic } from './PolriEmblems';

export type EditorSectionId = 'hal1' | 'hal2' | 'pengesahan' | 'ttd';

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

interface SprinEditorFormProps {
  doc: SprinDocument;
  onChange: (updated: SprinDocument) => void;
  roster: PersonnelRow[];
  mainPersonnel?: Personnel[];
  todayDateKey?: string;
  pawasAnchor?: PawasAnchor;
  overrides?: ShiftOverrides;
  onNotice?: (msg: string) => void;
  activeSection: EditorSectionId;
  onChangeSection: (section: EditorSectionId) => void;
}

export const SprinEditorForm: React.FC<SprinEditorFormProps> = ({
  doc,
  onChange,
  roster,
  mainPersonnel = [],
  todayDateKey = '2026-11-18',
  pawasAnchor = DEFAULT_PAWAS_ANCHOR,
  overrides = {},
  onNotice,
  activeSection,
  onChangeSection,
}) => {
  const [showRosterModal, setShowRosterModal] = useState(false);
  const [rosterDateKey, setRosterDateKey] = useState<string>(todayDateKey);
  const [rosterSearch, setRosterSearch] = useState<string>('');
  const [selectedRosterIds, setSelectedRosterIds] = useState<string[]>([]);
  const [showCustomPersonForm, setShowCustomPersonForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customPangkat, setCustomPangkat] = useState('');
  const [customNrp, setCustomNrp] = useState('');
  const [customJabatan, setCustomJabatan] = useState('');
  const [customKet, setCustomKet] = useState('SDA');
  const [bulkKetInput, setBulkKetInput] = useState('SDA');
  const stampInputRef = useRef<HTMLInputElement>(null);
  const sigInputRef = useRef<HTMLInputElement>(null);

  const stampCfg: StampSignatureConfig = {
    ...DEFAULT_STAMP_CONFIG,
    ...(doc.stampConfig || {}),
  };

  const updateField = <K extends keyof SprinDocument>(key: K, value: SprinDocument[K]) => {
    onChange({
      ...doc,
      [key]: value,
      updatedAt: new Date().toISOString(),
    });
  };

  const updateStampConfig = <K extends keyof StampSignatureConfig>(
    key: K,
    value: StampSignatureConfig[K]
  ) => {
    onChange({
      ...doc,
      showStampAndSignature: true,
      stampConfig: {
        ...stampCfg,
        [key]: value,
      },
      updatedAt: new Date().toISOString(),
    });
  };

  const handleImageImport = (
    file: File | undefined,
    target: 'stampImageDataUrl' | 'signatureImageDataUrl'
  ) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateStampConfig(target, reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // List helpers for Dasar, Untuk, Tembusan
  const updateListItem = (
    key: 'dasarList' | 'untukList' | 'tembusanList',
    index: number,
    value: string
  ) => {
    const next = [...doc[key]];
    next[index] = value;
    updateField(key, next);
  };

  const addListItem = (key: 'dasarList' | 'untukList' | 'tembusanList', placeholder: string) => {
    updateField(key, [...doc[key], placeholder]);
  };

  const removeListItem = (key: 'dasarList' | 'untukList' | 'tembusanList', index: number) => {
    const next = doc[key].filter((_, i) => i !== index);
    updateField(key, next);
  };

  // Personnel table helpers
  const updatePersonnel = (id: string, field: keyof PersonnelRow, value: string) => {
    const next = doc.personelList.map((row) =>
      row.id === id ? { ...row, [field]: value } : row
    );
    updateField('personelList', next);
  };

  const addBlankPersonnel = () => {
    const newRow: PersonnelRow = {
      id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      nama: '',
      pangkat: 'AIPDA',
      nrp: '',
      jabatan: '',
      ket: '',
    };
    updateField('personelList', [...doc.personelList, newRow]);
  };

  const addFromRoster = (person: PersonnelRow) => {
    const alreadyExists = doc.personelList.some((p) => p.nrp === person.nrp && person.nrp !== '');
    if (alreadyExists) return;
    const cloned: PersonnelRow = {
      ...person,
      id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    updateField('personelList', [...doc.personelList, cloned]);
  };

  const movePersonnel = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= doc.personelList.length) return;
    const next = [...doc.personelList];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    updateField('personelList', next);
  };

  const removePersonnel = (id: string) => {
    updateField(
      'personelList',
      doc.personelList.filter((r) => r.id !== id)
    );
  };

  // Hitung status piket tiap personel pada tanggal yang dipilih
  const rosterCandidates = useMemo(() => {
    const { year, monthIndex, day } = parseDateKeyParts(rosterDateKey);
    const monthPersonnel = getEffectivePersonnelForMonth(
      mainPersonnel,
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
  }, [mainPersonnel, rosterDateKey, overrides, pawasAnchor, rosterSearch]);

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
    onNotice?.(
      `Terpilih ${picked.length} personel piket (${formatIndonesianTitleDate(rosterDateKey)}). Klik "Masukkan ke Tabel" untuk menambahkan.`
    );
  };

  const isPersonAlreadyInSprin = (p: Personnel) => {
    const nrpTrim = p.nrp.trim();
    const normName = normalizeSignerNamePerkap(p.name);
    return doc.personelList.some(
      (row) =>
        (nrpTrim !== '' && row.nrp.trim() === nrpTrim) ||
        row.nama.trim().toUpperCase() === normName
    );
  };

  const handleAddSelectedFromJadwal = () => {
    if (selectedRosterIds.length === 0) return;
    const selectedSet = new Set(selectedRosterIds);
    const toAdd: PersonnelRow[] = rosterCandidates
      .filter((c) => selectedSet.has(c.person.id) && !isPersonAlreadyInSprin(c.person))
      .map((c, idx) => ({
        id: `sprin_piket_${c.person.id}_${Date.now().toString(36)}_${idx}`,
        nama: normalizeSignerNamePerkap(c.person.name),
        pangkat: c.person.pangkat.trim().toUpperCase(),
        nrp: c.person.nrp.trim(),
        jabatan: c.person.jabatan.trim().toUpperCase(),
        ket: doc.personelList.length === 0 && idx === 0 ? 'PADAL' : 'SDA',
      }));

    if (toAdd.length === 0) {
      onNotice?.('Semua personel yang dicentang sudah ada di daftar surat.');
      return;
    }

    updateField('personelList', [...doc.personelList, ...toAdd]);
    setSelectedRosterIds([]);
    onNotice?.(`${toAdd.length} personel dari Jadwal Piket ditambahkan ke Sprin.`);
  };

  const handleAddCustomPerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    const newRow: PersonnelRow = {
      id: `sprin_manual_${Date.now().toString(36)}`,
      nama: normalizeSignerNamePerkap(customName),
      pangkat: customPangkat.trim().toUpperCase(),
      nrp: customNrp.trim(),
      jabatan: customJabatan.trim().toUpperCase(),
      ket: customKet.trim().toUpperCase() || 'SDA',
    };
    updateField('personelList', [...doc.personelList, newRow]);
    setCustomName('');
    setCustomPangkat('');
    setCustomNrp('');
    setCustomJabatan('');
    setCustomKet('SDA');
    setShowCustomPersonForm(false);
    onNotice?.(`${newRow.nama} ditambahkan ke daftar personel.`);
  };

  const handleApplyBulkKet = () => {
    const val = bulkKetInput.trim().toUpperCase();
    if (!val) return;
    updateField(
      'personelList',
      doc.personelList.map((r) => ({ ...r, ket: val }))
    );
    onNotice?.(`Keterangan seluruh personel terlampir diubah menjadi "${val}".`);
  };

  const sections: { id: EditorSectionId; shortLabel: string }[] = [
    { id: 'hal1', shortLabel: '1. Hal 1' },
    {
      id: 'hal2',
      shortLabel: doc.useLampiran
        ? `2. Hal 2 (${doc.personelList.length})`
        : `2. Kepada (${doc.personelList.length})`,
    },
    { id: 'pengesahan', shortLabel: '3. Pejabat' },
    { id: 'ttd', shortLabel: '4. TTD & Stempel' },
  ];

  return (
    <div className="space-y-4">
      {/* Interactive Section Switcher Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1.5 rounded-xl bg-[#19140E] border border-[#3A3024]">
        {sections.map((sec) => {
          const active = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => onChangeSection(sec.id)}
              className={`px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap truncate cursor-pointer ${
                active
                  ? 'bg-[#D4A017] text-[#14100C]'
                  : 'text-[#B5A894] hover:text-[#F5F0E6] hover:bg-[#251E16]'
              }`}
            >
              {sec.shortLabel}
            </button>
          );
        })}
      </div>

      {/* SECTION 1: SURAT PERINTAH HALAMAN 1 (Matches Image 2) */}
      {activeSection === 'hal1' && (
        <section className="rounded-xl bg-[#1E1812] border border-[#3A3024] p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-lg font-bold tracking-wide text-[#F7F2E8] uppercase">
              1. ISI SURAT PERINTAH (HALAMAN 1)
            </h2>
            <span className="text-xs text-[#9E907A] font-mono-num">
              {doc.useLampiran ? '2 Hal + Lampiran' : '1 Hal · Tanpa Lampiran'}
            </span>
          </div>

          {/* Konsep Format Surat Toggle */}
          <div className="rounded-xl bg-[#15110C] border border-[#3D3225] p-3 space-y-2">
            <div className="text-xs font-semibold text-[#F5F0E6]">Konsep Format Surat</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => updateField('useLampiran', false)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  !doc.useLampiran
                    ? 'bg-[#D4A017]/20 border-[#D4A017] text-[#F4C94D]'
                    : 'bg-[#1E1812] border-[#362C21] text-[#A89C89] hover:text-[#F5F0E6]'
                }`}
              >
                Tanpa Lampiran (1 Hal)
              </button>
              <button
                type="button"
                onClick={() => updateField('useLampiran', true)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  doc.useLampiran
                    ? 'bg-[#D4A017]/20 border-[#D4A017] text-[#F4C94D]'
                    : 'bg-[#1E1812] border-[#362C21] text-[#A89C89] hover:text-[#F5F0E6]'
                }`}
              >
                Dengan Lampiran (2 Hal)
              </button>
            </div>
            {doc.useLampiran && (
              <div className="pt-1 flex items-center justify-between gap-3 border-t border-[#2E251B]">
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold text-[#F4C94D]">
                    Lampiran Halaman 2 ({doc.personelList.length} Personel)
                  </div>
                  <div className="text-[11px] text-[#9E907A] truncate">
                    {doc.personelList.length > 0
                      ? doc.personelList.map((p) => `${p.pangkat} ${p.nama}`).join(', ')
                      : 'Belum ada personel terlampir'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onChangeSection('hal2')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D4A017] hover:bg-[#E5B022] text-xs font-bold text-[#14100C] shrink-0 cursor-pointer transition-colors"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Atur Personel</span>
                </button>
              </div>
            )}
          </div>

          <div className="space-y-3.5">
            <div className="grid grid-cols-1 gap-2.5">
              <label className="block text-xs font-medium text-[#B5A894]">
                Kop Surat Kesatuan (3 Baris)
              </label>
              <input
                type="text"
                value={doc.kopLine1}
                onChange={(e) => updateField('kopLine1', e.target.value)}
                className="w-full rounded-lg bg-[#15110C] border border-[#3D3225] focus:border-[#D4A017] focus:outline-none px-3 py-2 text-xs text-[#F5F0E6] uppercase"
              />
              <input
                type="text"
                value={doc.kopLine2}
                onChange={(e) => updateField('kopLine2', e.target.value)}
                className="w-full rounded-lg bg-[#15110C] border border-[#3D3225] focus:border-[#D4A017] focus:outline-none px-3 py-2 text-xs text-[#F5F0E6] uppercase"
              />
              <input
                type="text"
                value={doc.kopLine3}
                onChange={(e) => updateField('kopLine3', e.target.value)}
                className="w-full rounded-lg bg-[#15110C] border border-[#3D3225] focus:border-[#D4A017] focus:outline-none px-3 py-2 text-xs text-[#F5F0E6] uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#B5A894] mb-1.5">
                Nomor Surat Perintah
              </label>
              <input
                type="text"
                value={doc.nomorSprin}
                onChange={(e) => {
                  const val = e.target.value;
                  onChange({
                    ...doc,
                    nomorSprin: val,
                    lampiranNomor: val.toUpperCase(),
                    updatedAt: new Date().toISOString(),
                  });
                }}
                className="w-full rounded-lg bg-[#15110C] border border-[#3D3225] focus:border-[#D4A017] focus:outline-none px-3.5 py-2.5 text-sm text-[#F5F0E6] font-mono-num"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#B5A894] mb-1.5">
                Pertimbangan
              </label>
              <textarea
                rows={3}
                value={doc.pertimbangan}
                onChange={(e) => updateField('pertimbangan', e.target.value)}
                className="w-full rounded-lg bg-[#15110C] border border-[#3D3225] focus:border-[#D4A017] focus:outline-none px-3.5 py-2.5 text-sm text-[#F5F0E6] leading-relaxed"
              />
            </div>

            {/* Dasar List */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-[#B5A894]">Dasar Hukum & Surat</label>
                <button
                  type="button"
                  onClick={() => addListItem('dasarList', 'Dasar tambahan...')}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#D4A017] hover:text-[#F4C94D] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Dasar</span>
                </button>
              </div>
              <div className="space-y-2">
                {doc.dasarList.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="font-mono-num text-xs text-[#9E907A] pt-2.5 w-5 shrink-0">
                      {idx + 1}.
                    </span>
                    <textarea
                      rows={2}
                      value={item}
                      onChange={(e) => updateListItem('dasarList', idx, e.target.value)}
                      className="flex-1 rounded-lg bg-[#15110C] border border-[#3D3225] focus:border-[#D4A017] focus:outline-none px-3 py-2 text-xs text-[#F5F0E6] leading-relaxed"
                    />
                    {doc.dasarList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeListItem('dasarList', idx)}
                        aria-label="Hapus dasar"
                        className="p-2 text-[#9E907A] hover:text-red-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {doc.useLampiran ? (
              <div className="space-y-2.5">
                <div>
                  <label className="block text-xs font-medium text-[#B5A894] mb-1.5">Kepada</label>
                  <textarea
                    rows={2}
                    value={doc.kepadaText}
                    onChange={(e) => updateField('kepadaText', e.target.value)}
                    className="w-full rounded-lg bg-[#15110C] border border-[#3D3225] focus:border-[#D4A017] focus:outline-none px-3.5 py-2 text-xs text-[#F5F0E6] uppercase leading-relaxed"
                  />
                </div>
                <div className="rounded-lg bg-[#15110C] border border-[#3D3225] p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[#B5A894]">
                      Daftar Personel Lampiran Hal. 2 ({doc.personelList.length} Personel)
                    </div>
                    <div className="text-[11px] text-[#9E907A] truncate mt-0.5">
                      {doc.personelList.length > 0
                        ? doc.personelList.map((p) => `${p.pangkat} ${p.nama}`).join(', ')
                        : 'Belum ada personel dipilih'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onChangeSection('hal2')}
                    className="px-3 py-1.5 rounded-lg bg-[#251E16] border border-[#4A3D2C] hover:border-[#D4A017] text-xs font-semibold text-[#F4C94D] shrink-0 cursor-pointer"
                  >
                    Atur Personel
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-[#15110C] border border-[#3D3225] p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[#B5A894]">
                    Kepada ({doc.personelList.length} Personel)
                  </div>
                  <div className="text-[11px] text-[#9E907A] truncate mt-0.5">
                    {doc.personelList.length > 0
                      ? doc.personelList.map((p) => `${p.pangkat} ${p.nama}`).join(', ')
                      : 'Belum ada personel dipilih'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onChangeSection('hal2')}
                  className="px-3 py-1.5 rounded-lg bg-[#251E16] border border-[#4A3D2C] hover:border-[#D4A017] text-xs font-semibold text-[#F4C94D] shrink-0 cursor-pointer"
                >
                  Atur Personel
                </button>
              </div>
            )}

            {/* Untuk List */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-[#B5A894]">
                  Untuk (Poin Perintah Tugas)
                </label>
                <button
                  type="button"
                  onClick={() => addListItem('untukList', 'Poin perintah tugas baru;')}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#D4A017] hover:text-[#F4C94D] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Poin</span>
                </button>
              </div>
              <div className="space-y-2">
                {doc.untukList.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="font-mono-num text-xs text-[#9E907A] pt-2.5 w-5 shrink-0">
                      {idx + 1}.
                    </span>
                    <textarea
                      rows={2}
                      value={item}
                      onChange={(e) => updateListItem('untukList', idx, e.target.value)}
                      className="flex-1 rounded-lg bg-[#15110C] border border-[#3D3225] focus:border-[#D4A017] focus:outline-none px-3 py-2 text-xs text-[#F5F0E6] leading-relaxed"
                    />
                    {doc.untukList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeListItem('untukList', idx)}
                        aria-label="Hapus poin untuk"
                        className="p-2 text-[#9E907A] hover:text-red-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Tembusan List */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-[#B5A894]">Tembusan</label>
                <button
                  type="button"
                  onClick={() => addListItem('tembusanList', 'Kasi Propam Polrestabes Smg')}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#D4A017] hover:text-[#F4C94D] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Tembusan</span>
                </button>
              </div>
              <div className="space-y-2">
                {doc.tembusanList.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="font-mono-num text-xs text-[#9E907A] w-5 shrink-0">
                      {idx + 1}.
                    </span>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => updateListItem('tembusanList', idx, e.target.value)}
                      className="flex-1 rounded-lg bg-[#15110C] border border-[#3D3225] focus:border-[#D4A017] focus:outline-none px-3 py-2 text-xs text-[#F5F0E6]"
                    />
                    {doc.tembusanList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeListItem('tembusanList', idx)}
                        aria-label="Hapus tembusan"
                        className="p-2 text-[#9E907A] hover:text-red-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 2: LAMPIRAN & DAFTAR PERSONEL HALAMAN 2 (Matches Image 3) */}
      {activeSection === 'hal2' && (
        <section className="rounded-xl bg-[#1E1812] border border-[#3A3024] p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-lg font-bold tracking-wide text-[#F7F2E8] uppercase">
              {doc.useLampiran
                ? '2. LAMPIRAN PERSONEL (HALAMAN 2)'
                : '2. PERSONEL YANG DIPERINTAHKAN (KEPADA)'}
            </h2>
            <span className="text-xs text-[#9E907A] font-mono-num">
              {doc.personelList.length} Pers
            </span>
          </div>

          {doc.useLampiran && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#B5A894] mb-1">
                  Keterangan Lampiran Kanan Atas
                </label>
                <input
                  type="text"
                  value={doc.lampiranHeaderTitle}
                  onChange={(e) => updateField('lampiranHeaderTitle', e.target.value)}
                  className="w-full rounded-lg bg-[#15110C] border border-[#3D3225] focus:border-[#D4A017] focus:outline-none px-3 py-2 text-xs text-[#F5F0E6] uppercase"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#B5A894] mb-1">
                    Nomor Lampiran
                  </label>
                  <input
                    type="text"
                    value={doc.lampiranNomor}
                    onChange={(e) => updateField('lampiranNomor', e.target.value)}
                    className="w-full rounded-lg bg-[#15110C] border border-[#3D3225] focus:border-[#D4A017] focus:outline-none px-3 py-2 text-xs text-[#F5F0E6] font-mono-num uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#B5A894] mb-1">
                    Tanggal Lampiran (Kapital)
                  </label>
                  <input
                    type="text"
                    value={doc.lampiranTanggalUpper}
                    onChange={(e) => updateField('lampiranTanggalUpper', e.target.value)}
                    className="w-full rounded-lg bg-[#15110C] border border-[#3D3225] focus:border-[#D4A017] focus:outline-none px-3 py-2 text-xs text-[#F5F0E6] font-mono-num uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#B5A894] mb-1">
                  Judul Daftar Personel
                </label>
                <input
                  type="text"
                  value={doc.lampiranJudul}
                  onChange={(e) => updateField('lampiranJudul', e.target.value)}
                  className="w-full rounded-lg bg-[#15110C] border border-[#3D3225] focus:border-[#D4A017] focus:outline-none px-3 py-2 text-xs text-[#F5F0E6] uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#B5A894] mb-1">
                  Subjudul Hari & Tanggal Pelaksanaan
                </label>
                <input
                  type="text"
                  value={doc.lampiranSubjudul}
                  onChange={(e) => updateField('lampiranSubjudul', e.target.value)}
                  className="w-full rounded-lg bg-[#15110C] border border-[#3D3225] focus:border-[#D4A017] focus:outline-none px-3 py-2 text-xs text-[#F5F0E6] uppercase"
                />
              </div>
            </div>
          )}

          <div className={doc.useLampiran ? 'pt-3 border-t border-[#32291E] space-y-4' : 'pt-1 space-y-4'}>
            {/* Picker: Pilih Nama Personel Langsung dari Jadwal Piket */}
            <div className="rounded-xl bg-[#15110C] border border-[#3D3225] p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-bold text-[#F5F0E6] uppercase tracking-wide flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#D4A017] shrink-0" />
                  <span>
                    Pilih Nama Personel Langsung dari Jadwal Piket ({doc.personelList.length} terlampir)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCustomPersonForm((v) => !v)}
                  className="text-xs font-semibold text-[#F4C94D] hover:text-[#FDE68A] cursor-pointer"
                >
                  {showCustomPersonForm ? 'Tutup Input Manual' : '+ Tambah Nama Manual'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                <div className="sm:col-span-4 space-y-1">
                  <label className="text-[11px] font-medium text-[#B5A894] flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#D4A017]" />
                    <span>Tanggal Jadwal Piket</span>
                  </label>
                  <input
                    type="date"
                    value={rosterDateKey}
                    onChange={(e) => setRosterDateKey(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs rounded-lg bg-[#1E1812] border border-[#3D3225] focus:border-[#D4A017] focus:outline-none text-[#F5F0E6]"
                  />
                </div>

                <div className="sm:col-span-4 space-y-1">
                  <label className="text-[11px] font-medium text-[#B5A894]">
                    Cari Nama / Unit / Jabatan
                  </label>
                  <input
                    type="text"
                    value={rosterSearch}
                    onChange={(e) => setRosterSearch(e.target.value)}
                    placeholder="Cari nama, PAWAS, SAMAPTA..."
                    className="w-full px-2.5 py-2 text-xs rounded-lg bg-[#1E1812] border border-[#3D3225] focus:border-[#D4A017] focus:outline-none text-[#F5F0E6]"
                  />
                </div>

                <div className="sm:col-span-4">
                  <button
                    type="button"
                    onClick={handleAddSelectedFromJadwal}
                    disabled={selectedRosterIds.length === 0}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-[#14100C] bg-[#D4A017] hover:bg-[#E5B022] disabled:bg-[#2A2218] disabled:text-[#8C7E69] rounded-lg transition-colors whitespace-nowrap cursor-pointer disabled:cursor-not-allowed"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Masukkan ke Tabel ({selectedRosterIds.length})</span>
                  </button>
                </div>
              </div>

              {/* Quick Shift Selection Chips */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold text-[#9E907A] mr-1">
                  Centang cepat:
                </span>
                <button
                  type="button"
                  onClick={() => handleQuickFilterPick('ON_DUTY')}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-[#2A2218] text-[#F4C94D] border border-[#8D6B38]/60 hover:bg-[#382D1F] rounded-md cursor-pointer"
                >
                  Semua Piket Tanggal Ini
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFilterPick('24J')}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-sky-950/60 text-sky-200 border border-sky-700/50 hover:bg-sky-900/60 rounded-md cursor-pointer"
                >
                  Piket 24J (X &amp; P)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFilterPick('SIANG')}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-amber-950/60 text-amber-200 border border-amber-700/50 hover:bg-amber-900/60 rounded-md cursor-pointer"
                >
                  Piket Siang (S)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFilterPick('MALAM')}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-[#241D15] text-[#D6CEC2] border border-[#3E3325] hover:bg-[#2E251A] rounded-md cursor-pointer"
                >
                  Piket Malam (M)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFilterPick('ALL_VISIBLE')}
                  className="px-2.5 py-1 text-[11px] font-medium bg-[#1E1812] text-[#C8BCA8] border border-[#362C21] hover:bg-[#2A2218] rounded-md cursor-pointer"
                >
                  Pilih Semua ({rosterCandidates.length})
                </button>
                {selectedRosterIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleQuickFilterPick('CLEAR')}
                    className="px-2.5 py-1 text-[11px] font-medium text-rose-300 bg-rose-950/50 border border-rose-700/50 hover:bg-rose-900/50 rounded-md cursor-pointer"
                  >
                    Reset Centang
                  </button>
                )}
              </div>

              {/* Multi-select Checklist */}
              <div className="max-h-52 overflow-y-auto border border-[#32291E] rounded-lg divide-y divide-[#2A2218] bg-[#120E0A]">
                {rosterCandidates.length === 0 ? (
                  <div className="px-3 py-4 text-center text-xs text-[#8C7E69]">
                    Tidak ada personel jadwal piket yang cocok dengan pencarian.
                  </div>
                ) : (
                  rosterCandidates.map(({ person, shift, paused }) => {
                    const checked = selectedRosterIds.includes(person.id);
                    const alreadyInRows = isPersonAlreadyInSprin(person);
                    return (
                      <label
                        key={person.id}
                        className={`flex items-center gap-2.5 px-3 py-1.5 text-xs cursor-pointer transition-colors ${
                          checked ? 'bg-[#D4A017]/15' : 'hover:bg-[#1E1812]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleCandidate(person.id)}
                          className="w-4 h-4 rounded border-[#4A3D2C] accent-[#D4A017] shrink-0"
                        />
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono-num font-bold bg-[#241D15] text-[#D6CEC2] border border-[#3E3325] shrink-0">
                          {person.unit} · {paused ? 'JEDA' : shift || '-'}
                        </span>
                        <span className="font-semibold text-[#F5F0E6] truncate">
                          {person.pangkat} {person.name}
                        </span>
                        <span className="text-[#8C7E69] truncate hidden sm:inline">
                          — {person.jabatan}
                        </span>
                        {alreadyInRows && (
                          <span className="ml-auto text-[10px] font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-700/50 px-1.5 py-0.5 rounded shrink-0">
                            Sudah di daftar
                          </span>
                        )}
                      </label>
                    );
                  })
                )}
              </div>

              {showCustomPersonForm && (
                <form
                  onSubmit={handleAddCustomPerson}
                  className="pt-3 border-t border-[#32291E] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2 items-end"
                >
                  <input
                    type="text"
                    required
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="NAMA *"
                    className="px-2.5 py-1.5 text-xs rounded-lg bg-[#1E1812] border border-[#3D3225] focus:border-[#D4A017] focus:outline-none text-[#F5F0E6] uppercase"
                  />
                  <input
                    type="text"
                    value={customPangkat}
                    onChange={(e) => setCustomPangkat(e.target.value)}
                    placeholder="PANGKAT"
                    className="px-2.5 py-1.5 text-xs rounded-lg bg-[#1E1812] border border-[#3D3225] focus:border-[#D4A017] focus:outline-none text-[#F5F0E6] uppercase"
                  />
                  <input
                    type="text"
                    value={customNrp}
                    onChange={(e) => setCustomNrp(e.target.value)}
                    placeholder="NRP"
                    className="px-2.5 py-1.5 text-xs rounded-lg bg-[#1E1812] border border-[#3D3225] focus:border-[#D4A017] focus:outline-none text-[#F5F0E6] font-mono-num"
                  />
                  <input
                    type="text"
                    value={customJabatan}
                    onChange={(e) => setCustomJabatan(e.target.value)}
                    placeholder="JABATAN"
                    className="px-2.5 py-1.5 text-xs rounded-lg bg-[#1E1812] border border-[#3D3225] focus:border-[#D4A017] focus:outline-none text-[#F5F0E6] uppercase"
                  />
                  <input
                    type="text"
                    value={customKet}
                    onChange={(e) => setCustomKet(e.target.value)}
                    placeholder="KET (PADAL/SDA)"
                    className="px-2.5 py-1.5 text-xs rounded-lg bg-[#1E1812] border border-[#3D3225] focus:border-[#D4A017] focus:outline-none text-[#F5F0E6] uppercase"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-xs font-bold text-[#14100C] bg-[#D4A017] hover:bg-[#E5B022] rounded-lg cursor-pointer"
                  >
                    Simpan Baris
                  </button>
                </form>
              )}
            </div>

            {/* Active Personnel List Header + Bulk Ket Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#F5F0E6]">
                Daftar Personel Terlampir ({doc.personelList.length})
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowRosterModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#4A3D2C] bg-[#251E16] hover:border-[#D4A017] text-xs font-semibold text-[#F4C94D] transition-colors cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Database Sprin</span>
                </button>
                <button
                  type="button"
                  onClick={addBlankPersonnel}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D4A017] hover:bg-[#E5B022] text-xs font-bold text-[#14100C] transition-colors cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Tambah Baris</span>
                </button>
              </div>
            </div>

            {doc.personelList.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 bg-[#15110C] p-2.5 rounded-lg border border-[#362C21]">
                <span className="text-[11px] font-semibold text-[#B5A894]">
                  Atur Keterangan Masal:
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <input
                    type="text"
                    value={bulkKetInput}
                    onChange={(e) => setBulkKetInput(e.target.value)}
                    placeholder="Atur Ket masal (misal: SDA)..."
                    className="px-2.5 py-1 text-xs rounded-md bg-[#1E1812] border border-[#3D3225] focus:border-[#D4A017] focus:outline-none text-[#F5F0E6] w-40 uppercase"
                  />
                  <button
                    type="button"
                    onClick={handleApplyBulkKet}
                    className="px-2.5 py-1 text-xs font-semibold text-[#14100C] bg-[#D4A017] hover:bg-[#E5B022] rounded-md cursor-pointer"
                  >
                    Terapkan Masal
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField('personelList', [])}
                    className="px-2.5 py-1 text-xs font-semibold text-rose-300 bg-rose-950/50 border border-rose-700/50 hover:bg-rose-900/50 rounded-md cursor-pointer"
                  >
                    Kosongkan
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2.5">
              {doc.personelList.map((row, idx) => (
                <div
                  key={row.id}
                  className="rounded-lg bg-[#15110C] border border-[#362C21] p-3 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono-num text-xs font-semibold text-[#D4A017]">
                      Personel #{idx + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => movePersonnel(idx, -1)}
                        aria-label="Naikkan urutan"
                        className="p-1 rounded text-[#9E907A] hover:text-[#F5F0E6] disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === doc.personelList.length - 1}
                        onClick={() => movePersonnel(idx, 1)}
                        aria-label="Turunkan urutan"
                        className="p-1 rounded text-[#9E907A] hover:text-[#F5F0E6] disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removePersonnel(row.id)}
                        aria-label="Hapus personel"
                        className="p-1 rounded text-[#9E907A] hover:text-red-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={row.nama}
                      onChange={(e) => updatePersonnel(row.id, 'nama', e.target.value)}
                      placeholder="Nama Lengkap"
                      className="rounded bg-[#1E1812] border border-[#3D3225] focus:border-[#D4A017] focus:outline-none px-2.5 py-1.5 text-xs text-[#F5F0E6] uppercase"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={row.pangkat}
                        onChange={(e) => updatePersonnel(row.id, 'pangkat', e.target.value)}
                        placeholder="Pangkat"
                        className="rounded bg-[#1E1812] border border-[#3D3225] focus:border-[#D4A017] focus:outline-none px-2.5 py-1.5 text-xs text-[#F5F0E6] uppercase"
                      />
                      <input
                        type="text"
                        value={row.nrp}
                        onChange={(e) => updatePersonnel(row.id, 'nrp', e.target.value)}
                        placeholder="NRP"
                        className="rounded bg-[#1E1812] border border-[#3D3225] focus:border-[#D4A017] focus:outline-none px-2.5 py-1.5 text-xs text-[#F5F0E6] font-mono-num"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={row.jabatan}
                      onChange={(e) => updatePersonnel(row.id, 'jabatan', e.target.value)}
                      placeholder="Jabatan"
                      className="sm:col-span-2 rounded bg-[#1E1812] border border-[#3D3225] focus:border-[#D4A017] focus:outline-none px-2.5 py-1.5 text-xs text-[#F5F0E6] uppercase"
                    />
                    <input
                      type="text"
                      value={row.ket}
                      onChange={(e) => updatePersonnel(row.id, 'ket', e.target.value)}
                      placeholder="Ket (opsional)"
                      className="rounded bg-[#1E1812] border border-[#3D3225] focus:border-[#D4A017] focus:outline-none px-2.5 py-1.5 text-xs text-[#F5F0E6] uppercase"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SECTION 3: PENGESAHAN & STEMPEL */}
      {activeSection === 'pengesahan' && (
        <section className="rounded-xl bg-[#1E1812] border border-[#3A3024] p-5 space-y-4">
          <h2 className="font-display text-lg font-bold tracking-wide text-[#F7F2E8] uppercase">
            3. PENGESAHAN, PEJABAT & STEMPEL
          </h2>

          <div className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#B5A894] mb-1.5">
                  Dikeluarkan di
                </label>
                <input
                  type="text"
                  value={doc.dikeluarkanDi}
                  onChange={(e) => updateField('dikeluarkanDi', e.target.value)}
                  className="w-full rounded-lg bg-[#15110C] border border-[#3D3225] focus:border-[#D4A017] focus:outline-none px-3.5 py-2 text-sm text-[#F5F0E6]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#B5A894] mb-1.5">
                  Status Dokumen
                </label>
                <div className="relative">
                  <select
                    value={doc.status}
                    onChange={(e) =>
                      updateField('status', e.target.value as SprinDocument['status'])
                    }
                    className="w-full appearance-none rounded-lg bg-[#15110C] border border-[#3D3225] focus:border-[#D4A017] focus:outline-none pl-3.5 pr-9 py-2 text-sm text-[#F5F0E6] cursor-pointer"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Siap Cetak">Siap Cetak</option>
                    <option value="Terbit">Terbit</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#B5A894] pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            <div className={`grid grid-cols-1 ${doc.useLampiran ? 'sm:grid-cols-2' : ''} gap-3`}>
              <div>
                <label className="block text-xs font-medium text-[#B5A894] mb-1.5">
                  {doc.useLampiran ? 'Tanggal Pengesahan Hal. 1' : 'Tanggal Pengesahan'}
                </label>
                <input
                  type="text"
                  value={doc.tanggalSuratHal1}
                  onChange={(e) => updateField('tanggalSuratHal1', e.target.value)}
                  className="w-full rounded-lg bg-[#15110C] border border-[#3D3225] focus:border-[#D4A017] focus:outline-none px-3.5 py-2 text-sm text-[#F5F0E6]"
                />
              </div>
              {doc.useLampiran && (
                <div>
                  <label className="block text-xs font-medium text-[#B5A894] mb-1.5">
                    Tanggal Pengesahan Hal. 2
                  </label>
                  <input
                    type="text"
                    value={doc.tanggalSuratHal2}
                    onChange={(e) => updateField('tanggalSuratHal2', e.target.value)}
                    className="w-full rounded-lg bg-[#15110C] border border-[#3D3225] focus:border-[#D4A017] focus:outline-none px-3.5 py-2 text-sm text-[#F5F0E6]"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-[#B5A894] mb-1.5">
                Jabatan Penanda Tangan
              </label>
              <input
                type="text"
                value={doc.pejabatJabatan}
                onChange={(e) => updateField('pejabatJabatan', e.target.value)}
                className="w-full rounded-lg bg-[#15110C] border border-[#3D3225] focus:border-[#D4A017] focus:outline-none px-3.5 py-2 text-sm text-[#F5F0E6] uppercase"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#B5A894] mb-1.5">
                  Nama Pejabat & Gelar
                </label>
                <input
                  type="text"
                  value={doc.pejabatNama}
                  onChange={(e) => updateField('pejabatNama', e.target.value)}
                  className="w-full rounded-lg bg-[#15110C] border border-[#3D3225] focus:border-[#D4A017] focus:outline-none px-3.5 py-2 text-sm text-[#F5F0E6] uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#B5A894] mb-1.5">
                  Pangkat & NRP Pejabat
                </label>
                <input
                  type="text"
                  value={doc.pejabatPangkatNrp}
                  onChange={(e) => updateField('pejabatPangkatNrp', e.target.value)}
                  className="w-full rounded-lg bg-[#15110C] border border-[#3D3225] focus:border-[#D4A017] focus:outline-none px-3.5 py-2 text-sm text-[#F5F0E6] uppercase font-mono-num"
                />
              </div>
            </div>

            {/* Stamp & Digital Signature Toggle */}
            <div className="rounded-xl bg-[#15110C] border border-[#3D3225] p-3.5 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <Stamp className="w-5 h-5 text-[#D4A017] mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-[#F5F0E6]">
                    Tampilkan Stempel & TTD Digital
                  </div>
                  <div className="text-[11px] text-[#9E907A] mt-0.5">
                    Matikan jika surat akan dicetak untuk tanda tangan dan stempel basah fisik.
                  </div>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={doc.showStampAndSignature}
                onClick={() => updateField('showStampAndSignature', !doc.showStampAndSignature)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  doc.showStampAndSignature ? 'bg-[#D4A017]' : 'bg-[#3A3024]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[#14100C] transition-transform ${
                    doc.showStampAndSignature ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {doc.showStampAndSignature && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#B5A894] mb-1">
                    Teks Lingkar Atas Stempel
                  </label>
                  <input
                    type="text"
                    value={doc.stampResorText}
                    onChange={(e) => updateField('stampResorText', e.target.value)}
                    className="w-full rounded-lg bg-[#15110C] border border-[#3D3225] focus:border-[#D4A017] focus:outline-none px-3 py-2 text-xs text-[#F5F0E6] uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#B5A894] mb-1">
                    Teks Lingkar Bawah Stempel
                  </label>
                  <input
                    type="text"
                    value={doc.stampSektorText}
                    onChange={(e) => updateField('stampSektorText', e.target.value)}
                    className="w-full rounded-lg bg-[#15110C] border border-[#3D3225] focus:border-[#D4A017] focus:outline-none px-3 py-2 text-xs text-[#F5F0E6] uppercase"
                  />
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* SECTION 4: IMPORT TANDA TANGAN & STEMPEL */}
      {activeSection === 'ttd' && (
        <section className="rounded-xl bg-[#1E1812] border border-[#3A3024] p-5 space-y-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-lg font-bold tracking-wide text-[#F7F2E8] uppercase">
              4. IMPORT TANDA TANGAN & STEMPEL
            </h2>
            <button
              type="button"
              onClick={() => updateField('showStampAndSignature', !doc.showStampAndSignature)}
              className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                doc.showStampAndSignature
                  ? 'bg-[#D4A017] text-[#14100C]'
                  : 'bg-[#2A2218] text-[#B5A894]'
              }`}
            >
              {doc.showStampAndSignature ? 'Aktif di Surat' : 'Nonaktif'}
            </button>
          </div>

          {/* Layering Order Control (Default: Above Text) */}
          <div className="rounded-xl bg-[#15110C] border border-[#3D3225] p-3.5 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#F5F0E6]">
              <Layers className="w-4 h-4 text-[#D4A017]" />
              <span>Posisi Lapisan Terhadap Teks Surat</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => updateStampConfig('aboveText', true)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  stampCfg.aboveText
                    ? 'bg-[#D4A017]/20 border-[#D4A017] text-[#F4C94D]'
                    : 'bg-[#1E1812] border-[#362C21] text-[#A89C89] hover:text-[#F5F0E6]'
                }`}
              >
                Di Atas Teks (Default)
              </button>
              <button
                type="button"
                onClick={() => updateStampConfig('aboveText', false)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  !stampCfg.aboveText
                    ? 'bg-[#D4A017]/20 border-[#D4A017] text-[#F4C94D]'
                    : 'bg-[#1E1812] border-[#362C21] text-[#A89C89] hover:text-[#F5F0E6]'
                }`}
              >
                Di Bawah Teks
              </button>
            </div>
          </div>

          {/* IMPORT & ATUR STEMPEL (Default 4.7 cm) */}
          <div className="rounded-xl bg-[#15110C] border border-[#3D3225] p-4 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Stamp className="w-4 h-4 text-[#D4A017]" />
                <span className="text-sm font-bold text-[#F5F0E6]">Stempel Kesatuan</span>
              </div>
              <span className="font-mono-num text-xs font-semibold text-[#F4C94D]">
                {stampCfg.stampSizeCm.toFixed(1).replace('.', ',')} cm
              </span>
            </div>

            {/* File Import Row */}
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-lg bg-white border border-[#4A3D2C] flex items-center justify-center p-1 shrink-0 overflow-hidden">
                {stampCfg.stampImageDataUrl ? (
                  <img
                    src={stampCfg.stampImageDataUrl}
                    alt="Preview Stempel"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <DefaultStampGraphic
                    resorText={doc.stampResorText}
                    sektorText={doc.stampSektorText}
                    className="w-full h-full"
                  />
                )}
              </div>

              <div className="flex-1 space-y-2">
                <input
                  ref={stampInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={(e) => {
                    handleImageImport(e.target.files?.[0], 'stampImageDataUrl');
                    e.target.value = '';
                  }}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => stampInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D4A017] hover:bg-[#E5B022] text-xs font-bold text-[#14100C] transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Import Gambar Stempel</span>
                  </button>
                  {stampCfg.stampImageDataUrl && (
                    <button
                      type="button"
                      onClick={() => updateStampConfig('stampImageDataUrl', null)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#2A2218] hover:bg-red-950/60 text-xs font-medium text-[#E5B8B8] cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Pakai Default</span>
                    </button>
                  )}
                </div>
                <label className="inline-flex items-center gap-2 text-[11px] text-[#B5A894] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={stampCfg.stampMultiplyBlend}
                    onChange={(e) => updateStampConfig('stampMultiplyBlend', e.target.checked)}
                    className="accent-[#D4A017] rounded cursor-pointer"
                  />
                  <span>Tembus pandang latar putih (Multiply)</span>
                </label>
              </div>
            </div>

            {/* Stamp Size Control (Default 4.7 cm) */}
            <div className="space-y-1.5 pt-2 border-t border-[#2A2218]">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-medium text-[#B5A894]">
                  Ukuran Stempel (cm)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateStampConfig('stampSizeCm', 4.7)}
                    className="text-[11px] font-semibold text-[#D4A017] hover:underline cursor-pointer"
                  >
                    Standar 4,7 cm
                  </button>
                  <input
                    type="number"
                    step="0.1"
                    min="2.0"
                    max="8.0"
                    value={stampCfg.stampSizeCm}
                    onChange={(e) =>
                      updateStampConfig(
                        'stampSizeCm',
                        Math.max(1.5, Math.min(8.5, Number(e.target.value) || 4.7))
                      )
                    }
                    className="w-16 rounded bg-[#1E1812] border border-[#3D3225] px-2 py-1 text-xs text-right font-mono-num text-[#F5F0E6]"
                  />
                </div>
              </div>
              <input
                type="range"
                min="2.0"
                max="8.0"
                step="0.1"
                value={stampCfg.stampSizeCm}
                onChange={(e) => updateStampConfig('stampSizeCm', parseFloat(e.target.value))}
                className="w-full accent-[#D4A017] cursor-pointer"
              />
            </div>

            {/* Stamp Position X & Y */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between text-[11px] text-[#B5A894] mb-1">
                  <span>Posisi X (Kiri/Kanan)</span>
                  <span className="font-mono-num text-[#F5F0E6]">{stampCfg.stampOffsetXMm} mm</span>
                </div>
                <input
                  type="range"
                  min="-35"
                  max="65"
                  step="1"
                  value={stampCfg.stampOffsetXMm}
                  onChange={(e) =>
                    updateStampConfig('stampOffsetXMm', parseInt(e.target.value, 10))
                  }
                  className="w-full accent-[#D4A017] cursor-pointer"
                />
              </div>
              <div>
                <div className="flex items-center justify-between text-[11px] text-[#B5A894] mb-1">
                  <span>Posisi Y (Atas/Bawah)</span>
                  <span className="font-mono-num text-[#F5F0E6]">{stampCfg.stampOffsetYMm} mm</span>
                </div>
                <input
                  type="range"
                  min="-25"
                  max="50"
                  step="1"
                  value={stampCfg.stampOffsetYMm}
                  onChange={(e) =>
                    updateStampConfig('stampOffsetYMm', parseInt(e.target.value, 10))
                  }
                  className="w-full accent-[#D4A017] cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* IMPORT & ATUR TANDA TANGAN */}
          <div className="rounded-xl bg-[#15110C] border border-[#3D3225] p-4 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <PenTool className="w-4 h-4 text-[#D4A017]" />
                <span className="text-sm font-bold text-[#F5F0E6]">Tanda Tangan Pejabat</span>
              </div>
              <span className="font-mono-num text-xs font-semibold text-[#F4C94D]">
                {stampCfg.signatureWidthCm.toFixed(1).replace('.', ',')} cm
              </span>
            </div>

            {/* File Import Row */}
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-lg bg-white border border-[#4A3D2C] flex items-center justify-center p-1 shrink-0 overflow-hidden">
                {stampCfg.signatureImageDataUrl ? (
                  <img
                    src={stampCfg.signatureImageDataUrl}
                    alt="Preview Tanda Tangan"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <DefaultSignatureGraphic className="w-full h-auto" />
                )}
              </div>

              <div className="flex-1 space-y-2">
                <input
                  ref={sigInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={(e) => {
                    handleImageImport(e.target.files?.[0], 'signatureImageDataUrl');
                    e.target.value = '';
                  }}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => sigInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D4A017] hover:bg-[#E5B022] text-xs font-bold text-[#14100C] transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Import Tanda Tangan</span>
                  </button>
                  {stampCfg.signatureImageDataUrl && (
                    <button
                      type="button"
                      onClick={() => updateStampConfig('signatureImageDataUrl', null)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#2A2218] hover:bg-red-950/60 text-xs font-medium text-[#E5B8B8] cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Pakai Default</span>
                    </button>
                  )}
                </div>
                <label className="inline-flex items-center gap-2 text-[11px] text-[#B5A894] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={stampCfg.signatureMultiplyBlend}
                    onChange={(e) =>
                      updateStampConfig('signatureMultiplyBlend', e.target.checked)
                    }
                    className="accent-[#D4A017] rounded cursor-pointer"
                  />
                  <span>Tembus pandang latar putih (Multiply)</span>
                </label>
              </div>
            </div>

            {/* Signature Size Control */}
            <div className="space-y-1.5 pt-2 border-t border-[#2A2218]">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-medium text-[#B5A894]">
                  Ukuran Lebar Tanda Tangan (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1.5"
                  max="10.0"
                  value={stampCfg.signatureWidthCm}
                  onChange={(e) =>
                    updateStampConfig(
                      'signatureWidthCm',
                      Math.max(1.5, Math.min(10.0, Number(e.target.value) || 5.2))
                    )
                  }
                  className="w-16 rounded bg-[#1E1812] border border-[#3D3225] px-2 py-1 text-xs text-right font-mono-num text-[#F5F0E6]"
                />
              </div>
              <input
                type="range"
                min="1.5"
                max="10.0"
                step="0.1"
                value={stampCfg.signatureWidthCm}
                onChange={(e) =>
                  updateStampConfig('signatureWidthCm', parseFloat(e.target.value))
                }
                className="w-full accent-[#D4A017] cursor-pointer"
              />
            </div>

            {/* Signature Position X & Y */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between text-[11px] text-[#B5A894] mb-1">
                  <span>Posisi X (Kiri/Kanan)</span>
                  <span className="font-mono-num text-[#F5F0E6]">
                    {stampCfg.signatureOffsetXMm} mm
                  </span>
                </div>
                <input
                  type="range"
                  min="-35"
                  max="70"
                  step="1"
                  value={stampCfg.signatureOffsetXMm}
                  onChange={(e) =>
                    updateStampConfig('signatureOffsetXMm', parseInt(e.target.value, 10))
                  }
                  className="w-full accent-[#D4A017] cursor-pointer"
                />
              </div>
              <div>
                <div className="flex items-center justify-between text-[11px] text-[#B5A894] mb-1">
                  <span>Posisi Y (Atas/Bawah)</span>
                  <span className="font-mono-num text-[#F5F0E6]">
                    {stampCfg.signatureOffsetYMm} mm
                  </span>
                </div>
                <input
                  type="range"
                  min="-25"
                  max="55"
                  step="1"
                  value={stampCfg.signatureOffsetYMm}
                  onChange={(e) =>
                    updateStampConfig('signatureOffsetYMm', parseInt(e.target.value, 10))
                  }
                  className="w-full accent-[#D4A017] cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Reset Posisi & Ukuran Default */}
          <button
            type="button"
            onClick={() =>
              updateField('stampConfig', {
                ...stampCfg,
                stampSizeCm: DEFAULT_STAMP_CONFIG.stampSizeCm,
                stampOffsetXMm: DEFAULT_STAMP_CONFIG.stampOffsetXMm,
                stampOffsetYMm: DEFAULT_STAMP_CONFIG.stampOffsetYMm,
                signatureWidthCm: DEFAULT_STAMP_CONFIG.signatureWidthCm,
                signatureOffsetXMm: DEFAULT_STAMP_CONFIG.signatureOffsetXMm,
                signatureOffsetYMm: DEFAULT_STAMP_CONFIG.signatureOffsetYMm,
                aboveText: true,
              })
            }
            className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg border border-[#4A3D2C] bg-[#15110C] hover:border-[#D4A017] text-xs font-semibold text-[#F5F0E6] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#D4A017]" />
            <span>Reset Posisi & Ukuran Default (Stempel 4,7 cm · Di Atas Teks)</span>
          </button>
        </section>
      )}

      {/* Roster Picker Modal */}
      {showRosterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-xl rounded-xl bg-[#1E1812] border border-[#4A3D2C] overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-[#3A3024] flex items-center justify-between">
              <div>
                <h3 className="font-display text-base font-bold text-[#F7F2E8] uppercase">
                  Pilih Personel dari Database
                </h3>
                <p className="text-xs text-[#9E907A]">
                  {doc.useLampiran
                    ? 'Klik personel untuk menambahkan ke lampiran halaman 2'
                    : 'Klik personel untuk menambahkan ke daftar Kepada'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRosterModal(false)}
                className="px-3 py-1.5 rounded-lg bg-[#2A2218] text-xs font-semibold text-[#F5F0E6] hover:bg-[#3A3024] cursor-pointer"
              >
                Tutup
              </button>
            </div>
            <div className="max-h-[380px] overflow-y-auto divide-y divide-[#2E251B]">
              {roster.map((person) => {
                const alreadyAdded = doc.personelList.some(
                  (p) => p.nrp === person.nrp && person.nrp !== ''
                );
                return (
                  <div
                    key={person.id}
                    className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-[#251E16]"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[#F5F0E6] uppercase truncate">
                        {person.pangkat} {person.nama}
                      </div>
                      <div className="text-[11px] text-[#9E907A] font-mono-num truncate">
                        NRP {person.nrp} · {person.jabatan}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={alreadyAdded}
                      onClick={() => addFromRoster(person)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                        alreadyAdded
                          ? 'bg-[#2A2218] text-[#8C7E69] cursor-not-allowed'
                          : 'bg-[#D4A017] text-[#14100C] hover:bg-[#E5B022]'
                      }`}
                    >
                      {alreadyAdded ? 'Terdaftar' : 'Tambahkan'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
