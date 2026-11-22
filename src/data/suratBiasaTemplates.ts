import {
  RosterOrgHeader,
  SuratBiasaData,
  SuratFontFamily,
} from '../types/polriRoster';
import { MONTH_NAMES_ID } from '../utils/continuousRoster';
import {
  normalizeSignerNamePerkap,
  normalizeSignerRankNrpPerkap,
} from '../utils/perkap2023Rules';
import {
  REPO_SURAT_BIASA_TEMPLATES,
  RepoLetterTemplate,
} from './tamplateSuratBiasaPresets';

export interface SuratBiasaTemplateItem {
  id: string;
  title: string;
  category: string;
  sourceLabel: string;
  previewNomor: string;
  previewHal: string;
  directiveCount: number;
  buildData: (
    header: RosterOrgHeader,
    todayDateKey: string,
    opts?: {
      useCurrentSatkerKopSigner?: boolean;
      fontFamily?: SuratFontFamily;
    }
  ) => SuratBiasaData;
}

function parseDateKeyParts(dateKey: string): {
  year: number;
  monthIndex: number;
  day: number;
} {
  const m = dateKey.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    return {
      year: Number(m[1]),
      monthIndex: Number(m[2]) - 1,
      day: Number(m[3]),
    };
  }
  const now = new Date();
  return {
    year: now.getFullYear(),
    monthIndex: now.getMonth(),
    day: now.getDate(),
  };
}

export function formatRepoNomorSurat(
  identitas: RepoLetterTemplate['identitas']
): string {
  return [
    identitas.klasifikasiKode,
    identitas.nomorUrut,
    identitas.bulanRomawi,
    identitas.kodeKlasifikasi,
    identitas.tahun,
    identitas.satkerPenerbit,
  ]
    .filter((p) => p.trim() !== '')
    .join('/');
}

export function convertRepoLetterToSuratBiasa(
  tpl: RepoLetterTemplate,
  opts?: {
    header?: RosterOrgHeader;
    useCurrentSatkerKopSigner?: boolean;
    fontFamily?: SuratFontFamily;
  }
): SuratBiasaData {
  const satuanLines = tpl.kop.satuanInduk
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  let kopLine1 = tpl.kop.instansi.trim();
  let kopLine2 = satuanLines[0] ?? '';
  let kopLine3 = satuanLines[1] ?? '';
  let kopAddress = tpl.kop.alamat.trim();
  let page2HeaderLabel =
    tpl.identitas.headerLanjutanJudul?.trim() || 'SURAT KAPOLDA JATENG';

  const atasNamaLower = tpl.penandaTangan.atasNama.trim().toLowerCase();
  let signerDelegation: SuratBiasaData['signerDelegation'] =
    atasNamaLower.includes('a.n') ? 'AN' : 'NONE';
  let signerSuperiorTitle = tpl.penandaTangan.jabatanUtama.trim();
  let signerTitle =
    tpl.penandaTangan.jabatanPenandaTangan.trim() ||
    tpl.penandaTangan.jabatanUtama.trim();
  let signerName = tpl.penandaTangan.nama.trim();
  let signerRankNrp = `${tpl.penandaTangan.pangkat} ${tpl.penandaTangan.nrp}`
    .replace(/\s+/g, ' ')
    .trim();

  if (opts?.useCurrentSatkerKopSigner && opts.header) {
    const h = opts.header;
    kopLine1 = h.line1;
    kopLine2 = h.line2;
    kopLine3 = h.line3;
    kopAddress = 'Jalan Lamper Tengah XIV, Semarang 50248';
    page2HeaderLabel = 'SURAT KAPOLSEK SMG SELATAN';
    signerDelegation = 'NONE';
    signerSuperiorTitle = 'KAPOLRESTABES SEMARANG';
    signerTitle = `${h.signerTitle} POLRESTABES SEMARANG`;
    signerName = normalizeSignerNamePerkap(h.signerName);
    signerRankNrp = normalizeSignerRankNrpPerkap(
      `${h.signerRank} ${h.signerNrp}`
    );
  }

  const rujukanBlock =
    tpl.rujukan.length > 0
      ? [
          '1. Rujukan:',
          ...tpl.rujukan.map(
            (r, idx) => `${String.fromCharCode(97 + idx)}. ${r.teks}`
          ),
        ].join('\n')
      : '1. Rujukan: -';

  const latarBlock = `2. ${tpl.latarBelakang.trim()}`;
  const pembukaBlock = `3. ${tpl.pembukaDirektif.trim()}`;

  const directiveBlocks = tpl.direktifList.map((dir, dIdx) => {
    const letter = String.fromCharCode(97 + dIdx);
    if (dir.jenis === 'poin' && dir.poin.length > 0) {
      return [
        `${letter}. ${dir.pejabat.trim()}`,
        ...dir.poin.map((sub, sIdx) => `${sIdx + 1}) ${sub.teks.trim()}`),
      ].join('\n');
    }
    return `${letter}. ${dir.pejabat.trim()}`;
  });

  const penutupBlock = `4. ${tpl.penutup.trim()}`;

  return {
    kopLine1,
    kopLine2,
    kopLine3,
    kopAddress,
    nomor: formatRepoNomorSurat(tpl.identitas),
    klasifikasi: tpl.identitas.klasifikasiLabel || 'Biasa',
    lampiran: tpl.identitas.lampiran || '-',
    perihal: tpl.identitas.hal,
    dateRightText: `${tpl.identitas.tempat},  ${tpl.identitas.tanggal}`,
    kepadaYth: tpl.tujuan.kepada,
    diKota: tpl.tujuan.tempatTujuan || 'Tempat',
    upText: '',
    page2HeaderLabel,
    page2DateUpper: tpl.identitas.tanggal.trim().toUpperCase(),
    paragraphsPage1: [
      rujukanBlock,
      latarBlock,
      pembukaBlock,
      ...directiveBlocks,
    ],
    paragraphsPage2: [penutupBlock],
    includePersonnelTable: false,
    personnelTableTitle: 'DAFTAR NAMA PERSONEL',
    personnelRows: [],
    signerDelegation,
    signerSuperiorTitle,
    signerMiddleTitle: '',
    signerTitle,
    signerName,
    signerRankNrp,
    tembusan: tpl.tembusan.map((t) => t.teks),
    fontFamily: opts?.fontFamily ?? 'Arial Narrow',
  };
}

export function createDefaultPolsekSuratBiasa(
  header: RosterOrgHeader,
  todayDateKey: string,
  fontFamily: SuratFontFamily = 'Arial Narrow'
): SuratBiasaData {
  const { year, monthIndex } = parseDateKeyParts(todayDateKey);
  const monthUpper = MONTH_NAMES_ID[monthIndex] ?? 'NOVEMBER';
  const monthTitle =
    monthUpper.charAt(0).toUpperCase() + monthUpper.slice(1).toLowerCase();

  return {
    kopLine1: header.line1,
    kopLine2: header.line2,
    kopLine3: header.line3,
    kopAddress: 'Jalan Lamper Tengah XIV, Semarang 50248',
    nomor: `B/     /XI/REN.4.1.3./${year}`,
    klasifikasi: 'Biasa',
    lampiran: 'satu lembar',
    perihal: 'usulan pembagian alokasi DIPA Unit Samapta dan Unit Lantas.',
    dateRightText: `Semarang,    ${monthTitle} ${year}`,
    kepadaYth: 'KEPALA KEPOLISIAN RESOR KOTA BESAR SEMARANG',
    diKota: 'Semarang',
    upText: 'u.p. Kabagren.',
    page2HeaderLabel: 'SURAT KAPOLSEK SMG SELATAN',
    page2DateUpper: `${monthUpper} ${year}`,
    paragraphsPage1: [
      '1. Rujukan :\na. Undang-undang (UU) Nomor 5 Tahun 2026 tentang Perubahan Ketiga atas Undang-Undang Nomor 2 Tahun 2002 tentang Kepolisian Negara Republik Indonesia.;\nb. Daftar Isian Pelaksanaan Anggaran (DIPA) Polrestabes Semarang Tahun Anggaran 2027;\n1) Program 3130.BHB tentang Pembinaan Pelayanan Fungsi Samapta;\n2) Kegiatan 3130.BHB.004 tentang Layanan Pengaturan, Penjagaan, Pengawalan, dan Patroli;\nc. Kebutuhan dukungan operasional pelaksanaan kegiatan TURWALI rutin pada Unit Samapta dan Unit Lantas Polsek Semarang Selatan.',
      '2. Sehubungan dengan pelaksanaan kegiatan TURWALI Rutin Polsek Urban yang dialokasikan dalam DIPA Tahun Anggaran 2027, bersama ini kami mengajukan usulan pembagian alokasi anggaran antara Unit Samapta dan Unit Lantas Polsek Semarang Selatan, guna mendukung kelancaran pelaksanaan tugas pengaturan, penjagaan, pengawalan, dan patroli serta pelayanan kepada masyarakat;',
      '3. Adapun usulan pembagian alokasi anggaran dimaksud berdasarkan jumlah personel dan volume kegiatan adalah sebagai berikut:\na. Unit Samapta Jumlah personel: 8 (delapan) orang, Volume kegiatan: 270 kegiatan/orang;\nb. Unit Lantas Jumlah personel: 2 (dua) orang, Volume kegiatan: 270 kegiatan/orang;',
      '4. Adapun usulan pembagian tersebut didasarkan pada kebutuhan riil pelaksanaan tugas masing-masing unit, dengan mempertimbangkan jumlah personel, intensitas kegiatan, serta tanggung jawab pelaksanaan tugas di lapangan. Pembagian anggaran diharapkan dapat dilaksanakan secara proporsional, transparan, tertib administrasi, dan sesuai ketentuan pengelolaan keuangan negara;',
    ],
    paragraphsPage2: [
      '5. Sehubungan dengan hal tersebut, mohon kiranya Bapak berkenan memberikan persetujuan dan petunjuk lebih lanjut terhadap usulan pembagian alokasi DIPA dimaksud, sehingga dukungan anggaran dapat dimanfaatkan secara optimal untuk menunjang pelaksanaan tugas Unit Samapta dan Unit Lantas Polsek Semarang Selatan;',
      '6. Demikian surat usulan ini kami sampaikan. Atas perhatian dan kebijaksanaan Bapak, diucapkan terima kasih;',
      '7. Demikian untuk menjadi maklum.',
    ],
    includePersonnelTable: false,
    personnelTableTitle: 'DAFTAR NAMA PERSONEL',
    personnelRows: [],
    signerDelegation: 'NONE',
    signerSuperiorTitle: 'KAPOLRESTABES SEMARANG',
    signerMiddleTitle: 'WAKAPOLRESTABES SEMARANG',
    signerTitle: `${header.signerTitle} POLRESTABES SEMARANG`,
    signerName: normalizeSignerNamePerkap(header.signerName),
    signerRankNrp: normalizeSignerRankNrpPerkap(
      `${header.signerRank} ${header.signerNrp}`
    ),
    tembusan: [
      'Kapolrestabes Semarang',
      'Waka Polrestabes Semarang',
      'Kasi Propam Polrestabes Semarang',
      'Kasi Keuangan Polrestabes Semarang',
    ],
    fontFamily,
  };
}

export function createPermohonanPamUnrasSuratBiasa(
  header: RosterOrgHeader,
  todayDateKey: string,
  fontFamily: SuratFontFamily = 'Arial Narrow'
): SuratBiasaData {
  const { year, monthIndex } = parseDateKeyParts(todayDateKey);
  const monthUpper = MONTH_NAMES_ID[monthIndex] ?? 'NOVEMBER';
  const monthTitle =
    monthUpper.charAt(0).toUpperCase() + monthUpper.slice(1).toLowerCase();

  return {
    kopLine1: header.line1,
    kopLine2: header.line2,
    kopLine3: header.line3,
    kopAddress: 'Jalan Lamper Tengah XIV, Semarang 50248',
    nomor: `B/     /XI/OPS.1.1./${year}`,
    klasifikasi: 'Biasa',
    lampiran: '1 (satu) berkas',
    perihal: 'permohonan perbantuan perkuatan personel pengamanan kegiatan unjuk rasa / penyampaian pendapat di muka umum.',
    dateRightText: `Semarang,    ${monthTitle} ${year}`,
    kepadaYth: 'KEPALA KEPOLISIAN RESOR KOTA BESAR SEMARANG',
    diKota: 'Semarang',
    upText: 'u.p. Kabagops.',
    page2HeaderLabel: 'SURAT KAPOLSEK SMG SELATAN',
    page2DateUpper: `${monthUpper} ${year}`,
    paragraphsPage1: [
      '1. Rujukan :\na. Undang-undang Nomor 2 Tahun 2002 tentang Kepolisian Negara Republik Indonesia;\nb. Undang-undang Nomor 9 Tahun 1998 tentang Kemerdekaan Menyampaikan Pendapat di Muka Umum;\nc. Surat pemberitahuan kegiatan aksi penyampaian pendapat di muka umum dari Aliansi Masyarakat Peduli Hukum.',
      '2. Sehubungan dengan adanya rencana kegiatan penyampaian pendapat di muka umum oleh kelompok massa yang akan dilangsungkan di wilayah hukum Polsek Semarang Selatan, dengan perkiraan massa sekitar 150 orang dengan sasaran kantor instansi pemerintah dan titik kumpul di sepanjang jalan protokol wilayah Semarang Selatan, bersama ini kami mengajukan permohonan perbantuan perkuatan personel pengamanan (Dalmas/Satgas) dari Polrestabes Semarang;',
      '3. Adapun kuat pers Polsek Semarang Selatan yang dilibatkan dalam pengamanan ini berjumlah 12 personel, yang akan didukung oleh perkuatan personel Sat Samapta dan Sat Intelkam Polrestabes Semarang guna mengantisipasi potensi kerawanan dan kemacetan lalu lintas;',
      '4. Guna menjamin keamanan, ketertiban, serta kelancaran arus lalu lintas selama kegiatan berlangsung, diperlukan kesiapan dan penempatan personel pada simpul-simpul jalan strategis serta pengawalan jalur unjuk rasa;',
    ],
    paragraphsPage2: [
      '5. Sehubungan dengan hal tersebut di atas, mohon kiranya Bapak berkenan memberikan perbantuan perkuatan personel pengamanan serta petunjuk lebih lanjut untuk kelancaran pelaksanaan tugas pengamanan di lapangan;',
      '6. Demikian permohonan ini kami sampaikan. Atas perhatian dan perkenan Bapak, diucapkan terima kasih;',
      '7. Demikian untuk menjadi maklum.',
    ],
    includePersonnelTable: false,
    personnelTableTitle: 'DAFTAR NAMA PERSONEL',
    personnelRows: [],
    signerDelegation: 'NONE',
    signerSuperiorTitle: 'KAPOLRESTABES SEMARANG',
    signerMiddleTitle: 'WAKAPOLRESTABES SEMARANG',
    signerTitle: `${header.signerTitle} POLRESTABES SEMARANG`,
    signerName: normalizeSignerNamePerkap(header.signerName),
    signerRankNrp: normalizeSignerRankNrpPerkap(
      `${header.signerRank} ${header.signerNrp}`
    ),
    tembusan: [
      'Kapolrestabes Semarang',
      'Kabagops Polrestabes Semarang',
      'Kasat Intelkam Polrestabes Semarang',
      'Kasat Samapta Polrestabes Semarang',
    ],
    fontFamily,
  };
}

export function createLaporanSituasiSuratBiasa(
  header: RosterOrgHeader,
  todayDateKey: string,
  fontFamily: SuratFontFamily = 'Arial Narrow'
): SuratBiasaData {
  const { year, monthIndex } = parseDateKeyParts(todayDateKey);
  const monthUpper = MONTH_NAMES_ID[monthIndex] ?? 'NOVEMBER';
  const monthTitle =
    monthUpper.charAt(0).toUpperCase() + monthUpper.slice(1).toLowerCase();

  return {
    kopLine1: header.line1,
    kopLine2: header.line2,
    kopLine3: header.line3,
    kopAddress: 'Jalan Lamper Tengah XIV, Semarang 50248',
    nomor: `B/     /XI/KID.3./${year}`,
    klasifikasi: 'Biasa',
    lampiran: '-',
    perihal: 'laporan hasil pelaksanaan kegiatan patroli dialogis dan situasi kamtibmas 1x24 jam di wilayah hukum Polsek Semarang Selatan.',
    dateRightText: `Semarang,    ${monthTitle} ${year}`,
    kepadaYth: 'KEPALA KEPOLISIAN RESOR KOTA BESAR SEMARANG',
    diKota: 'Semarang',
    upText: 'u.p. Kasiwas / Kabagops.',
    page2HeaderLabel: 'SURAT KAPOLSEK SMG SELATAN',
    page2DateUpper: `${monthUpper} ${year}`,
    paragraphsPage1: [
      '1. Rujukan :\na. Undang-undang Nomor 2 Tahun 2002 tentang Kepolisian Negara Republik Indonesia;\nb. Rencana Kerja Polsek Semarang Selatan dibidang pemeliharaan keamanan dan ketertiban masyarakat.',
      '2. Bersama ini kami melaporkan situasi kamtibmas serta hasil pelaksanaan kegiatan kepolisian (patroli dialogis, KRYD, pengaturan arus lalu lintas, dan sambang kamtibmas) selama 1x24 jam di wilayah hukum Polsek Semarang Selatan dalam keadaan aman, tertib, dan kondusif;',
      '3. Rincian hasil pelaksanaan kegiatan dan penanganan kasus menonjol adalah sebagai berikut:\na. Kejadian menonjol / kriminalitas: Nihil;\nb. Kecelakaan lalu lintas: Nihil (arus lalu lintas lancar);\nc. Kegiatan masyarakat / unjuk rasa / keramaian: Terpelihara aman dan tertib;\nd. Pelaksanaan patroli strong point dan KRYD: Dilaksanakan pada jam rawan di titik rawan C3;',
      '4. Seluruh personel piket fungsi (Pawas, Ka SPKT, Unit Reskrim, Samapta, Lantas, Binmas, dan Intelkam) hadir lengkap dan siaga melaksanakan tugas pelayanan kepada masyarakat;',
    ],
    paragraphsPage2: [
      '5. Demikian laporan situasi kamtibmas dan hasil pelaksanaan tugas ini kami sampaikan sebagai bahan masukan dan evaluasi pimpinan;',
      '6. Atas perhatian dan petunjuk lebih lanjut dari Bapak, diucapkan terima kasih;',
      '7. Demikian untuk menjadi maklum.',
    ],
    includePersonnelTable: false,
    personnelTableTitle: 'DAFTAR NAMA PERSONEL',
    personnelRows: [],
    signerDelegation: 'NONE',
    signerSuperiorTitle: 'KAPOLRESTABES SEMARANG',
    signerMiddleTitle: 'WAKAPOLRESTABES SEMARANG',
    signerTitle: `${header.signerTitle} POLRESTABES SEMARANG`,
    signerName: normalizeSignerNamePerkap(header.signerName),
    signerRankNrp: normalizeSignerRankNrpPerkap(
      `${header.signerRank} ${header.signerNrp}`
    ),
    tembusan: [
      'Kapolrestabes Semarang',
      'Kabagops Polrestabes Semarang',
      'Kasiwas Polrestabes Semarang',
    ],
    fontFamily,
  };
}

export const SURAT_BIASA_TEMPLATES: SuratBiasaTemplateItem[] = [
  {
    id: 'tpl-dipa-polsek',
    title: 'Usulan Pembagian Alokasi DIPA Unit Samapta & Unit Lantas (Default Polsek)',
    category: 'Perencanaan / Polsek',
    sourceLabel: 'Template Bawaan Polsek',
    previewNomor: 'B/     /XI/REN.4.1.3./2026',
    previewHal: 'usulan pembagian alokasi DIPA Unit Samapta dan Unit Lantas.',
    directiveCount: 7,
    buildData: (header, todayDateKey, opts) =>
      createDefaultPolsekSuratBiasa(header, todayDateKey, opts?.fontFamily),
  },
  {
    id: 'tpl-permohonan-pam-unras',
    title: 'Permohonan Perbantuan Pengamanan Unjuk Rasa / Aksi Massa',
    category: 'Operasional / Polsek',
    sourceLabel: 'Template Bawaan Polsek',
    previewNomor: 'B/     /XI/OPS.1.1./2026',
    previewHal: 'permohonan perbantuan perkuatan personel pengamanan kegiatan unjuk rasa.',
    directiveCount: 4,
    buildData: (header, todayDateKey, opts) =>
      createPermohonanPamUnrasSuratBiasa(header, todayDateKey, opts?.fontFamily),
  },
  {
    id: 'tpl-laporan-situasi',
    title: 'Laporan Situasi (Lapsit) & Hasil Patroli 1x24 Jam Polsek',
    category: 'Pelaporan / Polsek',
    sourceLabel: 'Template Bawaan Polsek',
    previewNomor: 'B/     /XI/KID.3./2026',
    previewHal: 'laporan hasil pelaksanaan kegiatan patroli dialogis dan situasi kamtibmas.',
    directiveCount: 4,
    buildData: (header, todayDateKey, opts) =>
      createLaporanSituasiSuratBiasa(header, todayDateKey, opts?.fontFamily),
  },
  ...REPO_SURAT_BIASA_TEMPLATES.map((tpl) => ({
    id: tpl.id,
    title: tpl.title,
    category: tpl.category,
    sourceLabel: 'Pustaka Template Surat Biasa',
    previewNomor: formatRepoNomorSurat(tpl.identitas),
    previewHal: tpl.identitas.hal,
    directiveCount: tpl.direktifList.length,
    buildData: (
      header: RosterOrgHeader,
      _todayDateKey: string,
      opts?: {
        useCurrentSatkerKopSigner?: boolean;
        fontFamily?: SuratFontFamily;
      }
    ) =>
      convertRepoLetterToSuratBiasa(tpl, {
        header,
        useCurrentSatkerKopSigner: opts?.useCurrentSatkerKopSigner,
        fontFamily: opts?.fontFamily,
      }),
  })),
];

export function parseImportedSuratBiasaJson(
  rawText: string,
  fontFamily: SuratFontFamily = 'Arial Narrow'
): SuratBiasaData | null {
  try {
    const parsed = JSON.parse(rawText) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object') return null;

    // Format 1: SuratBiasaData langsung
    if (
      typeof parsed.nomor === 'string' &&
      Array.isArray(parsed.paragraphsPage1) &&
      typeof parsed.kopAddress === 'string'
    ) {
      const sb = parsed as unknown as SuratBiasaData;
      return {
        ...sb,
        fontFamily: sb.fontFamily ?? fontFamily,
        personnelRows: Array.isArray(sb.personnelRows) ? sb.personnelRows : [],
        paragraphsPage2: Array.isArray(sb.paragraphsPage2)
          ? sb.paragraphsPage2
          : [],
        tembusan: Array.isArray(sb.tembusan) ? sb.tembusan : [],
      };
    }

    // Format 2: LetterDocument dari aplikasi Template Surat Biasa (B/14381)
    if (
      parsed.kop &&
      parsed.identitas &&
      parsed.tujuan &&
      Array.isArray(parsed.direktifList)
    ) {
      return convertRepoLetterToSuratBiasa(
        parsed as unknown as RepoLetterTemplate,
        { fontFamily }
      );
    }

    return null;
  } catch {
    return null;
  }
}
