import { PersonnelRow, SatkerPreset, SprinDocument, StampSignatureConfig } from '../types/buatSprin';

export const QUICK_WINS_PROGRAMS: string[] = [
  'Quick Wins 1 — Perbaikan Interaksi Polisi dengan Masyarakat',
  'Quick Wins 2 — Optimalisasi Pengamanan Kegiatan Masyarakat',
  'Quick Wins 3 — Patroli Sambang & Bhabinkamtibmas Terpadu',
  'Quick Wins 4 — Pelayanan Publik Presisi Bebas Pungli',
  'Quick Wins 5 — Penanganan Gangguan Kamtibmas & Keramaian',
  'Quick Wins 6 — Penguatan Sinergi Sekolah & Generasi Muda',
  'Quick Wins 7 — Digitalisasi Pelaporan & Administrasi Operasional',
  'Quick Wins 8 — Respon Cepat Aduan & Pengaduan Masyarakat',
];

export const SATKER_PRESETS: SatkerPreset[] = [
  {
    id: 'polrestabes-semarang',
    label: 'POLRESTABES SEMARANG POLDA JAWA TENGAH',
    shortLabel: 'Polrestabes Semarang',
    polda: 'Polda Jawa Tengah',
    polres: 'Polrestabes Semarang',
    polsek: '',
    kopLine1: 'KEPOLISIAN NEGARA REPUBLIK INDONESIA',
    kopLine2: 'DAERAH JAWA TENGAH',
    kopLine3: 'RESOR KOTA BESAR SEMARANG',
    lampiranHeaderTitle: 'LAMPIRAN SPRIN KAPOLRESTABES SMG',
    pejabatJabatan: 'KAPOLRESTABES SEMARANG POLDA JATENG',
    pejabatNama: 'ERLIN TANG JAYA, S.H., S.I.K., M.H.',
    pejabatPangkatNrp: 'KOMISARIS BESAR POLISI NRP 78061264',
    stampResorText: 'POLRI DAERAH JAWA TENGAH',
    stampSektorText: 'RESOR KOTA BESAR SEMARANG',
  },
  {
    id: 'semarang-selatan',
    label: 'POLSEK SEMARANG SELATAN POLRESTABES SEMARANG',
    shortLabel: 'Polsek Semarang Selatan',
    polda: 'Polda Jawa Tengah',
    polres: 'Polrestabes Semarang',
    polsek: 'Polsek Semarang Selatan',
    kopLine1: 'POLRI DAERAH JAWA TENGAH',
    kopLine2: 'RESOR KOTA BESAR SEMARANG',
    kopLine3: 'SEKTOR SEMARANG SELATAN',
    lampiranHeaderTitle: 'LAMPIRAN SPRIN KAPOLSEK SMG SLTN',
    pejabatJabatan: 'KAPOLSEK SEMARANG SELATAN POLRESTABES SEMARANG',
    pejabatNama: 'RISMANTO, S.H.,M.H.',
    pejabatPangkatNrp: 'KOMISARIS POLISI NRP 73020406',
    stampResorText: 'POLRI RESOR KOTA BESAR SEMARANG',
    stampSektorText: 'SEKTOR SEMARANG SELATAN',
  },
  {
    id: 'semarang-tengah',
    label: 'POLSEK SEMARANG TENGAH POLRESTABES SEMARANG',
    shortLabel: 'Polsek Semarang Tengah',
    polda: 'Polda Jawa Tengah',
    polres: 'Polrestabes Semarang',
    polsek: 'Polsek Semarang Tengah',
    kopLine1: 'POLRI DAERAH JAWA TENGAH',
    kopLine2: 'RESOR KOTA BESAR SEMARANG',
    kopLine3: 'SEKTOR SEMARANG TENGAH',
    lampiranHeaderTitle: 'LAMPIRAN SPRIN KAPOLSEK SMG TGH',
    pejabatJabatan: 'KAPOLSEK SEMARANG TENGAH POLRESTABES SEMARANG',
    pejabatNama: 'SUYITNO, S.H., M.H.',
    pejabatPangkatNrp: 'KOMISARIS POLISI NRP 74050318',
    stampResorText: 'POLRI RESOR KOTA BESAR SEMARANG',
    stampSektorText: 'SEKTOR SEMARANG TENGAH',
  },
  {
    id: 'candisari',
    label: 'POLSEK CANDISARI POLRESTABES SEMARANG',
    shortLabel: 'Polsek Candisari',
    polda: 'Polda Jawa Tengah',
    polres: 'Polrestabes Semarang',
    polsek: 'Polsek Candisari',
    kopLine1: 'POLRI DAERAH JAWA TENGAH',
    kopLine2: 'RESOR KOTA BESAR SEMARANG',
    kopLine3: 'SEKTOR CANDISARI',
    lampiranHeaderTitle: 'LAMPIRAN SPRIN KAPOLSEK CANDISARI',
    pejabatJabatan: 'KAPOLSEK CANDISARI POLRESTABES SEMARANG',
    pejabatNama: 'AGUS PRASETYO, S.I.K.',
    pejabatPangkatNrp: 'AKP NRP 82080412',
    stampResorText: 'POLRI RESOR KOTA BESAR SEMARANG',
    stampSektorText: 'SEKTOR CANDISARI',
  },
];

const NOMINATIF_POLSEK_SMG_SELATAN: PersonnelRow[] = [
  { id: 'pers-nom-1', nama: 'RISMANTO,S.H.,M.H.', pangkat: 'KOMPOL', nrp: '73020406', jabatan: 'KAPOLSEK', ket: '' },
  { id: 'pers-nom-2', nama: 'GINYONO,S.H.', pangkat: 'AKP', nrp: '70100153', jabatan: 'WAKA POLSEK', ket: '' },
  { id: 'pers-nom-3', nama: 'KISWORO, S.H.', pangkat: 'IPTU', nrp: '71070044', jabatan: 'PS. KANITBINMAS', ket: '' },
  { id: 'pers-nom-4', nama: 'Dr. TRI SUTRINO,S.H.,M.H.', pangkat: 'IPTU', nrp: '72050205', jabatan: 'KANIT RESKRIM', ket: '' },
  { id: 'pers-nom-5', nama: 'SUBIANTO, S.H.', pangkat: 'IPTU', nrp: '72100003', jabatan: 'KANITINTELKAM', ket: '' },
  { id: 'pers-nom-6', nama: 'M. ALI MAGHFUR,S.H.', pangkat: 'IPTU', nrp: '74080418', jabatan: 'PS.KANIT SAMAPTA', ket: '' },
  { id: 'pers-nom-7', nama: 'TEGUH SANTOSO,S.H.,M.M.', pangkat: 'IPDA', nrp: '83120118', jabatan: 'KANIT PROPAM', ket: '' },
  { id: 'pers-nom-8', nama: 'SUKIJAN', pangkat: 'AIPTU', nrp: '69010254', jabatan: 'PS.PANITOPSNAL 1 UNIT RESKRIM', ket: '' },
  { id: 'pers-nom-9', nama: 'ADI GESIT SATATA', pangkat: 'AIPTU', nrp: '72120148', jabatan: 'BANIT SAMAPTA', ket: '' },
  { id: 'pers-nom-10', nama: 'ANDI SETIYANTO', pangkat: 'AIPTU', nrp: '73120096', jabatan: 'BHABIN MUGASSARI', ket: '' },
  { id: 'pers-nom-11', nama: 'I YADI YANTO SUPYAN', pangkat: 'AIPTU', nrp: '74020269', jabatan: 'BHABIN WONODRI', ket: '' },
  { id: 'pers-nom-12', nama: 'AHMAD SOKI', pangkat: 'AIPTU', nrp: '75050022', jabatan: 'PS. PANIT 3 SAMAPTA', ket: '' },
  { id: 'pers-nom-13', nama: 'TAUFIKURAHMAN', pangkat: 'AIPTU', nrp: '76040696', jabatan: 'PS. PANIT 2 LANTAS', ket: '' },
  { id: 'pers-nom-14', nama: 'AGUS PURNOMO', pangkat: 'AIPTU', nrp: '78081511', jabatan: 'PS. PANIT 1 SAMAPTA', ket: '' },
  { id: 'pers-nom-15', nama: 'HARDIYANTO', pangkat: 'AIPTU', nrp: '79010899', jabatan: 'BANIT INTELKAM', ket: '' },
  { id: 'pers-nom-16', nama: 'AGUS PRASTYANTO', pangkat: 'AIPTU', nrp: '79021084', jabatan: 'PS. KASIHUMAS', ket: '' },
  { id: 'pers-nom-17', nama: 'METRIZAL, S.H.', pangkat: 'AIPTU', nrp: '79051605', jabatan: 'BHABIN RANDUSARI', ket: '' },
  { id: 'pers-nom-18', nama: 'ALI MAHFUD', pangkat: 'AIPTU', nrp: '79081059', jabatan: 'PS. KA SIUM', ket: '' },
  { id: 'pers-nom-19', nama: 'SYAIFUL BAHRI, S.H.', pangkat: 'AIPTU', nrp: '80030582', jabatan: 'PS.KA SPKT 1', ket: '' },
  { id: 'pers-nom-20', nama: 'SUHARTANTO, S.H.', pangkat: 'AIPTU', nrp: '80040997', jabatan: 'BHABIN PLEBURAN', ket: '' },
  { id: 'pers-nom-21', nama: 'ANTON RAHARDJO, S.H.', pangkat: 'AIPTU', nrp: '80100908', jabatan: 'PS. PANITOPSNAL INTEL', ket: '' },
  { id: 'pers-nom-22', nama: 'EKO PRIYANTO, S.H.', pangkat: 'AIPTU', nrp: '81050986', jabatan: 'BANIT RESKRIM', ket: '' },
  { id: 'pers-nom-23', nama: 'BAMBANG TYAS CAHYA YULIANTO', pangkat: 'AIPTU', nrp: '81070388', jabatan: 'PS.PANITOPSNAL 3 UNIT RESKRIM', ket: '' },
  { id: 'pers-nom-24', nama: 'SUTADI DWI SETYONO', pangkat: 'AIPTU', nrp: '82090194', jabatan: 'BANIT SAMAPTA', ket: '' },
  { id: 'pers-nom-25', nama: 'SINGGIH RIYADI', pangkat: 'AIPTU', nrp: '83070106', jabatan: 'PS.PANITOPSNAL 2 UNIT RESKRIM', ket: '' },
  { id: 'pers-nom-26', nama: 'BANGUN WASKITO, S.H.', pangkat: 'AIPTU', nrp: '83070934', jabatan: 'PS.KA SPKT 2', ket: '' },
  { id: 'pers-nom-27', nama: 'FERY EKO SAPUTRO', pangkat: 'AIPTU', nrp: '84050075', jabatan: 'BANIT SAMAPTA', ket: '' },
  { id: 'pers-nom-28', nama: 'SUPRIYATNO', pangkat: 'AIPDA', nrp: '72100456', jabatan: 'BANIT SAMAPTA', ket: '' },
  { id: 'pers-nom-29', nama: 'MUSLIH', pangkat: 'AIPDA', nrp: '78041138', jabatan: 'BHABIN LAMPER KIDUL', ket: '' },
  { id: 'pers-nom-30', nama: 'TONO WIYONO', pangkat: 'AIPDA', nrp: '80110655', jabatan: 'BANIT SAMAPTA', ket: '' },
  { id: 'pers-nom-31', nama: 'EDI BAMBANG MUDIONO', pangkat: 'AIPDA', nrp: '82120819', jabatan: 'BHABIN BULUSTALAN', ket: '' },
  { id: 'pers-nom-32', nama: 'WARDOYO', pangkat: 'AIPDA', nrp: '83101282', jabatan: 'BANIT SAMAPTA', ket: '' },
  { id: 'pers-nom-33', nama: 'A. ADI WIDYANTORO, S.H.', pangkat: 'AIPDA', nrp: '84030769', jabatan: 'BHABIN LAMPER LOR', ket: '' },
  { id: 'pers-nom-34', nama: 'JATMIKO NUR. P, S.H.', pangkat: 'AIPDA', nrp: '84051714', jabatan: 'PS. PANIT 2 SAMAPTA', ket: '' },
  { id: 'pers-nom-35', nama: 'ANDI WIBAWA', pangkat: 'AIPDA', nrp: '84081372', jabatan: 'PS. PANIT 1 LANTAS', ket: '' },
  { id: 'pers-nom-36', nama: 'CANDRA MARMESA, S.H.', pangkat: 'AIPDA', nrp: '84091212', jabatan: 'BHABIN LAMPER TENGAH', ket: '' },
  { id: 'pers-nom-37', nama: 'PURBO DWI LAKSONO', pangkat: 'AIPDA', nrp: '84091593', jabatan: 'BANIT SAMAPTA', ket: '' },
  { id: 'pers-nom-38', nama: 'SINAR EKO PANUNTUN', pangkat: 'AIPDA', nrp: '84120677', jabatan: 'BANIT SAMAPTA', ket: '' },
  { id: 'pers-nom-39', nama: 'DEDY SETYO WIDODO', pangkat: 'AIPDA', nrp: '84120839', jabatan: 'BANIT PROPAM', ket: '' },
  { id: 'pers-nom-40', nama: 'AGUNG WITONO', pangkat: 'AIPDA', nrp: '84121525', jabatan: 'BANIT RESKRIM', ket: '' },
  { id: 'pers-nom-41', nama: 'IJMAL AKMAL, S.H.', pangkat: 'AIPDA', nrp: '85011391', jabatan: 'BANIT RESKRIM', ket: '' },
  { id: 'pers-nom-42', nama: 'ACHMAD TAUFIK, S.H.', pangkat: 'AIPDA', nrp: '85020792', jabatan: 'PS.PANITYANMIN UNIT INTELKAM', ket: '' },
  { id: 'pers-nom-43', nama: 'MUCHAMAD TOFIQ HIDAYAT, S.H.', pangkat: 'AIPDA', nrp: '85041815', jabatan: 'PS. KA SPKT 3', ket: '' },
  { id: 'pers-nom-44', nama: 'DODIK EKO ARIPRABOWO, S.H.', pangkat: 'AIPDA', nrp: '85061749', jabatan: 'PS. PANIT 2 BINMAS', ket: '' },
  { id: 'pers-nom-45', nama: 'ERI SETYAWAN', pangkat: 'AIPDA', nrp: '85081180', jabatan: 'BANIT LANTAS', ket: '' },
  { id: 'pers-nom-46', nama: 'YUDHA SEPTYAWAN', pangkat: 'AIPDA', nrp: '85090287', jabatan: 'BHABIN PETERONGAN', ket: '' },
  { id: 'pers-nom-47', nama: 'ARIS ARDIANSYAH, S.H.', pangkat: 'AIPDA', nrp: '86020708', jabatan: 'PS. PANITMIN INTEL', ket: '' },
  { id: 'pers-nom-48', nama: 'ACHMAD ARWANI, S,Psi', pangkat: 'AIPDA', nrp: '86051244', jabatan: 'BHABIN BARUSARI', ket: '' },
  { id: 'pers-nom-49', nama: 'SARWO EDY', pangkat: 'AIPDA', nrp: '86121201', jabatan: 'PS. PANIT 1 UNIT BINMAS', ket: '' },
  { id: 'pers-nom-50', nama: 'HENGKI SETIAJI WIBOWO', pangkat: 'AIPDA', nrp: '87110151', jabatan: 'BAMIN SPKT 1', ket: '' },
  { id: 'pers-nom-51', nama: 'HERRY PUSPITA WIJAYA, S.H.', pangkat: 'AIPDA', nrp: '88040065', jabatan: 'BANIT INTELKAM', ket: '' },
  { id: 'pers-nom-52', nama: 'WAHYU ARIEF S', pangkat: 'BRIPKA', nrp: '87070766', jabatan: 'BAMIN SPKT 1', ket: '' },
  { id: 'pers-nom-53', nama: 'WIWIK HARYANTO', pangkat: 'BRIPKA', nrp: '77070917', jabatan: 'BAMIN SPKT 2', ket: '' },
  { id: 'pers-nom-54', nama: 'MUNIFATUL LUTHFIAH', pangkat: 'BRIGADIR', nrp: '95100760', jabatan: 'BANIT BINMAS', ket: '' },
  { id: 'pers-nom-55', nama: 'AFIF YUDHA PRATAMA', pangkat: 'BRIPTU', nrp: '97040637', jabatan: 'BAMIN SPKT 3', ket: '' },
  { id: 'pers-nom-56', nama: 'ARIEF MUNDRIANTO,S.H.', pangkat: 'AIPTU', nrp: '82050373', jabatan: 'BA POLSEK', ket: '' },
  { id: 'pers-nom-57', nama: 'TRIMANTO', pangkat: 'AIPTU', nrp: '73050517', jabatan: 'BAPOLSEK', ket: '' },
  { id: 'pers-nom-58', nama: 'YUNI KURNIA HAPSARI', pangkat: 'PENGATUR', nrp: '197906252014122003', jabatan: 'BANUM SIUM', ket: '' },
];

const EXISTING_OTHER_PERSONNEL: PersonnelRow[] = [
  {
    id: 'pers-0',
    nama: 'AGUS NURYANTO, S.H.',
    pangkat: 'IPTU',
    nrp: '73090344',
    jabatan: 'PS. KANITLANTAS POLSEK SMG SELATAN POLRESTABES SMG',
    ket: '',
  },
  {
    id: 'pers-6',
    nama: 'HARSONO',
    pangkat: 'IPTU',
    nrp: '76080214',
    jabatan: 'KANIT BINMAS',
    ket: '',
  },
  {
    id: 'pers-7',
    nama: 'BUDI SANTOSO, S.H.',
    pangkat: 'AIPDA',
    nrp: '86041095',
    jabatan: 'BHABIN WONODRI',
    ket: '',
  },
  {
    id: 'pers-8',
    nama: 'RENDRA KUSUMA',
    pangkat: 'BRIPKA',
    nrp: '89110342',
    jabatan: 'BANIT INTELKAM',
    ket: '',
  },
  {
    id: 'pers-9',
    nama: 'DWI PRASETYO',
    pangkat: 'AIPTU',
    nrp: '77090188',
    jabatan: 'KA SPKT 1',
    ket: '',
  },
];

export function mergePersonnelByNrp(
  baseList: PersonnelRow[],
  incomingList: PersonnelRow[]
): PersonnelRow[] {
  const byNrp = new Map<string, PersonnelRow>();
  const order: string[] = [];

  const upsert = (row: PersonnelRow) => {
    const key = row.nrp.trim();
    if (!key) return;
    if (!byNrp.has(key)) {
      order.push(key);
      byNrp.set(key, { ...row });
    } else {
      const existing = byNrp.get(key)!;
      byNrp.set(key, { ...existing, ...row, id: existing.id || row.id });
    }
  };

  baseList.forEach(upsert);
  incomingList.forEach(upsert);

  return order.map((key) => byNrp.get(key)!);
}

export const INITIAL_PERSONNEL_ROSTER: PersonnelRow[] = mergePersonnelByNrp(
  EXISTING_OTHER_PERSONNEL,
  NOMINATIF_POLSEK_SMG_SELATAN
);

export const DEFAULT_STAMP_CONFIG: StampSignatureConfig = {
  stampImageDataUrl: null,
  stampSizeCm: 4.7,
  stampOffsetXMm: 2,
  stampOffsetYMm: 2,
  stampMultiplyBlend: true,
  signatureImageDataUrl: null,
  signatureWidthCm: 5.2,
  signatureOffsetXMm: 18,
  signatureOffsetYMm: 14,
  signatureMultiplyBlend: true,
  aboveText: true,
};

export const DEFAULT_SPRIN_DOCUMENT: SprinDocument = {
  id: 'sprin-1488-x-2026',
  status: 'Siap Cetak',
  updatedAt: '2026-10-29T08:30:00.000Z',
  useLampiran: false,

  // Identitas Kesatuan
  polda: 'Polda Jawa Tengah',
  polres: 'Polrestabes Semarang',
  polsek: 'Polsek Semarang Selatan',
  tanggalKegiatan: '2026-10-29',
  pelaporNamaPangkat: 'IPTU AGUS NURYANTO, S.H.',
  pelaporJabatan: 'Ps. Kanitlantas Polsek Semarang Selatan',
  programQuickWins: 'Quick Wins 7 — Digitalisasi Pelaporan & Administrasi Operasional',

  // Surat Perintah 1 Halaman Tanpa Lampiran
  kopLine1: 'KEPOLISIAN NEGARA REPUBLIK INDONESIA',
  kopLine2: 'DAERAH JAWA TENGAH',
  kopLine3: 'RESOR KOTA BESAR SEMARANG',
  nomorSprin: 'Sprin/ 1488 /X/KEP./2026',
  pertimbangan:
    'guna tertib administrasi khususnya dalam rangka pelaksanaan tugas di lingkungan Polrestabes Semarang, dipandang perlu mengeluarkan surat perintah.',
  dasarList: [
    'Peraturan Kepolisian Negara Republik Indonesia Nomor 2 Tahun 2021 tentang Susunan Organisasi dan Tata Kerja pada tingkat Kepolisian Resor dan Kepolisian Sektor sebagaimana telah diubah dengan Peraturan Kepolisian Negara Republik Indonesia Nomor 7 Tahun 2025 tentang Perubahan atas Peraturan Kepolisian Negara Republik Indonesia Nomor 2 Tahun 2021 tentang Susunan Organisasi dan Tata Kerja pada tingkat Kepolisian Resor dan Kepolisian Sektor.',
  ],
  kepadaText:
    'NAMA, PANGKAT, NRP DAN JABATANNYA SEPERTI TERSEBUT DALAM LAMPIRAN SURAT PERINTAH INI.',
  untukList: [
    'sambil menunggu keputusan yang bersifat definitif, agar melaksanakan tugas sebagai Pama Polrestabes Semarang;',
    'melaksanakan perintah ini dengan seksama dan penuh rasa tanggung jawab;',
    'surat perintah ini berlaku sejak dikeluarkan sampai dengan adanya keputusan yang berkaitan dengan penempatannya.',
  ],
  tembusanList: [
    'Kasiwas Polrestabes Semarang.',
    'Kasipropam Polrestabes Semarang.',
    'Kapolsek Semarang Selatan Polrestabes Semarang.',
  ],

  // Lampiran (digunakan bila mode Lampiran diaktifkan)
  lampiranHeaderTitle: 'LAMPIRAN SPRIN KAPOLSEK SMG SLTN',
  lampiranNomor: 'SPRIN / 1488 /X/ KEP./ 2026',
  lampiranTanggalUpper: '29 OKTOBER 2026',
  lampiranJudul: 'DAFTAR NAMA PERSONEL YANG DIPERINTAHKAN',
  lampiranSubjudul: 'PADA TANGGAL 29 OKTOBER 2026',
  personelList: [INITIAL_PERSONNEL_ROSTER[0]],

  // Pengesahan & Pejabat
  dikeluarkanDi: 'Semarang',
  tanggalSuratHal1: '29       Oktober 2026',
  tanggalSuratHal2: '29       Oktober 2026',
  pejabatJabatan: 'KAPOLRESTABES SEMARANG POLDA JATENG',
  pejabatNama: 'ERLIN TANG JAYA, S.H., S.I.K., M.H.',
  pejabatPangkatNrp: 'KOMISARIS BESAR POLISI NRP 78061264',
  showStampAndSignature: true,
  stampResorText: 'POLRI DAERAH JAWA TENGAH',
  stampSektorText: 'RESOR KOTA BESAR SEMARANG',
  stampConfig: { ...DEFAULT_STAMP_CONFIG },
};

export const INITIAL_ARCHIVE_DOCUMENTS: SprinDocument[] = [
  DEFAULT_SPRIN_DOCUMENT,
  {
    ...DEFAULT_SPRIN_DOCUMENT,
    id: 'sprin-211-xi-2026',
    status: 'Terbit',
    updatedAt: '2026-11-18T08:30:00.000Z',
    useLampiran: true,
    kopLine1: 'POLRI DAERAH JAWA TENGAH',
    kopLine2: 'RESOR KOTA BESAR SEMARANG',
    kopLine3: 'SEKTOR SEMARANG SELATAN',
    nomorSprin: 'Sprin /  211  / XI / HUK.6.6./2026',
    pertimbangan:
      'bahwa dalam untuk kelancaran kegiatan Pentas Seni di SMAN 11 Semarang, maka dipandang perlu mengeluarkan Surat Perintah ini.',
    dasarList: [
      'undang – Undang Republik Indonesia Nomor 2 tahun 2002 tentang Kepolisian Negara Republik Indonesia.',
      'surat rekomendasi Kapolsek Semarang Selatan Nomor : B/    /XI/YAN.2.4/2025, Tanggal    November 2026 tentang rekomendasi keramaian.',
    ],
    untukList: [
      'disamping tugas sehari – hari agar melaksanakan pengamanan Pentas Seni yang diselenggarakan oleh SMAN 11 Semarang;',
      'kegiatan dilaksanakan pada hari Kamis tanggal 19 November 2026 pukul 09.00 s,d 17.00 Wib;',
      'melaporkan hasil pelaksanaan tugas kepada Kapolsek;',
      'melaksanakan perintah ini dengan seksama dan penuh rasa tanggung jawab.',
    ],
    tembusanList: ['Kapolrestabes Semarang', 'Kabagops Polrestabes Smg'],
    lampiranHeaderTitle: 'LAMPIRAN  SPRIN  KAPOLSEK  SMG SLTN',
    lampiranNomor: 'SPRIN /   211   /XI/ HUK.6.6./ 2026',
    lampiranTanggalUpper: '18        NOVEMBER 2026',
    lampiranJudul: 'DAFTAR NAMA PERS PENGAMANAN PENSI SMAN 11 SEMARANG',
    lampiranSubjudul: 'PADA HARI KAMIS TANGGAL 19 NOVEMBER 2026',
    tanggalSuratHal1: '5       November 2026',
    tanggalSuratHal2: '18        November 2026',
    pejabatJabatan: 'KAPOLSEK SEMARANG SELATAN POLRESTABES SEMARANG',
    pejabatNama: 'RISMANTO, S.H.,M.H.',
    pejabatPangkatNrp: 'KOMISARIS POLISI NRP 73020406',
    stampResorText: 'POLRI RESOR KOTA BESAR SEMARANG',
    stampSektorText: 'SEKTOR SEMARANG SELATAN',
    personelList: INITIAL_PERSONNEL_ROSTER.filter((p) =>
      ['75050022', '84091212', '78041138', '84030769', '85090287'].includes(p.nrp)
    ).map((p) => ({ ...p })),
  },
];
