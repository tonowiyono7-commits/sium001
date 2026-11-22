import { ChangeEvent, FormEvent, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Archive,
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Copy,
  Download,
  FileJson,
  FileSpreadsheet,
  ListPlus,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Upload,
  UserPlus,
} from 'lucide-react';
import {
  CycleType,
  HighlightColor,
  PawasAnchor,
  Personnel,
  RosterBackupPayload,
  RosterOrgHeader,
  ShiftOverrides,
  UnitKey,
} from '../types/polriRoster';
import {
  getOrderedUnitMeta,
  shiftPersonPhase,
} from '../utils/continuousRoster';
import {
  buildPersonnelExcelBytes,
  inferCycleForUnit,
  parseBackupJsonInput,
  ParsedBackupPreview,
  parseBulkManualLines,
  parsePersonnelExcelBuffer,
} from '../utils/personnelExcelBackup';

interface PersonnelManagerViewProps {
  header: RosterOrgHeader;
  personnel: Personnel[];
  unitOrder: UnitKey[];
  pawasAnchor: PawasAnchor;
  overrides: ShiftOverrides;
  lastBackupAt?: string;
  onUpdatePawasAnchor: (patch: Partial<PawasAnchor>) => void;
  onAddPersonnel: (person: Omit<Personnel, 'id'>) => void;
  onBulkAddPersonnel: (items: Omit<Personnel, 'id'>[]) => void;
  onReplacePersonnel: (items: Omit<Personnel, 'id'>[]) => void;
  onUpdatePersonnel: (id: string, patch: Partial<Personnel>) => void;
  onDeletePersonnel: (id: string) => void;
  onMovePersonnel: (id: string, direction: 'up' | 'down') => void;
  onMoveUnit: (unitKey: UnitKey, direction: 'up' | 'down') => void;
  onResetUnitOrder: () => void;
  onMarkBackupDone: (timestamp: string) => void;
  onRestoreBackup: (data: RosterBackupPayload['data']) => void;
  onResetBaseline: () => void;
}

type PersonnelToolTab = 'manual' | 'excel' | 'backup';
type ManualEntryMode = 'single' | 'bulk';

const CYCLE_LABELS: Record<CycleType, string> = {
  NONE: 'Jam Dinas / Non-Shift',
  INTERVAL_X: 'Piket 24J Bergiliran (X)',
  CYCLE_SML: 'Shift 3 Regu (S -> M -> L)',
  CYCLE_INTEL: 'Shift 4 Hari Intel (C1-C2-P-L)',
  CYCLE_RESKRIM: 'Shift 3 Tim Reskrim (C-P-L)',
};

function formatReadableBackupTime(iso?: string): string {
  if (!iso) return 'Belum pernah dicadangkan';
  try {
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function PersonnelManagerView({
  header,
  personnel,
  unitOrder,
  pawasAnchor,
  overrides,
  lastBackupAt,
  onUpdatePawasAnchor,
  onAddPersonnel,
  onBulkAddPersonnel,
  onReplacePersonnel,
  onUpdatePersonnel,
  onDeletePersonnel,
  onMovePersonnel,
  onMoveUnit,
  onResetUnitOrder,
  onMarkBackupDone,
  onRestoreBackup,
  onResetBaseline,
}: PersonnelManagerViewProps) {
  const [unitFilter, setUnitFilter] = useState<'ALL' | UnitKey>('ALL');
  const [search, setSearch] = useState('');
  const [showUnitOrderPanel, setShowUnitOrderPanel] = useState(false);

  // Menu Alat Data Personel: Input Manual / Format Excel / Backup
  const [activeToolTab, setActiveToolTab] =
    useState<PersonnelToolTab>('manual');
  const [manualMode, setManualMode] = useState<ManualEntryMode>('single');

  // Single Manual Form State
  const [newName, setNewName] = useState('');
  const [newPangkat, setNewPangkat] = useState('AIPDA');
  const [newNrp, setNewNrp] = useState('');
  const [newJabatan, setNewJabatan] = useState('');
  const [newUnit, setNewUnit] = useState<UnitKey>('SAMAPTA');
  const [newKet, setNewKet] = useState('');
  const [newCycleType, setNewCycleType] = useState<CycleType>('CYCLE_SML');
  const [newCycleLength, setNewCycleLength] = useState<number>(3);
  const [newHighlight, setNewHighlight] = useState<HighlightColor>('none');

  // Bulk Manual Input State
  const [bulkDefaultUnit, setBulkDefaultUnit] = useState<UnitKey>('SAMAPTA');
  const [bulkText, setBulkText] = useState('');

  // Excel Import/Export State
  const excelInputRef = useRef<HTMLInputElement>(null);
  const [excelPreview, setExcelPreview] = useState<{
    fileName: string;
    items: Omit<Personnel, 'id'>[];
    skippedRows: number;
  } | null>(null);
  const [excelError, setExcelError] = useState<string | null>(null);
  const [confirmReplaceExcel, setConfirmReplaceExcel] = useState(false);

  // Backup & Restore State
  const backupFileInputRef = useRef<HTMLInputElement>(null);
  const [copiedBackup, setCopiedBackup] = useState(false);
  const [backupPasteText, setBackupPasteText] = useState('');
  const [backupPreview, setBackupPreview] =
    useState<ParsedBackupPreview | null>(null);
  const [backupError, setBackupError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const orderedUnits = useMemo(
    () => getOrderedUnitMeta(unitOrder),
    [unitOrder]
  );

  const activePawasOptions = useMemo(
    () =>
      personnel.filter(
        (p) =>
          p.unit === 'PAWAS' &&
          p.cycleType === 'INTERVAL_X' &&
          !p.dutyPaused
      ),
    [personnel]
  );

  // Urutkan tampilan personel sesuai urutan unit yang aktif, menjaga urutan relatif per unit
  const orderedPersonnel = useMemo(() => {
    const unitRank = new Map(orderedUnits.map((u, idx) => [u.key, idx]));
    return [...personnel].sort((a, b) => {
      const ra = unitRank.get(a.unit) ?? 999;
      const rb = unitRank.get(b.unit) ?? 999;
      return ra - rb;
    });
  }, [personnel, orderedUnits]);

  // Peta posisi dalam masing-masing unit (untuk menonaktifkan tombol naik di baris pertama / turun di baris terakhir)
  const unitPositionMap = useMemo(() => {
    const grouped = new Map<UnitKey, string[]>();
    for (const p of personnel) {
      const list = grouped.get(p.unit) ?? [];
      list.push(p.id);
      grouped.set(p.unit, list);
    }
    const map = new Map<string, { index: number; total: number }>();
    for (const ids of grouped.values()) {
      ids.forEach((id, index) => {
        map.set(id, { index, total: ids.length });
      });
    }
    return map;
  }, [personnel]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orderedPersonnel.filter((p) => {
      if (unitFilter !== 'ALL' && p.unit !== unitFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.nrp.toLowerCase().includes(q) ||
        p.jabatan.toLowerCase().includes(q) ||
        p.pangkat.toLowerCase().includes(q) ||
        p.ket.toLowerCase().includes(q)
      );
    });
  }, [orderedPersonnel, unitFilter, search]);

  const bulkParsedItems = useMemo(
    () => parseBulkManualLines(bulkText, bulkDefaultUnit),
    [bulkText, bulkDefaultUnit]
  );

  const inferDefaultCycle = (
    unit: UnitKey
  ): { cycleType: CycleType; cycleLength: number } => inferCycleForUnit(unit);

  const handleSelectNewUnit = (unit: UnitKey) => {
    setNewUnit(unit);
    const inferred = inferDefaultCycle(unit);
    setNewCycleType(inferred.cycleType);
    setNewCycleLength(inferred.cycleLength);
  };

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const sameUnitCount = personnel.filter((p) => p.unit === newUnit).length;
    onAddPersonnel({
      unit: newUnit,
      unitNo: sameUnitCount + 1,
      name: newName.trim().toUpperCase(),
      pangkat: newPangkat.trim().toUpperCase() || 'BRIPKA',
      nrp: newNrp.trim(),
      jabatan: newJabatan.trim().toUpperCase() || 'BANIT',
      ket: newKet.trim().toUpperCase(),
      cycleType: newCycleType,
      cycleLength: newCycleType === 'INTERVAL_X' ? Math.max(2, newCycleLength) : newCycleLength,
      phaseOnOct31: 0,
      highlightColor: newHighlight,
      dutyPaused: false,
    });
    setNewName('');
    setNewNrp('');
    setNewJabatan('');
    setNewKet('');
    setNewHighlight('none');
  };

  const handleSubmitBulkManual = () => {
    if (bulkParsedItems.length === 0) return;
    onBulkAddPersonnel(bulkParsedItems);
    setBulkText('');
  };

  // Excel handlers
  const triggerDownloadBlob = (bytes: Uint8Array, filename: string) => {
    const blob = new Blob([bytes.buffer as ArrayBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPersonnelExcel = (templateOnly: boolean) => {
    setExcelError(null);
    const bytes = buildPersonnelExcelBytes(
      header,
      personnel,
      unitOrder,
      templateOnly
    );
    const today = new Date().toISOString().slice(0, 10);
    const filename = templateOnly
      ? 'template-format-data-personel.xlsx'
      : `data-personel-${today}.xlsx`;
    triggerDownloadBlob(bytes, filename);
  };

  const handleExcelFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExcelError(null);
    setConfirmReplaceExcel(false);
    try {
      const buffer = await file.arrayBuffer();
      const parsed = parsePersonnelExcelBuffer(buffer);
      setExcelPreview({
        fileName: file.name,
        items: parsed.items,
        skippedRows: parsed.skippedRows,
      });
    } catch (err) {
      setExcelPreview(null);
      setExcelError(
        err instanceof Error ? err.message : 'File Excel gagal dibaca.'
      );
    }
    e.target.value = '';
  };

  const handleApplyExcelAppend = () => {
    if (!excelPreview) return;
    onBulkAddPersonnel(excelPreview.items);
    setExcelPreview(null);
    setConfirmReplaceExcel(false);
  };

  const handleApplyExcelReplace = () => {
    if (!excelPreview) return;
    onReplacePersonnel(excelPreview.items);
    setExcelPreview(null);
    setConfirmReplaceExcel(false);
  };

  // Backup & Restore handlers
  const buildBackupPayload = (): RosterBackupPayload => ({
    app: 'kuat-pers-jadwal-piket',
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      header,
      personnel,
      unitOrder,
      pawasAnchor,
      overrides,
    },
  });

  const handleDownloadBackupJson = () => {
    const payload = buildBackupPayload();
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-data-personel-${payload.exportedAt.slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onMarkBackupDone(payload.exportedAt);
  };

  const handleCopyBackupJson = async () => {
    setBackupError(null);
    try {
      const payload = buildBackupPayload();
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setCopiedBackup(true);
      onMarkBackupDone(payload.exportedAt);
      window.setTimeout(() => setCopiedBackup(false), 2400);
    } catch {
      setBackupError('Gagal menyalin JSON backup ke clipboard.');
    }
  };

  const handleBackupFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBackupError(null);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || '');
        const parsed = parseBackupJsonInput(text);
        setBackupPreview(parsed);
        setBackupPasteText(text);
      } catch (err) {
        setBackupPreview(null);
        setBackupError(
          err instanceof Error ? err.message : 'File backup gagal dibaca.'
        );
      }
    };
    reader.onerror = () => {
      setBackupError('Gagal membaca file dari perangkat.');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleValidateBackupPaste = () => {
    setBackupError(null);
    try {
      const parsed = parseBackupJsonInput(backupPasteText);
      setBackupPreview(parsed);
    } catch (err) {
      setBackupPreview(null);
      setBackupError(
        err instanceof Error ? err.message : 'Teks JSON backup tidak valid.'
      );
    }
  };

  const handleConfirmRestoreBackup = () => {
    if (!backupPreview) return;
    onRestoreBackup(backupPreview.data);
    setBackupPreview(null);
    setBackupPasteText('');
    setBackupError(null);
  };

  return (
    <div className="space-y-6">
      {/* PAWAS Rotation Anchor Control */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Titik Mulai Rotasi PAWAS Berkelanjutan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Personel PAWAS yang berstatus &ldquo;Sementara Tidak Piket&rdquo;
            otomatis dilewati, dan rotasi berlanjut sesuai urutan daftar PAWAS
            dari tanggal &amp; petugas di bawah ini.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-slate-500">
              Mulai Tanggal
            </label>
            <input
              type="date"
              value={pawasAnchor.dateKey}
              onChange={(e) =>
                onUpdatePawasAnchor({ dateKey: e.target.value })
              }
              className="px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-lg bg-white"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-slate-500">
              Petugas PAWAS Hari Pertama
            </label>
            <select
              value={pawasAnchor.personnelId}
              onChange={(e) =>
                onUpdatePawasAnchor({ personnelId: e.target.value })
              }
              aria-label="Petugas PAWAS awal"
              className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white min-w-[220px]"
            >
              {activePawasOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.pangkat} {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Menu Alat Data Personel: Input Data Manual, Format Excel, Backup */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Kelola Input Manual, Format Excel &amp; Backup Data Personel
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih menu di samping untuk menambah personel manual, ekspor/impor
              format Excel (.xlsx), atau mencadangkan &amp; memulihkan data.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Menu alat data personel"
            className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-xl self-start"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeToolTab === 'manual'}
              onClick={() => setActiveToolTab('manual')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeToolTab === 'manual'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Input Data Manual</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeToolTab === 'excel'}
              onClick={() => setActiveToolTab('excel')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeToolTab === 'excel'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Format Excel (.xlsx)</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeToolTab === 'backup'}
              onClick={() => setActiveToolTab('backup')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeToolTab === 'backup'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Backup &amp; Restore</span>
            </button>
          </div>
        </div>

        {/* TAB 1: INPUT DATA MANUAL */}
        {activeToolTab === 'manual' && (
          <div className="p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-lg">
                <button
                  type="button"
                  onClick={() => setManualMode('single')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    manualMode === 'single'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Input Satuan Lengkap</span>
                </button>
                <button
                  type="button"
                  onClick={() => setManualMode('bulk')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    manualMode === 'bulk'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ListPlus className="w-3.5 h-3.5" />
                  <span>Input Massal (Banyak Baris)</span>
                </button>
              </div>
              <span className="text-xs text-slate-500">
                Personel baru langsung masuk ke unit terkait dan bisa diatur
                posisinya di tabel bawah.
              </span>
            </div>

            {manualMode === 'single' ? (
              <form onSubmit={handleAdd} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-medium text-slate-600">
                      Unit / Satuan
                    </label>
                    <select
                      value={newUnit}
                      onChange={(e) =>
                        handleSelectNewUnit(e.target.value as UnitKey)
                      }
                      aria-label="Unit personel"
                      className="w-full px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    >
                      {orderedUnits.map((u) => (
                        <option key={u.key} value={u.key}>
                          {u.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1 lg:col-span-2">
                    <label className="block text-[11px] font-medium text-slate-600">
                      Nama Lengkap *
                    </label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Contoh: BUDI SANTOSO, S.H."
                      required
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-medium text-slate-600">
                      Pangkat
                    </label>
                    <input
                      type="text"
                      value={newPangkat}
                      onChange={(e) => setNewPangkat(e.target.value)}
                      placeholder="AIPDA"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-medium text-slate-600">
                      NRP / NIP
                    </label>
                    <input
                      type="text"
                      value={newNrp}
                      onChange={(e) => setNewNrp(e.target.value)}
                      placeholder="82040512"
                      className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-medium text-slate-600">
                      Jabatan
                    </label>
                    <input
                      type="text"
                      value={newJabatan}
                      onChange={(e) => setNewJabatan(e.target.value)}
                      placeholder="BANIT SAMAPTA"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
                  <div className="space-y-1 lg:col-span-2">
                    <label className="block text-[11px] font-medium text-slate-600">
                      Keterangan (Opsional)
                    </label>
                    <input
                      type="text"
                      value={newKet}
                      onChange={(e) => setNewKet(e.target.value)}
                      placeholder="Contoh: REGU I / PAM OBVIT / BKO"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    />
                  </div>

                  <div className="space-y-1 lg:col-span-2">
                    <label className="block text-[11px] font-medium text-slate-600">
                      Pola Rotasi Piket
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={newCycleType}
                        onChange={(e) => {
                          const ct = e.target.value as CycleType;
                          setNewCycleType(ct);
                          setNewCycleLength(
                            ct === 'CYCLE_INTEL'
                              ? 4
                              : ct === 'CYCLE_SML' || ct === 'CYCLE_RESKRIM'
                              ? 3
                              : ct === 'INTERVAL_X'
                              ? newUnit === 'BHABIN'
                                ? 10
                                : 6
                              : 0
                          );
                        }}
                        aria-label="Pola rotasi personel baru"
                        className="flex-1 min-w-0 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
                      >
                        {(Object.keys(CYCLE_LABELS) as CycleType[]).map(
                          (ct) => (
                            <option key={ct} value={ct}>
                              {CYCLE_LABELS[ct]}
                            </option>
                          )
                        )}
                      </select>

                      {newCycleType === 'INTERVAL_X' && (
                        <input
                          type="number"
                          min={2}
                          value={newCycleLength}
                          onChange={(e) =>
                            setNewCycleLength(
                              Math.max(2, Number(e.target.value) || 2)
                            )
                          }
                          aria-label="Interval hari"
                          title="Interval hari piket 24 jam"
                          className="w-16 px-2 py-2 text-xs font-mono text-center bg-white border border-slate-200 rounded-lg"
                        />
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-medium text-slate-600">
                      Stabilo
                    </label>
                    <select
                      value={newHighlight}
                      onChange={(e) =>
                        setNewHighlight(e.target.value as HighlightColor)
                      }
                      aria-label="Stabilo personel baru"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
                    >
                      <option value="none">Normal</option>
                      <option value="red">Stabilo Merah</option>
                      <option value="yellow">Stabilo Kuning</option>
                    </select>
                  </div>

                  <div>
                    <button
                      type="submit"
                      className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Personel</span>
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 items-end">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-medium text-slate-600">
                      Unit Default (bila kolom Unit kosong)
                    </label>
                    <select
                      value={bulkDefaultUnit}
                      onChange={(e) =>
                        setBulkDefaultUnit(e.target.value as UnitKey)
                      }
                      className="w-full px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg"
                    >
                      {orderedUnits.map((u) => (
                        <option key={u.key} value={u.key}>
                          {u.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="lg:col-span-3 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                    Format per baris (pisahkan dengan <code className="font-mono font-bold">|</code>, <code className="font-mono font-bold">;</code>, atau Tab dari Excel):{' '}
                    <span className="font-mono text-slate-800">
                      NAMA | PANGKAT | NRP | JABATAN | UNIT | KET
                    </span>{' '}
                    (atau cukup ketik <span className="font-mono">PANGKAT NAMA</span>).
                  </div>
                </div>

                <textarea
                  rows={5}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={`Contoh:\nBUDI SANTOSO | AIPDA | 82040512 | PS. PANIT SAMAPTA | SAMAPTA | REGU I\nAGUS PRASETYO | BRIPKA | 86010234 | BANIT LANTAS | LANTAS |`}
                  className="w-full px-3 py-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />

                {bulkParsedItems.length > 0 && (
                  <div className="border border-blue-200 bg-blue-50/50 rounded-lg p-3 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-blue-950">
                        Pratinjau Input Massal: {bulkParsedItems.length}{' '}
                        personel siap ditambahkan
                      </span>
                      <button
                        type="button"
                        onClick={handleSubmitBulkManual}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>
                          Tambahkan Semua ({bulkParsedItems.length})
                        </span>
                      </button>
                    </div>
                    <div className="max-h-36 overflow-y-auto bg-white border border-blue-100 rounded text-[11px]">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                            <th className="py-1.5 px-2">Unit</th>
                            <th className="py-1.5 px-2">Nama</th>
                            <th className="py-1.5 px-2">Pangkat</th>
                            <th className="py-1.5 px-2">NRP</th>
                            <th className="py-1.5 px-2">Jabatan</th>
                            <th className="py-1.5 px-2">Ket</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {bulkParsedItems.map((item, idx) => (
                            <tr key={idx}>
                              <td className="py-1 px-2 font-mono font-semibold">
                                {item.unit}
                              </td>
                              <td className="py-1 px-2 font-medium">
                                {item.name}
                              </td>
                              <td className="py-1 px-2">{item.pangkat}</td>
                              <td className="py-1 px-2 font-mono">
                                {item.nrp || '—'}
                              </td>
                              <td className="py-1 px-2">{item.jabatan}</td>
                              <td className="py-1 px-2">{item.ket || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: FORMAT EXCEL (.xlsx) */}
        {activeToolTab === 'excel' && (
          <div className="p-5 space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Ekspor & Template Kosong */}
              <div className="border border-slate-200 rounded-xl p-4 bg-emerald-50/40 space-y-3">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-600 text-white shrink-0">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Unduh Format &amp; Data Excel (.xlsx)
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      File Excel sudah dilengkapi format kolom resmi, NRP teks
                      (angka nol depan aman), dan lembar{' '}
                      <strong>PANDUAN UNIT &amp; POLA</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleDownloadPersonnelExcel(false)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>
                      Unduh Data Personel ({personnel.length} org) (.xlsx)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadPersonnelExcel(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-900 bg-white hover:bg-emerald-50 border border-emerald-300 rounded-lg transition-colors"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Unduh Format / Template Kosong (.xlsx)</span>
                  </button>
                </div>
              </div>

              {/* Impor Excel */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-3">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-lg bg-slate-800 text-white shrink-0">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Impor Data Personel dari File Excel
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Unggah file <span className="font-mono">.xlsx</span>,{' '}
                      <span className="font-mono">.xls</span>, atau{' '}
                      <span className="font-mono">.csv</span> yang telah diisi
                      sesuai format untuk ditambahkan atau mengganti daftar.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <input
                    ref={excelInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleExcelFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => excelInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-blue-600" />
                    <span>Pilih File Excel (.xlsx / .xls / .csv)</span>
                  </button>
                </div>
              </div>
            </div>

            {excelError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{excelError}</span>
              </div>
            )}

            {excelPreview && (
              <div className="border border-emerald-200 bg-emerald-50/40 rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">
                      Pratinjau Impor Excel: {excelPreview.fileName}
                    </h4>
                    <p className="text-xs text-slate-600">
                      Ditemukan{' '}
                      <strong className="font-mono">
                        {excelPreview.items.length}
                      </strong>{' '}
                      baris personel valid
                      {excelPreview.skippedRows > 0
                        ? ` (${excelPreview.skippedRows} baris tanpa nama dilewati)`
                        : ''}
                      .
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setExcelPreview(null);
                        setConfirmReplaceExcel(false);
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg"
                    >
                      Batal
                    </button>

                    <button
                      type="button"
                      onClick={handleApplyExcelAppend}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambahkan ke Daftar</span>
                    </button>

                    {!confirmReplaceExcel ? (
                      <button
                        type="button"
                        onClick={() => setConfirmReplaceExcel(true)}
                        className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 rounded-lg"
                      >
                        Ganti Semua Data
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleApplyExcelReplace}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg"
                      >
                        Ya, Ganti ({excelPreview.items.length} org)
                      </button>
                    )}
                  </div>
                </div>

                <div className="max-h-48 overflow-auto bg-white border border-slate-200 rounded-lg">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                        <th className="py-1.5 px-2.5">Unit</th>
                        <th className="py-1.5 px-2.5">No</th>
                        <th className="py-1.5 px-2.5">Nama</th>
                        <th className="py-1.5 px-2.5">Pangkat</th>
                        <th className="py-1.5 px-2.5">NRP</th>
                        <th className="py-1.5 px-2.5">Jabatan</th>
                        <th className="py-1.5 px-2.5">Pola</th>
                        <th className="py-1.5 px-2.5">Ket</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {excelPreview.items.slice(0, 50).map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-1 px-2.5 font-mono font-semibold">
                            {item.unit}
                          </td>
                          <td className="py-1 px-2.5 font-mono">
                            {item.unitNo}
                          </td>
                          <td className="py-1 px-2.5 font-medium">
                            {item.name}
                          </td>
                          <td className="py-1 px-2.5">{item.pangkat}</td>
                          <td className="py-1 px-2.5 font-mono">
                            {item.nrp || '—'}
                          </td>
                          <td className="py-1 px-2.5">{item.jabatan}</td>
                          <td className="py-1 px-2.5 font-mono">
                            {item.cycleType}
                          </td>
                          <td className="py-1 px-2.5">{item.ket || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {excelPreview.items.length > 50 && (
                    <div className="px-3 py-1.5 text-[11px] text-slate-500 bg-slate-50 border-t border-slate-200">
                      Menampilkan 50 dari {excelPreview.items.length} personel.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: BACKUP & RESTORE */}
        {activeToolTab === 'backup' && (
          <div className="p-5 space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Export Backup */}
              <div className="border border-slate-200 rounded-xl p-4 bg-blue-50/40 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 rounded-lg bg-blue-600 text-white shrink-0">
                      <Archive className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        Cadangkan Data Personel &amp; Jadwal (.json)
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Backup terakhir:{' '}
                        <strong>
                          {formatReadableBackupTime(lastBackupAt)}
                        </strong>
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-[11px] text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded">
                    {personnel.length} pers
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleDownloadBackupJson}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh File Backup (.json)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyBackupJson}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors"
                  >
                    {copiedBackup ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>JSON Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Teks Backup</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Restore Backup */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-3">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-lg bg-slate-800 text-white shrink-0">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Pulihkan Backup Data Personel (.json)
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Pilih file <span className="font-mono">.json</span> hasil
                      backup atau tempel teks JSON di bawah.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div>
                    <input
                      ref={backupFileInputRef}
                      type="file"
                      accept=".json,application/json"
                      onChange={handleBackupFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => backupFileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
                    >
                      <FileJson className="w-3.5 h-3.5 text-blue-600" />
                      <span>Pilih File Backup (.json)</span>
                    </button>
                  </div>

                  {!confirmReset ? (
                    <button
                      type="button"
                      onClick={() => setConfirmReset(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 rounded-lg"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Data Awal</span>
                    </button>
                  ) : (
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setConfirmReset(false)}
                        className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onResetBaseline();
                          setConfirmReset(false);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg"
                      >
                        Ya, Reset
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="personnel-backup-paste"
                className="block text-xs font-medium text-slate-600"
              >
                Atau Tempel Teks JSON Backup di Sini:
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <textarea
                  id="personnel-backup-paste"
                  rows={2}
                  value={backupPasteText}
                  onChange={(e) => {
                    setBackupPasteText(e.target.value);
                    setBackupPreview(null);
                    setBackupError(null);
                  }}
                  placeholder='{"app":"kuat-pers-jadwal-piket","version":1,...}'
                  className="flex-1 px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
                <button
                  type="button"
                  disabled={!backupPasteText.trim()}
                  onClick={handleValidateBackupPaste}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg disabled:opacity-40 disabled:pointer-events-none self-start sm:self-stretch whitespace-nowrap"
                >
                  Periksa JSON
                </button>
              </div>
            </div>

            {backupError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{backupError}</span>
              </div>
            )}

            {backupPreview && (
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-blue-950">
                    Backup Siap Dipulihkan
                  </h4>
                  <p className="text-xs text-blue-800 mt-0.5">
                    Diekspor:{' '}
                    {formatReadableBackupTime(backupPreview.exportedAt)} ·{' '}
                    <strong>{backupPreview.data.personnel.length}</strong>{' '}
                    personel ·{' '}
                    <strong>
                      {Object.keys(backupPreview.data.overrides).length}
                    </strong>{' '}
                    edit manual
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setBackupPreview(null)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmRestoreBackup}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                  >
                    Pulihkan Sekarang
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Collapsible Unit Order Panel */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowUnitOrderPanel((v) => !v)}
          className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
        >
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Urutan Satuan / Unit di Matriks &amp; Cetak
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Naikkan atau turunkan posisi unit (misalnya memindah PAWAS,
              SAMAPTA, BHABIN, dll) untuk mengubah urutan tampil tabel dan
              ekspor.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 shrink-0 ml-4">
            <span>{showUnitOrderPanel ? 'Tutup' : 'Atur Urutan Unit'}</span>
            {showUnitOrderPanel ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </span>
        </button>

        {showUnitOrderPanel && (
          <div className="border-t border-slate-200 px-5 py-4 space-y-3 bg-slate-50/50">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-slate-500">
                Gunakan tombol panah atas/bawah untuk menaikkan atau menurunkan
                unit.
              </span>
              <button
                type="button"
                onClick={onResetUnitOrder}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Urutan Default</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {orderedUnits.map((u, idx) => {
                const count = personnel.filter((p) => p.unit === u.key).length;
                return (
                  <div
                    key={u.key}
                    className="flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono tabular-nums text-[11px] text-slate-400 w-5">
                        {idx + 1}.
                      </span>
                      <span className="font-semibold text-slate-800 truncate">
                        {u.label}
                      </span>
                      <span className="font-mono tabular-nums text-[11px] text-slate-500">
                        ({count})
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => onMoveUnit(u.key, 'up')}
                        className="p-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none"
                        title={`Naikkan unit ${u.label}`}
                        aria-label={`Naikkan unit ${u.label}`}
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === orderedUnits.length - 1}
                        onClick={() => onMoveUnit(u.key, 'down')}
                        className="p-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none"
                        title={`Turunkan unit ${u.label}`}
                        aria-label={`Turunkan unit ${u.label}`}
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Personnel Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <h3 className="font-semibold text-slate-900">
              Daftar Kuat Personel &amp; Status Stabilo
            </h3>
            <span className="text-slate-400">·</span>
            <span className="font-mono tabular-nums text-xs text-slate-500">
              {filtered.length} dari {personnel.length} orang
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={unitFilter}
              onChange={(e) =>
                setUnitFilter(e.target.value as 'ALL' | UnitKey)
              }
              aria-label="Filter unit"
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
            >
              <option value="ALL">Semua Unit</option>
              {orderedUnits.map((u) => (
                <option key={u.key} value={u.key}>
                  {u.label}
                </option>
              ))}
            </select>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari personel..."
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg w-48 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                <th className="py-2.5 pl-4 pr-2 text-center whitespace-nowrap">
                  Urutan
                </th>
                <th className="py-2.5 px-2">Unit</th>
                <th className="py-2.5 px-2 text-center">No</th>
                <th className="py-2.5 px-2">Nama</th>
                <th className="py-2.5 px-2">Pangkat</th>
                <th className="py-2.5 px-2">NRP</th>
                <th className="py-2.5 px-2">Jabatan</th>
                <th className="py-2.5 px-2">Keterangan</th>
                <th className="py-2.5 px-2">Stabilo</th>
                <th className="py-2.5 px-2">Status Piket</th>
                <th className="py-2.5 px-2">Mulai Tgl</th>
                <th className="py-2.5 px-2">Pola &amp; Geser Siklus</th>
                <th className="py-2.5 pl-2 pr-4 text-right">Hapus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => {
                const posInfo = unitPositionMap.get(p.id) ?? {
                  index: 0,
                  total: 1,
                };
                const canMoveUp = posInfo.index > 0;
                const canMoveDown = posInfo.index < posInfo.total - 1;

                return (
                  <tr
                    key={p.id}
                    className={
                      p.highlightColor === 'red'
                        ? 'bg-red-50/80'
                        : p.highlightColor === 'yellow'
                        ? 'bg-yellow-50/80'
                        : 'hover:bg-slate-50/80'
                    }
                  >
                    <td className="py-2 pl-4 pr-2 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          disabled={!canMoveUp}
                          onClick={() => onMovePersonnel(p.id, 'up')}
                          title={`Naikkan posisi ${p.name}`}
                          aria-label={`Naikkan posisi ${p.name}`}
                          className="p-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={!canMoveDown}
                          onClick={() => onMovePersonnel(p.id, 'down')}
                          title={`Turunkan posisi ${p.name}`}
                          aria-label={`Turunkan posisi ${p.name}`}
                          className="p-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="py-2 px-2 whitespace-nowrap">
                      <select
                        value={p.unit}
                        onChange={(e) => {
                          const nextUnit = e.target.value as UnitKey;
                          const inferred = inferDefaultCycle(nextUnit);
                          onUpdatePersonnel(p.id, {
                            unit: nextUnit,
                            cycleType: inferred.cycleType,
                            cycleLength: inferred.cycleLength,
                          });
                        }}
                        aria-label={`Unit ${p.name}`}
                        className="px-2 py-1 text-xs font-medium border border-slate-200 rounded bg-white text-slate-800"
                      >
                        {orderedUnits.map((u) => (
                          <option key={u.key} value={u.key}>
                            {u.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 px-2 whitespace-nowrap">
                      <div className="inline-flex items-center border border-slate-200 rounded bg-white overflow-hidden">
                        <button
                          type="button"
                          disabled={p.unitNo <= 1}
                          onClick={() =>
                            onUpdatePersonnel(p.id, {
                              unitNo: Math.max(1, p.unitNo - 1),
                            })
                          }
                          aria-label={`Turunkan nomor urut ${p.name}`}
                          className="px-1.5 py-0.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none border-r border-slate-200"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={1}
                          value={p.unitNo}
                          onChange={(e) =>
                            onUpdatePersonnel(p.id, {
                              unitNo: Math.max(1, Number(e.target.value) || 1),
                            })
                          }
                          aria-label={`Nomor urut ${p.name}`}
                          className="w-9 text-center font-mono tabular-nums py-0.5 bg-white text-slate-700 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            onUpdatePersonnel(p.id, {
                              unitNo: p.unitNo + 1,
                            })
                          }
                          aria-label={`Naikkan nomor urut ${p.name}`}
                          className="px-1.5 py-0.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 border-l border-slate-200"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        value={p.name}
                        onChange={(e) =>
                          onUpdatePersonnel(p.id, { name: e.target.value })
                        }
                        aria-label={`Nama ${p.name}`}
                        className={`w-48 rounded px-1.5 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-600/20 ${
                          p.highlightColor === 'red'
                            ? 'bg-red-300 text-red-950 font-bold'
                            : p.highlightColor === 'yellow'
                            ? 'bg-yellow-300 text-yellow-950 font-bold'
                            : 'bg-transparent font-medium text-slate-900 focus:bg-white'
                        }`}
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        value={p.pangkat}
                        onChange={(e) =>
                          onUpdatePersonnel(p.id, { pangkat: e.target.value })
                        }
                        aria-label={`Pangkat ${p.name}`}
                        className="w-20 bg-transparent text-slate-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-600/20 rounded px-1.5 py-0.5"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        value={p.nrp}
                        onChange={(e) =>
                          onUpdatePersonnel(p.id, { nrp: e.target.value })
                        }
                        aria-label={`NRP ${p.name}`}
                        className="w-28 bg-transparent font-mono tabular-nums text-slate-600 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-600/20 rounded px-1.5 py-0.5"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        value={p.jabatan}
                        onChange={(e) =>
                          onUpdatePersonnel(p.id, { jabatan: e.target.value })
                        }
                        aria-label={`Jabatan ${p.name}`}
                        className="w-40 bg-transparent text-slate-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-600/20 rounded px-1.5 py-0.5"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        value={p.ket}
                        onChange={(e) =>
                          onUpdatePersonnel(p.id, { ket: e.target.value })
                        }
                        placeholder="—"
                        aria-label={`Keterangan ${p.name}`}
                        className="w-36 bg-transparent text-slate-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-600/20 rounded px-1.5 py-0.5"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <select
                        value={p.highlightColor ?? 'none'}
                        onChange={(e) =>
                          onUpdatePersonnel(p.id, {
                            highlightColor: e.target.value as HighlightColor,
                          })
                        }
                        aria-label={`Stabilo ${p.name}`}
                        className="px-2 py-1 text-xs border border-slate-200 rounded bg-white"
                      >
                        <option value="none">Normal</option>
                        <option value="red">Stabilo Merah</option>
                        <option value="yellow">Stabilo Kuning</option>
                      </select>
                    </td>
                    <td className="py-2 px-2">
                      <button
                        type="button"
                        onClick={() => {
                          const nextPaused = !p.dutyPaused;
                          onUpdatePersonnel(p.id, {
                            dutyPaused: nextPaused,
                            pausedFromDate: nextPaused
                              ? p.pausedFromDate || '2026-11-14'
                              : undefined,
                            highlightColor: nextPaused
                              ? 'red'
                              : p.highlightColor === 'red'
                              ? 'none'
                              : p.highlightColor,
                            ket: nextPaused
                              ? p.ket || 'SEMENTARA TIDAK PIKET'
                              : p.ket === 'SEMENTARA TIDAK PIKET'
                              ? ''
                              : p.ket,
                          });
                        }}
                        className={`px-2.5 py-1 text-xs font-medium rounded border whitespace-nowrap ${
                          p.dutyPaused
                            ? 'bg-red-600 text-white border-red-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {p.dutyPaused ? 'Tidak Piket' : 'Aktif Piket'}
                      </button>
                    </td>
                    <td className="py-2 px-2">
                      {p.dutyPaused ? (
                        <input
                          type="date"
                          value={p.pausedFromDate ?? '2026-11-14'}
                          onChange={(e) =>
                            onUpdatePersonnel(p.id, {
                              pausedFromDate: e.target.value,
                            })
                          }
                          aria-label={`Tanggal mulai tidak piket ${p.name}`}
                          className="px-1.5 py-0.5 text-xs font-mono border border-slate-200 rounded bg-white"
                        />
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="py-2 px-2 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <select
                          value={p.cycleType}
                          onChange={(e) => {
                            const nextCycle = e.target.value as CycleType;
                            const len =
                              nextCycle === 'CYCLE_INTEL'
                                ? 4
                                : nextCycle === 'CYCLE_SML' ||
                                  nextCycle === 'CYCLE_RESKRIM'
                                ? 3
                                : nextCycle === 'INTERVAL_X'
                                ? p.unit === 'BHABIN'
                                  ? 10
                                  : 6
                                : 0;
                            onUpdatePersonnel(p.id, {
                              cycleType: nextCycle,
                              cycleLength: len,
                            });
                          }}
                          aria-label={`Pola rotasi ${p.name}`}
                          className="px-2 py-1 text-xs border border-slate-200 rounded bg-white text-slate-700"
                        >
                          {(Object.keys(CYCLE_LABELS) as CycleType[]).map(
                            (ct) => (
                              <option key={ct} value={ct}>
                                {CYCLE_LABELS[ct]}
                              </option>
                            )
                          )}
                        </select>

                        {p.cycleType === 'INTERVAL_X' && (
                          <div
                            className="inline-flex items-center border border-slate-200 rounded bg-white overflow-hidden"
                            title="Interval hari giliran piket 24J"
                          >
                            <button
                              type="button"
                              disabled={p.cycleLength <= 2}
                              onClick={() =>
                                onUpdatePersonnel(p.id, {
                                  cycleLength: Math.max(2, p.cycleLength - 1),
                                })
                              }
                              className="px-1.5 py-0.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                              aria-label={`Turunkan interval hari ${p.name}`}
                            >
                              -
                            </button>
                            <span className="px-1.5 py-0.5 font-mono tabular-nums text-[11px] text-slate-700">
                              {p.cycleLength}h
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                onUpdatePersonnel(p.id, {
                                  cycleLength: p.cycleLength + 1,
                                })
                              }
                              className="px-1.5 py-0.5 text-slate-500 hover:bg-slate-100"
                              aria-label={`Naikkan interval hari ${p.name}`}
                            >
                              +
                            </button>
                          </div>
                        )}

                        {p.cycleType !== 'NONE' && (
                          <div
                            className="inline-flex items-center border border-slate-200 rounded bg-white overflow-hidden"
                            title="Geser jadwal siklus piket mundur (-1 hari) atau maju (+1 hari)"
                          >
                            <button
                              type="button"
                              onClick={() =>
                                onUpdatePersonnel(p.id, {
                                  phaseOnOct31: shiftPersonPhase(p, -1),
                                })
                              }
                              className="px-1 py-0.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 border-r border-slate-200"
                              aria-label={`Mundurkan jadwal 1 hari ${p.name}`}
                              title="Mundurkan jadwal 1 hari"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                onUpdatePersonnel(p.id, {
                                  phaseOnOct31: shiftPersonPhase(p, 1),
                                })
                              }
                              className="px-1 py-0.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                              aria-label={`Majukan jadwal 1 hari ${p.name}`}
                              title="Majukan jadwal 1 hari"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-2 pl-2 pr-4 text-right">
                      <button
                        type="button"
                        onClick={() => onDeletePersonnel(p.id)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        aria-label={`Hapus ${p.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
