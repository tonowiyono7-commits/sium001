import React, { useMemo, useState } from 'react';
import { Copy, FileText, Plus, Search, Trash2 } from 'lucide-react';
import { SprinDocument } from '../../types/buatSprin';

interface ArchiveViewProps {
  documents: SprinDocument[];
  activeDocId: string;
  onOpenInEditor: (doc: SprinDocument) => void;
  onDuplicate: (doc: SprinDocument) => void;
  onDelete: (id: string) => void;
  onCreateNew: () => void;
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({
  documents,
  activeDocId,
  onOpenInEditor,
  onDuplicate,
  onDelete,
  onCreateNew,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Semua' | SprinDocument['status']>('Semua');

  const filteredDocs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return documents.filter((d) => {
      const matchesStatus = statusFilter === 'Semua' || d.status === statusFilter;
      const matchesQuery =
        !q ||
        d.nomorSprin.toLowerCase().includes(q) ||
        d.pertimbangan.toLowerCase().includes(q) ||
        d.lampiranJudul.toLowerCase().includes(q) ||
        d.pelaporNamaPangkat.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [documents, search, statusFilter]);

  const totalPersonelAssignments = documents.reduce(
    (acc, d) => acc + d.personelList.length,
    0
  );
  const readyCount = documents.filter(
    (d) => d.status === 'Siap Cetak' || d.status === 'Terbit'
  ).length;

  return (
    <div className="p-5 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-wide text-[#F7F2E8] uppercase">
            ARSIP SURAT PERINTAH
          </h2>
          <p className="text-sm text-[#A89C89] mt-0.5">
            Riwayat Surat Perintah dan Lampiran Personel yang tersimpan di perangkat ini.
          </p>
        </div>

        <button
          type="button"
          onClick={onCreateNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#D4A017] hover:bg-[#E5B022] text-xs font-bold text-[#14100C] transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Sprin Baru</span>
        </button>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl bg-[#1E1812] border border-[#3A3024] p-4">
          <div className="text-xs text-[#9E907A]">Total Arsip Sprin</div>
          <div className="font-mono-num text-2xl font-bold text-[#F5F0E6] mt-1">
            {documents.length}
          </div>
        </div>
        <div className="rounded-xl bg-[#1E1812] border border-[#3A3024] p-4">
          <div className="text-xs text-[#9E907A]">Siap Cetak & Terbit</div>
          <div className="font-mono-num text-2xl font-bold text-[#D4A017] mt-1">
            {readyCount}
          </div>
        </div>
        <div className="rounded-xl bg-[#1E1812] border border-[#3A3024] p-4">
          <div className="text-xs text-[#9E907A]">Total Penugasan Personel</div>
          <div className="font-mono-num text-2xl font-bold text-[#F5F0E6] mt-1">
            {totalPersonelAssignments}
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-[#8C7E69] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nomor Sprin, kegiatan, atau pelapor..."
            className="w-full rounded-lg bg-[#1E1812] border border-[#3A3024] focus:border-[#D4A017] focus:outline-none pl-10 pr-4 py-2 text-sm text-[#F5F0E6]"
          />
        </div>

        <div className="flex items-center gap-1 p-1 rounded-lg bg-[#1E1812] border border-[#3A3024]">
          {(['Semua', 'Draft', 'Siap Cetak', 'Terbit'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === status
                  ? 'bg-[#D4A017] text-[#14100C]'
                  : 'text-[#B5A894] hover:text-[#F5F0E6]'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-xl bg-[#1E1812] border border-[#3A3024] overflow-hidden">
        {filteredDocs.length === 0 ? (
          <div className="py-14 px-6 text-center space-y-3">
            <FileText className="w-8 h-8 text-[#6E5F4C] mx-auto" />
            <div className="text-sm font-semibold text-[#F5F0E6]">
              Tidak ada Surat Perintah yang sesuai
            </div>
            <p className="text-xs text-[#9E907A] max-w-sm mx-auto">
              Ubah kata kunci pencarian atau buat dokumen Surat Perintah baru.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#3A3024] bg-[#18130E] text-[11px] font-semibold uppercase tracking-wider text-[#9E907A]">
                  <th className="py-3 px-4">Nomor Surat</th>
                  <th className="py-3 px-4">Perihal / Kegiatan</th>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4 text-right">Personel</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2E251B] text-sm">
                {filteredDocs.map((doc) => {
                  const isActive = doc.id === activeDocId;
                  return (
                    <tr
                      key={doc.id}
                      className={`transition-colors hover:bg-[#251E16] ${
                        isActive ? 'bg-[#D4A017]/5' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-mono-num text-xs font-semibold text-[#F4C94D] whitespace-nowrap">
                          {doc.nomorSprin}
                        </div>
                        <div className="text-[11px] text-[#9E907A] mt-0.5">
                          {doc.polsek || doc.polres}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 align-top max-w-md">
                        <div className="text-xs font-semibold text-[#F5F0E6] line-clamp-1">
                          {doc.useLampiran
                            ? doc.lampiranJudul
                            : `Kepada: ${
                                doc.personelList.length > 0
                                  ? doc.personelList
                                      .map((p) => `${p.pangkat} ${p.nama}`)
                                      .join(', ')
                                  : doc.kepadaText
                              }`}
                        </div>
                        <div className="text-xs text-[#A89C89] line-clamp-1 mt-0.5">
                          {doc.pertimbangan}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 align-top font-mono-num text-xs text-[#C8BCA8] whitespace-nowrap">
                        {doc.tanggalKegiatan}
                      </td>
                      <td className="py-3.5 px-4 align-top text-right font-mono-num text-xs font-semibold text-[#F5F0E6]">
                        {doc.personelList.length} pers
                      </td>
                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        <span
                          className={`text-xs font-semibold ${
                            doc.status === 'Terbit'
                              ? 'text-emerald-400'
                              : doc.status === 'Siap Cetak'
                                ? 'text-[#F4C94D]'
                                : 'text-[#A89C89]'
                          }`}
                        >
                          {doc.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onOpenInEditor(doc)}
                            className="px-3 py-1.5 rounded-md bg-[#2A2218] hover:bg-[#D4A017] hover:text-[#14100C] text-xs font-semibold text-[#F5F0E6] transition-colors cursor-pointer"
                          >
                            Buka
                          </button>
                          <button
                            type="button"
                            onClick={() => onDuplicate(doc)}
                            aria-label="Duplikat surat"
                            title="Duplikat surat"
                            className="p-1.5 rounded-md text-[#A89C89] hover:text-[#F5F0E6] hover:bg-[#2A2218] cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          {documents.length > 1 && (
                            <button
                              type="button"
                              onClick={() => onDelete(doc.id)}
                              aria-label="Hapus surat"
                              title="Hapus surat"
                              className="p-1.5 rounded-md text-[#A89C89] hover:text-red-400 hover:bg-[#2A2218] cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
