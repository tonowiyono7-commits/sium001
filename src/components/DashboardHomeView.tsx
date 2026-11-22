import { useMemo } from 'react';
import {
  Archive,
  ArrowRight,
  CalendarDays,
  ClipboardList,
  Clock,
  FileText,
  Printer,
  ScrollText,
  Shield,
  UserCheck,
  Users,
} from 'lucide-react';
import {
  AppTab,
  PawasAnchor,
  Personnel,
  RosterOrgHeader,
  ShiftCode,
  ShiftOverrides,
} from '../types/polriRoster';
import {
  DAY_NAMES_FULL_ID,
  formatDateKey,
  getEffectivePersonnelForMonth,
  getEffectiveShift,
  isPersonPausedOnDate,
  MONTH_NAMES_ID,
} from '../utils/continuousRoster';
import { DashboardUserSession } from '../utils/dashboardAuth';

interface DashboardHomeViewProps {
  session: DashboardUserSession;
  header: RosterOrgHeader;
  personnel: Personnel[];
  pawasAnchor: PawasAnchor;
  overrides: ShiftOverrides;
  todayWib: {
    year: number;
    monthIndex: number;
    day: number;
    dateKey: string;
  };
  lastBackupAt?: string;
  onNavigateTab: (tab: AppTab) => void;
  onInspectTodayDaily: () => void;
}

export function DashboardHomeView({
  session,
  header,
  personnel,
  pawasAnchor,
  overrides,
  todayWib,
  lastBackupAt,
  onNavigateTab,
  onInspectTodayDaily,
}: DashboardHomeViewProps) {
  const summary = useMemo(() => {
    const monthPersonnel = getEffectivePersonnelForMonth(
      personnel,
      todayWib.year,
      todayWib.monthIndex
    );
    const dateKey = formatDateKey(todayWib.year, todayWib.monthIndex, todayWib.day);
    const dateObj = new Date(todayWib.year, todayWib.monthIndex, todayWib.day);
    const dayName = DAY_NAMES_FULL_ID[dateObj.getDay()];

    const getCode = (p: Personnel): ShiftCode =>
      getEffectiveShift(
        p,
        todayWib.year,
        todayWib.monthIndex,
        todayWib.day,
        overrides,
        monthPersonnel,
        pawasAnchor
      ).code;

    const pawas = monthPersonnel.filter(
      (p) => p.unit === 'PAWAS' && getCode(p) === 'X'
    );
    const bhabin = monthPersonnel.filter(
      (p) => p.unit === 'BHABIN' && getCode(p) === 'X'
    );
    const siang = monthPersonnel.filter(
      (p) =>
        ['SAMAPTA', 'LANTAS', 'SPK'].includes(p.unit) && getCode(p) === 'S'
    );
    const malam = monthPersonnel.filter(
      (p) =>
        ['SAMAPTA', 'LANTAS', 'SPK'].includes(p.unit) && getCode(p) === 'M'
    );
    const intelReskrim24 = monthPersonnel.filter(
      (p) => ['INTEL', 'RESKRIM'].includes(p.unit) && getCode(p) === 'P'
    );
    const paused = monthPersonnel.filter((p) => isPersonPausedOnDate(p, dateKey));
    const activeCount = monthPersonnel.length - paused.length;
    const total24Jam = pawas.length + bhabin.length + intelReskrim24.length;

    return {
      dayName,
      totalCount: monthPersonnel.length,
      activeCount,
      pausedCount: paused.length,
      total24Jam,
      pawas,
      bhabin,
      siang,
      malam,
      intelReskrim24,
    };
  }, [personnel, pawasAnchor, overrides, todayWib]);

  const formattedBackupDate = useMemo(() => {
    if (!lastBackupAt) return 'Belum pernah dicadangkan';
    try {
      return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(lastBackupAt));
    } catch {
      return lastBackupAt;
    }
  }, [lastBackupAt]);

  const moduleCards: {
    id: AppTab;
    title: string;
    description: string;
    metric: string;
    icon: typeof CalendarDays;
  }[] = [
    {
      id: 'matrix',
      title: 'Matriks Bulanan',
      description:
        'Tabel jadwal lengkap satu bulan penuh dengan koreksi manual per sel shift.',
      metric: `${MONTH_NAMES_ID[todayWib.monthIndex]} ${todayWib.year}`,
      icon: CalendarDays,
    },
    {
      id: 'daily',
      title: 'Piket Harian & WhatsApp',
      description:
        'Rekap petugas piket per hari (24 Jam, Siang, Malam) siap salin ke WhatsApp.',
      metric: `${summary.total24Jam + summary.siang.length} Gabungan Siang`,
      icon: Clock,
    },
    {
      id: 'rengiat',
      title: 'Rengiat (Rencana Kegiatan)',
      description:
        'Susun rencana kegiatan harian dengan pilihan waktu, tempat & pelaksana siap salin WA.',
      metric: 'Laporan Komando WA',
      icon: ClipboardList,
    },
    {
      id: 'pam',
      title: 'Daftar Pers PAM',
      description:
        'Submenu PAM AKSI & PAM GIAT terfilter dari piket harian, edit manual, simpan hingga 10 daftar, ekspor Excel & WA.',
      metric: 'PAM AKSI & PAM GIAT',
      icon: UserCheck,
    },
    {
      id: 'surat',
      title: 'Buat Surat (Sprin & Biasa)',
      description:
        'Buat Surat Perintah & Surat Biasa dengan pilih nama langsung dari Jadwal Piket, ekspor ke Word (.docx) & PDF.',
      metric: 'SURAT PERINTAH & BIASA',
      icon: FileText,
    },
    {
      id: 'buat-sprin',
      title: 'Buat Sprin (SIPRIN A4)',
      description:
        'Editor Surat Perintah 1–2 halaman A4 dengan preset Satker, stempel & TTD digital, arsip Sprin, dan ekspor Word (.docx).',
      metric: 'SPRIN A4 & LAMPIRAN',
      icon: ScrollText,
    },
    {
      id: 'personnel',
      title: 'Data Personel & Urutan',
      description:
        'Tambah, edit, naik/turunkan posisi personel dan satuan, serta jeda piket.',
      metric: `${summary.activeCount} Aktif / ${summary.totalCount} Total`,
      icon: Users,
    },
    {
      id: 'export',
      title: 'Cetak & Excel',
      description:
        'Pratinjau dokumen cetak resmi landscape A4/F4 serta unduh file CSV/Excel.',
      metric: 'Siap Cetak Resmi',
      icon: Printer,
    },
    {
      id: 'backup',
      title: 'Backup & Restore',
      description:
        'Ekspor cadangan penuh JSON atau pulihkan konfigurasi jadwal antar perangkat.',
      metric: formattedBackupDate,
      icon: Archive,
    },
  ];

  const isAdmin = session.role === 'admin';
  const visibleModuleCards = isAdmin
    ? moduleCards
    : moduleCards.filter((c) => c.id !== 'personnel' && c.id !== 'backup');

  return (
    <div className="space-y-5">
      {/* Section 1: Identitas Kesatuan & Operator (Matching Reference Card Style) */}
      <section className="bg-[#191510] border border-[#2f271d] rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xs font-bold uppercase tracking-wider text-[#dfb365]">
            1. IDENTITAS KESATUAN &amp; STATUS OPERASIONAL
          </h1>
          <span className="text-xs font-mono text-[#a79c8e]">
            {summary.dayName}, {todayWib.day}{' '}
            {MONTH_NAMES_ID[todayWib.monthIndex]} {todayWib.year}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div className="space-y-1">
            <div className="text-[11px] font-medium text-[#9b8f80]">Polda</div>
            <div className="bg-[#13100c] border border-[#2d251b] rounded-lg px-3.5 py-2.5 text-sm text-[#f3ede4] truncate">
              {header.line1}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[11px] font-medium text-[#9b8f80]">Polres</div>
            <div className="bg-[#13100c] border border-[#2d251b] rounded-lg px-3.5 py-2.5 text-sm text-[#f3ede4] truncate">
              {header.line2}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[11px] font-medium text-[#9b8f80]">
              Polsek (Kesatuan)
            </div>
            <div className="bg-[#13100c] border border-[#2d251b] rounded-lg px-3.5 py-2.5 text-sm text-[#f3ede4] truncate">
              {header.line3}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div className="space-y-1">
            <div className="text-[11px] font-medium text-[#9b8f80]">
              Tanggal Piket Aktif
            </div>
            <div className="bg-[#13100c] border border-[#2d251b] rounded-lg px-3.5 py-2.5 text-sm font-mono tabular-nums text-[#f3ede4]">
              {String(todayWib.day).padStart(2, '0')}/
              {String(todayWib.monthIndex + 1).padStart(2, '0')}/{todayWib.year}{' '}
              <span className="text-[#9b8f80] font-sans text-xs ml-1.5">
                ({summary.dayName})
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[11px] font-medium text-[#9b8f80]">
              Operator Login &amp; Peran
            </div>
            <div className="bg-[#13100c] border border-[#2d251b] rounded-lg px-3.5 py-2.5 text-sm text-[#f3ede4] flex items-center justify-between gap-2">
              <span className="truncate font-medium">
                {session.displayName}
              </span>
              <span className="text-xs font-mono text-[#dfb365] shrink-0">
                {session.role === 'admin' ? 'ADMIN' : 'USER'} · @{session.username}
              </span>
            </div>
          </div>
        </div>

        {/* Gold-Bordered Operational Highlight Box */}
        <div className="bg-[#241d12] border border-[#785c30] rounded-lg p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-[#f0cf89]">
                Kendali Cepat Jadwal Piket
              </div>
              <p className="text-xs text-[#cbb899] mt-0.5">
                {isAdmin
                  ? 'Pilih tampilan operasional di bawah untuk memeriksa petugas hari ini atau menyunting matriks rotasi satu bulan penuh.'
                  : 'Pilih tampilan operasional di bawah untuk memeriksa petugas hari ini atau melihat matriks rotasi satu bulan penuh (mode lihat saja).'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onInspectTodayDaily}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#f3ede4] bg-[#17130d] border border-[#5e4827] hover:bg-[#211b12] rounded-lg transition-colors whitespace-nowrap"
              >
                <Clock className="w-3.5 h-3.5 text-[#dfb365]" />
                <span>Piket Hari Ini</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('matrix')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#a6783e] hover:bg-[#b88647] rounded-lg transition-colors whitespace-nowrap"
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Buka Matriks Bulanan</span>
              </button>
            </div>
          </div>

          {/* 4-Column Tabular KPI Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
            <div className="bg-[#15110c] border border-[#3a2f20] rounded-lg px-3.5 py-3">
              <div className="text-[11px] text-[#a79c8e]">Total Kekuatan</div>
              <div className="mt-1 flex items-baseline justify-between gap-2">
                <span className="text-xl font-bold font-mono tabular-nums text-[#f5efe6]">
                  {summary.totalCount}
                </span>
                <span className="text-[11px] font-mono tabular-nums text-[#9b8f80]">
                  {summary.activeCount} aktif
                </span>
              </div>
            </div>

            <div className="bg-[#15110c] border border-[#3a2f20] rounded-lg px-3.5 py-3">
              <div className="text-[11px] text-[#a79c8e]">Piket 24 Jam</div>
              <div className="mt-1 flex items-baseline justify-between gap-2">
                <span className="text-xl font-bold font-mono tabular-nums text-[#e6bd70]">
                  {summary.total24Jam}
                </span>
                <span className="text-[11px] font-mono tabular-nums text-[#9b8f80]">
                  X &amp; P
                </span>
              </div>
            </div>

            <div className="bg-[#15110c] border border-[#3a2f20] rounded-lg px-3.5 py-3">
              <div className="text-[11px] text-[#a79c8e]">
                Piket Siang 12J
              </div>
              <div className="mt-1 flex items-baseline justify-between gap-2">
                <span className="text-xl font-bold font-mono tabular-nums text-[#f5efe6]">
                  {summary.siang.length}
                </span>
                <span className="text-[11px] font-mono tabular-nums text-[#9b8f80]">
                  08.00–20.00
                </span>
              </div>
            </div>

            <div className="bg-[#15110c] border border-[#3a2f20] rounded-lg px-3.5 py-3">
              <div className="text-[11px] text-[#a79c8e]">
                Piket Malam 12J
              </div>
              <div className="mt-1 flex items-baseline justify-between gap-2">
                <span className="text-xl font-bold font-mono tabular-nums text-[#f5efe6]">
                  {summary.malam.length}
                </span>
                <span className="text-[11px] font-mono tabular-nums text-[#9b8f80]">
                  20.00–08.00
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Petugas Piket Hari Ini */}
      <section className="bg-[#191510] border border-[#2f271d] rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#2f271d] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#dfb365] shrink-0" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#dfb365]">
              2. PETUGAS PIKET HARI INI ({summary.dayName}, {todayWib.day}{' '}
              {MONTH_NAMES_ID[todayWib.monthIndex]} {todayWib.year})
            </h2>
          </div>
          <button
            type="button"
            onClick={onInspectTodayDaily}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#e6bd70] hover:text-[#f5d590] whitespace-nowrap"
          >
            <span>Salin Laporan WhatsApp</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#2f271d]">
          <div className="p-4 sm:p-5 space-y-2.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#e6bd70]">
              Pawas &amp; Bhabin 24J (X)
            </div>
            <ul className="space-y-1.5 text-xs text-[#d6cec2]">
              {[...summary.pawas, ...summary.bhabin].length === 0 ? (
                <li className="text-[#786e60]">Tidak ada petugas terjadwal.</li>
              ) : (
                [...summary.pawas, ...summary.bhabin].map((p) => (
                  <li key={p.id} className="flex items-start justify-between gap-2">
                    <span className="font-medium text-[#f3ede4]">
                      {p.pangkat} {p.name}
                    </span>
                    <span className="font-mono text-[11px] text-[#9b8f80] shrink-0">
                      {p.unit}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="p-4 sm:p-5 space-y-2.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#e6bd70]">
              Piket Siang 12J (S)
            </div>
            <ul className="space-y-1.5 text-xs text-[#d6cec2]">
              {summary.siang.length === 0 ? (
                <li className="text-[#786e60]">Tidak ada petugas terjadwal.</li>
              ) : (
                summary.siang.map((p) => (
                  <li key={p.id} className="flex items-start justify-between gap-2">
                    <span className="font-medium text-[#f3ede4]">
                      {p.pangkat} {p.name}
                    </span>
                    <span className="font-mono text-[11px] text-[#9b8f80] shrink-0">
                      {p.unit}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="p-4 sm:p-5 space-y-2.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#e6bd70]">
              Piket Malam 12J (M)
            </div>
            <ul className="space-y-1.5 text-xs text-[#d6cec2]">
              {summary.malam.length === 0 ? (
                <li className="text-[#786e60]">Tidak ada petugas terjadwal.</li>
              ) : (
                summary.malam.map((p) => (
                  <li key={p.id} className="flex items-start justify-between gap-2">
                    <span className="font-medium text-[#f3ede4]">
                      {p.pangkat} {p.name}
                    </span>
                    <span className="font-mono text-[11px] text-[#9b8f80] shrink-0">
                      {p.unit}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="p-4 sm:p-5 space-y-2.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#e6bd70]">
              Intel &amp; Reskrim 24J (P)
            </div>
            <ul className="space-y-1.5 text-xs text-[#d6cec2]">
              {summary.intelReskrim24.length === 0 ? (
                <li className="text-[#786e60]">Tidak ada petugas terjadwal.</li>
              ) : (
                summary.intelReskrim24.map((p) => (
                  <li key={p.id} className="flex items-start justify-between gap-2">
                    <span className="font-medium text-[#f3ede4]">
                      {p.pangkat} {p.name}
                    </span>
                    <span className="font-mono text-[11px] text-[#9b8f80] shrink-0">
                      {p.unit}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </section>

      {/* Section 3: Modul Aplikasi Jadwal Piket */}
      <section className="bg-[#191510] border border-[#2f271d] rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#dfb365]">
            3. MODUL APLIKASI JADWAL PIKET
          </h2>
          <span className="text-xs text-[#9b8f80]">
            Seluruh modul terhubung langsung tanpa mengubah struktur jadwal
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {visibleModuleCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => onNavigateTab(card.id)}
                className="group text-left bg-[#13100c] border border-[#2d251b] hover:border-[#8d6b38] hover:bg-[#1d1710] rounded-xl p-4 transition-colors flex flex-col justify-between gap-3.5"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="w-9 h-9 rounded-lg border border-[#3a2f20] bg-[#1c1711] group-hover:border-[#8d6b38] group-hover:bg-[#272015] flex items-center justify-center text-[#dfb365] transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#695e50] group-hover:text-[#dfb365] transition-colors shrink-0" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#f3ede4] group-hover:text-[#f0cf89] transition-colors">
                      {card.title}
                    </h3>
                    <p className="mt-1 text-xs text-[#9b8f80] leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-[#262017] text-[11px] font-mono text-[#b8aa97] truncate">
                  {card.metric}
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
