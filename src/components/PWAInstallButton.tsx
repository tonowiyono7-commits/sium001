import React, { useEffect, useState } from 'react';
import { ExternalLink, MonitorDown, Share, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [inIframe, setInIframe] = useState(false);

  useEffect(() => {
    try {
      setInIframe(window.self !== window.top);
    } catch {
      setInIframe(true);
    }
  }, []);

  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const ok = await install();
      if (!ok) {
        setShowGuide(true);
      }
      return;
    }
    setShowGuide(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          void handleClick();
        }}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#d6cec2] bg-[#201a13] border border-[#382e22] hover:border-[#8d6b38] hover:text-[#f0cf89] rounded-lg transition-colors whitespace-nowrap shrink-0 print:hidden"
        title="Pasang aplikasi SIUM ke HP atau Desktop agar bisa dibuka offline"
      >
        <MonitorDown className="w-3.5 h-3.5 text-[#dfb365]" />
        <span className="hidden sm:inline">Pasang SIUM</span>
        <span className="sm:hidden">Pasang SIUM</span>
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 print:hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-guide-title"
        >
          <div className="w-full max-w-md rounded-xl bg-[#191510] border border-[#3a2f20] text-[#f3ede4] p-5 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#dfb365] shrink-0" />
                <h3
                  id="pwa-install-guide-title"
                  className="text-sm font-bold uppercase tracking-wide text-[#dfb365]"
                >
                  Pasang SIUM ke HP / Perangkat
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="p-1 text-[#9b8f80] hover:text-white rounded-md"
                aria-label="Tutup panduan instalasi"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {inIframe && (
              <div className="rounded-lg border border-amber-500/40 bg-amber-950/40 p-3 text-xs text-amber-100 space-y-2">
                <p className="leading-relaxed">
                  Saat ini aplikasi sedang dibuka di dalam <strong>frame pratinjau</strong>.
                  Menu instalasi HP hanya muncul jika URL dibuka langsung di tab penuh browser
                  <strong> Chrome</strong> (Android) atau <strong>Safari</strong> (iPhone).
                </p>
                <a
                  href={window.location.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#a6783e] hover:bg-[#b88647] rounded-md transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka di Tab Browser Penuh</span>
                </a>
              </div>
            )}

            {isIOS ? (
              <div className="space-y-2 text-xs text-[#d6cec2]">
                <div className="font-semibold text-[#f3ede4]">
                  Langkah Pasang di iPhone / iPad (Safari):
                </div>
                <ol className="space-y-1.5 list-decimal list-inside leading-relaxed">
                  <li>
                    Pastikan membuka halaman ini lewat <strong>Safari</strong> (bukan Chrome/WhatsApp).
                  </li>
                  <li>
                    Ketuk ikon{' '}
                    <span className="inline-flex items-center gap-1 font-semibold text-white">
                      <Share className="w-3.5 h-3.5 text-sky-400" /> Bagikan
                    </span>{' '}
                    di bilah Safari.
                  </li>
                  <li>
                    Gulir ke bawah lalu pilih{' '}
                    <strong className="text-white">Tambah ke Layar Utama</strong> (Add to Home Screen), lalu pastikan namanya <strong>SIUM</strong>.
                  </li>
                </ol>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-[#d6cec2]">
                <div className="space-y-1.5">
                  <div className="font-semibold text-[#f3ede4]">
                    Android (Google Chrome / Edge):
                  </div>
                  <ol className="space-y-1 list-decimal list-inside leading-relaxed">
                    <li>
                      Buka URL aplikasi langsung di <strong>Chrome</strong> (bukan browser dalam WhatsApp/Telegram).
                    </li>
                    <li>
                      Ketuk ikon <strong>titik tiga (⋮)</strong> di pojok kanan atas Chrome.
                    </li>
                    <li>
                      Pilih <strong>Tambahkan ke layar utama</strong> → <strong>Instal</strong> (atau <strong>Buat pintasan</strong>).
                    </li>
                  </ol>
                </div>

                <div className="rounded-lg border border-[#2f271d] bg-[#13100c] p-3 text-[11px] text-[#b8aa97] leading-relaxed">
                  Catatan: Jika di menu Chrome belum muncul opsi <em>Instal aplikasi</em> pada URL preview sementara (<code>ais-pre-...</code>) karena proteksi login Google, lakukan <strong>Deploy / Publish</strong> aplikasi ke URL publik terlebih dahulu agar Chrome mengizinkan instalasi PWA penuh.
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="w-full rounded-lg bg-[#a6783e] hover:bg-[#b88647] py-2 text-xs font-semibold text-white transition-colors"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
};
