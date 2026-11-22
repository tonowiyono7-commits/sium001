import { Fragment } from 'react';
import { Download, Printer } from 'lucide-react';
import { SHIFT_LEGEND } from '../data/polriOktober2026';
import {
  PawasAnchor,
  Personnel,
  RosterOrgHeader,
  ShiftOverrides,
  UnitKey,
} from '../types/polriRoster';
import {
  formatDateKey,
  getDaysInMonth,
  getEffectivePersonnelForMonth,
  getEffectiveShift,
  getOrderedUnitMeta,
  isPersonPausedOnDate,
  MONTH_NAMES_ID,
} from '../utils/continuousRoster';

interface PrintExportViewProps {
  header: RosterOrgHeader;
  onUpdateHeader: (patch: Partial<RosterOrgHeader>) => void;
  year: number;
  monthIndex: number;
  personnel: Personnel[];
  unitOrder?: UnitKey[];
  pawasAnchor: PawasAnchor;
  overrides: ShiftOverrides;
  onDownloadCSV: () => void;
  readOnlyHeader?: boolean;
}

export function PrintExportView({
  header,
  onUpdateHeader,
  year,
  monthIndex,
  personnel,
  unitOrder,
  pawasAnchor,
  overrides,
  onDownloadCSV,
  readOnlyHeader = false,
}: PrintExportViewProps) {
  const daysInMonth = getDaysInMonth(year, monthIndex);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const monthName = MONTH_NAMES_ID[monthIndex];
  const monthPersonnel = getEffectivePersonnelForMonth(
    personnel,
    year,
    monthIndex
  );

  return (
    <div className="space-y-6">
      {/* Configuration & Print Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Cetak Lembar Kuat Pers & Ekspor Excel (CSV)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Format dokumen resmi siap cetak ukuran A4/F4 Landscape untuk{' '}
              <strong>
                {monthName} {year}
              </strong>{' '}
              (termasuk tanda stabilo merah).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onDownloadCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Excel (.csv)</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Simpan PDF</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="space-y-1">
            <label className="font-medium text-slate-600">Kop Baris 1</label>
            <input
              type="text"
              disabled={readOnlyHeader}
              value={header.line1}
              onChange={(e) => onUpdateHeader({ line1: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-200 disabled:bg-slate-50 disabled:text-slate-500 rounded-lg"
            />
          </div>
          <div className="space-y-1">
            <label className="font-medium text-slate-600">Kop Baris 2</label>
            <input
              type="text"
              disabled={readOnlyHeader}
              value={header.line2}
              onChange={(e) => onUpdateHeader({ line2: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-200 disabled:bg-slate-50 disabled:text-slate-500 rounded-lg"
            />
          </div>
          <div className="space-y-1">
            <label className="font-medium text-slate-600">Kop Baris 3</label>
            <input
              type="text"
              disabled={readOnlyHeader}
              value={header.line3}
              onChange={(e) => onUpdateHeader({ line3: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-200 disabled:bg-slate-50 disabled:text-slate-500 rounded-lg"
            />
          </div>
          <div className="space-y-1">
            <label className="font-medium text-slate-600">
              Pejabat Penandatangan
            </label>
            <input
              type="text"
              disabled={readOnlyHeader}
              value={header.signerName}
              onChange={(e) => onUpdateHeader({ signerName: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-200 disabled:bg-slate-50 disabled:text-slate-500 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Printable Official Matrix Sheet */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 print:border-0 print:p-0 print:rounded-none overflow-x-auto">
        <div className="min-w-[1050px] print:min-w-0 uppercase">
          <div className="text-[11px] font-semibold text-slate-900 leading-tight mb-2">
            <div>{header.line1.toUpperCase()}</div>
            <div>{header.line2.toUpperCase()}</div>
            <div className="underline">{header.line3.toUpperCase()}</div>
          </div>

          <div className="text-center font-bold text-xs tracking-wide text-slate-900 mb-3">
            {`${header.documentPrefix} ${monthName} ${year}`.toUpperCase()}
          </div>

          <table className="w-full border-collapse border border-slate-800 text-[9px] leading-tight">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-bold">
                <th className="border border-slate-800 px-1 py-1 text-center w-6">
                  NO
                </th>
                <th className="border border-slate-800 px-1.5 py-1 text-left">
                  NAMA
                </th>
                <th className="border border-slate-800 px-1 py-1 text-left">
                  PANGKAT
                </th>
                <th className="border border-slate-800 px-1 py-1 text-left">
                  NRP
                </th>
                <th className="border border-slate-800 px-1.5 py-1 text-left">
                  JABATAN
                </th>
                <th className="border border-slate-800 px-1 py-1 text-left">
                  KET
                </th>
                {days.map((d) => (
                  <th
                    key={d}
                    className="border border-slate-800 px-0.5 py-1 text-center font-mono tabular-nums w-5"
                  >
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {getOrderedUnitMeta(unitOrder).map((unit) => {
                const rows = monthPersonnel.filter((p) => p.unit === unit.key);
                if (rows.length === 0) return null;
                return (
                  <Fragment key={unit.key}>
                    {unit.headerLabel && (
                      <tr className="bg-slate-100">
                        <td
                          colSpan={6 + days.length}
                          className="border border-slate-800 px-1.5 py-0.5 font-bold text-slate-900"
                        >
                          {unit.headerLabel.toUpperCase()}
                        </td>
                      </tr>
                    )}
                    {rows.map((p) => {
                      const isRed = p.highlightColor === 'red';
                      const isYellow = p.highlightColor === 'yellow';
                      const rowBg = isRed
                        ? 'bg-red-100'
                        : isYellow
                        ? 'bg-yellow-100'
                        : '';
                      const nameBg = isRed
                        ? 'bg-red-300 text-red-950 font-bold'
                        : isYellow
                        ? 'bg-yellow-300 text-yellow-950 font-bold'
                        : 'font-medium';

                      return (
                        <tr key={p.id} className={rowBg}>
                          <td className="border border-slate-800 px-1 py-0.5 text-center font-mono tabular-nums">
                            {p.unitNo}
                          </td>
                          <td
                            className={`border border-slate-800 px-1.5 py-0.5 whitespace-nowrap ${nameBg}`}
                          >
                            {p.name.toUpperCase()}
                          </td>
                          <td className="border border-slate-800 px-1 py-0.5 whitespace-nowrap">
                            {p.pangkat.toUpperCase()}
                          </td>
                          <td className="border border-slate-800 px-1 py-0.5 font-mono tabular-nums whitespace-nowrap">
                            {p.nrp.toUpperCase()}
                          </td>
                          <td className="border border-slate-800 px-1.5 py-0.5 whitespace-nowrap">
                            {p.jabatan.toUpperCase()}
                          </td>
                          <td className="border border-slate-800 px-1 py-0.5 whitespace-nowrap">
                            {p.ket.toUpperCase()}
                          </td>
                          {days.map((d) => {
                            const dateKey = formatDateKey(year, monthIndex, d);
                            const { code } = getEffectiveShift(
                              p,
                              year,
                              monthIndex,
                              d,
                              overrides,
                              monthPersonnel,
                              pawasAnchor
                            );
                            const paused = isPersonPausedOnDate(p, dateKey);
                            return (
                              <td
                                key={d}
                                className={`border border-slate-800 px-0.5 py-0.5 text-center font-mono ${
                                  code === 'X' || code === 'P'
                                    ? 'font-bold'
                                    : ''
                                } ${paused && !code ? 'bg-red-100 text-red-500' : ''}`}
                              >
                                {code ? code.toUpperCase() : paused ? '-' : ''}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </Fragment>
                );
              })}
            </tbody>
          </table>

          {/* Bottom Legend & Signature */}
          <div className="mt-4 flex items-start justify-between gap-8 text-[10px]">
            <div className="border border-slate-800 p-2">
              <div className="font-bold mb-1">KETERANGAN</div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-0.5">
                {SHIFT_LEGEND.map((item) => (
                  <div key={item.code} className="flex gap-2">
                    <span className="font-mono font-bold w-14">
                      {item.code.toUpperCase()}
                    </span>
                    <span>= {item.label.toUpperCase()}</span>
                  </div>
                ))}
                <div className="flex gap-2">
                  <span className="font-mono font-bold w-14 bg-red-300 px-1">
                    MERAH
                  </span>
                  <span>= SEMENTARA TIDAK PIKET</span>
                </div>
              </div>
            </div>

            <div className="text-center min-w-[200px] pt-1">
              <div>
                {`SEMARANG, ${monthName} ${year}`.toUpperCase()}
              </div>
              <div className="font-semibold">{header.signerTitle.toUpperCase()}</div>
              <div className="h-14" />
              <div className="font-bold underline">{header.signerName.toUpperCase()}</div>
              <div>
                {`${header.signerRank} ${header.signerNrp}`.toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
