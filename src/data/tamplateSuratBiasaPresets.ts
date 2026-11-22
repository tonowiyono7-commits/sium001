// Data preset template Surat Biasa dari repository Tamplate-surat-biasa
export interface RepoLetterTemplate {
  id: string;
  title: string;
  category: string;
  kop: { instansi: string; satuanInduk: string; alamat: string };
  identitas: {
    klasifikasiKode: string;
    nomorUrut: string;
    bulanRomawi: string;
    kodeKlasifikasi: string;
    tahun: string;
    satkerPenerbit: string;
    klasifikasiLabel: string;
    lampiran: string;
    hal: string;
    tempat: string;
    tanggal: string;
    headerLanjutanJudul: string;
  };
  tujuan: { kepada: string; tempatTujuan: string };
  rujukan: { id: string; teks: string }[];
  latarBelakang: string;
  pembukaDirektif: string;
  direktifList: {
    id: string;
    pejabat: string;
    jenis: "poin" | "paragraf";
    poin: { id: string; teks: string }[];
  }[];
  penutup: string;
  penandaTangan: {
    atasNama: string;
    jabatanUtama: string;
    jabatanPenandaTangan: string;
    nama: string;
    pangkat: string;
    nrp: string;
  };
  tembusan: { id: string; teks: string }[];
}

export const REPO_SURAT_BIASA_TEMPLATES: RepoLetterTemplate[] = [
  {
    "id": "ref-b-14381-hidrometeorologi",
    "title": "Jukrah Antisipasi & Penanganan Bencana Hidrometeorologi (Referensi Asli)",
    "category": "Referensi PDF B/14381",
    "kop": {
      "instansi": "KEPOLISIAN NEGARA REPUBLIK INDONESIA",
      "satuanInduk": "DAERAH JAWA TENGAH",
      "alamat": "Jalan Pahlawan 1, Semarang 50243"
    },
    "identitas": {
      "klasifikasiKode": "B",
      "nomorUrut": "14381",
      "bulanRomawi": "XI",
      "kodeKlasifikasi": "OPS.2.1.",
      "tahun": "2026",
      "satkerPenerbit": "Roops",
      "klasifikasiLabel": "Biasa",
      "lampiran": "-",
      "hal": "petunjuk dan arahan antisipasi dan penanganan bencana hidrometeorologi di Wilkum Polda Jateng",
      "tempat": "Semarang",
      "tanggal": "13 November 2026",
      "headerLanjutanJudul": "SURAT KAPOLDA JATENG"
    },
    "tujuan": {
      "kepada": "DISTRIBUSI A-2, B DAN C POLDA JATENG",
      "tempatTujuan": "Tempat"
    },
    "rujukan": [
      {
        "id": "ruj-1",
        "teks": "Undang-Undang Nomor 2 Tahun 2002 tentang Kepolisian Negara Republik Indonesia sebagaimana telah beberapa kali diubah terakhir dengan Undang-Undang Nomor 5 Tahun 2026 tentang Perubahan Ketiga atas Undang-Undang Nomor 2 Tahun 2002 tentang Kepolisian Negara Republik Indonesia;"
      },
      {
        "id": "ruj-2",
        "teks": "Surat Telegram Rahasia Kepala Kepolisian Negara Republik Indonesia Nomor STR/3045/XI/OPS.2.1./2026 tanggal 9 November 2026 tentang langkah-langkah antisipasi dan penanganan bencana hidrometeorologi."
      }
    ],
    "latarBelakang": "Berdasarkan informasi prakiraan cuaca BMKG periode 6 sampai dengan 12 November 2026, kondisi cuaca di sebagian besar wilayah Indonesia diprakirakan didominasi hujan dengan intensitas ringan, namun terdapat potensi peningkatan intensitas hujan menjadi sedang di sejumlah wilayah, termasuk Jawa Tengah. Kondisi tersebut perlu diwaspadai mengingat hujan yang dapat disertai kilat atau petir dan angin kencang berpotensi menimbulkan bencana hidrometeorologi, seperti banjir, banjir bandang, tanah longsor, angin puting beliung, dan genangan air. Potensi bencana tersebut dapat berdampak terhadap keselamatan masyarakat, kerusakan permukiman dan infrastruktur, gangguan transportasi, aktivitas perekonomian, serta situasi keamanan dan ketertiban masyarakat. Oleh karena itu, diperlukan peningkatan kesiapsiagaan personel, pemetaan wilayah rawan bencana, kesiapan sarana dan prasarana, penguatan koordinasi dengan pemerintah daerah, BMKG, BPBD, TNI, dan pemangku kepentingan terkait, serta penyusunan langkah mitigasi dan penanganan secara terpadu guna meminimalkan risiko dan dampak bencana di Wilayah Hukum Polda Jawa Tengah",
    "pembukaDirektif": "Berkaitan dengan hal tersebut, guna meningkatkan kesiapsiagaan, mengantisipasi potensi gangguan keamanan dan ketertiban masyarakat, serta mengoptimalkan penanganan bencana hidrometeorologi di wilayah hukum Polda Jawa Tengah, diperintahkan kepada para pejabat tersebut alamat untuk melaksanakan langkah-langkah sebagai berikut:",
    "direktifList": [
      {
        "id": "dir-a",
        "pejabat": "Kepada Dirintelkam agar:",
        "jenis": "poin",
        "poin": [
          {
            "id": "dir-a-1",
            "teks": "Melaksanakan deteksi dini, penggalangan, dan pemetaan terhadap wilayah yang berpotensi mengalami bencana banjir, banjir bandang, tanah longsor, dan bencana hidrometeorologi lainnya di wilayah hukum Polda Jawa Tengah;"
          },
          {
            "id": "dir-a-2",
            "teks": "Meningkatkan fungsi intelijen melalui analisis intelijen dan pengumpulan bahan keterangan guna memprediksi perkembangan situasi serta potensi gangguan kamtibmas yang dapat timbul akibat bencana, seperti kemacetan, konflik sosial, penjarahan, keresahan masyarakat, dan gangguan distribusi kebutuhan pokok;"
          },
          {
            "id": "dir-a-3",
            "teks": "Melaksanakan koordinasi dengan BMKG, BPBD, pemerintah daerah, dan instansi terkait untuk memperoleh informasi perkembangan cuaca, kondisi wilayah rawan bencana, serta potensi dampaknya sebagai bahan deteksi dan peringatan dini;"
          },
          {
            "id": "dir-a-4",
            "teks": "Menyusun perkiraan intelijen sebagai bahan pertimbangan pimpinan dalam menentukan langkah antisipasi, penanganan keadaan darurat, dan kemungkinan penyelenggaraan Operasi Aman Nusa II;"
          },
          {
            "id": "dir-a-5",
            "teks": "Memberikan asistensi kepada Satwil jajaran serta membuat jukrah teknis terkait fungsi Intelkam dalam rangka antisipasi dan penanganan potensi gangguan kamtibmas akibat bencana hidrometeorologi."
          }
        ]
      },
      {
        "id": "dir-b",
        "pejabat": "Kepada Dirbinmas agar:",
        "jenis": "poin",
        "poin": [
          {
            "id": "dir-b-1",
            "teks": "Memberikan bimbingan teknis dan pendampingan kepada Satwil jajaran dalam pelaksanaan kegiatan sambang, tatap muka, penyuluhan, dan penerangan kepada masyarakat mengenai potensi bencana banjir, tanah longsor, angin kencang, dan cuaca ekstrem;"
          },
          {
            "id": "dir-b-2",
            "teks": "Mengoptimalkan peran Bhabinkamtibmas dalam memberikan edukasi kepada masyarakat, khususnya yang berada di wilayah rawan bencana, mengenai langkah penyelamatan diri, kesiapsiagaan keluarga, jalur evakuasi, dan lokasi pengungsian;"
          },
          {
            "id": "dir-b-3",
            "teks": "Melaksanakan mitigasi kamtibmas dengan mengedepankan pendekatan persuasif guna mencegah keresahan, kepanikan, konflik sosial, dan gangguan ketertiban masyarakat yang berpotensi timbul akibat bencana;"
          },
          {
            "id": "dir-b-4",
            "teks": "Meningkatkan koordinasi dan pemberdayaan tokoh masyarakat, tokoh agama, tokoh pemuda, Satlinmas, Karang Taruna serta unsur masyarakat lainnya untuk mendukung kesiapsiagaan dan penanganan bencana;"
          },
          {
            "id": "dir-b-5",
            "teks": "Memberikan asistensi kepada Satwil jajaran serta membuat jukrah teknis terkait fungsi Binmas dalam rangka meningkatkan partisipasi masyarakat menghadapi potensi bencana hidrometeorologi."
          }
        ]
      },
      {
        "id": "dir-c",
        "pejabat": "Kepada Kabidhumas agar:",
        "jenis": "poin",
        "poin": [
          {
            "id": "dir-c-1",
            "teks": "Melaksanakan manajemen media secara komprehensif dengan memantau perkembangan informasi mengenai potensi bencana hidrometeorologi melalui media massa, media sosial, dan platform informasi lainnya guna mendeteksi informasi yang tidak benar atau berpotensi menimbulkan keresahan masyarakat;"
          },
          {
            "id": "dir-c-2",
            "teks": "Melaksanakan penyampaian informasi dan klarifikasi terhadap informasi yang tidak benar dengan mengutamakan data resmi dari BMKG, BPBD, dan instansi berwenang agar masyarakat memperoleh informasi yang akurat, edukatif, dan tidak menimbulkan kepanikan;"
          },
          {
            "id": "dir-c-3",
            "teks": "Mengoptimalkan publikasi mengenai peringatan dini cuaca ekstrem, kesiapsiagaan menghadapi bencana, langkah penyelamatan diri, serta informasi jalur evakuasi dan lokasi pengungsian;"
          },
          {
            "id": "dir-c-4",
            "teks": "Melaksanakan dokumentasi dan publikasi kegiatan kesiapsiagaan, mitigasi, evakuasi, pencarian dan pertolongan, serta pelayanan kepolisian kepada masyarakat terdampak bencana;"
          },
          {
            "id": "dir-c-5",
            "teks": "Memberikan asistensi kepada Satwil jajaran serta membuat jukrah teknis terkait fungsi Humas dalam rangka mendukung penyampaian informasi dan komunikasi publik pada situasi bencana"
          }
        ]
      },
      {
        "id": "dir-d",
        "pejabat": "Kepada Dirsamapta agar:",
        "jenis": "poin",
        "poin": [
          {
            "id": "dir-d-1",
            "teks": "Menyusun cara bertindak dan produk-produk fungsi Samapta dalam rangka mendukung kesiapsiagaan, mitigasi, dan penanganan gangguan kamtibmas akibat bencana hidrometeorologi;"
          },
          {
            "id": "dir-d-2",
            "teks": "Mengorganisasi dan menyiapkan personel, alat material khusus, perlengkapan penyelamatan, serta kendaraan dinas fungsi Samapta, baik di tingkat Direktorat maupun Satwil jajaran, agar siap digerakkan dan diperbantukan apabila dibutuhkan;"
          },
          {
            "id": "dir-d-3",
            "teks": "Meningkatkan patroli pada wilayah rawan banjir, tanah longsor, permukiman masyarakat, objek vital, fasilitas umum, dan lokasi yang berpotensi menjadi tempat pengungsian;"
          },
          {
            "id": "dir-d-4",
            "teks": "Memberikan asistensi kepada Satwil jajaran dalam rangka pelaksanaan pengamanan lokasi bencana, pengungsian, distribusi bantuan, serta pemeliharaan keamanan dan ketertiban masyarakat;"
          },
          {
            "id": "dir-d-5",
            "teks": "Menyiagakan personel Ditsamapta Polda Jateng agar siap di BKO kan;"
          },
          {
            "id": "dir-d-6",
            "teks": "Membuat jukrah teknis terkait fungsi Samapta kepada Satwil jajaran untuk mendukung pelaksanaan tugas kepolisian dalam menghadapi bencana hidrometeorologi."
          }
        ]
      },
      {
        "id": "dir-e",
        "pejabat": "Kepada Dirpamobvit agar:",
        "jenis": "poin",
        "poin": [
          {
            "id": "dir-e-1",
            "teks": "Menyusun cara bertindak dalam rangka pengamanan objek vital, sentra perekonomian, fasilitas pelayanan publik, dan infrastruktur strategis yang berada di wilayah berpotensi terdampak bencana hidrometeorologi;"
          },
          {
            "id": "dir-e-2",
            "teks": "Melatih dan mengorganisasi personel fungsi Pamobvit, baik di tingkat Direktorat maupun Satwil jajaran, serta menyiapkan alat material khusus dan kendaraan dinas untuk mendukung kesiapsiagaan menghadapi bencana;"
          },
          {
            "id": "dir-e-3",
            "teks": "Melaksanakan koordinasi dengan pengelola objek vital dan instansi terkait guna mengidentifikasi potensi kerawanan serta menyiapkan langkah pengamanan dan evakuasi apabila terjadi bencana;"
          },
          {
            "id": "dir-e-4",
            "teks": "Memberikan asistensi kepada Satwil jajaran dalam pelaksanaan pengamanan objek vital, sentra ekonomi, dan fasilitas umum yang terdampak bencana guna menjaga kelangsungan pelayanan serta mencegah gangguan kamtibmas;"
          },
          {
            "id": "dir-e-5",
            "teks": "Menyiagakan personel Ditpamobvit Polda Jateng agar siap di BKO kan;"
          },
          {
            "id": "dir-e-6",
            "teks": "Membuat jukrah teknis terkait fungsi Pamobvit kepada Satwil jajaran."
          }
        ]
      },
      {
        "id": "dir-f",
        "pejabat": "Kepada Dirpolairud agar:",
        "jenis": "poin",
        "poin": [
          {
            "id": "dir-f-1",
            "teks": "Melaksanakan pemetaan dan pemantauan wilayah perairan, pesisir, sungai, dan daerah aliran sungai yang berpotensi terdampak banjir, banjir bandang, serta cuaca ekstrem;"
          },
          {
            "id": "dir-f-2",
            "teks": "Meningkatkan kesiapsiagaan personel, kapal patroli, perahu karet, alat keselamatan, dan perlengkapan pencarian serta pertolongan untuk mendukung evakuasi masyarakat pada wilayah terdampak banjir;"
          },
          {
            "id": "dir-f-3",
            "teks": "Melaksanakan koordinasi dengan Basarnas, BPBD, TNI, pemerintah daerah, dan instansi terkait dalam rangka penyiapan bantuan pencarian dan pertolongan di wilayah perairan;"
          },
          {
            "id": "dir-f-4",
            "teks": "Melaksanakan sambang dan memberikan imbauan kepada masyarakat pesisir, nelayan, serta masyarakat di sekitar sungai mengenai bahaya cuaca ekstrem dan peningkatan debit air;"
          },
          {
            "id": "dir-f-5",
            "teks": "Menyiagakan personel Ditpolairud Polda Jateng agar siap di BKO kan;"
          },
          {
            "id": "dir-f-6",
            "teks": "Memberikan asistensi kepada Satwil jajaran serta membuat jukrah teknis terkait fungsi Polairud dalam rangka mendukung kesiapsiagaan dan penanganan bencana hidrometeorologi"
          }
        ]
      },
      {
        "id": "dir-g",
        "pejabat": "Kepada Dirlantas agar:",
        "jenis": "poin",
        "poin": [
          {
            "id": "dir-g-1",
            "teks": "Melaksanakan pemetaan ruas jalan, jalur utama, jalur alternatif, jembatan, dan akses transportasi yang berpotensi terdampak banjir, tanah longsor, pohon tumbang, serta cuaca ekstrem;"
          },
          {
            "id": "dir-g-2",
            "teks": "Mengorganisasi personel, alat material khusus, dan kendaraan fungsi lalu lintas untuk mendukung mobilisasi personel, kendaraan bantuan, serta kelancaran evakuasi masyarakat pada wilayah terdampak bencana;"
          },
          {
            "id": "dir-g-3",
            "teks": "Menyiapkan cara bertindak berupa pengaturan, penjagaan, pengawalan, patroli, dan rekayasa lalu lintas pada ruas jalan yang berpotensi mengalami hambatan akibat bencana;"
          },
          {
            "id": "dir-g-4",
            "teks": "Mengantisipasi potensi kemacetan, penutupan akses jalan, serta hambatan lalu lintas akibat genangan air, banjir, tanah longsor, dan kerusakan infrastruktur jalan, termasuk menyiapkan jalur alternatif bersama instansi terkait;"
          },
          {
            "id": "dir-g-5",
            "teks": "Memberikan asistensi kepada Satwil jajaran dalam pelaksanaan pengaturan lalu lintas pada jalur evakuasi, akses menuju lokasi pengungsian, dan jalur distribusi bantuan kemanusiaan;"
          },
          {
            "id": "dir-g-6",
            "teks": "Membuat jukrah teknis terkait fungsi lalu lintas kepada Satwil jajaran dalam rangka mendukung keselamatan dan kelancaran mobilitas masyarakat pada saat terjadi bencana"
          }
        ]
      },
      {
        "id": "dir-h",
        "pejabat": "Kepada Dansatbrimob agar:",
        "jenis": "poin",
        "poin": [
          {
            "id": "dir-h-1",
            "teks": "Mengorganisasi personel, alat material khusus, kendaraan taktis, kendaraan pendukung, dan perlengkapan penyelamatan fungsi Brimob guna mendukung kesiapsiagaan penanganan bencana hidrometeorologi;"
          },
          {
            "id": "dir-h-2",
            "teks": "Meningkatkan kemampuan personel melalui latihan pencarian dan pertolongan, evakuasi korban, penanganan keadaan darurat, serta penggunaan peralatan penyelamatan pada wilayah terdampak banjir dan tanah longsor;"
          },
          {
            "id": "dir-h-3",
            "teks": "Menyiapkan unit bantuan SAR beserta perlengkapan pendukung yang siap digerakkan untuk membantu penanganan bencana sesuai kebutuhan dan permintaan satuan kewilayahan;"
          },
          {
            "id": "dir-h-4",
            "teks": "Memberikan asistensi serta dukungan personel dan peralatan kepada Satwil jajaran dalam rangka pelaksanaan evakuasi, pencarian korban, dan penanganan keadaan darurat;"
          },
          {
            "id": "dir-h-5",
            "teks": "Membuat produk-produk fungsi Brimob yang mendukung antisipasi dan penanganan dampak bencana hidrometeorologi"
          }
        ]
      },
      {
        "id": "dir-i",
        "pejabat": "Kepada Dirreskrimum agar:",
        "jenis": "poin",
        "poin": [
          {
            "id": "dir-i-1",
            "teks": "Memberikan bimbingan teknis dan asistensi kepada Satwil jajaran dalam rangka penegakan hukum terhadap tindak pidana yang terjadi selama maupun setelah bencana hidrometeorologi;"
          },
          {
            "id": "dir-i-2",
            "teks": "Meningkatkan kesiapsiagaan dalam mengantisipasi tindak pidana pencurian, penjarahan, pemerasan, kekerasan, dan tindak pidana lainnya yang memanfaatkan situasi bencana;"
          },
          {
            "id": "dir-i-3",
            "teks": "Mengorganisasi personel, sarana dan prasarana, serta kendaraan pendukung fungsi Reskrimum guna mendukung pelaksanaan tugas penegakan hukum apabila terjadi gangguan kamtibmas di wilayah terdampak;"
          },
          {
            "id": "dir-i-4",
            "teks": "Memberikan asistensi kepada Satwil jajaran dalam penanganan perkara tindak pidana yang terjadi pada lokasi bencana maupun tempat pengungsian sesuai ketentuan peraturan perundang-undangan;"
          },
          {
            "id": "dir-i-5",
            "teks": "Membuat jukrah teknis terkait fungsi Reskrimum kepada Satwil jajaran."
          }
        ]
      },
      {
        "id": "dir-j",
        "pejabat": "Kepada Dirressiber agar:",
        "jenis": "poin",
        "poin": [
          {
            "id": "dir-j-1",
            "teks": "Meningkatkan pemantauan terhadap perkembangan informasi bencana hidrometeorologi di ruang siber, khususnya informasi yang tidak benar, provokatif, atau berpotensi menimbulkan keresahan dan kepanikan masyarakat;"
          },
          {
            "id": "dir-j-2",
            "teks": "Melaksanakan penelusuran terhadap dugaan penyebaran informasi bohong dan penyalahgunaan media digital yang berkaitan dengan situasi bencana, serta melakukan penegakan hukum apabila ditemukan unsur tindak pidana sesuai ketentuan peraturan perundang-undangan;"
          },
          {
            "id": "dir-j-3",
            "teks": "Mengorganisasi personel, sarana dan prasarana, serta perangkat pendukung fungsi Siber dalam rangka kesiapsiagaan menghadapi potensi gangguan kamtibmas di ruang digital;"
          },
          {
            "id": "dir-j-4",
            "teks": "Melaksanakan koordinasi dengan fungsi Humas dan instansi terkait guna mendukung penyampaian informasi yang benar dan mencegah penyebaran informasi menyesatkan mengenai bencana;"
          },
          {
            "id": "dir-j-5",
            "teks": "Memberikan asistensi kepada Satwil jajaran serta membuat jukrah teknis terkait fungsi Siber"
          }
        ]
      },
      {
        "id": "dir-k",
        "pejabat": "Kepada Dirres PPA dan PPO agar:",
        "jenis": "poin",
        "poin": [
          {
            "id": "dir-k-1",
            "teks": "Memberikan bimbingan teknis dan asistensi kepada Satwil jajaran dalam rangka pencegahan serta penanganan tindak pidana terhadap perempuan, anak, dan kelompok rentan yang terdampak bencana hidrometeorologi;"
          },
          {
            "id": "dir-k-2",
            "teks": "Meningkatkan kesiapsiagaan personel dalam memberikan perlindungan dan pelayanan terhadap perempuan, anak, penyandang disabilitas, lanjut usia, dan kelompok rentan lainnya pada lokasi pengungsian maupun wilayah terdampak bencana;"
          },
          {
            "id": "dir-k-3",
            "teks": "Melaksanakan koordinasi dengan instansi terkait guna mendukung tersedianya mekanisme perlindungan, pengaduan, dan penanganan terhadap kelompok rentan selama masa tanggap darurat;"
          },
          {
            "id": "dir-k-4",
            "teks": "Memberikan asistensi kepada Satwil jajaran dalam penanganan perkara serta perlindungan terhadap korban tindak pidana di wilayah terdampak bencana;"
          },
          {
            "id": "dir-k-5",
            "teks": "Membuat jukrah teknis terkait fungsi PPA dan PPO kepada Satwil jajaran"
          }
        ]
      },
      {
        "id": "dir-l",
        "pejabat": "Kepada Dirresnarkoba dan Dirreskrimsus agar:",
        "jenis": "poin",
        "poin": [
          {
            "id": "dir-l-1",
            "teks": "Mengorganisasi personel, sarana dan prasarana, alat material khusus, serta kendaraan dinas yang dimiliki untuk mendukung pelaksanaan tugas kepolisian dalam rangka antisipasi dan penanganan gangguan kamtibmas akibat bencana hidrometeorologi;"
          },
          {
            "id": "dir-l-2",
            "teks": "Menyiapkan personel yang dapat diperbantukan kepada fungsi Reskrimum maupun Satwil jajaran apabila diperlukan dalam pelaksanaan tugas penegakan hukum pada wilayah terdampak bencana;"
          },
          {
            "id": "dir-l-3",
            "teks": "Melaksanakan deteksi terhadap potensi tindak pidana sesuai bidang tugas masing-masing yang dapat timbul atau meningkat akibat situasi bencana;"
          },
          {
            "id": "dir-l-4",
            "teks": "Melaksanakan koordinasi dan memberikan dukungan penegakan hukum sesuai kewenangan apabila ditemukan tindak pidana yang memanfaatkan kondisi bencana"
          }
        ]
      },
      {
        "id": "dir-m",
        "pejabat": "Kepada Kabiddokkes agar:",
        "jenis": "poin",
        "poin": [
          {
            "id": "dir-m-1",
            "teks": "Menyusun cara bertindak dan produk-produk fungsi Dokkes untuk mendukung kesiapsiagaan dan penanganan dampak bencana hidrometeorologi;"
          },
          {
            "id": "dir-m-2",
            "teks": "Mengorganisasi personel kesehatan, tenaga medis, ambulans, obat-obatan, perlengkapan pertolongan pertama, serta sarana dan prasarana kesehatan untuk mendukung pelayanan kepada masyarakat terdampak bencana;"
          },
          {
            "id": "dir-m-3",
            "teks": "Menyiapkan tim kesehatan lapangan yang siap digerakkan untuk memberikan pertolongan pertama, pelayanan medis darurat, dan dukungan kesehatan pada lokasi bencana maupun tempat pengungsian;"
          },
          {
            "id": "dir-m-4",
            "teks": "Melaksanakan koordinasi dengan Dinas Kesehatan, rumah sakit rujukan, fasilitas pelayanan kesehatan, dan relawan kesehatan guna mendukung penanganan korban serta pemenuhan kebutuhan pelayanan medis;"
          },
          {
            "id": "dir-m-5",
            "teks": "Menyiagakan personel Biddokkes Polda Jateng agar siap di BKO kan;"
          },
          {
            "id": "dir-m-6",
            "teks": "Memberikan asistensi kepada Satwil jajaran serta membuat jukrah teknis terkait fungsi Dokkes dalam rangka kesiapsiagaan dan penanganan bencana hidrometeorologi"
          }
        ]
      },
      {
        "id": "dir-n",
        "pejabat": "Kepada Kabidpropam agar:",
        "jenis": "poin",
        "poin": [
          {
            "id": "dir-n-1",
            "teks": "Menyiapkan produk-produk fungsi Propam yang mendukung pelaksanaan tugas kepolisian dalam menghadapi potensi bencana hidrometeorologi;"
          },
          {
            "id": "dir-n-2",
            "teks": "Mengorganisasi personel fungsi Propam, baik di tingkat Satker Mapolda maupun Satwil jajaran, untuk mendukung pelaksanaan tugas kepolisian serta siap diperbantukan apabila dibutuhkan;"
          },
          {
            "id": "dir-n-3",
            "teks": "Melaksanakan pengawasan terhadap kesiapan, kedisiplinan, dan pelaksanaan tugas personel kepolisian dalam kegiatan mitigasi, evakuasi, pengamanan, serta pelayanan kepada masyarakat terdampak bencana;"
          },
          {
            "id": "dir-n-4",
            "teks": "Memberikan asistensi kepada Satwil jajaran guna memastikan seluruh personel melaksanakan tugas secara profesional, bertanggung jawab, dan sesuai dengan ketentuan yang berlaku"
          }
        ]
      },
      {
        "id": "dir-o",
        "pejabat": "Kepada Kabid TIK agar:",
        "jenis": "poin",
        "poin": [
          {
            "id": "dir-o-1",
            "teks": "Memastikan kesiapan dan keamanan sistem informasi serta sarana komunikasi kepolisian, meliputi perangkat radio komunikasi, jaringan internet, CCTV, dan sarana konferensi video dalam rangka mendukung kesiapsiagaan penanganan bencana hidrometeorologi;"
          },
          {
            "id": "dir-o-2",
            "teks": "Mengorganisasi personel fungsi TIK serta menyiapkan perangkat komunikasi dan sarana pendukung yang dapat digunakan dalam situasi darurat;"
          },
          {
            "id": "dir-o-3",
            "teks": "Menyiapkan sistem komunikasi alternatif untuk mengantisipasi terputusnya jaringan komunikasi akibat banjir, tanah longsor, maupun kerusakan infrastruktur telekomunikasi;"
          },
          {
            "id": "dir-o-4",
            "teks": "Mendukung kelancaran komunikasi, koordinasi, serta penyampaian informasi dari lokasi bencana kepada pos komando dan pimpinan;"
          },
          {
            "id": "dir-o-5",
            "teks": "Membuat produk-produk fungsi TIK yang mendukung kesiapsiagaan dan penanganan bencana hidrometeorologi"
          }
        ]
      },
      {
        "id": "dir-p",
        "pejabat": "Kepada Kabid Labfor apabila diperlukan agar memberikan dukungan pembuktian ilmiah melalui pemeriksaan teknis dan laboratoris terhadap barang bukti maupun tempat kejadian perkara yang berkaitan dengan dugaan tindak pidana pada situasi bencana hidrometeorologi guna mendukung proses penyelidikan dan penyidikan sesuai ketentuan yang berlaku.",
        "jenis": "paragraf",
        "poin": []
      },
      {
        "id": "dir-q",
        "pejabat": "Kepada Kapolres/Ta/Tabes Polda Jateng agar:",
        "jenis": "poin",
        "poin": [
          {
            "id": "dir-q-1",
            "teks": "Melaksanakan pemetaan wilayah dan masyarakat yang berpotensi terdampak bencana hidrometeorologi, khususnya daerah rawan banjir, banjir bandang, tanah longsor, genangan air, serta wilayah yang berpotensi mengalami dampak cuaca ekstrem;"
          },
          {
            "id": "dir-q-2",
            "teks": "Meningkatkan koordinasi dan sinergi dengan pemerintah daerah, BPBD, BMKG, TNI, Basarnas, serta pemangku kepentingan terkait dalam rangka kesiapsiagaan, mitigasi, dan penanganan bencana secara terpadu;"
          },
          {
            "id": "dir-q-3",
            "teks": "Melaksanakan pemantauan terhadap perkembangan informasi cuaca terkini melalui kanal resmi BMKG, termasuk situs www.bmkg.go.id, media sosial @infobmkg, dan aplikasi Info BMKG sebagai bahan peringatan dini kepada masyarakat;"
          },
          {
            "id": "dir-q-4",
            "teks": "Melaksanakan sosialisasi dan edukasi kepada masyarakat mengenai potensi banjir, tanah longsor, angin kencang, serta langkah penyelamatan diri apabila terjadi bencana hidrometeorologi;"
          },
          {
            "id": "dir-q-5",
            "teks": "Melaksanakan mitigasi terhadap potensi permasalahan dan gangguan kamtibmas akibat bencana, antara lain kemacetan, konflik sosial, penjarahan, kerusakan lingkungan, dan pelanggaran hukum lainnya, serta menyiapkan langkah penanganannya;"
          },
          {
            "id": "dir-q-6",
            "teks": "Memastikan kesiapan personel, sarana dan prasarana, kendaraan operasional, perlengkapan penyelamatan, serta dukungan logistik yang memadai untuk menghadapi kemungkinan terjadinya bencana;"
          },
          {
            "id": "dir-q-7",
            "teks": "Menyusun dan menyiapkan rencana kontingensi penanganan bencana hidrometeorologi, meliputi tanggap darurat, evakuasi dan penyelamatan, pemenuhan kebutuhan dasar masyarakat, pembentukan pos komando, serta pemeliharaan keamanan dan ketertiban masyarakat;"
          },
          {
            "id": "dir-q-8",
            "teks": "Meningkatkan patroli dan pengamanan pada wilayah rawan bencana, permukiman masyarakat, objek vital, fasilitas umum, pusat perekonomian, jalur transportasi, serta lokasi yang berpotensi menjadi tempat pengungsian;"
          },
          {
            "id": "dir-q-9",
            "teks": "Menyiapkan dan memastikan kesiapan jalur evakuasi, lokasi pengungsian, serta akses distribusi bantuan, termasuk langkah pengaturan dan rekayasa lalu lintas apabila terjadi gangguan transportasi akibat banjir maupun tanah longsor;"
          },
          {
            "id": "dir-q-10",
            "teks": "Menyiapkan unit bantuan SAR serta melaksanakan koordinasi dengan Basarnas, BPBD, TNI, dan unsur terkait guna mendukung pencarian, pertolongan, serta evakuasi masyarakat apabila terjadi bencana;"
          },
          {
            "id": "dir-q-11",
            "teks": "Apabila terjadi bencana banjir, banjir bandang, tanah longsor, atau bencana hidrometeorologi lainnya yang menimbulkan korban jiwa, pengungsian, maupun kerusakan fasilitas, segera melaksanakan langkah penanganan sesuai eskalasi situasi, termasuk evakuasi, pencarian dan pertolongan, pengamanan lokasi, pengaturan lalu lintas, dan pelayanan kepada masyarakat;"
          },
          {
            "id": "dir-q-12",
            "teks": "Apabila terjadi bencana yang menimbulkan korban, pengungsian, atau kerusakan fasilitas, Satwil dapat menyelenggarakan Operasi Aman Nusa II berdasarkan perkiraan intelijen dan penilaian pimpinan serta sesuai ketentuan yang berlaku;"
          },
          {
            "id": "dir-q-13",
            "teks": "Melaksanakan penegakan hukum secara tegas dan sesuai ketentuan peraturan perundang-undangan terhadap pelaku kriminal maupun pihak-pihak yang terbukti melakukan keonaran, keributan, penjarahan, atau tindak pidana lainnya yang mengganggu ketenangan masyarakat pada saat kondisi bencana;"
          },
          {
            "id": "dir-q-14",
            "teks": "Melaksanakan manajemen media dan dokumentasi terhadap seluruh kegiatan kesiapsiagaan, mitigasi, evakuasi, pengamanan, serta penanganan bencana sebagai bahan evaluasi dan pelaporan;"
          },
          {
            "id": "dir-q-15",
            "teks": "Memberikan arahan pimpinan pasukan (APP) yang jelas kepada seluruh personel serta memastikan setiap anggota memahami tugas, tanggung jawab, prosedur keselamatan, dan cara bertindak dalam menghadapi situasi darurat;"
          },
          {
            "id": "dir-q-16",
            "teks": "Melaksanakan pelaporan secara cepat, tepat, dan berjenjang terhadap perkembangan situasi bencana, jumlah korban dan pengungsi apabila ada, kerusakan fasilitas, gangguan kamtibmas, serta langkah-langkah penanganan yang telah dilaksanakan;"
          },
          {
            "id": "dir-q-17",
            "teks": "Kapolres/Ta/Tabes jajaran Polda Jawa Tengah bertanggung jawab terhadap kesiapsiagaan, mitigasi, penanganan bencana, serta pemeliharaan situasi kamtibmas di wilayah hukumnya masing-masing"
          }
        ]
      }
    ],
    "penutup": "Demikian petunjuk dan arahan ini disampaikan dan bersifat perintah untuk dipedomani serta dilaksanakan dengan penuh tanggung jawab. Laporkan setiap perkembangan situasi dan hasil pelaksanaan kegiatan kesiapsiagaan, mitigasi, pengamanan, evakuasi, serta penanganan bencana hidrometeorologi kepada Kapolda Jawa Tengah c.q. Karoops Polda Jateng pada kesempatan pertama melalui mekanisme pelaporan yang berlaku, termasuk sarana komunikasi dan sistem pelaporan operasional yang tersedia.",
    "penandaTangan": {
      "atasNama": "a.n.",
      "jabatanUtama": "KEPALA KEPOLISIAN DAERAH JAWA TENGAH",
      "jabatanPenandaTangan": "KAROOPS",
      "nama": "SOELISTIJONO, S.I.K., M.H.",
      "pangkat": "KOMISARIS BESAR POLISI",
      "nrp": "NRP 71040691"
    },
    "tembusan": [
      {
        "id": "tem-1",
        "teks": "Kapolri."
      },
      {
        "id": "tem-2",
        "teks": "Irwasum Polri."
      },
      {
        "id": "tem-3",
        "teks": "Astamaops Kapolri."
      },
      {
        "id": "tem-4",
        "teks": "Kapolda Jateng."
      }
    ]
  },
  {
    "id": "tpl-pam-kegiatan",
    "title": "Template Jukrah Pengamanan Kegiatan Masyarakat / Hari Besar",
    "category": "Operasional",
    "kop": {
      "instansi": "KEPOLISIAN NEGARA REPUBLIK INDONESIA",
      "satuanInduk": "DAERAH JAWA TENGAH",
      "alamat": "Jalan Pahlawan 1, Semarang 50243"
    },
    "identitas": {
      "klasifikasiKode": "B",
      "nomorUrut": "14502",
      "bulanRomawi": "XI",
      "kodeKlasifikasi": "OPS.1.1.",
      "tahun": "2026",
      "satkerPenerbit": "Roops",
      "klasifikasiLabel": "Biasa",
      "lampiran": "-",
      "hal": "petunjuk dan arahan pengamanan kegiatan masyarakat dan libur panjang di Wilkum Polda Jateng",
      "tempat": "Semarang",
      "tanggal": "15 November 2026",
      "headerLanjutanJudul": "SURAT KAPOLDA JATENG"
    },
    "tujuan": {
      "kepada": "DISTRIBUSI A-2, B DAN C POLDA JATENG",
      "tempatTujuan": "Tempat"
    },
    "rujukan": [
      {
        "id": "pam-ruj-1",
        "teks": "Undang-Undang Nomor 2 Tahun 2002 tentang Kepolisian Negara Republik Indonesia sebagaimana telah diubah terakhir dengan Undang-Undang Nomor 5 Tahun 2026;"
      },
      {
        "id": "pam-ruj-2",
        "teks": "Rencana Kerja Polda Jawa Tengah Tahun Anggaran 2026 tentang pemeliharaan keamanan dan ketertiban masyarakat."
      }
    ],
    "latarBelakang": "Sehubungan dengan meningkatnya mobilitas masyarakat dan penyelenggaraan berbagai kegiatan keagamaan, pariwisata, serta pusat perbelanjaan pada periode libur mendatang di wilayah hukum Polda Jawa Tengah, dipandang perlu untuk mengambil langkah-langkah antisipasi guna menjamin kelancaran aktivitas masyarakat, keamanan jalur transportasi, serta kondusivitas situasi kamtibmas secara terpadu.",
    "pembukaDirektif": "Berkaitan dengan hal tersebut, guna menjamin kesiapsiagaan dan keseragaman cara bertindak di lapangan, diperintahkan kepada para pejabat tersebut alamat untuk melaksanakan langkah-langkah sebagai berikut:",
    "direktifList": [
      {
        "id": "pam-a",
        "pejabat": "Kepada Dirintelkam agar:",
        "jenis": "poin",
        "poin": [
          {
            "id": "pam-a-1",
            "teks": "Melaksanakan deteksi dini dan pemetaan potensi kerawanan kamtibmas pada lokasi keramaian, objek wisata, terminal, stasiun, dan pusat perbelanjaan;"
          },
          {
            "id": "pam-a-2",
            "teks": "Menyusun perkiraan intelijen singkat sebagai bahan pertimbangan pimpinan dalam menentukan pola pengamanan dan perkuatan personel."
          }
        ]
      },
      {
        "id": "pam-b",
        "pejabat": "Kepada Dirlantas agar:",
        "jenis": "poin",
        "poin": [
          {
            "id": "pam-b-1",
            "teks": "Menyiapkan rekayasa lalu lintas, pengawalan, dan penempatan personel pada simpul kemacetan serta jalur menuju destinasi wisata;"
          },
          {
            "id": "pam-b-2",
            "teks": "Berkoordinasi dengan Dinas Perhubungan dan pengelola jalan tol terkait penyediaan jalur alternatif dan pos pelayanan terpadu."
          }
        ]
      },
      {
        "id": "pam-c",
        "pejabat": "Kepada Dirsamapta dan Dirpamobvit agar:",
        "jenis": "poin",
        "poin": [
          {
            "id": "pam-c-1",
            "teks": "Meningkatkan patroli dialogis dan pengamanan terbuka pada objek vital, sentra ekonomi, dan lokasi keramaian masyarakat;"
          },
          {
            "id": "pam-c-2",
            "teks": "Menyiagakan unit patroli cepat dan personel BKO apabila terjadi peningkatan eskalasi gangguan keamanan."
          }
        ]
      },
      {
        "id": "pam-d",
        "pejabat": "Kepada Kapolres/Ta/Tabes Polda Jateng agar:",
        "jenis": "poin",
        "poin": [
          {
            "id": "pam-d-1",
            "teks": "Melaksanakan apel kesiapan pasukan dan pengecekan sarana prasarana pendukung pengamanan di wilayah masing-masing;"
          },
          {
            "id": "pam-d-2",
            "teks": "Melaksanakan koordinasi lintas sektoral bersama Pemda, TNI, dan pemangku kepentingan terkait untuk mendirikan pos pengamanan sesuai kebutuhan wilayah;"
          },
          {
            "id": "pam-d-3",
            "teks": "Memberikan arahan pimpinan pasukan (APP) kepada seluruh personel agar bertugas secara humanis, profesional, dan sesuai prosedur."
          }
        ]
      }
    ],
    "penutup": "Demikian petunjuk dan arahan ini disampaikan untuk dipedomani dan dilaksanakan dengan penuh rasa tanggung jawab. Laporkan setiap perkembangan situasi dan hasil pelaksanaan kegiatan kepada Kapolda Jawa Tengah c.q. Karoops Polda Jateng pada kesempatan pertama.",
    "penandaTangan": {
      "atasNama": "a.n.",
      "jabatanUtama": "KEPALA KEPOLISIAN DAERAH JAWA TENGAH",
      "jabatanPenandaTangan": "KAROOPS",
      "nama": "SOELISTIJONO, S.I.K., M.H.",
      "pangkat": "KOMISARIS BESAR POLISI",
      "nrp": "NRP 71040691"
    },
    "tembusan": [
      {
        "id": "pam-tem-1",
        "teks": "Kapolda Jateng."
      },
      {
        "id": "pam-tem-2",
        "teks": "Irwasda Polda Jateng."
      },
      {
        "id": "pam-tem-3",
        "teks": "Karoops Polda Jateng."
      }
    ]
  },
  {
    "id": "tpl-arahan-satwil",
    "title": "Template Surat Biasa Arahan Teknis Polres Jajaran",
    "category": "Kewilayahan",
    "kop": {
      "instansi": "KEPOLISIAN NEGARA REPUBLIK INDONESIA",
      "satuanInduk": "DAERAH JAWA TENGAH\nRESOR KOTA BESAR SEMARANG",
      "alamat": "Jalan Dr. Sutomo No. 19, Semarang 50245"
    },
    "identitas": {
      "klasifikasiKode": "B",
      "nomorUrut": "2140",
      "bulanRomawi": "XI",
      "kodeKlasifikasi": "OPS.2.1.",
      "tahun": "2026",
      "satkerPenerbit": "Bagops",
      "klasifikasiLabel": "Biasa",
      "lampiran": "1 (satu) berkas",
      "hal": "petunjuk teknis peningkatan patroli terpadu dan pelayanan respons cepat di wilayah hukum Polrestabes Semarang",
      "tempat": "Semarang",
      "tanggal": "15 November 2026",
      "headerLanjutanJudul": "SURAT KAPOLRESTABES SEMARANG"
    },
    "tujuan": {
      "kepada": "PARA KAPOLSEK JAJARAN POLRESTABES SEMARANG",
      "tempatTujuan": "Tempat"
    },
    "rujukan": [
      {
        "id": "sw-ruj-1",
        "teks": "Undang-Undang Nomor 2 Tahun 2002 tentang Kepolisian Negara Republik Indonesia;"
      },
      {
        "id": "sw-ruj-2",
        "teks": "Surat Kapolda Jawa Tengah Nomor B/14381/XI/OPS.2.1./2026/Roops tanggal 13 November 2026 tentang petunjuk dan arahan antisipasi serta penanganan gangguan kamtibmas."
      }
    ],
    "latarBelakang": "Dalam rangka menjaga stabilitas keamanan serta meningkatkan kecepatan pelayanan kepolisian kepada masyarakat pada jam-jam rawan di wilayah hukum Polrestabes Semarang, diperlukan optimalisasi kegiatan patroli terpadu, pemantauan wilayah rawan bencana maupun gangguan kamtibmas, serta pelaporan berjenjang yang akurat.",
    "pembukaDirektif": "Sehubungan dengan hal tersebut di atas, diperintahkan kepada para Kapolsek jajaran untuk melaksanakan langkah-langkah teknis sebagai berikut:",
    "direktifList": [
      {
        "id": "sw-a",
        "pejabat": "Melaksanakan pemetaan titik rawan kamtibmas dan rawan genangan pada masing-masing wilayah hukum Polsek secara berkala setiap minggu;",
        "jenis": "paragraf",
        "poin": []
      },
      {
        "id": "sw-b",
        "pejabat": "Menggelar patroli dialogis gabungan fungsi Sabhara, Binmas, dan Bhabinkamtibmas pada jam rawan guna mencegah gangguan ketertiban masyarakat;",
        "jenis": "paragraf",
        "poin": []
      },
      {
        "id": "sw-c",
        "pejabat": "Melaporkan hasil pelaksanaan kegiatan beserta dokumentasi melalui posko Bagops secara tepat waktu.",
        "jenis": "paragraf",
        "poin": []
      }
    ],
    "penutup": "Demikian untuk menjadi maklum dan dilaksanakan dengan penuh tanggung jawab.",
    "penandaTangan": {
      "atasNama": "a.n.",
      "jabatanUtama": "KAPOLRESTABES SEMARANG",
      "jabatanPenandaTangan": "KABAGOPS",
      "nama": "NAMA PEJABAT, S.I.K., M.H.",
      "pangkat": "AJUN KOMISARIS BESAR POLISI",
      "nrp": "NRP 78010234"
    },
    "tembusan": [
      {
        "id": "sw-tem-1",
        "teks": "Kapolrestabes Semarang."
      },
      {
        "id": "sw-tem-2",
        "teks": "Wakapolrestabes Semarang."
      },
      {
        "id": "sw-tem-3",
        "teks": "Kasiwas Polrestabes Semarang."
      }
    ]
  },
  {
    "id": "tpl-kosong",
    "title": "Kerangka Surat Kosong (Sesuai Tata Naskah Dinas)",
    "category": "Kerangka Dasar",
    "kop": {
      "instansi": "KEPOLISIAN NEGARA REPUBLIK INDONESIA",
      "satuanInduk": "DAERAH JAWA TENGAH",
      "alamat": "Jalan Pahlawan 1, Semarang 50243"
    },
    "identitas": {
      "klasifikasiKode": "B",
      "nomorUrut": "...",
      "bulanRomawi": "XI",
      "kodeKlasifikasi": "OPS.2.1.",
      "tahun": "2026",
      "satkerPenerbit": "Roops",
      "klasifikasiLabel": "Biasa",
      "lampiran": "-",
      "hal": "petunjuk dan arahan ...",
      "tempat": "Semarang",
      "tanggal": "15 November 2026",
      "headerLanjutanJudul": "SURAT KAPOLDA JATENG"
    },
    "tujuan": {
      "kepada": "DISTRIBUSI A-2, B DAN C POLDA JATENG",
      "tempatTujuan": "Tempat"
    },
    "rujukan": [
      {
        "id": "kos-ruj-1",
        "teks": "Undang-Undang Nomor 2 Tahun 2002 tentang Kepolisian Negara Republik Indonesia;"
      },
      {
        "id": "kos-ruj-2",
        "teks": "[Tuliskan surat telegram, keputusan, atau dasar hukum rujukan lainnya]."
      }
    ],
    "latarBelakang": "[Tuliskan latar belakang situasi, pertimbangan operasional, atau informasi dasar yang melatarbelakangi diterbitkannya petunjuk dan arahan ini].",
    "pembukaDirektif": "Berkaitan dengan hal tersebut, diperintahkan kepada para pejabat tersebut alamat untuk melaksanakan langkah-langkah sebagai berikut:",
    "direktifList": [
      {
        "id": "kos-a",
        "pejabat": "Kepada [Pejabat / Fungsi Pertama] agar:",
        "jenis": "poin",
        "poin": [
          {
            "id": "kos-a-1",
            "teks": "[Tuliskan instruksi atau langkah kerja pertama secara spesifik dan terukur];"
          },
          {
            "id": "kos-a-2",
            "teks": "[Tuliskan instruksi atau langkah kerja kedua]."
          }
        ]
      }
    ],
    "penutup": "Demikian petunjuk dan arahan ini disampaikan untuk dipedomani dan dilaksanakan dengan penuh tanggung jawab. Laporkan setiap perkembangan situasi kepada pimpinan pada kesempatan pertama.",
    "penandaTangan": {
      "atasNama": "a.n.",
      "jabatanUtama": "KEPALA KEPOLISIAN DAERAH JAWA TENGAH",
      "jabatanPenandaTangan": "KAROOPS",
      "nama": "[NAMA LENGKAP DAN GELAR]",
      "pangkat": "[PANGKAT]",
      "nrp": "NRP [XXXXXXXX]"
    },
    "tembusan": [
      {
        "id": "kos-tem-1",
        "teks": "Kapolda Jateng."
      }
    ]
  }
];
