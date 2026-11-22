import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Edit3,
  ExternalLink,
  Link2,
  MessageSquare,
  RotateCcw,
  Send,
  Share2,
} from 'lucide-react';
import { UNIT_META } from '../data/polriOktober2026';
import {
  PawasAnchor,
  Personnel,
  RosterOrgHeader,
  ShiftCode,
  ShiftOverrides,
} from '../types/polriRoster';
import {
  buildWhatsAppShareUrl,
  DAY_NAMES_FULL_ID,
  formatCombinedShiftWhatsApp,
  formatDailyWhatsAppReport,
  formatDateKey,
  getDaysInMonth,
  getEffectiveShift,
  getShiftStyle,
  isPersonPausedOnDate,
  MONTH_NAMES_ID,
  normalizeWhatsAppPhone,
} from '../utils/continuousRoster';

type DailyShiftFilter =
  | 'ALL'
  | '24H'
  | 'SIANG'
  | 'MALAM'
  | 'GABUNGAN_SIANG'
  | 'GABUNGAN_MALAM';

type WaSummaryMode = 'AUTO' | 'FULL' | 'COMPACT';

const DAILY_WA_PHONE_STORAGE_KEY = 'kuat_pers_daily_wa_phone_v1';

const WA_GREETING_OPTIONS = [
  { value: '', label: 'Standar (Tanpa Salam)' },
  { value: 'SELAMAT PAGI KOMANDAN', label: 'Selamat Pagi Komandan' },
  { value: 'SELAMAT SIANG KOMANDAN', label: 'Selamat Siang Komandan' },
  { value: 'SELAMAT SORE KOMANDAN', label: 'Selamat Sore Komandan' },
  { value: 'SELAMAT MALAM KOMANDAN', label: 'Selamat Malam Komandan' },
] as const;

interface DailyDutyViewProps {
  header: RosterOrgHeader;
  year: number;
  monthIndex: number;
  selectedDay: number;
  onSelectDay: (day: number) => void;
  personnel: Personnel[];
  pawasAnchor: PawasAnchor;
  overrides: ShiftOverrides;
  onCopyText: (text: string) => void;
  copiedRecently: boolean;
}

export function DailyDutyView({
  header,
  year,
  monthIndex,
  selectedDay,
  onSelectDay,
  personnel,
  pawasAnchor,
  overrides,
  onCopyText,
  copiedRecently,
}: DailyDutyViewProps) {
  const [shiftFilter, setShiftFilter] = useState<DailyShiftFilter>('ALL');
  const [waMode, setWaMode] = useState<WaSummaryMode>('AUTO');
  const [waGreeting, setWaGreeting] = useState<string>('');
  const [includeCadangan, setIncludeCadangan] = useState<boolean>(true);
  const [includeJabatan, setIncludeJabatan] = useState<boolean>(true);
  const [waPhone, setWaPhone] = useState<string>(() => {
    try {
      return localStorage.getItem(DAILY_WA_PHONE_STORAGE_KEY) ?? '';
    } catch {
      return '';
    }
  });
  const [customWaText, setCustomWaText] = useState<string | null>(null);
  const [isEditingWa, setIsEditingWa] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem(DAILY_WA_PHONE_STORAGE_KEY, waPhone);
    } catch {
      // Abaikan error storage
    }
  }, [waPhone]);

  const daysInMonth = getDaysInMonth(year, monthIndex);
  const safeDay = Math.min(Math.max(1, selectedDay), daysInMonth);
  const dateObj = new Date(year, monthIndex, safeDay);
  const dayName = DAY_NAMES_FULL_ID[dateObj.getDay()];
  const dateKey = formatDateKey(year, monthIndex, safeDay);

  const groups = useMemo(() => {
    const withShift = personnel.map((p) => ({
      person: p,
      ...getEffectiveShift(
        p,
        year,
        monthIndex,
        safeDay,
        overrides,
        personnel,
        pawasAnchor
      ),
    }));

    const pawas = withShift.filter(
      (x) => x.person.unit === 'PAWAS' && x.code === 'X'
    );
    const bhabin = withShift.filter(
      (x) => x.person.unit === 'BHABIN' && x.code === 'X'
    );
    const piket24IntelRes = withShift.filter((x) => x.code === 'P');
    const all24H = withShift.filter((x) => x.code === 'X' || x.code === 'P');
    const siang = withShift.filter((x) => x.code === 'S');
    const malam = withShift.filter((x) => x.code === 'M');
    const gabunganSiang = withShift.filter(
      (x) => x.code === 'X' || x.code === 'P' || x.code === 'S'
    );
    const gabunganMalam = withShift.filter(
      (x) => x.code === 'X' || x.code === 'P' || x.code === 'M'
    );

    return {
      pawas,
      bhabin,
      piket24: piket24IntelRes,
      all24H,
      siang,
      malam,
      gabunganSiang,
      gabunganMalam,
      cadangan: withShift.filter(
        (x) => x.code === 'C' || x.code === 'C1' || x.code === 'C2'
      ),
      lepas: withShift.filter((x) => x.code === 'L'),
      jamDinas: withShift.filter(
        (x) =>
          x.person.unit === 'STANBY' ||
          x.person.unit === 'JAGA_BANK' ||
          x.person.unit === 'SIUM'
      ),
      paused: personnel.filter((p) => isPersonPausedOnDate(p, dateKey)),
    };
  }, [personnel, year, monthIndex, safeDay, overrides, pawasAnchor, dateKey]);

  const filterMeta = useMemo(() => {
    switch (shiftFilter) {
      case '24H':
        return {
          title: 'Daftar Piket 24 Jam (X & P)',
          subtitle: '08.00 s.d. 08.00 WIB · PAWAS, BHABIN, INTEL, RESKRIM',
          items: groups.all24H,
        };
      case 'SIANG':
        return {
          title: 'Daftar Piket Siang 12 Jam',
          subtitle: '08.00 s.d. 20.00 WIB · Kode S (SPK, SAMAPTA, LANTAS)',
          items: groups.siang,
        };
      case 'MALAM':
        return {
          title: 'Daftar Piket Malam 12 Jam',
          subtitle: '20.00 s.d. 08.00 WIB · Kode M (SPK, SAMAPTA, LANTAS)',
          items: groups.malam,
        };
      case 'GABUNGAN_SIANG':
        return {
          title: 'Gabungan Piket 24 Jam + Piket Siang',
          subtitle: `08.00 s.d. 20.00 WIB · 24 Jam (${groups.all24H.length} pers) + Siang 12 Jam (${groups.siang.length} pers)`,
          items: groups.gabunganSiang,
        };
      case 'GABUNGAN_MALAM':
        return {
          title: 'Gabungan Piket 24 Jam + Piket Malam',
          subtitle: `20.00 s.d. 08.00 WIB · 24 Jam (${groups.all24H.length} pers) + Malam 12 Jam (${groups.malam.length} pers)`,
          items: groups.gabunganMalam,
        };
      default:
        return null;
    }
  }, [shiftFilter, groups]);

  const generatedWaText = useMemo(() => {
    if (waMode === 'AUTO' && filterMeta) {
      return formatCombinedShiftWhatsApp(
        header,
        filterMeta.title,
        filterMeta.items,
        year,
        monthIndex,
        safeDay,
        {
          greeting: waGreeting,
          includeJabatan,
        }
      );
    }

    return formatDailyWhatsAppReport(
      header,
      personnel,
      year,
      monthIndex,
      safeDay,
      overrides,
      pawasAnchor,
      {
        greeting: waGreeting,
        includeCadangan: waMode === 'COMPACT' ? false : includeCadangan,
        includeJabatan: waMode === 'COMPACT' ? false : includeJabatan,
        compact: waMode === 'COMPACT',
      }
    );
  }, [
    waMode,
    filterMeta,
    header,
    year,
    monthIndex,
    safeDay,
    waGreeting,
    includeJabatan,
    includeCadangan,
    personnel,
    overrides,
    pawasAnchor,
  ]);

  const activeWaText = customWaText ?? generatedWaText;

  const whatsappShareUrl = useMemo(
    () => buildWhatsAppShareUrl(activeWaText, waPhone),
    [activeWaText, waPhone]
  );

  const normalizedPhoneDisplay = useMemo(
    () => normalizeWhatsAppPhone(waPhone),
    [waPhone]
  );

  const canNativeShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const handleCopyReport = () => {
    onCopyText(activeWaText);
  };

  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(whatsappShareUrl);
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 2400);
    } catch {
      onCopyText(whatsappShareUrl);
    }
  };

  const handleNativeShare = async () => {
    if (!canNativeShare) return;
    try {
      await navigator.share({
        title: `Jadwal Piket Harian - ${safeDay} ${MONTH_NAMES_ID[monthIndex]} ${year}`,
        text: activeWaText,
      });
    } catch {
      // Abaikan jika dibatalkan pengguna
    }
  };

  const renderGroupCard = (
    title: string,
    codeLabel: string,
    items: { person: Personnel; code: ShiftCode }[],
    accentClass: string
  ) => (
    <section className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`px-2 py-0.5 text-xs font-mono font-bold rounded shrink-0 ${accentClass}`}
          >
            {codeLabel}
          </span>
          <h3 className="text-sm font-semibold text-slate-900 truncate">
            {title}
          </h3>
        </div>
        <span className="font-mono tabular-nums text-xs text-slate-500 whitespace-nowrap shrink-0">
          {items.length} pers
        </span>
      </div>
      <div className="divide-y divide-slate-100">
        {items.length === 0 ? (
          <div className="px-4 py-4 text-xs text-slate-500">
            Tidak ada personel terjadwal.
          </div>
        ) : (
          items.map(({ person, code }) => (
            <div
              key={person.id}
              className={`px-4 py-2.5 flex items-center justify-between gap-3 ${
                person.highlightColor === 'red' ? 'bg-red-100/70' : ''
              }`}
            >
              <div className="min-w-0">
                <p
                  className={`text-sm truncate ${
                    person.highlightColor === 'red'
                      ? 'font-bold text-red-950 bg-red-300 inline-block px-1.5 rounded'
                      : 'font-medium text-slate-900'
                  }`}
                >
                  {person.name}
                </p>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {person.pangkat} · NRP{' '}
                  <span className="font-mono tabular-nums">{person.nrp}</span> ·{' '}
                  {person.jabatan}
                </p>
              </div>
              <span className="text-xs font-mono text-slate-500 whitespace-nowrap shrink-0">
                {person.ket || code}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );

  const filterTabs: { id: DailyShiftFilter; label: string; count: number }[] = [
    {
      id: 'ALL',
      label: 'Semua Bagian',
      count: groups.all24H.length + groups.siang.length + groups.malam.length,
    },
    { id: '24H', label: '24 Jam (X & P)', count: groups.all24H.length },
    {
      id: 'SIANG',
      label: 'Siang 12J (08.00–20.00)',
      count: groups.siang.length,
    },
    {
      id: 'MALAM',
      label: 'Malam 12J (20.00–08.00)',
      count: groups.malam.length,
    },
    {
      id: 'GABUNGAN_SIANG',
      label: 'Gabungan 24J + Siang',
      count: groups.gabunganSiang.length,
    },
    {
      id: 'GABUNGAN_MALAM',
      label: 'Gabungan 24J + Malam',
      count: groups.gabunganMalam.length,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Date Selector Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={safeDay <= 1}
            onClick={() => {
              onSelectDay(safeDay - 1);
              setCustomWaText(null);
            }}
            className="p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
            aria-label="Hari sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="px-2">
            <h2 className="text-base font-semibold text-slate-900">
              {dayName}, {safeDay} {MONTH_NAMES_ID[monthIndex]} {year}
            </h2>
            <p className="text-xs text-slate-500">
              Ringkasan kekuatan &amp; filter jam dinas piket harian
            </p>
          </div>

          <button
            type="button"
            disabled={safeDay >= daysInMonth}
            onClick={() => {
              onSelectDay(safeDay + 1);
              setCustomWaText(null);
            }}
            className="p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
            aria-label="Hari berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={safeDay}
            onChange={(e) => {
              onSelectDay(Number(e.target.value));
              setCustomWaText(null);
            }}
            aria-label="Pilih tanggal"
            className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
          >
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
              const dt = new Date(year, monthIndex, d);
              return (
                <option key={d} value={d}>
                  Tgl {d} — {DAY_NAMES_FULL_ID[dt.getDay()]}
                </option>
              );
            })}
          </select>

          <button
            type="button"
            onClick={handleCopyReport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            {copiedRecently ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Tersalin</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>
                  {filterMeta && waMode === 'AUTO'
                    ? 'Salin Daftar Filter (WA)'
                    : 'Salin Laporan Harian (WA)'}
                </span>
              </>
            )}
          </button>

          <a
            href={whatsappShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Kirim ke WA</span>
          </a>
        </div>
      </div>

      {/* Paused Personnel Notice if any */}
      {groups.paused.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-red-950">
          <div>
            <span className="font-semibold">
              Personel sementara tidak piket pada tanggal ini:{' '}
            </span>
            {groups.paused.map((p, i) => (
              <span key={p.id}>
                {i > 0 ? ', ' : ''}
                <span className="bg-red-300 text-red-950 font-bold px-1.5 py-0.5 rounded">
                  {p.pangkat} {p.name}
                </span>
              </span>
            ))}
          </div>
          <span className="text-red-700 whitespace-nowrap">
            Rotasi PAWAS otomatis menyesuaikan
          </span>
        </div>
      )}

      {/* 4-Column Summary Strip (24J, Siang 08-20, Malam 20-08, Gabungan) */}
      <div className="bg-white border border-slate-200 rounded-xl grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
        <div className="px-5 py-3.5">
          <p className="text-xs font-medium text-slate-500">
            Piket 24 Jam (08.00–08.00)
          </p>
          <p className="mt-1 text-2xl font-semibold font-mono tabular-nums text-slate-900">
            {groups.all24H.length}
          </p>
          <p className="mt-0.5 text-xs text-slate-500 font-mono tabular-nums">
            X: {groups.pawas.length + groups.bhabin.length} · P:{' '}
            {groups.piket24.length} pers
          </p>
        </div>
        <div className="px-5 py-3.5">
          <p className="text-xs font-medium text-slate-500">
            Siang 12 Jam (08.00–20.00)
          </p>
          <p className="mt-1 text-2xl font-semibold font-mono tabular-nums text-slate-900">
            {groups.siang.length}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            Kode S · SPK, Samapta, Lantas
          </p>
        </div>
        <div className="px-5 py-3.5">
          <p className="text-xs font-medium text-slate-500">
            Malam 12 Jam (20.00–08.00)
          </p>
          <p className="mt-1 text-2xl font-semibold font-mono tabular-nums text-slate-900">
            {groups.malam.length}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            Kode M · SPK, Samapta, Lantas
          </p>
        </div>
        <div className="px-5 py-3.5">
          <p className="text-xs font-medium text-slate-500">
            Gabungan Kekuatan Piket
          </p>
          <div className="mt-1 flex items-baseline gap-4 font-mono tabular-nums">
            <div>
              <span className="text-lg font-semibold text-slate-900">
                {groups.gabunganSiang.length}
              </span>
              <span className="ml-1 text-xs text-slate-500">24J+Siang</span>
            </div>
            <span className="text-slate-300">/</span>
            <div>
              <span className="text-lg font-semibold text-slate-900">
                {groups.gabunganMalam.length}
              </span>
              <span className="ml-1 text-xs text-slate-500">24J+Malam</span>
            </div>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Total jaga siang vs malam
          </p>
        </div>
      </div>

      {/* Interactive Shift Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 border border-slate-200 rounded-xl">
        {filterTabs.map((tab) => {
          const isActive = shiftFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setShiftFilter(tab.id);
                setCustomWaText(null);
              }}
              className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 ${
                isActive
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`font-mono tabular-nums ${
                  isActive ? 'text-blue-700 font-semibold' : 'text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filtered Roster Table OR Grouped Cards */}
      {filterMeta ? (
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                {filterMeta.title}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {filterMeta.subtitle}
              </p>
            </div>
            <div className="text-sm font-mono tabular-nums font-semibold text-slate-900 whitespace-nowrap">
              Jumlah: {filterMeta.items.length} Personel
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                  <th className="py-2.5 pl-5 pr-2 w-10">No</th>
                  <th className="py-2.5 px-3">Nama Personel</th>
                  <th className="py-2.5 px-3">Pangkat</th>
                  <th className="py-2.5 px-3">NRP</th>
                  <th className="py-2.5 px-3">Satuan</th>
                  <th className="py-2.5 px-3">Jabatan</th>
                  <th className="py-2.5 pl-3 pr-5 text-right">
                    Kode &amp; Jam Dinas
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filterMeta.items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-8 text-center text-slate-500 text-sm"
                    >
                      Tidak ada personel pada kategori piket ini.
                    </td>
                  </tr>
                ) : (
                  filterMeta.items.map(({ person, code }, idx) => {
                    const unitLabel =
                      UNIT_META.find((u) => u.key === person.unit)?.label ??
                      person.unit;
                    const jamLabel =
                      code === 'S'
                        ? 'Siang 08.00–20.00'
                        : code === 'M'
                        ? 'Malam 20.00–08.00'
                        : '24 Jam (08.00–08.00)';

                    return (
                      <tr key={person.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 pl-5 pr-2 font-mono tabular-nums text-slate-400">
                          {String(idx + 1).padStart(2, '0')}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-900 whitespace-nowrap">
                          {person.name}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                          {person.pangkat}
                        </td>
                        <td className="py-2.5 px-3 font-mono tabular-nums text-slate-600 whitespace-nowrap">
                          {person.nrp}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                          {unitLabel}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                          {person.jabatan}
                        </td>
                        <td className="py-2.5 pl-3 pr-5 text-right whitespace-nowrap">
                          <span className="inline-flex items-center gap-2">
                            <span className="text-slate-500">{jamLabel}</span>
                            <span
                              className={`inline-flex items-center justify-center w-7 py-0.5 rounded font-mono text-[11px] ${getShiftStyle(
                                code
                              )}`}
                            >
                              {code}
                            </span>
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {renderGroupCard(
            'Pawas 24 Jam (08.00–08.00)',
            'X',
            groups.pawas,
            'bg-blue-600 text-white'
          )}
          {renderGroupCard(
            'Bhabinkamtibmas 24 Jam (08.00–08.00)',
            'X',
            groups.bhabin,
            'bg-blue-600 text-white'
          )}
          {renderGroupCard(
            'Piket Siang 12 Jam (08.00 s.d. 20.00)',
            'S',
            groups.siang,
            'bg-amber-100 text-amber-900'
          )}
          {renderGroupCard(
            'Piket Malam 12 Jam (20.00 s.d. 08.00)',
            'M',
            groups.malam,
            'bg-slate-800 text-white'
          )}
          {renderGroupCard(
            'Piket Intel & Reskrim 24 Jam (08.00–08.00)',
            'P',
            groups.piket24,
            'bg-emerald-600 text-white'
          )}
          {renderGroupCard(
            'Cadangan Intel & Reskrim',
            'C / C1 / C2',
            groups.cadangan,
            'bg-slate-200 text-slate-800'
          )}
          {renderGroupCard(
            'Lepas Dinas',
            'L',
            groups.lepas,
            'bg-slate-100 text-slate-600 border border-slate-200'
          )}
          {renderGroupCard(
            'Jam Dinas (Stanby, Jaga Bank, Sium)',
            'STAFF',
            groups.jamDinas,
            'bg-slate-100 text-slate-700 border border-slate-200'
          )}
        </div>
      )}

      {/* WhatsApp Summary Generator & Auto-Share Link Panel */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-emerald-50/50">
          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-600 text-white shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Generator Ringkasan &amp; Tautan Berbagi WhatsApp
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Format teks otomatis untuk {dayName}, {safeDay}{' '}
                {MONTH_NAMES_ID[monthIndex]} {year} beserta tautan langsung ke
                WhatsApp.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyReport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors whitespace-nowrap"
            >
              {copiedRecently ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Teks Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Teks</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleCopyShareLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-900 bg-white hover:bg-emerald-50 border border-emerald-300 rounded-lg transition-colors whitespace-nowrap"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tautan Tersalin</span>
                </>
              ) : (
                <>
                  <Link2 className="w-3.5 h-3.5" />
                  <span>Salin Tautan WA</span>
                </>
              )}
            </button>

            {canNativeShare && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors whitespace-nowrap"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Bagikan</span>
              </button>
            )}

            <a
              href={whatsappShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors whitespace-nowrap"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Buka &amp; Kirim WhatsApp</span>
            </a>
          </div>
        </div>

        <div className="p-5 grid grid-cols-1 xl:grid-cols-12 gap-5">
          {/* Left: Format Options & Auto Share URL */}
          <div className="xl:col-span-5 space-y-4">
            <div className="space-y-1.5">
              <span className="block text-xs font-semibold text-slate-700">
                Mode Ringkasan
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1 gap-1.5">
                {(
                  [
                    {
                      id: 'AUTO',
                      title: filterMeta
                        ? `Ikuti Filter (${filterMeta.title})`
                        : 'Ikuti Filter (Semua Bagian)',
                      desc: 'Otomatis menyesuaikan tab filter aktif di atas',
                    },
                    {
                      id: 'FULL',
                      title: 'Laporan Harian Lengkap',
                      desc: 'Seluruh unit piket harian beserta rekap & cadangan',
                    },
                    {
                      id: 'COMPACT',
                      title: 'Ringkasan Singkat',
                      desc: 'Fokus personel dinas aktif tanpa cadangan & jabatan',
                    },
                  ] as const
                ).map((opt) => {
                  const active = waMode === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setWaMode(opt.id);
                        setCustomWaText(null);
                      }}
                      className={`text-left px-3 py-2 rounded-lg border transition-colors ${
                        active
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-950'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="text-xs font-semibold">{opt.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {opt.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="daily-wa-greeting"
                className="block text-xs font-semibold text-slate-700"
              >
                Salam Pembuka (Opsional)
              </label>
              <select
                id="daily-wa-greeting"
                value={waGreeting}
                onChange={(e) => {
                  setWaGreeting(e.target.value);
                  setCustomWaText(null);
                }}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
              >
                {WA_GREETING_OPTIONS.map((g) => (
                  <option key={g.value || 'none'} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>

            {waMode !== 'COMPACT' && (
              <div className="flex flex-wrap gap-4 pt-1">
                {!(waMode === 'AUTO' && filterMeta) && (
                  <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={includeCadangan}
                      onChange={(e) => {
                        setIncludeCadangan(e.target.checked);
                        setCustomWaText(null);
                      }}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Sertakan Cadangan (C/C1/C2)</span>
                  </label>
                )}

                <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeJabatan}
                    onChange={(e) => {
                      setIncludeJabatan(e.target.checked);
                      setCustomWaText(null);
                    }}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Sertakan Jabatan</span>
                </label>
              </div>
            )}

            <div className="space-y-1.5 pt-1 border-t border-slate-200">
              <label
                htmlFor="daily-wa-phone"
                className="block text-xs font-semibold text-slate-700"
              >
                Nomor WA Tujuan (Opsional)
              </label>
              <input
                id="daily-wa-phone"
                type="tel"
                value={waPhone}
                onChange={(e) => setWaPhone(e.target.value)}
                placeholder="Contoh: 081234567890 (kosongkan untuk pilih kontak/grup)"
                className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:font-sans placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
              />
              <p className="text-[11px] text-slate-500">
                {normalizedPhoneDisplay
                  ? `Nomor tujuan terdeteksi: +${normalizedPhoneDisplay}`
                  : 'Tanpa nomor tujuan, tautan akan membuka WhatsApp agar Anda bisa langsung memilih kontak atau grup.'}
              </p>
            </div>

            {/* Auto-generated Share Link Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-600 flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tautan Berbagi Otomatis</span>
                </span>
                <a
                  href={whatsappShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  <span>Buka Tautan</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={whatsappShareUrl}
                  onFocus={(e) => e.currentTarget.select()}
                  aria-label="Tautan berbagi WhatsApp otomatis"
                  className="flex-1 min-w-0 px-2.5 py-1.5 text-[11px] font-mono bg-white border border-slate-200 rounded text-slate-600 select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyShareLink}
                  className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded transition-colors whitespace-nowrap shrink-0"
                >
                  {copiedLink ? 'Tersalin' : 'Salin Link'}
                </button>
              </div>
            </div>
          </div>

          {/* Right: Live WhatsApp Formatted Preview / Quick Editor */}
          <div className="xl:col-span-7 flex flex-col bg-slate-900 text-slate-100 rounded-xl border border-slate-800 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Pratinjau Pesan WhatsApp
                </span>
                {customWaText !== null && (
                  <span className="text-[11px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-medium">
                    Diedit manual
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono tabular-nums text-slate-400">
                  {activeWaText.length} karakter
                </span>

                {customWaText !== null && (
                  <button
                    type="button"
                    onClick={() => setCustomWaText(null)}
                    className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-amber-300 hover:text-amber-200 bg-slate-800 border border-slate-700 rounded transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsEditingWa((v) => !v)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded border transition-colors ${
                    isEditingWa
                      ? 'bg-emerald-600 border-emerald-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{isEditingWa ? 'Lihat Pratinjau' : 'Edit Teks'}</span>
                </button>
              </div>
            </div>

            {isEditingWa ? (
              <textarea
                value={activeWaText}
                onChange={(e) => setCustomWaText(e.target.value)}
                rows={16}
                aria-label="Edit teks laporan WhatsApp"
                className="w-full flex-1 p-4 text-xs font-mono leading-relaxed bg-slate-950 text-slate-100 focus:outline-none resize-y min-h-[340px]"
              />
            ) : (
              <pre className="p-4 text-xs font-mono leading-relaxed whitespace-pre-wrap text-slate-100 max-h-[420px] overflow-y-auto">
                {activeWaText}
              </pre>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

