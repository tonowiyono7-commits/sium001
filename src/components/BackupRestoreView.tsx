import { useRef, useState } from 'react';
import {
  AlertTriangle,
  Archive,
  Check,
  Copy,
  Download,
  FileJson,
  RotateCcw,
  Upload,
} from 'lucide-react';
import { DEFAULT_ORG_HEADER, DEFAULT_PAWAS_ANCHOR } from '../data/polriOktober2026';
import {
  PawasAnchor,
  Personnel,
  RosterBackupPayload,
  RosterOrgHeader,
  ShiftOverrides,
  UnitKey,
} from '../types/polriRoster';
import { DEFAULT_UNIT_ORDER } from '../utils/continuousRoster';

interface BackupRestoreViewProps {
  header: RosterOrgHeader;
  personnel: Personnel[];
  unitOrder: UnitKey[];
  pawasAnchor: PawasAnchor;
  overrides: ShiftOverrides;
  lastBackupAt?: string;
  onMarkBackupDone: (timestamp: string) => void;
  onRestoreBackup: (data: RosterBackupPayload['data']) => void;
  onResetBaseline: () => void;
}

interface ParsedPreview {
  exportedAt?: string;
  data: RosterBackupPayload['data'];
}

function parseBackupInput(rawText: string): ParsedPreview {
  const parsed = JSON.parse(rawText) as Record<string, unknown>;
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Format JSON tidak valid.');
  }

  const candidate =
    parsed.data && typeof parsed.data === 'object'
      ? (parsed.data as Record<string, unknown>)
      : parsed;

  if (!Array.isArray(candidate.personnel) || candidate.personnel.length === 0) {
    throw new Error('Data personel tidak ditemukan atau kosong di file backup.');
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
      ? { ...DEFAULT_ORG_HEADER, ...(candidate.header as Partial<RosterOrgHeader>) }
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

function formatReadableTime(iso?: string): string {
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

export function BackupRestoreView({
  header,
  personnel,
  unitOrder,
  pawasAnchor,
  overrides,
  lastBackupAt,
  onMarkBackupDone,
  onRestoreBackup,
  onResetBaseline,
}: BackupRestoreViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copiedBackup, setCopiedBackup] = useState(false);
  const [jsonPasteText, setJsonPasteText] = useState('');
  const [preview, setPreview] = useState<ParsedPreview | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const overrideCount = Object.keys(overrides).length;
  const pausedCount = personnel.filter((p) => p.dutyPaused).length;

  const buildPayload = (): RosterBackupPayload => ({
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

  const handleDownloadBackup = () => {
    const payload = buildPayload();
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStamp = payload.exportedAt.slice(0, 10);
    a.href = url;
    a.download = `backup-jadwal-piket-${dateStamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onMarkBackupDone(payload.exportedAt);
  };

  const handleCopyBackup = async () => {
    try {
      const payload = buildPayload();
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setCopiedBackup(true);
      onMarkBackupDone(payload.exportedAt);
      window.setTimeout(() => setCopiedBackup(false), 2400);
    } catch {
      setParseError('Gagal menyalin backup ke clipboard.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseError(null);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || '');
        const parsed = parseBackupInput(text);
        setPreview(parsed);
        setJsonPasteText(text);
      } catch (err) {
        setPreview(null);
        setParseError(
          err instanceof Error ? err.message : 'File backup gagal dibaca.'
        );
      }
    };
    reader.onerror = () => {
      setParseError('Gagal membaca file dari perangkat.');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleValidatePastedText = () => {
    setParseError(null);
    try {
      const parsed = parseBackupInput(jsonPasteText);
      setPreview(parsed);
    } catch (err) {
      setPreview(null);
      setParseError(
        err instanceof Error ? err.message : 'Teks JSON backup tidak valid.'
      );
    }
  };

  const handleConfirmRestore = () => {
    if (!preview) return;
    onRestoreBackup(preview.data);
    setPreview(null);
    setJsonPasteText('');
    setParseError(null);
  };

  return (
    <div className="space-y-6">
      {/* Current Data Snapshot */}
      <div className="bg-white border border-slate-200 rounded-xl grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
        <div className="px-5 py-4">
          <p className="text-xs font-medium text-slate-500">Total Personel</p>
          <p className="mt-1 text-2xl font-semibold font-mono tabular-nums text-slate-900">
            {personnel.length}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {pausedCount} tidak piket sementara
          </p>
        </div>
        <div className="px-5 py-4">
          <p className="text-xs font-medium text-slate-500">
            Edit Shift Manual
          </p>
          <p className="mt-1 text-2xl font-semibold font-mono tabular-nums text-slate-900">
            {overrideCount}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            Perubahan sel di matriks
          </p>
        </div>
        <div className="px-5 py-4">
          <p className="text-xs font-medium text-slate-500">Satuan Aktif</p>
          <p className="mt-1 text-sm font-semibold text-slate-900 truncate">
            {header.line3}
          </p>
          <p className="mt-0.5 text-xs text-slate-500 truncate">
            {header.signerName}
          </p>
        </div>
        <div className="px-5 py-4">
          <p className="text-xs font-medium text-slate-500">Backup Terakhir</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {formatReadableTime(lastBackupAt)}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            Disimpan lokal di perangkat
          </p>
        </div>
      </div>

      {/* Export Backup Card */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Archive className="w-4 h-4 text-blue-600" />
              <h2 className="text-base font-semibold text-slate-900">
                Cadangkan Data (Export Backup)
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Simpan seluruh data personel, urutan unit, pengaturan kop surat,
              titik mulai PAWAS, dan edit shift manual ke dalam satu file{' '}
              <span className="font-mono">.json</span>. Berguna sebelum ganti
              HP, hapus cache browser, atau dibagikan ke admin piket lain.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleCopyBackup}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
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

            <button
              type="button"
              onClick={handleDownloadBackup}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh File Backup (.json)</span>
            </button>
          </div>
        </div>
      </section>

      {/* Restore Backup Card */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-blue-600" />
              <h2 className="text-base font-semibold text-slate-900">
                Pulihkan Data (Restore Backup)
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Pilih file <span className="font-mono">.json</span> hasil backup
              atau tempel teks JSON backup di bawah ini untuk memulihkan jadwal.
            </p>
          </div>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors whitespace-nowrap"
            >
              <FileJson className="w-3.5 h-3.5 text-blue-600" />
              <span>Pilih File Backup (.json)</span>
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="backup-json-input"
            className="block text-xs font-medium text-slate-600"
          >
            Atau Tempel Teks JSON Backup di Sini:
          </label>
          <textarea
            id="backup-json-input"
            rows={4}
            value={jsonPasteText}
            onChange={(e) => {
              setJsonPasteText(e.target.value);
              setPreview(null);
              setParseError(null);
            }}
            placeholder='{"app":"kuat-pers-jadwal-piket","version":1,...}'
            className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
          />
          <div className="flex justify-end">
            <button
              type="button"
              disabled={!jsonPasteText.trim()}
              onClick={handleValidatePastedText}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg disabled:opacity-40 disabled:pointer-events-none"
            >
              Periksa &amp; Pratinjau Backup
            </button>
          </div>
        </div>

        {parseError && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{parseError}</span>
          </div>
        )}

        {preview && (
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-blue-950">
                  File Backup Siap Dipulihkan
                </h3>
                <p className="text-xs text-blue-800 mt-0.5">
                  Waktu ekspor: {formatReadableTime(preview.exportedAt)} ·
                  Satuan: <strong>{preview.data.header.line3}</strong>
                </p>
              </div>
              <div className="font-mono text-xs text-blue-900">
                {preview.data.personnel.length} personel ·{' '}
                {Object.keys(preview.data.overrides).length} edit manual
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                className="px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                Terapkan &amp; Pulihkan Data
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Safe Reset to Baseline */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-slate-900">
            Kembalikan ke Data Standar Awal
          </h3>
          <p className="text-xs text-slate-500">
            Menghapus seluruh perubahan lokal (personel tambahan, urutan unit,
            dan edit manual) dan memuat ulang data awal 58 personel.
          </p>
        </div>

        {!confirmReset ? (
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 rounded-lg whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset ke Data Awal</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setConfirmReset(false)}
              className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => {
                onResetBaseline();
                setConfirmReset(false);
              }}
              className="px-3.5 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg"
            >
              Ya, Reset Sekarang
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
