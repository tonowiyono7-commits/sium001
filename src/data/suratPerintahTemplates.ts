import {
  Personnel,
  RosterOrgHeader,
  SuratFontFamily,
  SuratPerintahData,
  SuratPersonRow,
} from '../types/polriRoster';
import { DAY_NAMES_FULL_ID, MONTH_NAMES_ID } from '../utils/continuousRoster';
import {
  normalizeSignerNamePerkap,
  normalizeSignerRankNrpPerkap,
} from '../utils/perkap2023Rules';

export interface SuratPerintahTemplateItem {
  id: string;
  title: string;
  category: string;
  sourceLabel: string;
  previewNomor: string;
  previewSubtitle: string;
  personnelCount: number;
  buildData: (
    header: RosterOrgHeader,
    todayDateKey: string,
    personnel: Personnel[],
    opts?: {
      useCurrentDate?: boolean;
      fontFamily?: SuratFontFamily;
    }
  ) => SuratPerintahData;
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

function formatIndonesianTitleDate(dateKey: string): string {
  const { year, monthIndex, day } = parseDateKeyParts(dateKey);
  const monthRaw = MONTH_NAMES_ID[monthIndex] ?? 'NOVEMBER';
  const monthTitle =
    monthRaw.charAt(0).toUpperCase() + monthRaw.slice(1).toLowerCase();
  return `${day} ${monthTitle} ${year}`;
}

function formatIndonesianUpperDayDate(dateKey: string): string {
  const { year, monthIndex, day } = parseDateKeyParts(dateKey);
  const dt = new Date(year, monthIndex, day);
  const dayName = DAY_NAMES_FULL_ID[dt.getDay()].toUpperCase();
  const monthName = MONTH_NAMES_ID[monthIndex] ?? 'NOVEMBER';
  return `${dayName} ${day} ${monthName} ${year}`;
}

function formatIndonesianDayAndDateTitle(dateKey: string): string {
  const { year, monthIndex, day } = parseDateKeyParts(dateKey);
  const dt = new Date(year, monthIndex, day);
  const dayRaw = DAY_NAMES_FULL_ID[dt.getDay()] ?? 'Sabtu';
  const dayTitle = dayRaw.charAt(0).toUpperCase() + dayRaw.slice(1).toLowerCase();
  const monthRaw = MONTH_NAMES_ID[monthIndex] ?? 'NOVEMBER';
  const monthTitle =
    monthRaw.charAt(0).toUpperCase() + monthRaw.slice(1).toLowerCase();
  return `${dayTitle} tanggal ${day} ${monthTitle} ${year}`;
}

function matchPersonnelId(
  personnel: Personnel[],
  nrp: string,
  name: string
): string | undefined {
  const cleanNrp = nrp.replace(/\s+/g, '');
  if (cleanNrp) {
    const byNrp = personnel.find((p) => p.nrp.replace(/\s+/g, '') === cleanNrp);
    if (byNrp) return byNrp.id;
  }
  const cleanName = name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
  if (cleanName) {
    const byName = personnel.find(
      (p) => p.name.toUpperCase().replace(/[^A-Z0-9]/g, '') === cleanName
    );
    if (byName) return byName.id;
  }
  return undefined;
}

export function createDefaultPolsekSprin(
  header: RosterOrgHeader,
  todayDateKey: string,
  personnel: Personnel[],
  fontFamily: SuratFontFamily = 'Arial Narrow'
): SuratPerintahData {
  const { year, monthIndex, day } = parseDateKeyParts(todayDateKey);
  const monthNameUpper = MONTH_NAMES_ID[monthIndex] ?? 'NOVEMBER';
  const defaultRows: SuratPersonRow[] = [];

  // Pilih otomatis beberapa personel contoh dari data jadwal piket jika tersedia
  const findByName = (q: string) =>
    personnel.find((p) => p.name.toUpperCase().includes(q));
  const seedIds: Array<{ match: string; ket: string }> = [
    { match: 'TRI SUTRISNO', ket: 'PADAL' },
    { match: 'TEGUH SANTOSO', ket: 'SDA' },
    { match: 'AGUS PURNOMO', ket: 'ANGGOTA' },
    { match: 'SUTADI DWI', ket: 'SDA' },
    { match: 'SINAR EKO', ket: 'SDA' },
    { match: 'TAUFIKURRAHMAN', ket: 'SDA' },
  ];

  seedIds.forEach((seed, idx) => {
    const p = findByName(seed.match);
    if (p) {
      defaultRows.push({
        id: `sprin_row_${p.id}_${idx}`,
        sourcePersonnelId: p.id,
        name: p.name,
        pangkat: p.pangkat,
        nrp: p.nrp,
        jabatan: p.jabatan,
        ket: seed.ket,
      });
    }
  });

  return {
    kopLine1: header.line1,
    kopLine2: header.line2,
    kopLine3: header.line3,
    nomor: `Sprin/ 206 / XI / HUK.6.6./${year}`,
    pertimbangan:
      'bahwa dalam rangka pelaksanaan kegiatan Rutin Yang Ditingkatkan dengan sasaran Balap Liar dan Tawuran di Wilayah Hukum Polsek Semarang Selatan, dipandang perlu mengeluarkan Surat Perintah.',
    dasar: [
      'Undang-undang (UU) Nomor 5 Tahun 2026 tentang Perubahan Ketiga atas Undang-Undang Nomor 2 Tahun 2002 tentang Kepolisian Negara Republik Indonesia.;',
      'Surat Kepala Kepolisian Daerah Jawa Tengah Nomor: R /1114 /V/ IPP.3.3.16./ 2026/Ditintelkam tanggal 23 Mei 2026 perihal jukrah konten Genk Kreak/Gangster yang melakukan penutupan jalan adanya indikasi tawuran;',
    ],
    kepadaText:
      'NAMA, PANGKAT, NRP DAN JABATANNYA SEPERTI TERSEBUT DALAM LAMPIRAN SURAT PERINTAH INI;',
    untuk: [
      'disamping melaksanakan tugas dan tanggungjawabnya sehari - hari diperintah untuk melaksanakan kegiatan Rutin Yang Ditingkatkan dengan sasaran tempat rawan C3 dan balap liar di Wilayah Hukum Polsek Semarang Selatan;',
      `kegiatan dilaksanakan pada hari ${formatIndonesianUpperDayDate(todayDateKey)} pukul 23.00 Wib s.d selesai di Wilayah hukum Polsek Semarang Selatan (Strong point Jl. Kompol Maksum Semarang);`,
      'apel kesiapan pukul 22.00 WIB di Mapolsek Semarang Selatan;',
      'melaporkan hasil pelaksanaan tugas kepada Kapolsek;',
      'melaksanakan perintah ini dengan seksama dan penuh rasa tanggung jawab.',
    ],
    issuedPlace: 'Semarang',
    issuedDateText: formatIndonesianTitleDate(todayDateKey),
    signerDelegation: 'NONE',
    signerSuperiorTitle: 'KAPOLRESTABES SEMARANG',
    signerMiddleTitle: 'WAKAPOLRESTABES SEMARANG',
    signerTitle: `${header.signerTitle} POLRESTABES SEMARANG`,
    signerName: normalizeSignerNamePerkap(header.signerName),
    signerRankNrp: normalizeSignerRankNrpPerkap(
      `${header.signerRank} ${header.signerNrp}`
    ),
    tembusan: ['Kapolrestabes Semarang', 'Kabag Ops Polrestabes Smg'],
    sprinContinuationHeaderLabel: 'SPRIN KAPOLSEK SMG SELATAN',
    lampiranHeaderLabel: 'LAMPIRAN SPRIN KAPOLSEK SMG SELATAN',
    lampiranDateUpper: `${day} ${monthNameUpper} ${year}`,
    lampiranTitle: 'DAFTAR NAMA PERS KRYD',
    lampiranSubtitle: formatIndonesianUpperDayDate(todayDateKey),
    personnelRows: defaultRows,
    useInlineKepadaIfFiveOrLess: false,
    fontFamily,
  };
}

const KRYD_169_PERSONNEL_SEED: Array<{
  name: string;
  pangkat: string;
  nrp: string;
  jabatan: string;
  ket: string;
}> = [
  {
    name: 'KISWORO, S.H.',
    pangkat: 'IPTU',
    nrp: '71070044',
    jabatan: 'KANIT BINMAS',
    ket: 'PADAL',
  },
  {
    name: 'HARSONO',
    pangkat: 'IPTU',
    nrp: '74020279',
    jabatan: 'PS. KANIT SAMAPTA',
    ket: 'SDA',
  },
  {
    name: 'AGUS NUR YANTO,S.H.',
    pangkat: 'IPTU',
    nrp: '73090344',
    jabatan: 'PS. KANITLANTAS',
    ket: 'SDA',
  },
  {
    name: 'Dr. TRI SUTRISNO,S.H.,M.H.',
    pangkat: 'IPTU',
    nrp: '72050205',
    jabatan: 'KANIT RESKRIM',
    ket: 'SDA',
  },
  {
    name: 'ADI GESIT SATATA',
    pangkat: 'AIPTU',
    nrp: '72120148',
    jabatan: 'BANIT SAMAPTA',
    ket: 'ANGGOTA',
  },
  {
    name: 'WARDOYO',
    pangkat: 'AIPDA',
    nrp: '83101282',
    jabatan: 'BANIT SAMAPTA',
    ket: 'SDA',
  },
  {
    name: 'ERI SETIAWAN',
    pangkat: 'AIPDA',
    nrp: '85081180',
    jabatan: 'BANIT LANTAS',
    ket: 'SDA',
  },
  {
    name: 'METRIZAL, SH',
    pangkat: 'AIPTU',
    nrp: '79051605',
    jabatan: 'BHABIN RANDUSARI',
    ket: 'SDA',
  },
  {
    name: 'HARDIYANTO',
    pangkat: 'AIPTU',
    nrp: '79010899',
    jabatan: 'BANIT INTEL',
    ket: 'SDA',
  },
  {
    name: 'SUKIJAN',
    pangkat: 'AIPTU',
    nrp: '69010254',
    jabatan: 'PS.PANITOPSNAL 1 UNIT RESKRIM',
    ket: 'SDA',
  },
  {
    name: 'AGUNG WITONO',
    pangkat: 'AIPDA',
    nrp: '84121525',
    jabatan: 'BANIT RESKRIM',
    ket: 'SDA',
  },
  {
    name: 'DEDY SETYO WIDODO',
    pangkat: 'AIPDA',
    nrp: '84120839',
    jabatan: 'BANIT PROPAM',
    ket: 'SDA',
  },
  {
    name: 'DODIK EKO ARIPRABOWO , S.H.',
    pangkat: 'AIPDA',
    nrp: '85061749',
    jabatan: 'PS. PANIT 2 BINMAS',
    ket: 'SDA',
  },
  {
    name: 'JATMIKO NUR P , S.H.',
    pangkat: 'AIPDA',
    nrp: '84051714',
    jabatan: 'PS.PANIT 2 SAMAPTA',
    ket: 'SDA',
  },
];

export function createSprinKryd169Template(
  header: RosterOrgHeader,
  todayDateKey: string,
  personnel: Personnel[],
  opts?: {
    useCurrentDate?: boolean;
    fontFamily?: SuratFontFamily;
  }
): SuratPerintahData {
  const useCurrentDate = Boolean(opts?.useCurrentDate);
  const { year, monthIndex, day } = parseDateKeyParts(todayDateKey);
  const monthUpper = MONTH_NAMES_ID[monthIndex] ?? 'OKTOBER';

  const rows: SuratPersonRow[] = KRYD_169_PERSONNEL_SEED.map((item, idx) => ({
    id: `sprin_169_row_${idx + 1}`,
    sourcePersonnelId: matchPersonnelId(personnel, item.nrp, item.name),
    name: item.name,
    pangkat: item.pangkat,
    nrp: item.nrp,
    jabatan: item.jabatan,
    ket: item.ket,
  }));

  const issuedDateText = useCurrentDate
    ? formatIndonesianTitleDate(todayDateKey)
    : '16 Oktober 2026';
  const lampiranDateUpper = useCurrentDate
    ? `${day} ${monthUpper} ${year}`
    : '16 OKTOBER 2026';
  const lampiranSubtitle = useCurrentDate
    ? formatIndonesianUpperDayDate(todayDateKey)
    : 'SABTU 17 OKTOBER 2026';
  const kegiatanDatePhrase = useCurrentDate
    ? formatIndonesianDayAndDateTitle(todayDateKey)
    : 'Sabtu tanggal 17 Oktober 2026';

  return {
    kopLine1: 'POLRI DAERAH JAWA TENGAH',
    kopLine2: 'RESOR KOTA BESAR SEMARANG',
    kopLine3: 'SEKTOR SEMARANG SELATAN',
    nomor: 'Sprin/169 / X / HUK.6.6./2026',
    pertimbangan:
      'bahwa dalam rangka pelaksanaan pengamanan kegiatan Rutin Yang Ditingkatkan dengan sasaran Balap Liar dan Tawuran di Wilayah Hukum Polsek Semarang Selatan, dipandang perlu mengeluarkan Surat Perintah.',
    dasar: [
      'Undang-undang (UU) Nomor 5 Tahun 2026 tentang Perubahan Ketiga atas Undang-Undang Nomor 2 Tahun 2002 tentang Kepolisian Negara Republik Indonesia.;',
      'Surat Kepala Kepolisian Daerah Jawa Tengah Nomor: R /1114 /V/ IPP.3.3.16./ 2026/Ditintelkam tanggal 23 Mei 2026 perihal jukrah konten Genk Kreak/Gangster yang melakukan penutupan jalan adanya indikasi tawuran;',
    ],
    kepadaText:
      'NAMA, PANGKAT, NRP DAN JABATANNYA SEPERTI TERSEBUT DALAM LAMPIRAN SURAT PERINTAH INI;',
    untuk: [
      'disamping melaksanakan tugas dan tanggungjawabnya sehari - hari diperintah untuk melaksanakan kegiatan Rutin Yang Ditingkatkan dengan sasaran tempat rawan C3 dan balap liar di Wilayah Hukum Polsek Semarang Selatan;',
      `kegiatan dilaksanakan pada hari ${kegiatanDatePhrase} pukul 23.00 Wib s.d selesai di Wilayah hukum Polsek Semarang Selatan (Strong point Jl. Kompol Maksum Semarang);`,
      'apel kesiapan pukul 22.00 WIB di Mapolsek Semarang Selatan;',
      'melaporkan hasil pelaksanaan tugas kepada Kapolsek;',
      'melaksanakan perintah ini dengan seksama dan penuh rasa tanggung jawab.',
    ],
    issuedPlace: 'Semarang',
    issuedDateText,
    signerDelegation: 'NONE',
    signerSuperiorTitle: 'KAPOLRESTABES SEMARANG',
    signerMiddleTitle: 'WAKAPOLRESTABES SEMARANG',
    signerTitle: `${header.signerTitle} POLRESTABES SEMARANG`,
    signerName: normalizeSignerNamePerkap(header.signerName),
    signerRankNrp: normalizeSignerRankNrpPerkap(
      `${header.signerRank} ${header.signerNrp}`
    ),
    tembusan: ['Kapolrestabes Semarang', 'Kabag Ops Polrestabes Smg'],
    sprinContinuationHeaderLabel: 'SPRIN KAPOLSEK SMG SELATAN',
    lampiranHeaderLabel: 'LAMPIRAN SPRIN KAPOLSEK SMG SELATAN',
    lampiranDateUpper,
    lampiranTitle: 'DAFTAR NAMA PERS KRYD',
    lampiranSubtitle,
    personnelRows: rows,
    useInlineKepadaIfFiveOrLess: false,
    fontFamily: opts?.fontFamily ?? 'Arial Narrow',
  };
}

export function createSprinUnrasTemplate(
  header: RosterOrgHeader,
  todayDateKey: string,
  personnel: Personnel[],
  opts?: {
    useCurrentDate?: boolean;
    fontFamily?: SuratFontFamily;
  }
): SuratPerintahData {
  const { year, monthIndex, day } = parseDateKeyParts(todayDateKey);
  const monthNameUpper = MONTH_NAMES_ID[monthIndex] ?? 'NOVEMBER';
  const defaultRows: SuratPersonRow[] = [];
  const findByName = (q: string) =>
    personnel.find((p) => p.name.toUpperCase().includes(q));
  const seedIds: Array<{ match: string; ket: string }> = [
    { match: 'KISWORO', ket: 'PADAL' },
    { match: 'TRI SUTRISNO', ket: 'WAKIPADAL' },
    { match: 'HARSONO', ket: 'SDA' },
    { match: 'AGUS', ket: 'ANGGOTA' },
    { match: 'WARDOYO', ket: 'SDA' },
    { match: 'ERI SETIAWAN', ket: 'SDA' },
  ];
  seedIds.forEach((seed, idx) => {
    const p = findByName(seed.match);
    if (p) {
      defaultRows.push({
        id: `sprin_unras_row_${p.id}_${idx}`,
        sourcePersonnelId: p.id,
        name: p.name,
        pangkat: p.pangkat,
        nrp: p.nrp,
        jabatan: p.jabatan,
        ket: seed.ket,
      });
    }
  });

  return {
    kopLine1: header.line1,
    kopLine2: header.line2,
    kopLine3: header.line3,
    nomor: `Sprin/     / XI / OPS.1.1./${year}`,
    pertimbangan:
      'bahwa dalam rangka pengamanan kegiatan unjuk rasa / penyampaian pendapat di muka umum diwilayah hukum Polsek Semarang Selatan, dipandang perlu mengeluarkan Surat Perintah.',
    dasar: [
      'Undang-undang Nomor 2 Tahun 2002 tentang Kepolisian Negara Republik Indonesia.;',
      'Undang-undang Nomor 9 Tahun 1998 tentang Kemerdekaan Menyampaikan Pendapat di Muka Umum;',
      'Rencana Pengamanan (Renpam) Polsek Semarang Selatan dalam rangka pengamanan aksi penyampaian pendapat;',
    ],
    kepadaText:
      'NAMA, PANGKAT, NRP DAN JABATANNYA SEPERTI TERSEBUT DALAM LAMPIRAN SURAT PERINTAH INI;',
    untuk: [
      'disamping melaksanakan tugas dan tanggungjawabnya sehari-hari diperintah untuk melaksanakan pengamanan aksi unjuk rasa / penyampaian pendapat di muka umum diwilayah hukum Polsek Semarang Selatan;',
      `kegiatan dilaksanakan pada hari ${formatIndonesianUpperDayDate(todayDateKey)} pukul 09.00 Wib s.d selesai di titik kumpul Kantor Kecamatan / Kantor Pemerintahan Semarang Selatan;`,
      'apel kesiapan dipimpin oleh Padal pukul 08.00 WIB di halaman Mapolsek Semarang Selatan;',
      'melaporkan hasil pelaksanaan tugas kepada Kapolsek selaku Perwira Penganggung Jawab;',
      'melaksanakan perintah ini dengan seksama dan penuh rasa tanggung jawab.',
    ],
    issuedPlace: 'Semarang',
    issuedDateText: formatIndonesianTitleDate(todayDateKey),
    signerDelegation: 'NONE',
    signerSuperiorTitle: 'KAPOLRESTABES SEMARANG',
    signerMiddleTitle: 'WAKAPOLRESTABES SEMARANG',
    signerTitle: `${header.signerTitle} POLRESTABES SEMARANG`,
    signerName: normalizeSignerNamePerkap(header.signerName),
    signerRankNrp: normalizeSignerRankNrpPerkap(
      `${header.signerRank} ${header.signerNrp}`
    ),
    tembusan: ['Kapolrestabes Semarang', 'Kabag Ops Polrestabes Smg', 'Kasat Intelkam Polrestabes Smg'],
    sprinContinuationHeaderLabel: 'SPRIN KAPOLSEK SMG SELATAN',
    lampiranHeaderLabel: 'LAMPIRAN SPRIN KAPOLSEK SMG SELATAN',
    lampiranDateUpper: `${day} ${monthNameUpper} ${year}`,
    lampiranTitle: 'DAFTAR NAMA PERSONEL PENGAMANAN UNRAS',
    lampiranSubtitle: formatIndonesianUpperDayDate(todayDateKey),
    personnelRows: defaultRows,
    useInlineKepadaIfFiveOrLess: false,
    fontFamily: opts?.fontFamily ?? 'Arial Narrow',
  };
}

export function createSprinPatroliSkalaBesarTemplate(
  header: RosterOrgHeader,
  todayDateKey: string,
  personnel: Personnel[],
  opts?: {
    useCurrentDate?: boolean;
    fontFamily?: SuratFontFamily;
  }
): SuratPerintahData {
  const { year, monthIndex, day } = parseDateKeyParts(todayDateKey);
  const monthNameUpper = MONTH_NAMES_ID[monthIndex] ?? 'NOVEMBER';
  const defaultRows: SuratPersonRow[] = [];
  const findByName = (q: string) =>
    personnel.find((p) => p.name.toUpperCase().includes(q));
  const seedIds: Array<{ match: string; ket: string }> = [
    { match: 'HARSONO', ket: 'PADAL' },
    { match: 'AGUS NUR YANTO', ket: 'WAKIPADAL' },
    { match: 'ADI GESIT', ket: 'SDA' },
    { match: 'WARDOYO', ket: 'SDA' },
    { match: 'DEDY SETYO', ket: 'SDA' },
  ];
  seedIds.forEach((seed, idx) => {
    const p = findByName(seed.match);
    if (p) {
      defaultRows.push({
        id: `sprin_patroli_row_${p.id}_${idx}`,
        sourcePersonnelId: p.id,
        name: p.name,
        pangkat: p.pangkat,
        nrp: p.nrp,
        jabatan: p.jabatan,
        ket: seed.ket,
      });
    }
  });

  return {
    kopLine1: header.line1,
    kopLine2: header.line2,
    kopLine3: header.line3,
    nomor: `Sprin/     / XI / OPS.2.1./${year}`,
    pertimbangan:
      'bahwa dalam rangka pelaksanaan patroli skala besar dan cipta kondisi kamtibmas diwilayah hukum Polsek Semarang Selatan, dipandang perlu mengeluarkan Surat Perintah.',
    dasar: [
      'Undang-undang Nomor 2 Tahun 2002 tentang Kepolisian Negara Republik Indonesia.;',
      'Rencana Kerja Polsek Semarang Selatan tentang pemeliharaan kamtibmas dan pencegahan kejahatan jalanan (street crime);',
    ],
    kepadaText:
      'NAMA, PANGKAT, NRP DAN JABATANNYA SEPERTI TERSEBUT DALAM LAMPIRAN SURAT PERINTAH INI;',
    untuk: [
      'disamping melaksanakan tugas dan tanggungjawabnya sehari-hari diperintah untuk melaksanakan kegiatan patroli skala besar berskala gabungan fungsi di wilayah rawan kejahatan dan objek vital Semarang Selatan;',
      `kegiatan dilaksanakan pada hari ${formatIndonesianUpperDayDate(todayDateKey)} pukul 21.00 Wib s.d selesai;`,
      'apel kesiapan pukul 20.30 WIB di Mapolsek Semarang Selatan;',
      'melaporkan hasil pelaksanaan tugas kepada Kapolsek;',
      'melaksanakan perintah ini dengan seksama dan penuh rasa tanggung jawab.',
    ],
    issuedPlace: 'Semarang',
    issuedDateText: formatIndonesianTitleDate(todayDateKey),
    signerDelegation: 'NONE',
    signerSuperiorTitle: 'KAPOLRESTABES SEMARANG',
    signerMiddleTitle: 'WAKAPOLRESTABES SEMARANG',
    signerTitle: `${header.signerTitle} POLRESTABES SEMARANG`,
    signerName: normalizeSignerNamePerkap(header.signerName),
    signerRankNrp: normalizeSignerRankNrpPerkap(
      `${header.signerRank} ${header.signerNrp}`
    ),
    tembusan: ['Kapolrestabes Semarang', 'Kabag Ops Polrestabes Smg'],
    sprinContinuationHeaderLabel: 'SPRIN KAPOLSEK SMG SELATAN',
    lampiranHeaderLabel: 'LAMPIRAN SPRIN KAPOLSEK SMG SELATAN',
    lampiranDateUpper: `${day} ${monthNameUpper} ${year}`,
    lampiranTitle: 'DAFTAR NAMA PERS PATROLI SKALA BESAR',
    lampiranSubtitle: formatIndonesianUpperDayDate(todayDateKey),
    personnelRows: defaultRows,
    useInlineKepadaIfFiveOrLess: false,
    fontFamily: opts?.fontFamily ?? 'Arial Narrow',
  };
}

const NIGHT_FUN_RUN_PERSONNEL_SEED: Array<{
  name: string;
  pangkat: string;
  nrp: string;
  jabatan: string;
  ket: string;
}> = [
  { name: 'ERLIN TANG JAYA, S.H. S.I.K., M.H.', pangkat: 'KOMBES POL', nrp: '78061264', jabatan: 'KAPOLRESTABES SMG', ket: 'P. JAWAB' },
  { name: 'M. FAISAL PERDANA, S.I.K.', pangkat: 'AKBP', nrp: '82111161', jabatan: 'WAKAPOLRESTABES SMG', ket: 'WAKIL. P. JAWAB' },
  { name: 'ASEP SUPIYANTO, S.Sos, MH', pangkat: 'AKBP', nrp: '73110617', jabatan: 'KABAGOPS', ket: 'KARENDALPAM' },
  { name: 'GINYONO, S.H.', pangkat: 'AKP', nrp: '70100153', jabatan: 'WAKAPOLSEK SMG SELATAN', ket: 'KALAKPAM' },
  { name: 'SUBIANTO, S.H.', pangkat: 'IPTU', nrp: '72100003', jabatan: 'KANIT INTELKAM', ket: 'PADAL' },
  { name: 'AGUS PURNOMO', pangkat: 'AIPTU', nrp: '78081511', jabatan: 'POLSEK SMG SELATAN', ket: 'LOKASI GUBERNURAN' },
  { name: 'SUTADI DWI SETYONO', pangkat: 'AIPTU', nrp: '82090194', jabatan: 'POLSEK SMG SELATAN', ket: 'SDA' },
  { name: 'SINAR EKO PANUNTUN', pangkat: 'AIPDA', nrp: '84120677', jabatan: 'POLSEK SMG SELATAN', ket: 'SDA' },
  { name: 'ANTON RAHARDJO, S.H.', pangkat: 'AIPTU', nrp: '80100908', jabatan: 'POLSEK SMG SELATAN', ket: 'PAMTUP' },
  { name: 'GUNTUR CAHYO UTOMO, S.H.', pangkat: 'AIPDA', nrp: '86020949', jabatan: 'SATINTELKAM', ket: 'SDA' },
  { name: 'ARIS HERU PRASETIYA', pangkat: 'BRIPKA', nrp: '89010745', jabatan: 'SATINTELKAM', ket: 'SDA' },
  { name: 'TAUFIKURRAHMAN', pangkat: 'AIPTU', nrp: '76040696', jabatan: 'POLSEK SMG SELATAN', ket: 'BUNDARAN AIR MANCUR' },
  { name: 'METRIZAL, SH', pangkat: 'AIPTU', nrp: '79051605', jabatan: 'POLSEK SMG SELATAN', ket: 'TL KFC PANDANARAN' },
  { name: 'CANDRA MARMESA, SH', pangkat: 'AIPDA', nrp: '84091212', jabatan: 'POLSEK SMG SELATAN', ket: 'TL EKA KARYA' },
  { name: 'MUSLIH', pangkat: 'AIPDA', nrp: '78041138', jabatan: 'POLSEK SMG SELATAN', ket: 'POS TUGU MUDA' },
  { name: 'A ADI WIDYANTORO, SH.', pangkat: 'AIPTU', nrp: '84030769', jabatan: 'POLSEK SMG SELATAN', ket: 'TL KARYADI' },
  { name: 'YUDHA SEPTYAWAN', pangkat: 'AIPDA', nrp: '85090287', jabatan: 'POLSEK SMG SELATAN', ket: 'TL. KYAISALEH' },
  { name: 'I YADI YANTO SUPYAN', pangkat: 'AIPTU', nrp: '74020269', jabatan: 'POLSEK SMG SELATAN', ket: 'SIMPANG INDOMARET VETERAN' }
];

export function createSprinNightFunRunTemplate(
  header: RosterOrgHeader,
  todayDateKey: string,
  personnel: Personnel[],
  opts?: {
    useCurrentDate?: boolean;
    fontFamily?: SuratFontFamily;
  }
): SuratPerintahData {
  const useCurrentDate = Boolean(opts?.useCurrentDate);
  const { year, monthIndex, day } = parseDateKeyParts(todayDateKey);
  const monthUpper = MONTH_NAMES_ID[monthIndex] ?? 'NOVEMBER';

  const rows: SuratPersonRow[] = NIGHT_FUN_RUN_PERSONNEL_SEED.map((item, idx) => ({
    id: `sprin_funrun_row_${idx + 1}`,
    sourcePersonnelId: matchPersonnelId(personnel, item.nrp, item.name),
    name: item.name,
    pangkat: item.pangkat,
    nrp: item.nrp,
    jabatan: item.jabatan,
    ket: item.ket,
  }));

  const issuedDateText = useCurrentDate
    ? formatIndonesianTitleDate(todayDateKey)
    : '16 November 2026';
  const lampiranDateUpper = useCurrentDate
    ? `${day} ${monthUpper} ${year}`
    : '16 NOVEMBER 2026';
  const lampiranSubtitle = useCurrentDate
    ? formatIndonesianUpperDayDate(todayDateKey)
    : 'MINGGU 16 NOVEMBER 2026';

  return {
    kopLine1: 'KEPOLISIAN NEGARA REPUBLIK INDONESIA',
    kopLine2: 'DAERAH JAWA TENGAH',
    kopLine3: 'RESOR KOTA BESAR SEMARANG',
    nomor: 'Sprin/1569/XI/HUK.6.6./2026',
    pertimbangan:
      'bahwa dalam rangka pengamanan kegiatan Night Fun Run HUT KORPRI di Wilayah Hukum Polrestabes Semarang, dipandang perlu mengeluarkan Surat Perintah.',
    dasar: [
      'Undang-undang (UU) Nomor 5 Tahun 2026 tentang Perubahan Ketiga atas Undang-Undang Nomor 2 Tahun 2002 tentang Kepolisian Negara Republik Indonesia.;',
      'Rencana Pengamanan (Renpam) Polrestabes Semarang dalam rangka pengamanan kegiatan Night Fun Run HUT KORPRI.',
    ],
    kepadaText:
      'NAMA, PANGKAT, NRP DAN JABATANNYA SEPERTI TERSEBUT DALAM LAMPIRAN SURAT PERINTAH INI;',
    untuk: [
      'disamping melaksanakan tugas dan tanggungjawabnya sehari-hari diperintah untuk melaksanakan pengamanan kegiatan Night Fun Run HUT KORPRI di Wilayah Hukum Polrestabes Semarang (Strong point rute lari dan penggal jalan);',
      'kegiatan dilaksanakan pada hari Minggu tanggal 16 November 2026 pukul 19.00 Wib s.d selesai;',
      'apel kesiapan pukul 17.30 WIB di Mapolrestabes Semarang / titik kumpul yang ditentukan;',
      'melaporkan hasil pelaksanaan tugas kepada Kapolrestabes Semarang;',
      'melaksanakan perintah ini dengan seksama dan penuh rasa tanggung jawab.',
    ],
    issuedPlace: 'Semarang',
    issuedDateText,
    signerDelegation: 'NONE',
    signerSuperiorTitle: 'KAPOLRESTABES SEMARANG',
    signerMiddleTitle: 'WAKAPOLRESTABES SEMARANG',
    signerTitle: 'KEPALA KEPOLISIAN RESOR KOTA BESAR SEMARANG',
    signerName: 'M. FAISAL PERDANA, S.I.K.',
    signerRankNrp: 'AJUN KOMISARIS BESAR POLISI NRP 82111161',
    tembusan: ['Kapolda Jateng', 'Irwasda Polda Jateng', 'Karoops Polda Jateng'],
    sprinContinuationHeaderLabel: 'SPRIN KAPOLRESTABES SEMARANG',
    lampiranHeaderLabel: 'LAMPIRAN SPRIN KAPOLRESTABES SEMARANG',
    lampiranDateUpper,
    lampiranTitle: 'DAFTAR NAMA PERS PAM NIGHT FUN RUN HUT KORPRI',
    lampiranSubtitle,
    personnelRows: rows,
    useInlineKepadaIfFiveOrLess: false,
    fontFamily: opts?.fontFamily ?? 'Arial Narrow',
  };
}

export const SURAT_PERINTAH_TEMPLATES: SuratPerintahTemplateItem[] = [
  {
    id: 'tpl-sprin-kryd-default',
    title: 'Sprin Pengamanan KRYD Rutin Polsek (Tanggal Hari Ini)',
    category: 'Operasional / Polsek',
    sourceLabel: 'Template Bawaan Polsek',
    previewNomor: 'Sprin/ 206 / XI / HUK.6.6./2026',
    previewSubtitle:
      'DAFTAR NAMA PERS KRYD · 6 personel awal dari Jadwal Piket',
    personnelCount: 6,
    buildData: (header, todayDateKey, personnel, opts) =>
      createDefaultPolsekSprin(
        header,
        todayDateKey,
        personnel,
        opts?.fontFamily ?? 'Arial Narrow'
      ),
  },
  {
    id: 'sprin_night_fun_run_1569',
    title: 'Surat Perintah Pam Night Fun Run HUT KORPRI (16 Nov 2026)',
    category: 'Operasional / Polrestabes',
    sourceLabel: '1569 SPRIN_PAM NIGHT FUN RUN HUT KORPRI.docx',
    previewNomor: 'Sprin/1569/XI/HUK.6.6./2026',
    previewSubtitle:
      'DAFTAR NAMA PERS PAM NIGHT FUN RUN · MINGGU 16 NOVEMBER 2026 · 18 Personel',
    personnelCount: 18,
    buildData: (header, todayDateKey, personnel, opts) =>
      createSprinNightFunRunTemplate(header, todayDateKey, personnel, opts),
  },
  {
    id: 'tpl-sprin-unras',
    title: 'Sprin Pengamanan Unjuk Rasa / Aksi Massa',
    category: 'Operasional / Polsek',
    sourceLabel: 'Template Bawaan Polsek',
    previewNomor: 'Sprin/     / XI / OPS.1.1./2026',
    previewSubtitle:
      'DAFTAR NAMA PERS PENGAMANAN UNRAS · 6 personel',
    personnelCount: 6,
    buildData: (header, todayDateKey, personnel, opts) =>
      createSprinUnrasTemplate(header, todayDateKey, personnel, opts),
  },
  {
    id: 'tpl-sprin-patroli-besar',
    title: 'Sprin Patroli Skala Besar & Cipta Kondisi Kamtibmas',
    category: 'Operasional / Polsek',
    sourceLabel: 'Template Bawaan Polsek',
    previewNomor: 'Sprin/     / XI / OPS.2.1./2026',
    previewSubtitle:
      'DAFTAR NAMA PERS PATROLI SKALA BESAR · 5 personel',
    personnelCount: 5,
    buildData: (header, todayDateKey, personnel, opts) =>
      createSprinPatroliSkalaBesarTemplate(header, todayDateKey, personnel, opts),
  },
  {
    id: 'sprin_kryd_169_2026',
    title: 'Surat Perintah KRYD - 17 Oktober 2026',
    category: 'Operasional / KRYD',
    sourceLabel: '169 SPRIN KRYD 17 OKT 2026.docx',
    previewNomor: 'Sprin/169 / X / HUK.6.6./2026',
    previewSubtitle:
      'DAFTAR NAMA PERS KRYD · SABTU 17 OKTOBER 2026 · Strong Point Jl. Kompol Maksum',
    personnelCount: 14,
    buildData: (header, todayDateKey, personnel, opts) =>
      createSprinKryd169Template(header, todayDateKey, personnel, opts),
  },
];

function cleanInlineWhitespace(text: string): string {
  return text.replace(/[\t\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function stripLeadingSection(text: string, labelPattern: RegExp): string {
  return cleanInlineWhitespace(text).replace(labelPattern, '').trim();
}

export function parseImportedSprinJson(
  rawText: string,
  header: RosterOrgHeader,
  personnel: Personnel[],
  fontFamily: SuratFontFamily = 'Arial Narrow'
): SuratPerintahData | null {
  try {
    const parsed = JSON.parse(rawText) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object') return null;

    // Format 1: SuratPerintahData langsung (hasil Ekspor JSON dari editor ini)
    if (
      typeof parsed.nomor === 'string' &&
      typeof parsed.pertimbangan === 'string' &&
      Array.isArray(parsed.dasar) &&
      Array.isArray(parsed.untuk)
    ) {
      const sp = parsed as unknown as SuratPerintahData;
      return {
        ...sp,
        dasar: Array.isArray(sp.dasar) ? sp.dasar : [],
        untuk: Array.isArray(sp.untuk) ? sp.untuk : [],
        tembusan: Array.isArray(sp.tembusan) ? sp.tembusan : [],
        personnelRows: Array.isArray(sp.personnelRows) ? sp.personnelRows : [],
        fontFamily: sp.fontFamily ?? fontFamily,
      };
    }

    // Format 2: JSON hasil ekstraksi DOCX (seperti template_sprin_kryd_169.json)
    const content = parsed.content as
      | {
          paragraphs?: Array<{ index?: number; text?: string }>;
          tables?: Array<{ data?: string[][] }>;
        }
      | undefined;
    if (content && Array.isArray(content.paragraphs)) {
      const paras = content.paragraphs
        .map((p) => (typeof p.text === 'string' ? cleanInlineWhitespace(p.text) : ''))
        .filter(Boolean);

      const kopLine1 = paras[0] || header.line1;
      const kopLine2 = paras[1] || header.line2;
      const kopLine3 = paras[2] || header.line3;

      const nomorPara = paras.find((t) => /^Nomor\s*:/i.test(t));
      const nomor = nomorPara
        ? nomorPara.replace(/^Nomor\s*:\s*/i, '').trim()
        : `Sprin/     /     / HUK.6.6./${new Date().getFullYear()}`;

      const pertimbanganPara = paras.find((t) => /^Pertimbangan\b/i.test(t));
      const pertimbangan = pertimbanganPara
        ? stripLeadingSection(pertimbanganPara, /^Pertimbangan\s*:\s*/i)
        : '';

      const dasarIdx = paras.findIndex((t) => /^Dasar\b/i.test(t));
      const diperintahkanIdx = paras.findIndex((t) =>
        /^DIPERINTAHKAN$/i.test(t)
      );
      const dasar: string[] = [];
      if (dasarIdx !== -1) {
        const end = diperintahkanIdx !== -1 ? diperintahkanIdx : paras.length;
        for (let i = dasarIdx; i < end; i++) {
          const cleaned = stripLeadingSection(
            paras[i],
            i === dasarIdx ? /^Dasar\s*:\s*\d+\.\s*/i : /^\d+\.\s*/i
          );
          if (cleaned) dasar.push(cleaned);
        }
      }

      const kepadaPara = paras.find((t) => /^Kepada\b/i.test(t));
      const kepadaText = kepadaPara
        ? stripLeadingSection(kepadaPara, /^Kepada\s*:\s*/i)
        : 'NAMA, PANGKAT, NRP DAN JABATANNYA SEPERTI TERSEBUT DALAM LAMPIRAN SURAT PERINTAH INI;';

      const untukIdx = paras.findIndex((t) => /^Untuk\b/i.test(t));
      const selesaiIdx = paras.findIndex((t) => /^Selesai\.?$/i.test(t));
      const untuk: string[] = [];
      if (untukIdx !== -1) {
        const end = selesaiIdx !== -1 ? selesaiIdx : paras.length;
        for (let i = untukIdx; i < end; i++) {
          const cleaned = stripLeadingSection(
            paras[i],
            i === untukIdx ? /^Untuk\s*:\s*\d+\.\s*/i : /^\d+\.\s*/i
          );
          if (cleaned) untuk.push(cleaned);
        }
      }

      const tembusanIdx = paras.findIndex((t) => /^Tembusan\s*:?/i.test(t));
      const lampiranHeaderIdx = paras.findIndex((t) =>
        /LAMPIRAN\s+SPRIN/i.test(t)
      );
      const tembusan: string[] = [];
      if (tembusanIdx !== -1) {
        const end = lampiranHeaderIdx !== -1 ? lampiranHeaderIdx : paras.length;
        for (let i = tembusanIdx + 1; i < end; i++) {
          const item = paras[i].replace(/^\d+\.\s*/, '').trim();
          if (item) tembusan.push(item);
        }
      }

      const tanggalLine = paras.find((t) => /TANGGAL\s*:/i.test(t));
      const lampiranDateUpper = tanggalLine
        ? cleanInlineWhitespace(
            tanggalLine.replace(/.*TANGGAL\s*:\s*/i, '')
          ).toUpperCase()
        : '';
      const issuedDateText = lampiranDateUpper
        ? lampiranDateUpper
            .toLowerCase()
            .replace(/\b([a-z])/g, (m) => m.toUpperCase())
        : '';

      const lampiranTitle =
        paras.find((t) => /^DAFTAR\s+NAMA/i.test(t)) || 'DAFTAR NAMA PERSONEL';
      const daftarIdx = paras.findIndex((t) => /^DAFTAR\s+NAMA/i.test(t));
      const lampiranSubtitle =
        daftarIdx !== -1 && paras[daftarIdx + 1] ? paras[daftarIdx + 1] : '';

      const rawTable = content.tables?.[0]?.data ?? [];
      const personnelRows: SuratPersonRow[] = [];
      for (const row of rawTable) {
        if (!Array.isArray(row) || row.length < 5) continue;
        const colNo = cleanInlineWhitespace(row[0] ?? '');
        if (!/^\d+$/.test(colNo)) continue;
        const name = cleanInlineWhitespace(row[1] ?? '');
        const pangkat = cleanInlineWhitespace(row[2] ?? '').toUpperCase();
        const nrp = cleanInlineWhitespace(row[3] ?? '');
        const jabatan = cleanInlineWhitespace(row[4] ?? '').toUpperCase();
        const ket = cleanInlineWhitespace(row[5] ?? 'SDA').toUpperCase();
        // Lewati baris sub-nomor tabel seperti ["1","2","3","4","5",""]
        if (name === '2' && pangkat === '3' && nrp === '4') continue;
        if (!name) continue;
        personnelRows.push({
          id: `sprin_import_${personnelRows.length + 1}_${Date.now().toString(36)}`,
          sourcePersonnelId: matchPersonnelId(personnel, nrp, name),
          name,
          pangkat,
          nrp,
          jabatan,
          ket: ket || 'SDA',
        });
      }

      return {
        kopLine1,
        kopLine2,
        kopLine3,
        nomor,
        pertimbangan,
        dasar:
          dasar.length > 0
            ? dasar
            : [
                'Undang-undang (UU) Nomor 5 Tahun 2026 tentang Perubahan Ketiga atas Undang-Undang Nomor 2 Tahun 2002 tentang Kepolisian Negara Republik Indonesia.;',
              ],
        kepadaText,
        untuk,
        issuedPlace: 'Semarang',
        issuedDateText: issuedDateText || '16 Oktober 2026',
        signerDelegation: 'NONE',
        signerSuperiorTitle: 'KAPOLRESTABES SEMARANG',
        signerMiddleTitle: 'WAKAPOLRESTABES SEMARANG',
        signerTitle: `${header.signerTitle} POLRESTABES SEMARANG`,
        signerName: normalizeSignerNamePerkap(header.signerName),
        signerRankNrp: normalizeSignerRankNrpPerkap(
          `${header.signerRank} ${header.signerNrp}`
        ),
        tembusan,
        sprinContinuationHeaderLabel: 'SPRIN KAPOLSEK SMG SELATAN',
        lampiranHeaderLabel: 'LAMPIRAN SPRIN KAPOLSEK SMG SELATAN',
        lampiranDateUpper: lampiranDateUpper || '16 OKTOBER 2026',
        lampiranTitle,
        lampiranSubtitle,
        personnelRows,
        useInlineKepadaIfFiveOrLess: false,
        fontFamily,
      };
    }

    return null;
  } catch {
    return null;
  }
}
