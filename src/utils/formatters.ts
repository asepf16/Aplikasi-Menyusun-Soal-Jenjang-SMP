import {
  ALL_QUESTION_FORMATS,
  type AssessmentParams,
  type FormatCounts,
  type PlannedQuestionSpec,
  type PureJsonQuestionItem,
  type QuestionItem,
  type SingleQuestionFormat,
} from '../types/assessment';

export function toPureJsonItems(questions: QuestionItem[]): PureJsonQuestionItem[] {
  return questions.map((q) => ({
    nomor_soal: q.nomor_soal,
    tipe_soal: q.tipe_soal,
    level_kognitif: q.level_kognitif,
    konteks: q.konteks,
    stimulus: q.stimulus,
    pertanyaan: q.pertanyaan,
    bentuk_soal: q.bentuk_soal,
    opsi: q.opsi,
    kunci_jawaban: q.kunci_jawaban,
    pembahasan_rubrik: q.pembahasan_rubrik,
  }));
}

export function formatQuestionsAsJson(questions: QuestionItem[]): string {
  return JSON.stringify(toPureJsonItems(questions), null, 2);
}

export function formatQuestionsAsStructuredText(
  questions: QuestionItem[],
  includeAnswers = true
): string {
  return questions
    .map((q) => {
      const opsiBlock =
        q.opsi && q.opsi.length > 0
          ? q.opsi.join('\n')
          : '(Tidak ada opsi — soal isian/uraian terbuka)';

      const answerSection = includeAnswers
        ? `\n\nKunci Jawaban: ${q.kunci_jawaban}\nPembahasan & Rubrik: ${q.pembahasan_rubrik}`
        : '';

      return [
        '---',
        `SOAL NO. ${q.nomor_soal} (${q.tipe_soal} - ${q.level_kognitif} - Konteks: ${q.konteks} - Kesukaran: ${q.tingkat_kesukaran})`,
        `Bentuk Soal: ${q.bentuk_soal}`,
        '',
        'Stimulus:',
        q.stimulus,
        '',
        'Pertanyaan:',
        q.pertanyaan,
        '',
        'Opsi Jawaban / Pernyataan:',
        opsiBlock + answerSection,
        '---',
      ].join('\n');
    })
    .join('\n\n');
}

export function formatKisiKisiAsCsv(
  questions: QuestionItem[],
  params: AssessmentParams
): string {
  const escape = (val: string | number) => {
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const header = [
    'No. Soal',
    'Mata Pelajaran',
    'Kelas/Fase',
    'Tipe Asesmen',
    'Bentuk Soal',
    'Level Kognitif',
    'Konteks',
    'Tingkat Kesukaran',
    'Indikator Soal',
    'Kunci Jawaban',
  ];

  const rows = questions.map((q) => [
    q.nomor_soal,
    params.mataPelajaran,
    `SMP Kelas ${params.kelas} (Fase D)`,
    q.tipe_soal,
    q.bentuk_soal,
    q.level_kognitif,
    q.konteks,
    q.tingkat_kesukaran,
    q.indikator_soal,
    q.kunci_jawaban,
  ]);

  return [header, ...rows].map((row) => row.map(escape).join(',')).join('\n');
}

export function computeProportionalCounts(
  total: number,
  mudahPct: number,
  sedangPct: number,
  sukarPct: number
): { mudah: number; sedang: number; sukar: number } {
  const sum = mudahPct + sedangPct + sukarPct || 100;
  const rawMudah = (total * mudahPct) / sum;
  const rawSedang = (total * sedangPct) / sum;
  const rawSukar = (total * sukarPct) / sum;

  let mudah = Math.floor(rawMudah);
  let sedang = Math.floor(rawSedang);
  let sukar = Math.floor(rawSukar);

  const remainder = total - (mudah + sedang + sukar);
  const fractions = [
    { key: 'mudah' as const, frac: rawMudah - mudah },
    { key: 'sedang' as const, frac: rawSedang - sedang },
    { key: 'sukar' as const, frac: rawSukar - sukar },
  ].sort((a, b) => b.frac - a.frac);

  for (let i = 0; i < remainder; i++) {
    const target = fractions[i % fractions.length].key;
    if (target === 'mudah') mudah++;
    else if (target === 'sedang') sedang++;
    else sukar++;
  }

  return { mudah, sedang, sukar };
}

export function summarizeKomposisi(komposisi: FormatCounts): string {
  const shortLabels: Record<SingleQuestionFormat, string> = {
    'Pilihan Ganda': 'PG',
    'Pilihan Ganda Kompleks': 'PG Kompleks',
    'Isian Singkat': 'Isian Singkat',
    Menjodohkan: 'Menjodohkan',
    'Benar-Salah': 'Benar-Salah',
    Uraian: 'Uraian',
  };

  const parts = ALL_QUESTION_FORMATS.filter((f) => komposisi[f] > 0).map(
    (f) => `${shortLabels[f]} (${komposisi[f]})`
  );
  return parts.length > 0 ? parts.join(', ') : 'Pilihan Ganda';
}

export function getTotalKomposisiCount(komposisi: FormatCounts): number {
  return ALL_QUESTION_FORMATS.reduce(
    (acc, fmt) => acc + Math.max(0, Number(komposisi[fmt]) || 0),
    0
  );
}

export function buildQuestionPlan(
  params: AssessmentParams
): PlannedQuestionSpec[] {
  const formatsList: SingleQuestionFormat[] = [];

  if (params.bentukSoalMode === 'tunggal') {
    const count = Math.min(Math.max(Number(params.jumlahSoal) || 1, 1), 100);
    for (let i = 0; i < count; i++) {
      formatsList.push(params.bentukSoalTunggal);
    }
  } else {
    for (const fmt of ALL_QUESTION_FORMATS) {
      const n = Math.max(0, Math.floor(Number(params.komposisiBentuk[fmt]) || 0));
      for (let i = 0; i < n; i++) {
        if (formatsList.length < 100) {
          formatsList.push(fmt);
        }
      }
    }
  }

  const total = formatsList.length;
  if (total === 0) return [];

  const difficulties: Array<'Mudah' | 'Sedang' | 'Sukar'> = [];
  if (params.tingkatKesukaran === 'Proporsional (Campuran)') {
    const counts = computeProportionalCounts(
      total,
      params.distribusiMudah,
      params.distribusiSedang,
      params.distribusiSukar
    );
    // Distribute difficulties across formats evenly using interleaving
    const pool: Array<'Mudah' | 'Sedang' | 'Sukar'> = [];
    const maxLen = Math.max(counts.mudah, counts.sedang, counts.sukar);
    let m = counts.mudah;
    let se = counts.sedang;
    let su = counts.sukar;
    for (let i = 0; i < maxLen; i++) {
      if (m > 0) {
        pool.push('Mudah');
        m--;
      }
      if (se > 0) {
        pool.push('Sedang');
        se--;
      }
      if (su > 0) {
        pool.push('Sukar');
        su--;
      }
    }
    difficulties.push(...pool);
  } else {
    const fixed = params.tingkatKesukaran;
    for (let i = 0; i < total; i++) {
      difficulties.push(fixed);
    }
  }

  return formatsList.map((bentuk_soal, idx) => ({
    nomor_soal: idx + 1,
    bentuk_soal,
    tingkat_kesukaran: difficulties[idx] ?? 'Sedang',
  }));
}
