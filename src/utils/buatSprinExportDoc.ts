import {
  AlignmentType,
  BorderStyle,
  convertMillimetersToTwip,
  Document,
  HorizontalPositionRelativeFrom,
  ImageRun,
  Packer,
  PageBreak,
  Paragraph,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  TextWrappingType,
  UnderlineType,
  VerticalAlign,
  VerticalPositionRelativeFrom,
  WidthType,
} from 'docx';
import { DEFAULT_STAMP_CONFIG } from '../data/buatSprinDefaultData';
import { SprinDocument, StampSignatureConfig } from '../types/buatSprin';

const FONT_FAMILY = 'Arial';
const FONT_SIZE_12PT = 24; // 24 half-points = 12pt
const LINE_SPACING_1_0 = 240; // 240 = single line spacing (1.0)
const EMU_PER_MM = 36000;
const PX_PER_CM = 96 / 2.54;

const NO_BORDERS = {
  top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
};

const ALL_SOLID_BORDERS = {
  top: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
  bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
  left: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
  right: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
};

function run(
  text: string,
  opts?: {
    underline?: boolean;
    size?: number;
    bold?: boolean;
  }
): TextRun {
  return new TextRun({
    text,
    font: FONT_FAMILY,
    size: opts?.size ?? FONT_SIZE_12PT,
    bold: opts?.bold,
    color: '000000',
    underline: opts?.underline ? { type: UnderlineType.SINGLE } : undefined,
  });
}

function para(
  children: (TextRun | ImageRun | PageBreak)[] | string,
  opts?: {
    alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
    spaceBefore?: number;
    spaceAfter?: number;
    indentLeft?: number;
    borderBottom?: boolean;
  }
): Paragraph {
  const runs = typeof children === 'string' ? [run(children)] : children;
  return new Paragraph({
    children: runs,
    alignment: opts?.alignment ?? AlignmentType.LEFT,
    spacing: {
      line: LINE_SPACING_1_0,
      before: opts?.spaceBefore ?? 0,
      after: opts?.spaceAfter ?? 0,
    },
    indent: opts?.indentLeft ? { left: opts.indentLeft } : undefined,
    border: opts?.borderBottom
      ? {
          bottom: {
            style: BorderStyle.SINGLE,
            size: 6,
            color: '000000',
            space: 1,
          },
        }
      : undefined,
  });
}

async function fetchPngBytes(url: string): Promise<Uint8Array | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    return new Uint8Array(buf);
  } catch {
    return null;
  }
}

async function rasterizeImageUrlToPng(
  dataUrl: string,
  removeWhiteBackground: boolean
): Promise<{ data: Uint8Array; width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const w = Math.max(1, img.naturalWidth || 300);
        const h = Math.max(1, img.naturalHeight || 300);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        if (removeWhiteBackground) {
          const imgData = ctx.getImageData(0, 0, w, h);
          const d = imgData.data;
          for (let i = 0; i < d.length; i += 4) {
            const r = d[i];
            const g = d[i + 1];
            const b = d[i + 2];
            if (r > 235 && g > 235 && b > 235) {
              d[i + 3] = 0;
            }
          }
          ctx.putImageData(imgData, 0, 0);
        }
        canvas.toBlob(async (blob) => {
          if (!blob) {
            resolve(null);
            return;
          }
          const ab = await blob.arrayBuffer();
          resolve({ data: new Uint8Array(ab), width: w, height: h });
        }, 'image/png');
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

function escapeXmlText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildDefaultStampSvg(resorText: string, sektorText: string): string {
  const c = '#6A3EC8';
  const stripes = [40, 47, 54, 61, 68, 75, 82, 89, 96, 103, 110, 117, 124, 131, 138]
    .map(
      (x) =>
        `<line x1="${x}" y1="34" x2="${x}" y2="74" stroke="${c}" stroke-width="1.4"/>` +
        `<line x1="${x}" y1="106" x2="${x}" y2="146" stroke="${c}" stroke-width="1.4"/>`
    )
    .join('');

  const miniTri = (cx: number, cy: number) => `
    <g transform="translate(${cx - 13}, ${cy - 13}) scale(0.26)">
      <polygon points="50,6 52,13 59,13 53.5,17 55.5,24 50,19.8 44.5,24 46.5,17 41,13 48,13" fill="${c}"/>
      <polygon points="32,14 33.6,19 39,19 34.8,22 36.2,27 32,24 27.8,27 29.2,22 25,19 30.4,19" fill="${c}"/>
      <polygon points="68,14 69.6,19 75,19 70.8,22 72.2,27 68,24 63.8,27 65.2,22 61,19 66.4,19" fill="${c}"/>
      <path d="M22 34C10 46 8 64 16 78C24 90 36 95 50 96C64 95 76 90 84 78C92 64 90 46 78 34" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round"/>
      <path d="M50 26L72 36V58C72 72 62 82 50 88C38 82 28 72 28 58V36L50 26Z" fill="${c}"/>
      <path d="M50 32L66 39V56C66 67 58 75 50 80C42 75 34 67 34 56V39L50 32Z" fill="#ffffff"/>
      <rect x="46" y="45" width="8" height="26" fill="${c}"/>
      <circle cx="50" cy="40" r="4" fill="${c}"/>
      <path d="M24 84H76L72 93H28L24 84Z" fill="#ffffff" stroke="${c}" stroke-width="3.5"/>
    </g>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" width="360" height="360">
    <defs>
      <path id="topArc" d="M 22,90 A 68,68 0 1,1 158,90"/>
      <path id="botArc" d="M 20,96 A 70,70 0 0,0 160,96"/>
      <clipPath id="inClip"><circle cx="90" cy="90" r="54.5"/></clipPath>
    </defs>
    <circle cx="90" cy="90" r="85" fill="none" stroke="${c}" stroke-width="3.2"/>
    <circle cx="90" cy="90" r="81" fill="none" stroke="${c}" stroke-width="1"/>
    <circle cx="90" cy="90" r="55" fill="none" stroke="${c}" stroke-width="1.8"/>
    <g clip-path="url(#inClip)">${stripes}</g>
    <rect x="36" y="74" width="108" height="32" fill="none"/>
    <line x1="36" y1="74" x2="144" y2="74" stroke="${c}" stroke-width="1.8"/>
    <line x1="36" y1="106" x2="144" y2="106" stroke="${c}" stroke-width="1.8"/>
    <text x="91" y="97" text-anchor="middle" fill="${c}" font-size="19" font-weight="700" letter-spacing="5.5" font-family="Arial, sans-serif">KEPALA</text>
    <text fill="${c}" font-size="10.8" font-weight="600" font-family="Arial, sans-serif" letter-spacing="0.8">
      <textPath href="#topArc" startOffset="50%" text-anchor="middle">${escapeXmlText(resorText.toUpperCase())}</textPath>
    </text>
    <text fill="${c}" font-size="10.8" font-weight="600" font-family="Arial, sans-serif" letter-spacing="0.8">
      <textPath href="#botArc" startOffset="50%" text-anchor="middle">${escapeXmlText(sektorText.toUpperCase())}</textPath>
    </text>
    <circle cx="22" cy="90" r="18" fill="#ffffff" stroke="${c}" stroke-width="1.8"/>
    ${miniTri(22, 90)}
    <circle cx="158" cy="90" r="18" fill="#ffffff" stroke="${c}" stroke-width="1.8"/>
    ${miniTri(158, 90)}
  </svg>`;
}

function buildDefaultSignatureSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" width="540" height="285">
    <path d="M 52,32 L 49,17 C 48,55 44,115 41,160 C 41,165 44,167 46,164" fill="none" stroke="#0A0A0A" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M 31,115 C 31,94 64,74 80,77 C 86,79 68,100 47,112 C 62,107 74,108 82,114 C 89,119 95,116 98,111" fill="none" stroke="#0A0A0A" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M 106,44 L 103,35 C 102,75 106,132 111,172" fill="none" stroke="#0A0A0A" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M 129,108 L 132,81 C 122,87 116,99 120,108 C 125,116 144,118 159,122 C 151,128 140,131 132,131 C 138,125 147,120 155,117" fill="none" stroke="#0A0A0A" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M 131,92 C 143,86 157,84 167,85 C 169,91 163,98 164,102 C 167,104 171,105 173,108 C 218,104 282,105 340,107" fill="none" stroke="#0A0A0A" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

function buildKopTable(doc: SprinDocument): Table {
  return new Table({
    layout: TableLayoutType.AUTOFIT,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: {
              ...NO_BORDERS,
              bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
            },
            margins: { top: 0, bottom: 30, left: 0, right: 0 },
            children: [
              para(doc.kopLine1, { alignment: AlignmentType.CENTER }),
              para(doc.kopLine2, { alignment: AlignmentType.CENTER }),
              para(doc.kopLine3, { alignment: AlignmentType.CENTER }),
            ],
          }),
        ],
      }),
    ],
  });
}

function buildSignatureBlockTable(
  doc: SprinDocument,
  tanggalLabel: string,
  tanggalValue: string,
  stampAsset: { data: Uint8Array; widthPx: number; heightPx: number; offsetXMm: number; offsetYMm: number } | null,
  sigAsset: { data: Uint8Array; widthPx: number; heightPx: number; offsetXMm: number; offsetYMm: number } | null,
  aboveText: boolean
): Table {
  const spacerRuns: (TextRun | ImageRun)[] = [run(' ')];

  if (stampAsset) {
    spacerRuns.push(
      new ImageRun({
        type: 'png',
        data: stampAsset.data,
        transformation: {
          width: stampAsset.widthPx,
          height: stampAsset.heightPx,
        },
        floating: {
          horizontalPosition: {
            relative: HorizontalPositionRelativeFrom.COLUMN,
            offset: Math.round(stampAsset.offsetXMm * EMU_PER_MM),
          },
          verticalPosition: {
            relative: VerticalPositionRelativeFrom.PARAGRAPH,
            offset: Math.round((stampAsset.offsetYMm - 18) * EMU_PER_MM),
          },
          wrap: { type: TextWrappingType.NONE },
          behindDocument: !aboveText,
          allowOverlap: true,
        },
      })
    );
  }

  if (sigAsset) {
    spacerRuns.push(
      new ImageRun({
        type: 'png',
        data: sigAsset.data,
        transformation: {
          width: sigAsset.widthPx,
          height: sigAsset.heightPx,
        },
        floating: {
          horizontalPosition: {
            relative: HorizontalPositionRelativeFrom.COLUMN,
            offset: Math.round(sigAsset.offsetXMm * EMU_PER_MM),
          },
          verticalPosition: {
            relative: VerticalPositionRelativeFrom.PARAGRAPH,
            offset: Math.round((sigAsset.offsetYMm - 18) * EMU_PER_MM),
          },
          wrap: { type: TextWrappingType.NONE },
          behindDocument: !aboveText,
          allowOverlap: true,
        },
      })
    );
  }

  const labelColWidth = convertMillimetersToTwip(34);
  const colonColWidth = convertMillimetersToTwip(4);
  const valColWidth = convertMillimetersToTwip(50);

  return new Table({
    width: { size: convertMillimetersToTwip(175), type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: convertMillimetersToTwip(77), type: WidthType.DXA },
            borders: NO_BORDERS,
            children: [para('')],
          }),
          new TableCell({
            width: { size: convertMillimetersToTwip(98), type: WidthType.DXA },
            borders: NO_BORDERS,
            children: [
              // Dikeluarkan di / Pada tanggal nested mini-table for neat colon alignment
              new Table({
                width: { size: convertMillimetersToTwip(88), type: WidthType.DXA },
                layout: TableLayoutType.FIXED,
                alignment: AlignmentType.CENTER,
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        width: { size: labelColWidth, type: WidthType.DXA },
                        borders: NO_BORDERS,
                        children: [para('Dikeluarkan di')],
                      }),
                      new TableCell({
                        width: { size: colonColWidth, type: WidthType.DXA },
                        borders: NO_BORDERS,
                        children: [para(':')],
                      }),
                      new TableCell({
                        width: { size: valColWidth, type: WidthType.DXA },
                        borders: NO_BORDERS,
                        children: [para(doc.dikeluarkanDi)],
                      }),
                    ],
                  }),
                  new TableRow({
                    children: [
                      new TableCell({
                        width: { size: labelColWidth, type: WidthType.DXA },
                        borders: {
                          ...NO_BORDERS,
                          bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
                        },
                        children: [para(tanggalLabel)],
                      }),
                      new TableCell({
                        width: { size: colonColWidth, type: WidthType.DXA },
                        borders: {
                          ...NO_BORDERS,
                          bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
                        },
                        children: [para(':')],
                      }),
                      new TableCell({
                        width: { size: valColWidth, type: WidthType.DXA },
                        borders: {
                          ...NO_BORDERS,
                          bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
                        },
                        children: [para(tanggalValue)],
                      }),
                    ],
                  }),
                ],
              }),
              para(doc.pejabatJabatan, {
                alignment: AlignmentType.CENTER,
                spaceBefore: 80,
              }),
              para(spacerRuns, {
                alignment: AlignmentType.CENTER,
                spaceBefore: 480,
                spaceAfter: 480,
              }),
              para([run(doc.pejabatNama.toUpperCase(), { underline: true })], {
                alignment: AlignmentType.CENTER,
              }),
              para(doc.pejabatPangkatNrp.toUpperCase(), {
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

export async function exportSprinToWord(doc: SprinDocument): Promise<void> {
  const tribrataBytes = await fetchPngBytes('/assets/aistudio/tb__1__e5e5aec3.png');

  const stampCfg: StampSignatureConfig = {
    ...DEFAULT_STAMP_CONFIG,
    ...(doc.stampConfig || {}),
  };

  let stampAsset: {
    data: Uint8Array;
    widthPx: number;
    heightPx: number;
    offsetXMm: number;
    offsetYMm: number;
  } | null = null;
  let sigAsset: {
    data: Uint8Array;
    widthPx: number;
    heightPx: number;
    offsetXMm: number;
    offsetYMm: number;
  } | null = null;

  if (doc.showStampAndSignature) {
    const stampSource =
      stampCfg.stampImageDataUrl ||
      `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
        buildDefaultStampSvg(doc.stampResorText, doc.stampSektorText)
      )}`;
    const rasterStamp = await rasterizeImageUrlToPng(
      stampSource,
      Boolean(stampCfg.stampImageDataUrl && stampCfg.stampMultiplyBlend)
    );
    if (rasterStamp) {
      const sizePx = Math.round(stampCfg.stampSizeCm * PX_PER_CM);
      stampAsset = {
        data: rasterStamp.data,
        widthPx: sizePx,
        heightPx: sizePx,
        offsetXMm: stampCfg.stampOffsetXMm,
        offsetYMm: stampCfg.stampOffsetYMm,
      };
    }

    const sigSource =
      stampCfg.signatureImageDataUrl ||
      `data:image/svg+xml;charset=utf-8,${encodeURIComponent(buildDefaultSignatureSvg())}`;
    const rasterSig = await rasterizeImageUrlToPng(
      sigSource,
      Boolean(stampCfg.signatureImageDataUrl && stampCfg.signatureMultiplyBlend)
    );
    if (rasterSig) {
      const widthPx = Math.round(stampCfg.signatureWidthCm * PX_PER_CM);
      const heightPx = Math.round(widthPx * (rasterSig.height / rasterSig.width));
      sigAsset = {
        data: rasterSig.data,
        widthPx,
        heightPx,
        offsetXMm: stampCfg.signatureOffsetXMm,
        offsetYMm: stampCfg.signatureOffsetYMm,
      };
    }
  }

  // Body column widths (total printable width = 210 - 20 - 15 = 175 mm)
  const labelW = convertMillimetersToTwip(32);
  const colonW = convertMillimetersToTwip(5);
  const contentW = convertMillimetersToTwip(138);
  const numSubW = convertMillimetersToTwip(7);
  const textSubW = convertMillimetersToTwip(131);

  // Dasar cell content
  const dasarCellChildren: (Paragraph | Table)[] =
    doc.dasarList.length <= 1
      ? [para(doc.dasarList[0] || '', { alignment: AlignmentType.JUSTIFIED })]
      : [
          new Table({
            width: { size: contentW, type: WidthType.DXA },
            layout: TableLayoutType.FIXED,
            rows: doc.dasarList.map(
              (item, idx) =>
                new TableRow({
                  children: [
                    new TableCell({
                      width: { size: numSubW, type: WidthType.DXA },
                      borders: NO_BORDERS,
                      children: [para(`${idx + 1}.`)],
                    }),
                    new TableCell({
                      width: { size: textSubW, type: WidthType.DXA },
                      borders: NO_BORDERS,
                      children: [
                        para(item, { alignment: AlignmentType.JUSTIFIED, spaceAfter: 60 }),
                      ],
                    }),
                  ],
                })
            ),
          }),
        ];

  // Kepada cell content
  let kepadaCellChildren: (Paragraph | Table)[] = [para(doc.kepadaText.toUpperCase())];
  if (!doc.useLampiran && doc.personelList.length === 1) {
    const p = doc.personelList[0];
    const line1 = [p.pangkat, p.nama, p.nrp ? `NRP ${p.nrp}` : '']
      .filter(Boolean)
      .join(' ')
      .toUpperCase();
    kepadaCellChildren = [para([run(line1, { underline: true })])];
    if (p.jabatan) kepadaCellChildren.push(para(p.jabatan.toUpperCase()));
    if (p.ket) kepadaCellChildren.push(para(p.ket.toUpperCase()));
  } else if (!doc.useLampiran && doc.personelList.length > 1) {
    kepadaCellChildren = [
      new Table({
        width: { size: contentW, type: WidthType.DXA },
        layout: TableLayoutType.FIXED,
        rows: doc.personelList.map((p, idx) => {
          const line1 = [p.pangkat, p.nama, p.nrp ? `NRP ${p.nrp}` : '']
            .filter(Boolean)
            .join(' ')
            .toUpperCase();
          const pParas: Paragraph[] = [para([run(line1, { underline: true })])];
          if (p.jabatan) pParas.push(para(p.jabatan.toUpperCase()));
          if (p.ket) pParas.push(para(p.ket.toUpperCase()));
          return new TableRow({
            children: [
              new TableCell({
                width: { size: numSubW, type: WidthType.DXA },
                borders: NO_BORDERS,
                children: [para(`${idx + 1}.`)],
              }),
              new TableCell({
                width: { size: textSubW, type: WidthType.DXA },
                borders: NO_BORDERS,
                children: pParas,
              }),
            ],
          });
        }),
      }),
    ];
  }

  // Untuk cell content
  const untukTable = new Table({
    width: { size: contentW, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    rows: doc.untukList.map(
      (item, idx) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: numSubW, type: WidthType.DXA },
              borders: NO_BORDERS,
              children: [para(`${idx + 1}.`)],
            }),
            new TableCell({
              width: { size: textSubW, type: WidthType.DXA },
              borders: NO_BORDERS,
              children: [para(item, { alignment: AlignmentType.JUSTIFIED, spaceAfter: 80 })],
            }),
          ],
        })
    ),
  });

  const bodyTable = new Table({
    width: { size: convertMillimetersToTwip(175), type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: labelW, type: WidthType.DXA },
            borders: NO_BORDERS,
            margins: { bottom: 120 },
            children: [para('Pertimbangan')],
          }),
          new TableCell({
            width: { size: colonW, type: WidthType.DXA },
            borders: NO_BORDERS,
            margins: { bottom: 120 },
            children: [para(':')],
          }),
          new TableCell({
            width: { size: contentW, type: WidthType.DXA },
            borders: NO_BORDERS,
            margins: { bottom: 120 },
            children: [para(doc.pertimbangan, { alignment: AlignmentType.JUSTIFIED })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: labelW, type: WidthType.DXA },
            borders: NO_BORDERS,
            margins: { bottom: 120 },
            children: [para('Dasar')],
          }),
          new TableCell({
            width: { size: colonW, type: WidthType.DXA },
            borders: NO_BORDERS,
            margins: { bottom: 120 },
            children: [para(':')],
          }),
          new TableCell({
            width: { size: contentW, type: WidthType.DXA },
            borders: NO_BORDERS,
            margins: { bottom: 120 },
            children: dasarCellChildren,
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 3,
            borders: NO_BORDERS,
            margins: { top: 80, bottom: 120 },
            children: [para('DIPERINTAHKAN', { alignment: AlignmentType.CENTER })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: labelW, type: WidthType.DXA },
            borders: NO_BORDERS,
            margins: { bottom: 120 },
            children: [para('Kepada')],
          }),
          new TableCell({
            width: { size: colonW, type: WidthType.DXA },
            borders: NO_BORDERS,
            margins: { bottom: 120 },
            children: [para(':')],
          }),
          new TableCell({
            width: { size: contentW, type: WidthType.DXA },
            borders: NO_BORDERS,
            margins: { bottom: 120 },
            children: kepadaCellChildren,
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: labelW, type: WidthType.DXA },
            borders: NO_BORDERS,
            margins: { bottom: 100 },
            children: [para('Untuk')],
          }),
          new TableCell({
            width: { size: colonW, type: WidthType.DXA },
            borders: NO_BORDERS,
            margins: { bottom: 100 },
            children: [para(':')],
          }),
          new TableCell({
            width: { size: contentW, type: WidthType.DXA },
            borders: NO_BORDERS,
            margins: { bottom: 100 },
            children: [untukTable],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 3,
            borders: NO_BORDERS,
            children: [para('Selesai.')],
          }),
        ],
      }),
    ],
  });

  const pageOneChildren: (Paragraph | Table)[] = [
    buildKopTable(doc),
    ...(tribrataBytes
      ? [
          para(
            [
              new ImageRun({
                type: 'png',
                data: tribrataBytes,
                transformation: { width: 58, height: 54 },
              }),
            ],
            { alignment: AlignmentType.CENTER, spaceBefore: 100, spaceAfter: 60 }
          ),
        ]
      : []),
    para([run('SURAT PERINTAH', { underline: true })], {
      alignment: AlignmentType.CENTER,
    }),
    para(`Nomor : ${doc.nomorSprin}`, {
      alignment: AlignmentType.CENTER,
      spaceAfter: 200,
    }),
    bodyTable,
    para('', { spaceBefore: 160 }),
    buildSignatureBlockTable(
      doc,
      doc.useLampiran ? 'Pada tanggal' : 'pada tanggal',
      doc.tanggalSuratHal1,
      stampAsset,
      sigAsset,
      stampCfg.aboveText
    ),
    para('Tembusan:', { spaceBefore: 180, spaceAfter: 60 }),
    ...doc.tembusanList.map((item, idx) => para(`${idx + 1}. ${item}`)),
  ];

  // Optional Page 2 (Lampiran)
  const pageTwoChildren: (Paragraph | Table)[] = [];
  if (doc.useLampiran) {
    pageTwoChildren.push(para([new PageBreak()]));

    pageTwoChildren.push(
      new Table({
        width: { size: convertMillimetersToTwip(175), type: WidthType.DXA },
        layout: TableLayoutType.FIXED,
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: convertMillimetersToTwip(83), type: WidthType.DXA },
                borders: NO_BORDERS,
                children: [buildKopTable(doc)],
              }),
              new TableCell({
                width: { size: convertMillimetersToTwip(92), type: WidthType.DXA },
                borders: NO_BORDERS,
                children: [
                  para(doc.lampiranHeaderTitle, { borderBottom: true }),
                  para(`NOMOR   : ${doc.lampiranNomor}`, { borderBottom: true }),
                  para(`TANGGAL : ${doc.lampiranTanggalUpper}`, { borderBottom: true }),
                ],
              }),
            ],
          }),
        ],
      })
    );

    pageTwoChildren.push(
      para(doc.lampiranJudul.toUpperCase(), {
        alignment: AlignmentType.CENTER,
        spaceBefore: 240,
      }),
      para([run(doc.lampiranSubjudul.toUpperCase(), { underline: true })], {
        alignment: AlignmentType.CENTER,
        spaceAfter: 160,
      })
    );

    const colWidths = [
      convertMillimetersToTwip(11),
      convertMillimetersToTwip(43),
      convertMillimetersToTwip(26),
      convertMillimetersToTwip(26),
      convertMillimetersToTwip(53),
      convertMillimetersToTwip(16),
    ];

    const headerTitles = ['NO', 'NAMA', 'PANGKAT', 'NRP', 'JABATAN', 'KET'];
    const headerRow1 = new TableRow({
      tableHeader: true,
      children: headerTitles.map(
        (title, idx) =>
          new TableCell({
            width: { size: colWidths[idx], type: WidthType.DXA },
            borders: ALL_SOLID_BORDERS,
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 60, bottom: 60, left: 60, right: 60 },
            children: [para(title, { alignment: AlignmentType.CENTER })],
          })
      ),
    });

    const headerRow2 = new TableRow({
      tableHeader: true,
      children: ['1', '2', '3', '4', '5', '6'].map(
        (num, idx) =>
          new TableCell({
            width: { size: colWidths[idx], type: WidthType.DXA },
            borders: ALL_SOLID_BORDERS,
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 30, bottom: 30, left: 40, right: 40 },
            children: [para(num, { alignment: AlignmentType.CENTER })],
          })
      ),
    });

    const personnelTableRows = doc.personelList.map(
      (p, idx) =>
        new TableRow({
          children: [
            { text: `${idx + 1}`, align: AlignmentType.CENTER },
            { text: p.nama.toUpperCase(), align: AlignmentType.LEFT },
            { text: p.pangkat.toUpperCase(), align: AlignmentType.CENTER },
            { text: p.nrp, align: AlignmentType.CENTER },
            { text: p.jabatan.toUpperCase(), align: AlignmentType.CENTER },
            { text: p.ket.toUpperCase(), align: AlignmentType.CENTER },
          ].map(
            (cell, cIdx) =>
              new TableCell({
                width: { size: colWidths[cIdx], type: WidthType.DXA },
                borders: ALL_SOLID_BORDERS,
                verticalAlign: VerticalAlign.CENTER,
                margins: { top: 50, bottom: 50, left: 60, right: 60 },
                children: [para(cell.text, { alignment: cell.align })],
              })
          ),
        })
    );

    pageTwoChildren.push(
      new Table({
        width: { size: convertMillimetersToTwip(175), type: WidthType.DXA },
        layout: TableLayoutType.FIXED,
        rows: [headerRow1, headerRow2, ...personnelTableRows],
      })
    );

    pageTwoChildren.push(
      para('', { spaceBefore: 160 }),
      buildSignatureBlockTable(
        doc,
        'Pada tanggal',
        doc.tanggalSuratHal2,
        stampAsset,
        sigAsset,
        stampCfg.aboveText
      )
    );
  }

  const wordDoc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: FONT_FAMILY,
            size: FONT_SIZE_12PT,
            color: '000000',
          },
          paragraph: {
            spacing: {
              line: LINE_SPACING_1_0,
              before: 0,
              after: 0,
            },
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              width: convertMillimetersToTwip(210),
              height: convertMillimetersToTwip(297),
            },
            margin: {
              top: convertMillimetersToTwip(20),
              right: convertMillimetersToTwip(15),
              bottom: convertMillimetersToTwip(15),
              left: convertMillimetersToTwip(20),
            },
          },
        },
        children: [...pageOneChildren, ...pageTwoChildren],
      },
    ],
  });

  const blob = await Packer.toBlob(wordDoc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeName = doc.nomorSprin.replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/^_+|_+$/g, '');
  a.href = url;
  a.download = `${safeName || 'Surat_Perintah'}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
