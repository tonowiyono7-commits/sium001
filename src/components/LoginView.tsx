import { FormEvent, useEffect, useState } from 'react';
import {
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LogIn,
  RotateCcw,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { RosterOrgHeader } from '../types/polriRoster';
import {
  DashboardUserSession,
  DEFAULT_LOGIN_PASSWORD,
  DEFAULT_LOGIN_USERNAME,
  isPrimaryAdminDefaultCredentials,
  quickLoginDefaultAdmin,
  resetPrimaryAdminToDefault,
  verifyLogin,
} from '../utils/dashboardAuth';
import { PolriCrestSvg } from './PolriCrestSvg';
import { PWAInstallButton } from './PWAInstallButton';

interface LoginViewProps {
  header: RosterOrgHeader;
  totalPersonnel: number;
  onLoginSuccess: (session: DashboardUserSession) => void;
}

export function LoginView({
  header,
  totalPersonnel,
  onLoginSuccess,
}: LoginViewProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [hasDefaultAdmin, setHasDefaultAdmin] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  useEffect(() => {
    let active = true;
    void isPrimaryAdminDefaultCredentials().then((isDef) => {
      if (active) {
        setHasDefaultAdmin(isDef);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setSubmitting(true);
    try {
      const result = await verifyLogin(username, password, remember);
      if (result.ok) {
        onLoginSuccess(result.session);
      } else {
        setError(result.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDefaultLogin = async () => {
    setError(null);
    setNotice(null);
    setSubmitting(true);
    try {
      const result = await quickLoginDefaultAdmin(remember);
      if (result.ok) {
        onLoginSuccess(result.session);
      } else {
        setError(result.error);
        setHasDefaultAdmin(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetCredentials = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await resetPrimaryAdminToDefault();
      setHasDefaultAdmin(true);
      setConfirmResetOpen(false);
      setUsername(DEFAULT_LOGIN_USERNAME);
      setPassword(DEFAULT_LOGIN_PASSWORD);
      setNotice(
        `Akses Admin Utama dikembalikan ke default (${DEFAULT_LOGIN_USERNAME} / ${DEFAULT_LOGIN_PASSWORD}). Data jadwal & surat tetap aman.`
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0a1529] text-white flex items-center justify-center p-4 sm:p-6">
      {/* Atmospheric Twilight & Ceremonial Backdrop (100% Offline Vector/CSS) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 22% 72%, rgba(168, 114, 58, 0.34) 0%, rgba(28, 49, 86, 0.72) 45%, rgba(9, 19, 39, 0.96) 100%)',
          }}
        />
        <svg
          viewBox="0 0 1200 800"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 h-full w-full opacity-40"
        >
          <rect
            x="132"
            y="70"
            width="8"
            height="730"
            fill="#cbd5e1"
            fillOpacity="0.45"
          />
          <circle cx="136" cy="64" r="10" fill="#d4a253" fillOpacity="0.8" />
          <path
            d="M140 90 C280 72, 410 122, 560 98 L560 228 C410 250, 280 200, 140 218 Z"
            fill="#991b1b"
            fillOpacity="0.72"
          />
          <path
            d="M140 218 C280 200, 410 250, 560 228 L560 356 C410 378, 280 328, 140 346 Z"
            fill="#e2e8f0"
            fillOpacity="0.58"
          />
          <rect
            x="640"
            y="390"
            width="560"
            height="410"
            fill="#1e2433"
            fillOpacity="0.65"
          />
          <rect
            x="620"
            y="368"
            width="600"
            height="24"
            fill="#3a2f24"
            fillOpacity="0.7"
          />
          <g fill="#fbbf24" fillOpacity="0.16">
            <rect x="690" y="430" width="44" height="58" rx="2" />
            <rect x="760" y="430" width="44" height="58" rx="2" />
            <rect x="830" y="430" width="44" height="58" rx="2" />
            <rect x="900" y="430" width="44" height="58" rx="2" />
            <rect x="970" y="430" width="44" height="58" rx="2" />
            <rect x="1040" y="430" width="44" height="58" rx="2" />
            <rect x="690" y="518" width="44" height="58" rx="2" />
            <rect x="760" y="518" width="44" height="58" rx="2" />
            <rect x="830" y="518" width="44" height="58" rx="2" />
            <rect x="900" y="518" width="44" height="58" rx="2" />
          </g>
        </svg>
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(8,15,31,0.35) 0%, rgba(8,15,31,0.55) 100%)',
          }}
        />
      </div>

      {/* Centered Translucent Dark Navy Glass Login Card */}
      <div className="relative z-10 w-full max-w-[430px] rounded-2xl border border-[#2a416b]/70 bg-[#0d1930]/90 backdrop-blur-md px-6 py-7 sm:px-8 sm:py-8 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <PolriCrestSvg className="w-20 h-20 drop-shadow" />

          <h1 className="mt-3 text-2xl sm:text-[26px] font-bold tracking-tight text-white">
            SEKSI UMUM
          </h1>

          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">
            {header.line3.replace(/\bSEKTOR\b/gi, 'POLSEK')}
          </p>

          <div className="my-4 h-[2px] w-10 rounded-full bg-[#c99645]" />

          <p className="max-w-[320px] text-xs leading-relaxed text-slate-300">
            Aplikasi <strong>100% Offline Mandiri</strong>. Masuk dengan akun
            lokal perangkat ini untuk mengelola jadwal piket, Rengiat, PAM, dan
            surat dinas tanpa internet.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2 rounded-lg border border-red-400/40 bg-red-950/70 px-3.5 py-2.5 text-xs text-red-200"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="mt-4 flex items-start gap-2 rounded-lg border border-amber-400/40 bg-amber-950/50 px-3.5 py-2.5 text-xs text-amber-100"
          >
            <KeyRound className="w-4 h-4 shrink-0 mt-0.5 text-[#e2b46b]" />
            <span>{notice}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
          <div className="space-y-1.5">
            <label
              htmlFor="offline-login-username"
              className="block text-xs font-medium text-slate-200"
            >
              Username Lokal
            </label>
            <input
              id="offline-login-username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Contoh: admin"
              className="w-full px-3.5 py-2.5 text-sm bg-[#081224] border border-[#2a416b] text-white placeholder:text-slate-500 rounded-lg focus:outline-none focus:border-[#c99645]"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="offline-login-password"
              className="block text-xs font-medium text-slate-200"
            >
              Kata Sandi
            </label>
            <div className="relative">
              <input
                id="offline-login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi"
                className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-[#081224] border border-[#2a416b] text-white placeholder:text-slate-500 rounded-lg focus:outline-none focus:border-[#c99645]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-white"
                aria-label={
                  showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'
                }
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-0.5">
            <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="rounded border-[#2a416b] bg-[#081224] text-[#a6783e]"
              />
              <span>Ingat sesi di perangkat ini</span>
            </label>

            {!hasDefaultAdmin && !confirmResetOpen && (
              <button
                type="button"
                onClick={() => setConfirmResetOpen(true)}
                className="text-[11px] font-medium text-[#e2b46b] hover:underline whitespace-nowrap"
              >
                Lupa sandi?
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#a6783e] hover:bg-[#b88647] disabled:opacity-60 px-4 py-2.5 text-sm font-semibold text-white transition-colors whitespace-nowrap shadow-lg"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            ) : (
              <LogIn className="w-4 h-4 shrink-0" />
            )}
            <span>{submitting ? 'Memeriksa...' : 'Masuk Dashboard'}</span>
          </button>
        </form>

        {hasDefaultAdmin && (
          <div className="mt-4 rounded-xl border border-[#785c30]/70 bg-[#1a1814]/85 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-[#f0cf89]">
                Kredensial Default Aktif
              </span>
              <span className="font-mono text-[11px] text-slate-300">
                {DEFAULT_LOGIN_USERNAME} / {DEFAULT_LOGIN_PASSWORD}
              </span>
            </div>
            <button
              type="button"
              disabled={submitting}
              onClick={handleQuickDefaultLogin}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-[#8d6b38] bg-[#2a2114] hover:bg-[#362a19] disabled:opacity-60 px-3.5 py-2 text-xs font-semibold text-[#f5d590] transition-colors whitespace-nowrap"
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Masuk Cepat (Admin Default)</span>
            </button>
          </div>
        )}

        {confirmResetOpen && (
          <div className="mt-4 rounded-xl border border-amber-400/40 bg-amber-950/40 p-3.5 space-y-2.5 text-xs text-amber-100">
            <p className="leading-relaxed">
              Kembalikan username &amp; sandi Admin Utama ke default (
              <span className="font-mono font-semibold text-white">
                {DEFAULT_LOGIN_USERNAME} / {DEFAULT_LOGIN_PASSWORD}
              </span>
              )? Seluruh data personel, jadwal, dan surat tetap aman.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmResetOpen(false)}
                className="px-3 py-1.5 rounded-md border border-[#315085] bg-[#0b172c] text-slate-200 hover:bg-[#132547]"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleResetCredentials}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-500 font-semibold text-white"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Sandi Admin</span>
              </button>
            </div>
          </div>
        )}

        <div className="mt-4 rounded-xl border border-[#233860] bg-[#091426]/80 p-3 space-y-1.5 text-[11px] text-slate-300">
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#e2b46b] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">Admin:</span> Akses
              penuh ubah personel, jadwal piket, backup &amp; akun lokal.
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Users className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">User:</span> Menu
              operasional (Harian, Rengiat, PAM, Buat Surat, Cetak) tanpa ubah
              jadwal induk.
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-center">
          <PWAInstallButton />
        </div>

        <div className="mt-3 text-center text-[11px] font-mono tabular-nums text-slate-400">
          Mode Offline Mandiri · {header.line2} · {totalPersonnel} Personel
        </div>
      </div>
    </div>
  );
}
