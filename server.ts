import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

interface PlannedItemSpec {
  nomor_soal: number;
  bentuk_soal: string;
  tingkat_kesukaran: 'Mudah' | 'Sedang' | 'Sukar';
}

interface GenerateRequestBody {
  mataPelajaran: string;
  kelas: '7' | '8' | '9';
  materi: string;
  tipeAsesmen: 'AKM' | 'HOTS' | 'Kombinasi AKM & HOTS';
  bentukSoal: string;
  jumlahSoal: number;
  tingkatKesukaran: 'Mudah' | 'Sedang' | 'Sukar' | 'Proporsional (Campuran)';
  distribusiMudah: number;
  distribusiSedang: number;
  distribusiSukar: number;
  konteksFokus: 'Campuran Proporsional' | 'Personal' | 'Sosial Budaya' | 'Saintifik';
  itemsPlan?: PlannedItemSpec[];
  previousTopicsSummary?: string[];
}

interface RegenerateItemBody {
  params: GenerateRequestBody;
  existingQuestion: {
    nomor_soal: number;
    tingkat_kesukaran: string;
    bentuk_soal: string;
    pertanyaan: string;
  };
  catatanRevisi?: string;
}

function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY belum dikonfigurasi pada environment server.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function computeDifficultyCounts(
  total: number,
  mudahPct: number,
  sedangPct: number,
  sukarPct: number
) {
  const sum = mudahPct + sedangPct + sukarPct || 100;
  const rawM = (total * mudahPct) / sum;
  const rawSe = (total * sedangPct) / sum;
  const rawSu = (total * sukarPct) / sum;

  let m = Math.floor(rawM);
  let se = Math.floor(rawSe);
  let su = Math.floor(rawSu);
  const rem = total - (m + se + su);

  const fracs = [
    { key: 'm', val: rawM - m },
    { key: 'se', val: rawSe - se },
    { key: 'su', val: rawSu - su },
  ].sort((a, b) => b.val - a.val);

  for (let i = 0; i < rem; i++) {
    const k = fracs[i % 3].key;
    if (k === 'm') m++;
    else if (k === 'se') se++;
    else su++;
  }
  return { mudah: m, sedang: se, sukar: su };
}

const PEDAGOGICAL_SYSTEM_INSTRUCTION = `Kamu adalah Ahli Pengembang Asesmen Pendidikan dan Penulis Soal Profesional Kurikulum Merdeka jenjang SMP (Fase D) di Indonesia.

Tugasmu adalah menyusun soal Asesmen Sumatif yang valid secara kurikuler, komunikatif, sesuai kaidah bahasa Indonesia baku (EYD V), bebas dari bias gender/SARA/komersial, serta dilengkapi stimulus kontekstual, indikator soal, kunci jawaban akurat, dan pembahasan/rubrik penskoran yang terperinci.

ATURAN WAJIB BERDASARKAN TIPE ASESMEN:
1. JIKA TIPE ASESMEN = "AKM":
   - Sajikan stimulus berupa teks narasi informatif, data numerik, tabel Markdown rapi, laporan pengamatan, atau ilustrasi situasi nyata yang relevan dengan konteks: Personal, Sosial Budaya, atau Saintifik.
   - Distribusikan level kognitif sesuai kerangka AKM: Pemahaman (Knowing / L1), Penerapan (Applying / L2), dan Penalaran (Reasoning / L3).
   - Ukur literasi membaca atau numerasi (pemrosesan data, pemodelan, interpretasi grafik/tabel, dan penarikan simpulan).
2. JIKA TIPE ASESMEN = "HOTS":
   - WAJIB menggunakan level kognitif tinggi: C4 (Menganalisis), C5 (Mengevaluasi), atau C6 (Mengkreasi).
   - Sajikan stimulus kontekstual yang baru, otentik, dan menantang (studi kasus lingkungan, teknologi, masalah keseharian siswa SMP, atau fenomena sosial).
   - Soal harus menuntut transfer konsep, pemecahan masalah (problem solving), penalaran kritis, dan pengambilan keputusan — BUKAN hafalan atau ingatan (recall).
   - Jawaban benar TIDAK boleh tersurat secara eksplisit di dalam teks stimulus.
3. JIKA TIPE ASESMEN = "Kombinasi AKM & HOTS":
   - Integrasikan stimulus kaya data berbasis AKM (tabel/narasi/skenario nyata) dengan pertanyaan penalaran tingkat tinggi (C4–C6 / Reasoning) yang meminta siswa mengolah informasi stimulus untuk mengevaluasi atau mengambil keputusan logis.

ATURAN WAJIB TINGKAT KESUKARAN:
1. "Mudah":
   - Stimulus singkat, langsung, dan memakai situasi keseharian yang sangat familier bagi siswa SMP.
   - Penyelesaian cukup 1–2 langkah penalaran atau perhitungan sederhana.
   - Pengecoh (distractor) jelas perbedaannya dari kunci jawaban sehingga mudah dibedakan.
2. "Sedang":
   - Stimulus menyajikan data/tabel tunggal yang membutuhkan pembacaan cermat.
   - Penyelesaian membutuhkan 2–3 langkah analisis (menghubungkan 2 informasi berbeda dari stimulus).
   - Pengecoh homogen dan realistis, tetapi tetap dapat dibedakan bila menguasai konsep.
3. "Sukar":
   - Stimulus menyajikan multi-data/tabel pembanding/skenario kompleks dengan informasi tersirat atau masalah non-rutin.
   - Penyelesaian menuntut penalaran multi-tahap (transfer konsep, evaluasi strategi alternatif, atau keputusan berdasar kriteria).
   - Pengecoh sangat halus dan dirancang berdasarkan miskonsepsi atau kekeliruan logika umum siswa SMP.

ATURAN PENULISAN BERDASARKAN BENTUK SOAL (WAJIB DIPATUHI):
1. "Pilihan Ganda":
   - Sediakan tepat 4 opsi di array \`opsi\`: ["A. ...", "B. ...", "C. ...", "D. ..."] dengan panjang kalimat homogen dan pengecoh logis (1 jawaban benar).
   - \`kunci_jawaban\`: tulis huruf opsi benar, misal "B".
2. "Pilihan Ganda Kompleks":
   - Soal meminta siswa memilih LEBIH DARI SATU jawaban yang benar (berikan keterangan "(Pilih lebih dari satu jawaban benar)" di akhir pertanyaan jika relevan).
   - Sediakan 4 atau 5 opsi di array \`opsi\`: ["A. ...", "B. ...", "C. ...", "D. ...", "E. ..."] dengan tepat 2 atau 3 jawaban benar.
   - \`kunci_jawaban\`: tuliskan huruf-huruf jawaban benar dipisah koma, misal "A, C, D".
3. "Benar-Salah":
   - Sediakan 3 atau 4 pernyataan terkait stimulus di array \`opsi\` dengan format: ["Pernyataan 1: ...", "Pernyataan 2: ...", "Pernyataan 3: ..."].
   - \`kunci_jawaban\`: tuliskan urutan status tiap pernyataan secara tegas, misal "1. Benar, 2. Salah, 3. Benar".
4. "Menjodohkan":
   - Sajikan 3 atau 4 premis/pernyataan di kolom kiri dan 4 atau 5 pilihan pasangan di kolom kanan (boleh ada 1 pengecoh di kolom kanan).
   - Pada array \`opsi\`, tuliskan berurutan dengan prefiks persis seperti ini:
     ["Premis 1: ...", "Premis 2: ...", "Premis 3: ...", "Pasangan A: ...", "Pasangan B: ...", "Pasangan C: ...", "Pasangan D: ..."]
   - \`kunci_jawaban\`: tuliskan pasangan yang tepat, misal "1-B, 2-D, 3-A".
5. "Isian Singkat":
   - Array \`opsi\` wajib kosong (\`[]\`).
   - Pertanyaan menuntut jawaban berupa bilangan, kata, atau frasa singkat yang pasti.
   - \`kunci_jawaban\`: jawaban singkat yang pasti dan tidak ambigu.
6. "Uraian":
   - Array \`opsi\` wajib kosong (\`[]\`).
   - \`kunci_jawaban\`: inti jawaban lengkap yang diharapkan.
   - \`pembahasan_rubrik\`: wajib memuat pedoman penskoran (skor maksimal dan rincian perolehan skor per langkah penyelesaian).

ATURAN TAMBAHAN:
- Jika terdapat data berbentuk tabel di stimulus, formatkan menggunakan tabel Markdown standar (| Kolom 1 | Kolom 2 |).
- Verifikasi ulang setiap perhitungan matematika/sains sebelum menuliskan \`kunci_jawaban\` agar 100% konsisten.`;

const QUESTION_LIST_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      nomor_soal: { type: Type.INTEGER },
      tipe_soal: {
        type: Type.STRING,
        description: 'AKM, HOTS, atau Kombinasi AKM & HOTS',
      },
      level_kognitif: {
        type: Type.STRING,
        description:
          'Contoh: C4 (Menganalisis), C5 (Mengevaluasi), Penerapan (Applying), Penalaran (Reasoning)',
      },
      tingkat_kesukaran: {
        type: Type.STRING,
        description: 'Harus tepat salah satu dari: Mudah, Sedang, Sukar',
      },
      konteks: {
        type: Type.STRING,
        description: 'Harus tepat salah satu dari: Personal, Sosial Budaya, Saintifik',
      },
      indikator_soal: {
        type: Type.STRING,
        description:
          'Rumusan indikator soal singkat berbasis ABCD untuk kisi-kisi asesmen',
      },
      stimulus: {
        type: Type.STRING,
        description:
          'Teks pengantar kontekstual, narasi, studi kasus, atau tabel Markdown data yang utuh dan informatif',
      },
      pertanyaan: {
        type: Type.STRING,
        description: 'Rumusan pokok soal yang jelas dan tegas',
      },
      bentuk_soal: {
        type: Type.STRING,
        description:
          'Harus tepat sesuai bentuk soal yang diminta: Pilihan Ganda, Pilihan Ganda Kompleks, Isian Singkat, Menjodohkan, Benar-Salah, atau Uraian',
      },
      opsi: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description:
          'PG: 4 item A-D. PG Kompleks: 4-5 item A-E. Benar-Salah: 3-4 item "Pernyataan 1: ...". Menjodohkan: "Premis 1: ..." lalu "Pasangan A: ...". Isian Singkat / Uraian: []',
      },
      kunci_jawaban: {
        type: Type.STRING,
        description: 'Kunci jawaban yang tepat sesuai bentuk soal',
      },
      pembahasan_rubrik: {
        type: Type.STRING,
        description:
          'Penjelasan langkah nalar penyelesaian, alasan opsi salah, atau rubrik penskoran bertingkat',
      },
    },
    required: [
      'nomor_soal',
      'tipe_soal',
      'level_kognitif',
      'tingkat_kesukaran',
      'konteks',
      'indikator_soal',
      'stimulus',
      'pertanyaan',
      'bentuk_soal',
      'opsi',
      'kunci_jawaban',
      'pembahasan_rubrik',
    ],
  },
};

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        const delayMs = 800 * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '4mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  app.post('/api/assessments/generate', async (req: Request, res: Response) => {
    try {
      const body = req.body as GenerateRequestBody;
      if (!body.mataPelajaran?.trim() || !body.materi?.trim()) {
        res.status(400).json({
          error: 'Mata pelajaran dan lingkup materi/CP/TP wajib diisi.',
        });
        return;
      }

      const hasExplicitPlan =
        Array.isArray(body.itemsPlan) && body.itemsPlan.length > 0;
      const itemsPlan = hasExplicitPlan
        ? body.itemsPlan!.slice(0, 15)
        : undefined;

      const jumlah = itemsPlan
        ? itemsPlan.length
        : Math.min(Math.max(Number(body.jumlahSoal) || 5, 1), 15);

      const contextDirective =
        body.konteksFokus === 'Campuran Proporsional'
          ? 'Variasikan konteks stimulus secara seimbang antara Personal, Sosial Budaya, dan Saintifik sesuai karakter mata pelajaran.'
          : `Fokuskan konteks stimulus pada ranah "${body.konteksFokus}" (dengan tetap relevan terhadap kehidupan siswa SMP).`;

      let planBlock = '';
      if (itemsPlan) {
        const lines = itemsPlan.map(
          (item) =>
            `- Nomor ${item.nomor_soal}: Bentuk Soal = "${item.bentuk_soal}", Tingkat Kesukaran = "${item.tingkat_kesukaran}"`
        );
        planBlock = `SPESIFIKASI WAJIB PER NOMOR SOAL (${itemsPlan.length} butir dalam batch ini):\n${lines.join('\n')}`;
      } else {
        let difficultyDirective = `Semua soal (${jumlah} butir) menggunakan tingkat kesukaran: "${body.tingkatKesukaran}".`;
        if (body.tingkatKesukaran === 'Proporsional (Campuran)') {
          const counts = computeDifficultyCounts(
            jumlah,
            Number(body.distribusiMudah) || 30,
            Number(body.distribusiSedang) || 50,
            Number(body.distribusiSukar) || 20
          );
          difficultyDirective = `Distribusi Tingkat Kesukaran WAJIB tepat berjumlah: ${counts.mudah} soal Mudah, ${counts.sedang} soal Sedang, dan ${counts.sukar} soal Sukar (total ${jumlah} soal).`;
        }
        planBlock = `- Bentuk Soal: ${body.bentukSoal}\n- Jumlah Soal: ${jumlah}\n- ${difficultyDirective}`;
      }

      const antiDuplicateBlock =
        Array.isArray(body.previousTopicsSummary) &&
        body.previousTopicsSummary.length > 0
          ? `\nHINDARI PENGULANGAN STIMULUS/KASUS: Pada batch sebelumnya sudah digunakan skenario berikut, maka buatlah stimulus dan sudut pandang kasus yang BARU dan BERBEDA:\n${body.previousTopicsSummary
              .slice(-15)
              .map((s) => `- ${s}`)
              .join('\n')}`
          : '';

      const userPrompt = `Susunlah ${jumlah} butir soal Asesmen Sumatif Kurikulum Merdeka dengan parameter berikut:
- Mata Pelajaran: ${body.mataPelajaran}
- Kelas / Fase: SMP Kelas ${body.kelas} (Fase D)
- Lingkup Materi / CP / TP: ${body.materi}
- Tipe Asesmen: ${body.tipeAsesmen}
- ${contextDirective}

${planBlock}
${antiDuplicateBlock}

Pastikan setiap butir soal memenuhi aturan bentuk soal masing-masing (PG, PG Kompleks, Isian Singkat, Menjodohkan, Benar-Salah, atau Uraian), memiliki nomor_soal tepat sesuai daftar di atas, stimulus otentik, indikator soal akurat, kunci jawaban terverifikasi, serta pembahasan/rubrik yang jelas.`;

      const ai = getAiClient();
      const response = await withRetry(() =>
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: userPrompt,
          config: {
            systemInstruction: PEDAGOGICAL_SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            responseSchema: QUESTION_LIST_SCHEMA,
            thinkingConfig: {
              thinkingLevel: ThinkingLevel.MEDIUM,
            },
          },
        })
      );

      const rawText = (response.text ?? '[]').trim();
      const questions = JSON.parse(rawText);

      if (!Array.isArray(questions) || questions.length === 0) {
        res.status(502).json({
          error: 'Model tidak menghasilkan butir soal yang valid. Silakan coba lagi.',
        });
        return;
      }

      // Normalize nomor_soal and requested bentuk_soal/tingkat_kesukaran alignment
      if (itemsPlan) {
        for (let i = 0; i < questions.length; i++) {
          if (itemsPlan[i]) {
            questions[i].nomor_soal = itemsPlan[i].nomor_soal;
            questions[i].bentuk_soal = itemsPlan[i].bentuk_soal;
            questions[i].tingkat_kesukaran = itemsPlan[i].tingkat_kesukaran;
          }
        }
      }

      res.json({ questions });
    } catch (error: unknown) {
      const err = error as { status?: number; message?: string };
      console.error('Error generating assessment:', err);
      const status =
        err?.status && err.status >= 400 && err.status < 600 ? err.status : 500;
      res.status(status).json({
        error:
          err?.message ||
          'Terjadi kendala saat menyusun asesmen. Pastikan koneksi dan konfigurasi API tersedia.',
      });
    }
  });

  app.post('/api/assessments/regenerate-item', async (req: Request, res: Response) => {
    try {
      const body = req.body as RegenerateItemBody;
      const { params, existingQuestion, catatanRevisi } = body;

      if (!params || !existingQuestion) {
        res.status(400).json({ error: 'Data soal yang akan disusun ulang tidak lengkap.' });
        return;
      }

      const userPrompt = `Susun ulang TEPAT 1 butir soal pengganti (dalam bentuk array JSON berisi 1 objek) untuk nomor soal ${existingQuestion.nomor_soal} dengan parameter:
- Mata Pelajaran: ${params.mataPelajaran}
- Kelas / Fase: SMP Kelas ${params.kelas} (Fase D)
- Lingkup Materi / CP / TP: ${params.materi}
- Tipe Asesmen: ${params.tipeAsesmen}
- Bentuk Soal yang diminta: ${existingQuestion.bentuk_soal}
- Tingkat Kesukaran yang diminta: ${existingQuestion.tingkat_kesukaran}
- Buat stimulus dan pertanyaan yang BERBEDA sama sekali dari soal sebelumnya ("${existingQuestion.pertanyaan.slice(0, 120)}...").
${catatanRevisi ? `- Catatan perbaikan khusus dari guru: ${catatanRevisi}` : ''}`;

      const ai = getAiClient();
      const response = await withRetry(() =>
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: userPrompt,
          config: {
            systemInstruction: PEDAGOGICAL_SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            responseSchema: QUESTION_LIST_SCHEMA,
            thinkingConfig: {
              thinkingLevel: ThinkingLevel.MEDIUM,
            },
          },
        })
      );

      const rawText = (response.text ?? '[]').trim();
      const parsed = JSON.parse(rawText);
      const item = Array.isArray(parsed) ? parsed[0] : parsed;

      if (!item) {
        res.status(502).json({ error: 'Gagal menyusun ulang butir soal.' });
        return;
      }

      item.nomor_soal = existingQuestion.nomor_soal;
      item.bentuk_soal = existingQuestion.bentuk_soal;
      res.json({ question: item });
    } catch (error: unknown) {
      const err = error as { status?: number; message?: string };
      console.error('Error regenerating item:', err);
      res.status(500).json({
        error: err?.message || 'Gagal menyusun ulang butir soal.',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('/{*splat}', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server berjalan pada http://0.0.0.0:${PORT}`);
  });
}

startServer();
