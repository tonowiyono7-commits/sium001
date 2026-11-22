import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  ISectionOptions,
  ImageRun,
  Packer,
  PageNumber,
  Paragraph,
  SectionType,
  Table,
  TableCell,
  TableRow,
  TabStopType,
  TextRun,
  UnderlineType,
  VerticalAlignTable,
  WidthType,
} from 'docx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  SuratBiasaData,
  SuratFontFamily,
  SuratPerintahData,
  SuratPersonRow,
} from '../types/polriRoster';
import {
  TajukTitleLine,
  buildTajukTitleLines,
  formatSprinInlineKepadaPerson,
} from './perkap2023Rules';

const TRIBRATA_LOGO_URL = '/assets/aistudio/Logo_Tri_Brata__1___1__7bf85ea6.png';

// ============================================================================
// KETENTUAN TEKNIS PERKAP NOMOR 1 TAHUN 2023 (PASAL 43, 51, 52, 54, 55)
// - Ukuran Kertas : A4 (210 mm x 297 mm)
// - Margin        : Atas 2 cm (2 baris di bawah kop), Kiri 3 cm, Bawah 3 cm (min 1,5 cm kata penyambung/klasifikasi), Kanan 1,5 cm
// - Huruf         : Arial atau Arial Narrow ukuran 12 pt (isi naskah), 9-10 pt (tabel lampiran padat)
// - Penomoran Hal : Angka Arab di tengah atas mulai halaman 2 (hal. 1 tanpa nomor)
// - Kata Penyambung: Kata pertama halaman berikutnya + titik 5x (.....) di sudut kanan bawah
// ============================================================================

const A4_WIDTH_TWIPS = 11906;
const A4_HEIGHT_TWIPS = 16838;
const A4_MARGIN = {
  top: 1134, // 2 cm (Pasal 54)
  right: 850, // 1,5 cm
  bottom: 1701, // 3 cm (Pasal 54)
  left: 1701, // 3 cm (Pasal 54)
  header: 567, // 1 cm dari tepi atas
  footer: 850, // 1,5 cm dari tepi bawah (minimal 1,5 cm untuk penyambung/klasifikasi)
};
const A4_CONTENT_WIDTH_TWIPS = A4_WIDTH_TWIPS - A4_MARGIN.left - A4_MARGIN.right; // 9355 twips (165 mm)

const PDF_MARGIN_LEFT = 30; // 3 cm
const PDF_MARGIN_RIGHT = 15; // 1,5 cm
const PDF_CONTENT_WIDTH_MM = 210 - PDF_MARGIN_LEFT - PDF_MARGIN_RIGHT; // 165 mm
const PDF_PAGE_START_Y = 20; // 2 cm dari tepi atas
const PDF_CONTINUATION_TOP_Y = 39; // 2 baris di bawah kop header lanjutan
const PDF_BOTTOM_LIMIT_Y = 267; // 297 mm - 30 mm (3 cm margin bawah)
const PDF_CONNECTOR_Y = 278; // 1,9 cm dari tepi bawah (>= 1,5 cm) untuk kata penyambung
const PDF_BOTTOM_CLASS_Y = 282; // 1,5 cm dari tepi bawah untuk klasifikasi keamanan

function toKapital(value?: string): string {
  return (value ?? '').toUpperCase();
}

function uppercasePersonRows(rows: SuratPersonRow[]): SuratPersonRow[] {
  return rows.map((row) => ({
    ...row,
    name: toKapital(row.name),
    pangkat: toKapital(row.pangkat),
    nrp: toKapital(row.nrp),
    jabatan: toKapital(row.jabatan),
    ket: toKapital(row.ket),
  }));
}

function uppercaseSprinData(data: SuratPerintahData): SuratPerintahData {
  return {
    ...data,
    kopLine1: toKapital(data.kopLine1),
    kopLine2: toKapital(data.kopLine2),
    kopLine3: toKapital(data.kopLine3),
    sprinContinuationHeaderLabel: data.sprinContinuationHeaderLabel
      ? toKapital(data.sprinContinuationHeaderLabel)
      : undefined,
    nomor: toKapital(data.nomor),
    pertimbangan: toKapital(data.pertimbangan),
    dasar: data.dasar.map(toKapital),
    kepadaText: toKapital(data.kepadaText),
    untuk: data.untuk.map(toKapital),
    issuedPlace: toKapital(data.issuedPlace),
    issuedDateText: toKapital(data.issuedDateText),
    signerSuperiorTitle: data.signerSuperiorTitle
      ? toKapital(data.signerSuperiorTitle)
      : undefined,
    signerMiddleTitle: data.signerMiddleTitle
      ? toKapital(data.signerMiddleTitle)
      : undefined,
    signerTitle: toKapital(data.signerTitle),
    signerName: toKapital(data.signerName),
    signerRankNrp: toKapital(data.signerRankNrp),
    tembusan: data.tembusan.map(toKapital),
    lampiranHeaderLabel: toKapital(data.lampiranHeaderLabel),
    lampiranDateUpper: toKapital(data.lampiranDateUpper),
    lampiranTitle: toKapital(data.lampiranTitle),
    lampiranSubtitle: toKapital(data.lampiranSubtitle),
    personnelRows: uppercasePersonRows(data.personnelRows),
  };
}

function uppercaseSuratBiasaData(data: SuratBiasaData): SuratBiasaData {
  return {
    ...data,
    kopLine1: toKapital(data.kopLine1),
    kopLine2: toKapital(data.kopLine2),
    kopLine3: toKapital(data.kopLine3),
    kopAddress: toKapital(data.kopAddress),
    dateRightText: toKapital(data.dateRightText),
    page2HeaderLabel: toKapital(data.page2HeaderLabel),
    page2DateUpper: toKapital(data.page2DateUpper),
    nomor: toKapital(data.nomor),
    klasifikasi: toKapital(data.klasifikasi),
    lampiran: toKapital(data.lampiran),
    perihal: toKapital(data.perihal),
    kepadaYth: toKapital(data.kepadaYth),
    diKota: toKapital(data.diKota),
    upText: toKapital(data.upText),
    personnelTableTitle: toKapital(data.personnelTableTitle),
    personnelRows: uppercasePersonRows(data.personnelRows),
    signerSuperiorTitle: data.signerSuperiorTitle
      ? toKapital(data.signerSuperiorTitle)
      : undefined,
    signerMiddleTitle: data.signerMiddleTitle
      ? toKapital(data.signerMiddleTitle)
      : undefined,
    signerTitle: toKapital(data.signerTitle),
    signerName: toKapital(data.signerName),
    signerRankNrp: toKapital(data.signerRankNrp),
    tembusan: data.tembusan.map(toKapital),
  };
}

function buildUppercaseTajukTitleLines(
  opts: Parameters<typeof buildTajukTitleLines>[0]
): TajukTitleLine[] {
  return buildTajukTitleLines(opts).map((tl) => ({
    ...tl,
    text: toKapital(tl.text),
  }));
}

export interface A4ContinuationHeader {
  label: string;
  nomor: string;
  tanggalUpper: string;
}

export interface SprinBodyLineItem {
  label?: string;
  showColon?: boolean;
  numPrefix?: string;
  indentUnderNum?: boolean;
  text: string;
  underline?: boolean;
  gapAfterMm?: number;
}

export interface BiasaLineItem {
  marker?: string;
  markerIndentMm: number;
  textIndentMm: number;
  text: string;
  gapAfterMm?: number;
}

export interface NumberedPersonRow {
  no: number;
  row: SuratPersonRow;
}

export type A4PreviewBlock =
  | {
      kind: 'sprin_header';
      kopLine1: string;
      kopLine2: string;
      kopLine3: string;
      nomor: string;
    }
  | {
      kind: 'sprin_line';
      item: SprinBodyLineItem;
    }
  | {
      kind: 'sprin_center_heading';
      text: string;
    }
  | {
      kind: 'sprin_selesai';
    }
  | {
      kind: 'biasa_header';
      data: SuratBiasaData;
    }
  | {
      kind: 'biasa_line';
      item: BiasaLineItem;
    }
  | {
      kind: 'lampiran_header';
      kopLine1: string;
      kopLine2: string;
      kopLine3: string;
      rightHeader: A4ContinuationHeader;
      title: string;
      subtitle: string;
    }
  | {
      kind: 'table_title';
      text: string;
    }
  | {
      kind: 'personnel_table';
      rows: NumberedPersonRow[];
      withNumberSubRow: boolean;
      defaultEmptyKet: string;
    }
  | {
      kind: 'signature_tembusan';
      issuedPlace?: string;
      issuedDateText?: string;
      signerTitleLines: TajukTitleLine[];
      signerName: string;
      signerRankNrp: string;
      tembusan: string[];
    };

export interface A4PreviewPage {
  pageNumber: number;
  sectionPageNumber: number;
  section: 'SPRIN' | 'LAMPIRAN' | 'BIASA';
  continuationHeader?: A4ContinuationHeader;
  classificationBanner?: string;
  connectorWord?: string;
  blocks: A4PreviewBlock[];
}

interface LoadedCrestAsset {
  dataUrl: string;
  bytes: Uint8Array;
}

let cachedCrestPromise: Promise<LoadedCrestAsset | null> | null = null;

async function loadTribrataMonochromeAsset(): Promise<LoadedCrestAsset | null> {
  if (cachedCrestPromise) return cachedCrestPromise;

  cachedCrestPromise = (async () => {
    try {
      const response = await fetch(TRIBRATA_LOGO_URL);
      if (!response.ok) return null;
      const srcBlob = await response.blob();
      const objUrl = URL.createObjectURL(srcBlob);

      try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const el = new Image();
          el.onload = () => resolve(el);
          el.onerror = () => reject(new Error('Gagal memuat logo'));
          el.src = objUrl;
        });

        const size = 180;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        ctx.clearRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);

        const imgData = ctx.getImageData(0, 0, size, size);
        const px = imgData.data;
        for (let i = 0; i < px.length; i += 4) {
          const alpha = px[i + 3];
          if (alpha < 15) continue;
          const lum = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
          const bw = lum < 175 ? Math.max(15, Math.round(lum * 0.45)) : 230;
          px[i] = bw;
          px[i + 1] = bw;
          px[i + 2] = bw;
        }
        ctx.putImageData(imgData, 0, 0);

        const dataUrl = canvas.toDataURL('image/png');
        const pngBlob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, 'image/png')
        );
        if (!pngBlob) return null;
        const arrBuf = await pngBlob.arrayBuffer();
        return {
          dataUrl,
          bytes: new Uint8Array(arrBuf),
        };
      } finally {
        URL.revokeObjectURL(objUrl);
      }
    } catch {
      return null;
    }
  })();

  return cachedCrestPromise;
}

function estimatePersonRowHeightMm(
  doc: jsPDF,
  row: SuratPersonRow,
  defaultEmptyKet: string
): number {
  doc.setFontSize(9);
  const nameLines = doc.splitTextToSize(row.name || '', 38).length;
  const jabLines = doc.splitTextToSize(row.jabatan || '', 43).length;
  const ketLines = doc.splitTextToSize(row.ket || defaultEmptyKet, 17).length;
  const maxLines = Math.max(1, nameLines, jabLines, ketLines);
  return maxLines * 3.8 + 3.4;
}

function extractFirstConnectorToken(
  page: A4PreviewPage,
  uppercase = false
): string | undefined {
  for (const block of page.blocks) {
    if (block.kind === 'sprin_line') {
      const firstWord = block.item.text.trim().split(/\s+/)[0] ?? '';
      if (block.item.numPrefix && firstWord) {
        return `${block.item.numPrefix} ${firstWord}`;
      }
      if (firstWord) return firstWord;
    }
    if (block.kind === 'sprin_center_heading') {
      return block.text.trim().split(/\s+/)[0];
    }
    if (block.kind === 'sprin_selesai') {
      return uppercase ? 'SELESAI.' : 'Selesai.';
    }
    if (block.kind === 'biasa_line') {
      const trimmed = block.item.text.trim();
      if (!trimmed) continue;
      const tokens = trimmed.split(/\s+/);
      if (/^(\d+\.|[a-z]\.|\d+\))$/i.test(tokens[0]) && tokens[1]) {
        return `${tokens[0]} ${tokens[1]}`;
      }
      return tokens[0];
    }
    if (block.kind === 'table_title') {
      return block.text.trim().split(/\s+/)[0];
    }
    if (block.kind === 'personnel_table') {
      const firstRow = block.rows[0];
      if (firstRow) {
        const firstWord = firstRow.row.name.trim().split(/\s+/)[0] ?? '';
        return `${firstRow.no}. ${firstWord}`.trim();
      }
      return 'NO';
    }
    if (block.kind === 'signature_tembusan') {
      if (block.issuedPlace) return uppercase ? 'DIKELUARKAN' : 'Dikeluarkan';
      return (block.signerTitleLines[0]?.text ?? '').trim().split(/\s+/)[0];
    }
  }
  return undefined;
}

function finalizePerkapPaginationMeta(
  pages: A4PreviewPage[],
  classificationBanner?: string,
  uppercase = false
): A4PreviewPage[] {
  const sectionCounters: Record<string, number> = {};

  return pages.map((page, idx) => {
    const nextSecNum = (sectionCounters[page.section] ?? 0) + 1;
    sectionCounters[page.section] = nextSecNum;

    const nextPage = pages[idx + 1];
    let connectorWord: string | undefined;
    if (nextPage && nextPage.section === page.section) {
      const firstToken = extractFirstConnectorToken(nextPage, uppercase);
      if (firstToken) {
        connectorWord = `${uppercase ? toKapital(firstToken) : firstToken} .....`;
      }
    }

    return {
      ...page,
      sectionPageNumber: nextSecNum,
      classificationBanner,
      connectorWord,
    };
  });
}

/**
 * Menghitung tata letak halaman A4 secara persis (single source of truth untuk Preview dan PDF)
 * sesuai Perkap Nomor 1 Tahun 2023 untuk SURAT PERINTAH + LAMPIRAN.
 */
export function buildSprinA4Pages(
  rawData: SuratPerintahData,
  uppercase = false
): A4PreviewPage[] {
  const data = uppercase ? uppercaseSprinData(rawData) : rawData;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);

  const sprinContHeader: A4ContinuationHeader = {
    label:
      data.sprinContinuationHeaderLabel?.trim() || 'SPRIN KAPOLSEK SMG SELATAN',
    nomor: data.nomor,
    tanggalUpper: data.lampiranDateUpper,
  };
  const lampiranContHeader: A4ContinuationHeader = {
    label:
      data.lampiranHeaderLabel?.trim() || 'LAMPIRAN SPRIN KAPOLSEK SMG SELATAN',
    nomor: data.nomor,
    tanggalUpper: data.lampiranDateUpper,
  };

  const inlineKepadaMode =
    Boolean(data.useInlineKepadaIfFiveOrLess) &&
    data.personnelRows.length > 0;

  const pages: A4PreviewPage[] = [];
  let currentPage: A4PreviewPage = {
    pageNumber: 1,
    sectionPageNumber: 1,
    section: 'SPRIN',
    blocks: [
      {
        kind: 'sprin_header',
        kopLine1: data.kopLine1,
        kopLine2: data.kopLine2,
        kopLine3: data.kopLine3,
        nomor: data.nomor,
      },
    ],
  };
  pages.push(currentPage);

  // Perkiraan y setelah kop kiri (3 baris), logo (18mm + margin), judul, dan nomor
  let y = PDF_PAGE_START_Y + 4.8 * 3 + 2 + 22 + 5.5 + 8; // ~72mm

  const pushSprinContPage = () => {
    currentPage = {
      pageNumber: pages.length + 1,
      sectionPageNumber: 1,
      section: 'SPRIN',
      continuationHeader: sprinContHeader,
      blocks: [],
    };
    pages.push(currentPage);
    y = PDF_CONTINUATION_TOP_Y;
  };

  const bodyX = 63; // PDF_MARGIN_LEFT (30) + label/colon (33)
  const bodyMaxW = 210 - PDF_MARGIN_RIGHT - bodyX; // 127 mm

  const addSprinWrappedText = (
    text: string,
    opts?: {
      label?: string;
      showColon?: boolean;
      numPrefix?: string;
      indentUnderNum?: boolean;
      underline?: boolean;
      gapAfterMm?: number;
    }
  ) => {
    const availW =
      opts?.numPrefix || opts?.indentUnderNum ? bodyMaxW - 7 : bodyMaxW;
    const lines: string[] = doc.splitTextToSize(text || ' ', availW);
    lines.forEach((line, lineIdx) => {
      if (y + 5 > PDF_BOTTOM_LIMIT_Y) {
        pushSprinContPage();
      }
      const isFirst = lineIdx === 0;
      const isLast = lineIdx === lines.length - 1;
      currentPage.blocks.push({
        kind: 'sprin_line',
        item: {
          label: isFirst ? opts?.label : undefined,
          showColon: isFirst ? opts?.showColon : false,
          numPrefix: isFirst ? opts?.numPrefix : undefined,
          indentUnderNum: Boolean(opts?.numPrefix || opts?.indentUnderNum),
          text: line,
          underline: opts?.underline,
          gapAfterMm: isLast ? opts?.gapAfterMm ?? 0 : 0,
        },
      });
      y += 5 + (isLast ? opts?.gapAfterMm ?? 0 : 0);
    });
  };

  // Pertimbangan
  addSprinWrappedText(data.pertimbangan, {
    label: uppercase ? 'PERTIMBANGAN' : 'Pertimbangan',
    showColon: true,
    gapAfterMm: 3,
  });

  // Dasar
  data.dasar.forEach((item, idx) => {
    addSprinWrappedText(item, {
      label: idx === 0 ? (uppercase ? 'DASAR' : 'Dasar') : undefined,
      showColon: idx === 0,
      numPrefix: `${idx + 1}.`,
      gapAfterMm: 1.5,
    });
  });

  // DIPERINTAHKAN
  y += 2;
  if (y + 10 > PDF_BOTTOM_LIMIT_Y) {
    pushSprinContPage();
  }
  currentPage.blocks.push({
    kind: 'sprin_center_heading',
    text: 'DIPERINTAHKAN',
  });
  y += 7.5;

  // Kepada (maksimal 5 orang boleh langsung pada pokok Sprin sesuai Perkap 1/2023)
  if (inlineKepadaMode) {
    data.personnelRows.forEach((row, idx) => {
      const rawFormatted = formatSprinInlineKepadaPerson(row);
      const formatted = uppercase
        ? {
            identityLine: toKapital(rawFormatted.identityLine),
            jabatanLine: toKapital(rawFormatted.jabatanLine),
          }
        : rawFormatted;
      addSprinWrappedText(formatted.identityLine, {
        label: idx === 0 ? (uppercase ? 'KEPADA' : 'Kepada') : undefined,
        showColon: idx === 0,
        numPrefix: `${idx + 1}.`,
        underline: true,
        gapAfterMm: 0.4,
      });
      addSprinWrappedText(formatted.jabatanLine, {
        indentUnderNum: true,
        gapAfterMm: idx === data.personnelRows.length - 1 ? 3 : 1.6,
      });
    });
  } else {
    addSprinWrappedText(data.kepadaText, {
      label: uppercase ? 'KEPADA' : 'Kepada',
      showColon: true,
      gapAfterMm: 3,
    });
  }

  // Untuk
  data.untuk.forEach((item, idx) => {
    addSprinWrappedText(item, {
      label: idx === 0 ? (uppercase ? 'UNTUK' : 'Untuk') : undefined,
      showColon: idx === 0,
      numPrefix: `${idx + 1}.`,
      gapAfterMm: 1.5,
    });
  });

  // Selesai.
  y += 1;
  if (y + 6 > PDF_BOTTOM_LIMIT_Y) {
    pushSprinContPage();
  }
  currentPage.blocks.push({ kind: 'sprin_selesai' });
  y += 7;

  // Tanda tangan & Tembusan Surat Perintah
  const sprinTitleLines = uppercase
    ? buildUppercaseTajukTitleLines(data)
    : buildTajukTitleLines(data);
  const tembusanList = data.tembusan.filter((t) => t.trim().length > 0);
  const sigNeededMm = Math.max(
    44 + sprinTitleLines.length * 5,
    34 + tembusanList.length * 5 + sprinTitleLines.length * 5
  );
  if (y + sigNeededMm > PDF_BOTTOM_LIMIT_Y) {
    pushSprinContPage();
  }
  currentPage.blocks.push({
    kind: 'signature_tembusan',
    issuedPlace: data.issuedPlace,
    issuedDateText: data.issuedDateText,
    signerTitleLines: sprinTitleLines,
    signerName: data.signerName,
    signerRankNrp: data.signerRankNrp,
    tembusan: tembusanList,
  });

  // =========================================================================
  // LAMPIRAN SURAT PERINTAH (wajib bila > 5 personel atau mode Lampiran aktif)
  // =========================================================================
  if (!inlineKepadaMode) {
    let lampiranPage: A4PreviewPage = {
      pageNumber: pages.length + 1,
      sectionPageNumber: 1,
      section: 'LAMPIRAN',
      blocks: [
        {
          kind: 'lampiran_header',
          kopLine1: data.kopLine1,
          kopLine2: data.kopLine2,
          kopLine3: data.kopLine3,
          rightHeader: lampiranContHeader,
          title: data.lampiranTitle,
          subtitle: data.lampiranSubtitle,
        },
      ],
    };
    pages.push(lampiranPage);
    y = 50; // Setelah kop lampiran + judul + subjudul

    const tableHeadHeight = 13.5; // Baris NO..KET + 1..5
    let rowCursor = 0;
    let tableRowsForPage: NumberedPersonRow[] = [];

    const flushTableSlice = (slice: NumberedPersonRow[]) => {
      if (slice.length === 0 && data.personnelRows.length > 0) return;
      lampiranPage.blocks.push({
        kind: 'personnel_table',
        rows: slice,
        withNumberSubRow: true,
        defaultEmptyKet: 'SDA',
      });
    };

    if (data.personnelRows.length === 0) {
      flushTableSlice([]);
      y += tableHeadHeight + 10;
    } else {
      y += tableHeadHeight;
      while (rowCursor < data.personnelRows.length) {
        const row = data.personnelRows[rowCursor];
        const rh = estimatePersonRowHeightMm(doc, row, 'SDA');
        if (y + rh > PDF_BOTTOM_LIMIT_Y && tableRowsForPage.length > 0) {
          flushTableSlice(tableRowsForPage);
          tableRowsForPage = [];
          lampiranPage = {
            pageNumber: pages.length + 1,
            sectionPageNumber: 1,
            section: 'LAMPIRAN',
            continuationHeader: lampiranContHeader,
            blocks: [],
          };
          pages.push(lampiranPage);
          y = PDF_CONTINUATION_TOP_Y + tableHeadHeight;
        }
        tableRowsForPage.push({ no: rowCursor + 1, row });
        y += rh;
        rowCursor += 1;
      }
      if (tableRowsForPage.length > 0) {
        flushTableSlice(tableRowsForPage);
      }
    }

    y += 8;
    const lampSigHeight = 40 + sprinTitleLines.length * 4.8;
    if (y + lampSigHeight > PDF_BOTTOM_LIMIT_Y) {
      lampiranPage = {
        pageNumber: pages.length + 1,
        sectionPageNumber: 1,
        section: 'LAMPIRAN',
        continuationHeader: lampiranContHeader,
        blocks: [],
      };
      pages.push(lampiranPage);
    }
    lampiranPage.blocks.push({
      kind: 'signature_tembusan',
      issuedPlace: data.issuedPlace,
      issuedDateText: data.issuedDateText,
      signerTitleLines: sprinTitleLines,
      signerName: data.signerName,
      signerRankNrp: data.signerRankNrp,
      tembusan: [],
    });
  }

  return finalizePerkapPaginationMeta(pages, undefined, uppercase);
}

/**
 * Menghitung tata letak halaman A4 secara persis (single source of truth untuk Preview dan PDF)
 * sesuai Perkap Nomor 1 Tahun 2023 untuk dokumen SURAT BIASA.
 */
export function buildSuratBiasaA4Pages(
  rawData: SuratBiasaData,
  uppercase = false
): A4PreviewPage[] {
  const data = uppercase ? uppercaseSuratBiasaData(rawData) : rawData;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);

  const contHeader: A4ContinuationHeader = {
    label: data.page2HeaderLabel?.trim() || 'SURAT KAPOLSEK SMG SELATAN',
    nomor: data.nomor,
    tanggalUpper: data.page2DateUpper,
  };

  const klasTrim = data.klasifikasi.trim().toUpperCase();
  const classificationBanner =
    klasTrim && klasTrim !== 'BIASA' ? klasTrim : undefined;

  const pages: A4PreviewPage[] = [];
  let currentPage: A4PreviewPage = {
    pageNumber: 1,
    sectionPageNumber: 1,
    section: 'BIASA',
    blocks: [{ kind: 'biasa_header', data }],
  };
  pages.push(currentPage);

  // Hitung tinggi header (kop kiri atas + 2 baris di bawah alamat kop) + meta kiri vs Kepada (sejajar Hal)
  const kopRowCount = [
    data.kopLine1,
    data.kopLine2,
    data.kopLine3,
    data.kopAddress,
  ].filter((l) => l.trim().length > 0).length;
  let y = PDF_PAGE_START_Y + 20 + 4.8 * Math.max(0, kopRowCount - 1) + 11.5;
  const metaVals = [data.nomor, data.klasifikasi, data.lampiran, data.perihal];
  let ly = y;
  let halY = y;
  metaVals.forEach((v, idx) => {
    if (idx === 3) halY = ly;
    const lines = doc.splitTextToSize(v || ' ', 60);
    ly += lines.length * 4.8 + 0.6;
  });
  let ry = halY + 5.5;
  const ythLines = doc.splitTextToSize(data.kepadaYth || ' ', 57);
  ry += ythLines.length * 4.8 + 1.5 + 5 + 5;
  y = Math.max(ly, ry) + 5;
  if (data.upText.trim()) {
    y += 7;
  }

  const pushBiasaContPage = () => {
    currentPage = {
      pageNumber: pages.length + 1,
      sectionPageNumber: 1,
      section: 'BIASA',
      continuationHeader: contHeader,
      blocks: [],
    };
    pages.push(currentPage);
    y = PDF_CONTINUATION_TOP_Y;
  };

  const maxWidth = PDF_CONTENT_WIDTH_MM; // 160 mm
  const allBlocks = [...rawData.paragraphsPage1, ...rawData.paragraphsPage2];

  for (const block of allBlocks) {
    const rawLines = block.split('\n');
    let blockFallbackIndentMm = 0;
    rawLines.forEach((rawLine, rawIdx) => {
      const trimmed = rawLine.trim();
      if (!trimmed) {
        y += 3;
        currentPage.blocks.push({
          kind: 'biasa_line',
          item: {
            markerIndentMm: 0,
            textIndentMm: 0,
            text: '',
            gapAfterMm: 3,
          },
        });
        return;
      }

      const parsed = parseNumberedParagraphLine(trimmed, blockFallbackIndentMm);
      blockFallbackIndentMm = parsed.textIndentMm;

      const markerText =
        parsed.marker && uppercase ? toKapital(parsed.marker) : parsed.marker;
      const bodyText = uppercase
        ? toKapital(parsed.bodyText)
        : parsed.bodyText;

      const availW = Math.max(40, maxWidth - parsed.textIndentMm);
      const wrapped: string[] = doc.splitTextToSize(bodyText || ' ', availW);

      wrapped.forEach((wLine, wIdx) => {
        const isBlockEnd =
          rawIdx === rawLines.length - 1 && wIdx === wrapped.length - 1;
        const isLineEnd = wIdx === wrapped.length - 1;
        const gapAfter = isBlockEnd ? 3.2 : isLineEnd ? 1.2 : 0;

        if (y + 5 > PDF_BOTTOM_LIMIT_Y) {
          pushBiasaContPage();
        }
        currentPage.blocks.push({
          kind: 'biasa_line',
          item: {
            marker: wIdx === 0 ? markerText : undefined,
            markerIndentMm: parsed.markerIndentMm,
            textIndentMm: parsed.textIndentMm,
            text: wLine,
            gapAfterMm: gapAfter,
          },
        });
        y += 5 + gapAfter;
      });
    });
  }

  // Tabel daftar personel opsional pada Surat Biasa
  if (data.includePersonnelTable && data.personnelRows.length > 0) {
    if (data.personnelTableTitle.trim()) {
      if (y + 14 > PDF_BOTTOM_LIMIT_Y) {
        pushBiasaContPage();
      }
      currentPage.blocks.push({
        kind: 'table_title',
        text: data.personnelTableTitle,
      });
      y += 6.5;
    }

    const headH = 13.5;
    if (y + headH + 8 > PDF_BOTTOM_LIMIT_Y) {
      pushBiasaContPage();
    }
    y += headH;

    let slice: NumberedPersonRow[] = [];
    data.personnelRows.forEach((row, idx) => {
      const rh = estimatePersonRowHeightMm(doc, row, '');
      if (y + rh > PDF_BOTTOM_LIMIT_Y && slice.length > 0) {
        currentPage.blocks.push({
          kind: 'personnel_table',
          rows: slice,
          withNumberSubRow: true,
          defaultEmptyKet: '',
        });
        slice = [];
        pushBiasaContPage();
        y += headH;
      }
      slice.push({ no: idx + 1, row });
      y += rh;
    });

    if (slice.length > 0) {
      currentPage.blocks.push({
        kind: 'personnel_table',
        rows: slice,
        withNumberSubRow: true,
        defaultEmptyKet: '',
      });
    }
    y += 8;
  }

  // Blok tanda tangan + tembusan
  const biasaTitleLines = uppercase
    ? buildUppercaseTajukTitleLines(data)
    : buildTajukTitleLines(data);
  const tembusanList = data.tembusan.filter((t) => t.trim().length > 0);
  const sigNeededMm = Math.max(
    40 + biasaTitleLines.length * 5,
    30 + tembusanList.length * 5 + biasaTitleLines.length * 5
  );
  if (y + sigNeededMm > PDF_BOTTOM_LIMIT_Y) {
    pushBiasaContPage();
  }
  currentPage.blocks.push({
    kind: 'signature_tembusan',
    signerTitleLines: biasaTitleLines,
    signerName: data.signerName,
    signerRankNrp: data.signerRankNrp,
    tembusan: tembusanList,
  });

  return finalizePerkapPaginationMeta(pages, classificationBanner, uppercase);
}

// ============================================================================
// GENERATOR PDF DARI PAGE MODEL YANG SAMA (100% SINKRON DENGAN PREVIEW)
// ============================================================================

function drawUnderlinedCenteredLines(
  doc: jsPDF,
  lines: string[],
  centerX: number,
  startY: number,
  lineHeight: number,
  underlineLast: boolean
): number {
  let y = startY;
  lines.forEach((line, idx) => {
    doc.text(line, centerX, y, { align: 'center' });
    if (underlineLast && idx === lines.length - 1) {
      const w = doc.getTextWidth(line);
      doc.setLineWidth(0.3);
      doc.line(centerX - w / 2, y + 1, centerX + w / 2, y + 1);
    }
    y += lineHeight;
  });
  return y;
}

function drawTopRightHeaderPdf(doc: jsPDF, header: A4ContinuationHeader) {
  const prevFontSize = doc.getFontSize();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);

  const rightHeaderX = 117;
  const lines = [
    header.label,
    `NOMOR   : ${header.nomor}`,
    `TANGGAL : ${header.tanggalUpper}`,
  ];
  const maxLineWidth = lines.reduce(
    (max, l) => Math.max(max, doc.getTextWidth(l)),
    76
  );

  let ry = 14;
  lines.forEach((line, idx) => {
    doc.text(line, rightHeaderX, ry);
    if (idx === lines.length - 1) {
      doc.setLineWidth(0.3);
      doc.line(
        rightHeaderX,
        ry + 1.1,
        rightHeaderX + maxLineWidth + 2,
        ry + 1.1
      );
    }
    ry += 4.3;
  });

  doc.setFontSize(prevFontSize);
}

function drawSignatureBlockPdf(
  doc: jsPDF,
  startY: number,
  issuedLines: string[],
  signerTitleLines: TajukTitleLine[],
  signerName: string,
  signerRankNrp: string
): number {
  const rightMarginX = 210 - PDF_MARGIN_RIGHT; // 190 mm
  let y = startY;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);

  // Jangan memotong jabatan pendek seperti KAPOLSEK SEMARANG SELATAN POLRESTABES SEMARANG;
  // hanya wrap jika melebihi lebar area cetak (160 mm)
  const renderedTitleLines: { text: string; isUbMarker?: boolean }[] = [];
  signerTitleLines.forEach((tLine) => {
    const wrapped = doc.splitTextToSize(tLine.text, PDF_CONTENT_WIDTH_MM);
    wrapped.forEach((wl: string) => {
      renderedTitleLines.push({ text: wl, isUbMarker: tLine.isUbMarker });
    });
  });

  const titleMaxW = renderedTitleLines.reduce(
    (max, tl) => Math.max(max, doc.getTextWidth(tl.text)),
    0
  );
  const nameW = doc.getTextWidth(signerName);
  const rankW = doc.getTextWidth(signerRankNrp);
  const nameRankMaxW = Math.max(nameW, rankW);
  const issuedMaxW = issuedLines.reduce(
    (max, l) => Math.max(max, doc.getTextWidth(l)),
    0
  );

  const blockW = Math.min(
    PDF_CONTENT_WIDTH_MM,
    Math.max(titleMaxW, nameRankMaxW, issuedMaxW)
  );
  const titleCenterX = rightMarginX - titleMaxW / 2;
  const sigCenterX = rightMarginX - blockW / 2;

  if (issuedLines.length > 0) {
    const issuedLeftX = sigCenterX - Math.min(issuedMaxW, blockW) / 2;
    const underlineW = Math.min(Math.max(issuedMaxW + 2, 64), blockW);
    issuedLines.forEach((line, idx) => {
      doc.text(line, issuedLeftX, y);
      if (idx === issuedLines.length - 1) {
        doc.setLineWidth(0.3);
        doc.line(issuedLeftX, y + 1, issuedLeftX + underlineW, y + 1);
      }
      y += 5.2;
    });
    y += 1.5;
  }

  // Tulisan jabatan rata kanan (ujung kanan menempel margin kanan 190 mm)
  renderedTitleLines.forEach((tl) => {
    if (renderedTitleLines.length === 1) {
      doc.text(tl.text, rightMarginX, y, { align: 'right' });
    } else {
      doc.text(tl.text, titleCenterX, y, { align: 'center' });
    }
    y += tl.isUbMarker ? 4.5 : 5;
  });

  y += 16;

  // Nama & pangkat di bawahnya center alignment tepat di tengah tulisan jabatan
  const underTitleCenterX =
    titleMaxW >= nameRankMaxW ? titleCenterX : sigCenterX;

  doc.text(signerName, underTitleCenterX, y, { align: 'center' });
  doc.setLineWidth(0.3);
  doc.line(
    underTitleCenterX - nameW / 2,
    y + 0.9,
    underTitleCenterX + nameW / 2,
    y + 0.9
  );
  y += 5;

  doc.text(signerRankNrp, underTitleCenterX, y, { align: 'center' });
  return y + 4;
}

function renderA4PagesToPdf(
  pages: A4PreviewPage[],
  crest: LoadedCrestAsset | null,
  uppercase = false
): Blob {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  pages.forEach((page, pageIdx) => {
    if (pageIdx > 0) {
      doc.addPage();
    }

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);

    // Klasifikasi keamanan non-Biasa (Pasal Klasifikasi Perkap 1/2023, min 1,5 cm dari bawah)
    if (page.classificationBanner) {
      doc.setFontSize(10);
      doc.text(page.classificationBanner, 105, 9, { align: 'center' });
      doc.text(page.classificationBanner, 105, PDF_BOTTOM_CLASS_Y, {
        align: 'center',
      });
      doc.setFontSize(12);
    }

    // Penomoran Halaman Pasal 55: Angka Arab di tengah atas mulai halaman 2 (Hal. 1 tanpa nomor)
    if (page.sectionPageNumber >= 2) {
      doc.setFontSize(11);
      doc.text(String(page.sectionPageNumber), 105, 13.5, { align: 'center' });
      doc.setFontSize(12);
    }

    let y = PDF_PAGE_START_Y;
    if (page.continuationHeader) {
      drawTopRightHeaderPdf(doc, page.continuationHeader);
      y = PDF_CONTINUATION_TOP_Y;
    }

    for (const block of page.blocks) {
      if (block.kind === 'sprin_header') {
        doc.setFontSize(10.5);
        y = drawUnderlinedCenteredLines(
          doc,
          [block.kopLine1, block.kopLine2, block.kopLine3],
          60,
          PDF_PAGE_START_Y,
          4.8,
          true
        );
        y += 2;
        if (crest) {
          doc.addImage(crest.dataUrl, 'PNG', 96, y, 18, 18);
          y += 22;
        }
        doc.setFontSize(12);
        doc.text('SURAT PERINTAH', 105, y, { align: 'center' });
        const titleW = doc.getTextWidth('SURAT PERINTAH');
        doc.setLineWidth(0.35);
        doc.line(105 - titleW / 2, y + 1, 105 + titleW / 2, y + 1);
        y += 5.5;
        doc.setFontSize(12);
        doc.text(`${uppercase ? 'NOMOR' : 'Nomor'} : ${block.nomor}`, 105, y, {
          align: 'center',
        });
        y += 8.5;
      } else if (block.kind === 'sprin_line') {
        const item = block.item;
        doc.setFontSize(12);
        if (item.label) doc.text(item.label, PDF_MARGIN_LEFT, y);
        if (item.showColon) doc.text(':', 59, y);
        if (item.numPrefix) doc.text(item.numPrefix, 63, y);
        const textX = item.numPrefix || item.indentUnderNum ? 70 : 63;
        doc.text(item.text, textX, y);
        if (item.underline && item.text.trim()) {
          const lineW = doc.getTextWidth(item.text);
          doc.setLineWidth(0.28);
          doc.line(textX, y + 0.85, textX + lineW, y + 0.85);
        }
        y += 5 + (item.gapAfterMm ?? 0);
      } else if (block.kind === 'sprin_center_heading') {
        y += 2;
        doc.setFontSize(12);
        doc.text(block.text, 105, y, { align: 'center' });
        y += 7.5;
      } else if (block.kind === 'sprin_selesai') {
        y += 1;
        doc.setFontSize(12);
        doc.text(uppercase ? 'SELESAI.' : 'Selesai.', PDF_MARGIN_LEFT, y);
        y += 7;
      } else if (block.kind === 'biasa_header') {
        const d = block.data;
        y = PDF_PAGE_START_Y;
        const kopLines = [
          d.kopLine1,
          d.kopLine2,
          d.kopLine3,
          d.kopAddress,
        ].filter((l) => l.trim().length > 0);
        doc.setFontSize(10.5);
        const kopMaxW = kopLines.reduce(
          (max, line) => Math.max(max, doc.getTextWidth(line || '')),
          68
        );
        const kopCenterX = PDF_MARGIN_LEFT + kopMaxW / 2;

        if (crest) {
          doc.addImage(crest.dataUrl, 'PNG', kopCenterX - 17 / 2, y, 17, 17);
          y += 20;
        }
        const addressY = y + 4.8 * Math.max(0, kopLines.length - 1);
        drawUnderlinedCenteredLines(doc, kopLines, kopCenterX, y, 4.8, true);

        // Tempat dan tanggal sebaris dengan baris alamat kop, sejajar vertikal dengan Yth. di bawahnya
        const ythColX = Math.max(129, PDF_MARGIN_LEFT + kopMaxW + 6);
        doc.setFontSize(12);
        doc.text(d.dateRightText, ythColX, addressY);

        // 2 baris di bawah kop naskah dinas
        y = addressY + 11.5;

        let ly = y;
        let halY = y;
        const metaRows: [string, string][] = [
          [uppercase ? 'NOMOR' : 'Nomor', d.nomor],
          [uppercase ? 'KLASIFIKASI' : 'Klasifikasi', d.klasifikasi],
          [uppercase ? 'LAMPIRAN' : 'Lampiran', d.lampiran],
          [uppercase ? 'HAL' : 'Hal', d.perihal],
        ];
        metaRows.forEach(([label, value], idx) => {
          if (idx === 3) halY = ly;
          doc.text(label, PDF_MARGIN_LEFT, ly);
          doc.text(':', 52, ly);
          const wrapped = doc.splitTextToSize(value || ' ', 60);
          doc.text(wrapped, 55, ly);
          ly += wrapped.length * 4.8 + 0.6;
        });

        // Kepada sejajar satu baris dengan isian Hal; Yth. sejajar vertikal dengan Tempat & Tanggal di atasnya
        let ry = halY;
        doc.text(uppercase ? 'KEPADA' : 'Kepada', ythColX + 9, ry);
        ry += 5.5;
        doc.text(uppercase ? 'YTH.' : 'Yth.', ythColX, ry);
        const ythLines = doc.splitTextToSize(
          d.kepadaYth || ' ',
          Math.max(40, 210 - PDF_MARGIN_RIGHT - (ythColX + 9))
        );
        doc.text(ythLines, ythColX + 9, ry);
        ry += ythLines.length * 4.8 + 1.5;
        doc.text(uppercase ? 'DI' : 'di', ythColX + 9, ry);
        ry += 5;
        doc.text(d.diKota, ythColX + 9, ry);
        ry += 5;

        y = Math.max(ly, ry) + 5;
        if (d.upText.trim()) {
          doc.text(d.upText, PDF_MARGIN_LEFT + 5, y);
          y += 7;
        }
      } else if (block.kind === 'biasa_line') {
        const item = block.item;
        doc.setFontSize(12);
        if (item.marker) {
          doc.text(item.marker, PDF_MARGIN_LEFT + item.markerIndentMm, y);
        }
        if (item.text) {
          doc.text(item.text, PDF_MARGIN_LEFT + item.textIndentMm, y);
          y += 5 + (item.gapAfterMm ?? 0);
        } else {
          y += item.gapAfterMm ?? 3;
        }
      } else if (block.kind === 'lampiran_header') {
        doc.setFontSize(9.5);
        drawUnderlinedCenteredLines(
          doc,
          [block.kopLine1, block.kopLine2, block.kopLine3],
          60,
          14,
          4.3,
          true
        );
        drawTopRightHeaderPdf(doc, block.rightHeader);
        y = 38;
        doc.setFontSize(11);
        doc.text(block.title, 105, y, { align: 'center' });
        y += 5;
        doc.text(block.subtitle, 105, y, { align: 'center' });
        const subW = doc.getTextWidth(block.subtitle);
        doc.setLineWidth(0.3);
        doc.line(105 - subW / 2, y + 1, 105 + subW / 2, y + 1);
        y += 7;
      } else if (block.kind === 'table_title') {
        doc.setFontSize(11);
        doc.text(block.text, 105, y + 2, { align: 'center' });
        y += 6.5;
      } else if (block.kind === 'personnel_table') {
        const head = block.withNumberSubRow
          ? [
              ['NO', 'NAMA', 'PANGKAT', 'NRP', 'JABATAN', 'KET'],
              ['1', '2', '3', '4', '5', ''],
            ]
          : [['NO', 'NAMA', 'PANGKAT', 'NRP', 'JABATAN', 'KET']];

        autoTable(doc, {
          startY: y,
          margin: { left: PDF_MARGIN_LEFT, right: PDF_MARGIN_RIGHT },
          theme: 'grid',
          styles: {
            font: 'helvetica',
            fontSize: 9,
            textColor: [0, 0, 0],
            lineColor: [0, 0, 0],
            lineWidth: 0.25,
            cellPadding: 1.5,
            valign: 'middle',
          },
          headStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            fontStyle: 'normal',
            halign: 'center',
          },
          head,
          body: block.rows.map((item) => [
            String(item.no),
            item.row.name,
            item.row.pangkat,
            item.row.nrp,
            item.row.jabatan,
            item.row.ket || block.defaultEmptyKet,
          ]),
          columnStyles: {
            0: { cellWidth: 9, halign: 'center' },
            1: { cellWidth: 44, halign: 'left' },
            2: { cellWidth: 20, halign: 'center' },
            3: { cellWidth: 22, halign: 'center' },
            4: { cellWidth: 50, halign: 'center' },
            5: { cellWidth: 20, halign: 'center' },
          },
        });
        const docWithAutoTable = doc as jsPDF & {
          lastAutoTable?: { finalY: number };
        };
        y = (docWithAutoTable.lastAutoTable?.finalY ?? y + 20) + 8;
      } else if (block.kind === 'signature_tembusan') {
        const issuedLines =
          block.issuedPlace && block.issuedDateText
            ? [
                `${uppercase ? 'DIKELUARKAN DI' : 'Dikeluarkan di'} : ${block.issuedPlace}`,
                `${uppercase ? 'PADA TANGGAL  ' : 'Pada tanggal  '} : ${block.issuedDateText}`,
              ]
            : [];
        const sigStartY = y + 2;
        const sigBottomY = drawSignatureBlockPdf(
          doc,
          sigStartY,
          issuedLines,
          block.signerTitleLines,
          block.signerName,
          block.signerRankNrp
        );
        if (block.tembusan.length > 0) {
          let ty = Math.max(sigStartY + 26, sigBottomY - 10);
          doc.setFontSize(12);
          doc.text(uppercase ? 'TEMBUSAN :' : 'Tembusan :', PDF_MARGIN_LEFT, ty);
          ty += 5;
          block.tembusan.forEach((t, idx) => {
            const availW = ty <= sigBottomY ? 66 : PDF_CONTENT_WIDTH_MM - 7;
            const wrappedT: string[] = doc.splitTextToSize(t, availW);
            wrappedT.forEach((wt, wIdx) => {
              if (wIdx === 0) {
                doc.text(`${idx + 1}.`, PDF_MARGIN_LEFT, ty);
              }
              doc.text(wt, PDF_MARGIN_LEFT + 7, ty);
              ty += 5;
            });
          });
        }
      }
    }

    // Kata Penyambung (Pasal 52 Perkap 1/2023) di sudut kanan bawah bila berlanjut
    if (page.connectorWord) {
      doc.setFontSize(11);
      doc.text(page.connectorWord, 210 - PDF_MARGIN_RIGHT, PDF_CONNECTOR_Y, {
        align: 'right',
      });
    }
  });

  return doc.output('blob');
}

export async function generateSprinPdfBlob(
  data: SuratPerintahData
): Promise<Blob> {
  const crest = await loadTribrataMonochromeAsset();
  const pages = buildSprinA4Pages(data, false);
  return renderA4PagesToPdf(pages, crest, false);
}

export async function generateSuratBiasaPdfBlob(
  data: SuratBiasaData
): Promise<Blob> {
  const crest = await loadTribrataMonochromeAsset();
  const pages = buildSuratBiasaA4Pages(data, false);
  return renderA4PagesToPdf(pages, crest, false);
}

// ============================================================================
// GENERATOR DOCX (KERTAS A4, MARGIN 2/3/3/2 CM, ARIAL 12 PT, PERKAP 1/2023)
// ============================================================================

const NO_BORDERS = {
  top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
};

const THIN_BORDERS = {
  top: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
  left: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
  right: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
  insideVertical: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
};

const CELL_NO_BORDERS = {
  top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
};

function txt(
  text: string,
  opts?: {
    bold?: boolean;
    underline?: boolean;
    sizePt?: number;
    fontFamily?: SuratFontFamily;
  }
): TextRun {
  return new TextRun({
    text,
    font: opts?.fontFamily ?? 'Arial Narrow',
    size: (opts?.sizePt ?? 12) * 2,
    bold: opts?.bold ?? false,
    underline: opts?.underline ? { type: UnderlineType.SINGLE } : undefined,
    color: '000000',
  });
}

function para(
  children: TextRun | TextRun[],
  opts?: {
    align?: (typeof AlignmentType)[keyof typeof AlignmentType];
    afterPt?: number;
    beforePt?: number;
    leftIndentTwips?: number;
    hangingTwips?: number;
    tabStops?: {
      type: (typeof TabStopType)[keyof typeof TabStopType];
      position: number;
    }[];
  }
): Paragraph {
  return new Paragraph({
    alignment: opts?.align ?? AlignmentType.LEFT,
    spacing: {
      before: (opts?.beforePt ?? 0) * 20,
      after: (opts?.afterPt ?? 2) * 20,
      line: 260,
    },
    indent:
      opts?.leftIndentTwips || opts?.hangingTwips
        ? {
            left: opts?.leftIndentTwips,
            hanging: opts?.hangingTwips,
          }
        : undefined,
    tabStops: opts?.tabStops,
    children: Array.isArray(children) ? children : [children],
  });
}

interface ParsedNumberedLine {
  marker?: string;
  bodyText: string;
  markerIndentMm: number;
  textIndentMm: number;
}

function parseNumberedParagraphLine(
  trimmed: string,
  fallbackTextIndentMm = 0
): ParsedNumberedLine {
  // Tingkat 3: 1), 2), ...
  const subNumMatch = trimmed.match(/^(\d+\))\s+(.*)$/);
  if (subNumMatch) {
    return {
      marker: subNumMatch[1],
      bodyText: subNumMatch[2],
      markerIndentMm: 13,
      textIndentMm: 20.5,
    };
  }
  // Tingkat 4: (1), (a), ...
  const parenMatch = trimmed.match(/^(\([a-z0-9]+\))\s+(.*)$/i);
  if (parenMatch) {
    return {
      marker: parenMatch[1],
      bodyText: parenMatch[2],
      markerIndentMm: 13,
      textIndentMm: 20,
    };
  }
  // Tingkat 2: a., b., c. atau a), b), c)
  const subLetMatch = trimmed.match(/^([a-z][.)])\s+(.*)$/);
  if (subLetMatch) {
    return {
      marker: subLetMatch[1],
      bodyText: subLetMatch[2],
      markerIndentMm: 7,
      textIndentMm: 13,
    };
  }
  // Tingkat 1: 1., 2., 3., ...
  const topNumMatch = trimmed.match(/^(\d+\.)\s+(.*)$/);
  if (topNumMatch) {
    return {
      marker: topNumMatch[1],
      bodyText: topNumMatch[2],
      markerIndentMm: 0,
      textIndentMm: 7,
    };
  }
  return {
    marker: undefined,
    bodyText: trimmed,
    markerIndentMm: fallbackTextIndentMm,
    textIndentMm: fallbackTextIndentMm,
  };
}

function buildDocxKopBlock(
  lines: string[],
  align: (typeof AlignmentType)[keyof typeof AlignmentType],
  underlineLast = true,
  sizePt = 11,
  fontFamily: SuratFontFamily = 'Arial Narrow'
): Paragraph[] {
  return lines.map((line, idx) =>
    para(
      txt(line, {
        sizePt,
        fontFamily,
        underline: underlineLast && idx === lines.length - 1,
      }),
      { align, afterPt: 1 }
    )
  );
}

function buildContinuationHeaderDocx(
  topLabel: string,
  nomor: string,
  tanggalUpper: string,
  classificationBanner?: string,
  fontFamily: SuratFontFamily = 'Arial Narrow'
): Header {
  const line1 = topLabel;
  const line2 = `NOMOR  : ${nomor}`;
  const line3 = `TANGGAL: ${tanggalUpper}`;

  const children: (Paragraph | Table)[] = [];

  if (classificationBanner) {
    children.push(
      para(txt(classificationBanner, { sizePt: 10, fontFamily }), {
        align: AlignmentType.CENTER,
        afterPt: 1,
      })
    );
  }

  // Nomor halaman Arab di tengah atas mulai halaman 2+ (Pasal 55 Perkap 1/2023)
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({
          font: fontFamily,
          size: 22,
          color: '000000',
          children: [PageNumber.CURRENT],
        }),
      ],
    })
  );

  children.push(
    new Table({
      width: { size: A4_CONTENT_WIDTH_TWIPS, type: WidthType.DXA },
      borders: NO_BORDERS,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 4100, type: WidthType.DXA },
              borders: CELL_NO_BORDERS,
              children: [para(txt('', { sizePt: 9.5, fontFamily }), { afterPt: 0 })],
            }),
            new TableCell({
              width: {
                size: A4_CONTENT_WIDTH_TWIPS - 4100,
                type: WidthType.DXA,
              },
              borders: {
                top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                bottom: {
                  style: BorderStyle.SINGLE,
                  size: 6,
                  color: '000000',
                },
              },
              children: [
                para(txt(line1, { sizePt: 9.5, fontFamily }), { afterPt: 0 }),
                para(txt(line2, { sizePt: 9.5, fontFamily }), { afterPt: 0 }),
                para(txt(line3, { sizePt: 9.5, fontFamily }), { afterPt: 1 }),
              ],
            }),
          ],
        }),
      ],
    }),
    // Jarak 2 baris di bawah kop naskah dinas lanjutan
    para(txt('', { sizePt: 12, fontFamily }), { afterPt: 12 })
  );

  return new Header({ children });
}

function buildDocxPersonnelTable(
  rows: SuratPersonRow[],
  defaultEmptyKet = 'SDA',
  fontFamily: SuratFontFamily = 'Arial Narrow'
): Table {
  const colWidths = [510, 2500, 1150, 1270, 2780, 1145]; // total 9355 twips (165 mm)

  const headerRow = new TableRow({
    tableHeader: true,
    children: ['NO', 'NAMA', 'PANGKAT', 'NRP', 'JABATAN', 'KET'].map(
      (label, i) =>
        new TableCell({
          width: { size: colWidths[i], type: WidthType.DXA },
          children: [
            para(txt(label, { sizePt: 9.5, fontFamily }), {
              align: AlignmentType.CENTER,
              afterPt: 1,
            }),
          ],
        })
    ),
  });

  const numberSubRow = new TableRow({
    tableHeader: true,
    children: ['1', '2', '3', '4', '5', ''].map(
      (label, i) =>
        new TableCell({
          width: { size: colWidths[i], type: WidthType.DXA },
          children: [
            para(txt(label, { sizePt: 9, fontFamily }), {
              align: AlignmentType.CENTER,
              afterPt: 1,
            }),
          ],
        })
    ),
  });

  const dataRows = rows.map(
    (row, idx) =>
      new TableRow({
        cantSplit: true,
        children: [
          new TableCell({
            width: { size: colWidths[0], type: WidthType.DXA },
            children: [
              para(txt(String(idx + 1), { sizePt: 9, fontFamily }), {
                align: AlignmentType.CENTER,
                afterPt: 1,
              }),
            ],
          }),
          new TableCell({
            width: { size: colWidths[1], type: WidthType.DXA },
            children: [
              para(txt(row.name, { sizePt: 9, fontFamily }), {
                align: AlignmentType.LEFT,
                afterPt: 1,
              }),
            ],
          }),
          new TableCell({
            width: { size: colWidths[2], type: WidthType.DXA },
            children: [
              para(txt(row.pangkat, { sizePt: 9, fontFamily }), {
                align: AlignmentType.CENTER,
                afterPt: 1,
              }),
            ],
          }),
          new TableCell({
            width: { size: colWidths[3], type: WidthType.DXA },
            children: [
              para(txt(row.nrp, { sizePt: 9, fontFamily }), {
                align: AlignmentType.CENTER,
                afterPt: 1,
              }),
            ],
          }),
          new TableCell({
            width: { size: colWidths[4], type: WidthType.DXA },
            children: [
              para(txt(row.jabatan, { sizePt: 9, fontFamily }), {
                align: AlignmentType.CENTER,
                afterPt: 1,
              }),
            ],
          }),
          new TableCell({
            width: { size: colWidths[5], type: WidthType.DXA },
            children: [
              para(txt(row.ket || defaultEmptyKet, { sizePt: 9, fontFamily }), {
                align: AlignmentType.CENTER,
                afterPt: 1,
              }),
            ],
          }),
        ],
      })
  );

  return new Table({
    width: { size: A4_CONTENT_WIDTH_TWIPS, type: WidthType.DXA },
    borders: THIN_BORDERS,
    rows: [headerRow, numberSubRow, ...dataRows],
  });
}

let cachedMeasureDoc: jsPDF | null = null;
function measureTextWidthMm(text: string, sizePt = 12): number {
  if (!cachedMeasureDoc) {
    cachedMeasureDoc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
  }
  cachedMeasureDoc.setFont('helvetica', 'normal');
  cachedMeasureDoc.setFontSize(sizePt);
  return cachedMeasureDoc.getTextWidth(text || '');
}

function buildDocxSignatureTable(
  issuedLines: string[],
  signerTitleLines: TajukTitleLine[],
  signerName: string,
  signerRankNrp: string,
  fontFamily: SuratFontFamily = 'Arial Narrow'
): Table {
  const MM_TO_TWIPS = 56.6929;
  const widthScale = fontFamily === 'Arial Narrow' ? 0.85 : 1.02;

  const titleMaxMm = signerTitleLines.reduce(
    (max, tl) => Math.max(max, measureTextWidthMm(tl.text, 12)),
    0
  );
  const nameRankMaxMm = Math.max(
    measureTextWidthMm(signerName, 12),
    measureTextWidthMm(signerRankNrp, 12)
  );
  const issuedMaxMm = issuedLines.reduce(
    (max, l) => Math.max(max, measureTextWidthMm(l, 12)),
    0
  );

  const titleMaxTwips = Math.round(titleMaxMm * widthScale * MM_TO_TWIPS);
  const nameRankMaxTwips = Math.round(nameRankMaxMm * widthScale * MM_TO_TWIPS);
  const issuedMaxTwips = Math.round(issuedMaxMm * widthScale * MM_TO_TWIPS);

  const rightCellTwips = Math.min(
    A4_CONTENT_WIDTH_TWIPS,
    Math.max(titleMaxTwips + 80, nameRankMaxTwips + 80, issuedMaxTwips + 80, 3200)
  );
  const leftCellTwips = A4_CONTENT_WIDTH_TWIPS - rightCellTwips;

  const isSingleLineTitle = signerTitleLines.length === 1;
  const titleAlign =
    isSingleLineTitle && titleMaxTwips >= nameRankMaxTwips
      ? AlignmentType.RIGHT
      : AlignmentType.CENTER;

  const issuedLeftIndentTwips = Math.max(
    0,
    Math.round((rightCellTwips - issuedMaxTwips) / 2)
  );

  const titleParagraphs = signerTitleLines.map((tLine, idx) => {
    const isFirst = idx === 0;
    const isLast = idx === signerTitleLines.length - 1;
    return para(txt(tLine.text, { sizePt: 12, fontFamily }), {
      align: titleAlign,
      beforePt: isFirst && issuedLines.length > 0 ? 2 : 0,
      afterPt: isLast ? 28 : 0.5,
    });
  });

  const zeroCellMargins = { top: 0, bottom: 0, left: 0, right: 0 };

  return new Table({
    width: { size: A4_CONTENT_WIDTH_TWIPS, type: WidthType.DXA },
    borders: NO_BORDERS,
    rows: [
      new TableRow({
        cantSplit: true,
        children: [
          new TableCell({
            width: { size: leftCellTwips, type: WidthType.DXA },
            borders: CELL_NO_BORDERS,
            margins: zeroCellMargins,
            children: [para(txt('', { sizePt: 12, fontFamily }))],
          }),
          new TableCell({
            width: { size: rightCellTwips, type: WidthType.DXA },
            borders: CELL_NO_BORDERS,
            margins: zeroCellMargins,
            children: [
              ...issuedLines.map((line, idx) =>
                para(
                  txt(line, {
                    sizePt: 12,
                    fontFamily,
                    underline: idx === issuedLines.length - 1,
                  }),
                  {
                    align: AlignmentType.LEFT,
                    leftIndentTwips: issuedLeftIndentTwips,
                    afterPt: 1,
                  }
                )
              ),
              ...titleParagraphs,
              para(txt(signerName, { sizePt: 12, fontFamily, underline: true }), {
                align: AlignmentType.CENTER,
                afterPt: 1,
              }),
              para(txt(signerRankNrp, { sizePt: 12, fontFamily }), {
                align: AlignmentType.CENTER,
                afterPt: 2,
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

export async function generateSprinDocxBlob(
  rawData: SuratPerintahData
): Promise<Blob> {
  const data = rawData;
  const crest = await loadTribrataMonochromeAsset();
  const fontFamily: SuratFontFamily = data.fontFamily ?? 'Arial Narrow';
  const sprinContLabel =
    data.sprinContinuationHeaderLabel?.trim() || 'SPRIN KAPOLSEK SMG SELATAN';
  const lampiranLabel =
    data.lampiranHeaderLabel?.trim() || 'LAMPIRAN SPRIN KAPOLSEK SMG SELATAN';

  const inlineKepadaMode =
    Boolean(data.useInlineKepadaIfFiveOrLess) &&
    data.personnelRows.length > 0;

  const labelW = 1650;
  const colonW = 280;
  const bodyW = A4_CONTENT_WIDTH_TWIPS - labelW - colonW;

  const sectionRow = (
    label: string,
    contentParagraphs: Paragraph[]
  ): TableRow =>
    new TableRow({
      children: [
        new TableCell({
          width: { size: labelW, type: WidthType.DXA },
          borders: CELL_NO_BORDERS,
          children: [para(txt(label, { sizePt: 12, fontFamily }), { afterPt: 2 })],
        }),
        new TableCell({
          width: { size: colonW, type: WidthType.DXA },
          borders: CELL_NO_BORDERS,
          children: [
            para(txt(label ? ':' : '', { sizePt: 12, fontFamily }), { afterPt: 2 }),
          ],
        }),
        new TableCell({
          width: { size: bodyW, type: WidthType.DXA },
          borders: CELL_NO_BORDERS,
          children: contentParagraphs,
        }),
      ],
    });

  const numberedParagraphs = (items: string[]): Paragraph[] =>
    items.map((item, idx) =>
      para(txt(`${idx + 1}.\t${item}`, { sizePt: 12, fontFamily }), {
        align: AlignmentType.JUSTIFIED,
        leftIndentTwips: 397,
        hangingTwips: 397,
        tabStops: [{ type: TabStopType.LEFT, position: 397 }],
        afterPt: 2.5,
      })
    );

  const sprinBodyChildren: (Paragraph | Table)[] = [
    new Table({
      width: { size: A4_CONTENT_WIDTH_TWIPS, type: WidthType.DXA },
      borders: NO_BORDERS,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 4400, type: WidthType.DXA },
              borders: CELL_NO_BORDERS,
              children: buildDocxKopBlock(
                [data.kopLine1, data.kopLine2, data.kopLine3],
                AlignmentType.CENTER,
                true,
                10.5,
                fontFamily
              ),
            }),
            new TableCell({
              width: {
                size: A4_CONTENT_WIDTH_TWIPS - 4400,
                type: WidthType.DXA,
              },
              borders: CELL_NO_BORDERS,
              children: [para(txt('', { sizePt: 12, fontFamily }))],
            }),
          ],
        }),
      ],
    }),
    para(txt('', { sizePt: 12, fontFamily }), { afterPt: 3 }),
  ];

  if (crest) {
    sprinBodyChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
        children: [
          new ImageRun({
            data: crest.bytes,
            transformation: { width: 52, height: 52 },
            type: 'png',
          }),
        ],
      })
    );
  }

  const sprinTitleLines = buildTajukTitleLines(data);

  const kepadaParagraphs: Paragraph[] = inlineKepadaMode
    ? data.personnelRows.map((row, idx) => {
        const formatted = formatSprinInlineKepadaPerson(row);
        return para(
          [
            txt(`${idx + 1}.\t`, { sizePt: 12, fontFamily }),
            txt(formatted.identityLine, {
              sizePt: 12,
              fontFamily,
              underline: true,
            }),
            new TextRun({
              text: formatted.jabatanLine,
              font: fontFamily,
              size: 24,
              color: '000000',
              break: 1,
            }),
          ],
          {
            align: AlignmentType.LEFT,
            leftIndentTwips: 397,
            hangingTwips: 397,
            tabStops: [{ type: TabStopType.LEFT, position: 397 }],
            afterPt: 3,
          }
        );
      })
    : [
        para(txt(data.kepadaText, { sizePt: 12, fontFamily }), {
          align: AlignmentType.JUSTIFIED,
          afterPt: 4,
        }),
      ];

  sprinBodyChildren.push(
    para(txt('SURAT PERINTAH', { sizePt: 12, fontFamily, underline: true }), {
      align: AlignmentType.CENTER,
      afterPt: 1,
    }),
    para(txt(`Nomor : ${data.nomor}`, { sizePt: 12, fontFamily }), {
      align: AlignmentType.CENTER,
      afterPt: 8,
    }),
    new Table({
      width: { size: A4_CONTENT_WIDTH_TWIPS, type: WidthType.DXA },
      borders: NO_BORDERS,
      rows: [
        sectionRow('Pertimbangan', [
          para(txt(data.pertimbangan, { sizePt: 12, fontFamily }), {
            align: AlignmentType.JUSTIFIED,
            afterPt: 4,
          }),
        ]),
        sectionRow('Dasar', numberedParagraphs(data.dasar)),
      ],
    }),
    para(txt('DIPERINTAHKAN', { sizePt: 12, fontFamily }), {
      align: AlignmentType.CENTER,
      beforePt: 5,
      afterPt: 5,
    }),
    new Table({
      width: { size: A4_CONTENT_WIDTH_TWIPS, type: WidthType.DXA },
      borders: NO_BORDERS,
      rows: [
        sectionRow('Kepada', kepadaParagraphs),
        sectionRow('Untuk', numberedParagraphs(data.untuk)),
        sectionRow('Selesai.', [para(txt('', { sizePt: 12, fontFamily }))]),
      ],
    }),
    para(txt('', { sizePt: 12, fontFamily }), { afterPt: 5 }),
    buildDocxSignatureTable(
      [
        `Dikeluarkan di : ${data.issuedPlace}`,
        `Pada tanggal   : ${data.issuedDateText}`,
      ],
      sprinTitleLines,
      data.signerName,
      data.signerRankNrp,
      fontFamily
    ),
    para(txt('Tembusan :', { sizePt: 12, fontFamily }), {
      beforePt: 4,
      afterPt: 2,
    }),
    ...data.tembusan
      .filter((t) => t.trim().length > 0)
      .map((t, idx) =>
        para(txt(`${idx + 1}.\t${t}`, { sizePt: 12, fontFamily }), {
          leftIndentTwips: 397,
          hangingTwips: 397,
          tabStops: [{ type: TabStopType.LEFT, position: 397 }],
          afterPt: 1,
        })
      )
  );

  const sections: ISectionOptions[] = [
    {
      properties: {
        titlePage: true,
        page: {
          size: { width: A4_WIDTH_TWIPS, height: A4_HEIGHT_TWIPS },
          margin: A4_MARGIN,
        },
      },
      headers: {
        first: new Header({ children: [] }),
        default: buildContinuationHeaderDocx(
          sprinContLabel,
          data.nomor,
          data.lampiranDateUpper,
          undefined,
          fontFamily
        ),
      },
      children: sprinBodyChildren,
    },
  ];

  if (!inlineKepadaMode) {
    const lampiranChildren: (Paragraph | Table)[] = [
      new Table({
        width: { size: A4_CONTENT_WIDTH_TWIPS, type: WidthType.DXA },
        borders: NO_BORDERS,
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 4400, type: WidthType.DXA },
                borders: CELL_NO_BORDERS,
                children: buildDocxKopBlock(
                  [data.kopLine1, data.kopLine2, data.kopLine3],
                  AlignmentType.CENTER,
                  true,
                  10,
                  fontFamily
                ),
              }),
              new TableCell({
                width: {
                  size: A4_CONTENT_WIDTH_TWIPS - 4400,
                  type: WidthType.DXA,
                },
                borders: CELL_NO_BORDERS,
                children: buildDocxKopBlock(
                  [
                    lampiranLabel,
                    `NOMOR  : ${data.nomor}`,
                    `TANGGAL: ${data.lampiranDateUpper}`,
                  ],
                  AlignmentType.LEFT,
                  true,
                  10,
                  fontFamily
                ),
              }),
            ],
          }),
        ],
      }),
      para(txt(data.lampiranTitle, { sizePt: 12, fontFamily }), {
        align: AlignmentType.CENTER,
        beforePt: 14,
        afterPt: 1,
      }),
      para(txt(data.lampiranSubtitle, { sizePt: 12, fontFamily, underline: true }), {
        align: AlignmentType.CENTER,
        afterPt: 8,
      }),
      buildDocxPersonnelTable(data.personnelRows, 'SDA', fontFamily),
      para(txt('', { sizePt: 12, fontFamily }), { afterPt: 8 }),
      buildDocxSignatureTable(
        [
          `Dikeluarkan di : ${data.issuedPlace}`,
          `Pada tanggal   : ${data.issuedDateText}`,
        ],
        sprinTitleLines,
        data.signerName,
        data.signerRankNrp,
        fontFamily
      ),
    ];

    sections.push({
      properties: {
        type: SectionType.NEXT_PAGE,
        titlePage: true,
        page: {
          size: { width: A4_WIDTH_TWIPS, height: A4_HEIGHT_TWIPS },
          margin: A4_MARGIN,
        },
      },
      headers: {
        first: new Header({ children: [] }),
        default: buildContinuationHeaderDocx(
          lampiranLabel,
          data.nomor,
          data.lampiranDateUpper,
          undefined,
          fontFamily
        ),
      },
      children: lampiranChildren,
    });
  }

  const doc = new Document({ sections });
  return Packer.toBlob(doc);
}

function buildSuratBiasaBodyParagraphs(
  paragraphs: string[],
  fontFamily: SuratFontFamily = 'Arial Narrow',
  uppercase = false
): Paragraph[] {
  const MM_TO_TWIPS = 56.6929;
  const out: Paragraph[] = [];
  for (const block of paragraphs) {
    const lines = block.split('\n');
    let blockFallbackIndentMm = 0;
    lines.forEach((rawLine, idx) => {
      const trimmed = rawLine.trim();
      if (!trimmed) {
        out.push(para(txt('', { sizePt: 12, fontFamily }), { afterPt: 2 }));
        return;
      }

      const parsed = parseNumberedParagraphLine(trimmed, blockFallbackIndentMm);
      blockFallbackIndentMm = parsed.textIndentMm;

      const markerText =
        parsed.marker && uppercase ? toKapital(parsed.marker) : parsed.marker;
      const bodyText = uppercase
        ? toKapital(parsed.bodyText)
        : parsed.bodyText;

      const leftTwips = Math.round(parsed.textIndentMm * MM_TO_TWIPS);
      const markerTwips = Math.round(parsed.markerIndentMm * MM_TO_TWIPS);

      if (markerText) {
        const hangingTwips = Math.max(0, leftTwips - markerTwips);
        out.push(
          para(
            txt(`${markerText}\t${bodyText}`, {
              sizePt: 12,
              fontFamily,
            }),
            {
              align: AlignmentType.JUSTIFIED,
              leftIndentTwips: leftTwips,
              hangingTwips,
              tabStops: [{ type: TabStopType.LEFT, position: leftTwips }],
              afterPt: idx === lines.length - 1 ? 4.5 : 1.5,
            }
          )
        );
      } else {
        out.push(
          para(txt(bodyText, { sizePt: 12, fontFamily }), {
            align: AlignmentType.JUSTIFIED,
            leftIndentTwips: leftTwips > 0 ? leftTwips : undefined,
            afterPt: idx === lines.length - 1 ? 4.5 : 1.5,
          })
        );
      }
    });
  }
  return out;
}

export async function generateSuratBiasaDocxBlob(
  rawData: SuratBiasaData
): Promise<Blob> {
  const data = rawData;
  const crest = await loadTribrataMonochromeAsset();
  const fontFamily: SuratFontFamily = data.fontFamily ?? 'Arial Narrow';
  const headerLabel =
    data.page2HeaderLabel?.trim() || 'SURAT KAPOLSEK SMG SELATAN';
  const klasTrim = data.klasifikasi.trim().toUpperCase();
  const classificationBanner =
    klasTrim && klasTrim !== 'BIASA' ? klasTrim : undefined;

  const leftHeaderColTwips = 5500;
  const rightHeaderColTwips = A4_CONTENT_WIDTH_TWIPS - leftHeaderColTwips;
  const rightColIndentTwips = 480;
  const zeroCellMargins = { top: 0, bottom: 0, left: 0, right: 0 };

  const kopCellChildren: Paragraph[] = [];
  if (crest) {
    kopCellChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
        children: [
          new ImageRun({
            data: crest.bytes,
            transformation: { width: 52, height: 52 },
            type: 'png',
          }),
        ],
      })
    );
  }
  kopCellChildren.push(
    ...buildDocxKopBlock(
      [data.kopLine1, data.kopLine2, data.kopLine3].filter(
        (l) => l.trim().length > 0
      ),
      AlignmentType.CENTER,
      false,
      10.5,
      fontFamily
    ),
    para(
      txt(data.kopAddress, {
        sizePt: 10.5,
        fontFamily,
        underline: true,
      }),
      { align: AlignmentType.CENTER, afterPt: 0 }
    )
  );

  const metaTabStops = [
    { type: TabStopType.LEFT, position: 1300 },
    { type: TabStopType.LEFT, position: 1470 },
  ];

  const children: (Paragraph | Table)[] = [];
  children.push(
    new Table({
      width: { size: A4_CONTENT_WIDTH_TWIPS, type: WidthType.DXA },
      borders: NO_BORDERS,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: leftHeaderColTwips, type: WidthType.DXA },
              borders: CELL_NO_BORDERS,
              margins: zeroCellMargins,
              children: kopCellChildren,
            }),
            new TableCell({
              width: { size: rightHeaderColTwips, type: WidthType.DXA },
              borders: CELL_NO_BORDERS,
              margins: zeroCellMargins,
              verticalAlign: VerticalAlignTable.BOTTOM,
              children: [
                para(txt(data.dateRightText, { sizePt: 12, fontFamily }), {
                  align: AlignmentType.LEFT,
                  leftIndentTwips: 0,
                  afterPt: 0,
                }),
              ],
            }),
          ],
        }),
      ],
    }),
    // 2 baris di bawah kop naskah dinas
    para(txt('', { sizePt: 12, fontFamily }), { afterPt: 14 }),
    new Table({
      width: { size: A4_CONTENT_WIDTH_TWIPS, type: WidthType.DXA },
      borders: NO_BORDERS,
      rows: [
        // Baris 1: Nomor, Klasifikasi, Lampiran (di atas Hal & Kepada)
        new TableRow({
          children: [
            new TableCell({
              width: { size: leftHeaderColTwips, type: WidthType.DXA },
              borders: CELL_NO_BORDERS,
              margins: zeroCellMargins,
              children: [
                para(
                  txt(`Nomor\t:\t${data.nomor}`, { sizePt: 12, fontFamily }),
                  {
                    leftIndentTwips: 1470,
                    hangingTwips: 1470,
                    tabStops: metaTabStops,
                    afterPt: 1,
                  }
                ),
                para(
                  txt(`Klasifikasi\t:\t${data.klasifikasi}`, {
                    sizePt: 12,
                    fontFamily,
                  }),
                  {
                    leftIndentTwips: 1470,
                    hangingTwips: 1470,
                    tabStops: metaTabStops,
                    afterPt: 1,
                  }
                ),
                para(
                  txt(`Lampiran\t:\t${data.lampiran}`, {
                    sizePt: 12,
                    fontFamily,
                  }),
                  {
                    leftIndentTwips: 1470,
                    hangingTwips: 1470,
                    tabStops: metaTabStops,
                    afterPt: 1,
                  }
                ),
              ],
            }),
            new TableCell({
              width: { size: rightHeaderColTwips, type: WidthType.DXA },
              borders: CELL_NO_BORDERS,
              margins: zeroCellMargins,
              children: [para(txt('', { sizePt: 12, fontFamily }), { afterPt: 0 })],
            }),
          ],
        }),
        // Baris 2: Hal sejajar satu baris dengan Kepada; Yth. sejajar vertikal dengan Tempat & Tanggal
        new TableRow({
          children: [
            new TableCell({
              width: { size: leftHeaderColTwips, type: WidthType.DXA },
              borders: CELL_NO_BORDERS,
              margins: zeroCellMargins,
              children: [
                para(
                  txt(`Hal\t:\t${data.perihal}`, {
                    sizePt: 12,
                    fontFamily,
                  }),
                  {
                    leftIndentTwips: 1470,
                    hangingTwips: 1470,
                    tabStops: metaTabStops,
                    afterPt: 2,
                  }
                ),
              ],
            }),
            new TableCell({
              width: { size: rightHeaderColTwips, type: WidthType.DXA },
              borders: CELL_NO_BORDERS,
              margins: zeroCellMargins,
              children: [
                para(txt('Kepada', { sizePt: 12, fontFamily }), {
                  leftIndentTwips: rightColIndentTwips,
                  afterPt: 2,
                }),
                para(txt(`Yth.\t${data.kepadaYth}`, { sizePt: 12, fontFamily }), {
                  leftIndentTwips: rightColIndentTwips,
                  hangingTwips: rightColIndentTwips,
                  tabStops: [
                    { type: TabStopType.LEFT, position: rightColIndentTwips },
                  ],
                  afterPt: 2,
                }),
                para(txt('di', { sizePt: 12, fontFamily }), {
                  leftIndentTwips: rightColIndentTwips,
                  afterPt: 2,
                }),
                para(txt(data.diKota, { sizePt: 12, fontFamily }), {
                  leftIndentTwips: rightColIndentTwips,
                  afterPt: 2,
                }),
              ],
            }),
          ],
        }),
      ],
    })
  );

  if (data.upText.trim()) {
    children.push(
      para(txt(data.upText, { sizePt: 12, fontFamily }), {
        leftIndentTwips: 360,
        beforePt: 4,
        afterPt: 5,
      })
    );
  } else {
    children.push(para(txt('', { sizePt: 12, fontFamily }), { afterPt: 4 }));
  }

  children.push(
    ...buildSuratBiasaBodyParagraphs(
      [...rawData.paragraphsPage1, ...rawData.paragraphsPage2],
      fontFamily,
      false
    )
  );

  if (data.includePersonnelTable && data.personnelRows.length > 0) {
    if (data.personnelTableTitle.trim()) {
      children.push(
        para(
          txt(data.personnelTableTitle, { sizePt: 12, fontFamily, bold: true }),
          {
            align: AlignmentType.CENTER,
            beforePt: 4,
            afterPt: 4,
          }
        )
      );
    }
    children.push(
      buildDocxPersonnelTable(data.personnelRows, '', fontFamily),
      para(txt('', { sizePt: 12, fontFamily }), { afterPt: 8 })
    );
  }

  children.push(
    para(txt('', { sizePt: 12, fontFamily }), { afterPt: 5 }),
    buildDocxSignatureTable(
      [],
      buildTajukTitleLines(data),
      data.signerName,
      data.signerRankNrp,
      fontFamily
    ),
    para(txt('Tembusan :', { sizePt: 12, fontFamily }), {
      beforePt: 4,
      afterPt: 2,
    }),
    ...data.tembusan
      .filter((t) => t.trim().length > 0)
      .map((t, idx) =>
        para(txt(`${idx + 1}.\t${t}`, { sizePt: 12, fontFamily }), {
          leftIndentTwips: 397,
          hangingTwips: 397,
          tabStops: [{ type: TabStopType.LEFT, position: 397 }],
          afterPt: 1,
        })
      )
  );

  const firstHeader = classificationBanner
    ? new Header({
        children: [
          para(txt(classificationBanner, { sizePt: 10, fontFamily }), {
            align: AlignmentType.CENTER,
            afterPt: 0,
          }),
        ],
      })
    : new Header({ children: [] });

  const classFooter = classificationBanner
    ? new Footer({
        children: [
          para(txt(classificationBanner, { sizePt: 10, fontFamily }), {
            align: AlignmentType.CENTER,
            afterPt: 0,
          }),
        ],
      })
    : undefined;

  const doc = new Document({
    sections: [
      {
        properties: {
          titlePage: true,
          page: {
            size: { width: A4_WIDTH_TWIPS, height: A4_HEIGHT_TWIPS },
            margin: A4_MARGIN,
          },
        },
        headers: {
          first: firstHeader,
          default: buildContinuationHeaderDocx(
            headerLabel,
            data.nomor,
            data.page2DateUpper,
            classificationBanner,
            fontFamily
          ),
        },
        footers: classFooter
          ? { first: classFooter, default: classFooter }
          : undefined,
        children,
      },
    ],
  });

  return Packer.toBlob(doc);
}
