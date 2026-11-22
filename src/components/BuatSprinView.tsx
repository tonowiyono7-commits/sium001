import { useEffect, useMemo, useState } from 'react';
import {
  Archive,
  CheckCircle2,
  Eye,
  FileDown,
  FilePlus2,
  FileText,
  Printer,
  RotateCcw,
  Save,
  Stamp,
  Users,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { DEFAULT_PAWAS_ANCHOR } from '../data/polriOktober2026';
import { PawasAnchor, Personnel, ShiftOverrides } from '../types/polriRoster';
import {
  AppView,
  LetterPreviewPage,
  PersonnelRow,
  SprinDocument,
} from '../types/buatSprin';
import {
  DEFAULT_SPRIN_DOCUMENT,
  DEFAULT_STAMP_CONFIG,
  INITIAL_ARCHIVE_DOCUMENTS,
  INITIAL_PERSONNEL_ROSTER,
  mergePersonnelByNrp,
} from '../data/buatSprinDefaultData';
import { exportSprinToWord } from '../utils/buatSprinExportDoc';
import { ArchiveView } from './buat-sprin/ArchiveView';
import { LetterPageOne } from './buat-sprin/LetterPageOne';
import { LetterPageTwo } from './buat-sprin/LetterPageTwo';
import { PersonnelRosterView } from './buat-sprin/PersonnelRosterView';
import { QuickWinsEmblem } from './buat-sprin/PolriEmblems';
import { EditorSectionId, SprinEditorForm } from './buat-sprin/SprinEditorForm';

const STORAGE_KEYS = {
  ACTIVE_DOC: 'siprin_active_doc_v2',
  ARCHIVE: 'siprin_archive_docs_v2',
  ROSTER: 'siprin_roster_v3',
  LEGACY_ROSTER_V2: 'siprin_roster_v2',
};

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function normalizeDoc(doc: SprinDocument): SprinDocument {
  return {
    ...DEFAULT_SPRIN_DOCUMENT,
    ...doc,
    useLampiran: doc.useLampiran ?? false,
    stampConfig: {
      ...DEFAULT_STAMP_CONFIG,
      ...(doc.stampConfig || {}),
    },
  };
}

interface BuatSprinViewProps {
  mainPersonnel?: Personnel[];
  todayDateKey?: string;
  pawasAnchor?: PawasAnchor;
  overrides?: ShiftOverrides;
}

export function BuatSprinView({
  mainPersonnel = [],
  todayDateKey = '2026-11-18',
  pawasAnchor = DEFAULT_PAWAS_ANCHOR,
  overrides = {},
}: BuatSprinViewProps) {
  const [activeView, setActiveView] = useState<AppView>('editor');
  const [activeSection, setActiveSection] = useState<EditorSectionId>('hal1');
  const [previewPage, setPreviewPage] = useState<LetterPreviewPage>('both');
  const [zoom, setZoom] = useState<number>(0.7);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [activeDoc, setActiveDoc] = useState<SprinDocument>(() =>
    normalizeDoc(readStorage<SprinDocument>(STORAGE_KEYS.ACTIVE_DOC, DEFAULT_SPRIN_DOCUMENT))
  );
  const [archiveDocs, setArchiveDocs] = useState<SprinDocument[]>(() =>
    readStorage<SprinDocument[]>(STORAGE_KEYS.ARCHIVE, INITIAL_ARCHIVE_DOCUMENTS).map(normalizeDoc)
  );
  const [roster, setRoster] = useState<PersonnelRow[]>(() => {
    const storedV3 = readStorage<PersonnelRow[] | null>(STORAGE_KEYS.ROSTER, null);
    if (storedV3 && storedV3.length > 0) return storedV3;
    const legacyV2 = readStorage<PersonnelRow[]>(STORAGE_KEYS.LEGACY_ROSTER_V2, []);
    return mergePersonnelByNrp(legacyV2, INITIAL_PERSONNEL_ROSTER);
  });

  // Activate scoped A4 portrait print mode while BuatSprinView is mounted
  useEffect(() => {
    document.body.setAttribute('data-print-mode', 'sprin-a4');
    return () => {
      document.body.removeAttribute('data-print-mode');
    };
  }, []);

  // Sync state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_DOC, JSON.stringify(activeDoc));
    } catch {
      // ignore storage quota error
    }
  }, [activeDoc]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ARCHIVE, JSON.stringify(archiveDocs));
    } catch {
      // ignore
    }
  }, [archiveDocs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ROSTER, JSON.stringify(roster));
    } catch {
      // ignore
    }
  }, [roster]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  const completionPercent = useMemo(() => {
    const checks = [
      Boolean(activeDoc.kopLine1.trim()),
      Boolean(activeDoc.kopLine2.trim()),
      Boolean(activeDoc.nomorSprin.trim()),
      Boolean(activeDoc.pertimbangan.trim()),
      activeDoc.dasarList.length > 0,
      activeDoc.untukList.length > 0,
      activeDoc.personelList.length > 0,
      Boolean(activeDoc.pejabatNama.trim()),
    ];
    const done = checks.filter(Boolean).length;
    return Math.round((done / checks.length) * 100);
  }, [activeDoc]);

  const handleSaveToArchive = () => {
    const stampedDoc: SprinDocument = {
      ...activeDoc,
      updatedAt: new Date().toISOString(),
    };
    setArchiveDocs((prev) => {
      const idx = prev.findIndex((d) => d.id === stampedDoc.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = stampedDoc;
        return next;
      }
      return [stampedDoc, ...prev];
    });
    showToast(`Surat ${stampedDoc.nomorSprin} disimpan ke arsip`);
  };

  const handleCreateNewSprin = () => {
    const nextNum = 1489 + archiveDocs.length;
    const blankDoc: SprinDocument = {
      ...DEFAULT_SPRIN_DOCUMENT,
      id: `sprin-${Date.now()}`,
      status: 'Draft',
      useLampiran: false,
      updatedAt: new Date().toISOString(),
      nomorSprin: `Sprin/ ${nextNum} /XI/KEP./2026`,
      pertimbangan:
        'guna tertib administrasi khususnya dalam rangka pelaksanaan tugas di lingkungan kesatuan, dipandang perlu mengeluarkan surat perintah.',
      untukList: [
        'melaksanakan tugas sesuai ploting dan arahan pimpinan;',
        'melaksanakan perintah ini dengan seksama dan penuh rasa tanggung jawab;',
        'surat perintah ini berlaku sejak dikeluarkan.',
      ],
      lampiranNomor: `SPRIN/ ${nextNum} /XI/KEP./2026`,
      personelList: [],
    };
    setActiveDoc(blankDoc);
    setActiveView('editor');
    setActiveSection('hal1');
    showToast(`Draft Surat Perintah baru (${nextNum}) siap diisi`);
  };

  const handleLoadReferenceTemplate = () => {
    setActiveDoc({
      ...DEFAULT_SPRIN_DOCUMENT,
      updatedAt: new Date().toISOString(),
    });
    setActiveView('editor');
    setActiveSection('hal1');
    showToast('Template Surat Perintah (Tanpa Lampiran) dimuat ulang');
  };

  const handleOpenFromArchive = (doc: SprinDocument) => {
    setActiveDoc({ ...doc });
    setActiveView('editor');
    showToast(`Membuka ${doc.nomorSprin}`);
  };

  const handleDuplicateArchive = (doc: SprinDocument) => {
    const copy: SprinDocument = {
      ...doc,
      id: `sprin-${Date.now()}`,
      status: 'Draft',
      nomorSprin: `${doc.nomorSprin} (Salinan)`,
      updatedAt: new Date().toISOString(),
    };
    setArchiveDocs((prev) => [copy, ...prev]);
    showToast('Surat berhasil diduplikasi ke arsip');
  };

  const handleDeleteArchive = (id: string) => {
    setArchiveDocs((prev) => prev.filter((d) => d.id !== id));
    showToast('Surat dihapus dari arsip');
  };

  const handleAddRosterPersonToActive = (person: PersonnelRow) => {
    const exists = activeDoc.personelList.some((p) => p.nrp === person.nrp && person.nrp !== '');
    if (exists) return;
    setActiveDoc((prev) => ({
      ...prev,
      personelList: [
        ...prev.personelList,
        { ...person, id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` },
      ],
      updatedAt: new Date().toISOString(),
    }));
    showToast(`${person.pangkat} ${person.nama} ditambahkan ke daftar personel`);
  };

  const handleSyncFromMainRoster = () => {
    if (mainPersonnel.length === 0) {
      showToast('Data Personel Piket kosong');
      return;
    }
    const incoming: PersonnelRow[] = mainPersonnel
      .filter((p) => p.nrp && p.nrp.trim() !== '')
      .map((p) => ({
        id: `pers-sync-${p.id}`,
        nama: p.name.toUpperCase(),
        pangkat: p.pangkat.toUpperCase(),
        nrp: p.nrp.trim(),
        jabatan: p.jabatan.toUpperCase(),
        ket: '',
      }));
    const merged = mergePersonnelByNrp(roster, incoming);
    setRoster(merged);
    showToast(`Berhasil menyinkronkan ${incoming.length} personel dari Jadwal Piket`);
  };

  const handleFocusFromLetter = (section: EditorSectionId) => {
    setActiveSection(section);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Override @page to exact A4 portrait while BuatSprinView is active */}
      <style media="print">{`@page { size: 210mm 297mm; margin: 0; }`}</style>

      {/* SCREEN WORKSPACE (Hidden during print) */}
      <div className="no-print flex flex-col bg-[#14100C] text-[#F5F0E6] rounded-xl border border-[#3A3024] overflow-hidden">
        {/* SIPRIN Workspace Header & Action Bar */}
        <div className="bg-[#1B150F] border-b border-[#3A3024]">
          <div className="px-4 lg:px-5 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <QuickWinsEmblem className="w-9 h-10 shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-display text-base lg:text-lg font-bold tracking-wide text-[#F7F2E8] leading-tight uppercase">
                    BUAT SPRIN (SIPRIN A4)
                  </h2>
                  <span className="font-mono-num text-[11px] px-2 py-0.5 rounded bg-[#251E16] border border-[#3E3325] text-[#F4C94D]">
                    {activeDoc.nomorSprin || 'Draft'}
                  </span>
                </div>
                <p className="text-xs text-[#B5A894] truncate mt-0.5">
                  {activeDoc.useLampiran
                    ? 'Mode 2 Halaman A4 · Surat Perintah & Lampiran Personel'
                    : 'Mode 1 Halaman A4 · Tanpa Lampiran'}{' '}
                  · Kelengkapan {completionPercent}%
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={handleCreateNewSprin}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#4A3D2C] bg-[#241C14] hover:bg-[#2F251A] hover:border-[#D4A017]/60 text-xs font-semibold text-[#F5F0E6] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <FilePlus2 className="w-3.5 h-3.5 text-[#D4A017]" />
                <span>Sprin Baru</span>
              </button>
              <button
                type="button"
                onClick={handleLoadReferenceTemplate}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#4A3D2C] bg-[#241C14] hover:bg-[#2F251A] hover:border-[#D4A017]/60 text-xs font-medium text-[#C8BCA8] hover:text-[#F5F0E6] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                title="Muat ulang template referensi default"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#A89C89]" />
                <span className="hidden sm:inline">Reset Template</span>
              </button>
              <button
                type="button"
                onClick={handleSaveToArchive}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#4A3D2C] bg-[#241C14] hover:bg-[#2F251A] hover:border-[#D4A017]/60 text-xs font-semibold text-[#F5F0E6] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 text-[#D4A017]" />
                <span>Simpan Arsip</span>
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await exportSprinToWord(activeDoc);
                    showToast('File .DOCX (A4 · Arial 12pt) diunduh');
                  } catch {
                    showToast('Gagal mengekspor dokumen Word');
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#4A3D2C] bg-[#241C14] hover:bg-[#2F251A] hover:border-[#D4A017]/60 text-xs font-semibold text-[#F5F0E6] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <FileDown className="w-3.5 h-3.5 text-[#D4A017]" />
                <span>Unduh .DOCX</span>
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#D4A017] hover:bg-[#E5B022] text-xs font-bold text-[#14100C] transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak / PDF</span>
              </button>
            </div>
          </div>

          {/* Sub-Navigation Tabs */}
          <div className="px-4 lg:px-5 pb-2.5 flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setActiveView('editor');
                if (activeSection === 'ttd') setActiveSection('hal1');
              }}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                activeView === 'editor' && activeSection !== 'ttd'
                  ? 'bg-[#D4A017]/15 text-[#F4C94D] border border-[#D4A017]/40'
                  : 'text-[#C8BCA8] hover:bg-[#241D15] hover:text-[#F5F0E6] border border-[#32291E]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Editor &amp; Pratinjau</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('arsip')}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                activeView === 'arsip'
                  ? 'bg-[#D4A017]/15 text-[#F4C94D] border border-[#D4A017]/40'
                  : 'text-[#C8BCA8] hover:bg-[#241D15] hover:text-[#F5F0E6] border border-[#32291E]'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Arsip Sprin</span>
              <span className="font-mono-num text-[11px] text-[#9E907A]">{archiveDocs.length}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('personel')}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                activeView === 'personel'
                  ? 'bg-[#D4A017]/15 text-[#F4C94D] border border-[#D4A017]/40'
                  : 'text-[#C8BCA8] hover:bg-[#241D15] hover:text-[#F5F0E6] border border-[#32291E]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Database Personel</span>
              <span className="font-mono-num text-[11px] text-[#9E907A]">{roster.length}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveView('editor');
                setActiveSection('ttd');
              }}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                activeView === 'editor' && activeSection === 'ttd'
                  ? 'bg-[#D4A017]/15 text-[#F4C94D] border border-[#D4A017]/40'
                  : 'text-[#C8BCA8] hover:bg-[#241D15] hover:text-[#F5F0E6] border border-[#32291E]'
              }`}
            >
              <Stamp className="w-3.5 h-3.5" />
              <span>Import TTD &amp; Stempel</span>
            </button>
          </div>

          {/* Gold Completion Accent Bar */}
          <div className="h-[3px] w-full bg-[#2E251B]">
            <div
              className="h-full bg-[#D4A017] transition-all duration-300"
              style={{ width: `${Math.max(12, Math.min(100, completionPercent))}%` }}
            />
          </div>
        </div>

        {/* Main Workspace Body */}
        <div className="flex-1 min-w-0">
          {activeView === 'editor' && (
            <div className="flex flex-col xl:flex-row min-h-[760px]">
              {/* Left Editor Column */}
              <div className="w-full xl:w-[48%] 2xl:w-[46%] border-b xl:border-b-0 xl:border-r border-[#32291E] bg-[#16120D]">
                <SprinEditorForm
                  doc={activeDoc}
                  onChange={setActiveDoc}
                  roster={roster}
                  mainPersonnel={mainPersonnel}
                  todayDateKey={todayDateKey}
                  pawasAnchor={pawasAnchor}
                  overrides={overrides}
                  onNotice={showToast}
                  activeSection={activeSection}
                  onChangeSection={setActiveSection}
                />
              </div>

              {/* Right Live Paper Preview Column */}
              <div className="flex-1 bg-[#0E0B08] flex flex-col min-w-0">
                {/* Preview Control Bar */}
                <div className="px-4 lg:px-5 py-3 border-b border-[#2C241B] bg-[#16120D] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-[#C8BCA8]">
                    <Eye className="w-4 h-4 text-[#D4A017]" />
                    <span className="font-semibold text-[#F5F0E6]">Pratinjau Cetak A4</span>
                    <span className="text-[#8C7E69] hidden sm:inline">
                      · Klik area surat untuk langsung mengedit
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {activeDoc.useLampiran ? (
                      <div className="flex items-center gap-1 p-1 rounded-lg bg-[#110D09] border border-[#32291E]">
                        {(
                          [
                            { id: 'both', label: 'Semua (2 Hal)' },
                            { id: 'page1', label: 'Halaman 1' },
                            { id: 'page2', label: 'Halaman 2' },
                          ] as const
                        ).map((tab) => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setPreviewPage(tab.id)}
                            className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                              previewPage === tab.id
                                ? 'bg-[#D4A017] text-[#14100C]'
                                : 'text-[#A89C89] hover:text-[#F5F0E6]'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg bg-[#110D09] border border-[#32291E] text-xs font-semibold text-[#D4A017]">
                        1 Halaman · Tanpa Lampiran
                      </span>
                    )}

                    {/* Zoom Controls */}
                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#110D09] border border-[#32291E]">
                      <button
                        type="button"
                        aria-label="Perkecil pratinjau"
                        onClick={() => setZoom((z) => Math.max(0.45, +(z - 0.1).toFixed(2)))}
                        className="p-1 text-[#A89C89] hover:text-[#F5F0E6] cursor-pointer"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-mono-num text-xs text-[#F5F0E6] w-11 text-center">
                        {Math.round(zoom * 100)}%
                      </span>
                      <button
                        type="button"
                        aria-label="Perbesar pratinjau"
                        onClick={() => setZoom((z) => Math.min(1.1, +(z + 0.1).toFixed(2)))}
                        className="p-1 text-[#A89C89] hover:text-[#F5F0E6] cursor-pointer"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* A4 Paper Scroll Canvas */}
                <div className="flex-1 overflow-auto p-4 lg:p-6 flex flex-col items-center gap-8">
                  {(!activeDoc.useLampiran ||
                    previewPage === 'both' ||
                    previewPage === 'page1') && (
                    <div className="flex flex-col items-center">
                      <div className="w-full flex items-center justify-between text-xs text-[#9E907A] mb-2 px-1">
                        <span>
                          {activeDoc.useLampiran
                            ? 'Halaman 1 — Surat Perintah'
                            : 'Surat Perintah (1 Halaman — Tanpa Lampiran)'}
                        </span>
                        <span className="font-mono-num">A4 · 210 × 297 mm</span>
                      </div>
                      <div
                        style={{
                          width: `calc(210mm * ${zoom})`,
                          height: `calc(297mm * ${zoom})`,
                        }}
                        className="relative shrink-0"
                      >
                        <div
                          style={{
                            transform: `scale(${zoom})`,
                            transformOrigin: 'top left',
                          }}
                        >
                          <LetterPageOne
                            doc={activeDoc}
                            onFocusSection={handleFocusFromLetter}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeDoc.useLampiran &&
                    (previewPage === 'both' || previewPage === 'page2') && (
                      <div className="flex flex-col items-center">
                        <div className="w-full flex items-center justify-between text-xs text-[#9E907A] mb-2 px-1">
                          <span>Halaman 2 — Lampiran Daftar Personel</span>
                          <span className="font-mono-num">
                            {activeDoc.personelList.length} Personel
                          </span>
                        </div>
                        <div
                          style={{
                            width: `calc(210mm * ${zoom})`,
                            height: `calc(297mm * ${zoom})`,
                          }}
                          className="relative shrink-0"
                        >
                          <div
                            style={{
                              transform: `scale(${zoom})`,
                              transformOrigin: 'top left',
                            }}
                          >
                            <LetterPageTwo
                              doc={activeDoc}
                              onFocusSection={handleFocusFromLetter}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                </div>
              </div>
            </div>
          )}

          {activeView === 'arsip' && (
            <ArchiveView
              documents={archiveDocs}
              activeDocId={activeDoc.id}
              onOpenInEditor={handleOpenFromArchive}
              onDuplicate={handleDuplicateArchive}
              onDelete={handleDeleteArchive}
              onCreateNew={handleCreateNewSprin}
            />
          )}

          {activeView === 'personel' && (
            <PersonnelRosterView
              roster={roster}
              onChangeRoster={setRoster}
              onAddToActiveSprin={handleAddRosterPersonToActive}
              activeSprinNrps={activeDoc.personelList.map((p) => p.nrp)}
              onSyncMainRoster={handleSyncFromMainRoster}
            />
          )}
        </div>

        {/* Floating Quick Print Button on Mobile */}
        <button
          type="button"
          onClick={handlePrint}
          aria-label="Cetak Surat Perintah"
          className="fixed bottom-5 right-5 sm:hidden z-40 w-12 h-12 rounded-full bg-[#D4A017] text-[#14100C] shadow-xl flex items-center justify-center cursor-pointer"
        >
          <Printer className="w-5 h-5" />
        </button>

        {/* Non-blocking Toast */}
        {toastMessage && (
          <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-[#251E16] border border-[#D4A017]/60 text-xs font-medium text-[#F5F0E6] shadow-2xl">
            <CheckCircle2 className="w-4 h-4 text-[#D4A017] shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>

      {/* DEDICATED PRINT-ONLY CONTAINER (Renders Page 1, and optional Page 2 only when useLampiran is enabled) */}
      <div className="hidden print-only-container">
        <LetterPageOne doc={activeDoc} />
        {activeDoc.useLampiran && <LetterPageTwo doc={activeDoc} />}
      </div>
    </>
  );
}
