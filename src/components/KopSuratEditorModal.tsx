import { useState, FormEvent } from 'react';
import { CheckCircle2, FileText, X } from 'lucide-react';
import { RosterOrgHeader } from '../types/polriRoster';

interface KopSuratEditorModalProps {
  header: RosterOrgHeader;
  onSaveHeader: (nextHeader: RosterOrgHeader) => void;
  onClose: () => void;
  onNotice: (msg: string) => void;
}

export function KopSuratEditorModal({
  header,
  onSaveHeader,
  onClose,
  onNotice,
}: KopSuratEditorModalProps) {
  const [line1, setLine1] = useState(header.line1);
  const [line2, setLine2] = useState(header.line2);
  const [line3, setLine3] = useState(header.line3);
  const [signerTitle, setSignerTitle] = useState(header.signerTitle);
  const [signerName, setSignerName] = useState(header.signerName);
  const [signerRank, setSignerRank] = useState(header.signerRank);
  const [signerNrp, setSignerNrp] = useState(header.signerNrp);
  const [documentPrefix, setDocumentPrefix] = useState(header.documentPrefix);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const next: RosterOrgHeader = {
      line1: line1.trim(),
      line2: line2.trim(),
      line3: line3.trim(),
      signerTitle: signerTitle.trim(),
      signerName: signerName.trim(),
      signerRank: signerRank.trim(),
      signerNrp: signerNrp.trim(),
      documentPrefix: documentPrefix.trim(),
    };
    onSaveHeader(next);
    onNotice('Kop surat dan identitas pejabat penandatangan berhasil diperbarui.');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 print:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="kop-editor-title"
    >
      <div className="w-full max-w-xl max-h-[90vh] flex flex-col bg-white border border-slate-300 text-slate-900 rounded-xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-700" />
            <h2
              id="kop-editor-title"
              className="text-xs font-bold uppercase tracking-wider text-slate-800"
            >
              Editor Kop Surat &amp; Pejabat Penandatangan
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-500 hover:text-slate-900 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Kop Baris 1 (Instansi Induk)</label>
            <input
              type="text"
              required
              value={line1}
              onChange={(e) => setLine1(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 font-mono"
              placeholder="KEPOLISIAN NEGARA REPUBLIK INDONESIA"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Kop Baris 2 (Wilayah / Polda)</label>
            <input
              type="text"
              required
              value={line2}
              onChange={(e) => setLine2(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 font-mono"
              placeholder="DAERAH JAWA TENGAH"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Kop Baris 3 (Kesatuan / Resor / Sektor)</label>
            <input
              type="text"
              required
              value={line3}
              onChange={(e) => setLine3(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 font-mono"
              placeholder="RESOR KOTA BESAR SEMARANG SEKTOR SEMARANG SELATAN"
            />
          </div>

          <div className="border-t border-slate-200 pt-3 space-y-3">
            <div className="font-bold text-slate-800 uppercase tracking-wide text-[11px]">
              Pejabat Penandatangan Default (Kapolsek / Pimpinan)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Jabatan Pejabat (misal: KAPOLSEK)</label>
                <input
                  type="text"
                  required
                  value={signerTitle}
                  onChange={(e) => setSignerTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Pangkat Pejabat</label>
                <input
                  type="text"
                  required
                  value={signerRank}
                  onChange={(e) => setSignerRank(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                  placeholder="AJUN KOMISARIS POLISI"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Nama Pejabat &amp; Gelar</label>
                <input
                  type="text"
                  required
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                  placeholder="SUGIYANTO, S.H."
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">NRP Pejabat</label>
                <input
                  type="text"
                  required
                  value={signerNrp}
                  onChange={(e) => setSignerNrp(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 font-mono"
                  placeholder="75030211"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan Perubahan Kop Surat</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
