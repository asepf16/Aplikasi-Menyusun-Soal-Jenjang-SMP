export type AssessmentType = 'AKM' | 'HOTS' | 'Kombinasi AKM & HOTS';

export type SingleQuestionFormat =
  | 'Pilihan Ganda'
  | 'Pilihan Ganda Kompleks'
  | 'Isian Singkat'
  | 'Menjodohkan'
  | 'Benar-Salah'
  | 'Uraian';

export type QuestionFormatMode = 'tunggal' | 'komposisi';

export type FormatCounts = Record<SingleQuestionFormat, number>;

export const ALL_QUESTION_FORMATS: SingleQuestionFormat[] = [
  'Pilihan Ganda',
  'Pilihan Ganda Kompleks',
  'Isian Singkat',
  'Menjodohkan',
  'Benar-Salah',
  'Uraian',
];

export type DifficultyLevel =
  | 'Mudah'
  | 'Sedang'
  | 'Sukar'
  | 'Proporsional (Campuran)';

export type StimulusContext =
  | 'Campuran Proporsional'
  | 'Personal'
  | 'Sosial Budaya'
  | 'Saintifik';

export type OutputViewFormat = 'Kartu Soal' | 'Teks Terstruktur' | 'JSON';

export type ActiveNavSection = 'penyusun' | 'kisi-kisi' | 'arsip' | 'panduan';

export interface AssessmentParams {
  mataPelajaran: string;
  kelas: '7' | '8' | '9';
  materi: string;
  tipeAsesmen: AssessmentType;
  bentukSoalMode: QuestionFormatMode;
  bentukSoalTunggal: SingleQuestionFormat;
  komposisiBentuk: FormatCounts;
  bentukSoal: string;
  jumlahSoal: number;
  tingkatKesukaran: DifficultyLevel;
  distribusiMudah: number;
  distribusiSedang: number;
  distribusiSukar: number;
  konteksFokus: StimulusContext;
  namaSekolah: string;
  alokasiWaktu: string;
}

export interface PlannedQuestionSpec {
  nomor_soal: number;
  bentuk_soal: SingleQuestionFormat;
  tingkat_kesukaran: 'Mudah' | 'Sedang' | 'Sukar';
}

export interface QuestionItem {
  nomor_soal: number;
  tipe_soal: string;
  level_kognitif: string;
  tingkat_kesukaran: 'Mudah' | 'Sedang' | 'Sukar';
  konteks: string;
  indikator_soal: string;
  stimulus: string;
  pertanyaan: string;
  bentuk_soal: string;
  opsi: string[];
  kunci_jawaban: string;
  pembahasan_rubrik: string;
}

export interface PureJsonQuestionItem {
  nomor_soal: number;
  tipe_soal: string;
  level_kognitif: string;
  konteks: string;
  stimulus: string;
  pertanyaan: string;
  bentuk_soal: string;
  opsi: string[];
  kunci_jawaban: string;
  pembahasan_rubrik: string;
}

export interface SavedAssessmentPackage {
  id: string;
  createdAt: string;
  params: AssessmentParams;
  questions: QuestionItem[];
}

export interface SubjectPreset {
  subject: string;
  topicsByGrade: Record<'7' | '8' | '9', string[]>;
}

export const SUBJECT_PRESETS: SubjectPreset[] = [
  {
    subject: 'Matematika',
    topicsByGrade: {
      '7': [
        'Rasio, Perbandingan Senilai & Berbalik Nilai dalam Kehidupan Sehari-hari',
        'Aritmetika Sosial: Diskon, Pajak, Bunga Tunggal, dan Bruto-Neto-Tara',
        'Bangun Datar & Pengolahan Data (Diagram Batang, Lingkaran, Garis)',
      ],
      '8': [
        'Sistem Persamaan Linear Dua Variabel (SPLDV) pada Pemecahan Masalah Kontekstual',
        'Teorema Pythagoras & Aplikasinya dalam Pengukuran Jarak',
        'Statistika: Ukuran Pemusatan Data (Mean, Median, Modus) dan Penyebaran Data',
      ],
      '9': [
        'Bangun Ruang Sisi Lengkung (Tabung, Kerucut, Bola) & Estimasi Volume',
        'Kesebangunan dan Kekongruenan Bangun Datar dalam Pemetaan',
        'Peluang Empirik & Teoretik dalam Pengambilan Keputusan',
      ],
    },
  },
  {
    subject: 'IPA',
    topicsByGrade: {
      '7': [
        'Klasifikasi Makhluk Hidup & Interaksi Ekosistem serta Pelestarian Lingkungan',
        'Suhu, Kalor, dan Pemuaian dalam Teknologi Ramah Lingkungan',
        'Zat dan Perubahannya: Perubahan Fisika, Kimia, dan Pengolahan Limbah',
      ],
      '8': [
        'Usaha, Energi, dan Pesawat Sederhana dalam Aktivitas Manusia',
        'Sistem Pencernaan & Sistem Peredaran Darah Manusia serta Pola Hidup Sehat',
        'Getaran, Gelombang, dan Cahaya pada Alat Optik',
      ],
      '9': [
        'Listrik Dinamis, Rangkaian Listrik Rumah Tangga, dan Efisiensi Energi',
        'Pewarisan Sifat (Genetika) dan Bioteknologi Pangan Berkelanjutan',
        'Tekanan Zat dan Aplikasinya pada Sistem Transportasi Tumbuhan & Hidrolika',
      ],
    },
  },
  {
    subject: 'Bahasa Indonesia',
    topicsByGrade: {
      '7': [
        'Teks Deskripsi & Teks Prosedur: Menelaah Struktur, Kebahasaan, dan Infografik',
        'Teks Berita: Mengidentifikasi Informasi Akurat dan Membedakan Fakta-Opini',
      ],
      '8': [
        'Teks Eksplanasi Fenomena Alam/Sosial & Evaluasi Bukti Pendukung',
        'Teks Iklan, Slogan, dan Poster: Menganalisis Pesan Persuasif dan Bias Media',
      ],
      '9': [
        'Teks Tanggapan Kritis & Teks Diskusi: Mengevaluasi Argumen Pro dan Kontra',
        'Teks Laporan Percobaan & Literasi Informasi Sains Populer',
      ],
    },
  },
  {
    subject: 'IPS',
    topicsByGrade: {
      '7': [
        'Kelangkaan Sumber Daya, Kebutuhan Manusia, dan Kegiatan Ekonomi Berkelanjutan',
        'Interaksi Sosial, Lembaga Sosial, dan Dinamika Lingkungan Sekitar',
      ],
      '8': [
        'Mobilitas Sosial, Pluralitas Masyarakat Indonesia, dan Konflik-Integrasi',
        'Perdagangan Antarpulau, Ekonomi Maritim, dan Penguatan Agrikultur',
      ],
      '9': [
        'Globalisasi, Perubahan Sosial Budaya, dan Ketahanan Ekonomi Digital',
        'Perdagangan Internasional, Pasar Bebas, dan Daya Saing UMKM Indonesia',
      ],
    },
  },
  {
    subject: 'PAI & Budi Pekerti',
    topicsByGrade: {
      '7': [
        'Meneladani Al-Asmaul Husna dan Jujur, Amanah, serta Istiqamah dalam Pergaulan Digital',
        'Thaharah, Salat Berjamaah, dan Pembentukan Disiplin Sosial Remaja',
      ],
      '8': [
        'Kepedulian Sosial melalui Zakat, Infak, Sedekah, dan Etika Bermedia Sosial',
        'Menghindari Minuman Keras, Judi, dan Pertengkaran sesuai Dalil Naqli & Aqli',
      ],
      '9': [
        'Etika Muamalah Jual Beli, Utang Piutang, dan Anti-Riba di Era Transaksi Digital',
        'Toleransi, Kerukunan Umat Beragama, dan Pelestarian Alam sebagai Amanah Khalifah',
      ],
    },
  },
  {
    subject: 'Informatika',
    topicsByGrade: {
      '7': [
        'Berpikir Komputasional: Dekomposisi, Pengenalan Pola, dan Algoritma Sehari-hari',
        'Dampak Sosial Informatika, Etika Digital, dan Keamanan Data Pribadi',
      ],
      '8': [
        'Analisis Data Spreadsheet: Fungsi Logika, Agregasi, dan Visualisasi Grafik',
        'Jaringan Komputer, Enkripsi Sederhana, dan Perlindungan Keamanan Siber',
      ],
      '9': [
        'Integrasi Algoritma Percabangan & Perulangan untuk Pemodelan Masalah Nyata',
        'Literasi Informasi Digital, Verifikasi Hoaks, dan Rekam Jejak Digital',
      ],
    },
  },
];
