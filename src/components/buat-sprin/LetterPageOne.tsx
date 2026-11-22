import React from 'react';
import { SprinDocument } from '../../types/buatSprin';
import { PolsekStampAndSignature, TribrataPrintEmblem } from './PolriEmblems';

interface LetterPageOneProps {
  doc: SprinDocument;
  onFocusSection?: (section: 'hal1' | 'hal2' | 'pengesahan' | 'ttd') => void;
}

export const LetterPageOne: React.FC<LetterPageOneProps> = ({ doc, onFocusSection }) => {
  const renderKepadaContent = () => {
    if (doc.useLampiran) {
      return <div className="flex-1 uppercase leading-[1.0]">{doc.kepadaText}</div>;
    }

    if (doc.personelList.length === 0) {
      return <div className="flex-1 uppercase leading-[1.0]">{doc.kepadaText}</div>;
    }

    if (doc.personelList.length === 1) {
      const p = doc.personelList[0];
      return (
        <div
          className="flex-1 uppercase leading-[1.0] cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onFocusSection?.('hal2');
          }}
          title="Klik untuk mengedit Personel Kepada"
        >
          <div className="inline-block border-b border-black pb-0.5">
            {[p.pangkat, p.nama, p.nrp ? `NRP ${p.nrp}` : ''].filter(Boolean).join(' ')}
          </div>
          {p.jabatan && <div className="mt-0.5">{p.jabatan}</div>}
          {p.ket && <div className="mt-0.5">{p.ket}</div>}
        </div>
      );
    }

    return (
      <div
        className="flex-1 space-y-2 uppercase leading-[1.0] cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          onFocusSection?.('hal2');
        }}
        title="Klik untuk mengedit Daftar Personel Kepada"
      >
        {doc.personelList.map((p, idx) => (
          <div key={p.id} className="flex items-start gap-2">
            <span className="w-5 shrink-0">{idx + 1}.</span>
            <div className="flex-1">
              <div className="inline-block border-b border-black pb-0.5">
                {[p.pangkat, p.nama, p.nrp ? `NRP ${p.nrp}` : ''].filter(Boolean).join(' ')}
              </div>
              {p.jabatan && <div className="mt-0.5">{p.jabatan}</div>}
              {p.ket && <div className="mt-0.5">{p.ket}</div>}
            </div>
          </div>
        ))}
      </div>
    );
  };

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
      {/* Top-Left Kop Surat */}
      <div
        className="mb-3 cursor-pointer hover:bg-amber-50/60 transition-colors rounded-sm"
        onClick={() => onFocusSection?.('hal1')}
        title="Klik untuk mengedit Kop & Surat Perintah"
      >
        <div className="inline-block text-center border-b border-black pb-0.5 leading-[1.0] text-[12pt] tracking-[0.01em]">
          <div>{doc.kopLine1}</div>
          <div>{doc.kopLine2}</div>
          <div>{doc.kopLine3}</div>
        </div>
      </div>

      {/* Center Tribrata & Judul Surat */}
      <div
        className="flex flex-col items-center text-center mb-4 cursor-pointer hover:bg-amber-50/40 transition-colors rounded-sm py-0.5"
        onClick={() => onFocusSection?.('hal1')}
        title="Klik untuk mengedit Nomor Surat"
      >
        <TribrataPrintEmblem className="w-[58px] h-[54px] mb-1" />
        <div className="text-[12pt] tracking-[0.02em] border-b border-black px-8 pb-0.5 leading-[1.0]">
          SURAT PERINTAH
        </div>
        <div className="text-[12pt] mt-0.5 leading-[1.0]">Nomor : {doc.nomorSprin}</div>
      </div>

      {/* Body Fields */}
      <div
        className="space-y-2.5 text-[12pt] leading-[1.0] cursor-pointer"
        onClick={() => onFocusSection?.('hal1')}
      >
        {/* Pertimbangan */}
        <div className="flex items-start">
          <div className="w-[120px] shrink-0">Pertimbangan</div>
          <div className="w-[20px] shrink-0 text-center">:</div>
          <div className="flex-1 text-justify leading-[1.0]">{doc.pertimbangan}</div>
        </div>

        {/* Dasar (tanpa nomor jika hanya 1 poin) */}
        <div className="flex items-start">
          <div className="w-[120px] shrink-0">Dasar</div>
          <div className="w-[20px] shrink-0 text-center">:</div>
          {doc.dasarList.length <= 1 ? (
            <div className="flex-1 text-justify leading-[1.0]">
              {doc.dasarList[0] || ''}
            </div>
          ) : (
            <div className="flex-1 space-y-1.5">
              {doc.dasarList.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-justify leading-[1.0]">
                  <span className="w-5 shrink-0">{idx + 1}.</span>
                  <span className="flex-1">{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* DIPERINTAHKAN */}
        <div className="text-center tracking-[0.03em] py-1.5 text-[12pt] leading-[1.0]">
          DIPERINTAHKAN
        </div>

        {/* Kepada */}
        <div className="flex items-start">
          <div className="w-[120px] shrink-0">Kepada</div>
          <div className="w-[20px] shrink-0 text-center">:</div>
          {renderKepadaContent()}
        </div>

        {/* Untuk */}
        <div className="flex items-start">
          <div className="w-[120px] shrink-0">Untuk</div>
          <div className="w-[20px] shrink-0 text-center">:</div>
          <div className="flex-1 space-y-2">
            {doc.untukList.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-justify leading-[1.0]">
                <span className="w-5 shrink-0">{idx + 1}.</span>
                <span className="flex-1">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Selesai */}
        <div className="pt-0.5">Selesai.</div>
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
              <span className="w-[120px] shrink-0">
                {doc.useLampiran ? 'Pada tanggal' : 'pada tanggal'}
              </span>
              <span className="w-4 shrink-0">:</span>
              <span className="whitespace-pre-wrap">{doc.tanggalSuratHal1}</span>
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

      {/* Tembusan */}
      <div
        className="mt-5 text-[12pt] leading-[1.0] cursor-pointer hover:bg-amber-50/40 transition-colors rounded-sm inline-block pr-4"
        onClick={() => onFocusSection?.('hal1')}
        title="Klik untuk mengedit Tembusan"
      >
        <div>Tembusan:</div>
        <div className="mt-1 space-y-0.5">
          {doc.tembusanList.map((item, idx) => (
            <div key={idx}>
              {idx + 1}. {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
