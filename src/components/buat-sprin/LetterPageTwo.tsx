import React from 'react';
import { SprinDocument } from '../../types/buatSprin';
import { PolsekStampAndSignature } from './PolriEmblems';

interface LetterPageTwoProps {
  doc: SprinDocument;
  onFocusSection?: (section: 'hal1' | 'hal2' | 'pengesahan' | 'ttd') => void;
}

export const LetterPageTwo: React.FC<LetterPageTwoProps> = ({ doc, onFocusSection }) => {
  return (
    <div
      className="letter-paper print-page-sheet relative mx-auto bg-white text-black shadow-2xl"
      style={{
        padding: '20mm 15mm 15mm 20mm',
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '12pt',
        lineHeight: '1.0',
      }}
    >
      {/* Top 2-Column Header (Left Kop + Right Lampiran Meta) */}
      <div
        className="flex justify-between items-start gap-6 mb-6 cursor-pointer hover:bg-amber-50/40 transition-colors rounded-sm"
        onClick={() => onFocusSection?.('hal2')}
        title="Klik untuk mengedit Header Lampiran"
      >
        {/* Left Kop */}
        <div className="inline-block text-center border-b border-black pb-0.5 leading-[1.0] text-[12pt]">
          <div>{doc.kopLine1}</div>
          <div>{doc.kopLine2}</div>
          <div>{doc.kopLine3}</div>
        </div>

        {/* Right Lampiran Metadata */}
        <div className="text-[12pt] leading-[1.0] min-w-[290px]">
          <div className="border-b border-black pb-0.5 tracking-[0.01em] whitespace-pre-wrap">
            {doc.lampiranHeaderTitle}
          </div>
          <div className="border-b border-black pb-0.5 flex">
            <span className="w-[90px] shrink-0">NOMOR</span>
            <span className="w-3 shrink-0">:</span>
            <span className="whitespace-pre-wrap">{doc.lampiranNomor}</span>
          </div>
          <div className="border-b border-black pb-0.5 flex">
            <span className="w-[90px] shrink-0">TANGGAL</span>
            <span className="w-3 shrink-0">:</span>
            <span className="whitespace-pre-wrap">{doc.lampiranTanggalUpper}</span>
          </div>
        </div>
      </div>

      {/* Centered Lampiran Title */}
      <div
        className="text-center mb-4 cursor-pointer hover:bg-amber-50/40 transition-colors rounded-sm py-1"
        onClick={() => onFocusSection?.('hal2')}
        title="Klik untuk mengedit Judul Daftar Personel"
      >
        <div className="uppercase text-[12pt] leading-[1.0]">{doc.lampiranJudul}</div>
        <div className="inline-block uppercase text-[12pt] leading-[1.0] border-b border-black px-3 pb-0.5 mt-0.5">
          {doc.lampiranSubjudul}
        </div>
      </div>

      {/* Personnel Table */}
      <div
        className="cursor-pointer"
        onClick={() => onFocusSection?.('hal2')}
        title="Klik untuk mengedit Daftar Personel"
      >
        <table className="w-full border-collapse border border-black text-[12pt] leading-[1.0]">
          <thead>
            <tr>
              <th className="border border-black px-1.5 py-1.5 font-normal text-center w-[38px]">
                NO
              </th>
              <th className="border border-black px-2 py-1.5 font-normal text-center">
                NAMA
              </th>
              <th className="border border-black px-2 py-1.5 font-normal text-center w-[94px]">
                PANGKAT
              </th>
              <th className="border border-black px-2 py-1.5 font-normal text-center w-[100px]">
                NRP
              </th>
              <th className="border border-black px-2 py-1.5 font-normal text-center w-[165px]">
                JABATAN
              </th>
              <th className="border border-black px-1.5 py-1.5 font-normal text-center w-[56px]">
                KET
              </th>
            </tr>
            {/* Numbered Sub-Header Row (1 - 6) matching Image 3 */}
            <tr className="text-[12pt]">
              <th className="border border-black px-1 py-0.5 font-normal text-center">1</th>
              <th className="border border-black px-1 py-0.5 font-normal text-center">2</th>
              <th className="border border-black px-1 py-0.5 font-normal text-center">3</th>
              <th className="border border-black px-1 py-0.5 font-normal text-center">4</th>
              <th className="border border-black px-1 py-0.5 font-normal text-center">5</th>
              <th className="border border-black px-1 py-0.5 font-normal text-center">6</th>
            </tr>
          </thead>
          <tbody>
            {doc.personelList.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="border border-black px-3 py-6 text-center text-neutral-500 italic"
                >
                  Belum ada personel ditambahkan pada lampiran surat perintah.
                </td>
              </tr>
            ) : (
              doc.personelList.map((person, index) => (
                <tr key={person.id}>
                  <td className="border border-black px-1.5 py-1 text-center align-middle tabular-nums">
                    {index + 1}
                  </td>
                  <td className="border border-black px-2 py-1 text-left align-middle uppercase">
                    {person.nama}
                  </td>
                  <td className="border border-black px-2 py-1 text-center align-middle uppercase">
                    {person.pangkat}
                  </td>
                  <td className="border border-black px-2 py-1 text-center align-middle tabular-nums">
                    {person.nrp}
                  </td>
                  <td className="border border-black px-2 py-1 text-center align-middle uppercase leading-[1.0]">
                    {person.jabatan}
                  </td>
                  <td className="border border-black px-1.5 py-1 text-center align-middle uppercase">
                    {person.ket}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Signature & Stamp Block (Right-Aligned Column) */}
      <div
        className="mt-5 flex justify-end cursor-pointer hover:bg-amber-50/40 transition-colors rounded-sm"
        onClick={() => onFocusSection?.('ttd')}
        title="Klik untuk mengatur Tanda Tangan & Stempel"
      >
        <div className="w-[385px] text-[12pt] leading-[1.0] relative">
          <div className="pl-12 space-y-0.5 relative z-10">
            <div className="flex">
              <span className="w-[120px] shrink-0">Dikeluarkan di</span>
              <span className="w-4 shrink-0">:</span>
              <span>{doc.dikeluarkanDi}</span>
            </div>
            <div className="inline-flex border-b border-black pb-0.5 pr-4">
              <span className="w-[120px] shrink-0">Pada tanggal</span>
              <span className="w-4 shrink-0">:</span>
              <span className="whitespace-pre-wrap">{doc.tanggalSuratHal2}</span>
            </div>
          </div>

          <div className="mt-1.5 text-center text-[12pt] leading-[1.0] whitespace-nowrap relative z-10">
            {doc.pejabatJabatan}
          </div>

          {/* Signature Height Reserve */}
          <div className="h-[76px]" />

          <div className="text-center leading-[1.0] relative z-10">
            <div className="inline-block border-b border-black px-2 pb-0.5 uppercase">
              {doc.pejabatNama}
            </div>
            <div className="uppercase mt-0.5 text-[12pt] leading-[1.0]">
              {doc.pejabatPangkatNrp}
            </div>
          </div>

          {/* Stamp & Signature Overlay (Default above text z-20, 4.7 cm stamp) */}
          {doc.showStampAndSignature && (
            <PolsekStampAndSignature
              resorText={doc.stampResorText}
              sektorText={doc.stampSektorText}
              config={doc.stampConfig}
            />
          )}
        </div>
      </div>
    </div>
  );
};
