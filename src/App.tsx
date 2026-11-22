import { useEffect, useMemo, useState } from 'react';
import {
  Archive,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Download,
  FileText,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Printer,
  RotateCcw,
  ScrollText,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { AccountSettingsModal } from './components/AccountSettingsModal';
import { BackupRestoreView } from './components/BackupRestoreView';
import { BuatSprinView } from './components/BuatSprinView';
import { BuatSuratView } from './components/BuatSuratView';
import { DailyDutyView } from './components/DailyDutyView';
import { DaftarPersPamView } from './components/DaftarPersPamView';
import { DashboardHomeView } from './components/DashboardHomeView';
import { LoginView } from './components/LoginView';
import { MonthlyMatrixView } from './components/MonthlyMatrixView';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PersonnelManagerView } from './components/PersonnelManagerView';
import { PolriCrestSvg } from './components/PolriCrestSvg';
import { PrintExportView } from './components/PrintExportView';
import { PWAInstallButton } from './components/PWAInstallButton';
import { RengiatView } from './components/RengiatView';
import {
  DashboardUserSession,
  getActiveSession,
  logoutSession,
} from './utils/dashboardAuth';
import {
  DEFAULT_ORG_HEADER,
  DEFAULT_PAWAS_ANCHOR,
  INITIAL_PERSONNEL,
} from './data/polriOktober2026';
import {
  AppTab,
  PawasAnchor,
  Personnel,
  RosterBackupPayload,
  RosterOrgHeader,
  ShiftCode,
  ShiftOverrides,
  UnitKey,
} from './types/polriRoster';
import {
  buildMonthlyRosterCSV,
  DEFAULT_UNIT_ORDER,
  getDaysInMonth,
  getEffectivePersonnelForMonth,
  MONTH_NAMES_ID,
} from './utils/continuousRoster';

const STORAGE_KEY = 'kuat_pers_berkelanjutan_v5';

interface SavedAppState {
  header: RosterOrgHeader;
  personnel: Personnel[];
  unitOrder?: UnitKey[];
  pawasAnchor: PawasAnchor;
  overrides: ShiftOverrides;
  lastBackupAt?: string;
}

function loadSavedState(): SavedAppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SavedAppState;
      if (parsed && Array.isArray(parsed.personnel) && parsed.header) {
        return {
          ...parsed,
          unitOrder:
            Array.isArray(parsed.unitOrder) && parsed.unitOrder.length > 0
              ? parsed.unitOrder
              : DEFAULT_UNIT_ORDER,
          pawasAnchor: parsed.pawasAnchor ?? DEFAULT_PAWAS_ANCHOR,
        };
      }
    }
  } catch {
    // Abaikan error storage
  }
  return {
    header: DEFAULT_ORG_HEADER,
    personnel: INITIAL_PERSONNEL,
    unitOrder: DEFAULT_UNIT_ORDER,
    pawasAnchor: DEFAULT_PAWAS_ANCHOR,
    overrides: {},
  };
}

function getSemarangToday(): {
  year: number;
  monthIndex: number;
  day: number;
  dateKey: string;
} {
  try {
    const iso = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    const [y, m, d] = iso.split('-').map(Number);
    return {
      year: y || 2026,
      monthIndex: (m || 11) - 1,
      day: d || 14,
      dateKey: iso,
    };
  } catch {
    return { year: 2026, monthIndex: 10, day: 14, dateKey: '2026-11-14' };
  }
}

const NAV_TABS: { id: AppTab; label: string; icon: typeof CalendarDays }[] = [
  { id: 'dashboard', label: 'Beranda Dashboard', icon: LayoutDashboard },
  { id: 'matrix', label: 'Matriks Bulanan', icon: CalendarDays },
  { id: 'daily', label: 'Piket Harian', icon: Clock },
  { id: 'rengiat', label: 'Rengiat', icon: ClipboardList },
  { id: 'pam', label: 'Daftar Pers PAM', icon: UserCheck },
  { id: 'surat', label: 'Buat Surat', icon: FileText },
  { id: 'buat-sprin', label: 'Buat Sprin', icon: ScrollText },
  { id: 'personnel', label: 'Data Personel', icon: Users },
  { id: 'export', label: 'Cetak & Excel', icon: Printer },
  { id: 'backup', label: 'Backup & Restore', icon: Archive },
];

export default function App() {
  const initial = useMemo(() => loadSavedState(), []);
  const todayWib = useMemo(() => getSemarangToday(), []);

  const [header, setHeader] = useState<RosterOrgHeader>(initial.header);
  const [personnel, setPersonnel] = useState<Personnel[]>(initial.personnel);
  const [unitOrder, setUnitOrder] = useState<UnitKey[]>(
    initial.unitOrder ?? DEFAULT_UNIT_ORDER
  );
  const [pawasAnchor, setPawasAnchor] = useState<PawasAnchor>(
    initial.pawasAnchor
  );
  const [overrides, setOverrides] = useState<ShiftOverrides>(initial.overrides);
  const [lastBackupAt, setLastBackupAt] = useState<string | undefined>(
    initial.lastBackupAt
  );

  const [session, setSession] = useState<DashboardUserSession | null>(() =>
    getActiveSession()
  );
  const isAdmin = session?.role === 'admin';

  const [accountModalOpen, setAccountModalOpen] = useState(false);

  const [year, setYear] = useState<number>(todayWib.year);
  const [monthIndex, setMonthIndex] = useState<number>(todayWib.monthIndex);
  const [selectedDay, setSelectedDay] = useState<number>(todayWib.day);
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copiedRecently, setCopiedRecently] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);



  useEffect(() => {
    try {
      const payload: SavedAppState = {
        header,
        personnel,
        unitOrder,
        pawasAnchor,
        overrides,
        lastBackupAt,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Abaikan kuota penuh
    }
  }, [header, personnel, unitOrder, pawasAnchor, overrides, lastBackupAt]);



  useEffect(() => {
    if (!isAdmin && (activeTab === 'personnel' || activeTab === 'backup')) {
      setActiveTab('dashboard');
    }
  }, [isAdmin, activeTab]);

  const showNotice = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => {
      setNotice((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  const handleStepMonth = (delta: number) => {
    let nextMonth = monthIndex + delta;
    let nextYear = year;
    if (nextMonth < 0) {
      nextMonth = 11;
      nextYear -= 1;
    } else if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    }
    setYear(nextYear);
    setMonthIndex(nextMonth);
    const maxD = getDaysInMonth(nextYear, nextMonth);
    setSelectedDay((d) => Math.min(d, maxD));
  };

  const handleSetOverride = (
    personnelId: string,
    dateKey: string,
    code: ShiftCode | null
  ) => {
    if (!isAdmin) return;
    const key = `${personnelId}__${dateKey}`;
    setOverrides((prev) => {
      const next = { ...prev };
      if (code === null) {
        delete next[key];
      } else {
        next[key] = code;
      }
      return next;
    });
  };

  const handleClearMonthOverrides = () => {
    if (!isAdmin) return;
    const prefix = `${year}-${String(monthIndex + 1).padStart(2, '0')}-`;
    setOverrides((prev) => {
      const next: ShiftOverrides = {};
      for (const [k, v] of Object.entries(prev)) {
        if (!k.includes(`__${prefix}`)) {
          next[k] = v;
        }
      }
      return next;
    });
    showNotice(
      `Perubahan manual bulan ${MONTH_NAMES_ID[monthIndex]} ${year} dikembalikan ke rotasi otomatis.`
    );
  };

  const handleAddPersonnel = (person: Omit<Personnel, 'id'>) => {
    if (!isAdmin) return;
    const id = `pers_${Date.now().toString(36)}_${Math.random()
      .toString(36)
      .slice(2, 5)}`;
    const newPerson: Personnel = { ...person, id };
    setPersonnel((prev) => {
      let lastUnitIdx = -1;
      for (let i = prev.length - 1; i >= 0; i--) {
        if (prev[i].unit === person.unit) {
          lastUnitIdx = i;
          break;
        }
      }
      if (lastUnitIdx === -1) return [...prev, newPerson];
      const next = [...prev];
      next.splice(lastUnitIdx + 1, 0, newPerson);
      return next;
    });
    showNotice(`${person.name} ditambahkan ke unit ${person.unit}.`);
  };

  const handleBulkAddPersonnel = (items: Omit<Personnel, 'id'>[]) => {
    if (!isAdmin || items.length === 0) return;
    const baseTs = Date.now().toString(36);
    setPersonnel((prev) => {
      const next = [...prev];
      items.forEach((item, idx) => {
        const id = `pers_${baseTs}_${idx}_${Math.random()
          .toString(36)
          .slice(2, 5)}`;
        const newPerson: Personnel = { ...item, id };
        let lastUnitIdx = -1;
        for (let i = next.length - 1; i >= 0; i--) {
          if (next[i].unit === item.unit) {
            lastUnitIdx = i;
            break;
          }
        }
        if (lastUnitIdx === -1) {
          next.push(newPerson);
        } else {
          next.splice(lastUnitIdx + 1, 0, newPerson);
        }
      });
      return next;
    });
    showNotice(`${items.length} personel berhasil ditambahkan ke daftar.`);
  };

  const handleReplacePersonnel = (items: Omit<Personnel, 'id'>[]) => {
    if (!isAdmin || items.length === 0) return;
    const baseTs = Date.now().toString(36);
    const mapped: Personnel[] = items.map((item, idx) => ({
      ...item,
      id: `pers_${baseTs}_${idx}_${Math.random().toString(36).slice(2, 5)}`,
    }));
    setPersonnel(mapped);
    showNotice(
      `Daftar personel diperbarui dari impor (${mapped.length} personel).`
    );
  };

  const handleUpdatePersonnel = (id: string, patch: Partial<Personnel>) => {
    if (!isAdmin) return;
    setPersonnel((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
    );
  };

  const handleDeletePersonnel = (id: string) => {
    if (!isAdmin) return;
    setPersonnel((prev) => prev.filter((p) => p.id !== id));
    showNotice('Personel dihapus dari daftar.');
  };

  const handleMovePersonnel = (id: string, direction: 'up' | 'down') => {
    if (!isAdmin) return;
    setPersonnel((prev) => {
      const targetIdx = prev.findIndex((p) => p.id === id);
      if (targetIdx === -1) return prev;
      const unit = prev[targetIdx].unit;

      let neighborIdx = -1;
      if (direction === 'up') {
        for (let i = targetIdx - 1; i >= 0; i--) {
          if (prev[i].unit === unit) {
            neighborIdx = i;
            break;
          }
        }
      } else {
        for (let i = targetIdx + 1; i < prev.length; i++) {
          if (prev[i].unit === unit) {
            neighborIdx = i;
            break;
          }
        }
      }

      if (neighborIdx === -1) return prev;

      const next = [...prev];
      const a = next[targetIdx];
      const b = next[neighborIdx];
      next[targetIdx] = { ...b, unitNo: a.unitNo };
      next[neighborIdx] = { ...a, unitNo: b.unitNo };
      return next;
    });
  };

  const handleMoveUnit = (unitKey: UnitKey, direction: 'up' | 'down') => {
    if (!isAdmin) return;
    setUnitOrder((prev) => {
      const idx = prev.indexOf(unitKey);
      if (idx === -1) return prev;
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next;
    });
  };

  const handleResetUnitOrder = () => {
    if (!isAdmin) return;
    setUnitOrder(DEFAULT_UNIT_ORDER);
    showNotice('Urutan satuan/unit dikembalikan ke susunan standar.');
  };

  const handleResetToBaseline = () => {
    if (!isAdmin) return;
    setHeader(DEFAULT_ORG_HEADER);
    setPersonnel(INITIAL_PERSONNEL);
    setUnitOrder(DEFAULT_UNIT_ORDER);
    setPawasAnchor(DEFAULT_PAWAS_ANCHOR);
    setOverrides({});
    showNotice('Data personel dan perubahan terbaru telah dimuat ulang.');
  };

  const handleRestoreBackup = (data: RosterBackupPayload['data']) => {
    if (!isAdmin) return;
    setHeader(data.header);
    setPersonnel(data.personnel);
    setUnitOrder(
      data.unitOrder && data.unitOrder.length > 0
        ? data.unitOrder
        : DEFAULT_UNIT_ORDER
    );
    setPawasAnchor(data.pawasAnchor);
    setOverrides(data.overrides);
    showNotice(
      `Backup berhasil dipulihkan (${data.personnel.length} personel).`
    );
  };

  const handleCopyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedRecently(true);
      window.setTimeout(() => setCopiedRecently(false), 2400);
    } catch {
      showNotice('Gagal menyalin ke clipboard.');
    }
  };

  const handleDownloadCSV = () => {
    const monthPersonnel = getEffectivePersonnelForMonth(
      personnel,
      year,
      monthIndex
    );
    const csv = buildMonthlyRosterCSV(
      header,
      monthPersonnel,
      year,
      monthIndex,
      overrides,
      pawasAnchor,
      unitOrder
    );
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kuat-pers-${MONTH_NAMES_ID[monthIndex].toLowerCase()}-${year}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotice(
      `File CSV Kuat Pers ${MONTH_NAMES_ID[monthIndex]} ${year} berhasil diunduh.`
    );
  };

  const handleLogout = () => {
    logoutSession();
    setSession(null);
    setAccountModalOpen(false);
    setMobileMenuOpen(false);
    setActiveTab('dashboard');
  };

  if (!session) {
    return (
      <>
        <LoginView
          header={header}
          totalPersonnel={personnel.length}
          onLoginSuccess={(nextSession) => setSession(nextSession)}
        />
        <OfflineIndicator />
      </>
    );
  }

  const visibleNavTabs = isAdmin
    ? NAV_TABS
    : NAV_TABS.filter((tab) => tab.id !== 'personnel' && tab.id !== 'backup');

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-[#17130f] border-r border-[#2c241b] px-3.5 py-4 text-[#d6cec2]">
      <div className="space-y-5">
        <div className="flex items-center justify-between px-1.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <PolriCrestSvg className="w-7 h-7 shrink-0" />
            <span className="text-sm font-bold tracking-tight text-[#f3ede4] whitespace-nowrap truncate">
              Kuat Pers &amp; Piket
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 text-[#9b8f80] hover:text-[#f3ede4] rounded-md"
            aria-label="Tutup menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="space-y-1" aria-label="Menu utama">
          {visibleNavTabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[#272015] border-[#8d6b38] text-[#ecc478]'
                    : 'border-transparent text-[#a79c8e] hover:bg-[#211b14] hover:text-[#f3ede4]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

      </div>

      <div className="border-t border-[#2c241b] pt-4 space-y-3 px-1">
        <div className="space-y-1 text-xs text-[#9b8f80]">
          <div className="font-semibold text-[#f3ede4] truncate">
            {header.line3}
          </div>
          <div className="flex items-center justify-between">
            <span>Total Personel</span>
            <span className="font-mono tabular-nums font-medium text-[#dfb365]">
              {personnel.length}
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-[#32291d] bg-[#13100c] p-2.5 space-y-2">
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-1.5">
              <div className="text-xs font-semibold text-[#f3ede4] truncate">
                {session.displayName}
              </div>
              <span
                className={`px-1.5 py-0.5 text-[10px] font-bold rounded border shrink-0 ${
                  isAdmin
                    ? 'bg-[#2a2114] border-[#8d6b38] text-[#ecc478]'
                    : 'bg-sky-950/60 border-sky-700/60 text-sky-300'
                }`}
              >
                {isAdmin ? 'ADMIN' : 'USER'}
              </span>
            </div>
            <div className="text-[11px] text-[#9b8f80] truncate">
              @{session.username} · Mode Offline
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => {
                setAccountModalOpen(true);
                setMobileMenuOpen(false);
              }}
              className="inline-flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-medium text-[#e6dfd3] bg-[#1f1912] border border-[#3a2f20] hover:border-[#8d6b38] rounded-md transition-colors whitespace-nowrap"
            >
              <KeyRound className="w-3 h-3 shrink-0 text-[#dfb365]" />
              <span>{isAdmin ? 'Kelola Akun' : 'Akun'}</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-medium text-red-300 bg-[#1f1912] border border-[#3a2f20] hover:bg-red-950/60 hover:border-red-500/40 rounded-md transition-colors whitespace-nowrap"
            >
              <LogOut className="w-3 h-3 shrink-0" />
              <span>Keluar</span>
            </button>
          </div>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={handleResetToBaseline}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#b8aa97] bg-[#1d1812] border border-[#32291d] hover:border-[#6e542c] hover:text-[#f3ede4] rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Jadwal</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#12100d] text-[#f3ede4] print:bg-white print:text-slate-900">
      {/* Top Institutional Header Bar */}
      <header className="bg-[#1a1611] border-b border-[#2e261d] px-3 sm:px-5 py-2.5 print:hidden sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden inline-flex items-center justify-center p-1.5 rounded-lg border border-[#382e22] bg-[#211b14] text-[#dfb365] hover:bg-[#2a2217]"
              aria-label="Buka menu navigasi"
            >
              <Menu className="w-4 h-4" />
            </button>

            <PolriCrestSvg className="w-8 h-8 shrink-0" />

            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-bold uppercase tracking-wide text-[#f5efe6] truncate">
                KUAT PERS &amp; JADWAL PIKET
              </div>
              <div className="text-[11px] text-[#9b8f80] truncate">
                {NAV_TABS.find((t) => t.id === activeTab)?.label} ·{' '}
                <span className="font-mono tabular-nums text-[#cbb899]">
                  {personnel.length} Pers
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* Institutional Context Box matching top-right of Screenshot 2 */}
            <div className="hidden xl:block rounded-lg border border-[#3a2f20] bg-[#201a13] px-3 py-1 text-right">
              <div className="text-[11px] font-bold uppercase tracking-wide text-[#f3ede4] leading-tight">
                {header.line3} · {header.line2}
              </div>
              <div className="text-[10px] text-[#a79c8e] leading-tight">
                {session.displayName} · {isAdmin ? 'ADMIN' : 'USER'}
              </div>
            </div>

            {/* Month Navigator */}
            <div className="inline-flex items-center border border-[#382e22] rounded-lg bg-[#13100c] overflow-hidden">
              <button
                type="button"
                onClick={() => handleStepMonth(-1)}
                className="p-2 text-[#cbb899] hover:bg-[#241d15] hover:text-[#f5efe6] border-r border-[#382e22]"
                aria-label="Bulan sebelumnya"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <div className="px-2.5 py-1 text-xs font-semibold text-[#f3ede4] whitespace-nowrap min-w-[116px] text-center">
                {MONTH_NAMES_ID[monthIndex]} {year}
              </div>
              <button
                type="button"
                onClick={() => handleStepMonth(1)}
                className="p-2 text-[#cbb899] hover:bg-[#241d15] hover:text-[#f5efe6] border-l border-[#382e22]"
                aria-label="Bulan berikutnya"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <PWAInstallButton />

            <button
              type="button"
              onClick={handleDownloadCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#a6783e] hover:bg-[#b88647] rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Unduh Excel (.csv)</span>
              <span className="sm:hidden">CSV</span>
            </button>

            <button
              type="button"
              onClick={() => setAccountModalOpen(true)}
              title="Pengaturan Akun"
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium text-[#d6cec2] bg-[#201a13] border border-[#382e22] hover:border-[#8d6b38] hover:text-[#f0cf89] rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#dfb365]" />
              <span className="hidden md:inline">Akun</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              title="Keluar dari Dashboard"
              className="inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium text-[#d6cec2] bg-[#201a13] border border-[#382e22] hover:border-red-500/40 hover:text-red-300 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-60 shrink-0 print:hidden">
          <div className="sticky top-[57px] h-[calc(100vh-57px)]">
            {sidebarContent}
          </div>
        </aside>

        {/* Mobile/Tablet Left Icon Rail (Matching Screenshot 2) */}
        <aside
          aria-label="Navigasi cepat"
          className="lg:hidden w-12 sm:w-14 shrink-0 bg-[#17130f] border-r border-[#2c241b] flex flex-col items-center py-3 gap-2 print:hidden"
        >
          {visibleNavTabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                title={tab.label}
                aria-label={tab.label}
                className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-colors ${
                  active
                    ? 'bg-[#272015] border-[#8d6b38] text-[#ecc478]'
                    : 'border-transparent text-[#9b8f80] hover:bg-[#211b14] hover:text-[#f3ede4]'
                }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </aside>

        {/* Mobile Expanded Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden print:hidden flex">
            <div
              className="fixed inset-0 bg-black/65"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <div className="relative w-72 max-w-[85vw] h-full z-10">
              {sidebarContent}
            </div>
          </div>
        )}

        {/* Main Viewport */}
        <main className="flex-1 min-w-0 px-2 sm:px-5 lg:px-7 py-3.5 sm:py-5 print:p-0">
          <div className="max-w-[1440px] mx-auto space-y-4">
            {notice && (
              <div
                role="status"
                className="px-4 py-2.5 bg-[#241d12] border border-[#785c30] text-[#f3ede4] text-xs font-medium rounded-lg flex items-center justify-between print:hidden"
              >
                <span>{notice}</span>
                <button
                  type="button"
                  onClick={() => setNotice(null)}
                  className="text-[#dfb365] hover:text-white ml-4"
                >
                  Tutup
                </button>
              </div>
            )}

            {activeTab === 'dashboard' && (
              <DashboardHomeView
                session={session}
                header={header}
                personnel={personnel}
                pawasAnchor={pawasAnchor}
                overrides={overrides}
                todayWib={todayWib}
                lastBackupAt={lastBackupAt}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onInspectTodayDaily={() => {
                  setYear(todayWib.year);
                  setMonthIndex(todayWib.monthIndex);
                  setSelectedDay(todayWib.day);
                  setActiveTab('daily');
                }}
              />
            )}

            {activeTab === 'buat-sprin' && (
              <BuatSprinView
                mainPersonnel={personnel}
                todayDateKey={todayWib.dateKey}
                pawasAnchor={pawasAnchor}
                overrides={overrides}
              />
            )}

            {/* Existing Jadwal Piket views preserved completely unchanged inside a crisp paper surface */}
            {activeTab !== 'dashboard' && activeTab !== 'buat-sprin' && (
              <div className="bg-white text-slate-900 rounded-xl border border-[#2f271d] p-2.5 sm:p-5 print:border-0 print:p-0 print:rounded-none">
                {activeTab === 'matrix' && (
                  <MonthlyMatrixView
                    year={year}
                    monthIndex={monthIndex}
                    todayDateKey={todayWib.dateKey}
                    personnel={personnel}
                    unitOrder={unitOrder}
                    pawasAnchor={pawasAnchor}
                    overrides={overrides}
                    onSetOverride={handleSetOverride}
                    onClearMonthOverrides={handleClearMonthOverrides}
                    onInspectDay={(day) => {
                      setSelectedDay(day);
                      setActiveTab('daily');
                    }}
                    readOnly={!isAdmin}
                  />
                )}

                {activeTab === 'daily' && (
                  <DailyDutyView
                    header={header}
                    year={year}
                    monthIndex={monthIndex}
                    selectedDay={selectedDay}
                    onSelectDay={setSelectedDay}
                    personnel={personnel}
                    pawasAnchor={pawasAnchor}
                    overrides={overrides}
                    onCopyText={handleCopyText}
                    copiedRecently={copiedRecently}
                  />
                )}

                {activeTab === 'rengiat' && (
                  <RengiatView
                    header={header}
                    todayDateKey={todayWib.dateKey}
                    personnel={personnel}
                    pawasAnchor={pawasAnchor}
                    overrides={overrides}
                  />
                )}

                {activeTab === 'pam' && (
                  <DaftarPersPamView
                    header={header}
                    todayDateKey={todayWib.dateKey}
                    personnel={personnel}
                    unitOrder={unitOrder}
                    pawasAnchor={pawasAnchor}
                    overrides={overrides}
                  />
                )}

                {activeTab === 'surat' && (
                  <BuatSuratView
                    header={header}
                    onHeaderUpdated={(next) => setHeader(next)}
                    todayDateKey={todayWib.dateKey}
                    personnel={personnel}
                    pawasAnchor={pawasAnchor}
                    overrides={overrides}
                  />
                )}

                {activeTab === 'personnel' && isAdmin && (
                  <PersonnelManagerView
                    header={header}
                    personnel={personnel}
                    unitOrder={unitOrder}
                    pawasAnchor={pawasAnchor}
                    overrides={overrides}
                    lastBackupAt={lastBackupAt}
                    onUpdatePawasAnchor={(patch) =>
                      setPawasAnchor((prev) => ({ ...prev, ...patch }))
                    }
                    onAddPersonnel={handleAddPersonnel}
                    onBulkAddPersonnel={handleBulkAddPersonnel}
                    onReplacePersonnel={handleReplacePersonnel}
                    onUpdatePersonnel={handleUpdatePersonnel}
                    onDeletePersonnel={handleDeletePersonnel}
                    onMovePersonnel={handleMovePersonnel}
                    onMoveUnit={handleMoveUnit}
                    onResetUnitOrder={handleResetUnitOrder}
                    onMarkBackupDone={(ts) => {
                      setLastBackupAt(ts);
                      showNotice('Cadangan data (backup) berhasil dibuat.');
                    }}
                    onRestoreBackup={handleRestoreBackup}
                    onResetBaseline={handleResetToBaseline}
                  />
                )}

                {activeTab === 'export' && (
                  <PrintExportView
                    header={header}
                    onUpdateHeader={(patch) => {
                      if (!isAdmin) return;
                      setHeader((prev) => ({ ...prev, ...patch }));
                    }}
                    year={year}
                    monthIndex={monthIndex}
                    personnel={personnel}
                    unitOrder={unitOrder}
                    pawasAnchor={pawasAnchor}
                    overrides={overrides}
                    onDownloadCSV={handleDownloadCSV}
                    readOnlyHeader={!isAdmin}
                  />
                )}

                {activeTab === 'backup' && isAdmin && (
                  <BackupRestoreView
                    header={header}
                    personnel={personnel}
                    unitOrder={unitOrder}
                    pawasAnchor={pawasAnchor}
                    overrides={overrides}
                    lastBackupAt={lastBackupAt}
                    onMarkBackupDone={(ts) => {
                      setLastBackupAt(ts);
                      showNotice('Cadangan data (backup) berhasil dibuat.');
                    }}
                    onRestoreBackup={handleRestoreBackup}
                    onResetBaseline={handleResetToBaseline}
                  />
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {accountModalOpen && (
        <AccountSettingsModal
          session={session}
          onSessionUpdated={(nextSession) => setSession(nextSession)}
          onClose={() => setAccountModalOpen(false)}
          onLogout={handleLogout}
          onNotice={showNotice}
        />
      )}
      <OfflineIndicator />
    </div>
  );
}
